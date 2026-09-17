#include <node_api.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <thread>
#include <atomic>
#include <string>
#include <sys/time.h>
#include <iostream>

struct MouseEvent {
    std::string type; // "mousePosition", "mouseClick", "mouseScroll"
    int x;
    int y;
    std::string button;
    bool pressed;
    double dx;
    double dy;
};

// Global monitor state
static napi_threadsafe_function ts_fn = nullptr;
static std::thread monitor_thread;
static CFRunLoopRef run_loop = nullptr;
static CFMachPortRef event_tap = nullptr;
static CFRunLoopSourceRef run_loop_source = nullptr;
static std::atomic<bool> g_active{false};

static std::atomic<int> target_pps{20};
static double last_move_time = 0.0;

// Thread-safe function callback executing on Node JS main thread
static void call_js(napi_env env, napi_value js_cb, void* context, void* data) {
    MouseEvent* ev = static_cast<MouseEvent*>(data);
    if (!ev) return;

    if (env && js_cb) {
        napi_value event_obj = nullptr;
        napi_create_object(env, &event_obj);

        napi_value type_val = nullptr;
        napi_create_string_utf8(env, ev->type.c_str(), NAPI_AUTO_LENGTH, &type_val);
        napi_set_named_property(env, event_obj, "type", type_val);

        napi_value data_obj = nullptr;
        napi_create_object(env, &data_obj);

        napi_value x_val = nullptr, y_val = nullptr;
        napi_create_int32(env, ev->x, &x_val);
        napi_create_int32(env, ev->y, &y_val);
        napi_set_named_property(env, data_obj, "x", x_val);
        napi_set_named_property(env, data_obj, "y", y_val);

        if (ev->type == "mouseClick") {
            napi_value btn_val = nullptr, pressed_val = nullptr;
            napi_create_string_utf8(env, ev->button.c_str(), NAPI_AUTO_LENGTH, &btn_val);
            napi_get_boolean(env, ev->pressed, &pressed_val);
            napi_set_named_property(env, data_obj, "button", btn_val);
            napi_set_named_property(env, data_obj, "pressed", pressed_val);
        } else if (ev->type == "mouseScroll") {
            napi_value dx_val = nullptr, dy_val = nullptr;
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
    }

    delete ev;
}

// Global mouse event tap callback (Passive listener)
static CGEventRef event_tap_callback(
    CGEventTapProxy proxy,
    CGEventType type,
    CGEventRef event,
    void* refcon
) {
    if (type == kCGEventTapDisabledByTimeout || type == kCGEventTapDisabledByUserInput) {
        if (event_tap) CGEventTapEnable(event_tap, true);
        return event;
    }

    if (!g_active.load()) return event;

    CGPoint location = CGEventGetLocation(event);
    MouseEvent* ev = nullptr;

    if (type == kCGEventMouseMoved || type == kCGEventLeftMouseDragged ||
        type == kCGEventRightMouseDragged || type == kCGEventOtherMouseDragged) {
        
        struct timeval tv;
        gettimeofday(&tv, NULL);
        double now = tv.tv_sec + tv.tv_usec / 1000000.0;

        int pps = target_pps.load();
        if (pps <= 0) pps = 20;
        double min_interval = 1.0 / (double)pps;
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
        napi_status status = napi_call_threadsafe_function(ts_fn, ev, napi_tsfn_nonblocking);
        if (status != napi_ok) {
            delete ev;
        }
    }

    return event;
}

// Background thread loop
static void run_monitor_loop() {
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

    // Passive listener to NEVER block or intercept system mouse events
    event_tap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionListenOnly,
        event_mask,
        event_tap_callback,
        nullptr
    );

    if (!event_tap) {
        std::cerr << "[MouseMonitor] Failed to create CGEventTap." << std::endl;
        g_active.store(false);
        return;
    }

    run_loop = CFRunLoopGetCurrent();
    run_loop_source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, event_tap, 0);
    CFRunLoopAddSource(run_loop, run_loop_source, kCFRunLoopDefaultMode);
    CGEventTapEnable(event_tap, true);

    CFRunLoopRun();
}

static napi_value Start(napi_env env, napi_callback_info info) {
    if (g_active.load()) {
        napi_value success;
        napi_get_boolean(env, true, &success);
        return success;
    }

    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required as first argument");
        return nullptr;
    }

    napi_value js_cb = args[0];

    if (argc > 1) {
        int pps = 20;
        napi_get_value_int32(env, args[1], &pps);
        if (pps <= 0) pps = 20;
        target_pps.store(pps);
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

    g_active.store(true);
    monitor_thread = std::thread(run_monitor_loop);

    napi_value success;
    napi_get_boolean(env, true, &success);
    return success;
}

static napi_value Stop(napi_env env, napi_callback_info info) {
    if (!g_active.load()) {
        napi_value success;
        napi_get_boolean(env, true, &success);
        return success;
    }

    g_active.store(false);

    if (event_tap) {
        CGEventTapEnable(event_tap, false);
    }

    if (run_loop) {
        CFRunLoopStop(run_loop);
        CFRunLoopWakeUp(run_loop);
    }

    if (monitor_thread.joinable()) {
        monitor_thread.join();
    }

    if (event_tap) {
        CFRelease(event_tap);
        event_tap = nullptr;
    }

    if (run_loop_source) {
        CFRelease(run_loop_source);
        run_loop_source = nullptr;
    }
    run_loop = nullptr;

    if (ts_fn) {
        napi_release_threadsafe_function(ts_fn, napi_tsfn_release);
        ts_fn = nullptr;
    }

    napi_value success;
    napi_get_boolean(env, true, &success);
    return success;
}

static napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
