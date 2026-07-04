#include <node_api.h>
#import <Foundation/Foundation.h>
#import <ScreenCaptureKit/ScreenCaptureKit.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreAudio/CoreAudio.h>
#import <AudioToolbox/AudioToolbox.h>
#include <vector>
#include <string>
#include <mutex>
#include <deque>
#include <algorithm>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"


// Structures for query results
struct SharedDisplay {
    uint32_t id;
    std::string name;
    int width;
    int height;
};

struct SharedWindow {
    uint32_t id;
    std::string title;
    std::string appName;
    int width;
    int height;
};

struct ShareableContentResult {
    std::vector<SharedDisplay> displays;
    std::vector<SharedWindow> windows;
};

// Global thread-safe callback function
static napi_threadsafe_function g_tsfn = nullptr;

// Global audio buffer state
static std::mutex g_audio_mutex;
static std::deque<float> g_left_ring;
static std::deque<float> g_right_ring;

// Stream state
static SCStream *g_stream = nil;
static dispatch_queue_t g_queue = nil;

// Stream Delegate interfaces
@interface AudioStreamOutputDelegate : NSObject <SCStreamOutput>
@end

@interface AudioStreamDelegate : NSObject <SCStreamDelegate>
@end

static AudioStreamOutputDelegate *g_output_delegate = nil;
static AudioStreamDelegate *g_stream_delegate = nil;

@implementation AudioStreamOutputDelegate
- (void)stream:(SCStream *)stream didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer ofType:(SCStreamOutputType)type {
    if (type != SCStreamOutputTypeAudio) return;
    
    CMBlockBufferRef blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer);
    if (!blockBuffer) return;
    
    AudioBufferList audioBufferList;
    CMBlockBufferRef blockBufferOut = nullptr;
    
    OSStatus status = CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
        sampleBuffer,
        nullptr,
        &audioBufferList,
        sizeof(audioBufferList),
        nullptr,
        nullptr,
        kCMSampleBufferFlag_AudioBufferList_Assure16ByteAlignment,
        &blockBufferOut
    );
    
    if (status != noErr) {
        if (blockBufferOut) CFRelease(blockBufferOut);
        return;
    }
    
    std::lock_guard<std::mutex> lock(g_audio_mutex);
    
    int numBuffers = audioBufferList.mNumberBuffers;
    if (numBuffers == 1) {
        // Interleaved Float32 stereo samples
        float *samples = (float *)audioBufferList.mBuffers[0].mData;
        int sampleCount = audioBufferList.mBuffers[0].mDataByteSize / sizeof(float);
        int frameCount = sampleCount / 2;
        
        for (int i = 0; i < frameCount; ++i) {
            g_left_ring.push_back(samples[i * 2]);
            g_right_ring.push_back(samples[i * 2 + 1]);
        }
    } else if (numBuffers >= 2) {
        // Planar Float32 stereo samples
        float *leftSamples = (float *)audioBufferList.mBuffers[0].mData;
        float *rightSamples = (float *)audioBufferList.mBuffers[1].mData;
        int frameCount = audioBufferList.mBuffers[0].mDataByteSize / sizeof(float);
        
        for (int i = 0; i < frameCount; ++i) {
            g_left_ring.push_back(leftSamples[i]);
            g_right_ring.push_back(rightSamples[i]);
        }
    }
    
    // Bound the circular buffer length (max 96000 samples = ~2 seconds of audio buffer)
    size_t maxSamples = 96000;
    while (g_left_ring.size() > maxSamples) {
        g_left_ring.pop_front();
        g_right_ring.pop_front();
    }
    
    if (blockBufferOut) {
        CFRelease(blockBufferOut);
    }
    
    // Notify JS callback thread-safely
    if (g_tsfn) {
        napi_call_threadsafe_function(g_tsfn, nullptr, napi_tsfn_blocking);
    }
}
@end

@implementation AudioStreamDelegate
- (void)stream:(SCStream *)stream didStopWithError:(NSError *)error {
    NSLog(@"[ScreenCaptureKitAudio] Stream stopped with error: %@", error);
}
@end

// Helper to cleanup active stream
static void CleanUpStream() {
    if (g_stream) {
        [g_stream stopCaptureWithCompletionHandler:^(NSError * _Nullable error) {
            if (error) {
                NSLog(@"[ScreenCaptureKitAudio] Error stopping stream: %@", error);
            }
        }];
        g_stream = nil;
    }
    g_output_delegate = nil;
    g_stream_delegate = nil;
    g_queue = nil;
    
    if (g_tsfn) {
        napi_release_threadsafe_function(g_tsfn, napi_tsfn_abort);
        g_tsfn = nullptr;
    }
    
    {
        std::lock_guard<std::mutex> lock(g_audio_mutex);
        g_left_ring.clear();
        g_right_ring.clear();
    }
}

// N-API: getShareableContent callback marshaller
static void HandleShareableContentCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    ShareableContentResult *result = static_cast<ShareableContentResult *>(data);
    
    napi_value resultObj;
    napi_create_object(env, &resultObj);
    
    napi_value displaysArr;
    napi_create_array(env, &displaysArr);
    for (size_t i = 0; i < result->displays.size(); ++i) {
        const auto &d = result->displays[i];
        napi_value obj;
        napi_create_object(env, &obj);
        
        napi_value valId, valName, valWidth, valHeight;
        napi_create_uint32(env, d.id, &valId);
        napi_create_string_utf8(env, d.name.c_str(), NAPI_AUTO_LENGTH, &valName);
        napi_create_int32(env, d.width, &valWidth);
        napi_create_int32(env, d.height, &valHeight);
        
        napi_set_named_property(env, obj, "id", valId);
        napi_set_named_property(env, obj, "name", valName);
        napi_set_named_property(env, obj, "width", valWidth);
        napi_set_named_property(env, obj, "height", valHeight);
        
        napi_set_element(env, displaysArr, i, obj);
    }
    
    napi_value windowsArr;
    napi_create_array(env, &windowsArr);
    for (size_t i = 0; i < result->windows.size(); ++i) {
        const auto &w = result->windows[i];
        napi_value obj;
        napi_create_object(env, &obj);
        
        napi_value valId, valTitle, valAppName, valWidth, valHeight;
        napi_create_uint32(env, w.id, &valId);
        napi_create_string_utf8(env, w.title.c_str(), NAPI_AUTO_LENGTH, &valTitle);
        napi_create_string_utf8(env, w.appName.c_str(), NAPI_AUTO_LENGTH, &valAppName);
        napi_create_int32(env, w.width, &valWidth);
        napi_create_int32(env, w.height, &valHeight);
        
        napi_set_named_property(env, obj, "id", valId);
        napi_set_named_property(env, obj, "title", valTitle);
        napi_set_named_property(env, obj, "appName", valAppName);
        napi_set_named_property(env, obj, "width", valWidth);
        napi_set_named_property(env, obj, "height", valHeight);
        
        napi_set_element(env, windowsArr, i, obj);
    }
    
    napi_set_named_property(env, resultObj, "displays", displaysArr);
    napi_set_named_property(env, resultObj, "windows", windowsArr);
    
    napi_value global;
    napi_get_global(env, &global);
    
    napi_value retVal;
    napi_value args[2] = { nullptr };
    napi_get_null(env, &args[0]);
    args[1] = resultObj;
    
    napi_call_function(env, global, js_cb, 2, args, &retVal);
    
    delete result;
}

// N-API: getShareableContent(callback)
napi_value GetShareableContent(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = { nullptr };
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }
    
    napi_value resource_name;
    napi_create_string_utf8(env, "AudioShareableContentQuery", NAPI_AUTO_LENGTH, &resource_name);
    
    __block napi_threadsafe_function tsfn = nullptr;
    napi_create_threadsafe_function(
        env,
        args[0],
        nullptr,
        resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        HandleShareableContentCallback,
        &tsfn
    );
    
    [SCShareableContent getShareableContentExcludingDesktopWindows:YES
                                               onScreenWindowsOnly:YES
                                                 completionHandler:^(SCShareableContent * _Nullable content, NSError * _Nullable error) {
        ShareableContentResult *result = new ShareableContentResult();
        if (!error && content) {
            for (SCDisplay *display in content.displays) {
                SharedDisplay d;
                d.id = display.displayID;
                d.name = "System Audio (" + std::to_string(display.displayID) + ")";
                d.width = (int)display.width;
                d.height = (int)display.height;
                result->displays.push_back(d);
            }
            
            for (SCWindow *window in content.windows) {
                if (window.windowLayer != 0) continue;
                if (window.title.length == 0) continue;
                if (window.frame.size.width <= 10 || window.frame.size.height <= 10) continue;
                
                SharedWindow w;
                w.id = window.windowID;
                w.title = [window.title UTF8String] ? [window.title UTF8String] : "";
                w.appName = [window.owningApplication.applicationName UTF8String] ? [window.owningApplication.applicationName UTF8String] : "";
                w.width = (int)window.frame.size.width;
                w.height = (int)window.frame.size.height;
                result->windows.push_back(w);
            }
        }
        
        napi_call_threadsafe_function(tsfn, result, napi_tsfn_blocking);
        napi_release_threadsafe_function(tsfn, napi_tsfn_release);
    }];
    
    return nullptr;
}

// Thread-safe update notifier callback
static void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    napi_value global;
    napi_get_global(env, &global);
    
    napi_value resultVal;
    napi_call_function(env, global, js_cb, 0, nullptr, &resultVal);
}

// N-API: startCapture(options, callback)
napi_value StartCapture(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = { nullptr };
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Arguments must be (options, callback)");
        return nullptr;
    }
    
    // Parse options
    napi_value valType, valId;
    napi_get_named_property(env, args[0], "type", &valType);
    napi_get_named_property(env, args[0], "id", &valId);
    
    size_t typeLen = 0;
    napi_get_value_string_utf8(env, valType, nullptr, 0, &typeLen);
    std::string typeStr(typeLen, '\0');
    napi_get_value_string_utf8(env, valType, &typeStr[0], typeLen + 1, &typeLen);
    
    uint32_t sourceId = 0;
    napi_get_value_uint32(env, valId, &sourceId);
    
    CleanUpStream();
    
    napi_value resource_name;
    napi_create_string_utf8(env, "ScreenCaptureAudioUpdate", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_create_threadsafe_function(
        env,
        args[1],
        nullptr,
        resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        CallJSCallback,
        &g_tsfn
    );
    
    bool isWindow = (typeStr == "window");
    
    [SCShareableContent getShareableContentExcludingDesktopWindows:YES
                                               onScreenWindowsOnly:YES
                                                 completionHandler:^(SCShareableContent * _Nullable content, NSError * _Nullable error) {
        if (error || !content) {
            NSLog(@"[ScreenCaptureKitAudio] Error getting shareable content for stream: %@", error);
            return;
        }
        
        SCContentFilter *filter = nil;
        if (isWindow) {
            SCWindow *targetWindow = nil;
            for (SCWindow *w in content.windows) {
                if (w.windowID == sourceId) {
                    targetWindow = w;
                    break;
                }
            }
            if (!targetWindow) {
                NSLog(@"[ScreenCaptureKitAudio] Target window ID %u not found", sourceId);
                return;
            }
            filter = [[SCContentFilter alloc] initWithDesktopIndependentWindow:targetWindow];
        } else {
            SCDisplay *targetDisplay = nil;
            for (SCDisplay *d in content.displays) {
                if (d.displayID == sourceId) {
                    targetDisplay = d;
                    break;
                }
            }
            if (!targetDisplay) {
                NSLog(@"[ScreenCaptureKitAudio] Target display ID %u not found", sourceId);
                return;
            }
            filter = [[SCContentFilter alloc] initWithDisplay:targetDisplay excludingWindows:@[]];
        }
        
        SCStreamConfiguration *config = [[SCStreamConfiguration alloc] init];
        config.width = 1;
        config.height = 1;
        config.capturesAudio = YES;
        config.sampleRate = 48000;
        config.channelCount = 2;
        config.excludesCurrentProcessAudio = YES; // Prevent feedback loops!
        config.queueDepth = 8;
        
        g_output_delegate = [[AudioStreamOutputDelegate alloc] init];
        g_stream_delegate = [[AudioStreamDelegate alloc] init];
        
        g_stream = [[SCStream alloc] initWithFilter:filter configuration:config delegate:g_stream_delegate];
        g_queue = dispatch_queue_create("com.cables.screencaptureaudio.queue", DISPATCH_QUEUE_SERIAL);
        
        NSError *streamError = nil;
        [g_stream addStreamOutput:g_output_delegate type:SCStreamOutputTypeAudio sampleHandlerQueue:g_queue error:&streamError];
        if (streamError) {
            NSLog(@"[ScreenCaptureKitAudio] Error adding stream output: %@", streamError);
            return;
        }
        
        [g_stream startCaptureWithCompletionHandler:^(NSError * _Nullable startError) {
            if (startError) {
                NSLog(@"[ScreenCaptureKitAudio] Error starting capture: %@", startError);
            } else {
                NSLog(@"[ScreenCaptureKitAudio] Audio capture started successfully (48kHz Stereo)");
            }
        }];
    }];
    
    return nullptr;
}

// N-API: stopCapture()
napi_value StopCapture(napi_env env, napi_callback_info info) {
    CleanUpStream();
    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// N-API: getLatestAudioSamples(count)
napi_value GetLatestAudioSamples(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = { nullptr };
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    int32_t reqSamples = 4096;
    if (argc >= 1) {
        napi_get_value_int32(env, args[0], &reqSamples);
    }
    
    std::lock_guard<std::mutex> lock(g_audio_mutex);
    int count = std::min((int)g_left_ring.size(), reqSamples);
    
    napi_value obj;
    napi_create_object(env, &obj);
    
    napi_value valLeft, valRight;
    float *leftData = nullptr;
    float *rightData = nullptr;
    
    napi_create_arraybuffer(env, count * sizeof(float), (void **)&leftData, &valLeft);
    napi_create_arraybuffer(env, count * sizeof(float), (void **)&rightData, &valRight);
    
    // Copy samples from circular deque
    for (int i = 0; i < count; ++i) {
        leftData[i] = g_left_ring[i];
        rightData[i] = g_right_ring[i];
    }
    
    // Remove read samples from deque
    g_left_ring.erase(g_left_ring.begin(), g_left_ring.begin() + count);
    g_right_ring.erase(g_right_ring.begin(), g_right_ring.begin() + count);
    
    // Wrap ArrayBuffers in Float32Arrays for direct JS Web Audio Buffer writing
    napi_value viewLeft, viewRight;
    napi_create_typedarray(env, napi_float32_array, count, valLeft, 0, &viewLeft);
    napi_create_typedarray(env, napi_float32_array, count, valRight, 0, &viewRight);
    
    napi_set_named_property(env, obj, "left", viewLeft);
    napi_set_named_property(env, obj, "right", viewRight);
    
    return obj;
}

// Module Initialisation
napi_value InitModule(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "getShareableContent", nullptr, GetShareableContent, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "startCapture", nullptr, StartCapture, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stopCapture", nullptr, StopCapture, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "getLatestAudioSamples", nullptr, GetLatestAudioSamples, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, InitModule)
