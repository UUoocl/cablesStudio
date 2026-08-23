/**
 * syphon_texture_server.mm
 * Native Objective-C++ Node-API addon for Ops.Extension.Standalone.MacOs.Syphon.SyphonOutTexture
 * 
 * Manages a high-performance Apple IOSurface backed by Metal and Syphon,
 * allowing asynchronous WebGL PBO / VideoFrame pixel streams to be published
 * with zero render-thread stalls on Apple Silicon.
 */

#import <napi.h>
#import <Cocoa/Cocoa.h>
#import <Metal/Metal.h>
#import <IOSurface/IOSurface.h>
#import <CoreVideo/CoreVideo.h>
#import <Syphon/Syphon.h>
#import <mutex>
#import <chrono>

class SyphonTextureServer : public Napi::ObjectWrap<SyphonTextureServer> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "SyphonTextureServer", {
            InstanceMethod("startServer", &SyphonTextureServer::StartServer),
            InstanceMethod("stopServer", &SyphonTextureServer::StopServer),
            InstanceMethod("updateSize", &SyphonTextureServer::UpdateSize),
            InstanceMethod("setServerName", &SyphonTextureServer::SetServerName),
            InstanceMethod("writeAndPublish", &SyphonTextureServer::WriteAndPublish),
            InstanceMethod("getStatus", &SyphonTextureServer::GetStatus),
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("SyphonTextureServer", func);
        return exports;
    }

    SyphonTextureServer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SyphonTextureServer>(info) {
        metalDevice = MTLCreateSystemDefaultDevice();
        if (metalDevice) {
            commandQueue = [metalDevice newCommandQueue];
        }
        syphonServer = nil;
        surface = nullptr;
        metalTexture = nil;
        
        surfaceWidth = 0;
        surfaceHeight = 0;
        currentSurfaceId = 0;
        isRunning = false;
        fps = 0.0;
        frameCount = 0;
        lastFpsTime = std::chrono::steady_clock::now();
        serverName = @"Cables Texture Output";
    }

    ~SyphonTextureServer() {
        StopInternal();
    }

private:
    id<MTLDevice> metalDevice;
    id<MTLCommandQueue> commandQueue;
    SyphonMetalServer *syphonServer;
    IOSurfaceRef surface;
    id<MTLTexture> metalTexture;
    
    std::mutex mtx;
    bool isRunning;
    size_t surfaceWidth;
    size_t surfaceHeight;
    uint32_t currentSurfaceId;
    double fps;
    uint64_t frameCount;
    std::chrono::steady_clock::time_point lastFpsTime;
    NSString *serverName;

    void ReallocateSurface(size_t width, size_t height) {
        if (surface) {
            CFRelease(surface);
            surface = nullptr;
        }
        metalTexture = nil;

        if (width == 0 || height == 0 || !metalDevice) return;

        surfaceWidth = width;
        surfaceHeight = height;

        int bytesPerElement = 4;
        int pixelFormat = kCVPixelFormatType_32RGBA;

        CFMutableDictionaryRef properties = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
        
        int w = (int)width;
        int h = (int)height;
        CFNumberRef wNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &w);
        CFNumberRef hNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &h);
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

        if (!surface) return;

        currentSurfaceId = IOSurfaceGetID(surface);

        MTLTextureDescriptor *desc = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatRGBA8Unorm
                                                                                         width:width
                                                                                        height:height
                                                                                     mipmapped:NO];
        desc.usage = MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite | MTLTextureUsageRenderTarget;

        metalTexture = [metalDevice newTextureWithDescriptor:desc iosurface:surface plane:0];
    }

    void StopInternal() {
        std::lock_guard<std::mutex> lock(mtx);
        if (syphonServer) {
            [syphonServer stop];
            syphonServer = nil;
        }
        if (surface) {
            CFRelease(surface);
            surface = nullptr;
        }
        metalTexture = nil;
        isRunning = false;
        surfaceWidth = 0;
        surfaceHeight = 0;
        currentSurfaceId = 0;
    }

    Napi::Value StartServer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        if (!metalDevice) {
            Napi::Error::New(env, "Metal is not supported on this device").ThrowAsJavaScriptException();
            return env.Null();
        }

        NSString *name = @"Cables Texture Output";
        if (info.Length() > 0 && info[0].IsString()) {
            name = [NSString stringWithUTF8String:info[0].As<Napi::String>().Utf8Value().c_str()];
        }
        serverName = name;

        size_t initialWidth = 1920;
        size_t initialHeight = 1080;
        if (info.Length() >= 3) {
            initialWidth = (size_t)info[1].As<Napi::Number>().Int64Value();
            initialHeight = (size_t)info[2].As<Napi::Number>().Int64Value();
        }

        if (syphonServer) {
            [syphonServer stop];
            syphonServer = nil;
        }

        syphonServer = [[SyphonMetalServer alloc] initWithName:serverName device:metalDevice options:nil];
        if (!syphonServer) {
            Napi::Error::New(env, "Failed to initialize SyphonMetalServer").ThrowAsJavaScriptException();
            return env.Null();
        }

        ReallocateSurface(initialWidth, initialHeight);

        isRunning = true;
        frameCount = 0;
        fps = 0.0;
        lastFpsTime = std::chrono::steady_clock::now();

        return Napi::Boolean::New(env, true);
    }

    Napi::Value StopServer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        StopInternal();
        return Napi::Boolean::New(env, true);
    }

    Napi::Value UpdateSize(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        if (info.Length() >= 2) {
            size_t w = (size_t)info[0].As<Napi::Number>().Int64Value();
            size_t h = (size_t)info[1].As<Napi::Number>().Int64Value();
            if (w != surfaceWidth || h != surfaceHeight) {
                ReallocateSurface(w, h);
            }
        }
        return env.Undefined();
    }

    Napi::Value SetServerName(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);
        if (info.Length() > 0 && info[0].IsString()) {
            serverName = [NSString stringWithUTF8String:info[0].As<Napi::String>().Utf8Value().c_str()];
            if (syphonServer) {
                syphonServer.name = serverName;
            }
        }
        return env.Undefined();
    }

    Napi::Value WriteAndPublish(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        if (!isRunning || !surface || !metalTexture || !syphonServer || !commandQueue) {
            return env.Undefined();
        }

        if (info.Length() < 1 || (!info[0].IsBuffer() && !info[0].IsTypedArray())) {
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

        if (!src || size == 0) return env.Undefined();

        IOSurfaceLock(surface, kIOSurfaceLockAvoidSync, nullptr);
        void* dst = IOSurfaceGetBaseAddress(surface);
        size_t allocSize = IOSurfaceGetAllocSize(surface);
        if (dst) {
            memcpy(dst, src, std::min(size, allocSize));
        }
        IOSurfaceUnlock(surface, 0, nullptr);

        id<MTLCommandBuffer> cmdBuffer = [commandQueue commandBuffer];
        if (cmdBuffer) {
            NSRect region = NSMakeRect(0, 0, (CGFloat)surfaceWidth, (CGFloat)surfaceHeight);
            // In WebGL, textures are vertically inverted relative to standard screen orientation; flipped: YES corrects this
            [syphonServer publishFrameTexture:metalTexture onCommandBuffer:cmdBuffer imageRegion:region flipped:YES];
            [cmdBuffer commit];

            frameCount++;
            auto now = std::chrono::steady_clock::now();
            std::chrono::duration<double> elapsed = now - lastFpsTime;
            if (elapsed.count() >= 1.0) {
                fps = (double)frameCount / elapsed.count();
                frameCount = 0;
                lastFpsTime = now;
            }
        }

        return env.Undefined();
    }

    Napi::Value GetStatus(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        Napi::Object obj = Napi::Object::New(env);
        obj.Set("isRunning", Napi::Boolean::New(env, isRunning));
        obj.Set("hasClients", Napi::Boolean::New(env, syphonServer ? (bool)syphonServer.hasClients : false));
        obj.Set("serverName", Napi::String::New(env, serverName ? [serverName UTF8String] : ""));
        obj.Set("width", Napi::Number::New(env, (double)surfaceWidth));
        obj.Set("height", Napi::Number::New(env, (double)surfaceHeight));
        obj.Set("surfaceId", Napi::Number::New(env, (double)currentSurfaceId));
        obj.Set("fps", Napi::Number::New(env, fps));

        return obj;
    }
};

Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    return SyphonTextureServer::Init(env, exports);
}

NODE_API_MODULE(syphon_texture_server, InitModule)
