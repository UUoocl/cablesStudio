#include <node_api.h>
#import <Foundation/Foundation.h>
#import "UVCController.h"
#import "UVCType.h"
#import "UVCValue.h"
#include <vector>
#include <string>
#include <algorithm>
#include <iostream>

static UVCController* g_activeDevice = nil;

// Helper to convert V8 values to UVC representation C-strings
std::string V8ValueToUvcString(napi_env env, napi_value val) {
    napi_valuetype type;
    napi_typeof(env, val, &type);
    
    if (type == napi_boolean) {
        bool b = false;
        napi_get_value_bool(env, val, &b);
        return b ? "1" : "0";
    } else if (type == napi_number) {
        double d = 0;
        napi_get_value_double(env, val, &d);
        char buf[64];
        snprintf(buf, sizeof(buf), "%g", d);
        return buf;
    } else if (type == napi_string) {
        char buf[512] = "";
        size_t len = 0;
        napi_get_value_string_utf8(env, val, buf, sizeof(buf), &len);
        return buf;
    } else if (type == napi_object) {
        bool is_array = false;
        napi_is_array(env, val, &is_array);
        if (is_array) {
            uint32_t len = 0;
            napi_get_array_length(env, val, &len);
            std::string res = "{";
            for (uint32_t i = 0; i < len; ++i) {
                napi_value item = nullptr;
                napi_get_element(env, val, i, &item);
                res += V8ValueToUvcString(env, item);
                if (i < len - 1) res += ",";
            }
            res += "}";
            return res;
        } else {
            napi_value keys = nullptr;
            napi_get_property_names(env, val, &keys);
            uint32_t len = 0;
            napi_get_array_length(env, keys, &len);
            
            std::vector<std::string> sorted_keys;
            for (uint32_t i = 0; i < len; ++i) {
                napi_value key_val = nullptr;
                napi_get_element(env, keys, i, &key_val);
                char k_buf[128] = "";
                size_t k_len = 0;
                napi_get_value_string_utf8(env, key_val, k_buf, sizeof(k_buf), &k_len);
                sorted_keys.push_back(k_buf);
            }
            std::sort(sorted_keys.begin(), sorted_keys.end());
            
            std::string res = "{";
            for (size_t i = 0; i < sorted_keys.size(); ++i) {
                napi_value prop = nullptr;
                napi_get_named_property(env, val, sorted_keys[i].c_str(), &prop);
                res += V8ValueToUvcString(env, prop);
                if (i < sorted_keys.size() - 1) res += ",";
            }
            res += "}";
            return res;
        }
    }
    return "";
}

// Helper to convert UVCValue to V8 structures
napi_value V8FromUVCValue(napi_env env, UVCValue* val) {
    if (!val) return nullptr;
    NSString* str = [val stringValue];
    if (!str) return nullptr;
    
    if ([str hasPrefix:@"{"] && [str hasSuffix:@"}"]) {
        napi_value obj = nullptr;
        napi_create_object(env, &obj);
        
        NSString* cleaned = [str substringWithRange:NSMakeRange(1, str.length - 2)];
        NSArray* parts = [cleaned componentsSeparatedByString:@","];
        for (NSString* part in parts) {
            NSArray* kv = [part componentsSeparatedByString:@"="];
            if (kv.count == 2) {
                NSString* k = [kv[0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                NSString* vStr = [kv[1] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                double v = [vStr doubleValue];
                
                napi_value num_val = nullptr;
                napi_create_double(env, v, &num_val);
                napi_set_named_property(env, obj, [k UTF8String], num_val);
            }
        }
        return obj;
    }
    
    NSScanner* scanner = [NSScanner scannerWithString:str];
    double doubleVal;
    if ([scanner scanDouble:&doubleVal] && [scanner isAtEnd]) {
        napi_value num_val = nullptr;
        napi_create_double(env, doubleVal, &num_val);
        return num_val;
    }
    
    napi_value str_val = nullptr;
    napi_create_string_utf8(env, [str UTF8String], NAPI_AUTO_LENGTH, &str_val);
    return str_val;
}

// Helper to serialize UVCControl to JavaScript object
napi_value V8FromUVCControl(napi_env env, UVCControl* control) {
    napi_value dict = nullptr;
    napi_create_object(env, &dict);
    
    NSString* name = [control controlName] ?: @"";
    napi_value name_val = nullptr;
    napi_create_string_utf8(env, [name UTF8String], NAPI_AUTO_LENGTH, &name_val);
    napi_set_named_property(env, dict, "name", name_val);
    
    napi_value get_val = nullptr;
    napi_get_boolean(env, (bool)[control supportsGetValue], &get_val);
    napi_set_named_property(env, dict, "supportsGet", get_val);
    
    napi_value set_val = nullptr;
    napi_get_boolean(env, (bool)[control supportsSetValue], &set_val);
    napi_set_named_property(env, dict, "supportsSet", set_val);
    
    napi_value range_val = nullptr;
    napi_get_boolean(env, (bool)[control hasRange], &range_val);
    napi_set_named_property(env, dict, "hasRange", range_val);
    
    napi_value step_val = nullptr;
    napi_get_boolean(env, (bool)[control hasStepSize], &step_val);
    napi_set_named_property(env, dict, "hasStepSize", step_val);
    
    napi_value def_val = nullptr;
    napi_get_boolean(env, (bool)[control hasDefaultValue], &def_val);
    napi_set_named_property(env, dict, "hasDefaultValue", def_val);
    
    if ([control supportsGetValue]) {
        UVCValue* curr = [control currentValue];
        if (curr) {
            napi_value curr_val = V8FromUVCValue(env, curr);
            if (curr_val) napi_set_named_property(env, dict, "current-value", curr_val);
        }
    }
    if ([control hasRange]) {
        UVCValue* minVal = [control minimum];
        if (minVal) {
            napi_value min_v = V8FromUVCValue(env, minVal);
            if (min_v) napi_set_named_property(env, dict, "minimum", min_v);
        }
        UVCValue* maxVal = [control maximum];
        if (maxVal) {
            napi_value max_v = V8FromUVCValue(env, maxVal);
            if (max_v) napi_set_named_property(env, dict, "maximum", max_v);
        }
    }
    if ([control hasStepSize]) {
        UVCValue* stepVal = [control stepSize];
        if (stepVal) {
            napi_value step_v = V8FromUVCValue(env, stepVal);
            if (step_v) napi_set_named_property(env, dict, "step-size", step_v);
        }
    }
    if ([control hasDefaultValue]) {
        UVCValue* defVal = [control defaultValue];
        if (defVal) {
            napi_value def_v = V8FromUVCValue(env, defVal);
            if (def_v) napi_set_named_property(env, dict, "default-value", def_v);
        }
    }
    
    return dict;
}

// Exports: listDevices() -> Array<Device>
napi_value ListDevices(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        NSArray* controllers = [UVCController uvcControllers];
        napi_value js_array = nullptr;
        napi_create_array_with_length(env, controllers ? controllers.count : 0, &js_array);
        
        if (controllers) {
            for (NSUInteger i = 0; i < controllers.count; ++i) {
                UVCController* ctrl = controllers[i];
                napi_value dev_obj = nullptr;
                napi_create_object(env, &dev_obj);
                
                napi_value name_val = nullptr;
                napi_create_string_utf8(env, [[ctrl deviceName] UTF8String] ?: "Unknown Camera", NAPI_AUTO_LENGTH, &name_val);
                napi_set_named_property(env, dev_obj, "name", name_val);
                
                napi_value idx_val = nullptr;
                napi_create_int32(env, (int32_t)i, &idx_val);
                napi_set_named_property(env, dev_obj, "index", idx_val);
                
                napi_value vid_val = nullptr;
                napi_create_int32(env, (int32_t)[ctrl vendorId], &vid_val);
                napi_set_named_property(env, dev_obj, "vendorId", vid_val);
                
                napi_value pid_val = nullptr;
                napi_create_int32(env, (int32_t)[ctrl productId], &pid_val);
                napi_set_named_property(env, dev_obj, "productId", pid_val);
                
                napi_value loc_val = nullptr;
                napi_create_int64(env, (int64_t)[ctrl locationId], &loc_val);
                napi_set_named_property(env, dev_obj, "locationId", loc_val);
                
                napi_set_element(env, js_array, i, dev_obj);
            }
        }
        return js_array;
    }
}

// Exports: openDevice(index) -> Boolean
napi_value OpenDevice(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Device index required");
        return nullptr;
    }
    
    int32_t index = 0;
    napi_get_value_int32(env, args[0], &index);
    
    @autoreleasepool {
        NSArray* controllers = [UVCController uvcControllers];
        if (!controllers || index < 0 || index >= (int32_t)controllers.count) {
            napi_value ret_false = nullptr;
            napi_get_boolean(env, false, &ret_false);
            return ret_false;
        }
        
        if (g_activeDevice) {
            [g_activeDevice setIsInterfaceOpen:NO];
            g_activeDevice = nil;
        }
        
        g_activeDevice = controllers[index];
        [g_activeDevice setIsInterfaceOpen:YES];
        
        napi_value ret_true = nullptr;
        napi_get_boolean(env, true, &ret_true);
        return ret_true;
    }
}

// Exports: closeDevice()
napi_value CloseDevice(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        if (g_activeDevice) {
            [g_activeDevice setIsInterfaceOpen:NO];
            g_activeDevice = nil;
        }
    }
    return nullptr;
}

// Exports: getControls() -> Array<Control>
napi_value GetControls(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        if (!g_activeDevice) {
            napi_throw_error(env, nullptr, "No active UVC device open");
            return nullptr;
        }
        
        if (![g_activeDevice isInterfaceOpen]) {
            [g_activeDevice setIsInterfaceOpen:YES];
        }
        
        NSArray* names = [UVCController controlStrings];
        napi_value js_array = nullptr;
        napi_create_array_with_length(env, names.count, &js_array);
        
        for (NSUInteger i = 0; i < names.count; ++i) {
            NSString* name = names[i];
            UVCControl* ctrl = [g_activeDevice controlWithName:name];
            if (ctrl) {
                napi_value ctrl_obj = V8FromUVCControl(env, ctrl);
                napi_set_element(env, js_array, i, ctrl_obj);
            }
        }
        return js_array;
    }
}

// Exports: getValue(controlName) -> Value
napi_value GetValue(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Control name required");
        return nullptr;
    }
    
    char name_buf[128] = "";
    size_t name_len = 0;
    napi_get_value_string_utf8(env, args[0], name_buf, sizeof(name_buf), &name_len);
    
    @autoreleasepool {
        if (!g_activeDevice) {
            napi_throw_error(env, nullptr, "No active UVC device open");
            return nullptr;
        }
        
        NSString* ctrlName = [NSString stringWithUTF8String:name_buf];
        UVCControl* ctrl = [g_activeDevice controlWithName:ctrlName];
        if (!ctrl) {
            napi_throw_error(env, nullptr, "Control not found or not supported");
            return nullptr;
        }
        
        if (![ctrl supportsGetValue]) {
            napi_throw_error(env, nullptr, "Control does not support reading values");
            return nullptr;
        }
        
        UVCValue* val = [ctrl currentValue];
        if (!val) {
            return nullptr;
        }
        
        return V8FromUVCValue(env, val);
    }
}

// Exports: setValue(controlName, value) -> Boolean
napi_value SetValue(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Control name and value required");
        return nullptr;
    }
    
    char name_buf[128] = "";
    size_t name_len = 0;
    napi_get_value_string_utf8(env, args[0], name_buf, sizeof(name_buf), &name_len);
    
    std::string valStr = V8ValueToUvcString(env, args[1]);
    
    @autoreleasepool {
        if (!g_activeDevice) {
            napi_throw_error(env, nullptr, "No active UVC device open");
            return nullptr;
        }
        
        NSString* ctrlName = [NSString stringWithUTF8String:name_buf];
        UVCControl* ctrl = [g_activeDevice controlWithName:ctrlName];
        if (!ctrl) {
            napi_throw_error(env, nullptr, "Control not found or not supported");
            return nullptr;
        }
        
        if (![ctrl supportsSetValue]) {
            napi_throw_error(env, nullptr, "Control does not support setting values");
            return nullptr;
        }
        
        BOOL success = NO;
        if ([ctrl setCurrentValueFromCString:valStr.c_str() flags:kUVCTypeScanFlagShowWarnings]) {
            success = [ctrl writeFromCurrentValue];
        }
        
        napi_value ret = nullptr;
        napi_get_boolean(env, (bool)success, &ret);
        return ret;
    }
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "listDevices", nullptr, ListDevices, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "openDevice", nullptr, OpenDevice, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "closeDevice", nullptr, CloseDevice, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "getControls", nullptr, GetControls, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "getValue", nullptr, GetValue, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setValue", nullptr, SetValue, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
