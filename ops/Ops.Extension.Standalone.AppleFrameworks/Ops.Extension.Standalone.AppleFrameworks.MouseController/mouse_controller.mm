#include <node_api.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <string>
#include <iostream>

napi_value Emit(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Object argument required");
        return nullptr;
    }

    napi_value obj = args[0];

    napi_valuetype valuetype;
    napi_typeof(env, obj, &valuetype);
    if (valuetype != napi_object) {
        napi_throw_type_error(env, nullptr, "Argument must be an object");
        return nullptr;
    }

    // Get target coordinates or current cursor position
    double target_x = 0;
    double target_y = 0;
    bool has_x = false;
    bool has_y = false;

    napi_value x_val = nullptr;
    napi_get_named_property(env, obj, "x", &x_val);
    napi_typeof(env, x_val, &valuetype);
    if (valuetype == napi_number) {
        napi_get_value_double(env, x_val, &target_x);
        has_x = true;
    }

    napi_value y_val = nullptr;
    napi_get_named_property(env, obj, "y", &y_val);
    napi_typeof(env, y_val, &valuetype);
    if (valuetype == napi_number) {
        napi_get_value_double(env, y_val, &target_y);
        has_y = true;
    }

    CGPoint current_pos = CGPointZero;
    CGEventRef current_event = CGEventCreate(nullptr);
    if (current_event) {
        current_pos = CGEventGetLocation(current_event);
        CFRelease(current_event);
    }

    if (!has_x) target_x = current_pos.x;
    if (!has_y) target_y = current_pos.y;
    CGPoint target_pos = CGPointMake(target_x, target_y);

    // Get button and action
    char button_buf[32] = {0};
    napi_value button_val = nullptr;
    napi_get_named_property(env, obj, "button", &button_val);
    napi_typeof(env, button_val, &valuetype);
    if (valuetype == napi_string) {
        size_t copied = 0;
        napi_get_value_string_utf8(env, button_val, button_buf, sizeof(button_buf), &copied);
    }
    std::string button_str(button_buf);

    char action_buf[32] = {0};
    napi_value action_val = nullptr;
    napi_get_named_property(env, obj, "action", &action_val);
    napi_typeof(env, action_val, &valuetype);
    if (valuetype == napi_string) {
        size_t copied = 0;
        napi_get_value_string_utf8(env, action_val, action_buf, sizeof(action_buf), &copied);
    }
    std::string action_str(action_buf);

    // Get scrolls
    double scroll_x = 0;
    double scroll_y = 0;

    napi_value scroll_x_val = nullptr;
    napi_get_named_property(env, obj, "scrollX", &scroll_x_val);
    napi_typeof(env, scroll_x_val, &valuetype);
    if (valuetype == napi_number) {
        napi_get_value_double(env, scroll_x_val, &scroll_x);
    }

    napi_value scroll_y_val = nullptr;
    napi_get_named_property(env, obj, "scrollY", &scroll_y_val);
    napi_typeof(env, scroll_y_val, &valuetype);
    if (valuetype == napi_number) {
        napi_get_value_double(env, scroll_y_val, &scroll_y);
    }

    // 1. Emitting Scroll
    if (scroll_x != 0 || scroll_y != 0) {
        CGEventRef scroll_event = CGEventCreateScrollWheelEvent(
            nullptr,
            kCGScrollEventUnitLine,
            2,
            (int32_t)scroll_y,
            (int32_t)scroll_x
        );
        if (scroll_event) {
            CGEventPost(kCGHIDEventTap, scroll_event);
            CFRelease(scroll_event);
        } else {
            napi_throw_error(env, nullptr, "Failed to create CGEvent scroll wheel event");
            return nullptr;
        }
    }

    // 2. Emitting Mouse action
    if (!action_str.empty() || has_x || has_y) {
        CGMouseButton cg_button = kCGMouseButtonLeft;
        CGEventType down_type = kCGEventLeftMouseDown;
        CGEventType up_type = kCGEventLeftMouseUp;
        CGEventType drag_type = kCGEventLeftMouseDragged;

        if (button_str == "right") {
            cg_button = kCGMouseButtonRight;
            down_type = kCGEventRightMouseDown;
            up_type = kCGEventRightMouseUp;
            drag_type = kCGEventRightMouseDragged;
        } else if (button_str == "middle") {
            cg_button = kCGMouseButtonCenter;
            down_type = kCGEventOtherMouseDown;
            up_type = kCGEventOtherMouseUp;
            drag_type = kCGEventOtherMouseDragged;
        }

        CGEventRef event = nullptr;

        if (action_str == "down") {
            event = CGEventCreateMouseEvent(nullptr, down_type, target_pos, cg_button);
        } else if (action_str == "up") {
            event = CGEventCreateMouseEvent(nullptr, up_type, target_pos, cg_button);
        } else if (action_str == "drag") {
            event = CGEventCreateMouseEvent(nullptr, drag_type, target_pos, cg_button);
        } else if (action_str == "move" || (action_str.empty() && (has_x || has_y))) {
            event = CGEventCreateMouseEvent(nullptr, kCGEventMouseMoved, target_pos, kCGMouseButtonLeft);
        }

        if (event) {
            CGEventPost(kCGHIDEventTap, event);
            CFRelease(event);
        } else if (!action_str.empty()) {
            napi_throw_error(env, nullptr, "Failed to create CGEvent mouse event");
            return nullptr;
        }
    }

    // Return successfully emitted values
    napi_value result = nullptr;
    napi_create_object(env, &result);

    napi_value out_x = nullptr;
    napi_value out_y = nullptr;
    napi_create_double(env, target_pos.x, &out_x);
    napi_create_double(env, target_pos.y, &out_y);
    napi_set_named_property(env, result, "x", out_x);
    napi_set_named_property(env, result, "y", out_y);

    if (!button_str.empty()) {
        napi_value out_btn = nullptr;
        napi_create_string_utf8(env, button_str.c_str(), NAPI_AUTO_LENGTH, &out_btn);
        napi_set_named_property(env, result, "button", out_btn);
    }
    if (!action_str.empty()) {
        napi_value out_act = nullptr;
        napi_create_string_utf8(env, action_str.c_str(), NAPI_AUTO_LENGTH, &out_act);
        napi_set_named_property(env, result, "action", out_act);
    }
    if (scroll_x != 0) {
        napi_value out_sx = nullptr;
        napi_create_double(env, scroll_x, &out_sx);
        napi_set_named_property(env, result, "scrollX", out_sx);
    }
    if (scroll_y != 0) {
        napi_value out_sy = nullptr;
        napi_create_double(env, scroll_y, &out_sy);
        napi_set_named_property(env, result, "scrollY", out_sy);
    }

    return result;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "emit", nullptr, Emit, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
