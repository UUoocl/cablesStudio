#include <node_api.h>
#import <Foundation/Foundation.h>
#include <IOKit/hid/IOHIDManager.h>
#include <IOKit/hid/IOHIDKeys.h>
#include <string>
#include <vector>
#include <thread>
#include <iostream>

struct ShuttleEventPayload {
    std::string jsonStr;
};

static IOHIDManagerRef g_hid_manager = NULL;
static std::thread g_run_loop_thread;
static CFRunLoopRef g_cf_run_loop = NULL;
static napi_threadsafe_function g_ts_fn = nullptr;
static bool g_device_connected = false;

static int g_prevJog = -1;
static bool g_hasPrevJog = false;
static int g_prevShuttle = -1;
static bool g_hasPrevShuttle = false;
static bool g_prevButtons[5] = {false};

// Threadsafe JS function callback invoker
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    ShuttleEventPayload* event = static_cast<ShuttleEventPayload*>(data);
    
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
    
    ShuttleEventPayload* event = new ShuttleEventPayload();
    event->jsonStr = jsonStr;
    
    napi_acquire_threadsafe_function(g_ts_fn);
    napi_call_threadsafe_function(g_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(g_ts_fn, napi_tsfn_release);
}

void ProcessReport(const uint8_t* data, uint32_t length) {
    if (length < 5) return;
    
    // Parse Shuttle (Byte 0, signed 8-bit, -7 to 7)
    int8_t shuttleVal = (int8_t)data[0];
    
    // Parse Jog (Byte 1, uint8)
    uint8_t jogVal = data[1];
    
    // Parse Buttons (Bytes 3 & 4)
    uint8_t bByte1 = data[3];
    uint8_t bByte2 = data[4];
    
    // 1. Shuttle ring event
    if (!g_hasPrevShuttle || shuttleVal != g_prevShuttle) {
        char buf[128];
        snprintf(buf, sizeof(buf), "{\"type\":\"shuttle\",\"value\":%d}", shuttleVal);
        SendJSEvent(buf);
        g_prevShuttle = shuttleVal;
        g_hasPrevShuttle = true;
    }
    
    // 2. Jog wheel event
    if (g_hasPrevJog) {
        int diff = (int)jogVal - g_prevJog;
        if (diff > 128) {
            diff -= 256;
        } else if (diff < -128) {
            diff += 256;
        }
        if (diff != 0) {
            char buf[128];
            snprintf(buf, sizeof(buf), "{\"type\":\"jog\",\"delta\":%d,\"value\":%d}", diff, jogVal);
            SendJSEvent(buf);
        }
    }
    g_prevJog = jogVal;
    g_hasPrevJog = true;
    
    // 3. Button events (ShuttleXpress has 5 buttons mapped as follows):
    // Button 0 (leftmost): data[3] bit 4
    // Button 1: data[3] bit 5
    // Button 2: data[3] bit 6
    // Button 3: data[3] bit 7
    // Button 4 (rightmost): data[4] bit 0
    bool buttonsPressed[5] = {
        ((bByte1 >> 4) & 1) != 0,
        ((bByte1 >> 5) & 1) != 0,
        ((bByte1 >> 6) & 1) != 0,
        ((bByte1 >> 7) & 1) != 0,
        ((bByte2 >> 0) & 1) != 0
    };
    
    for (int i = 0; i < 5; ++i) {
        bool pressed = buttonsPressed[i];
        if (pressed != g_prevButtons[i]) {
            g_prevButtons[i] = pressed;
            char buf[128];
            snprintf(buf, sizeof(buf), "{\"type\":\"button\",\"index\":%d,\"pressed\":%s}", i, pressed ? "true" : "false");
            SendJSEvent(buf);
        }
    }
}

// C callbacks
static void MatchCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    g_device_connected = true;
    std::cout << "[ContourShuttleXpress] Shuttle matched." << std::endl;
    SendJSEvent("{\"type\":\"info\",\"status\":\"connected\",\"device\":\"Contour ShuttleXpress\"}");
}

static void RemovalCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    g_device_connected = false;
    std::cout << "[ContourShuttleXpress] Shuttle removed." << std::endl;
    SendJSEvent("{\"type\":\"info\",\"status\":\"searching\",\"device\":\"Contour ShuttleXpress (Not Connected)\"}");
}

static void ReportCallback(void* context, IOReturn result, void* sender, IOHIDReportType type, uint32_t reportID, uint8_t* report, CFIndex reportLength) {
    if (result != kIOReturnSuccess) return;
    ProcessReport(report, (uint32_t)reportLength);
}

void RunMonitorLoop() {
    g_cf_run_loop = CFRunLoopGetCurrent();
    
    IOHIDManagerRegisterDeviceMatchingCallback(g_hid_manager, MatchCallback, NULL);
    IOHIDManagerRegisterDeviceRemovalCallback(g_hid_manager, RemovalCallback, NULL);
    IOHIDManagerRegisterInputReportCallback(g_hid_manager, ReportCallback, NULL);
    
    IOHIDManagerScheduleWithRunLoop(g_hid_manager, g_cf_run_loop, kCFRunLoopDefaultMode);
    
    IOReturn openResult = IOHIDManagerOpen(g_hid_manager, kIOHIDOptionsTypeNone);
    if (openResult != kIOReturnSuccess) {
        std::cerr << "[ContourShuttleXpress] Failed to open IOHIDManager. Error: " << openResult << std::endl;
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
    napi_create_string_utf8(env, "ContourShuttleXpressCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
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
            @kIOHIDVendorIDKey: @0x0b33,
            @kIOHIDProductIDKey: @0x0020
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
    
    g_device_connected = false;
    g_prevJog = -1;
    g_hasPrevJog = false;
    g_prevShuttle = -1;
    g_hasPrevShuttle = false;
    memset(g_prevButtons, 0, sizeof(g_prevButtons));
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    return nullptr;
}

// Exports: isConnected() -> Boolean
napi_value IsConnected(napi_env env, napi_callback_info info) {
    napi_value ret = nullptr;
    napi_get_boolean(env, g_device_connected, &ret);
    return ret;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "isConnected", nullptr, IsConnected, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
