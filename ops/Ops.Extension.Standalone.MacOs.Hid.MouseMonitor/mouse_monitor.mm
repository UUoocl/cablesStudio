#include <node_api.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <thread>
#include <mutex>
#include <string>
#include <iostream>
#include <sys/time.h>

// Structure to pass mouse events from background thread to JS main thread
struct MouseEvent {
    std::string type;
    int x;
    int y;
    std::string button;
    bool pressed;
    double dx;
    double dy;
};

// Global telemetry state variables
napi_threadsafe_function ts_fn = nullptr;
std::thread monitor_thread;
CFRunLoopRef run_loop = nullptr;
CFMachPortRef event_tap = nullptr;
CFRunLoopSourceRef run_loop_source = nullptr;
bool active = false;
int target_pps = 20;
double last_move_time = 0;

std::mutex state_mutex;

// Thread-safe helper that runs on the JS main thread
void call_js(napi_env env, napi_value js_cb, void* context, void* data) {
    MouseEvent* ev = static_cast<MouseEvent*>(data);
    if (!ev) return;

    napi_value event_obj = nullptr;
    napi_value type_val = nullptr;
    napi_value data_obj = nullptr;
    napi_value x_val = nullptr;
    napi_value y_val = nullptr;

    napi_create_object(env, &event_obj);
    napi_create_string_utf8(env, ev->type.c_str(), NAPI_AUTO_LENGTH, &type_val);
    napi_set_named_property(env, event_obj, "type", type_val);

    napi_create_object(env, &data_obj);
    napi_create_int32(env, ev->x, &x_val);
    napi_create_int32(env, ev->y, &y_val);
    napi_set_named_property(env, data_obj, "x", x_val);
    napi_set_named_property(env, data_obj, "y", y_val);

    if (ev->type == "mouseClick") {
        napi_value button_val = nullptr;
        napi_value pressed_val = nullptr;
        napi_create_string_utf8(env, ev->button.c_str(), NAPI_AUTO_LENGTH, &button_val);
        napi_get_boolean(env, ev->pressed, &pressed_val);
        napi_set_named_property(env, data_obj, "button", button_val);
        napi_set_named_property(env, data_obj, "pressed", pressed_val);
    } else if (ev->type == "mouseScroll") {
        napi_value dx_val = nullptr;
        napi_value dy_val = nullptr;
        napi_create_double(env, ev->dx, &dx_val);
        napi_create_double(env, ev->dy, &dy_val);
        napi_set_named_property(env, data_obj, "dx", dx_val);
        napi_set_named_property(env, data_obj, "dy", dy_val);
    }

    napi_set_named_property(env, event_obj, "data", data_obj);

    napi_value undefined = nullptr;
    napi_get_undefined(env, &undefined);
    napi_value result = nullptr;
    napi_call_function(env, undefined, js_cb, 1, &event_obj, &result);

    delete ev;
}

// Global mouse event tap callback
CGEventRef event_tap_callback(
    CGEventTapProxy proxy,
    CGEventType type,
    CGEventRef event,
    void* refcon
) {
    if (!active) return event;

    CGPoint location = CGEventGetLocation(event);
    MouseEvent* ev = nullptr;

    if (type == kCGEventMouseMoved || type == kCGEventLeftMouseDragged ||
        type == kCGEventRightMouseDragged || type == kCGEventOtherMouseDragged) {
        
        struct timeval tv;
        gettimeofday(&tv, NULL);
        double now = tv.tv_sec + tv.tv_usec / 1000000.0;

        double min_interval = 1.0 / (double)target_pps;
        if (now - last_move_time >= min_interval) {
            last_move_time = now;
            ev = new MouseEvent();
            ev->type = "mousePosition";
            ev->x = (int)location.x;
            ev->y = (int)location.y;
        }
    } else if (type == kCGEventLeftMouseDown || type == kCGEventLeftMouseUp ||
               type == kCGEventRightMouseDown || type == kCGEventRightMouseUp ||
               type == kCGEventOtherMouseDown || type == kCGEventOtherMouseUp) {
               
        ev = new MouseEvent();
        ev->type = "mouseClick";
        ev->x = (int)location.x;
        ev->y = (int)location.y;
        ev->pressed = (type == kCGEventLeftMouseDown || type == kCGEventRightMouseDown || type == kCGEventOtherMouseDown);
        
        int button_number = (int)CGEventGetIntegerValueField(event, kCGMouseEventButtonNumber);
        ev->button = "MB" + std::to_string(button_number + 1);
    } else if (type == kCGEventScrollWheel) {
        ev = new MouseEvent();
        ev->type = "mouseScroll";
        ev->x = (int)location.x;
        ev->y = (int)location.y;
        ev->dy = CGEventGetDoubleValueField(event, kCGScrollWheelEventFixedPtDeltaAxis1);
        ev->dx = CGEventGetDoubleValueField(event, kCGScrollWheelEventFixedPtDeltaAxis2);
    }

    if (ev && ts_fn) {
        napi_status status = napi_call_threadsafe_function(ts_fn, ev, napi_tsfn_blocking);
        if (status != napi_ok) {
            delete ev;
        }
    }

    return event;
}

// Background thread loop
void run_monitor_loop() {
    CGEventMask event_mask =
        (1ULL << kCGEventMouseMoved) |
        (1ULL << kCGEventLeftMouseDown) |
        (1ULL << kCGEventLeftMouseUp) |
        (1ULL << kCGEventLeftMouseDragged) |
        (1ULL << kCGEventRightMouseDown) |
        (1ULL << kCGEventRightMouseUp) |
        (1ULL << kCGEventRightMouseDragged) |
        (1ULL << kCGEventOtherMouseDown) |
        (1ULL << kCGEventOtherMouseUp) |
        (1ULL << kCGEventOtherMouseDragged) |
        (1ULL << kCGEventScrollWheel);

    event_tap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionDefault,
        event_mask,
        event_tap_callback,
        nullptr
    );

    if (!event_tap) {
        std::cerr << "[MouseMonitor] Failed to create CGEventTap." << std::endl;
        return;
    }

    run_loop = CFRunLoopGetCurrent();
    run_loop_source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, event_tap, 0);
    CFRunLoopAddSource(run_loop, run_loop_source, kCFRunLoopDefaultMode);
    CGEventTapEnable(event_tap, true);

    CFRunLoopRun();
}

// Exports: start(callback, pps)
napi_value Start(napi_env env, napi_callback_info info) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (active) return nullptr;

    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required as first argument");
        return nullptr;
    }

    napi_value js_cb = args[0];

    if (argc > 1) {
        napi_get_value_int32(env, args[1], &target_pps);
        if (target_pps <= 0) {
            target_pps = 20;
        }
    }

    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "MouseMonitorThread", NAPI_AUTO_LENGTH, &resource_name);

    napi_status status = napi_create_threadsafe_function(
        env,
        js_cb,
        nullptr,
        resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        call_js,
        &ts_fn
    );

    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create N-API threadsafe function");
        return nullptr;
    }

    active = true;
    monitor_thread = std::thread(run_monitor_loop);

    napi_value success;
    napi_get_boolean(env, true, &success);
    return success;
}

// Exports: stop()
napi_value Stop(napi_env env, napi_callback_info info) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (!active) return nullptr;

    active = false;

    if (run_loop) {
        CFRunLoopStop(run_loop);
        run_loop = nullptr;
    }

    if (event_tap) {
        CGEventTapEnable(event_tap, false);
        CFRelease(event_tap);
        event_tap = nullptr;
    }

    if (run_loop_source) {
        CFRelease(run_loop_source);
        run_loop_source = nullptr;
    }

    if (monitor_thread.joinable()) {
        monitor_thread.join();
    }

    if (ts_fn) {
        napi_release_threadsafe_function(ts_fn, napi_tsfn_release);
        ts_fn = nullptr;
    }

    napi_value success;
    napi_get_boolean(env, true, &success);
    return success;
}

// Module initialization
napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
