import Foundation
import IOKit.hid

class SoomfonMonitor {
    private var thread: Thread?
    private var runLoop: CFRunLoop?
    private var manager: IOHIDManager?
    
    private let lock = NSLock()
    var knownDevices = [String: IOHIDDevice]()
    
    var onDeviceAdded: ((IOHIDDevice) -> Void)?
    var onDeviceRemoved: ((IOHIDDevice) -> Void)?
    
    func start() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        
        guard thread == nil else { return true }
        
        let managerRef = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
        self.manager = managerRef
        
        let matchingDicts: [[String: Any]] = [
            [
                kIOHIDVendorIDKey: 0x1500,
                kIOHIDProductIDKey: 0x3001,
                kIOHIDDeviceUsagePageKey: 0xFFA0
            ],
            [
                kIOHIDVendorIDKey: 0x0300,
                kIOHIDProductIDKey: 0x3002,
                kIOHIDDeviceUsagePageKey: 0xFFA0
            ]
        ]
        
        IOHIDManagerSetDeviceMatchingMultiple(managerRef, matchingDicts as CFArray)
        
        let startedSemaphore = DispatchSemaphore(value: 0)
        
        thread = Thread { [weak self] in
            self?.runMonitorLoop(startedSemaphore: startedSemaphore)
        }
        thread?.name = "CablesSoomfonMonitorThread"
        thread?.start()
        
        _ = startedSemaphore.wait(timeout: .now() + 1.0)
        return true
    }
    
    func stop() {
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
    
    private func runMonitorLoop(startedSemaphore: DispatchSemaphore) {
        guard let manager = manager else {
            startedSemaphore.signal()
            return
        }
        
        self.lock.lock()
        self.runLoop = CFRunLoopGetCurrent()
        self.lock.unlock()
        
        let context = UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        
        let matchingCallback: IOHIDDeviceCallback = { context, result, sender, device in
            guard let context = context else { return }
            let monitor = Unmanaged<SoomfonMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.deviceAdded(device)
        }
        
        let removalCallback: IOHIDDeviceCallback = { context, result, sender, device in
            guard let context = context else { return }
            let monitor = Unmanaged<SoomfonMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.deviceRemoved(device)
        }
        
        IOHIDManagerRegisterDeviceMatchingCallback(manager, matchingCallback, context)
        IOHIDManagerRegisterDeviceRemovalCallback(manager, removalCallback, context)
        
        IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), CFRunLoopMode.defaultMode.rawValue)
        
        let openResult = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        if openResult != kIOReturnSuccess {
            print("❌ Failed to open IOHIDManager. Error code: \(openResult)")
            startedSemaphore.signal()
            return
        }
        
        startedSemaphore.signal()
        CFRunLoopRun()
    }
    
    private func deviceAdded(_ device: IOHIDDevice) {
        lock.lock()
        let serial = (IOHIDDeviceGetProperty(device, kIOHIDSerialNumberKey as CFString) as? String) ?? UUID().uuidString
        knownDevices[serial] = device
        lock.unlock()
        
        onDeviceAdded?(device)
    }
    
    private func deviceRemoved(_ device: IOHIDDevice) {
        lock.lock()
        let serial = (IOHIDDeviceGetProperty(device, kIOHIDSerialNumberKey as CFString) as? String) ?? ""
        knownDevices.removeValue(forKey: serial)
        lock.unlock()
        
        onDeviceRemoved?(device)
    }
}
