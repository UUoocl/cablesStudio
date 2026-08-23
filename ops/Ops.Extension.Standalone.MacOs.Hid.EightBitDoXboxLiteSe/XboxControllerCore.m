#import "XboxControllerCore.h"
#include <IOKit/usb/IOUSBLib.h>
#include <IOKit/IOCFPlugIn.h>

static void DeviceAdded(void *refCon, io_iterator_t iterator);
static void DeviceRemoved(void *refCon, io_iterator_t iterator);
static void ReadCallback(void *refcon, IOReturn result, void *arg0);

@implementation XboxControllerManager {
    IONotificationPortRef _notifyPort;
    io_iterator_t _addedIterator;
    io_iterator_t _removedIterator;
    
    IOUSBDeviceInterface197 **_deviceInterface;
    IOUSBInterfaceInterface197 **_interfaceInterface;
    CFRunLoopSourceRef _runLoopSource;
    CFRunLoopRef _runLoop;
    
    UInt8 _readPipeIndex;
    UInt8 _writePipeIndex;
    UInt8 _readBuffer[64];
    UInt8 _rumbleSeq;
    
    XboxControllerInputCallback _callback;
    void *_callbackContext;
    BOOL _isRunning;
}

+ (instancetype)sharedManager {
    static XboxControllerManager *manager = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        manager = [[XboxControllerManager alloc] init];
    });
    return manager;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _deviceInterface = NULL;
        _interfaceInterface = NULL;
        _runLoopSource = NULL;
        _runLoop = NULL;
        _readPipeIndex = 0;
        _writePipeIndex = 0;
        _rumbleSeq = 0;
        _isRunning = NO;
    }
    return self;
}

- (BOOL)startWithCallback:(XboxControllerInputCallback)callback context:(void *)context {
    if (_isRunning) return YES;
    
    _callback = callback;
    _callbackContext = context;
    _isRunning = YES;
    
    // Spawn background thread to run CoreFoundation RunLoop
    [NSThread detachNewThreadSelector:@selector(runLoopThread) toTarget:self withObject:nil];
    
    return YES;
}

- (void)runLoopThread {
    @autoreleasepool {
        _runLoop = CFRunLoopGetCurrent();
        
        // Create notification port for USB devices
        _notifyPort = IONotificationPortCreate(kIOMainPortDefault);
        if (!_notifyPort) {
            NSLog(@"[XboxControllerCore] Failed to create IONotificationPort");
            return;
        }
        
        CFRunLoopSourceRef runLoopSource = IONotificationPortGetRunLoopSource(_notifyPort);
        CFRunLoopAddSource(_runLoop, runLoopSource, kCFRunLoopDefaultMode);
        
        // Setup matching dictionary
        CFMutableDictionaryRef matchingDict = IOServiceMatching(kIOUSBDeviceClassName);
        if (!matchingDict) {
            NSLog(@"[XboxControllerCore] Failed to create matching dictionary");
            return;
        }
        
        // Set Vendor and Product matching IDs (8BitDo VID: 0x2dc8, PID: 0x2008)
        int vendorId = 0x2dc8;
        int productId = 0x2008;
        CFNumberRef vendorNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &vendorId);
        CFNumberRef productNum = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &productId);
        CFDictionarySetValue(matchingDict, CFSTR(kUSBVendorID), vendorNum);
        CFDictionarySetValue(matchingDict, CFSTR(kUSBProductID), productNum);
        CFRelease(vendorNum);
        CFRelease(productNum);
        
        // Retain dictionary as IOServiceAddMatchingNotification consumes a reference
        CFRetain(matchingDict);
        
        // Listen for connection
        kern_return_t kr = IOServiceAddMatchingNotification(_notifyPort,
                                                             kIOMatchedNotification,
                                                             matchingDict,
                                                             DeviceAdded,
                                                             (__bridge void *)self,
                                                             &_addedIterator);
        if (kr != kIOReturnSuccess) {
            NSLog(@"[XboxControllerCore] Failed to add matching notification: 0x%08x", kr);
            CFRelease(matchingDict);
            return;
        }
        
        // Trigger initial match check
        DeviceAdded((__bridge void *)self, _addedIterator);
        
        // Listen for disconnection
        kr = IOServiceAddMatchingNotification(_notifyPort,
                                             kIOTerminatedNotification,
                                             matchingDict,
                                             DeviceRemoved,
                                             (__bridge void *)self,
                                             &_removedIterator);
        if (kr != kIOReturnSuccess) {
            NSLog(@"[XboxControllerCore] Failed to add termination notification: 0x%08x", kr);
            return;
        }
        
        // Trigger initial termination check
        DeviceRemoved((__bridge void *)self, _removedIterator);
        
        // Spin the CFRunLoop
        CFRunLoopRun();
    }
}

- (void)stop {
    if (!_isRunning) return;
    _isRunning = NO;
    
    [self closeConnection];
    
    if (_addedIterator) {
        IOObjectRelease(_addedIterator);
        _addedIterator = 0;
    }
    
    if (_removedIterator) {
        IOObjectRelease(_removedIterator);
        _removedIterator = 0;
    }
    
    if (_notifyPort) {
        IONotificationPortDestroy(_notifyPort);
        _notifyPort = NULL;
    }
    
    if (_runLoop) {
        CFRunLoopStop(_runLoop);
        _runLoop = NULL;
    }
}

- (BOOL)isDeviceConnected {
    return (_deviceInterface != NULL && _interfaceInterface != NULL);
}

- (void)closeConnection {
    if (_interfaceInterface) {
        if (_runLoopSource && _runLoop) {
            CFRunLoopRemoveSource(_runLoop, _runLoopSource, kCFRunLoopDefaultMode);
            CFRelease(_runLoopSource);
            _runLoopSource = NULL;
        }
        (*_interfaceInterface)->USBInterfaceClose(_interfaceInterface);
        (*_interfaceInterface)->Release(_interfaceInterface);
        _interfaceInterface = NULL;
    }
    
    if (_deviceInterface) {
        (*_deviceInterface)->USBDeviceClose(_deviceInterface);
        (*_deviceInterface)->Release(_deviceInterface);
        _deviceInterface = NULL;
    }
    
    _readPipeIndex = 0;
    _writePipeIndex = 0;
    
    if (_callback) {
        _callback((XboxControllerInputState){0}, "{\"type\":\"info\",\"status\":\"searching\"}", _callbackContext);
    }
}

- (void)handleDeviceAdded:(io_service_t)device {
    if (_deviceInterface != NULL) {
        // Already connected
        IOObjectRelease(device);
        return;
    }
    
    NSLog(@"[XboxControllerCore] 8BitDo Controller plugged in!");
    
    IOCFPlugInInterface **plugInInterface = NULL;
    SInt32 score;
    kern_return_t kr = IOCreatePlugInInterfaceForService(device,
                                                         kIOUSBDeviceUserClientTypeID,
                                                         kIOCFPlugInInterfaceID,
                                                         &plugInInterface,
                                                         &score);
    IOObjectRelease(device);
    
    if (kr != kIOReturnSuccess || !plugInInterface) {
        NSLog(@"[XboxControllerCore] Failed to create Plugin Interface: 0x%08x", kr);
        return;
    }
    
    HRESULT res = (*plugInInterface)->QueryInterface(plugInInterface,
                                                     CFUUIDGetUUIDBytes(kIOUSBDeviceInterfaceID197),
                                                     (LPVOID *)&_deviceInterface);
    (*plugInInterface)->Release(plugInInterface);
    
    if (res != S_OK || !_deviceInterface) {
        NSLog(@"[XboxControllerCore] Failed to query device interface: 0x%08x", (unsigned int)res);
        return;
    }
    
    // Open Device
    kr = (*_deviceInterface)->USBDeviceOpen(_deviceInterface);
    if (kr != kIOReturnSuccess) {
        NSLog(@"[XboxControllerCore] Failed to open device: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    
    // Configure Device if not already configured
    UInt8 activeConfig = 0;
    kr = (*_deviceInterface)->GetConfiguration(_deviceInterface, &activeConfig);
    if (kr == kIOReturnSuccess) {
        if (activeConfig == 0) {
            UInt8 numConfig = 0;
            kr = (*_deviceInterface)->GetNumberOfConfigurations(_deviceInterface, &numConfig);
            if (kr == kIOReturnSuccess && numConfig > 0) {
                IOUSBConfigurationDescriptorPtr configDesc = NULL;
                kr = (*_deviceInterface)->GetConfigurationDescriptorPtr(_deviceInterface, 0, &configDesc);
                if (kr == kIOReturnSuccess && configDesc) {
                    kr = (*_deviceInterface)->SetConfiguration(_deviceInterface, configDesc->bConfigurationValue);
                    if (kr != kIOReturnSuccess) {
                        NSLog(@"[XboxControllerCore] Failed to set configuration: 0x%08x", kr);
                        [self closeConnection];
                        return;
                    }
                } else {
                    NSLog(@"[XboxControllerCore] Failed to get configuration descriptor: 0x%08x", kr);
                    [self closeConnection];
                    return;
                }
            } else {
                NSLog(@"[XboxControllerCore] Failed to get number of configurations or no configurations found: 0x%08x, count: %d", kr, numConfig);
                [self closeConnection];
                return;
            }
        } else {
            NSLog(@"[XboxControllerCore] Device already configured with configuration: %d", activeConfig);
        }
    } else {
        NSLog(@"[XboxControllerCore] Failed to get current configuration: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    
    // Find Interface 0
    IOUSBFindInterfaceRequest interfaceRequest;
    interfaceRequest.bInterfaceClass = kIOUSBFindInterfaceDontCare;
    interfaceRequest.bInterfaceSubClass = kIOUSBFindInterfaceDontCare;
    interfaceRequest.bInterfaceProtocol = kIOUSBFindInterfaceDontCare;
    interfaceRequest.bAlternateSetting = kIOUSBFindInterfaceDontCare;
    
    io_iterator_t interfaceIterator;
    kr = (*_deviceInterface)->CreateInterfaceIterator(_deviceInterface, &interfaceRequest, &interfaceIterator);
    if (kr != kIOReturnSuccess) {
        NSLog(@"[XboxControllerCore] Failed to iterate interfaces: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    
    io_service_t usbInterface = IOIteratorNext(interfaceIterator);
    IOObjectRelease(interfaceIterator);
    
    if (!usbInterface) {
        NSLog(@"[XboxControllerCore] No interfaces found");
        [self closeConnection];
        return;
    }
    
    // Query Interface Interface
    kr = IOCreatePlugInInterfaceForService(usbInterface,
                                           kIOUSBInterfaceUserClientTypeID,
                                           kIOCFPlugInInterfaceID,
                                           &plugInInterface,
                                           &score);
    IOObjectRelease(usbInterface);
    if (kr != kIOReturnSuccess || !plugInInterface) {
        NSLog(@"[XboxControllerCore] Failed to create Interface Plugin");
        [self closeConnection];
        return;
    }
    
    res = (*plugInInterface)->QueryInterface(plugInInterface,
                                             CFUUIDGetUUIDBytes(kIOUSBInterfaceInterfaceID197),
                                             (LPVOID *)&_interfaceInterface);
    (*plugInInterface)->Release(plugInInterface);
    
    if (res != S_OK || !_interfaceInterface) {
        NSLog(@"[XboxControllerCore] Failed to query interface interface");
        [self closeConnection];
        return;
    }
    
    // Open Interface
    kr = (*_interfaceInterface)->USBInterfaceOpen(_interfaceInterface);
    if (kr != kIOReturnSuccess) {
        NSLog(@"[XboxControllerCore] Failed to open interface: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    
    // Get Pipes (End points)
    UInt8 numEndpoints = 0;
    kr = (*_interfaceInterface)->GetNumEndpoints(_interfaceInterface, &numEndpoints);
    if (kr != kIOReturnSuccess) {
        NSLog(@"[XboxControllerCore] Failed to get endpoints count");
        [self closeConnection];
        return;
    }
    
    for (int pipeIdx = 1; pipeIdx <= numEndpoints; pipeIdx++) {
        UInt8 direction = 0;
        UInt8 number = 0;
        UInt8 transferType = 0;
        UInt16 maxPacketSize = 0;
        UInt8 interval = 0;
        
        kr = (*_interfaceInterface)->GetPipeProperties(_interfaceInterface,
                                                        pipeIdx,
                                                        &direction,
                                                        &number,
                                                        &transferType,
                                                        &maxPacketSize,
                                                        &interval);
        
        if (kr == kIOReturnSuccess) {
            if (transferType == kUSBInterrupt) {
                if (direction == kUSBIn && number == 1) { // Endpoint 0x81
                    _readPipeIndex = pipeIdx;
                } else if (direction == kUSBOut && number == 1) { // Endpoint 0x01
                    _writePipeIndex = pipeIdx;
                }
            }
        }
    }
    
    if (_readPipeIndex == 0 || _writePipeIndex == 0) {
        NSLog(@"[XboxControllerCore] Failed to resolve IN/OUT pipes. Read: %d, Write: %d", _readPipeIndex, _writePipeIndex);
        [self closeConnection];
        return;
    }
    
    // Handshake Sequence (GIP power on, LED control, security promotion)
    UInt8 pwr_on[] = {0x05, 0x20, 0x01, 0x01, 0x00};
    UInt8 led[] = {0x0A, 0x20, 0x02, 0x03, 0x00, 0x01, 0x14};
    UInt8 security[] = {0x06, 0x20, 0x03, 0x02, 0x01, 0x00};
    UInt8 init_rumble[] = {0x09, 0x00, 0x04, 0x09, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0xEB};
    
    (*_interfaceInterface)->WritePipe(_interfaceInterface, _writePipeIndex, pwr_on, sizeof(pwr_on));
    usleep(50000);
    (*_interfaceInterface)->WritePipe(_interfaceInterface, _writePipeIndex, led, sizeof(led));
    usleep(50000);
    (*_interfaceInterface)->WritePipe(_interfaceInterface, _writePipeIndex, security, sizeof(security));
    usleep(50000);
    (*_interfaceInterface)->WritePipe(_interfaceInterface, _writePipeIndex, init_rumble, sizeof(init_rumble));
    
    // Create async event source and add to run loop
    kr = (*_interfaceInterface)->CreateInterfaceAsyncEventSource(_interfaceInterface, &_runLoopSource);
    if (kr != kIOReturnSuccess || !_runLoopSource) {
        NSLog(@"[XboxControllerCore] Failed to create async event source: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    CFRunLoopAddSource(_runLoop, _runLoopSource, kCFRunLoopDefaultMode);
    
    // Start Asynchronous Interrupt Reading
    kr = (*_interfaceInterface)->ReadPipeAsync(_interfaceInterface,
                                                _readPipeIndex,
                                                _readBuffer,
                                                sizeof(_readBuffer),
                                                ReadCallback,
                                                (__bridge void *)self);
    if (kr != kIOReturnSuccess) {
        NSLog(@"[XboxControllerCore] Failed to initiate ReadPipeAsync: 0x%08x", kr);
        [self closeConnection];
        return;
    }
    
    if (_callback) {
        _callback((XboxControllerInputState){0}, "{\"type\":\"info\",\"status\":\"connected\",\"device\":\"8BitDo Lite SE Xbox Controller\"}", _callbackContext);
    }
}

- (void)handleDeviceRemoved:(io_service_t)device {
    NSLog(@"[XboxControllerCore] Controller unplugged.");
    IOObjectRelease(device);
    [self closeConnection];
}

- (void)handleReadResult:(IOReturn)result bytesRead:(UInt32)bytesRead {
    if (result == kIOReturnSuccess) {
        [self processReport:_readBuffer length:bytesRead];
    }
    
    // Re-issue async read
    if (result != kIOReturnAborted && _isRunning && _interfaceInterface) {
        [self reissueRead];
    }
}

- (void)processReport:(UInt8 *)data length:(UInt32)length {
    if (length < 5) return;
    
    UInt8 cmd = data[0];
    XboxControllerInputState state = {0};
    
    if (cmd == 0x07) {
        UInt8 down = data[4];
        UInt8 key = (length >= 6) ? data[5] : 0;
        
        if (key == 0x5b || key == 0x01) {
            state.buttons = (down == 0x01) ? XBOX_BTN_GUIDE : 0;
            [self fireCallback:state];
        }
        return;
    }
    
    if (cmd != 0x20 || length < 18) return;
    
    // Read buttons
    unsigned short buttons = data[4] | (data[5] << 8);
    
    // Parse individual bits and build bitmask
    if (buttons & 0x0004) state.buttons |= XBOX_BTN_MENU;
    if (buttons & 0x0008) state.buttons |= XBOX_BTN_VIEW;
    if (buttons & 0x0010) state.buttons |= XBOX_BTN_A;
    if (buttons & 0x0020) state.buttons |= XBOX_BTN_B;
    if (buttons & 0x0040) state.buttons |= XBOX_BTN_X;
    if (buttons & 0x0080) state.buttons |= XBOX_BTN_Y;
    if (buttons & 0x0100) state.buttons |= XBOX_BTN_DPAD_UP;
    if (buttons & 0x0200) state.buttons |= XBOX_BTN_DPAD_DOWN;
    if (buttons & 0x0400) state.buttons |= XBOX_BTN_DPAD_LEFT;
    if (buttons & 0x0800) state.buttons |= XBOX_BTN_DPAD_RIGHT;
    if (buttons & 0x1000) state.buttons |= XBOX_BTN_LB;
    if (buttons & 0x2000) state.buttons |= XBOX_BTN_RB;
    if (buttons & 0x4000) state.buttons |= XBOX_BTN_LS_CLICK;
    if (buttons & 0x8000) state.buttons |= XBOX_BTN_RS_CLICK;
    
    if (length >= 19) {
        UInt8 extra = data[18];
        if (extra & 0x01) state.buttons |= XBOX_BTN_GUIDE;
        if (extra & 0x02) state.buttons |= XBOX_BTN_SHARE;
    }
    
    // Triggers (10-bit: 0-1023)
    unsigned short ltRaw = data[6] | (data[7] << 8);
    unsigned short rtRaw = data[8] | (data[9] << 8);
    state.lt = (float)ltRaw / 1023.0f;
    state.rt = (float)rtRaw / 1023.0f;
    if (state.lt < 0.0f) state.lt = 0.0f; else if (state.lt > 1.0f) state.lt = 1.0f;
    if (state.rt < 0.0f) state.rt = 0.0f; else if (state.rt > 1.0f) state.rt = 1.0f;
    
    // Joysticks (16-bit signed)
    short lsXRaw = (short)(data[10] | (data[11] << 8));
    short lsYRaw = (short)(data[12] | (data[13] << 8));
    short rsXRaw = (short)(data[14] | (data[15] << 8));
    short rsYRaw = (short)(data[16] | (data[17] << 8));
    
    state.ls_x = (float)lsXRaw / 32768.0f;
    state.ls_y = (float)lsYRaw / 32768.0f;
    state.rs_x = (float)rsXRaw / 32768.0f;
    state.rs_y = (float)rsYRaw / 32768.0f;
    
    if (state.ls_x < -1.0f) state.ls_x = -1.0f; else if (state.ls_x > 1.0f) state.ls_x = 1.0f;
    if (state.ls_y < -1.0f) state.ls_y = -1.0f; else if (state.ls_y > 1.0f) state.ls_y = 1.0f;
    if (state.rs_x < -1.0f) state.rs_x = -1.0f; else if (state.rs_x > 1.0f) state.rs_x = 1.0f;
    if (state.rs_y < -1.0f) state.rs_y = -1.0f; else if (state.rs_y > 1.0f) state.rs_y = 1.0f;
    
    [self fireCallback:state];
}

- (void)fireCallback:(XboxControllerInputState)state {
    if (!_callback) return;
    
    NSMutableArray *btnsArray = [NSMutableArray array];
    if (state.buttons & XBOX_BTN_MENU) [btnsArray addObject:@"Menu"];
    if (state.buttons & XBOX_BTN_VIEW) [btnsArray addObject:@"View"];
    if (state.buttons & XBOX_BTN_A) [btnsArray addObject:@"A"];
    if (state.buttons & XBOX_BTN_B) [btnsArray addObject:@"B"];
    if (state.buttons & XBOX_BTN_X) [btnsArray addObject:@"X"];
    if (state.buttons & XBOX_BTN_Y) [btnsArray addObject:@"Y"];
    if (state.buttons & XBOX_BTN_DPAD_UP) [btnsArray addObject:@"Dpad Up"];
    if (state.buttons & XBOX_BTN_DPAD_DOWN) [btnsArray addObject:@"Dpad Down"];
    if (state.buttons & XBOX_BTN_DPAD_LEFT) [btnsArray addObject:@"Dpad Left"];
    if (state.buttons & XBOX_BTN_DPAD_RIGHT) [btnsArray addObject:@"Dpad Right"];
    if (state.buttons & XBOX_BTN_LB) [btnsArray addObject:@"LB"];
    if (state.buttons & XBOX_BTN_RB) [btnsArray addObject:@"RB"];
    if (state.buttons & XBOX_BTN_LS_CLICK) [btnsArray addObject:@"LS Click"];
    if (state.buttons & XBOX_BTN_RS_CLICK) [btnsArray addObject:@"RS Click"];
    if (state.buttons & XBOX_BTN_GUIDE) [btnsArray addObject:@"Guide"];
    if (state.buttons & XBOX_BTN_SHARE) [btnsArray addObject:@"Share"];
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:@{
        @"type": @"input",
        @"buttons": btnsArray,
        @"ls": @[@(state.ls_x), @(state.ls_y)],
        @"rs": @[@(state.rs_x), @(state.rs_y)],
        @"lt": @(state.lt),
        @"rt": @(state.rt)
    } options:0 error:&error];
    
    if (jsonData) {
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        _callback(state, [jsonString UTF8String], _callbackContext);
    }
}

- (void)reissueRead {
    if (!_interfaceInterface || _readPipeIndex == 0) return;
    
    (*_interfaceInterface)->ReadPipeAsync(_interfaceInterface,
                                          _readPipeIndex,
                                          _readBuffer,
                                          sizeof(_readBuffer),
                                          ReadCallback,
                                          (__bridge void *)self);
}

- (void)sendRumbleLeft:(float)left right:(float)right leftTrigger:(float)leftTrigger rightTrigger:(float)rightTrigger {
    if (!_interfaceInterface || _writePipeIndex == 0) return;
    
    UInt8 lVal = (UInt8)(left * 255.0f);
    UInt8 rVal = (UInt8)(right * 255.0f);
    UInt8 ltVal = (UInt8)(leftTrigger * 255.0f);
    UInt8 rtVal = (UInt8)(rightTrigger * 255.0f);
    
    _rumbleSeq = (_rumbleSeq + 1) % 256;
    
    UInt8 packet[] = {
        0x09,         // CMD: Rumble
        0x00,         // Flags
        _rumbleSeq,
        0x09,         // Payload Length
        0x00,         // Mode
        0x0F,         // Motor Mask: All 4 motors
        ltVal,
        rtVal,
        lVal,
        rVal,
        0xFF,         // Duration (continuous)
        0x00,         // Delay
        0x00          // Repeat
    };
    
    (*_interfaceInterface)->WritePipe(_interfaceInterface, _writePipeIndex, packet, sizeof(packet));
}

@end

// C Callbacks
static void DeviceAdded(void *refCon, io_iterator_t iterator) {
    XboxControllerManager *manager = (__bridge XboxControllerManager *)refCon;
    io_service_t device;
    while ((device = IOIteratorNext(iterator))) {
        [manager handleDeviceAdded:device];
    }
}

static void DeviceRemoved(void *refCon, io_iterator_t iterator) {
    XboxControllerManager *manager = (__bridge XboxControllerManager *)refCon;
    io_service_t device;
    while ((device = IOIteratorNext(iterator))) {
        [manager handleDeviceRemoved:device];
    }
}

static void ReadCallback(void *refcon, IOReturn result, void *arg0) {
    XboxControllerManager *manager = (__bridge XboxControllerManager *)refcon;
    UInt32 bytesRead = (UInt32)(uintptr_t)arg0;
    [manager handleReadResult:result bytesRead:bytesRead];
}
