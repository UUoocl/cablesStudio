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
            InstanceMethod("write", &IOSurfaceWrap::Write),
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
        
        // Make the IOSurface globally shareable via ID
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
        
        // Define ID property
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
    
    Napi::Value Write(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (!surface) return env.Undefined();
        
        if (info.Length() < 1 || (!info[0].IsBuffer() && !info[0].IsTypedArray())) {
            Napi::TypeError::New(env, "Argument must be a Buffer or TypedArray").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        
        uint8_t* src = nullptr;
        size_t size = 0;
        if (info[0].IsBuffer()) {
            Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
            src = buf.Data();
            size = buf.Length();
        } else {
            Napi::TypedArray typedArray = info[0].As<Napi::TypedArray>();
            Napi::ArrayBuffer arrayBuffer = typedArray.ArrayBuffer();
            src = (uint8_t*)arrayBuffer.Data() + typedArray.ByteOffset();
            size = typedArray.ByteLength();
        }
        
        IOSurfaceLock(surface, kIOSurfaceLockAvoidSync, nullptr);
        void* dst = IOSurfaceGetBaseAddress(surface);
        size_t allocSize = IOSurfaceGetAllocSize(surface);
        if (dst && src) {
            memcpy(dst, src, std::min(size, allocSize));
        }
        IOSurfaceUnlock(surface, 0, nullptr);
        return env.Undefined();
    }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return IOSurfaceWrap::Init(env, exports);
}

NODE_API_MODULE(iosurface_shared, InitAll)
