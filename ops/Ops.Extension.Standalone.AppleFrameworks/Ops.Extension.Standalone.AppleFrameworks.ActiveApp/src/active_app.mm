#import <Cocoa/Cocoa.h>
#import <napi.h>
#import <string>
#import <vector>

Napi::Value GetActiveApp(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);
    
    std::string cppAppName = "";
    std::string cppBundleId = "";
    std::string cppWindowTitle = "";
    double cppPid = 0;
    bool found = false;
    
    @autoreleasepool {
        pid_t activePID = 0;
        
        CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID);
        if (windowList != NULL) {
            CFIndex count = CFArrayGetCount(windowList);
            for (CFIndex i = 0; i < count; i++) {
                CFDictionaryRef windowInfo = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);
                if (windowInfo != NULL) {
                    CFNumberRef layerRef = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowLayer);
                    int layer = 0;
                    if (layerRef != NULL && CFNumberGetValue(layerRef, kCFNumberSInt32Type, &layer) && layer == 0) {
                        // The first layer 0 window in the list is the active frontmost window
                        CFNumberRef ownerPIDRef = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerPID);
                        if (ownerPIDRef != NULL && CFNumberGetValue(ownerPIDRef, kCFNumberSInt32Type, &activePID)) {
                            CFStringRef ownerNameRef = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerName);
                            if (ownerNameRef != NULL) {
                                NSString* nsOwnerName = (__bridge NSString*)ownerNameRef;
                                cppAppName = nsOwnerName ? [nsOwnerName UTF8String] : "";
                            }
                            CFStringRef nameRef = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowName);
                            if (nameRef != NULL) {
                                NSString* nsName = (__bridge NSString*)nameRef;
                                cppWindowTitle = nsName ? [nsName UTF8String] : "";
                            }
                            found = true;
                            break; // Found active window details
                        }
                    }
                }
            }
            CFRelease(windowList);
        }
        
        if (found && activePID != 0) {
            cppPid = (double)activePID;
            
            // Resolve bundle identifier and localized name using static PID lookup
            NSRunningApplication* app = [NSRunningApplication runningApplicationWithProcessIdentifier:activePID];
            if (app != nil) {
                NSString* bId = [app bundleIdentifier];
                cppBundleId = bId ? [bId UTF8String] : "";
                
                if (cppAppName.empty()) {
                    NSString* locName = [app localizedName];
                    cppAppName = locName ? [locName UTF8String] : "";
                }
            }
        }
    }
    
    if (!found) {
        return env.Null();
    }
    
    result.Set("name", cppAppName);
    result.Set("bundleId", cppBundleId);
    result.Set("pid", cppPid);
    result.Set("windowTitle", cppWindowTitle);
    
    return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getActiveApp"), Napi::Function::New(env, GetActiveApp));
    return exports;
}

NODE_API_MODULE(active_app, Init)



