#include <node_api.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <cctype>

// Global key to CGKeyCode map matching standard Cables names
const std::unordered_map<std::string, CGKeyCode> keyToKeyCode = {
    {"a", 0}, {"s", 1}, {"d", 2}, {"f", 3}, {"h", 4}, {"g", 5}, {"z", 6}, {"x", 7}, {"c", 8}, {"v", 9},
    {"b", 11}, {"q", 12}, {"w", 13}, {"e", 14}, {"r", 15}, {"y", 16}, {"t", 17}, {"1", 18}, {"2", 19},
    {"3", 20}, {"4", 21}, {"6", 22}, {"5", 23}, {"=", 24}, {"9", 25}, {"7", 26}, {"-", 27}, {"8", 28},
    {"0", 29}, {"]", 30}, {"o", 31}, {"u", 32}, {"[", 33}, {"i", 34}, {"p", 35}, {"return", 36}, {"l", 37},
    {"j", 38}, {"'", 39}, {"k", 40}, {";", 41}, {"\\", 42}, {",", 43}, {"/", 44}, {"n", 45}, {"m", 46},
    {".", 47}, {"tab", 48}, {"space", 49}, {"`", 50}, {"delete", 51}, {"enter", 76}, {"escape", 53}, {"esc", 53},
    {"f17", 64}, {"clear", 71},
    {"f18", 79}, {"f19", 80}, {"f20", 90}, {"f5", 96}, {"f6", 97}, {"f7", 98}, {"f3", 99},
    {"f8", 100}, {"f9", 101}, {"f11", 103}, {"f13", 105}, {"f16", 106}, {"f14", 107}, {"f10", 109},
    {"f12", 111}, {"f15", 113}, {"home", 115}, {"pageup", 116}, {"pgup", 116}, {"end", 119},
    {"f4", 118}, {"f2", 120}, {"pagedown", 121}, {"pgdn", 121}, {"f1", 122}, {"left", 123}, {"right", 124}, {"down", 125}, {"up", 126}
};

CGEventFlags parseModifiers(const std::string& modifierStr) {
    CGEventFlags flags = 0;
    std::string lowerStr = modifierStr;
    std::transform(lowerStr.begin(), lowerStr.end(), lowerStr.begin(), ::tolower);

    if (lowerStr.find("cmd") != std::string::npos || lowerStr.find("command") != std::string::npos) {
        flags |= kCGEventFlagMaskCommand;
    }
    if (lowerStr.find("shift") != std::string::npos) {
        flags |= kCGEventFlagMaskShift;
    }
    if (lowerStr.find("alt") != std::string::npos || lowerStr.find("option") != std::string::npos || lowerStr.find("opt") != std::string::npos) {
        flags |= kCGEventFlagMaskAlternate;
    }
    if (lowerStr.find("ctrl") != std::string::npos || lowerStr.find("control") != std::string::npos) {
        flags |= kCGEventFlagMaskControl;
    }

    return flags;
}

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

    // Get key
    char key_buf[64] = {0};
    napi_value key_val = nullptr;
    napi_get_named_property(env, obj, "key", &key_val);
    napi_typeof(env, key_val, &valuetype);
    if (valuetype != napi_string) {
        napi_throw_type_error(env, nullptr, "Key must be a string");
        return nullptr;
    }
    size_t copied = 0;
    napi_get_value_string_utf8(env, key_val, key_buf, sizeof(key_buf), &copied);
    std::string key_str(key_buf);

    std::string normalized_key = key_str;
    std::transform(normalized_key.begin(), normalized_key.end(), normalized_key.begin(), ::tolower);

    // Trim whitespace
    normalized_key.erase(normalized_key.begin(), std::find_if(normalized_key.begin(), normalized_key.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
    normalized_key.erase(std::find_if(normalized_key.rbegin(), normalized_key.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), normalized_key.end());

    auto it = keyToKeyCode.find(normalized_key);
    if (it == keyToKeyCode.end()) {
        std::string err_msg = "Unknown key: '" + key_str + "'";
        napi_throw_error(env, nullptr, err_msg.c_str());
        return nullptr;
    }
    CGKeyCode key_code = it->second;

    // Get modifiers
    char modifiers_buf[128] = {0};
    napi_value modifiers_val = nullptr;
    napi_get_named_property(env, obj, "modifiers", &modifiers_val);
    napi_typeof(env, modifiers_val, &valuetype);
    if (valuetype == napi_string) {
        napi_get_value_string_utf8(env, modifiers_val, modifiers_buf, sizeof(modifiers_buf), &copied);
    }
    std::string modifiers_str(modifiers_buf);

    CGEventFlags flags = parseModifiers(modifiers_str);

    // Emit keyDown
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateCombinedSessionState);
    CGEventRef key_down_event = CGEventCreateKeyboardEvent(source, key_code, true);
    if (!key_down_event) {
        if (source) CFRelease(source);
        napi_throw_error(env, nullptr, "Failed to create CGEvent keyDown");
        return nullptr;
    }
    CGEventSetFlags(key_down_event, flags);
    CGEventPost(kCGHIDEventTap, key_down_event);
    CFRelease(key_down_event);

    // Emit keyUp
    CGEventRef key_up_event = CGEventCreateKeyboardEvent(source, key_code, false);
    if (!key_up_event) {
        if (source) CFRelease(source);
        napi_throw_error(env, nullptr, "Failed to create CGEvent keyUp");
        return nullptr;
    }
    CGEventSetFlags(key_up_event, flags);
    CGEventPost(kCGHIDEventTap, key_up_event);
    CFRelease(key_up_event);

    if (source) CFRelease(source);

    // Format combination combo string for return
    std::vector<std::string> combo_parts;
    std::string lower_mods = modifiers_str;
    std::transform(lower_mods.begin(), lower_mods.end(), lower_mods.begin(), ::tolower);

    if (lower_mods.find("ctrl") != std::string::npos || lower_mods.find("control") != std::string::npos) combo_parts.push_back("ctrl");
    if (lower_mods.find("alt") != std::string::npos || lower_mods.find("option") != std::string::npos || lower_mods.find("opt") != std::string::npos) combo_parts.push_back("alt");
    if (lower_mods.find("shift") != std::string::npos) combo_parts.push_back("shift");
    if (lower_mods.find("cmd") != std::string::npos || lower_mods.find("command") != std::string::npos) combo_parts.push_back("cmd");
    combo_parts.push_back(normalized_key);

    std::string combo_str = "";
    for (size_t i = 0; i < combo_parts.size(); ++i) {
        if (i > 0) combo_str += " + ";
        combo_str += combo_parts[i];
    }

    napi_value result = nullptr;
    napi_create_object(env, &result);

    napi_value combo_val = nullptr;
    napi_create_string_utf8(env, combo_str.c_str(), NAPI_AUTO_LENGTH, &combo_val);
    napi_set_named_property(env, result, "combo", combo_val);

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
