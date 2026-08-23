/**
 * streamdeck_hid.mm
 * Asynchronous Native macOS IOKit / IOHIDManager driver for Elgato Stream Deck devices in Cables.
 * Features an asynchronous USB output worker queue and dedicated input thread for 0% main-thread latency.
 */

#import <napi.h>
#import <Cocoa/Cocoa.h>
#import <IOKit/hid/IOHIDManager.h>
#import <vector>
#import <mutex>
#import <thread>
#import <atomic>
#import <queue>
#import <condition_variable>

static void HandleInputReportCallback(void *context, IOReturn result, void *sender, IOHIDReportType type, uint32_t reportID, uint8_t *report, CFIndex reportLength);

struct OutReportTask {
    IOHIDReportType type;
    uint32_t reportId;
    std::vector<uint8_t> data;
};

class StreamDeckHID : public Napi::ObjectWrap<StreamDeckHID> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "StreamDeckHID", {
            InstanceMethod("getDevices", &StreamDeckHID::GetDevices),
            InstanceMethod("open", &StreamDeckHID::Open),
            InstanceMethod("close", &StreamDeckHID::Close),
            InstanceMethod("sendReport", &StreamDeckHID::SendReport),
            InstanceMethod("sendFeatureReport", &StreamDeckHID::SendFeatureReport),
            InstanceMethod("setInputReportCallback", &StreamDeckHID::SetInputReportCallback),
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("StreamDeckHID", func);
        return exports;
    }

    StreamDeckHID(const Napi::CallbackInfo& info) : Napi::ObjectWrap<StreamDeckHID>(info) {
        hidManager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
        NSDictionary *match = @{
            @kIOHIDVendorIDKey: @(0x0FD9)
        };
        IOHIDManagerSetDeviceMatching(hidManager, (__bridge CFDictionaryRef)match);

        currentDevice = nullptr;
        reportBuffer = new uint8_t[1024];
        tsfn = nullptr;
        isRunning = false;
        bgRunLoop = nullptr;
    }

    ~StreamDeckHID() {
        CloseInternal();
        if (hidManager) {
            CFRelease(hidManager);
            hidManager = nullptr;
        }
        delete[] reportBuffer;
    }

    void OnNativeInputReport(uint32_t reportId, const uint8_t* data, size_t length) {
        if (!tsfn) return;

        std::vector<uint8_t> payload(data, data + length);
        auto callback = [reportId, payload](Napi::Env env, Napi::Function jsCallback) {
            Napi::Object evt = Napi::Object::New(env);
            evt.Set("reportId", Napi::Number::New(env, reportId));
            Napi::Buffer<uint8_t> buf = Napi::Buffer<uint8_t>::Copy(env, payload.data(), payload.size());
            evt.Set("data", buf);
            jsCallback.Call({ evt });
        };

        tsfn.NonBlockingCall(callback);
    }

    void InputThreadProc(IOHIDDeviceRef dev) {
        @autoreleasepool {
            bgRunLoop = CFRunLoopGetCurrent();

            IOHIDDeviceScheduleWithRunLoop(dev, bgRunLoop, kCFRunLoopDefaultMode);
            IOHIDDeviceRegisterInputReportCallback(dev, reportBuffer, 1024, HandleInputReportCallback, this);

            while (isRunning.load()) {
                CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.05, true);
            }

            IOHIDDeviceRegisterInputReportCallback(dev, reportBuffer, 1024, nullptr, nullptr);
            IOHIDDeviceUnscheduleFromRunLoop(dev, bgRunLoop, kCFRunLoopDefaultMode);
            bgRunLoop = nullptr;
        }
    }

    void OutputThreadProc() {
        while (isRunning.load()) {
            OutReportTask task;
            {
                std::unique_lock<std::mutex> lock(outQueueMtx);
                outQueueCv.wait(lock, [this] {
                    return !isRunning.load() || !outQueue.empty();
                });

                if (!isRunning.load() && outQueue.empty()) break;

                task = std::move(outQueue.front());
                outQueue.pop();
            }

            if (currentDevice && !task.data.empty()) {
                IOReturn r = IOHIDDeviceSetReport(currentDevice, task.type, task.reportId, task.data.data(), task.data.size());
                if (r != kIOReturnSuccess) {
                    IOHIDReportType fallbackType = (task.type == kIOHIDReportTypeOutput) ? kIOHIDReportTypeFeature : kIOHIDReportTypeOutput;
                    IOHIDDeviceSetReport(currentDevice, fallbackType, task.reportId, task.data.data(), task.data.size());
                }
            }
        }
    }

private:
    IOHIDManagerRef hidManager;
    IOHIDDeviceRef currentDevice;
    uint8_t* reportBuffer;
    Napi::ThreadSafeFunction tsfn;
    std::mutex devMtx;
    std::atomic<bool> isRunning;
    CFRunLoopRef bgRunLoop;
    std::thread inputThread;
    std::thread outputThread;

    std::queue<OutReportTask> outQueue;
    std::mutex outQueueMtx;
    std::condition_variable outQueueCv;

    void CloseInternal() {
        isRunning = false;

        {
            std::lock_guard<std::mutex> lock(outQueueMtx);
            while (!outQueue.empty()) outQueue.pop();
            outQueueCv.notify_all();
        }

        if (bgRunLoop) {
            CFRunLoopStop(bgRunLoop);
        }

        if (inputThread.joinable()) {
            inputThread.join();
        }

        if (outputThread.joinable()) {
            outputThread.join();
        }

        std::lock_guard<std::mutex> lock(devMtx);
        if (currentDevice) {
            IOHIDDeviceClose(currentDevice, kIOHIDOptionsTypeNone);
            CFRelease(currentDevice);
            currentDevice = nullptr;
        }

        if (tsfn) {
            tsfn.Release();
            tsfn = nullptr;
        }
    }

    Napi::Value GetDevices(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::Array arr = Napi::Array::New(env);

        if (!hidManager) return arr;

        CFSetRef deviceSet = IOHIDManagerCopyDevices(hidManager);
        if (!deviceSet) return arr;

        CFIndex count = CFSetGetCount(deviceSet);
        CFTypeRef values[32];
        count = std::min<CFIndex>(count, 32);
        CFSetGetValues(deviceSet, values);

        uint32_t outIdx = 0;
        for (CFIndex i = 0; i < count; i++) {
            IOHIDDeviceRef dev = (IOHIDDeviceRef)values[i];
            NSNumber *pid = (__bridge NSNumber*)IOHIDDeviceGetProperty(dev, CFSTR(kIOHIDProductIDKey));
            NSNumber *vid = (__bridge NSNumber*)IOHIDDeviceGetProperty(dev, CFSTR(kIOHIDVendorIDKey));
            NSString *product = (__bridge NSString*)IOHIDDeviceGetProperty(dev, CFSTR(kIOHIDProductKey)) ?: @"Stream Deck";

            Napi::Object obj = Napi::Object::New(env);
            obj.Set("index", Napi::Number::New(env, outIdx));
            obj.Set("productName", Napi::String::New(env, [product UTF8String]));
            obj.Set("vendorId", Napi::Number::New(env, [vid intValue]));
            obj.Set("productId", Napi::Number::New(env, [pid intValue]));

            arr.Set(outIdx++, obj);
        }

        CFRelease(deviceSet);
        return arr;
    }

    class OpenWorker : public Napi::AsyncWorker {
    public:
        OpenWorker(StreamDeckHID* parent, int targetIndex, Napi::Promise::Deferred deferred)
            : Napi::AsyncWorker(deferred.Env()), parent(parent), targetIndex(targetIndex), deferred(deferred), success(false) {}

        void Execute() override {
            parent->CloseInternal();

            if (!parent->hidManager) return;

            CFSetRef deviceSet = IOHIDManagerCopyDevices(parent->hidManager);
            if (!deviceSet) return;

            CFIndex count = CFSetGetCount(deviceSet);
            if (targetIndex < 0 || targetIndex >= count) {
                CFRelease(deviceSet);
                return;
            }

            CFTypeRef values[32];
            count = std::min<CFIndex>(count, 32);
            CFSetGetValues(deviceSet, values);

            parent->currentDevice = (IOHIDDeviceRef)values[targetIndex];
            CFRetain(parent->currentDevice);
            CFRelease(deviceSet);

            IOReturn ret = IOHIDDeviceOpen(parent->currentDevice, kIOHIDOptionsTypeNone);
            if (ret != kIOReturnSuccess) {
                CFRelease(parent->currentDevice);
                parent->currentDevice = nullptr;
                return;
            }

            parent->isRunning = true;
            parent->inputThread = std::thread(&StreamDeckHID::InputThreadProc, parent, parent->currentDevice);
            parent->outputThread = std::thread(&StreamDeckHID::OutputThreadProc, parent);
            success = true;
        }

        void OnOK() override {
            deferred.Resolve(Napi::Boolean::New(Env(), success));
        }

        void OnError(const Napi::Error& err) override {
            deferred.Reject(err.Value());
        }

    private:
        StreamDeckHID* parent;
        int targetIndex;
        Napi::Promise::Deferred deferred;
        bool success;
    };

    Napi::Value Open(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        int targetIndex = 0;
        if (info.Length() > 0 && info[0].IsNumber()) {
            targetIndex = info[0].As<Napi::Number>().Int32Value();
        }

        Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
        OpenWorker* worker = new OpenWorker(this, targetIndex, deferred);
        worker->Queue();
        return deferred.Promise();
    }

    Napi::Value Close(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        CloseInternal();
        return Napi::Boolean::New(env, true);
    }

    Napi::Value SetInputReportCallback(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (info.Length() < 1 || !info[0].IsFunction()) {
            return env.Undefined();
        }

        if (tsfn) {
            tsfn.Release();
        }

        tsfn = Napi::ThreadSafeFunction::New(
            env,
            info[0].As<Napi::Function>(),
            "StreamDeckInputReport",
            0,
            1
        );
        tsfn.Unref(env);

        return env.Undefined();
    }

    Napi::Value SendReport(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 2 || !info[0].IsNumber() || (!info[1].IsBuffer() && !info[1].IsTypedArray())) {
            return Napi::Boolean::New(env, false);
        }

        uint32_t reportId = info[0].As<Napi::Number>().Uint32Value();
        const uint8_t* data = nullptr;
        size_t length = 0;

        if (info[1].IsBuffer()) {
            Napi::Buffer<uint8_t> buf = info[1].As<Napi::Buffer<uint8_t>>();
            data = buf.Data();
            length = buf.Length();
        } else {
            Napi::TypedArray arr = info[1].As<Napi::TypedArray>();
            Napi::ArrayBuffer ab = arr.ArrayBuffer();
            data = (const uint8_t*)ab.Data() + arr.ByteOffset();
            length = arr.ByteLength();
        }

        if (!data || length == 0) return Napi::Boolean::New(env, false);

        OutReportTask task;
        task.type = kIOHIDReportTypeOutput;
        task.reportId = reportId;
        task.data.assign(data, data + length);

        {
            std::lock_guard<std::mutex> lock(outQueueMtx);
            outQueue.push(std::move(task));
            outQueueCv.notify_one();
        }

        return Napi::Boolean::New(env, true);
    }

    Napi::Value SendFeatureReport(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 2 || !info[0].IsNumber() || (!info[1].IsBuffer() && !info[1].IsTypedArray())) {
            return Napi::Boolean::New(env, false);
        }

        uint32_t reportId = info[0].As<Napi::Number>().Uint32Value();
        const uint8_t* data = nullptr;
        size_t length = 0;

        if (info[1].IsBuffer()) {
            Napi::Buffer<uint8_t> buf = info[1].As<Napi::Buffer<uint8_t>>();
            data = buf.Data();
            length = buf.Length();
        } else {
            Napi::TypedArray arr = info[1].As<Napi::TypedArray>();
            Napi::ArrayBuffer ab = arr.ArrayBuffer();
            data = (const uint8_t*)ab.Data() + arr.ByteOffset();
            length = arr.ByteLength();
        }

        if (!data || length == 0) return Napi::Boolean::New(env, false);

        OutReportTask task;
        task.type = kIOHIDReportTypeFeature;
        task.reportId = reportId;
        task.data.assign(data, data + length);

        {
            std::lock_guard<std::mutex> lock(outQueueMtx);
            outQueue.push(std::move(task));
            outQueueCv.notify_one();
        }

        return Napi::Boolean::New(env, true);
    }
};

static void HandleInputReportCallback(void *context, IOReturn result, void *sender, IOHIDReportType type, uint32_t reportID, uint8_t *report, CFIndex reportLength) {
    if (!context || result != kIOReturnSuccess || !report || reportLength <= 0) return;
    StreamDeckHID *driver = static_cast<StreamDeckHID*>(context);
    driver->OnNativeInputReport(reportID, report, (size_t)reportLength);
}

Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    return StreamDeckHID::Init(env, exports);
}

NODE_API_MODULE(streamdeck_hid, InitModule)
