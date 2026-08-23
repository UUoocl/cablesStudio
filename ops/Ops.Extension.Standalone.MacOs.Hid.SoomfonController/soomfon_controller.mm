#include <node_api.h>
#import <Foundation/Foundation.h>
#import <IOKit/hid/IOHIDManager.h>
#import <CoreGraphics/CoreGraphics.h>
#import <ImageIO/ImageIO.h>
#include <string>
#include <vector>
#include <mutex>
#include <thread>
#include <algorithm>
#include <iostream>

struct SoomfonEventPayload {
    std::string jsonStr;
};

static IOHIDManagerRef g_hid_manager = NULL;
static CFRunLoopRef g_run_loop = NULL;
static std::thread g_thread;
static std::mutex g_devices_mutex;
static std::vector<IOHIDDeviceRef> g_known_devices;

static IOHIDDeviceRef g_active_device = NULL;
static std::mutex g_device_mutex;
static napi_threadsafe_function g_ts_fn = nullptr;
static uint8_t g_input_buffer[512];
static dispatch_source_t g_heartbeat_timer = nil;

// Function declarations
void SendJSEvent(const std::string& jsonStr);
void StopHeartbeatTimer();
void StartHeartbeatTimer();
void CloseActiveDevice();
bool OpenActiveDevice(IOHIDDeviceRef dev);
void SendPacketLocked(const uint8_t* cmd, size_t cmd_len);

// JS Threadsafe Invoker
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    SoomfonEventPayload* event = static_cast<SoomfonEventPayload*>(data);
    
    napi_value event_str = nullptr;
    napi_create_string_utf8(env, event->jsonStr.c_str(), NAPI_AUTO_LENGTH, &event_str);
    
    napi_value global = nullptr;
    napi_get_global(env, &global);
    
    napi_value result = nullptr;
    napi_call_function(env, global, js_cb, 1, &event_str, &result);
    
    delete event;
}

void SendJSEvent(const std::string& jsonStr) {
    if (!g_ts_fn) return;
    
    SoomfonEventPayload* event = new SoomfonEventPayload();
    event->jsonStr = jsonStr;
    
    napi_acquire_threadsafe_function(g_ts_fn);
    napi_call_threadsafe_function(g_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(g_ts_fn, napi_tsfn_release);
}

// Helpers for USB Packets
void SendPacketLocked(const uint8_t* cmd, size_t cmd_len) {
    if (!g_active_device) return;
    
    uint8_t packet[1024];
    memset(packet, 0, sizeof(packet));
    
    // Header: CRT\x00\x00
    packet[0] = 0x43; // C
    packet[1] = 0x52; // R
    packet[2] = 0x54; // T
    packet[3] = 0x00;
    packet[4] = 0x00;
    
    for (size_t i = 0; i < cmd_len; i++) {
        if (5 + i < sizeof(packet)) {
            packet[5 + i] = cmd[i];
        }
    }
    
    IOHIDDeviceSetReport(
        g_active_device,
        kIOHIDReportTypeOutput,
        0,
        packet,
        sizeof(packet)
    );
}

void SetBrightnessLocked(int percent) {
    uint8_t percentByte = (uint8_t)std::clamp(percent, 0, 100);
    uint8_t cmd[] = {0x4C, 0x49, 0x47, 0x00, 0x00, percentByte}; // LIG\x00\x00 percent
    SendPacketLocked(cmd, sizeof(cmd));
}

void ClearAllImagesLocked() {
    uint8_t clearCmd[] = {0x43, 0x4C, 0x45, 0x00, 0x00, 0x00, 0xFF}; // CLE\x00\x00\x00\xFF
    SendPacketLocked(clearCmd, sizeof(clearCmd));
    
    uint8_t flushCmd[] = {0x53, 0x54, 0x50}; // STP
    SendPacketLocked(flushCmd, sizeof(flushCmd));
}

void SendInitSequenceLocked() {
    uint8_t disCmd[] = {0x44, 0x49, 0x53, 0x00, 0x00}; // DIS\x00\x00
    SendPacketLocked(disCmd, sizeof(disCmd));
    SetBrightnessLocked(80);
    ClearAllImagesLocked();
}

// Input Report Callback
void HandleInputReport(void* context, IOReturn result, void* sender, IOHIDReportType type, uint32_t reportID, uint8_t* report, CFIndex reportLength) {
    if (result != kIOReturnSuccess || reportLength < 11) return;
    
    uint8_t action = report[9];
    uint8_t state = report[10];
    bool pressed = (state != 0);
    
    // Key mappings (Buttons 0 to 8)
    // Physical button keys:
    // 0x01: 0, 0x02: 1, 0x03: 2, 0x04: 3, 0x05: 4, 0x06: 5,
    // 0x25: 6, 0x30: 7, 0x31: 8
    int keyIndex = -1;
    if (action == 0x01) keyIndex = 0;
    else if (action == 0x02) keyIndex = 1;
    else if (action == 0x03) keyIndex = 2;
    else if (action == 0x04) keyIndex = 3;
    else if (action == 0x05) keyIndex = 4;
    else if (action == 0x06) keyIndex = 5;
    else if (action == 0x25) keyIndex = 6;
    else if (action == 0x30) keyIndex = 7;
    else if (action == 0x31) keyIndex = 8;
    
    if (keyIndex != -1) {
        std::string json = "{\"type\":\"key_event\",\"key\":" + std::to_string(keyIndex) + ",\"pressed\":" + (pressed ? "true" : "false") + "}";
        SendJSEvent(json);
        return;
    }
    
    // Knob twists
    // 0x90: knob 0 direction -1, 0x91: knob 0 direction 1
    // 0x50: knob 1 direction -1, 0x51: knob 1 direction 1
    // 0x60: knob 2 direction -1, 0x61: knob 2 direction 1
    int knobIndex = -1;
    int direction = 0;
    if (action == 0x90) { knobIndex = 0; direction = -1; }
    else if (action == 0x91) { knobIndex = 0; direction = 1; }
    else if (action == 0x50) { knobIndex = 1; direction = -1; }
    else if (action == 0x51) { knobIndex = 1; direction = 1; }
    else if (action == 0x60) { knobIndex = 2; direction = -1; }
    else if (action == 0x61) { knobIndex = 2; direction = 1; }
    
    if (knobIndex != -1) {
        std::string json = "{\"type\":\"knob_turn\",\"knob\":" + std::to_string(knobIndex) + ",\"direction\":" + std::to_string(direction) + "}";
        SendJSEvent(json);
        return;
    }
    
    // Knob clicks
    // 0x33: knob 0, 0x35: knob 1, 0x34: knob 2
    int clickKnob = -1;
    if (action == 0x33) clickKnob = 0;
    else if (action == 0x35) clickKnob = 1;
    else if (action == 0x34) clickKnob = 2;
    
    if (clickKnob != -1) {
        std::string json = "{\"type\":\"knob_click\",\"knob\":" + std::to_string(clickKnob) + ",\"pressed\":" + (pressed ? "true" : "false") + "}";
        SendJSEvent(json);
        return;
    }
}

// Device Open / Close
bool OpenActiveDevice(IOHIDDeviceRef dev) {
    // Phase 1: Wake Up Connection
    IOReturn res = IOHIDDeviceOpen(dev, kIOHIDOptionsTypeNone);
    if (res != kIOReturnSuccess) return false;
    
    {
        std::lock_guard<std::mutex> lock(g_device_mutex);
        g_active_device = dev;
        SendInitSequenceLocked();
    }
    IOHIDDeviceClose(dev, kIOHIDOptionsTypeNone);
    {
        std::lock_guard<std::mutex> lock(g_device_mutex);
        g_active_device = NULL;
    }
    
    // Wait for wake delay (500ms)
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    
    // Phase 2: Operations Connection
    res = IOHIDDeviceOpen(dev, kIOHIDOptionsTypeNone);
    if (res != kIOReturnSuccess) return false;
    
    {
        std::lock_guard<std::mutex> lock(g_device_mutex);
        g_active_device = dev;
        SendInitSequenceLocked();
    }
    
    // Register Input Callback
    IOHIDDeviceRegisterInputReportCallback(
        dev,
        g_input_buffer,
        sizeof(g_input_buffer),
        HandleInputReport,
        NULL
    );
    
    StartHeartbeatTimer();
    return true;
}

void CloseActiveDevice() {
    StopHeartbeatTimer();
    
    std::lock_guard<std::mutex> lock(g_device_mutex);
    if (g_active_device) {
        // Send shutdown and sleep commands
        uint8_t shutdownCmd[] = {0x43, 0x4C, 0x45, 0x00, 0x00, 0x44, 0x43}; // SHUTDOWN
        SendPacketLocked(shutdownCmd, sizeof(shutdownCmd));
        uint8_t sleepCmd[] = {0x48, 0x41, 0x4E}; // SLEEP/STANDBY
        SendPacketLocked(sleepCmd, sizeof(sleepCmd));
        
        IOHIDDeviceClose(g_active_device, kIOHIDOptionsTypeNone);
        g_active_device = NULL;
    }
}

// GCD Heartbeat Timer
void StartHeartbeatTimer() {
    StopHeartbeatTimer();
    g_heartbeat_timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0));
    dispatch_source_set_timer(g_heartbeat_timer, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC), 10 * NSEC_PER_SEC, 1 * NSEC_PER_SEC);
    dispatch_source_set_event_handler(g_heartbeat_timer, ^{
        std::lock_guard<std::mutex> lock(g_device_mutex);
        if (g_active_device) {
            uint8_t connectCmd[] = {0x43, 0x4F, 0x4E, 0x4E, 0x45, 0x43, 0x54}; // CONNECT
            SendPacketLocked(connectCmd, sizeof(connectCmd));
        }
    });
    dispatch_resume(g_heartbeat_timer);
}

void StopHeartbeatTimer() {
    if (g_heartbeat_timer) {
        dispatch_source_cancel(g_heartbeat_timer);
        g_heartbeat_timer = nil;
    }
}

// Device matching helper
std::string GetDeviceSerialNumber(IOHIDDeviceRef dev) {
    CFStringRef serialRef = (CFStringRef)IOHIDDeviceGetProperty(dev, CFSTR(kIOHIDSerialNumberKey));
    if (!serialRef) return "";
    char buf[256];
    if (CFStringGetCString(serialRef, buf, sizeof(buf), kCFStringEncodingUTF8)) {
        return std::string(buf);
    }
    return "";
}

// IOHIDManager Callbacks
void OnDeviceMatched(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    if (std::find(g_known_devices.begin(), g_known_devices.end(), device) == g_known_devices.end()) {
        g_known_devices.push_back(device);
    }
}

void OnDeviceRemoved(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    auto it = std::find(g_known_devices.begin(), g_known_devices.end(), device);
    if (it != g_known_devices.end()) {
        g_known_devices.erase(it);
    }
    
    bool isActive = false;
    {
        std::lock_guard<std::mutex> devLock(g_device_mutex);
        isActive = (g_active_device == device);
    }
    if (isActive) {
        CloseActiveDevice();
        SendJSEvent("{\"type\":\"disconnected\"}");
    }
}

// Image Manipulation Helper
void UploadJPEGImageToDeviceLocked(int keyIndex, NSData* jpegBytes) {
    if (!g_active_device) return;
    
    // Send announce packet
    size_t size = [jpegBytes length];
    uint8_t sizeHi = (uint8_t)((size >> 8) & 0xFF);
    uint8_t sizeLo = (uint8_t)(size & 0xFF);
    uint8_t keyByte = (uint8_t)(keyIndex + 1);
    
    uint8_t announceCmd[] = {0x42, 0x41, 0x54, 0x00, 0x00, sizeHi, sizeLo, keyByte}; // BAT\x00\x00
    SendPacketLocked(announceCmd, sizeof(announceCmd));
    
    // Upload chunks of 1024 bytes each
    const uint8_t* rawData = (const uint8_t*)[jpegBytes bytes];
    size_t offset = 0;
    while (offset < size) {
        size_t chunkLength = std::min((size_t)1024, size - offset);
        
        uint8_t chunkPacket[1024];
        memset(chunkPacket, 0, sizeof(chunkPacket));
        memcpy(chunkPacket, rawData + offset, chunkLength);
        
        IOHIDDeviceSetReport(
            g_active_device,
            kIOHIDReportTypeOutput,
            0,
            chunkPacket,
            sizeof(chunkPacket)
        );
        
        offset += 1024;
    }
    
    // Send Flush
    uint8_t flushCmd[] = {0x53, 0x54, 0x50}; // STP
    SendPacketLocked(flushCmd, sizeof(flushCmd));
}

// Rotates & encodes a CGImageRef to JPEG
NSData* RotateAndEncodeToJPEG(CGImageRef cgImage) {
    size_t imageWidth = CGImageGetWidth(cgImage);
    size_t imageHeight = CGImageGetHeight(cgImage);
    
    // Target CCW rotated dimensions
    size_t w = imageHeight;
    size_t h = imageWidth;
    
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(
        NULL,
        w,
        h,
        8,
        0,
        colorSpace,
        kCGImageAlphaNoneSkipLast
    );
    CGColorSpaceRelease(colorSpace);
    
    if (!context) return nil;
    
    CGContextTranslateCTM(context, (CGFloat)w / 2.0, (CGFloat)h / 2.0);
    CGContextRotateCTM(context, -M_PI / 2.0);
    CGContextDrawImage(context, CGRectMake(-(CGFloat)imageWidth / 2.0, -(CGFloat)imageHeight / 2.0, imageWidth, imageHeight), cgImage);
    
    CGImageRef rotated = CGBitmapContextCreateImage(context);
    CGContextRelease(context);
    
    if (!rotated) return nil;
    
    NSMutableData* jpegData = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)jpegData, CFSTR("public.jpeg"), 1, NULL);
    NSDictionary* options = @{
        (__bridge id)kCGImageDestinationLossyCompressionQuality: @(0.9)
    };
    CGImageDestinationAddImage(destination, rotated, (__bridge CFDictionaryRef)options);
    CGImageDestinationFinalize(destination);
    CFRelease(destination);
    CGImageRelease(rotated);
    
    return jpegData;
}

// N-API: start(deviceIndex, callback)
napi_value Start(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Device index and callback required");
        return nullptr;
    }
    
    int32_t deviceIndex = 0;
    napi_get_value_int32(env, args[0], &deviceIndex);
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "SoomfonCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_status status = napi_create_threadsafe_function(
        env,
        args[1],
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
        napi_throw_error(env, nullptr, "Failed to create threadsafe callback function");
        return nullptr;
    }
    
    if (!g_hid_manager) {
        g_hid_manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
        
        NSArray* matchingDicts = @[
            @{
                @kIOHIDVendorIDKey: @(0x1500),
                @kIOHIDProductIDKey: @(0x3001),
                @kIOHIDDeviceUsagePageKey: @(0xFFA0)
            },
            @{
                @kIOHIDVendorIDKey: @(0x0300),
                @kIOHIDProductIDKey: @(0x3002),
                @kIOHIDDeviceUsagePageKey: @(0xFFA0)
            }
        ];
        
        IOHIDManagerSetDeviceMatchingMultiple(g_hid_manager, (__bridge CFArrayRef)matchingDicts);
        IOHIDManagerRegisterDeviceMatchingCallback(g_hid_manager, OnDeviceMatched, NULL);
        IOHIDManagerRegisterDeviceRemovalCallback(g_hid_manager, OnDeviceRemoved, NULL);
        
        g_thread = std::thread([]() {
            g_run_loop = CFRunLoopGetCurrent();
            IOHIDManagerScheduleWithRunLoop(g_hid_manager, g_run_loop, kCFRunLoopDefaultMode);
            IOReturn openRes = IOHIDManagerOpen(g_hid_manager, kIOHIDOptionsTypeNone);
            if (openRes != kIOReturnSuccess) {
                std::cout << "[SoomfonController] Failed to open IOHIDManager" << std::endl;
                return;
            }
            CFRunLoopRun();
        });
    }
    
    // Wait for manager to match devices (retry up to 1.5 seconds)
    int retries = 0;
    while (true) {
        {
            std::lock_guard<std::mutex> lock(g_devices_mutex);
            if (!g_known_devices.empty() || retries >= 15) {
                break;
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        retries++;
    }
    
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    if (g_known_devices.empty()) {
        napi_throw_error(env, nullptr, "No Soomfon devices found");
        return nullptr;
    }
    
    // Sort devices by serial number
    std::vector<IOHIDDeviceRef> sorted = g_known_devices;
    std::sort(sorted.begin(), sorted.end(), [](IOHIDDeviceRef a, IOHIDDeviceRef b) {
        return GetDeviceSerialNumber(a) < GetDeviceSerialNumber(b);
    });
    
    if (deviceIndex < 0 || deviceIndex >= (int)sorted.size()) {
        napi_throw_error(env, nullptr, "Device index out of range");
        return nullptr;
    }
    
    IOHIDDeviceRef targetDev = sorted[deviceIndex];
    
    CloseActiveDevice();
    
    if (OpenActiveDevice(targetDev)) {
        CFStringRef productRef = (CFStringRef)IOHIDDeviceGetProperty(targetDev, CFSTR(kIOHIDProductKey));
        char nameBuf[256] = "Soomfon Stream Controller";
        if (productRef) {
            CFStringGetCString(productRef, nameBuf, sizeof(nameBuf), kCFStringEncodingUTF8);
        }
        
        std::string json = "{\"type\":\"connected\",\"model\":\"" + std::string(nameBuf) + "\",\"keys\":9,\"display_keys\":6,\"rows\":2,\"cols\":3,\"key_width\":60,\"key_height\":60}";
        SendJSEvent(json);
    } else {
        napi_throw_error(env, nullptr, "Failed to open Soomfon device");
        return nullptr;
    }
    
    napi_value ret = nullptr;
    napi_get_boolean(env, true, &ret);
    return ret;
}

// N-API: stop()
napi_value Stop(napi_env env, napi_callback_info info) {
    CloseActiveDevice();
    
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    
    return nullptr;
}

// N-API: setKeyImage(keyIndex, base64)
napi_value SetKeyImage(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Key index and base64 string required");
        return nullptr;
    }
    
    int32_t keyIndex = 0;
    napi_get_value_int32(env, args[0], &keyIndex);
    
    size_t base64_len = 0;
    napi_get_value_string_utf8(env, args[1], nullptr, 0, &base64_len);
    std::string base64Str(base64_len, '\0');
    napi_get_value_string_utf8(env, args[1], &base64Str[0], base64_len + 1, &base64_len);
    
    @autoreleasepool {
        NSString* nsBase64 = [NSString stringWithUTF8String:base64Str.c_str()];
        NSData* imgData = [[NSData alloc] initWithBase64EncodedString:nsBase64 options:0];
        if (!imgData) {
            napi_throw_error(env, nullptr, "Failed to decode base64 data");
            return nullptr;
        }
        
        CGImageSourceRef src = CGImageSourceCreateWithData((__bridge CFDataRef)imgData, NULL);
        if (!src) {
            napi_throw_error(env, nullptr, "Failed to parse image from data");
            return nullptr;
        }
        CGImageRef cgImage = CGImageSourceCreateImageAtIndex(src, 0, NULL);
        CFRelease(src);
        
        if (!cgImage) {
            napi_throw_error(env, nullptr, "Failed to create CGImage");
            return nullptr;
        }
        
        NSData* jpegBytes = RotateAndEncodeToJPEG(cgImage);
        CGImageRelease(cgImage);
        
        if (!jpegBytes) {
            napi_throw_error(env, nullptr, "Failed to rotate or encode image");
            return nullptr;
        }
        
        std::lock_guard<std::mutex> lock(g_device_mutex);
        if (g_active_device) {
            UploadJPEGImageToDeviceLocked(keyIndex, jpegBytes);
        }
    }
    
    return nullptr;
}

// N-API: setStretchedImage(base64)
napi_value SetStretchedImage(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Stretched base64 string required");
        return nullptr;
    }
    
    size_t base64_len = 0;
    napi_get_value_string_utf8(env, args[0], nullptr, 0, &base64_len);
    std::string base64Str(base64_len, '\0');
    napi_get_value_string_utf8(env, args[0], &base64Str[0], base64_len + 1, &base64_len);
    
    @autoreleasepool {
        NSString* nsBase64 = [NSString stringWithUTF8String:base64Str.c_str()];
        NSData* imgData = [[NSData alloc] initWithBase64EncodedString:nsBase64 options:0];
        if (!imgData) {
            napi_throw_error(env, nullptr, "Failed to decode base64 data");
            return nullptr;
        }
        
        CGImageSourceRef src = CGImageSourceCreateWithData((__bridge CFDataRef)imgData, NULL);
        if (!src) {
            napi_throw_error(env, nullptr, "Failed to parse image from data");
            return nullptr;
        }
        CGImageRef cgImage = CGImageSourceCreateImageAtIndex(src, 0, NULL);
        CFRelease(src);
        
        if (!cgImage) {
            napi_throw_error(env, nullptr, "Failed to create CGImage");
            return nullptr;
        }
        
        int cols = 3;
        int rows = 2;
        int kw = 60;
        int kh = 60;
        
        std::lock_guard<std::mutex> lock(g_device_mutex);
        if (!g_active_device) {
            CGImageRelease(cgImage);
            return nullptr;
        }
        
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                CGRect cropRect = CGRectMake(c * kw, r * kh, kw, kh);
                CGImageRef cropped = CGImageCreateWithImageInRect(cgImage, cropRect);
                if (cropped) {
                    NSData* jpegBytes = RotateAndEncodeToJPEG(cropped);
                    CGImageRelease(cropped);
                    
                    if (jpegBytes) {
                        int keyIndex = r * cols + c;
                        UploadJPEGImageToDeviceLocked(keyIndex, jpegBytes);
                    }
                }
            }
        }
        
        CGImageRelease(cgImage);
    }
    
    return nullptr;
}

// N-API: setBrightness(percent)
napi_value SetBrightness(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Brightness percentage required");
        return nullptr;
    }
    
    int32_t percent = 80;
    napi_get_value_int32(env, args[0], &percent);
    
    std::lock_guard<std::mutex> lock(g_device_mutex);
    if (g_active_device) {
        SetBrightnessLocked(percent);
    }
    
    return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setKeyImage", nullptr, SetKeyImage, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setStretchedImage", nullptr, SetStretchedImage, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setBrightness", nullptr, SetBrightness, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
