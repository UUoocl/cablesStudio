#include <node_api.h>
#import <Foundation/Foundation.h>
#import "UVCController.h"

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

napi_value Init(napi_env env, napi_value exports) {
    napi_property_attributes attrs = static_cast<napi_property_attributes>(napi_default | napi_enumerable);
    napi_property_descriptor desc[] = {
        { "listDevices", nullptr, ListDevices, nullptr, nullptr, nullptr, attrs, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
