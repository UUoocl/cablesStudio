#include <node_api.h>
#import <Foundation/Foundation.h>
#include <IOKit/hid/IOHIDManager.h>
#include <IOKit/hid/IOHIDKeys.h>
#include <string>
#include <vector>
#include <algorithm>
#include <thread>
#include <iostream>

struct EventPayload {
    std::string jsonStr;
};

static IOHIDManagerRef g_hid_manager = NULL;
static IOHIDDeviceRef g_active_device = NULL;
static std::thread g_run_loop_thread;
static CFRunLoopRef g_cf_run_loop = NULL;
static napi_threadsafe_function g_ts_fn = nullptr;
static dispatch_source_t g_keepalive_timer = NULL;

static int32_t g_prevJog = -1;
static bool g_hasPrevJog = false;
static int32_t g_accumulatedJogValue = 0;
static std::vector<uint16_t> g_prevKeys;

// Auth helper functions
inline uint64_t rol8(uint64_t v) {
    return (v << 56) | (v >> 8);
}

inline uint64_t rol8n(uint64_t v, int n) {
    uint64_t val = v;
    for (int i = 0; i < n; ++i) {
        val = rol8(val);
    }
    return val;
}

uint64_t bmdKbdAuth(uint64_t challenge) {
    static const uint64_t authEvenTbl[] = {
        0x3ae1206f97c10bc8,
        0x2a9ab32bebf244c6,
        0x20a6f8b8df9adf0a,
        0xaf80ece52cfc1719,
        0xec2ee2f7414fd151,
        0xb055adfd73344a15,
        0xa63d2e3059001187,
        0x751bf623f42e0dde
    };
    static const uint64_t authOddTbl[] = {
        0x3e22b34f502e7fde,
        0x24656b981875ab1c,
        0xa17f3456df7bf8c3,
        0x6df72e1941aef698,
        0x72226f011e66ab94,
        0x3831a3c606296b42,
        0xfd7ff81881332c89,
        0x61a3f6474ff236c6
    };
    static const uint64_t mask = 0xa79a63f585d37bf0;

    int n = (int)(challenge & 7);
    uint64_t v = rol8n(challenge, n);

    uint64_t k;
    if ((v & 1) == (uint64_t)((0x78 >> n) & 1)) {
        k = authEvenTbl[n];
    } else {
        v = v ^ rol8(v);
        k = authOddTbl[n];
    }

    return v ^ (rol8(v) & mask) ^ k;
}

bool authenticate(IOHIDDeviceRef device) {
    // Step 1: Send reset report
    uint8_t resetReport[] = {0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    IOReturn res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, resetReport, sizeof(resetReport));
    if (res != kIOReturnSuccess) return false;
    
    // Step 2: Read challenge report
    uint8_t challengeReport[10] = {0};
    CFIndex challengeLength = sizeof(challengeReport);
    res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, challengeReport, &challengeLength);
    if (res != kIOReturnSuccess || challengeReport[0] != 0x06 || challengeReport[1] != 0x00) return false;
    
    // Convert to uint64 challenge (little endian)
    uint64_t challenge = 0;
    for (int i = 0; i < 8; ++i) {
        challenge |= (uint64_t)challengeReport[2 + i] << (i * 8);
    }
    
    // Step 3: Send our challenge (just zeros)
    uint8_t ourChallengeReport[] = {0x06, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, ourChallengeReport, sizeof(ourChallengeReport));
    if (res != kIOReturnSuccess) return false;
    
    // Step 4: Read response report
    uint8_t responseReport[10] = {0};
    CFIndex responseLength = sizeof(responseReport);
    res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, responseReport, &responseLength);
    if (res != kIOReturnSuccess || responseReport[0] != 0x06 || responseReport[1] != 0x02) return false;
    
    // Step 5: Compute and send our response
    uint64_t responseVal = bmdKbdAuth(challenge);
    uint8_t ourResponseReport[10] = {0};
    ourResponseReport[0] = 0x06;
    ourResponseReport[1] = 0x03;
    for (int i = 0; i < 8; ++i) {
        ourResponseReport[2 + i] = (uint8_t)((responseVal >> (i * 8)) & 0xFF);
    }
    res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, ourResponseReport, sizeof(ourResponseReport));
    if (res != kIOReturnSuccess) return false;
    
    // Step 6: Read status report
    uint8_t statusReport[10] = {0};
    CFIndex statusLength = sizeof(statusReport);
    res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, statusReport, &statusLength);
    if (res != kIOReturnSuccess || statusReport[0] != 0x06 || statusReport[1] != 0x04) return false;
    
    return true;
}

// Threadsafe JS function callback invoker
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    EventPayload* event = static_cast<EventPayload*>(data);
    
    napi_value event_str = nullptr;
    napi_create_string_utf8(env, event->jsonStr.c_str(), NAPI_AUTO_LENGTH, &event_str);
    
    napi_value global = nullptr;
    napi_get_global(env, &global);
    
    napi_value result = nullptr;
    napi_call_function(env, global, js_cb, 1, &event_str, &result);
    
    delete event;
}

void SendJSEvent(const std::string& jsonStr) {
    if (!g_ts_fn) return;
    
    EventPayload* event = new EventPayload();
    event->jsonStr = jsonStr;
    
    napi_acquire_threadsafe_function(g_ts_fn);
    napi_call_threadsafe_function(g_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(g_ts_fn, napi_tsfn_release);
}

void DeviceMatched(IOHIDDeviceRef device) {
    g_active_device = device;
    
    std::cout << "[BmdSpeedEditor] Speed Editor device matched. Authenticating..." << std::endl;
    
    if (authenticate(device)) {
        std::cout << "[BmdSpeedEditor] Authentication successful." << std::endl;
        SendJSEvent("{\"type\":\"info\",\"status\":\"connected\",\"device\":\"DaVinci Resolve Speed Editor\"}");
        
        // Start keepalive timer
        if (g_keepalive_timer) {
            dispatch_source_cancel(g_keepalive_timer);
            g_keepalive_timer = NULL;
        }
        
        g_keepalive_timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0));
        dispatch_source_set_timer(g_keepalive_timer, dispatch_time(DISPATCH_TIME_NOW, 500LL * NSEC_PER_SEC), 500LL * NSEC_PER_SEC, 1LL * NSEC_PER_SEC);
        dispatch_source_set_event_handler(g_keepalive_timer, ^{
            if (g_active_device) {
                authenticate(g_active_device);
            }
        });
        dispatch_resume(g_keepalive_timer);
    } else {
        std::cerr << "[BmdSpeedEditor] Authentication failed." << std::endl;
        SendJSEvent("{\"type\":\"error\",\"message\":\"Authentication handshake failed\"}");
    }
}

void DeviceRemoved(IOHIDDeviceRef device) {
    std::cout << "[BmdSpeedEditor] Speed Editor device removed." << std::endl;
    if (g_active_device == device) {
        g_active_device = NULL;
        if (g_keepalive_timer) {
            dispatch_source_cancel(g_keepalive_timer);
            g_keepalive_timer = NULL;
        }
    }
    SendJSEvent("{\"type\":\"info\",\"status\":\"searching\",\"device\":\"DaVinci Resolve Speed Editor (Not Connected)\"}");
}

void ProcessReport(uint32_t reportID, const uint8_t* data, uint32_t length) {
    if (length == 0) return;
    
    bool isPrepended = (data[0] == reportID) && (
        (reportID == 3 && (length == 7 || length == 6)) ||
        (reportID == 4 && length == 13) ||
        (reportID == 7 && length == 3)
    );
    const uint8_t* payload = isPrepended ? (data + 1) : data;
    uint32_t payloadLength = isPrepended ? (length - 1) : length;
    
    if (reportID == 0x03) {
        if (payloadLength < 5) return;
        int jogMode = payload[0];
        int32_t jv = payload[1] | (payload[2] << 8) | (payload[3] << 16) | (payload[4] << 24);
        bool isRelative = (jogMode == 0 || jogMode == 2);
        int32_t delta = 0;
        int32_t finalValue = 0;
        if (isRelative) {
            delta = jv;
            g_accumulatedJogValue += delta;
            finalValue = g_accumulatedJogValue;
        } else {
            if (g_hasPrevJog) {
                delta = jv - g_prevJog;
            }
            g_prevJog = jv;
            g_hasPrevJog = true;
            finalValue = jv;
        }
        
        char buf[256];
        snprintf(buf, sizeof(buf), "{\"type\":\"jog\",\"mode\":%d,\"value\":%d,\"delta\":%d}", jogMode, finalValue, delta);
        SendJSEvent(buf);
        
    } else if (reportID == 0x04) {
        if (payloadLength < 12) return;
        std::vector<uint16_t> currentKeys;
        for (int idx = 0; idx < 6; ++idx) {
            uint16_t keyCode = payload[idx * 2] | (payload[idx * 2 + 1] << 8);
            if (keyCode != 0) {
                currentKeys.push_back(keyCode);
            }
        }
        
        std::vector<uint16_t> pressedKeys;
        std::vector<uint16_t> releasedKeys;
        for (uint16_t k : currentKeys) {
            if (std::find(g_prevKeys.begin(), g_prevKeys.end(), k) == g_prevKeys.end()) {
                pressedKeys.push_back(k);
            }
        }
        for (uint16_t k : g_prevKeys) {
            if (std::find(currentKeys.begin(), currentKeys.end(), k) == currentKeys.end()) {
                releasedKeys.push_back(k);
            }
        }
        g_prevKeys = currentKeys;
        
        std::string codesStr = "[";
        for (size_t i = 0; i < currentKeys.size(); ++i) {
            codesStr += std::to_string(currentKeys[i]);
            if (i < currentKeys.size() - 1) codesStr += ",";
        }
        codesStr += "]";
        
        std::string keysJson = "{\"type\":\"keys\",\"codes\":" + codesStr + "}";
        SendJSEvent(keysJson);
        
        for (uint16_t code : pressedKeys) {
            char buf[256];
            snprintf(buf, sizeof(buf), "{\"type\":\"key_event\",\"code\":%d,\"pressed\":true}", code);
            SendJSEvent(buf);
        }
        for (uint16_t code : releasedKeys) {
            char buf[256];
            snprintf(buf, sizeof(buf), "{\"type\":\"key_event\",\"code\":%d,\"pressed\":false}", code);
            SendJSEvent(buf);
        }
        
    } else if (reportID == 0x07) {
        if (payloadLength < 2) return;
        bool charging = payload[0] != 0;
        int level = payload[1];
        char buf[256];
        snprintf(buf, sizeof(buf), "{\"type\":\"battery\",\"charging\":%s,\"level\":%d}", charging ? "true" : "false", level);
        SendJSEvent(buf);
    }
}

// C callbacks
static void MatchCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    DeviceMatched(device);
}

static void RemovalCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    DeviceRemoved(device);
}

static void ReportCallback(void* context, IOReturn result, void* sender, IOHIDReportType type, uint32_t reportID, uint8_t* report, CFIndex reportLength) {
    if (result != kIOReturnSuccess) return;
    ProcessReport(reportID, report, (uint32_t)reportLength);
}

void RunMonitorLoop() {
    g_cf_run_loop = CFRunLoopGetCurrent();
    
    IOHIDManagerRegisterDeviceMatchingCallback(g_hid_manager, MatchCallback, NULL);
    IOHIDManagerRegisterDeviceRemovalCallback(g_hid_manager, RemovalCallback, NULL);
    IOHIDManagerRegisterInputReportCallback(g_hid_manager, ReportCallback, NULL);
    
    IOHIDManagerScheduleWithRunLoop(g_hid_manager, g_cf_run_loop, kCFRunLoopDefaultMode);
    
    IOReturn openResult = IOHIDManagerOpen(g_hid_manager, kIOHIDOptionsTypeNone);
    if (openResult != kIOReturnSuccess) {
        std::cerr << "[BmdSpeedEditor] Failed to open IOHIDManager. Error: " << openResult << std::endl;
        return;
    }
    
    CFRunLoopRun();
}

// N-API exports: start(callback)
napi_value Start(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "BmdSpeedEditorCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_status status = napi_create_threadsafe_function(
        env,
        args[0],
        nullptr,
        resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        CallJSCallback,
        &g_ts_fn
    );
    
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create threadsafe function");
        return nullptr;
    }
    
    if (!g_hid_manager) {
        g_hid_manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
        
        NSDictionary* matchingDict = @{
            @kIOHIDVendorIDKey: @0x1EDB,
            @kIOHIDProductIDKey: @0xDA0E
        };
        IOHIDManagerSetDeviceMatching(g_hid_manager, (__bridge CFDictionaryRef)matchingDict);
        
        g_run_loop_thread = std::thread(RunMonitorLoop);
    }
    
    napi_value ret = nullptr;
    napi_get_boolean(env, true, &ret);
    return ret;
}

// Exports: stop()
napi_value Stop(napi_env env, napi_callback_info info) {
    if (g_keepalive_timer) {
        dispatch_source_cancel(g_keepalive_timer);
        g_keepalive_timer = NULL;
    }
    
    if (g_cf_run_loop) {
        CFRunLoopStop(g_cf_run_loop);
        g_cf_run_loop = NULL;
    }
    
    if (g_run_loop_thread.joinable()) {
        g_run_loop_thread.join();
    }
    
    if (g_hid_manager) {
        IOHIDManagerClose(g_hid_manager, kIOHIDOptionsTypeNone);
        CFRelease(g_hid_manager);
        g_hid_manager = NULL;
    }
    
    g_active_device = NULL;
    g_prevJog = -1;
    g_hasPrevJog = false;
    g_accumulatedJogValue = 0;
    g_prevKeys.clear();
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    return nullptr;
}

// Exports: isConnected() -> Boolean
napi_value IsConnected(napi_env env, napi_callback_info info) {
    napi_value ret = nullptr;
    napi_get_boolean(env, g_active_device != NULL, &ret);
    return ret;
}

// Exports: setLeds(bitfield)
napi_value SetLeds(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "LED bitfield parameter required");
        return nullptr;
    }
    
    uint32_t bitfield = 0;
    napi_get_value_uint32(env, args[0], &bitfield);
    
    if (g_active_device) {
        uint8_t report[5] = {0};
        report[0] = 0x02;
        report[1] = (uint8_t)(bitfield & 0xFF);
        report[2] = (uint8_t)((bitfield >> 8) & 0xFF);
        report[3] = (uint8_t)((bitfield >> 16) & 0xFF);
        report[4] = (uint8_t)((bitfield >> 24) & 0xFF);
        
        IOHIDDeviceSetReport(g_active_device, kIOHIDReportTypeOutput, 2, report, sizeof(report));
    }
    return nullptr;
}

// Exports: setJogLeds(bitfield)
napi_value SetJogLeds(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Jog LED bitfield parameter required");
        return nullptr;
    }
    
    uint32_t bitfield = 0;
    napi_get_value_uint32(env, args[0], &bitfield);
    
    if (g_active_device) {
        uint8_t report[2] = {0};
        report[0] = 0x04;
        report[1] = (uint8_t)(bitfield & 0xFF);
        
        IOHIDDeviceSetReport(g_active_device, kIOHIDReportTypeOutput, 4, report, sizeof(report));
    }
    return nullptr;
}

// Exports: setJogMode(mode)
napi_value SetJogMode(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Jog Mode required");
        return nullptr;
    }
    
    uint32_t mode = 0;
    napi_get_value_uint32(env, args[0], &mode);
    
    if (g_active_device) {
        uint8_t report[7] = {0};
        report[0] = 0x03;
        report[1] = (uint8_t)(mode & 0xFF);
        report[6] = 0xFF;
        
        IOHIDDeviceSetReport(g_active_device, kIOHIDReportTypeOutput, 3, report, sizeof(report));
    }
    return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "isConnected", nullptr, IsConnected, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setLeds", nullptr, SetLeds, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setJogLeds", nullptr, SetJogLeds, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setJogMode", nullptr, SetJogMode, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
