#include <node_api.h>
#import <Foundation/Foundation.h>
#import <ScreenCaptureKit/ScreenCaptureKit.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreGraphics/CoreGraphics.h>
#include <vector>
#include <string>
#include <mutex>
#include <algorithm>

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

// Global thread-safe function for frame updates
static napi_threadsafe_function g_tsfn = nullptr;

// Global frame buffer state
static std::mutex g_frame_mutex;
static std::vector<uint8_t> g_frame_buffer;
static int g_frame_width = 0;
static int g_frame_height = 0;
static bool g_new_frame_available = false;

// Stream state
static SCStream *g_stream = nil;
static dispatch_queue_t g_queue = nil;

// Stream Delegate interface
@interface StreamOutputDelegate : NSObject <SCStreamOutput>
@end

@interface StreamDelegate : NSObject <SCStreamDelegate>
@end

static StreamOutputDelegate *g_output_delegate = nil;
static StreamDelegate *g_stream_delegate = nil;

@implementation StreamOutputDelegate
- (void)stream:(SCStream *)stream didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer ofType:(SCStreamOutputType)type {
    if (type != SCStreamOutputTypeScreen) return;
    
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (!pixelBuffer) return;
    
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
    uint8_t *baseAddress = (uint8_t *)CVPixelBufferGetBaseAddress(pixelBuffer);
    size_t width = CVPixelBufferGetWidth(pixelBuffer);
    size_t height = CVPixelBufferGetHeight(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    
    {
        std::lock_guard<std::mutex> lock(g_frame_mutex);
        g_frame_width = (int)width;
        g_frame_height = (int)height;
        g_frame_buffer.resize(width * height * 4);
        
        // Swap BGRA to RGBA in-place while copying for WebGL compatibility
        for (size_t y = 0; y < height; ++y) {
            uint8_t *dstRow = g_frame_buffer.data() + (y * width * 4);
            uint8_t *srcRow = baseAddress + (y * bytesPerRow);
            for (size_t x = 0; x < width; ++x) {
                dstRow[x * 4 + 0] = srcRow[x * 4 + 2]; // R
                dstRow[x * 4 + 1] = srcRow[x * 4 + 1]; // G
                dstRow[x * 4 + 2] = srcRow[x * 4 + 0]; // B
                dstRow[x * 4 + 3] = srcRow[x * 4 + 3]; // A
            }
        }
        g_new_frame_available = true;
    }
    
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
    // Notify JS callback thread-safely
    if (g_tsfn) {
        napi_call_threadsafe_function(g_tsfn, nullptr, napi_tsfn_blocking);
    }
}
@end

@implementation StreamDelegate
- (void)stream:(SCStream *)stream didStopWithError:(NSError *)error {
    NSLog(@"[ScreenCaptureKit] Stream stopped with error: %@", error);
}
@end

// Helper to cleanup active stream
static void CleanUpStream() {
    if (g_stream) {
        [g_stream stopCaptureWithCompletionHandler:^(NSError * _Nullable error) {
            if (error) {
                NSLog(@"[ScreenCaptureKit] Error stopping stream: %@", error);
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
        std::lock_guard<std::mutex> lock(g_frame_mutex);
        g_frame_buffer.clear();
        g_frame_width = 0;
        g_frame_height = 0;
        g_new_frame_available = false;
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
    napi_create_string_utf8(env, "ShareableContentQuery", NAPI_AUTO_LENGTH, &resource_name);
    
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
                d.name = "Screen " + std::to_string(display.displayID);
                d.width = (int)display.width;
                d.height = (int)display.height;
                result->displays.push_back(d);
            }
            
            for (SCWindow *window in content.windows) {
                // Filter out system windows, menus, and hidden layer elements
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

// Frame updates marshaller
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
    napi_value valType, valId, valWidth, valHeight;
    napi_get_named_property(env, args[0], "type", &valType);
    napi_get_named_property(env, args[0], "id", &valId);
    napi_get_named_property(env, args[0], "width", &valWidth);
    napi_get_named_property(env, args[0], "height", &valHeight);
    
    size_t typeLen = 0;
    napi_get_value_string_utf8(env, valType, nullptr, 0, &typeLen);
    std::string typeStr(typeLen, '\0');
    napi_get_value_string_utf8(env, valType, &typeStr[0], typeLen + 1, &typeLen);
    
    uint32_t sourceId = 0;
    napi_get_value_uint32(env, valId, &sourceId);
    
    int32_t captureWidth = 1280;
    napi_get_value_int32(env, valWidth, &captureWidth);
    
    int32_t captureHeight = 720;
    napi_get_value_int32(env, valHeight, &captureHeight);
    
    CleanUpStream();
    
    napi_value resource_name;
    napi_create_string_utf8(env, "ScreenCaptureFrameUpdate", NAPI_AUTO_LENGTH, &resource_name);
    
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
            NSLog(@"[ScreenCaptureKit] Error getting shareable content for stream creation: %@", error);
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
                NSLog(@"[ScreenCaptureKit] Target window ID %u not found", sourceId);
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
                NSLog(@"[ScreenCaptureKit] Target display ID %u not found", sourceId);
                return;
            }
            filter = [[SCContentFilter alloc] initWithDisplay:targetDisplay excludingWindows:@[]];
        }
        
        SCStreamConfiguration *config = [[SCStreamConfiguration alloc] init];
        config.width = captureWidth;
        config.height = captureHeight;
        config.pixelFormat = kCVPixelFormatType_32BGRA;
        config.minimumFrameInterval = CMTimeMake(1, 30); // 30 FPS target
        config.queueDepth = 4;
        
        g_output_delegate = [[StreamOutputDelegate alloc] init];
        g_stream_delegate = [[StreamDelegate alloc] init];
        
        g_stream = [[SCStream alloc] initWithFilter:filter configuration:config delegate:g_stream_delegate];
        g_queue = dispatch_queue_create("com.cables.screencapture.queue", DISPATCH_QUEUE_SERIAL);
        
        NSError *streamError = nil;
        [g_stream addStreamOutput:g_output_delegate type:SCStreamOutputTypeScreen sampleHandlerQueue:g_queue error:&streamError];
        if (streamError) {
            NSLog(@"[ScreenCaptureKit] Error adding stream output: %@", streamError);
            return;
        }
        
        [g_stream startCaptureWithCompletionHandler:^(NSError * _Nullable startError) {
            if (startError) {
                NSLog(@"[ScreenCaptureKit] Error starting capture: %@", startError);
            } else {
                NSLog(@"[ScreenCaptureKit] Capture started successfully (%dx%d)", captureWidth, captureHeight);
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

// N-API: getLatestFrame()
napi_value GetLatestFrame(napi_env env, napi_callback_info info) {
    std::lock_guard<std::mutex> lock(g_frame_mutex);
    if (g_frame_buffer.empty()) {
        napi_value valNull;
        napi_get_null(env, &valNull);
        return valNull;
    }
    
    napi_value obj;
    napi_create_object(env, &obj);
    
    napi_value valW, valH, valBuf;
    napi_create_int32(env, g_frame_width, &valW);
    napi_create_int32(env, g_frame_height, &valH);
    
    // Copy the C++ double buffer safely to Node.js memory
    napi_create_buffer_copy(env, g_frame_buffer.size(), g_frame_buffer.data(), nullptr, &valBuf);
    
    napi_set_named_property(env, obj, "width", valW);
    napi_set_named_property(env, obj, "height", valH);
    napi_set_named_property(env, obj, "buffer", valBuf);
    
    return obj;
}

// Addon Initialization
napi_value InitModule(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "getShareableContent", nullptr, GetShareableContent, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "startCapture", nullptr, StartCapture, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stopCapture", nullptr, StopCapture, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "getLatestFrame", nullptr, GetLatestFrame, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, InitModule)
