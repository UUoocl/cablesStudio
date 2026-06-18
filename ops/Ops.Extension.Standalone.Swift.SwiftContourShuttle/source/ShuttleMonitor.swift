import Foundation
import IOKit
import IOKit.hid

public final class ShuttleMonitor: @unchecked Sendable {
    private var thread: Thread?
    private var runLoop: CFRunLoop?
    private var manager: IOHIDManager?
    
    private let lock = NSLock()
    private var _onInputEvent: (@Sendable (String) -> Void)?
    
    public var onInputEvent: (@Sendable (String) -> Void)? {
        get { lock.lock(); defer { lock.unlock() }; return _onInputEvent }
        set { lock.lock(); defer { lock.unlock() }; _onInputEvent = newValue }
    }
    
    private var prevJog: Int?
    private var prevShuttle: Int?
    private var prevButtons = Array(repeating: false, count: 15)
    
    public init() {}
    
    public func start() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        
        guard thread == nil else { return true }
        
        let managerRef = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
        self.manager = managerRef
        
        let matchingDict: [String: Any] = [
            kIOHIDVendorIDKey: 0x0b33,
            kIOHIDProductIDKey: 0x0030
        ]
        IOHIDManagerSetDeviceMatching(managerRef, matchingDict as CFDictionary)
        
        let startedSemaphore = DispatchSemaphore(value: 0)
        
        thread = Thread { [weak self] in
            self?.runMonitorLoop(startedSemaphore: startedSemaphore)
        }
        thread?.name = "CablesShuttleMonitorThread"
        thread?.start()
        
        _ = startedSemaphore.wait(timeout: .now() + 1.0)
        return true
    }
    
    public func stop() {
        lock.lock()
        defer { lock.unlock() }
        
        if let runLoop = runLoop {
            CFRunLoopStop(runLoop)
        }
        
        if let manager = manager {
            IOHIDManagerClose(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        }
        
        thread = nil
        runLoop = nil
        manager = nil
    }
    
    public func isDeviceConnected() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard let manager = manager else { return false }
        let devices = IOHIDManagerCopyDevices(manager)
        return devices != nil
    }
    
    private func runMonitorLoop(startedSemaphore: DispatchSemaphore) {
        guard let manager = manager else {
            startedSemaphore.signal()
            return
        }
        
        self.lock.lock()
        self.runLoop = CFRunLoopGetCurrent()
        self.lock.unlock()
        
        let context = UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        
        let callback: IOHIDReportCallback = { context, result, sender, type, reportID, report, reportLength in
            guard result == kIOReturnSuccess, let context = context else { return }
            let data = Array(UnsafeBufferPointer(start: report, count: reportLength))
            
            let monitor = Unmanaged<ShuttleMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.processReport(data)
        }
        
        IOHIDManagerRegisterInputReportCallback(manager, callback, context)
        IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), CFRunLoopMode.defaultMode.rawValue)
        
        let openResult = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        if openResult != kIOReturnSuccess {
            print("❌ Failed to open IOHIDManager. Error code: \(openResult)")
            startedSemaphore.signal()
            return
        }
        
        print("🔌 Native IOHIDManager opened and monitoring for device...")
        startedSemaphore.signal()
        
        CFRunLoopRun()
    }
    
    private func processReport(_ data: [UInt8]) {
        guard data.count >= 5 else { return }
        
        // Parse Shuttle (Byte 0, signed 8-bit, -7 to 7)
        var shuttleVal = Int(data[0])
        if shuttleVal > 127 {
            shuttleVal -= 256
        }
        
        // Parse Jog (Byte 1, uint8)
        let jogVal = Int(data[1])
        
        // Parse Buttons (Bytes 3 & 4)
        let bByte1 = data[3]
        let bByte2 = data[4]
        
        // 1. Shuttle ring event
        if prevShuttle == nil || shuttleVal != prevShuttle {
            sendEvent(json: "{\"type\":\"shuttle\",\"value\":\(shuttleVal)}")
            prevShuttle = shuttleVal
        }
        
        // 2. Jog wheel event
        if let prev = prevJog {
            var diff = jogVal - prev
            if diff > 128 {
                diff -= 256
            } else if diff < -128 {
                diff += 256
            }
            if diff != 0 {
                sendEvent(json: "{\"type\":\"jog\",\"delta\":\(diff),\"value\":\(jogVal)}")
            }
        }
        prevJog = jogVal
        
        // 3. Button events
        for i in 0..<8 {
            let pressed = ((bByte1 >> i) & 1) != 0
            if pressed != prevButtons[i] {
                prevButtons[i] = pressed
                sendEvent(json: "{\"type\":\"button\",\"index\":\(i),\"pressed\":\(pressed)}")
            }
        }
        for i in 8..<15 {
            let pressed = ((bByte2 >> (i - 8)) & 1) != 0
            if pressed != prevButtons[i] {
                prevButtons[i] = pressed
                sendEvent(json: "{\"type\":\"button\",\"index\":\(i),\"pressed\":\(pressed)}")
            }
        }
    }
    
    private func sendEvent(json: String) {
        onInputEvent?(json)
    }
}
