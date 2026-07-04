#include <node_api.h>
#include <IOKit/hid/IOHIDManager.h>
#include <IOKit/hid/IOHIDKeys.h>
#include <CoreGraphics/CoreGraphics.h>
#include <ImageIO/ImageIO.h>
#include <vector>
#include <string>
#include <mutex>
#include <thread>
#include <chrono>
#include <algorithm>

// Base64 decoding helper
static std::vector<uint8_t> Base64Decode(const std::string& input) {
    static const int lookup[] = {
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
        -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
        -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
    };

    std::vector<uint8_t> out;
    int val = 0, valb = -18;
    for (char c : input) {
        if (c == '=') break;
        if (c < 0 || c > 127) continue;
        int d = lookup[(int)c];
        if (d == -1) continue;
        val = (val << 6) + d;
        valb += 6;
        if (valb >= 0) {
            out.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}

// Device Product Info mapping
struct DeviceInfo {
    int productId;
    std::string name;
    int iconSize;
    int keyCount;
    int cols;
    int rows;
    int pagePacketSize;
    bool isVersionTwo;
};

static DeviceInfo GetDeviceInfo(int pid) {
    switch (pid) {
        case 0x0060: return { pid, "Stream Deck V1", 72, 15, 5, 3, 8191, false };
        case 0x006d: return { pid, "Stream Deck V2", 72, 15, 5, 3, 1024, true };
        case 0x0080: return { pid, "Stream Deck Mk2", 72, 15, 5, 3, 1024, true };
        case 0x0063: return { pid, "Stream Deck Mini V1", 80, 6, 3, 2, 1024, false };
        case 0x0090: return { pid, "Stream Deck Mini V2", 80, 6, 3, 2, 1024, true };
        case 0x006c: return { pid, "Stream Deck XL V1", 96, 32, 8, 4, 1024, true };
        case 0x008f: return { pid, "Stream Deck XL Gen 2", 96, 32, 8, 4, 1024, true };
        case 0x0084: return { pid, "Stream Deck Plus", 120, 8, 4, 2, 1024, true };
        default:     return { pid, "Unknown Stream Deck", 72, 15, 5, 3, 1024, true };
    }
}

// Horizontal flipping/mirroring mapper for V1 Stream Decks
static int GetDeviceKeyIndex(int pid, int userKeyIndex) {
    if (pid == 0x0060) { // V1
        int row = userKeyIndex / 5;
        int col = userKeyIndex % 5;
        return row * 5 + (4 - col);
    }
    return userKeyIndex;
}

static int GetUserKeyIndex(int pid, int deviceKeyIndex) {
    if (pid == 0x0060) { // V1
        int row = deviceKeyIndex / 5;
        int col = deviceKeyIndex % 5;
        return row * 5 + (4 - col);
    }
    return deviceKeyIndex;
}

// Global matched devices lists protected by mutexes
static IOHIDManagerRef g_hid_manager = nullptr;
static std::mutex g_devices_mutex;
static std::vector<IOHIDDeviceRef> g_known_devices;

static std::mutex g_device_mutex;
static IOHIDDeviceRef g_active_device = nullptr;
static DeviceInfo g_active_device_info = { 0, "", 0, 0, 0, 0, 0, false };
static std::vector<bool> g_button_states;

static napi_threadsafe_function g_ts_fn = nullptr;

static std::thread g_run_loop_thread;
static CFRunLoopRef g_background_run_loop = nullptr;
static std::mutex g_thread_mutex;

// Helper to query device property
static std::string GetDevicePropertyString(IOHIDDeviceRef dev, CFStringRef key) {
    CFTypeRef prop = IOHIDDeviceGetProperty(dev, key);
    if (prop && CFGetTypeID(prop) == CFStringGetTypeID()) {
        char buf[256] = {0};
        if (CFStringGetCString((CFStringRef)prop, buf, sizeof(buf), kCFStringEncodingUTF8)) {
            return std::string(buf);
        }
    }
    return "";
}

static int GetDevicePropertyInt(IOHIDDeviceRef dev, CFStringRef key) {
    CFTypeRef prop = IOHIDDeviceGetProperty(dev, key);
    if (prop && CFGetTypeID(prop) == CFNumberGetTypeID()) {
        int val = 0;
        if (CFNumberGetValue((CFNumberRef)prop, kCFNumberIntType, &val)) {
            return val;
        }
    }
    return 0;
}

// Asynchronous execution call for thread safe callback
static void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    std::pair<int, bool>* eventData = static_cast<std::pair<int, bool>*>(data);
    if (!eventData) return;

    napi_value eventObj;
    napi_create_object(env, &eventObj);

    napi_value valKey, valPressed;
    napi_create_int32(env, eventData->first, &valKey);
    napi_get_boolean(env, eventData->second, &valPressed);

    napi_set_named_property(env, eventObj, "key", valKey);
    napi_set_named_property(env, eventObj, "pressed", valPressed);

    napi_value global;
    napi_get_global(env, &global);

    napi_value resultVal;
    napi_call_function(env, global, js_cb, 1, &eventObj, &resultVal);

    delete eventData;
}

// Callback for HID Reports
static void InputReportCallback(void* context, IOReturn result, void* sender, IOHIDReportType type, uint32_t reportID, uint8_t* report, CFIndex reportLength) {
    std::lock_guard<std::mutex> lock(g_device_mutex);
    if (!g_active_device || g_active_device_info.keyCount <= 0) return;

    int keyCount = g_active_device_info.keyCount;
    int headerOffset = g_active_device_info.isVersionTwo ? 4 : 1;

    if (reportLength < headerOffset + keyCount) return;

    for (int i = 0; i < keyCount; ++i) {
        bool isPressed = (report[headerOffset + i] == 1);
        int userKey = GetUserKeyIndex(g_active_device_info.productId, i);

        if (userKey >= 0 && userKey < (int)g_button_states.size()) {
            if (isPressed != g_button_states[userKey]) {
                g_button_states[userKey] = isPressed;

                if (g_ts_fn) {
                    auto* data = new std::pair<int, bool>(userKey, isPressed);
                    napi_call_threadsafe_function(g_ts_fn, data, napi_tsfn_blocking);
                }
            }
        }
    }
}

// Feature reports writers
static void WriteFeatureReport(IOHIDDeviceRef dev, const std::vector<uint8_t>& reportData) {
    if (!dev) return;
    IOHIDDeviceSetReport(
        dev,
        kIOHIDReportTypeFeature,
        CFIndex(reportData[0]),
        reportData.data(),
        reportData.size()
    );
}

static void WriteOutputReport(IOHIDDeviceRef dev, const std::vector<uint8_t>& reportData) {
    if (!dev) return;
    IOHIDDeviceSetReport(
        dev,
        kIOHIDReportTypeOutput,
        CFIndex(reportData[0]),
        reportData.data(),
        reportData.size()
    );
}

// Clean up current active device
static void CloseActiveDevice() {
    std::lock_guard<std::mutex> lock(g_device_mutex);
    if (g_active_device) {
        // Reset Device (displays default logo)
        std::vector<uint8_t> resetReport;
        if (g_active_device_info.isVersionTwo) {
            resetReport = { 0x03, 0x02 };
            resetReport.resize(32, 0);
        } else {
            resetReport = { 0x0B, 0x63 };
            resetReport.resize(17, 0);
        }
        WriteFeatureReport(g_active_device, resetReport);

        static uint8_t dummy[1] = {0};
        IOHIDDeviceRegisterInputReportCallback(g_active_device, dummy, 0, nullptr, nullptr);
        {
            std::lock_guard<std::mutex> lock(g_thread_mutex);
            if (g_background_run_loop) {
                IOHIDDeviceUnscheduleFromRunLoop(g_active_device, g_background_run_loop, kCFRunLoopDefaultMode);
            }
        }
        IOHIDDeviceClose(g_active_device, kIOHIDOptionsTypeNone);
        g_active_device = nullptr;
    }
    g_active_device_info = { 0, "", 0, 0, 0, 0, 0, false };
    g_button_states.clear();
}

// Connect matching devices to known list
static void DeviceMatchingCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    if (std::find(g_known_devices.begin(), g_known_devices.end(), device) == g_known_devices.end()) {
        g_known_devices.push_back(device);
    }
}

static void DeviceRemovalCallback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    auto it = std::find(g_known_devices.begin(), g_known_devices.end(), device);
    if (it != g_known_devices.end()) {
        g_known_devices.erase(it);
    }

    std::unique_lock<std::mutex> devLock(g_device_mutex);
    if (g_active_device == device) {
        devLock.unlock();
        CloseActiveDevice();
    }
}

static void UpdateConnectedDevices() {
    if (!g_hid_manager) return;
    
    CFSetRef deviceSet = IOHIDManagerCopyDevices(g_hid_manager);
    if (!deviceSet) return;
    
    CFIndex count = CFSetGetCount(deviceSet);
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    g_known_devices.clear();
    
    if (count > 0) {
        std::vector<const void*> devices(count);
        CFSetGetValues(deviceSet, devices.data());
        
        for (CFIndex i = 0; i < count; ++i) {
            IOHIDDeviceRef dev = (IOHIDDeviceRef)devices[i];
            g_known_devices.push_back(dev);
        }
    }
    
    CFRelease(deviceSet);
}

// Enumerate connected devices
napi_value EnumerateDevices(napi_env env, napi_callback_info info) {
    UpdateConnectedDevices();
    std::lock_guard<std::mutex> lock(g_devices_mutex);
    napi_value list;
    napi_create_array(env, &list);

    int index = 0;
    for (IOHIDDeviceRef dev : g_known_devices) {
        int pid = GetDevicePropertyInt(dev, CFSTR(kIOHIDProductIDKey));
        std::string serial = GetDevicePropertyString(dev, CFSTR(kIOHIDSerialNumberKey));
        DeviceInfo devInfo = GetDeviceInfo(pid);

        napi_value obj;
        napi_create_object(env, &obj);

        napi_value valPid, valModel, valSerial, valKeys, valCols, valRows, valKeyW, valKeyH;
        napi_create_int32(env, pid, &valPid);
        napi_create_string_utf8(env, devInfo.name.c_str(), NAPI_AUTO_LENGTH, &valModel);
        napi_create_string_utf8(env, serial.c_str(), NAPI_AUTO_LENGTH, &valSerial);
        napi_create_int32(env, devInfo.keyCount, &valKeys);
        napi_create_int32(env, devInfo.cols, &valCols);
        napi_create_int32(env, devInfo.rows, &valRows);
        napi_create_int32(env, devInfo.iconSize, &valKeyW);
        napi_create_int32(env, devInfo.iconSize, &valKeyH);

        napi_set_named_property(env, obj, "productId", valPid);
        napi_set_named_property(env, obj, "model", valModel);
        napi_set_named_property(env, obj, "serialNumber", valSerial);
        napi_set_named_property(env, obj, "keys", valKeys);
        napi_set_named_property(env, obj, "cols", valCols);
        napi_set_named_property(env, obj, "rows", valRows);
        napi_set_named_property(env, obj, "keyWidth", valKeyW);
        napi_set_named_property(env, obj, "keyHeight", valKeyH);

        napi_set_element(env, list, index++, obj);
    }

    return list;
}

// Initialise connection monitoring
napi_value Init(napi_env env, napi_callback_info info) {
    if (g_hid_manager) {
        napi_value valTrue;
        napi_get_boolean(env, true, &valTrue);
        return valTrue;
    }

    g_hid_manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
    if (!g_hid_manager) {
        napi_throw_error(env, nullptr, "Failed to create IOHIDManager");
        return nullptr;
    }

    CFMutableDictionaryRef matchDict = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    int vendorId = 0x0fd9;
    CFNumberRef vendorNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &vendorId);
    CFDictionarySetValue(matchDict, CFSTR(kIOHIDVendorIDKey), vendorNum);
    CFRelease(vendorNum);

    IOHIDManagerSetDeviceMatching(g_hid_manager, matchDict);
    CFRelease(matchDict);

    IOHIDManagerRegisterDeviceMatchingCallback(g_hid_manager, DeviceMatchingCallback, nullptr);
    IOHIDManagerRegisterDeviceRemovalCallback(g_hid_manager, DeviceRemovalCallback, nullptr);

    IOReturn res = IOHIDManagerOpen(g_hid_manager, kIOHIDOptionsTypeNone);
    if (res != kIOReturnSuccess) {
        CFRelease(g_hid_manager);
        g_hid_manager = nullptr;
        napi_throw_error(env, nullptr, "Failed to open IOHIDManager");
        return nullptr;
    }

    g_run_loop_thread = std::thread([]() {
        CFRunLoopRef runLoop = CFRunLoopGetCurrent();
        {
            std::lock_guard<std::mutex> lock(g_thread_mutex);
            g_background_run_loop = runLoop;
        }
        IOHIDManagerScheduleWithRunLoop(g_hid_manager, runLoop, kCFRunLoopDefaultMode);
        CFRunLoopRun();
    });

    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Connect matching devices to active slot
napi_value Connect(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Arguments must be: (int deviceIndex, function callback)");
        return nullptr;
    }

    int32_t deviceIndex = 0;
    napi_get_value_int32(env, args[0], &deviceIndex);

    std::lock_guard<std::mutex> lock(g_devices_mutex);
    if (g_known_devices.empty()) {
        napi_throw_error(env, nullptr, "No Stream Decks connected");
        return nullptr;
    }

    std::vector<IOHIDDeviceRef> sorted = g_known_devices;
    std::sort(sorted.begin(), sorted.end(), [](IOHIDDeviceRef a, IOHIDDeviceRef b) {
        return GetDevicePropertyString(a, CFSTR(kIOHIDSerialNumberKey)) < GetDevicePropertyString(b, CFSTR(kIOHIDSerialNumberKey));
    });

    if (deviceIndex < 0 || deviceIndex >= (int)sorted.size()) {
        napi_throw_range_error(env, nullptr, "Device index out of range");
        return nullptr;
    }

    IOHIDDeviceRef targetDev = sorted[deviceIndex];

    CloseActiveDevice();

    std::lock_guard<std::mutex> devLock(g_device_mutex);
    if (IOHIDDeviceOpen(targetDev, kIOHIDOptionsTypeNone) != kIOReturnSuccess) {
        napi_throw_error(env, nullptr, "Failed to open device interface. Make sure companion apps are closed.");
        return nullptr;
    }

    g_active_device = targetDev;
    int pid = GetDevicePropertyInt(g_active_device, CFSTR(kIOHIDProductIDKey));
    g_active_device_info = GetDeviceInfo(pid);
    g_button_states.assign(g_active_device_info.keyCount, false);

    napi_value resource_name;
    napi_create_string_utf8(env, "StreamDeckCallback", NAPI_AUTO_LENGTH, &resource_name);

    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }

    napi_create_threadsafe_function(
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

    // Setup input report callback reader
    CFIndex maxInputReport = GetDevicePropertyInt(g_active_device, CFSTR(kIOHIDMaxInputReportSizeKey));
    if (maxInputReport <= 0) maxInputReport = 1024;
    uint8_t* inputBuffer = new uint8_t[maxInputReport];
    IOHIDDeviceRegisterInputReportCallback(g_active_device, inputBuffer, maxInputReport, InputReportCallback, nullptr);
    {
        std::lock_guard<std::mutex> lock(g_thread_mutex);
        if (g_background_run_loop) {
            IOHIDDeviceScheduleWithRunLoop(g_active_device, g_background_run_loop, kCFRunLoopDefaultMode);
        }
    }

    // Reset device layout initially
    std::vector<uint8_t> resetReport;
    if (g_active_device_info.isVersionTwo) {
        resetReport = { 0x03, 0x02 };
        resetReport.resize(32, 0);
    } else {
        resetReport = { 0x0B, 0x63 };
        resetReport.resize(17, 0);
    }
    WriteFeatureReport(g_active_device, resetReport);

    napi_value retObj;
    napi_create_object(env, &retObj);

    napi_value valModel, valKeys, valCols, valRows, valKeyW, valKeyH;
    napi_create_string_utf8(env, g_active_device_info.name.c_str(), NAPI_AUTO_LENGTH, &valModel);
    napi_create_int32(env, g_active_device_info.keyCount, &valKeys);
    napi_create_int32(env, g_active_device_info.cols, &valCols);
    napi_create_int32(env, g_active_device_info.rows, &valRows);
    napi_create_int32(env, g_active_device_info.iconSize, &valKeyW);
    napi_create_int32(env, g_active_device_info.iconSize, &valKeyH);

    napi_set_named_property(env, retObj, "model", valModel);
    napi_set_named_property(env, retObj, "keys", valKeys);
    napi_set_named_property(env, retObj, "cols", valCols);
    napi_set_named_property(env, retObj, "rows", valRows);
    napi_set_named_property(env, retObj, "keyWidth", valKeyW);
    napi_set_named_property(env, retObj, "keyHeight", valKeyH);

    return retObj;
}

// Disconnect helper
napi_value Disconnect(napi_env env, napi_callback_info info) {
    CloseActiveDevice();
    if (g_ts_fn) {
        napi_release_threadsafe_function(g_ts_fn, napi_tsfn_abort);
        g_ts_fn = nullptr;
    }
    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Set Panel brightness
napi_value SetBrightness(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Brightness percentage required");
        return nullptr;
    }

    int32_t percent = 100;
    napi_get_value_int32(env, args[0], &percent);
    int brightness = std::max(0, std::min(100, (int)percent));

    std::lock_guard<std::mutex> devLock(g_device_mutex);
    if (!g_active_device) {
        napi_throw_error(env, nullptr, "No device connected");
        return nullptr;
    }

    std::vector<uint8_t> report;
    if (g_active_device_info.isVersionTwo) {
        report = { 0x03, 0x08, (uint8_t)brightness };
        report.resize(32, 0);
    } else {
        report = { 0x05, 0x55, 0xAA, 0xD1, 0x01, (uint8_t)brightness };
        report.resize(17, 0);
    }
    WriteFeatureReport(g_active_device, report);

    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Helper: Convert RGBA/BGRA to BGR
static std::vector<uint8_t> ConvertRGBAToBGR(const uint8_t* rgba, int pixelCount) {
    std::vector<uint8_t> bgr;
    bgr.reserve(pixelCount * 3);
    for (int i = 0; i < pixelCount; ++i) {
        bgr.push_back(rgba[i * 4 + 2]); // B
        bgr.push_back(rgba[i * 4 + 1]); // G
        bgr.push_back(rgba[i * 4 + 0]); // R
    }
    return bgr;
}

// Helper: Repeated BGR sequence constructor
static std::vector<uint8_t> RepeatBGR(const uint8_t* bgrColor, int byteLength) {
    std::vector<uint8_t> repeated(byteLength);
    for (int i = 0; i < byteLength; i += 3) {
        repeated[i + 0] = bgrColor[0];
        repeated[i + 1] = bgrColor[1];
        repeated[i + 2] = bgrColor[2];
    }
    return repeated;
}

// Helper: Writes image bytes to a single physical key (handles Gen 1 BMP and Gen 2 JPEG packetizing)
static void WriteKeyImagePayload(IOHIDDeviceRef dev, const DeviceInfo& info, int devKeyIdx, const uint8_t* pixels, size_t pixelsSize, bool isJpeg) {
    if (isJpeg) {
        // Gen 2 JPEG packetizer loop
        size_t packetSize = info.pagePacketSize - 8; // 1016 bytes
        size_t totalBytes = pixelsSize;
        int numChunks = (totalBytes + packetSize - 1) / packetSize;

        for (int chunk = 0; chunk < numChunks; ++chunk) {
            size_t offset = chunk * packetSize;
            size_t dataSize = std::min(packetSize, totalBytes - offset);
            bool isLast = (chunk == numChunks - 1);

            std::vector<uint8_t> packet = {
                0x02, 0x07, (uint8_t)devKeyIdx, (uint8_t)(isLast ? 1 : 0),
                (uint8_t)(dataSize & 0xFF), (uint8_t)((dataSize >> 8) & 0xFF),
                (uint8_t)(chunk & 0xFF), (uint8_t)((chunk >> 8) & 0xFF)
            };
            packet.insert(packet.end(), pixels + offset, pixels + offset + dataSize);
            packet.resize(info.pagePacketSize, 0);

            WriteOutputReport(dev, packet);
        }
    } else {
        // Gen 1 BMP packetizer loop
        if (info.keyCount == 6) { // Mini V1
            size_t pageOnePacketSize = info.pagePacketSize - 70; // 954
            size_t pageTwoPacketSize = info.pagePacketSize - 16; // 1008
            size_t iconBytes = info.iconSize * info.iconSize * 3; // 19200

            // BMP Header
            std::vector<uint8_t> p1Header = {
                0x02, 0x01, 0x00, 0x00, 0x00, (uint8_t)(devKeyIdx + 1),
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x42, 0x4D, 0x36, 0x4B, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00,
                0x28, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00,
                0x50, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x4B, 0x00, 0x00,
                0x13, 0x0B, 0x00, 0x00, 0x13, 0x0B, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            };
            p1Header.insert(p1Header.end(), pixels, pixels + pageOnePacketSize);
            p1Header.resize(info.pagePacketSize, 0);
            WriteOutputReport(dev, p1Header);

            int count = 0;
            size_t i = pageOnePacketSize;
            while (i < iconBytes) {
                count++;
                size_t chunkLength = std::min(pageTwoPacketSize, iconBytes - i);
                std::vector<uint8_t> p2Header = {
                    0x02, 0x01, (uint8_t)count, 0x00, (uint8_t)(count == 19 ? 1 : 0), (uint8_t)(devKeyIdx + 1),
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
                };
                p2Header.insert(p2Header.end(), pixels + i, pixels + i + chunkLength);
                p2Header.resize(info.pagePacketSize, 0);
                WriteOutputReport(dev, p2Header);
                i += pageTwoPacketSize;
            }
        } else { // V1
            // 72 * 72 * 3 = 15552 bytes
            // Page 1 = 7749 BGR bytes. Page 2 = 7803 BGR bytes.
            size_t p1Size = 7749;
            size_t p2Size = 7803;

            std::vector<uint8_t> p1Header = {
                0x02, 0x01, 0x01, 0x00, 0x00, (uint8_t)(devKeyIdx + 1),
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x42, 0x4D, 0xF6, 0x3C, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00,
                0x28, 0x00, 0x00, 0x00, 0x48, 0x00, 0x00, 0x00,
                0x48, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
                0x00, 0x00, 0x00, 0x00, 0xC0, 0x3C, 0x00, 0x00,
                0xC4, 0x0E, 0x00, 0x00, 0xC4, 0x0E, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            };
            p1Header.insert(p1Header.end(), pixels, pixels + p1Size);
            p1Header.resize(info.pagePacketSize, 0);
            WriteOutputReport(dev, p1Header);

            std::vector<uint8_t> p2Header = {
                0x02, 0x01, 0x02, 0x00, 0x01, (uint8_t)(devKeyIdx + 1),
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            };
            p2Header.insert(p2Header.end(), pixels + p1Size, pixels + p1Size + p2Size);
            p2Header.resize(info.pagePacketSize, 0);
            WriteOutputReport(dev, p2Header);
        }
    }
}

// Set image of a specific key
napi_value SetKeyImage(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Arguments must be: (int keyIndex, string base64Image)");
        return nullptr;
    }

    int32_t userKeyIdx = 0;
    napi_get_value_int32(env, args[0], &userKeyIdx);

    bool isBuffer = false;
    napi_is_buffer(env, args[1], &isBuffer);
    if (!isBuffer) {
        napi_throw_type_error(env, nullptr, "Argument 1 must be a Buffer");
        return nullptr;
    }

    uint8_t* bufferData = nullptr;
    size_t bufferSize = 0;
    napi_get_buffer_info(env, args[1], (void**)&bufferData, &bufferSize);

    std::lock_guard<std::mutex> devLock(g_device_mutex);
    if (!g_active_device) {
        napi_throw_error(env, nullptr, "No device connected");
        return nullptr;
    }

    if (userKeyIdx < 0 || userKeyIdx >= g_active_device_info.keyCount) {
        napi_throw_range_error(env, nullptr, "Key index out of range");
        return nullptr;
    }

    int devKeyIdx = GetDeviceKeyIndex(g_active_device_info.productId, userKeyIdx);

    if (g_active_device_info.isVersionTwo) {
        CFDataRef cfData = CFDataCreate(kCFAllocatorDefault, bufferData, bufferSize);
        if (!cfData) {
            napi_throw_error(env, nullptr, "Failed to create CFDataRef");
            return nullptr;
        }
        CGImageSourceRef imageSource = CGImageSourceCreateWithData(cfData, nullptr);
        CFRelease(cfData);
        if (!imageSource) {
            napi_throw_error(env, nullptr, "Failed creating image source");
            return nullptr;
        }
        CGImageRef img = CGImageSourceCreateImageAtIndex(imageSource, 0, nullptr);
        CFRelease(imageSource);
        if (!img) {
            napi_throw_error(env, nullptr, "Failed decoding image source index 0");
            return nullptr;
        }

        int targetSize = g_active_device_info.iconSize;
        CGContextRef context = CGBitmapContextCreate(
            nullptr,
            targetSize,
            targetSize,
            8,
            targetSize * 4,
            CGColorSpaceCreateDeviceRGB(),
            kCGImageAlphaNoneSkipLast
        );
        if (!context) {
            CGImageRelease(img);
            napi_throw_error(env, nullptr, "Failed creating CGContext");
            return nullptr;
        }
        CGContextDrawImage(context, CGRectMake(0, 0, targetSize, targetSize), img);
        CGImageRelease(img);

        CGImageRef scaledImg = CGBitmapContextCreateImage(context);
        CGContextRelease(context);
        if (!scaledImg) {
            napi_throw_error(env, nullptr, "Failed creating scaled image");
            return nullptr;
        }

        CFMutableDataRef jpegData = CFDataCreateMutable(kCFAllocatorDefault, 0);
        CGImageDestinationRef destination = CGImageDestinationCreateWithData(jpegData, CFSTR("public.jpeg"), 1, nullptr);
        if (!destination) {
            CGImageRelease(scaledImg);
            CFRelease(jpegData);
            napi_throw_error(env, nullptr, "Failed creating image destination");
            return nullptr;
        }

        float quality = 0.75f;
        CFNumberRef qualityNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberFloatType, &quality);
        CFMutableDictionaryRef options = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
        CFDictionarySetValue(options, kCGImageDestinationLossyCompressionQuality, qualityNum);
        CFRelease(qualityNum);

        CGImageDestinationAddImage(destination, scaledImg, options);
        CFRelease(options);
        CGImageRelease(scaledImg);

        if (!CGImageDestinationFinalize(destination)) {
            CFRelease(destination);
            CFRelease(jpegData);
            napi_throw_error(env, nullptr, "Failed finalizing JPEG encoding");
            return nullptr;
        }

        const uint8_t* jpegBytes = CFDataGetBytePtr(jpegData);
        size_t jpegLength = CFDataGetLength(jpegData);

        WriteKeyImagePayload(g_active_device, g_active_device_info, devKeyIdx, jpegBytes, jpegLength, true);

        CFRelease(destination);
        CFRelease(jpegData);
    } else {
        CFDataRef cfData = CFDataCreate(kCFAllocatorDefault, bufferData, bufferSize);
        if (!cfData) {
            napi_throw_error(env, nullptr, "Failed to create CFDataRef");
            return nullptr;
        }
        CGImageSourceRef imageSource = CGImageSourceCreateWithData(cfData, nullptr);
        CFRelease(cfData);
        if (!imageSource) {
            napi_throw_error(env, nullptr, "Failed creating image source");
            return nullptr;
        }
        CGImageRef img = CGImageSourceCreateImageAtIndex(imageSource, 0, nullptr);
        CFRelease(imageSource);
        if (!img) {
            napi_throw_error(env, nullptr, "Failed decoding image source index 0");
            return nullptr;
        }

        int targetSize = g_active_device_info.iconSize;
        CGContextRef context = CGBitmapContextCreate(
            nullptr,
            targetSize,
            targetSize,
            8,
            targetSize * 4,
            CGColorSpaceCreateDeviceRGB(),
            kCGImageAlphaNoneSkipLast
        );
        if (!context) {
            CGImageRelease(img);
            napi_throw_error(env, nullptr, "Failed creating CGContext");
            return nullptr;
        }
        CGContextDrawImage(context, CGRectMake(0, 0, targetSize, targetSize), img);
        CGImageRelease(img);

        uint8_t* rawData = (uint8_t*)CGBitmapContextGetData(context);
        if (!rawData) {
            CGContextRelease(context);
            napi_throw_error(env, nullptr, "Failed extracting bitmap data pointer");
            return nullptr;
        }

        std::vector<uint8_t> bgr = ConvertRGBAToBGR(rawData, targetSize * targetSize);
        CGContextRelease(context);

        WriteKeyImagePayload(g_active_device, g_active_device_info, devKeyIdx, bgr.data(), bgr.size(), false);
    }

    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Clear all keys
napi_value ClearAllKeys(napi_env env, napi_callback_info info) {
    std::lock_guard<std::mutex> devLock(g_device_mutex);
    if (!g_active_device) {
        napi_throw_error(env, nullptr, "No device connected");
        return nullptr;
    }

    int keyCount = g_active_device_info.keyCount;
    int targetSize = g_active_device_info.iconSize;

    if (g_active_device_info.isVersionTwo) {
        CGContextRef context = CGBitmapContextCreate(
            nullptr,
            targetSize,
            targetSize,
            8,
            targetSize * 4,
            CGColorSpaceCreateDeviceRGB(),
            kCGImageAlphaNoneSkipLast
        );
        if (!context) {
            napi_throw_error(env, nullptr, "Failed creating context for clear operations");
            return nullptr;
        }
        CGContextSetRGBFillColor(context, 0, 0, 0, 1);
        CGContextFillRect(context, CGRectMake(0, 0, targetSize, targetSize));

        CGImageRef img = CGBitmapContextCreateImage(context);
        CGContextRelease(context);

        CFMutableDataRef cfData = CFDataCreateMutable(kCFAllocatorDefault, 0);
        CGImageDestinationRef dest = CGImageDestinationCreateWithData(cfData, CFSTR("public.jpeg"), 1, nullptr);
        
        float quality = 0.75f;
        CFNumberRef qualityNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberFloatType, &quality);
        CFMutableDictionaryRef options = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
        CFDictionarySetValue(options, kCGImageDestinationLossyCompressionQuality, qualityNum);
        CFRelease(qualityNum);

        CGImageDestinationAddImage(dest, img, options);
        CFRelease(options);
        CGImageRelease(img);
        CGImageDestinationFinalize(dest);
        CFRelease(dest);

        const uint8_t* jpegBytes = CFDataGetBytePtr(cfData);
        size_t jpegLength = CFDataGetLength(cfData);

        for (int i = 0; i < keyCount; ++i) {
            int devKey = GetDeviceKeyIndex(g_active_device_info.productId, i);
            WriteKeyImagePayload(g_active_device, g_active_device_info, devKey, jpegBytes, jpegLength, true);
        }
        CFRelease(cfData);
    } else {
        uint8_t blackColor[3] = { 0, 0, 0 };
        std::vector<uint8_t> bgr = RepeatBGR(blackColor, targetSize * targetSize * 3);

        for (int i = 0; i < keyCount; ++i) {
            int devKey = GetDeviceKeyIndex(g_active_device_info.productId, i);
            WriteKeyImagePayload(g_active_device, g_active_device_info, devKey, bgr.data(), bgr.size(), false);
        }
    }

    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Set overall stretched layout image
napi_value SetStretchedImage(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Stretched image required");
        return nullptr;
    }

    bool isBuffer = false;
    napi_is_buffer(env, args[0], &isBuffer);
    if (!isBuffer) {
        napi_throw_type_error(env, nullptr, "Stretched image must be a Buffer");
        return nullptr;
    }

    uint8_t* bufferData = nullptr;
    size_t bufferSize = 0;
    napi_get_buffer_info(env, args[0], (void**)&bufferData, &bufferSize);

    std::lock_guard<std::mutex> devLock(g_device_mutex);
    if (!g_active_device) {
        napi_throw_error(env, nullptr, "No device connected");
        return nullptr;
    }

    CFDataRef cfData = CFDataCreate(kCFAllocatorDefault, bufferData, bufferSize);
    if (!cfData) {
        napi_throw_error(env, nullptr, "Failed creating CFDataRef");
        return nullptr;
    }
    CGImageSourceRef imageSource = CGImageSourceCreateWithData(cfData, nullptr);
    CFRelease(cfData);
    if (!imageSource) {
        napi_throw_error(env, nullptr, "Failed creating image source");
        return nullptr;
    }
    CGImageRef stretched = CGImageSourceCreateImageAtIndex(imageSource, 0, nullptr);
    CFRelease(imageSource);
    if (!stretched) {
        napi_throw_error(env, nullptr, "Failed decoding image source index 0");
        return nullptr;
    }

    int cols = g_active_device_info.cols;
    int rows = g_active_device_info.rows;
    int kw = g_active_device_info.iconSize;
    int kh = g_active_device_info.iconSize;

    int gridW = cols * kw;
    int gridH = rows * kh;

    CGContextRef gridCtx = CGBitmapContextCreate(
        nullptr,
        gridW,
        gridH,
        8,
        gridW * 4,
        CGColorSpaceCreateDeviceRGB(),
        kCGImageAlphaNoneSkipLast
    );
    if (!gridCtx) {
        CGImageRelease(stretched);
        napi_throw_error(env, nullptr, "Failed creating main grid CGContext");
        return nullptr;
    }
    CGContextDrawImage(gridCtx, CGRectMake(0, 0, gridW, gridH), stretched);
    CGImageRelease(stretched);

    CGImageRef gridImg = CGBitmapContextCreateImage(gridCtx);
    CGContextRelease(gridCtx);
    if (!gridImg) {
        napi_throw_error(env, nullptr, "Failed making resized grid CGImageRef");
        return nullptr;
    }

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            CGRect cropRect = CGRectMake((cols - 1 - c) * kw, (rows - 1 - r) * kh, kw, kh);
            CGImageRef cellImg = CGImageCreateWithImageInRect(gridImg, cropRect);
            if (!cellImg) continue;

            int logicalKey = r * cols + c;
            int devKey = GetDeviceKeyIndex(g_active_device_info.productId, logicalKey);

            if (g_active_device_info.isVersionTwo) {
                CFMutableDataRef jpegData = CFDataCreateMutable(kCFAllocatorDefault, 0);
                CGImageDestinationRef dest = CGImageDestinationCreateWithData(jpegData, CFSTR("public.jpeg"), 1, nullptr);
                
                float quality = 0.75f;
                CFNumberRef qualityNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberFloatType, &quality);
                CFMutableDictionaryRef options = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
                CFDictionarySetValue(options, kCGImageDestinationLossyCompressionQuality, qualityNum);
                CFRelease(qualityNum);

                CGImageDestinationAddImage(dest, cellImg, options);
                CFRelease(options);
                CGImageDestinationFinalize(dest);
                CFRelease(dest);

                const uint8_t* jpegBytes = CFDataGetBytePtr(jpegData);
                size_t jpegLength = CFDataGetLength(jpegData);

                WriteKeyImagePayload(g_active_device, g_active_device_info, devKey, jpegBytes, jpegLength, true);
                CFRelease(jpegData);
            } else {
                CGContextRef cellCtx = CGBitmapContextCreate(
                    nullptr,
                    kw,
                    kh,
                    8,
                    kw * 4,
                    CGColorSpaceCreateDeviceRGB(),
                    kCGImageAlphaNoneSkipLast
                );
                if (cellCtx) {
                    CGContextDrawImage(cellCtx, CGRectMake(0, 0, kw, kh), cellImg);
                    uint8_t* cellRaw = (uint8_t*)CGBitmapContextGetData(cellCtx);
                    if (cellRaw) {
                        std::vector<uint8_t> bgr = ConvertRGBAToBGR(cellRaw, kw * kh);
                        WriteKeyImagePayload(g_active_device, g_active_device_info, devKey, bgr.data(), bgr.size(), false);
                    }
                    CGContextRelease(cellCtx);
                }
            }
            CGImageRelease(cellImg);
        }
    }

    CGImageRelease(gridImg);
    napi_value valTrue;
    napi_get_boolean(env, true, &valTrue);
    return valTrue;
}

// Module Initialisation
napi_value InitModule(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "init", nullptr, Init, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "enumerateDevices", nullptr, EnumerateDevices, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "connect", nullptr, Connect, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "disconnect", nullptr, Disconnect, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setBrightness", nullptr, SetBrightness, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setKeyImage", nullptr, SetKeyImage, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "clearAllKeys", nullptr, ClearAllKeys, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setStretchedImage", nullptr, SetStretchedImage, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, InitModule)
