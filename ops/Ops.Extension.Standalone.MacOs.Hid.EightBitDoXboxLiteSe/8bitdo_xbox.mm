#include <node_api.h>
#import <Foundation/Foundation.h>
#import "XboxControllerCore.h"
#include <string>
#include <iostream>

struct ControllerEventData {
    std::string jsonStr;
};

static napi_threadsafe_function g_ts_fn = nullptr;

// Callback function registered with the native controller manager
static void NativeControllerCallback(XboxControllerInputState state, const char *jsonString, void *context) {
    if (!g_ts_fn || !jsonString) return;
    
    ControllerEventData* event = new ControllerEventData();
    event->jsonStr = jsonString;
    
    napi_acquire_threadsafe_function(g_ts_fn);
    napi_call_threadsafe_function(g_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(g_ts_fn, napi_tsfn_release);
}

// Threadsafe JS function callback invoker running on JS main thread
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    ControllerEventData* event = static_cast<ControllerEventData*>(data);
    
    napi_value event_str = nullptr;
    napi_create_string_utf8(env, event->jsonStr.c_str(), NAPI_AUTO_LENGTH, &event_str);
    
    napi_value global = nullptr;
    napi_get_global(env, &global);
    
    napi_value result = nullptr;
    napi_call_function(env, global, js_cb, 1, &event_str, &result);
    
    delete event;
}

// Exports: start(callback) -> Boolean
napi_value Start(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }
    
    // Clean up previous threadsafe function if exists
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "EightBitDoXboxCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
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
    
    @autoreleasepool {
        XboxControllerManager* manager = [XboxControllerManager sharedManager];
        BOOL success = [manager startWithCallback:NativeControllerCallback context:nil];
        
        napi_value ret = nullptr;
        napi_get_boolean(env, (bool)success, &ret);
        return ret;
    }
}

// Exports: stop()
napi_value Stop(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        [[XboxControllerManager sharedManager] stop];
    }
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    return nullptr;
}

// Exports: isConnected() -> Boolean
napi_value IsConnected(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        BOOL connected = [[XboxControllerManager sharedManager] isDeviceConnected];
        napi_value ret = nullptr;
        napi_get_boolean(env, (bool)connected, &ret);
        return ret;
    }
}

// Exports: sendRumble(left, right, leftTrigger, rightTrigger)
napi_value SendRumble(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value args[4] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 4) {
        napi_throw_type_error(env, nullptr, "4 rumble values (left, right, leftTrigger, rightTrigger) required");
        return nullptr;
    }
    
    double left = 0;
    napi_get_value_double(env, args[0], &left);
    
    double right = 0;
    napi_get_value_double(env, args[1], &right);
    
    double leftTrigger = 0;
    napi_get_value_double(env, args[2], &leftTrigger);
    
    double rightTrigger = 0;
    napi_get_value_double(env, args[3], &rightTrigger);
    
    @autoreleasepool {
        [[XboxControllerManager sharedManager] sendRumbleLeft:(float)left
                                                        right:(float)right
                                                  leftTrigger:(float)leftTrigger
                                                 rightTrigger:(float)rightTrigger];
    }
    return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "isConnected", nullptr, IsConnected, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "sendRumble", nullptr, SendRumble, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
