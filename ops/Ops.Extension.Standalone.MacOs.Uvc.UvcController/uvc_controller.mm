#include <node_api.h>
#import <Foundation/Foundation.h>
#import "UVCController.h"
#import "UVCType.h"
#import "UVCValue.h"

#include <string>
#include <vector>
#include <map>
#include <thread>
#include <atomic>
#include <mutex>
#include <chrono>
#include <sstream>
#include <iostream>

struct UvcCallbackPayload {
    std::string jsonPayload;
};

static std::mutex g_mutex;
static UVCController* g_active_controller = nil;
static std::string g_active_device_name = "";
static int g_active_device_index = -1;

static std::thread g_polling_thread;
static std::atomic<bool> g_polling_running{false};
static std::atomic<int> g_poll_interval_ms{33}; // ~30 fps
static std::atomic<bool> g_normalize{false};
static napi_threadsafe_function g_ts_fn = nullptr;

// Helper: Convert NSDictionary / NSArray / NSString / NSNumber to JSON std::string
static std::string ObjcToJson(id objcObj) {
    if (!objcObj) return "null";
    @autoreleasepool {
        if (![NSJSONSerialization isValidJSONObject:objcObj]) {
            if ([objcObj isKindOfClass:[NSString class]]) {
                return std::string("\"") + [(NSString*)objcObj UTF8String] + "\"";
            }
            if ([objcObj isKindOfClass:[NSNumber class]]) {
                return [[(NSNumber*)objcObj stringValue] UTF8String];
            }
            return "{}";
        }
        NSError* err = nil;
        NSData* data = [NSJSONSerialization dataWithJSONObject:objcObj options:0 error:&err];
        if (data && !err) {
            NSString* str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            std::string result = [str UTF8String];
            [str release];
            return result;
        }
        return "{}";
    }
}

// Helper: Parse UVCValue to JSON-compatible NSObject
static id ParseUvcValue(UVCValue* val) {
    if (!val) return [NSNull null];
    NSString* str = [val stringValue];
    if (!str) return [NSNull null];
    
    NSString* trimmed = [str stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([trimmed hasPrefix:@"{"] && [trimmed hasSuffix:@"}"]) {
        NSMutableDictionary* dict = [NSMutableDictionary dictionary];
        NSString* inner = [trimmed substringWithRange:NSMakeRange(1, [trimmed length] - 2)];
        NSArray* parts = [inner componentsSeparatedByString:@","];
        for (NSString* part in parts) {
            NSArray* kv = [part componentsSeparatedByString:@"="];
            if ([kv count] == 2) {
                NSString* k = [[kv objectAtIndex:0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                NSString* vStr = [[kv objectAtIndex:1] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                double num = [vStr doubleValue];
                [dict setObject:@(num) forKey:k];
            } else if ([kv count] == 1) {
                NSString* vStr = [[kv objectAtIndex:0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                double num = [vStr doubleValue];
                [dict setObject:@(num) forKey:[NSString stringWithFormat:@"val%lu", (unsigned long)[dict count]]];
            }
        }
        return dict;
    }
    
    NSScanner* scanner = [NSScanner scannerWithString:trimmed];
    double doubleVal = 0;
    if ([scanner scanDouble:&doubleVal] && [scanner isAtEnd]) {
        return @(doubleVal);
    }
    
    return trimmed;
}

static double LerpNorm(double val, double min, double max) {
    if (max == min) return 0.0;
    double res = (val - min) / (max - min);
    if (res < 0.0) res = 0.0;
    if (res > 1.0) res = 1.0;
    return std::round(res * 10000.0) / 10000.0;
}

// Threadsafe JS Callback Invoker
static void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    UvcCallbackPayload* payload = static_cast<UvcCallbackPayload*>(data);
    if (!payload) return;
    
    if (env != nullptr && js_cb != nullptr) {
        napi_value event_str = nullptr;
        napi_create_string_utf8(env, payload->jsonPayload.c_str(), NAPI_AUTO_LENGTH, &event_str);
        
        napi_value global = nullptr;
        napi_get_global(env, &global);
        
        napi_value result = nullptr;
        napi_call_function(env, global, js_cb, 1, &event_str, &result);
    }
    
    delete payload;
}

static void SendJSEvent(const std::string& jsonStr) {
    if (!g_ts_fn) return;
    
    UvcCallbackPayload* payload = new UvcCallbackPayload();
    payload->jsonPayload = jsonStr;
    
    napi_status status = napi_call_threadsafe_function(g_ts_fn, payload, napi_tsfn_nonblocking);
    if (status != napi_ok) {
        delete payload;
    }
}

// Polling thread worker
static void PollingWorker() {
    while (g_polling_running.load()) {
        @autoreleasepool {
            std::unique_lock<std::mutex> lock(g_mutex);
            if (g_active_controller && [g_active_controller isInterfaceOpen]) {
                NSMutableDictionary* propsDict = [NSMutableDictionary dictionary];
                double panVal = 0.0, tiltVal = 0.0, zoomVal = 0.0;
                bool hasPan = false, hasTilt = false, hasZoom = false;
                
                NSArray* controlNames = [UVCController controlStrings];
                for (NSString* cName in controlNames) {
                    UVCControl* ctrl = [g_active_controller controlWithName:cName];
                    if (ctrl && [ctrl supportsGetValue]) {
                        UVCValue* curVal = [ctrl currentValue];
                        if (curVal) {
                            id parsedVal = ParseUvcValue(curVal);
                            [propsDict setObject:parsedVal forKey:cName];
                            
                            // Check for Pan/Tilt
                            if ([cName isEqualToString:@"pan-tilt-absolute"] || [cName isEqualToString:@"pan-tilt-relative"]) {
                                if ([parsedVal isKindOfClass:[NSDictionary class]]) {
                                    NSDictionary* ptDict = (NSDictionary*)parsedVal;
                                    id p = [ptDict objectForKey:@"pan"];
                                    id t = [ptDict objectForKey:@"tilt"];
                                    if (p) { panVal = [p doubleValue]; hasPan = true; }
                                    if (t) { tiltVal = [t doubleValue]; hasTilt = true; }
                                    
                                    if (g_normalize.load() && [ctrl hasRange]) {
                                        UVCValue* minV = [ctrl minimum];
                                        UVCValue* maxV = [ctrl maximum];
                                        id minP = ParseUvcValue(minV);
                                        id maxP = ParseUvcValue(maxV);
                                        if ([minP isKindOfClass:[NSDictionary class]] && [maxP isKindOfClass:[NSDictionary class]]) {
                                            double pMin = [[(NSDictionary*)minP objectForKey:@"pan"] doubleValue];
                                            double pMax = [[(NSDictionary*)maxP objectForKey:@"pan"] doubleValue];
                                            double tMin = [[(NSDictionary*)minP objectForKey:@"tilt"] doubleValue];
                                            double tMax = [[(NSDictionary*)maxP objectForKey:@"tilt"] doubleValue];
                                            panVal = LerpNorm(panVal, pMin, pMax);
                                            tiltVal = LerpNorm(tiltVal, tMin, tMax);
                                        }
                                    }
                                }
                            }
                            
                            // Check for Zoom
                            if ([cName isEqualToString:@"zoom-absolute"] || [cName isEqualToString:@"zoom-relative"]) {
                                if ([parsedVal isKindOfClass:[NSNumber class]]) {
                                    zoomVal = [(NSNumber*)parsedVal doubleValue];
                                    hasZoom = true;
                                    if (g_normalize.load() && [ctrl hasRange]) {
                                        UVCValue* minV = [ctrl minimum];
                                        UVCValue* maxV = [ctrl maximum];
                                        id minP = ParseUvcValue(minV);
                                        id maxP = ParseUvcValue(maxV);
                                        if ([minP isKindOfClass:[NSNumber class]] && [maxP isKindOfClass:[NSNumber class]]) {
                                            zoomVal = LerpNorm(zoomVal, [(NSNumber*)minP doubleValue], [(NSNumber*)maxP doubleValue]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                NSMutableDictionary* eventPayload = [NSMutableDictionary dictionary];
                [eventPayload setObject:@"telemetry" forKey:@"type"];
                [eventPayload setObject:propsDict forKey:@"properties"];
                [eventPayload setObject:@(panVal) forKey:@"pan"];
                [eventPayload setObject:@(tiltVal) forKey:@"tilt"];
                [eventPayload setObject:@(zoomVal) forKey:@"zoom"];
                [eventPayload setObject:@(hasPan) forKey:@"hasPan"];
                [eventPayload setObject:@(hasTilt) forKey:@"hasTilt"];
                [eventPayload setObject:@(hasZoom) forKey:@"hasZoom"];
                
                std::string jsonStr = ObjcToJson(eventPayload);
                lock.unlock();
                
                SendJSEvent(jsonStr);
            } else {
                lock.unlock();
            }
        }
        
        int interval = g_poll_interval_ms.load();
        if (interval < 5) interval = 5;
        std::this_thread::sleep_for(std::chrono::milliseconds(interval));
    }
}

// N-API: listDevices() -> returns Array of Device Objects
static napi_value ListDevices(napi_env env, napi_callback_info info) {
    @autoreleasepool {
        NSArray* controllers = [UVCController uvcControllers];
        napi_value jsArray = nullptr;
        napi_create_array(env, &jsArray);
        
        if (!controllers) return jsArray;
        
        uint32_t index = 0;
        for (UVCController* ctrl in controllers) {
            napi_value devObj = nullptr;
            napi_create_object(env, &devObj);
            
            NSString* name = [ctrl deviceName] ?: @"Unknown Camera";
            UInt32 locId = [ctrl locationId];
            UInt16 vId = [ctrl vendorId];
            UInt16 pId = [ctrl productId];
            UInt16 uvcVer = [ctrl uvcVersion];
            
            napi_value jsName, jsIndex, jsLocId, jsVId, jsPId, jsUvcVer;
            napi_create_string_utf8(env, [name UTF8String], NAPI_AUTO_LENGTH, &jsName);
            napi_create_uint32(env, index, &jsIndex);
            napi_create_uint32(env, locId, &jsLocId);
            napi_create_uint32(env, vId, &jsVId);
            napi_create_uint32(env, pId, &jsPId);
            napi_create_uint32(env, uvcVer, &jsUvcVer);
            
            napi_set_named_property(env, devObj, "name", jsName);
            napi_set_named_property(env, devObj, "index", jsIndex);
            napi_set_named_property(env, devObj, "locationId", jsLocId);
            napi_set_named_property(env, devObj, "vendorId", jsVId);
            napi_set_named_property(env, devObj, "productId", jsPId);
            napi_set_named_property(env, devObj, "uvcVersion", jsUvcVer);
            
            napi_set_element(env, jsArray, index, devObj);
            index++;
        }
        
        return jsArray;
    }
}

// N-API: openDevice(targetIndexOrName) -> Boolean
static napi_value OpenDevice(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    std::unique_lock<std::mutex> lock(g_mutex);
    @autoreleasepool {
        if (g_active_controller) {
            [g_active_controller setIsInterfaceOpen:NO];
            [g_active_controller release];
            g_active_controller = nil;
        }
        
        NSArray* controllers = [UVCController uvcControllers];
        if (!controllers || [controllers count] == 0) {
            napi_value ret;
            napi_get_boolean(env, false, &ret);
            return ret;
        }
        
        UVCController* target = nil;
        int targetIdx = -1;
        
        if (argc >= 1) {
            napi_valuetype valType;
            napi_typeof(env, args[0], &valType);
            if (valType == napi_number) {
                int32_t idx = 0;
                napi_get_value_int32(env, args[0], &idx);
                if (idx >= 0 && idx < (int32_t)[controllers count]) {
                    target = [controllers objectAtIndex:idx];
                    targetIdx = idx;
                }
            } else if (valType == napi_string) {
                char buf[256];
                size_t copied = 0;
                napi_get_value_string_utf8(env, args[0], buf, sizeof(buf), &copied);
                NSString* searchName = [NSString stringWithUTF8String:buf];
                
                if ([searchName isEqualToString:@"default"]) {
                    target = [controllers objectAtIndex:0];
                    targetIdx = 0;
                } else {
                    for (NSUInteger i = 0; i < [controllers count]; ++i) {
                        UVCController* c = [controllers objectAtIndex:i];
                        if ([[c deviceName] isEqualToString:searchName]) {
                            target = c;
                            targetIdx = (int)i;
                            break;
                        }
                    }
                }
            }
        }
        
        if (!target) {
            target = [controllers objectAtIndex:0];
            targetIdx = 0;
        }
        
        [target retain];
        [target setIsInterfaceOpen:YES];
        
        g_active_controller = target;
        g_active_device_index = targetIdx;
        g_active_device_name = [[target deviceName] UTF8String] ?: "Unknown";
        
        napi_value ret;
        napi_get_boolean(env, [target isInterfaceOpen], &ret);
        return ret;
    }
}

// N-API: closeDevice()
static napi_value CloseDevice(napi_env env, napi_callback_info info) {
    std::unique_lock<std::mutex> lock(g_mutex);
    @autoreleasepool {
        if (g_active_controller) {
            [g_active_controller setIsInterfaceOpen:NO];
            [g_active_controller release];
            g_active_controller = nil;
        }
        g_active_device_name = "";
        g_active_device_index = -1;
    }
    
    napi_value ret;
    napi_get_boolean(env, true, &ret);
    return ret;
}

// N-API: getControls() -> returns Array of control objects
static napi_value GetControls(napi_env env, napi_callback_info info) {
    std::unique_lock<std::mutex> lock(g_mutex);
    @autoreleasepool {
        napi_value jsArray;
        napi_create_array(env, &jsArray);
        
        if (!g_active_controller || ![g_active_controller isInterfaceOpen]) {
            return jsArray;
        }
        
        NSArray* controlNames = [UVCController controlStrings];
        uint32_t idx = 0;
        for (NSString* cName in controlNames) {
            UVCControl* ctrl = [g_active_controller controlWithName:cName];
            if (!ctrl) continue;
            
            NSMutableDictionary* meta = [NSMutableDictionary dictionary];
            [meta setObject:cName forKey:@"name"];
            [meta setObject:@([ctrl supportsGetValue]) forKey:@"supportsGet"];
            [meta setObject:@([ctrl supportsSetValue]) forKey:@"supportsSet"];
            [meta setObject:@([ctrl hasRange]) forKey:@"hasRange"];
            [meta setObject:@([ctrl hasStepSize]) forKey:@"hasStepSize"];
            [meta setObject:@([ctrl hasDefaultValue]) forKey:@"hasDefaultValue"];
            
            if ([ctrl supportsGetValue]) {
                UVCValue* valObj = [ctrl currentValue];
                if (valObj) [meta setObject:ParseUvcValue(valObj) forKey:@"currentValue"];
            }
            if ([ctrl hasRange]) {
                UVCValue* minObj = [ctrl minimum];
                UVCValue* maxObj = [ctrl maximum];
                if (minObj) [meta setObject:ParseUvcValue(minObj) forKey:@"minimum"];
                if (maxObj) [meta setObject:ParseUvcValue(maxObj) forKey:@"maximum"];
            }
            if ([ctrl hasStepSize]) {
                UVCValue* stepObj = [ctrl stepSize];
                if (stepObj) [meta setObject:ParseUvcValue(stepObj) forKey:@"stepSize"];
            }
            if ([ctrl hasDefaultValue]) {
                UVCValue* defObj = [ctrl defaultValue];
                if (defObj) [meta setObject:ParseUvcValue(defObj) forKey:@"defaultValue"];
            }
            
            std::string jsonStr = ObjcToJson(meta);
            napi_value jsonVal;
            napi_create_string_utf8(env, jsonStr.c_str(), NAPI_AUTO_LENGTH, &jsonVal);
            
            napi_set_element(env, jsArray, idx++, jsonVal);
        }
        
        return jsArray;
    }
}

// N-API: setControlValue(controlName, valueStringOrObject) -> Object { success, message }
static napi_value SetControlValue(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr, nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "controlName and value required");
        return nullptr;
    }
    
    char nameBuf[256];
    size_t nameCopied = 0;
    napi_get_value_string_utf8(env, args[0], nameBuf, sizeof(nameBuf), &nameCopied);
    
    // Value can be string or number
    std::string valStr = "";
    napi_valuetype vType;
    napi_typeof(env, args[1], &vType);
    if (vType == napi_string) {
        char valBuf[512];
        size_t valCopied = 0;
        napi_get_value_string_utf8(env, args[1], valBuf, sizeof(valBuf), &valCopied);
        valStr = valBuf;
    } else if (vType == napi_number) {
        double d = 0;
        napi_get_value_double(env, args[1], &d);
        std::ostringstream ss;
        ss << d;
        valStr = ss.str();
    } else if (vType == napi_boolean) {
        bool b = false;
        napi_get_value_bool(env, args[1], &b);
        valStr = b ? "1" : "0";
    } else if (vType == napi_object) {
        // Handle object/JSON by stringifying or parsing
        napi_value jsonStrVal;
        napi_value global;
        napi_get_global(env, &global);
        napi_value jsonObj;
        napi_get_named_property(env, global, "JSON", &jsonObj);
        napi_value stringifyFn;
        napi_get_named_property(env, jsonObj, "stringify", &stringifyFn);
        napi_call_function(env, jsonObj, stringifyFn, 1, &args[1], &jsonStrVal);
        
        char jsonBuf[1024];
        size_t jsonCopied = 0;
        napi_get_value_string_utf8(env, jsonStrVal, jsonBuf, sizeof(jsonBuf), &jsonCopied);
        valStr = jsonBuf;
    }
    
    std::unique_lock<std::mutex> lock(g_mutex);
    @autoreleasepool {
        napi_value resObj;
        napi_create_object(env, &resObj);
        
        if (!g_active_controller || ![g_active_controller isInterfaceOpen]) {
            napi_value jsSuccess, jsMsg;
            napi_get_boolean(env, false, &jsSuccess);
            napi_create_string_utf8(env, "No active UVC device open", NAPI_AUTO_LENGTH, &jsMsg);
            napi_set_named_property(env, resObj, "success", jsSuccess);
            napi_set_named_property(env, resObj, "error", jsMsg);
            return resObj;
        }
        
        NSString* objcName = [NSString stringWithUTF8String:nameBuf];
        UVCControl* ctrl = [g_active_controller controlWithName:objcName];
        if (!ctrl) {
            napi_value jsSuccess, jsMsg;
            napi_get_boolean(env, false, &jsSuccess);
            napi_create_string_utf8(env, "Control not supported on device", NAPI_AUTO_LENGTH, &jsMsg);
            napi_set_named_property(env, resObj, "success", jsSuccess);
            napi_set_named_property(env, resObj, "error", jsMsg);
            return resObj;
        }
        
        BOOL success = [ctrl setCurrentValueFromCString:valStr.c_str() flags:kUVCTypeScanFlagShowWarnings];
        
        napi_value jsSuccess;
        napi_get_boolean(env, success, &jsSuccess);
        napi_set_named_property(env, resObj, "success", jsSuccess);
        
        if (success) {
            UVCValue* curVal = [ctrl currentValue];
            id parsed = ParseUvcValue(curVal);
            std::string parsedJson = ObjcToJson(parsed);
            napi_value jsVal;
            napi_create_string_utf8(env, parsedJson.c_str(), NAPI_AUTO_LENGTH, &jsVal);
            napi_set_named_property(env, resObj, "value", jsVal);
        } else {
            napi_value jsMsg;
            napi_create_string_utf8(env, "Failed to write value to control", NAPI_AUTO_LENGTH, &jsMsg);
            napi_set_named_property(env, resObj, "error", jsMsg);
        }
        
        return resObj;
    }
}

// N-API: startPolling(callback, intervalMs, normalize)
static napi_value StartPolling(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3] = {nullptr, nullptr, nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }
    
    if (argc >= 2) {
        int32_t interval = 33;
        napi_get_value_int32(env, args[1], &interval);
        g_poll_interval_ms.store(interval > 0 ? interval : 33);
    }
    if (argc >= 3) {
        bool norm = false;
        napi_get_value_bool(env, args[2], &norm);
        g_normalize.store(norm);
    }
    
    if (g_ts_fn) {
        napi_threadsafe_function old_fn = g_ts_fn;
        g_ts_fn = nullptr;
        napi_release_threadsafe_function(old_fn, napi_tsfn_abort);
    }
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "UvcControllerCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
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
    
    if (!g_polling_running.load()) {
        g_polling_running.store(true);
        g_polling_thread = std::thread(PollingWorker);
    }
    
    napi_value ret;
    napi_get_boolean(env, true, &ret);
    return ret;
}

// N-API: stopPolling()
static napi_value StopPolling(napi_env env, napi_callback_info info) {
    g_polling_running.store(false);
    
    if (g_polling_thread.joinable()) {
        g_polling_thread.join();
    }
    
    if (g_ts_fn) {
        napi_threadsafe_function ts_fn = g_ts_fn;
        g_ts_fn = nullptr;
        napi_release_threadsafe_function(ts_fn, napi_tsfn_abort);
    }
    
    napi_value ret;
    napi_get_boolean(env, true, &ret);
    return ret;
}

// N-API: executeCommand(jsonString) -> returns JSON result string directly
static napi_value ExecuteCommand(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "JSON command string required");
        return nullptr;
    }
    
    char cmdBuf[2048];
    size_t cmdCopied = 0;
    napi_get_value_string_utf8(env, args[0], cmdBuf, sizeof(cmdBuf), &cmdCopied);
    
    std::unique_lock<std::mutex> lock(g_mutex);
    @autoreleasepool {
        NSData* data = [NSData dataWithBytes:cmdBuf length:cmdCopied];
        NSError* jsonErr = nil;
        NSDictionary* json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonErr];
        
        NSMutableDictionary* resp = [NSMutableDictionary dictionary];
        if (jsonErr || ![json isKindOfClass:[NSDictionary class]]) {
            [resp setObject:@"error" forKey:@"status"];
            [resp setObject:@"Invalid JSON command" forKey:@"message"];
            std::string resStr = ObjcToJson(resp);
            napi_value jsRet;
            napi_create_string_utf8(env, resStr.c_str(), NAPI_AUTO_LENGTH, &jsRet);
            return jsRet;
        }
        
        NSString* action = [json objectForKey:@"action"] ?: @"";
        [resp setObject:action forKey:@"action"];
        
        if ([action isEqualToString:@"list_devices"]) {
            NSArray* controllers = [UVCController uvcControllers];
            NSMutableArray* devList = [NSMutableArray array];
            if (controllers) {
                uint32_t idx = 0;
                for (UVCController* ctrl in controllers) {
                    NSMutableDictionary* d = [NSMutableDictionary dictionary];
                    [d setObject:([ctrl deviceName] ?: @"Unknown") forKey:@"name"];
                    [d setObject:@(idx++) forKey:@"index"];
                    [d setObject:@([ctrl locationId]) forKey:@"locationId"];
                    [d setObject:@([ctrl vendorId]) forKey:@"vendorId"];
                    [d setObject:@([ctrl productId]) forKey:@"productId"];
                    [d setObject:@([ctrl uvcVersion]) forKey:@"uvcVersion"];
                    [devList addObject:d];
                }
            }
            [resp setObject:@"ok" forKey:@"status"];
            [resp setObject:devList forKey:@"devices"];
        } else if ([action isEqualToString:@"get_controls"]) {
            if (!g_active_controller || ![g_active_controller isInterfaceOpen]) {
                [resp setObject:@"error" forKey:@"status"];
                [resp setObject:@"No active UVC device open" forKey:@"message"];
            } else {
                NSArray* controlNames = [UVCController controlStrings];
                NSMutableArray* list = [NSMutableArray array];
                for (NSString* cName in controlNames) {
                    UVCControl* ctrl = [g_active_controller controlWithName:cName];
                    if (!ctrl) continue;
                    NSMutableDictionary* meta = [NSMutableDictionary dictionary];
                    [meta setObject:cName forKey:@"name"];
                    [meta setObject:@([ctrl supportsGetValue]) forKey:@"supportsGet"];
                    [meta setObject:@([ctrl supportsSetValue]) forKey:@"supportsSet"];
                    [meta setObject:@([ctrl hasRange]) forKey:@"hasRange"];
                    [meta setObject:@([ctrl hasStepSize]) forKey:@"hasStepSize"];
                    [meta setObject:@([ctrl hasDefaultValue]) forKey:@"hasDefaultValue"];
                    if ([ctrl supportsGetValue]) {
                        UVCValue* valObj = [ctrl currentValue];
                        if (valObj) [meta setObject:ParseUvcValue(valObj) forKey:@"currentValue"];
                    }
                    if ([ctrl hasRange]) {
                        UVCValue* minObj = [ctrl minimum];
                        UVCValue* maxObj = [ctrl maximum];
                        if (minObj) [meta setObject:ParseUvcValue(minObj) forKey:@"minimum"];
                        if (maxObj) [meta setObject:ParseUvcValue(maxObj) forKey:@"maximum"];
                    }
                    if ([ctrl hasStepSize]) {
                        UVCValue* stepObj = [ctrl stepSize];
                        if (stepObj) [meta setObject:ParseUvcValue(stepObj) forKey:@"stepSize"];
                    }
                    if ([ctrl hasDefaultValue]) {
                        UVCValue* defObj = [ctrl defaultValue];
                        if (defObj) [meta setObject:ParseUvcValue(defObj) forKey:@"defaultValue"];
                    }
                    [list addObject:meta];
                }
                [resp setObject:@"ok" forKey:@"status"];
                [resp setObject:list forKey:@"controls"];
            }
        } else if ([action isEqualToString:@"set"] || [action isEqualToString:@"set_value"]) {
            NSString* prop = [json objectForKey:@"property"] ?: [json objectForKey:@"control"];
            id val = [json objectForKey:@"value"];
            if (!prop || !val) {
                [resp setObject:@"error" forKey:@"status"];
                [resp setObject:@"Missing property or value in set command" forKey:@"message"];
            } else if (!g_active_controller || ![g_active_controller isInterfaceOpen]) {
                [resp setObject:@"error" forKey:@"status"];
                [resp setObject:@"No active UVC device open" forKey:@"message"];
            } else {
                UVCControl* ctrl = [g_active_controller controlWithName:prop];
                if (!ctrl) {
                    [resp setObject:@"error" forKey:@"status"];
                    [resp setObject:@"Control not supported on device" forKey:@"message"];
                } else {
                    NSString* valStr = @"";
                    if ([val isKindOfClass:[NSString class]]) {
                        valStr = (NSString*)val;
                    } else if ([val isKindOfClass:[NSNumber class]]) {
                        valStr = [(NSNumber*)val stringValue];
                    } else {
                        NSData* d = [NSJSONSerialization dataWithJSONObject:val options:0 error:nil];
                        if (d) valStr = [[[NSString alloc] initWithData:d encoding:NSUTF8StringEncoding] autorelease];
                    }
                    BOOL ok = [ctrl setCurrentValueFromCString:[valStr UTF8String] flags:kUVCTypeScanFlagShowWarnings];
                    if (ok) {
                        [resp setObject:@"ok" forKey:@"status"];
                        UVCValue* cur = [ctrl currentValue];
                        if (cur) [resp setObject:ParseUvcValue(cur) forKey:@"value"];
                    } else {
                        [resp setObject:@"error" forKey:@"status"];
                        [resp setObject:@"Failed to set value on hardware" forKey:@"message"];
                    }
                }
            }
        } else if ([action isEqualToString:@"get"] || [action isEqualToString:@"get_value"]) {
            NSString* prop = [json objectForKey:@"property"] ?: [json objectForKey:@"control"];
            if (!prop) {
                [resp setObject:@"error" forKey:@"status"];
                [resp setObject:@"Missing property in get command" forKey:@"message"];
            } else if (!g_active_controller || ![g_active_controller isInterfaceOpen]) {
                [resp setObject:@"error" forKey:@"status"];
                [resp setObject:@"No active UVC device open" forKey:@"message"];
            } else {
                UVCControl* ctrl = [g_active_controller controlWithName:prop];
                if (!ctrl) {
                    [resp setObject:@"error" forKey:@"status"];
                    [resp setObject:@"Control not supported on device" forKey:@"message"];
                } else {
                    UVCValue* cur = [ctrl currentValue];
                    [resp setObject:@"ok" forKey:@"status"];
                    if (cur) [resp setObject:ParseUvcValue(cur) forKey:@"value"];
                }
            }
        } else {
            [resp setObject:@"error" forKey:@"status"];
            [resp setObject:[NSString stringWithFormat:@"Unknown action: %@", action] forKey:@"message"];
        }
        
        std::string resStr = ObjcToJson(resp);
        napi_value jsRet;
        napi_create_string_utf8(env, resStr.c_str(), NAPI_AUTO_LENGTH, &jsRet);
        return jsRet;
    }
}

// N-API: isRunning() -> Boolean
static napi_value IsRunning(napi_env env, napi_callback_info info) {
    std::unique_lock<std::mutex> lock(g_mutex);
    bool running = (g_active_controller != nil && [g_active_controller isInterfaceOpen]);
    napi_value ret;
    napi_get_boolean(env, running, &ret);
    return ret;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_attributes attrs = static_cast<napi_property_attributes>(napi_default | napi_enumerable);
    napi_property_descriptor desc[] = {
        { "listDevices", nullptr, ListDevices, nullptr, nullptr, nullptr, attrs, nullptr },
        { "openDevice", nullptr, OpenDevice, nullptr, nullptr, nullptr, attrs, nullptr },
        { "closeDevice", nullptr, CloseDevice, nullptr, nullptr, nullptr, attrs, nullptr },
        { "getControls", nullptr, GetControls, nullptr, nullptr, nullptr, attrs, nullptr },
        { "setControlValue", nullptr, SetControlValue, nullptr, nullptr, nullptr, attrs, nullptr },
        { "executeCommand", nullptr, ExecuteCommand, nullptr, nullptr, nullptr, attrs, nullptr },
        { "startPolling", nullptr, StartPolling, nullptr, nullptr, nullptr, attrs, nullptr },
        { "stopPolling", nullptr, StopPolling, nullptr, nullptr, nullptr, attrs, nullptr },
        { "isRunning", nullptr, IsRunning, nullptr, nullptr, nullptr, attrs, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
