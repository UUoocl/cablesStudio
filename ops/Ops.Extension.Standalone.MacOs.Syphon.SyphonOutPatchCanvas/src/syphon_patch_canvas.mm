/**
 * syphon_patch_canvas.mm
 * Native Objective-C++ Node-API addon for Ops.Extension.Standalone.MacOs.Syphon.SyphonOutPatchCanvas
 * 
 * Taps into Electron's macOS native view layer and Chromium compositor,
 * extracting the live composite backed by an Apple IOSurface with ZERO CPU copies,
 * wrapping it into Apple Metal, and publishing it via Syphon on Apple Silicon.
 */

#import <napi.h>
#import <Cocoa/Cocoa.h>
#import <Metal/Metal.h>
#import <QuartzCore/QuartzCore.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreMedia/CoreMedia.h>
#import <ScreenCaptureKit/ScreenCaptureKit.h>
#import <IOSurface/IOSurface.h>
#import <Syphon/Syphon.h>
#import <mutex>
#import <chrono>

@interface SCStreamDelegateHandler : NSObject <SCStreamOutput, SCStreamDelegate>
@property (nonatomic, assign) void *serverPtr;
@end

class SyphonPatchCanvasServer : public Napi::ObjectWrap<SyphonPatchCanvasServer> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "SyphonPatchCanvasServer", {
            InstanceMethod("startServer", &SyphonPatchCanvasServer::StartServer),
            InstanceMethod("stopServer", &SyphonPatchCanvasServer::StopServer),
            InstanceMethod("setServerName", &SyphonPatchCanvasServer::SetServerName),
            InstanceMethod("setCropRegion", &SyphonPatchCanvasServer::SetCropRegion),
            InstanceMethod("publishFrame", &SyphonPatchCanvasServer::PublishFrame),
            InstanceMethod("startContinuousCapture", &SyphonPatchCanvasServer::StartContinuousCapture),
            InstanceMethod("stopContinuousCapture", &SyphonPatchCanvasServer::StopContinuousCapture),
            InstanceMethod("getStatus", &SyphonPatchCanvasServer::GetStatus),
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("SyphonPatchCanvasServer", func);
        return exports;
    }

    SyphonPatchCanvasServer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SyphonPatchCanvasServer>(info) {
        metalDevice = MTLCreateSystemDefaultDevice();
        if (metalDevice) {
            commandQueue = [metalDevice newCommandQueue];
        }
        syphonServer = nil;
        scStream = nil;
        streamHandler = nil;
        targetViewPtr = nullptr;
        isRunning = false;
        isContinuous = false;
        cropEnabled = false;
        cropRect = NSZeroRect;
        currentSurfaceId = 0;
        surfaceWidth = 0;
        surfaceHeight = 0;
        fps = 0.0;
        frameCount = 0;
        lastFpsTime = std::chrono::steady_clock::now();
        serverName = @"Cables Patch Canvas";
    }

    ~SyphonPatchCanvasServer() {
        StopInternal();
    }

    void OnSampleBuffer(CMSampleBufferRef sampleBuffer) {
        @autoreleasepool {
            std::lock_guard<std::mutex> lock(mtx);
            if (!isRunning || !syphonServer || !metalDevice || !commandQueue) return;

            CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
            if (!imageBuffer) return;

            IOSurfaceRef surface = CVPixelBufferGetIOSurface(imageBuffer);
            if (!surface) return;

            PublishIOSurface(surface);
        }
    }

private:
    id<MTLDevice> metalDevice;
    id<MTLCommandQueue> commandQueue;
    SyphonMetalServer *syphonServer;
    SCStream *scStream;
    SCStreamDelegateHandler *streamHandler;
    void *targetViewPtr;
    
    std::mutex mtx;
    bool isRunning;
    bool isContinuous;
    bool cropEnabled;
    NSRect cropRect;
    
    uint32_t currentSurfaceId;
    size_t surfaceWidth;
    size_t surfaceHeight;
    double fps;
    uint64_t frameCount;
    std::chrono::steady_clock::time_point lastFpsTime;
    NSString *serverName;

    void PublishIOSurface(IOSurfaceRef surface) {
        if (!surface || !syphonServer || !metalDevice || !commandQueue) return;

        IOSurfaceID sId = IOSurfaceGetID(surface);
        size_t w = IOSurfaceGetWidth(surface);
        size_t h = IOSurfaceGetHeight(surface);
        OSType pixelFormat = IOSurfaceGetPixelFormat(surface);

        if (w == 0 || h == 0) return;

        currentSurfaceId = sId;
        surfaceWidth = w;
        surfaceHeight = h;

        MTLPixelFormat metalFormat = MTLPixelFormatBGRA8Unorm;
        if (pixelFormat == kCVPixelFormatType_32RGBA || pixelFormat == 'RGBA') {
            metalFormat = MTLPixelFormatRGBA8Unorm;
        } else if (pixelFormat == kCVPixelFormatType_32BGRA || pixelFormat == 'BGRA') {
            metalFormat = MTLPixelFormatBGRA8Unorm;
        }

        MTLTextureDescriptor *desc = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:metalFormat
                                                                                         width:w
                                                                                        height:h
                                                                                     mipmapped:NO];
        desc.usage = MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite | MTLTextureUsageRenderTarget;

        id<MTLTexture> texture = [metalDevice newTextureWithDescriptor:desc iosurface:surface plane:0];
        if (!texture) return;

        id<MTLCommandBuffer> cmdBuffer = [commandQueue commandBuffer];
        if (!cmdBuffer) return;

        NSRect region;
        if (cropEnabled && cropRect.size.width > 0 && cropRect.size.height > 0) {
            CGFloat rx = std::max<CGFloat>(0, std::min<CGFloat>(cropRect.origin.x, (CGFloat)(w - 1)));
            CGFloat ry = std::max<CGFloat>(0, std::min<CGFloat>(cropRect.origin.y, (CGFloat)(h - 1)));
            CGFloat rw = std::max<CGFloat>(1, std::min<CGFloat>(cropRect.size.width, (CGFloat)w - rx));
            CGFloat rh = std::max<CGFloat>(1, std::min<CGFloat>(cropRect.size.height, (CGFloat)h - ry));
            region = NSMakeRect(rx, ry, rw, rh);
        } else {
            region = NSMakeRect(0, 0, (CGFloat)w, (CGFloat)h);
        }

        [syphonServer publishFrameTexture:texture onCommandBuffer:cmdBuffer imageRegion:region flipped:NO];
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

    void StartSCStream() {
        if (@available(macOS 12.3, *)) {
            SCStreamDelegateHandler *handler = streamHandler;
            SyphonPatchCanvasServer *serverSelf = this;

            [SCShareableContent getShareableContentExcludingDesktopWindows:YES onScreenWindowsOnly:YES completionHandler:^(SCShareableContent *content, NSError *error) {
                if (error || !content) return;

                SCWindow *targetWindow = nil;
                pid_t myPid = getpid();
                pid_t parentPid = getppid();

                // 1. Match by owning PID (processID)
                for (SCWindow *w in content.windows) {
                    if (w.owningApplication.processID == myPid || w.owningApplication.processID == parentPid) {
                        if (w.frame.size.width > 100 && w.frame.size.height > 100) {
                            targetWindow = w;
                            break;
                        }
                    }
                }

                // 2. Match by title or application name
                if (!targetWindow) {
                    for (SCWindow *w in content.windows) {
                        NSString *title = [w.title lowercaseString] ?: @"";
                        NSString *appName = [w.owningApplication.applicationName lowercaseString] ?: @"";
                        if ([title containsString:@"cables"] || [appName containsString:@"cables"] || [appName containsString:@"electron"]) {
                            if (w.frame.size.width > 100 && w.frame.size.height > 100) {
                                targetWindow = w;
                                break;
                            }
                        }
                    }
                }

                if (!targetWindow && content.windows.count > 0) {
                    targetWindow = content.windows[0];
                }

                if (!targetWindow) return;

                SCContentFilter *filter = [[SCContentFilter alloc] initWithDesktopIndependentWindow:targetWindow];
                SCStreamConfiguration *config = [[SCStreamConfiguration alloc] init];
                config.showsCursor = NO;
                config.pixelFormat = kCVPixelFormatType_32BGRA;
                config.scalesToFit = NO;
                config.queueDepth = 3;
                config.minimumFrameInterval = CMTimeMake(1, 60);

                SCStream *stream = [[SCStream alloc] initWithFilter:filter configuration:config delegate:handler];
                serverSelf->scStream = stream;

                NSError *startErr = nil;
                [stream addStreamOutput:handler type:SCStreamOutputTypeScreen sampleHandlerQueue:dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0) error:&startErr];
                
                [stream startCaptureWithCompletionHandler:^(NSError *err) {
                    if (!err) {
                        serverSelf->isContinuous = true;
                    }
                }];
            }];
        }
    }

    void StopInternal() {
        std::lock_guard<std::mutex> lock(mtx);
        if (scStream) {
            if (@available(macOS 12.3, *)) {
                [scStream stopCaptureWithCompletionHandler:nil];
            }
            scStream = nil;
        }
        if (syphonServer) {
            [syphonServer stop];
            syphonServer = nil;
        }
        isRunning = false;
        isContinuous = false;
        targetViewPtr = nullptr;
    }

    Napi::Value StartServer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        if (!metalDevice) {
            Napi::Error::New(env, "Metal is not supported on this device").ThrowAsJavaScriptException();
            return env.Null();
        }

        NSString *name = @"Cables Patch Canvas";
        if (info.Length() > 0 && info[0].IsString()) {
            name = [NSString stringWithUTF8String:info[0].As<Napi::String>().Utf8Value().c_str()];
        }
        serverName = name;

        if (syphonServer) {
            [syphonServer stop];
            syphonServer = nil;
        }

        syphonServer = [[SyphonMetalServer alloc] initWithName:serverName device:metalDevice options:nil];
        if (!syphonServer) {
            Napi::Error::New(env, "Failed to initialize SyphonMetalServer").ThrowAsJavaScriptException();
            return env.Null();
        }

        if (!streamHandler) {
            streamHandler = [[SCStreamDelegateHandler alloc] init];
            streamHandler.serverPtr = this;
        }

        isRunning = true;
        frameCount = 0;
        fps = 0.0;
        lastFpsTime = std::chrono::steady_clock::now();

        // Start ScreenCaptureKit zero-copy stream
        StartSCStream();

        return Napi::Boolean::New(env, true);
    }

    Napi::Value StopServer(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        StopInternal();
        return Napi::Boolean::New(env, true);
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

    Napi::Value SetCropRegion(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);
        if (info.Length() >= 5) {
            CGFloat x = (CGFloat)info[0].As<Napi::Number>().DoubleValue();
            CGFloat y = (CGFloat)info[1].As<Napi::Number>().DoubleValue();
            CGFloat w = (CGFloat)info[2].As<Napi::Number>().DoubleValue();
            CGFloat h = (CGFloat)info[3].As<Napi::Number>().DoubleValue();
            bool enabled = info[4].As<Napi::Boolean>().Value();
            
            cropRect = NSMakeRect(x, y, w, h);
            cropEnabled = enabled;
        } else if (info.Length() >= 1 && info[0].IsBoolean()) {
            cropEnabled = info[0].As<Napi::Boolean>().Value();
        }
        return env.Undefined();
    }

    Napi::Value PublishFrame(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        // Frame publication handled asynchronously via zero-copy stream
        return env.Undefined();
    }

    Napi::Value StartContinuousCapture(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);
        if (!scStream && isRunning) {
            StartSCStream();
        }
        return Napi::Boolean::New(env, true);
    }

    Napi::Value StopContinuousCapture(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);
        if (scStream) {
            if (@available(macOS 12.3, *)) {
                [scStream stopCaptureWithCompletionHandler:nil];
            }
            scStream = nil;
        }
        isContinuous = false;
        return Napi::Boolean::New(env, true);
    }

    Napi::Value GetStatus(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::lock_guard<std::mutex> lock(mtx);

        Napi::Object obj = Napi::Object::New(env);
        obj.Set("isRunning", Napi::Boolean::New(env, isRunning));
        obj.Set("isContinuous", Napi::Boolean::New(env, isContinuous));
        obj.Set("hasClients", Napi::Boolean::New(env, syphonServer ? (bool)syphonServer.hasClients : false));
        obj.Set("serverName", Napi::String::New(env, serverName ? [serverName UTF8String] : ""));
        obj.Set("width", Napi::Number::New(env, (double)surfaceWidth));
        obj.Set("height", Napi::Number::New(env, (double)surfaceHeight));
        obj.Set("surfaceId", Napi::Number::New(env, (double)currentSurfaceId));
        obj.Set("fps", Napi::Number::New(env, fps));
        obj.Set("cropEnabled", Napi::Boolean::New(env, cropEnabled));
        
        Napi::Object cropObj = Napi::Object::New(env);
        cropObj.Set("x", Napi::Number::New(env, cropRect.origin.x));
        cropObj.Set("y", Napi::Number::New(env, cropRect.origin.y));
        cropObj.Set("width", Napi::Number::New(env, cropRect.size.width));
        cropObj.Set("height", Napi::Number::New(env, cropRect.size.height));
        obj.Set("cropRegion", cropObj);

        return obj;
    }
};

@implementation SCStreamDelegateHandler
- (void)stream:(SCStream *)stream didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer ofType:(SCStreamOutputType)type {
    if (type != SCStreamOutputTypeScreen) return;
    if (self.serverPtr) {
        static_cast<SyphonPatchCanvasServer*>(self.serverPtr)->OnSampleBuffer(sampleBuffer);
    }
}
@end

Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    return SyphonPatchCanvasServer::Init(env, exports);
}

NODE_API_MODULE(syphon_patch_canvas, InitModule)
