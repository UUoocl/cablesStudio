#include <node_api.h>
#import <Foundation/Foundation.h>
#import <CoreAudio/CoreAudio.h>
#import <AudioToolbox/AudioToolbox.h>
#import <CoreGraphics/CoreGraphics.h>
#include <dlfcn.h>
#include <vector>
#include <string>
#include <mutex>
#include <deque>
#include <algorithm>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"

// CoreAudio Sonoma 14.2+ Process Tap structures and signatures
typedef UInt32 AudioHardwareProcessTapFlags;
enum {
    kAudioHardwareProcessTapNone = 0
};

struct AudioHardwareProcessTapDescription {
    UInt32 mVersion;
    AudioHardwareProcessTapFlags mFlags;
    UInt32 mProcessCount;
    pid_t *mProcessList;
};

typedef OSStatus (*AudioHardwareCreateProcessTapProc)(
    const AudioHardwareProcessTapDescription* inDescription,
    AudioObjectID* outTapID
);

typedef OSStatus (*AudioHardwareDestroyProcessTapProc)(
    AudioObjectID inTapID
);

static AudioHardwareCreateProcessTapProc g_AudioHardwareCreateProcessTap = nullptr;
static AudioHardwareDestroyProcessTapProc g_AudioHardwareDestroyProcessTap = nullptr;

static void ResolveSonomaAPIs() {
    static bool resolved = false;
    if (resolved) return;
    g_AudioHardwareCreateProcessTap = (AudioHardwareCreateProcessTapProc)dlsym(RTLD_DEFAULT, "AudioHardwareCreateProcessTap");
    g_AudioHardwareDestroyProcessTap = (AudioHardwareDestroyProcessTapProc)dlsym(RTLD_DEFAULT, "AudioHardwareDestroyProcessTap");
    resolved = true;
}

// Structures for query results
struct SharedWindow {
    uint32_t pid;
    std::string title;
    std::string appName;
};

struct ShareableContentResult {
    std::vector<SharedWindow> windows;
};

// Global audio buffer state
static std::mutex g_audio_mutex;
static std::deque<float> g_left_ring;
static std::deque<float> g_right_ring;

// Tap stream state
static AudioObjectID g_tap_device = kAudioObjectUnknown;
static AudioDeviceIOProcID g_proc_id = nullptr;
static bool g_is_capturing = false;

// Audio device I/O callback
static OSStatus AudioDeviceIOCallback(
    AudioObjectID inDevice,
    const AudioTimeStamp* inNow,
    const AudioBufferList* inInputData,
    const AudioTimeStamp* inInputTime,
    AudioBufferList* outOutputData,
    const AudioTimeStamp* inOutputTime,
    void* inClientData
) {
    std::lock_guard<std::mutex> lock(g_audio_mutex);
    
    // If it's a process tap device, samples are inside `inInputData`.
    // If it's a system output device, samples are inside `outOutputData`.
    const AudioBufferList* targetList = (inInputData && inInputData->mNumberBuffers > 0) ? inInputData : outOutputData;
    
    if (targetList && targetList->mNumberBuffers > 0) {
        int numBuffers = targetList->mNumberBuffers;
        if (numBuffers == 1) {
            // Interleaved Float32 stereo samples
            float *samples = (float *)targetList->mBuffers[0].mData;
            int sampleCount = targetList->mBuffers[0].mDataByteSize / sizeof(float);
            int frameCount = sampleCount / 2;
            
            for (int i = 0; i < frameCount; ++i) {
                g_left_ring.push_back(samples[i * 2]);
                g_right_ring.push_back(samples[i * 2 + 1]);
            }
        } else if (numBuffers >= 2) {
            // Planar Float32 stereo samples
            float *leftSamples = (float *)targetList->mBuffers[0].mData;
            float *rightSamples = (float *)targetList->mBuffers[1].mData;
            int frameCount = targetList->mBuffers[0].mDataByteSize / sizeof(float);
            
            for (int i = 0; i < frameCount; ++i) {
                g_left_ring.push_back(leftSamples[i]);
                g_right_ring.push_back(rightSamples[i]);
            }
        }
    }
    
    // Bound the circular buffer length (max 96000 samples = ~2 seconds of audio buffer)
    size_t maxSamples = 96000;
    while (g_left_ring.size() > maxSamples) {
        g_left_ring.pop_front();
        g_right_ring.pop_front();
    }
    
    return noErr;
}

// Clean up active tap and callback
static void CleanUpTap() {
    ResolveSonomaAPIs();
    
    if (g_tap_device != kAudioObjectUnknown) {
        if (g_proc_id) {
            AudioDeviceStop(g_tap_device, g_proc_id);
            AudioDeviceDestroyIOProcID(g_tap_device, g_proc_id);
            g_proc_id = nullptr;
        }
        
        AudioObjectPropertyAddress address = {
            kAudioHardwarePropertyDefaultOutputDevice,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        AudioObjectID defaultOutputDevice = kAudioObjectUnknown;
        UInt32 size = sizeof(AudioObjectID);
        AudioObjectGetPropertyData(kAudioObjectSystemObject, &address, 0, nullptr, &size, &defaultOutputDevice);
        
        if (g_tap_device != defaultOutputDevice) {
            if (g_AudioHardwareDestroyProcessTap != nullptr) {
                g_AudioHardwareDestroyProcessTap(g_tap_device);
            }
        }
        
        g_tap_device = kAudioObjectUnknown;
    }
    
    g_is_capturing = false;
    
    {
        std::lock_guard<std::mutex> lock(g_audio_mutex);
        g_left_ring.clear();
        g_right_ring.clear();
    }
}

// getShareableContent callback marshaller
static void HandleShareableContentCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    ShareableContentResult *result = static_cast<ShareableContentResult *>(data);
    
    napi_value resultObj;
    napi_create_object(env, &resultObj);
    
    napi_value windowsArr;
    napi_create_array(env, &windowsArr);
    for (size_t i = 0; i < result->windows.size(); ++i) {
        const auto &w = result->windows[i];
        napi_value obj;
        napi_create_object(env, &obj);
        
        napi_value valPid, valTitle, valAppName;
        napi_create_uint32(env, w.pid, &valPid);
        napi_create_string_utf8(env, w.title.c_str(), NAPI_AUTO_LENGTH, &valTitle);
        napi_create_string_utf8(env, w.appName.c_str(), NAPI_AUTO_LENGTH, &valAppName);
        
        napi_set_named_property(env, obj, "pid", valPid);
        napi_set_named_property(env, obj, "title", valTitle);
        napi_set_named_property(env, obj, "appName", valAppName);
        
        napi_set_element(env, windowsArr, i, obj);
    }
    
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
    napi_create_string_utf8(env, "CoreAudioTapShareableContentQuery", NAPI_AUTO_LENGTH, &resource_name);
    
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
    
    // Query window list
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionAll | kCGWindowListExcludeDesktopElements, kCGNullWindowID);
    ShareableContentResult *result = new ShareableContentResult();
    
    if (windowList) {
        CFIndex count = CFArrayGetCount(windowList);
        for (CFIndex i = 0; i < count; ++i) {
            CFDictionaryRef windowInfo = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);
            
            CFNumberRef layerNum = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowLayer);
            int layer = 0;
            if (layerNum) CFNumberGetValue(layerNum, kCFNumberIntType, &layer);
            if (layer != 0) continue;
            
            CFStringRef titleStr = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowName);
            CFStringRef appStr = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerName);
            CFNumberRef pidNum = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerPID);
            
            if (!pidNum || !appStr) continue;
            
            uint32_t pid = 0;
            CFNumberGetValue(pidNum, kCFNumberIntType, &pid);
            
            char titleBuf[256] = {0};
            if (titleStr) CFStringGetCString(titleStr, titleBuf, sizeof(titleBuf), kCFStringEncodingUTF8);
            
            char appBuf[256] = {0};
            CFStringGetCString(appStr, appBuf, sizeof(appBuf), kCFStringEncodingUTF8);
            
            if (strlen(appBuf) == 0) continue;
            
            SharedWindow w;
            w.pid = pid;
            w.title = titleBuf;
            w.appName = appBuf;
            result->windows.push_back(w);
        }
        CFRelease(windowList);
    }
    
    napi_call_threadsafe_function(tsfn, result, napi_tsfn_blocking);
    napi_release_threadsafe_function(tsfn, napi_tsfn_release);
    
    return nullptr;
}

// N-API: startCapture(options)
napi_value StartCapture(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = { nullptr };
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Options argument required");
        return nullptr;
    }
    
    napi_value valType, valPid;
    napi_get_named_property(env, args[0], "type", &valType);
    napi_get_named_property(env, args[0], "pid", &valPid);
    
    size_t typeLen = 0;
    napi_get_value_string_utf8(env, valType, nullptr, 0, &typeLen);
    std::string typeStr(typeLen, '\0');
    napi_get_value_string_utf8(env, valType, &typeStr[0], typeLen + 1, &typeLen);
    
    uint32_t targetPid = 0;
    napi_get_value_uint32(env, valPid, &targetPid);
    
    CleanUpTap();
    ResolveSonomaAPIs();
    
    OSStatus status = noErr;
    
    if (typeStr == "system") {
        AudioObjectPropertyAddress address = {
            kAudioHardwarePropertyDefaultOutputDevice,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        UInt32 size = sizeof(AudioObjectID);
        status = AudioObjectGetPropertyData(kAudioObjectSystemObject, &address, 0, nullptr, &size, &g_tap_device);
        
        if (status != noErr) {
            napi_throw_error(env, nullptr, "Failed to resolve default output device");
            return nullptr;
        }
        
        status = AudioDeviceCreateIOProcID(g_tap_device, AudioDeviceIOCallback, nullptr, &g_proc_id);
        if (status != noErr) {
            napi_throw_error(env, nullptr, "Failed to create CoreAudio IO Proc ID");
            return nullptr;
        }
        
        status = AudioDeviceStart(g_tap_device, g_proc_id);
        if (status != noErr) {
            napi_throw_error(env, nullptr, "Failed to start default output loopback");
            return nullptr;
        }
        
        g_is_capturing = true;
        NSLog(@"[CoreAudioTap] Started system-wide loopback capture");
    } else {
        if (g_AudioHardwareCreateProcessTap != nullptr) {
            pid_t pidList[1] = { (pid_t)targetPid };
            AudioHardwareProcessTapDescription desc;
            desc.mVersion = 0;
            desc.mFlags = kAudioHardwareProcessTapNone;
            desc.mProcessCount = 1;
            desc.mProcessList = pidList;
            
            status = g_AudioHardwareCreateProcessTap(&desc, &g_tap_device);
            if (status != noErr) {
                napi_throw_error(env, nullptr, "Failed to create process tap (Sonoma 14.2+ required)");
                return nullptr;
            }
            
            status = AudioDeviceCreateIOProcID(g_tap_device, AudioDeviceIOCallback, nullptr, &g_proc_id);
            if (status != noErr) {
                if (g_AudioHardwareDestroyProcessTap != nullptr) {
                    g_AudioHardwareDestroyProcessTap(g_tap_device);
                }
                g_tap_device = kAudioObjectUnknown;
                napi_throw_error(env, nullptr, "Failed to create process tap IO Proc ID");
                return nullptr;
            }
            
            status = AudioDeviceStart(g_tap_device, g_proc_id);
            if (status != noErr) {
                AudioDeviceDestroyIOProcID(g_tap_device, g_proc_id);
                g_proc_id = nullptr;
                if (g_AudioHardwareDestroyProcessTap != nullptr) {
                    g_AudioHardwareDestroyProcessTap(g_tap_device);
                }
                g_tap_device = kAudioObjectUnknown;
                napi_throw_error(env, nullptr, "Failed to start process tap capture");
                return nullptr;
            }
            
            g_is_capturing = true;
            NSLog(@"[CoreAudioTap] Started process-specific tap capture for PID %u", targetPid);
        } else {
            napi_throw_error(env, nullptr, "AudioHardwareCreateProcessTap API not available on this macOS version (Sonoma 14.2+ required)");
            return nullptr;
        }
    }
    
    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// N-API: stopCapture()
napi_value StopCapture(napi_env env, napi_callback_info info) {
    CleanUpTap();
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
    
    // Copy samples from circular queue
    for (int i = 0; i < count; ++i) {
        leftData[i] = g_left_ring[i];
        rightData[i] = g_right_ring[i];
    }
    
    // Remove read samples from circular queue
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
