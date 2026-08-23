/**
 * syphon_in_client.mm
 * Native Objective-C++ Node-API addon for Ops.Extension.Standalone.MacOs.Syphon.SyphonIn
 * 
 * Auto-discovers active macOS Syphon servers, connects via SyphonMetalClient,
 * and streams frames into shared unified memory for high-performance Cables WebGL texture ingestion.
 */

#import <napi.h>
#import <Cocoa/Cocoa.h>
#import <Metal/Metal.h>
#import <IOSurface/IOSurface.h>
#import <Syphon/Syphon.h>
#import <mutex>
#import <chrono>
#include <arm_neon.h>

static inline void SwizzleBGRAtoRGBA(uint8_t* dst, const uint8_t* src, size_t numPixels) {
    size_t i = 0;
    // Process 16 pixels (64 bytes) per iteration using ARM NEON vector instructions
    for (; i + 16 <= numPixels; i += 16) {
        uint8x16x4_t bgra = vld4q_u8(src + i * 4);
        uint8x16x4_t rgba;
        rgba.val[0] = bgra.val[2]; // R = B
        rgba.val[1] = bgra.val[1]; // G = G
        rgba.val[2] = bgra.val[0]; // B = R
        rgba.val[3] = bgra.val[3]; // A = A
        vst4q_u8(dst + i * 4, rgba);
    }
    // Handle remaining pixels
    for (; i < numPixels; i++) {
        uint8_t b = src[i * 4 + 0];
        uint8_t g = src[i * 4 + 1];
        uint8_t r = src[i * 4 + 2];
        uint8_t a = src[i * 4 + 3];
        dst[i * 4 + 0] = r;
        dst[i * 4 + 1] = g;
        dst[i * 4 + 2] = b;
        dst[i * 4 + 3] = a;
    }
}

class SyphonInClient : public Napi::ObjectWrap<SyphonInClient> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "SyphonInClient", {
            InstanceMethod("getServers", &SyphonInClient::GetServers),
            InstanceMethod("connect", &SyphonInClient::Connect),
            InstanceMethod("disconnect", &SyphonInClient::Disconnect),
            InstanceMethod("hasNewFrame", &SyphonInClient::HasNewFrame),
            InstanceMethod("readFrame", &SyphonInClient::ReadFrame),
            InstanceMethod("getStatus", &SyphonInClient::GetStatus),
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("SyphonInClient", func);
        return exports;
    }

    SyphonInClient(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SyphonInClient>(info) {
        metalDevice = MTLCreateSystemDefaultDevice();
        syphonClient = nil;
        
        // Warm up SyphonServerDirectory
        [SyphonServerDirectory sharedDirectory];
        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.01, false);

        isConnected = false;
        hasFramePending = false;
        surfaceWidth = 0;
        surfaceHeight = 0;
        currentSurfaceId = 0;
        fps = 0.0;
        frameCount = 0;
        lastFpsTime = std::chrono::steady_clock::now();
        connectedServerName = @"";
        connectedServerUuid = @"";
    }

    ~SyphonInClient() {
        DisconnectInternal();
    }

private:
    id<MTLDevice> metalDevice;
    SyphonMetalClient *syphonClient;
    
    std::mutex mtx;
    bool isConnected;
    bool hasFramePending;
    size_t surfaceWidth;
    size_t surfaceHeight;
    uint32_t currentSurfaceId;
    double fps;
    uint64_t frameCount;
    std::chrono::steady_clock::time_point lastFpsTime;
    NSString *connectedServerName;
    NSString *connectedServerUuid;

    void DisconnectInternal() {
        std::lock_guard<std::mutex> lock(mtx);
        if (syphonClient) {
            [syphonClient stop];
            syphonClient = nil;
        }
        isConnected = false;
        hasFramePending = false;
        surfaceWidth = 0;
        surfaceHeight = 0;
        currentSurfaceId = 0;
        connectedServerName = @"";
        connectedServerUuid = @"";
    }

    Napi::Value GetServers(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::Array arr = Napi::Array::New(env);

        @autoreleasepool {
            CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.02, false);
            NSArray *servers = [[SyphonServerDirectory sharedDirectory] servers];
            uint32_t index = 0;

            for (NSDictionary *desc in servers) {
                NSString *name = desc[SyphonServerDescriptionNameKey] ?: @"";
                NSString *appName = desc[SyphonServerDescriptionAppNameKey] ?: @"";
                NSString *uuid = desc[SyphonServerDescriptionUUIDKey] ?: @"";

                NSString *title = name.length > 0 ? (appName.length > 0 ? [NSString stringWithFormat:@"%@ - %@", appName, name] : name) : (appName.length > 0 ? appName : uuid);

                Napi::Object sObj = Napi::Object::New(env);
                sObj.Set("name", Napi::String::New(env, [name UTF8String]));
                sObj.Set("appName", Napi::String::New(env, [appName UTF8String]));
                sObj.Set("uuid", Napi::String::New(env, [uuid UTF8String]));
                sObj.Set("title", Napi::String::New(env, [title UTF8String]));

                arr.Set(index++, sObj);
            }
        }

        return arr;
    }

    Napi::Value Connect(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        if (info.Length() < 1 || !info[0].IsString()) {
            return Napi::Boolean::New(env, false);
        }

        if (!metalDevice) {
            Napi::Error::New(env, "Metal is not supported on this device").ThrowAsJavaScriptException();
            return Napi::Boolean::New(env, false);
        }

        NSString *target = [NSString stringWithUTF8String:info[0].As<Napi::String>().Utf8Value().c_str()];
        if (target.length == 0) return Napi::Boolean::New(env, false);

        if (syphonClient) {
            [syphonClient stop];
            syphonClient = nil;
        }

        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.02, false);
        NSDictionary *matchedDesc = nil;
        NSArray *servers = [[SyphonServerDirectory sharedDirectory] servers];

        // 1. Try UUID match
        for (NSDictionary *desc in servers) {
            NSString *uuid = desc[SyphonServerDescriptionUUIDKey];
            if ([uuid isEqualToString:target]) {
                matchedDesc = desc;
                break;
            }
        }

        // 2. Try Title / Name / AppName match
        if (!matchedDesc) {
            for (NSDictionary *desc in servers) {
                NSString *name = desc[SyphonServerDescriptionNameKey] ?: @"";
                NSString *appName = desc[SyphonServerDescriptionAppNameKey] ?: @"";
                NSString *title = name.length > 0 ? (appName.length > 0 ? [NSString stringWithFormat:@"%@ - %@", appName, name] : name) : appName;

                if ([title isEqualToString:target] || [name isEqualToString:target] || [appName isEqualToString:target]) {
                    matchedDesc = desc;
                    break;
                }
            }
        }

        // 3. Fallback to first available server if target is "first" or "any"
        if (!matchedDesc && ([target isEqualToString:@"first"] || [target isEqualToString:@"any"]) && servers.count > 0) {
            matchedDesc = servers[0];
        }

        if (!matchedDesc) {
            return Napi::Boolean::New(env, false);
        }

        connectedServerName = matchedDesc[SyphonServerDescriptionNameKey] ?: matchedDesc[SyphonServerDescriptionAppNameKey] ?: @"";
        connectedServerUuid = matchedDesc[SyphonServerDescriptionUUIDKey] ?: @"";

        SyphonInClient *clientSelf = this;
        syphonClient = [[SyphonMetalClient alloc] initWithServerDescription:matchedDesc device:metalDevice options:nil newFrameHandler:^(SyphonMetalClient *c) {
            std::lock_guard<std::mutex> l(clientSelf->mtx);
            clientSelf->hasFramePending = true;
        }];

        if (!syphonClient || !syphonClient.isValid) {
            syphonClient = nil;
            isConnected = false;
            return Napi::Boolean::New(env, false);
        }

        isConnected = true;
        hasFramePending = true;
        frameCount = 0;
        fps = 0.0;
        lastFpsTime = std::chrono::steady_clock::now();

        return Napi::Boolean::New(env, true);
    }

    Napi::Value Disconnect(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        DisconnectInternal();
        return Napi::Boolean::New(env, true);
    }

    Napi::Value HasNewFrame(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);
        return Napi::Boolean::New(env, isConnected && (hasFramePending || (syphonClient && [syphonClient hasNewFrame])));
    }

    Napi::Value ReadFrame(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        Napi::Object res = Napi::Object::New(env);
        res.Set("hasFrame", Napi::Boolean::New(env, false));

        if (!isConnected || !syphonClient) {
            return res;
        }

        if (info.Length() < 1 || (!info[0].IsBuffer() && !info[0].IsTypedArray())) {
            return res;
        }

        @autoreleasepool {
            id<MTLTexture> frameTex = [syphonClient newFrameImage];
            if (!frameTex) {
                return res;
            }

            hasFramePending = false;
            size_t w = frameTex.width;
            size_t h = frameTex.height;
            surfaceWidth = w;
            surfaceHeight = h;

            IOSurfaceRef surf = frameTex.iosurface;
            if (surf) {
                currentSurfaceId = IOSurfaceGetID(surf);
                OSType pixelFormat = IOSurfaceGetPixelFormat(surf);
                bool isBGRA = (pixelFormat == kCVPixelFormatType_32BGRA || pixelFormat == 'BGRA' || pixelFormat == 0x42475241 || frameTex.pixelFormat == MTLPixelFormatBGRA8Unorm || pixelFormat == 0);

                bool swapRb = true;
                if (info.Length() >= 2 && info[1].IsBoolean()) {
                    swapRb = info[1].As<Napi::Boolean>().Value();
                } else {
                    swapRb = isBGRA;
                }

                IOSurfaceLock(surf, kIOSurfaceLockReadOnly, nullptr);
                void *src = IOSurfaceGetBaseAddress(surf);
                size_t allocSize = IOSurfaceGetAllocSize(surf);

                uint8_t* dst = nullptr;
                size_t dstSize = 0;

                if (info[0].IsBuffer()) {
                    Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
                    dst = buf.Data();
                    dstSize = buf.Length();
                } else {
                    Napi::TypedArray typedArray = info[0].As<Napi::TypedArray>();
                    Napi::ArrayBuffer arrayBuffer = typedArray.ArrayBuffer();
                    dst = (uint8_t*)arrayBuffer.Data() + typedArray.ByteOffset();
                    dstSize = typedArray.ByteLength();
                }

                if (src && dst) {
                    if (swapRb) {
                        size_t numPixels = std::min(w * h, dstSize / 4);
                        SwizzleBGRAtoRGBA(dst, (const uint8_t*)src, numPixels);
                    } else {
                        memcpy(dst, src, std::min(dstSize, allocSize));
                    }
                }

                IOSurfaceUnlock(surf, kIOSurfaceLockReadOnly, nullptr);

                res.Set("hasFrame", Napi::Boolean::New(env, true));
                res.Set("width", Napi::Number::New(env, (double)w));
                res.Set("height", Napi::Number::New(env, (double)h));
                res.Set("surfaceId", Napi::Number::New(env, (double)currentSurfaceId));
                res.Set("isSwizzled", Napi::Boolean::New(env, swapRb));

                frameCount++;
                auto now = std::chrono::steady_clock::now();
                std::chrono::duration<double> elapsed = now - lastFpsTime;
                if (elapsed.count() >= 1.0) {
                    fps = (double)frameCount / elapsed.count();
                    frameCount = 0;
                    lastFpsTime = now;
                }
            }
        }

        return res;
    }

    Napi::Value GetStatus(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        Napi::Object obj = Napi::Object::New(env);
        obj.Set("isConnected", Napi::Boolean::New(env, isConnected));
        obj.Set("serverName", Napi::String::New(env, connectedServerName ? [connectedServerName UTF8String] : ""));
        obj.Set("serverUuid", Napi::String::New(env, connectedServerUuid ? [connectedServerUuid UTF8String] : ""));
        obj.Set("width", Napi::Number::New(env, (double)surfaceWidth));
        obj.Set("height", Napi::Number::New(env, (double)surfaceHeight));
        obj.Set("surfaceId", Napi::Number::New(env, (double)currentSurfaceId));
        obj.Set("fps", Napi::Number::New(env, fps));

        return obj;
    }
};

Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    return SyphonInClient::Init(env, exports);
}

NODE_API_MODULE(syphon_in_client, InitModule)
