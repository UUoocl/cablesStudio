#include <node_api.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <thread>
#include <mutex>
#include <string>
#include <vector>
#include <unordered_map>
#include <iostream>

struct KeyboardEvent {
    std::string event; // "press" or "release"
    std::string key;
    std::string modifiers;
    std::string combo;
};

// Global monitor state
napi_threadsafe_function ts_fn = nullptr;
std::thread monitor_thread;
CFRunLoopRef run_loop = nullptr;
CFMachPortRef event_tap = nullptr;
CFRunLoopSourceRef run_loop_source = nullptr;
bool active = false;

bool is_ctrl_pressed = false;
bool is_alt_pressed = false;
bool is_shift_pressed = false;
bool is_cmd_pressed = false;

std::mutex state_mutex;

// Standard Cables keycode mapping matching the Swift keyCodeMap
const std::unordered_map<int, std::string> keyCodeMap = {
    {0, "a"}, {1, "s"}, {2, "d"}, {3, "f"}, {4, "h"}, {5, "g"}, {6, "z"}, {7, "x"}, {8, "c"}, {9, "v"},
    {11, "b"}, {12, "q"}, {13, "w"}, {14, "e"}, {15, "r"}, {16, "y"}, {17, "t"}, {18, "1"}, {19, "2"},
    {20, "3"}, {21, "4"}, {22, "6"}, {23, "5"}, {24, "="}, {25, "9"}, {26, "7"}, {27, "-"}, {28, "8"},
    {29, "0"}, {30, "]"}, {31, "o"}, {32, "u"}, {33, "["}, {34, "i"}, {35, "p"}, {36, "return"}, {37, "l"},
    {38, "j"}, {39, "'"}, {40, "k"}, {41, ";"}, {42, "\\"}, {43, ","}, {44, "/"}, {45, "n"}, {46, "m"},
    {47, "."}, {48, "tab"}, {49, "space"}, {50, "`"}, {51, "delete"}, {52, "enter"}, {53, "escape"},
    {64, "f17"}, {65, "."}, {67, "*"}, {69, "+"}, {71, "clear"}, {75, "/"}, {76, "enter"}, {78, "-"},
    {79, "f18"}, {80, "f19"}, {81, "="}, {82, "0"}, {83, "1"}, {84, "2"}, {85, "3"}, {86, "4"}, {87, "5"},
    {88, "6"}, {89, "7"}, {90, "f20"}, {91, "8"}, {92, "9"}, {96, "f5"}, {97, "f6"}, {98, "f7"}, {99, "f3"},
    {100, "f8"}, {101, "f9"}, {103, "f11"}, {105, "f13"}, {106, "f16"}, {107, "f14"}, {109, "f10"},
    {111, "f12"}, {113, "f15"}, {115, "home"}, {116, "pageup"}, {117, "delete"}, {118, "f4"}, {119, "end"},
    {120, "f2"}, {121, "pagedown"}, {122, "f1"}, {123, "left"}, {124, "right"}, {125, "down"}, {126, "up"}
};

// Thread-safe function callback executing on Node JS main thread
void call_js(napi_env env, napi_value js_cb, void* context, void* data) {
    KeyboardEvent* ev = static_cast<KeyboardEvent*>(data);
    if (!ev) return;

    napi_value event_obj = nullptr;
    napi_create_object(env, &event_obj);

    napi_value event_val = nullptr;
    napi_create_string_utf8(env, ev->event.c_str(), NAPI_AUTO_LENGTH, &event_val);
    napi_set_named_property(env, event_obj, "event", event_val);

    napi_value key_val = nullptr;
    napi_create_string_utf8(env, ev->key.c_str(), NAPI_AUTO_LENGTH, &key_val);
    napi_set_named_property(env, event_obj, "key", key_val);

    napi_value modifiers_val = nullptr;
    napi_create_string_utf8(env, ev->modifiers.c_str(), NAPI_AUTO_LENGTH, &modifiers_val);
    napi_set_named_property(env, event_obj, "modifiers", modifiers_val);

    napi_value combo_val = nullptr;
    napi_create_string_utf8(env, ev->combo.c_str(), NAPI_AUTO_LENGTH, &combo_val);
    napi_set_named_property(env, event_obj, "combo", combo_val);

    napi_value undefined = nullptr;
    napi_get_undefined(env, &undefined);
    napi_value result = nullptr;
    napi_call_function(env, undefined, js_cb, 1, &event_obj, &result);

    delete ev;
}

// Global CGEventTap callback
CGEventRef event_tap_callback(
    CGEventTapProxy proxy,
    CGEventType type,
    CGEventRef event,
    void* refcon
) {
    if (!active) return event;

    if (type == kCGEventFlagsChanged) {
        CGEventFlags flags = CGEventGetFlags(event);
        std::lock_guard<std::mutex> lock(state_mutex);
        is_ctrl_pressed = (flags & kCGEventFlagMaskControl) != 0;
        is_alt_pressed = (flags & kCGEventFlagMaskAlternate) != 0;
        is_shift_pressed = (flags & kCGEventFlagMaskShift) != 0;
        is_cmd_pressed = (flags & kCGEventFlagMaskCommand) != 0;
    } else if (type == kCGEventKeyDown || type == kCGEventKeyUp) {
        int64_t key_code = CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode);
        
        auto it = keyCodeMap.find((int)key_code);
        std::string key_str = (it != keyCodeMap.end()) ? it->second : "Key_" + std::to_string(key_code);

        std::lock_guard<std::mutex> lock(state_mutex);
        std::vector<std::string> mod_parts;
        if (is_ctrl_pressed) mod_parts.push_back("ctrl");
        if (is_alt_pressed) mod_parts.push_back("alt");
        if (is_shift_pressed) mod_parts.push_back("shift");
        if (is_cmd_pressed) mod_parts.push_back("cmd");

        std::string modifiers_str = "";
        for (size_t i = 0; i < mod_parts.size(); ++i) {
            if (i > 0) modifiers_str += " + ";
            modifiers_str += mod_parts[i];
        }

        std::string combo_str = modifiers_str;
        if (!combo_str.empty()) {
            combo_str += " + " + key_str;
        } else {
            combo_str = key_str;
        }

        KeyboardEvent* ev = new KeyboardEvent();
        ev->event = (type == kCGEventKeyDown) ? "press" : "release";
        ev->key = key_str;
        ev->modifiers = modifiers_str;
        ev->combo = combo_str;

        if (ts_fn) {
            napi_status status = napi_call_threadsafe_function(ts_fn, ev, napi_tsfn_blocking);
            if (status != napi_ok) {
                delete ev;
            }
        }
    }

    return event;
}

// Background thread loop
void run_monitor_loop() {
    CGEventMask event_mask =
        (1ULL << kCGEventKeyDown) |
        (1ULL << kCGEventKeyUp) |
        (1ULL << kCGEventFlagsChanged);

    event_tap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionDefault,
        event_mask,
        event_tap_callback,
        nullptr
    );

    if (!event_tap) {
        std::cerr << "[KeyboardMonitor] Failed to create CGEventTap." << std::endl;
        return;
    }

    run_loop = CFRunLoopGetCurrent();
    run_loop_source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, event_tap, 0);
    CFRunLoopAddSource(run_loop, run_loop_source, kCFRunLoopDefaultMode);
    CGEventTapEnable(event_tap, true);

    CFRunLoopRun();
}

napi_value Start(napi_env env, napi_callback_info info) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (active) return nullptr;

    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }

    napi_value js_cb = args[0];

    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "KeyboardMonitorThread", NAPI_AUTO_LENGTH, &resource_name);

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

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
