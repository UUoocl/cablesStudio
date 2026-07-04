#include <napi.h>
#include <IOSurface/IOSurface.h>
#include <CoreFoundation/CoreFoundation.h>
#include <CoreVideo/CVPixelBuffer.h>

class IOSurfaceWrap : public Napi::ObjectWrap<IOSurfaceWrap> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "IOSurfaceWrap", {
            InstanceMethod("lock", &IOSurfaceWrap::Lock),
            InstanceMethod("unlock", &IOSurfaceWrap::Unlock),
            InstanceMethod("getBuffer", &IOSurfaceWrap::GetBuffer),
        });
        
        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);
        
        exports.Set("IOSurfaceWrap", func);
        return exports;
    }
    
    IOSurfaceWrap(const Napi::CallbackInfo& info) : Napi::ObjectWrap<IOSurfaceWrap>(info) {
        Napi::Env env = info.Env();
        if (info.Length() < 2) {
            Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
            return;
        }
        
        int width = info[0].As<Napi::Number>().Int32Value();
        int height = info[1].As<Napi::Number>().Int32Value();
        
        CFMutableDictionaryRef properties = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
        
        int bytesPerElement = 4;
        int pixelFormat = kCVPixelFormatType_32RGBA;
        
        CFNumberRef wNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &width);
        CFNumberRef hNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &height);
        CFNumberRef bpeNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &bytesPerElement);
        CFNumberRef pfNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &pixelFormat);
        
        CFDictionarySetValue(properties, kIOSurfaceWidth, wNum);
        CFDictionarySetValue(properties, kIOSurfaceHeight, hNum);
        CFDictionarySetValue(properties, kIOSurfaceBytesPerElement, bpeNum);
        CFDictionarySetValue(properties, kIOSurfacePixelFormat, pfNum);
        
        CFDictionarySetValue(properties, kIOSurfaceIsGlobal, kCFBooleanTrue);
        
        CFRelease(wNum);
        CFRelease(hNum);
        CFRelease(bpeNum);
        CFRelease(pfNum);
        
        surface = IOSurfaceCreate(properties);
        CFRelease(properties);
        
        if (!surface) {
            Napi::Error::New(env, "Failed to create IOSurface").ThrowAsJavaScriptException();
            return;
        }
        
        surfaceId = IOSurfaceGetID(surface);
        this->Value().Set("id", Napi::Number::New(env, surfaceId));
    }
    
    ~IOSurfaceWrap() {
        if (surface) {
            CFRelease(surface);
            surface = nullptr;
        }
    }

private:
    IOSurfaceRef surface = nullptr;
    IOSurfaceID surfaceId = 0;
    
    Napi::Value Lock(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (surface) {
            kern_return_t kr = IOSurfaceLock(surface, 0, nullptr);
            return Napi::Boolean::New(env, kr == kIOReturnSuccess);
        }
        return Napi::Boolean::New(env, false);
    }
    
    Napi::Value Unlock(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (surface) {
            kern_return_t kr = IOSurfaceUnlock(surface, 0, nullptr);
            return Napi::Boolean::New(env, kr == kIOReturnSuccess);
        }
        return Napi::Boolean::New(env, false);
    }
    
    Napi::Value GetBuffer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (!surface) return env.Null();
        
        void* baseAddress = IOSurfaceGetBaseAddress(surface);
        size_t size = IOSurfaceGetAllocSize(surface);
        if (!baseAddress) return env.Null();
        
        return Napi::Buffer<uint8_t>::New(env, (uint8_t*)baseAddress, size, [](Napi::Env env, uint8_t* finalizeData) {});
    }
};

class IOSurfaceLookupWrap : public Napi::ObjectWrap<IOSurfaceLookupWrap> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "IOSurfaceLookupWrap", {
            InstanceMethod("lock", &IOSurfaceLookupWrap::Lock),
            InstanceMethod("unlock", &IOSurfaceLookupWrap::Unlock),
            InstanceMethod("getBuffer", &IOSurfaceLookupWrap::GetBuffer),
        });
        
        exports.Set("IOSurfaceLookupWrap", func);
        return exports;
    }
    
    IOSurfaceLookupWrap(const Napi::CallbackInfo& info) : Napi::ObjectWrap<IOSurfaceLookupWrap>(info) {
        Napi::Env env = info.Env();
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
            return;
        }
        
        uint32_t id = info[0].As<Napi::Number>().Uint32Value();
        surface = IOSurfaceLookup(id);
        if (!surface) {
            Napi::Error::New(env, "Failed to lookup IOSurface by ID").ThrowAsJavaScriptException();
            return;
        }
    }
    
    ~IOSurfaceLookupWrap() {
        if (surface) {
            CFRelease(surface);
            surface = nullptr;
        }
    }

private:
    IOSurfaceRef surface = nullptr;
    
    Napi::Value Lock(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (surface) {
            kern_return_t kr = IOSurfaceLock(surface, kIOSurfaceLockReadOnly, nullptr);
            return Napi::Boolean::New(env, kr == kIOReturnSuccess);
        }
        return Napi::Boolean::New(env, false);
    }
    
    Napi::Value Unlock(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (surface) {
            kern_return_t kr = IOSurfaceUnlock(surface, kIOSurfaceLockReadOnly, nullptr);
            return Napi::Boolean::New(env, kr == kIOReturnSuccess);
        }
        return Napi::Boolean::New(env, false);
    }
    
    Napi::Value GetBuffer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (!surface) return env.Null();
        
        void* baseAddress = IOSurfaceGetBaseAddress(surface);
        size_t size = IOSurfaceGetAllocSize(surface);
        if (!baseAddress) return env.Null();
        
        return Napi::Buffer<uint8_t>::New(env, (uint8_t*)baseAddress, size, [](Napi::Env env, uint8_t* finalizeData) {});
    }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    IOSurfaceWrap::Init(env, exports);
    IOSurfaceLookupWrap::Init(env, exports);
    return exports;
}

NODE_API_MODULE(iosurface_shared, InitAll)
