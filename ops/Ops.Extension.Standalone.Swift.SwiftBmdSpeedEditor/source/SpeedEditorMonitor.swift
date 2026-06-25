import Foundation
import IOKit
import IOKit.hid
import Darwin

struct SendableDeviceWrapper: @unchecked Sendable {
    let device: IOHIDDevice
}

public final class SpeedEditorMonitor: @unchecked Sendable {
    private var thread: Thread?
    private var runLoop: CFRunLoop?
    private var manager: IOHIDManager?
    
    private let lock = NSLock()
    private var _onInputEvent: (@Sendable (String) -> Void)?
    
    public var onInputEvent: (@Sendable (String) -> Void)? {
        get { lock.lock(); defer { lock.unlock() }; return _onInputEvent }
        set { lock.lock(); defer { lock.unlock() }; _onInputEvent = newValue }
    }
    
    private var activeDevice: IOHIDDevice?
    private var prevKeys: [UInt16] = []
    private var prevJog: Int32?
    private var authTimerTask: Task<Void, Never>?
    
    // Key codes to friendly names map
    private let keyNames: [UInt16: String] = [
        0x01: "SMART_INSERT",
        0x02: "APPEND",
        0x03: "RIPPLE_OVERWRITE",
        0x04: "CLOSE_UP",
        0x05: "PLACE_ON_TOP",
        0x06: "SOURCE_OVERWRITE",
        0x07: "IN",
        0x08: "OUT",
        0x09: "TRIM_IN",
        0x0a: "TRIM_OUT",
        0x0b: "ROLL",
        0x0c: "SLIP_SOURCE",
        0x0d: "SLIP_DEST",
        0x0e: "TRANS_DUR",
        0x0f: "CUT",
        0x10: "DIS",
        0x11: "SMOOTH_CUT",
        0x1a: "SOURCE",
        0x1b: "TIMELINE",
        0x1c: "SHTL",
        0x1d: "JOG",
        0x1e: "SCRL",
        0x1f: "SYNC_BIN",
        0x22: "TRANS",
        0x25: "VIDEO_ONLY",
        0x26: "AUDIO_ONLY",
        0x2b: "RIPPLE_DELETE",
        0x2c: "AUDIO_LEVEL",
        0x2d: "FULL_VIEW",
        0x2e: "SNAP",
        0x2f: "SPLIT",
        0x30: "LIVE_OVERWRITE",
        0x31: "ESC",
        0x33: "CAM1",
        0x34: "CAM2",
        0x35: "CAM3",
        0x36: "CAM4",
        0x37: "CAM5",
        0x38: "CAM6",
        0x39: "CAM7",
        0x3a: "CAM8",
        0x3b: "CAM9",
        0x3c: "STOP_PLAY"
    ]
    
    public init() {}
    
    public func start() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        
        guard thread == nil else { return true }
        
        let managerRef = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
        self.manager = managerRef
        
        let matchingDict: [String: Any] = [
            kIOHIDVendorIDKey: 0x1EDB,
            kIOHIDProductIDKey: 0xDA0E
        ]
        IOHIDManagerSetDeviceMatching(managerRef, matchingDict as CFDictionary)
        
        let startedSemaphore = DispatchSemaphore(value: 0)
        
        thread = Thread { [weak self] in
            self?.runMonitorLoop(startedSemaphore: startedSemaphore)
        }
        thread?.name = "CablesSpeedEditorMonitorThread"
        thread?.start()
        
        _ = startedSemaphore.wait(timeout: .now() + 1.0)
        return true
    }
    
    public func stop() {
        lock.lock()
        defer { lock.unlock() }
        
        authTimerTask?.cancel()
        authTimerTask = nil
        
        if let runLoop = runLoop {
            CFRunLoopStop(runLoop)
        }
        
        if let manager = manager {
            IOHIDManagerClose(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        }
        
        thread = nil
        runLoop = nil
        manager = nil
        activeDevice = nil
    }
    
    public func isDeviceConnected() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return activeDevice != nil
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
        
        // Match callback
        let matchCallback: IOHIDDeviceCallback = { context, result, sender, device in
            guard let context = context else { return }
            let monitor = Unmanaged<SpeedEditorMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.deviceMatched(device)
        }
        
        // Removal callback
        let removalCallback: IOHIDDeviceCallback = { context, result, sender, device in
            guard let context = context else { return }
            let monitor = Unmanaged<SpeedEditorMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.deviceRemoved(device)
        }
        
        // Input Report callback
        let callback: IOHIDReportCallback = { context, result, sender, type, reportID, report, reportLength in
            guard result == kIOReturnSuccess, let context = context else { return }
            let data = Array(UnsafeBufferPointer(start: report, count: reportLength))
            let monitor = Unmanaged<SpeedEditorMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.processReport(reportID: reportID, data: data)
        }
        
        IOHIDManagerRegisterDeviceMatchingCallback(manager, matchCallback, context)
        IOHIDManagerRegisterDeviceRemovalCallback(manager, removalCallback, context)
        IOHIDManagerRegisterInputReportCallback(manager, callback, context)
        
        IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), CFRunLoopMode.defaultMode.rawValue)
        
        let openResult = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        if openResult != kIOReturnSuccess {
            print("❌ Failed to open IOHIDManager. Error code: \(openResult)")
            startedSemaphore.signal()
            return
        }
        
        print("🔌 Native IOHIDManager opened and monitoring for Speed Editor...")
        startedSemaphore.signal()
        
        CFRunLoopRun()
    }
    
    private func deviceMatched(_ device: IOHIDDevice) {
        lock.lock()
        self.activeDevice = device
        lock.unlock()
        
        print("🔌 DaVinci Speed Editor connected. Authenticating...")
        
        if authenticate(device) {
            // Success! Send info event to Cables
            sendEvent(json: "{\"type\":\"info\",\"status\":\"connected\",\"device\":\"DaVinci Resolve Speed Editor\"}")
            
            // Start periodic re-authentication loop to keep device unlocked
            startAuthKeepAlive(device)
        } else {
            sendEvent(json: "{\"type\":\"error\",\"message\":\"Authentication handshake failed\"}")
        }
    }
    
    private func deviceRemoved(_ device: IOHIDDevice) {
        lock.lock()
        if self.activeDevice === device {
            self.activeDevice = nil
            authTimerTask?.cancel()
            authTimerTask = nil
        }
        lock.unlock()
        
        print("🔌 DaVinci Speed Editor disconnected.")
        sendEvent(json: "{\"type\":\"info\",\"status\":\"searching\",\"device\":\"DaVinci Resolve Speed Editor (Not Connected)\"}")
    }
    
    // Auth math
    private func rol8(_ v: UInt64) -> UInt64 {
        return (v << 56) | (v >> 8)
    }

    private func rol8n(_ v: UInt64, _ n: Int) -> UInt64 {
        var val = v
        for _ in 0..<n {
            val = rol8(val)
        }
        return val
    }

    private func bmdKbdAuth(challenge: UInt64) -> UInt64 {
        let authEvenTbl: [UInt64] = [
            0x3ae1206f97c10bc8,
            0x2a9ab32bebf244c6,
            0x20a6f8b8df9adf0a,
            0xaf80ece52cfc1719,
            0xec2ee2f7414fd151,
            0xb055adfd73344a15,
            0xa63d2e3059001187,
            0x751bf623f42e0dde
        ]
        let authOddTbl: [UInt64] = [
            0x3e22b34f502e7fde,
            0x24656b981875ab1c,
            0xa17f3456df7bf8c3,
            0x6df72e1941aef698,
            0x72226f011e66ab94,
            0x3831a3c606296b42,
            0xfd7ff81881332c89,
            0x61a3f6474ff236c6
        ]
        let mask: UInt64 = 0xa79a63f585d37bf0

        let n = Int(challenge & 7)
        var v = rol8n(challenge, n)

        let k: UInt64
        if (v & 1) == UInt64((0x78 >> n) & 1) {
            k = authEvenTbl[n]
        } else {
            v = v ^ rol8(v)
            k = authOddTbl[n]
        }

        return v ^ (rol8(v) & mask) ^ k
    }
    
    private func authenticate(_ device: IOHIDDevice) -> Bool {
        // Step 1: Send reset report: 06 00 00 00 00 00 00 00 00 00
        var resetReport: [UInt8] = [0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        var res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, &resetReport, resetReport.count)
        guard res == kIOReturnSuccess else { return false }
        
        // Step 2: Read challenge report
        var challengeReport = [UInt8](repeating: 0, count: 10)
        var challengeLength = challengeReport.count
        res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, &challengeReport, &challengeLength)
        guard res == kIOReturnSuccess, challengeReport[0] == 0x06, challengeReport[1] == 0x00 else { return false }
        
        // Convert to UInt64 challenge (little endian)
        var challenge: UInt64 = 0
        for i in 0..<8 {
            challenge |= UInt64(challengeReport[2 + i]) << (i * 8)
        }
        
        // Step 3: Send our challenge (just zeros)
        var ourChallengeReport: [UInt8] = [0x06, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, &ourChallengeReport, ourChallengeReport.count)
        guard res == kIOReturnSuccess else { return false }
        
        // Step 4: Read response report
        var responseReport = [UInt8](repeating: 0, count: 10)
        var responseLength = responseReport.count
        res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, &responseReport, &responseLength)
        guard res == kIOReturnSuccess, responseReport[0] == 0x06, responseReport[1] == 0x02 else { return false }
        
        // Step 5: Compute and send our response
        let responseVal = bmdKbdAuth(challenge: challenge)
        var ourResponseReport = [UInt8](repeating: 0, count: 10)
        ourResponseReport[0] = 0x06
        ourResponseReport[1] = 0x03
        for i in 0..<8 {
            ourResponseReport[2 + i] = UInt8((responseVal >> (i * 8)) & 0xFF)
        }
        res = IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, 6, &ourResponseReport, ourResponseReport.count)
        guard res == kIOReturnSuccess else { return false }
        
        // Step 6: Read status report
        var statusReport = [UInt8](repeating: 0, count: 10)
        var statusLength = statusReport.count
        res = IOHIDDeviceGetReport(device, kIOHIDReportTypeFeature, 6, &statusReport, &statusLength)
        guard res == kIOReturnSuccess, statusReport[0] == 0x06, statusReport[1] == 0x04 else { return false }
        
        return true
    }
    
    private func startAuthKeepAlive(_ device: IOHIDDevice) {
        authTimerTask?.cancel()
        let wrapper = SendableDeviceWrapper(device: device)
        authTimerTask = Task { [wrapper] in
            while !Task.isCancelled {
                // Re-authenticate every 500 seconds (timeout is 600s)
                try? await Task.sleep(nanoseconds: 500_000_000_000)
                guard !Task.isCancelled else { break }
                
                print("🔄 Performing periodic re-authentication to maintain unlock state...")
                if !self.authenticate(wrapper.device) {
                    print("❌ Periodic re-authentication failed!")
                    self.sendEvent(json: "{\"type\":\"error\",\"message\":\"Periodic re-authentication failed\"}")
                }
            }
        }
    }
    
    // Process input reports
    private func processReport(reportID: UInt32, data: [UInt8]) {
        guard !data.isEmpty else { return }
        

        // The report ID is prepended to the data buffer if:
        // 1. The first byte matches the report ID.
        // 2. And the length is larger than the standard payload.
        let isPrepended = (data[0] == UInt8(reportID)) && (
            (reportID == 3 && (data.count == 7 || data.count == 6)) ||
            (reportID == 4 && data.count == 13) ||
            (reportID == 7 && data.count == 3)
        )
        
        let payload = isPrepended ? Array(data.dropFirst()) : data
        
        if reportID == 0x03 {
            // Jog Wheel report
            // Byte 0: Jog mode
            // Bytes 1..4: Jog value (signed 32-bit integer)
            guard payload.count >= 5 else { return }
            let jogMode = Int(payload[0])
            
            var temp: Int32 = 0
            withUnsafeMutableBytes(of: &temp) { tempBytes in
                tempBytes.copyBytes(from: payload[1...4])
            }
            let jv = temp.littleEndian
            
            // In relative modes (0 and 2), the device reports relative ticks directly.
            // In absolute modes (1 and 3), the device reports cumulative position.
            let isRelative = (jogMode == 0 || jogMode == 2)
            
            var delta: Int32 = 0
            if isRelative {
                delta = jv
            } else {
                if let prev = prevJog {
                    delta = jv - prev
                }
                prevJog = jv
            }
            
            sendEvent(json: "{\"type\":\"jog\",\"mode\":\(jogMode),\"value\":\(jv),\"delta\":\(delta)}")
            
        } else if reportID == 0x04 {
            // Keypresses report (12 bytes of keys - 6 uint16s)
            guard payload.count >= 12 else { return }
            var currentKeys: [UInt16] = []
            for idx in 0..<6 {
                let byteL = payload[idx * 2]
                let byteH = payload[idx * 2 + 1]
                let keyCode = UInt16(byteL) | (UInt16(byteH) << 8)
                if keyCode != 0 {
                    currentKeys.append(keyCode)
                }
            }
            
            // Determine presses and releases
            let pressedKeys = currentKeys.filter { !prevKeys.contains($0) }
            let releasedKeys = prevKeys.filter { !currentKeys.contains($0) }
            
            prevKeys = currentKeys
            
            // Map keys to names
            let currentNames = currentKeys.compactMap { keyNames[$0] ?? "UNKNOWN_\($0)" }
            let currentKeysJson = "[" + currentKeys.map { String($0) }.joined(separator: ",") + "]"
            let currentNamesJson = "[" + currentNames.map { "\"\($0)\"" }.joined(separator: ",") + "]"
            
            // Send overall held state
            sendEvent(json: "{\"type\":\"keys\",\"codes\":\(currentKeysJson),\"names\":\(currentNamesJson)}")
            
            // Send individual events
            for code in pressedKeys {
                let name = keyNames[code] ?? "UNKNOWN_\(code)"
                sendEvent(json: "{\"type\":\"key_event\",\"code\":\(code),\"name\":\"\(name)\",\"pressed\":true}")
            }
            for code in releasedKeys {
                let name = keyNames[code] ?? "UNKNOWN_\(code)"
                sendEvent(json: "{\"type\":\"key_event\",\"code\":\(code),\"name\":\"\(name)\",\"pressed\":false}")
            }
            
        } else if reportID == 0x07 {
            // Battery report
            // Byte 0: Charging status
            // Byte 1: Battery level
            guard payload.count >= 2 else { return }
            let charging = payload[0] != 0
            let level = Int(payload[1])
            
            sendEvent(json: "{\"type\":\"battery\",\"charging\":\(charging),\"level\":\(level)}")
        }
    }
    
    // Send Control commands (LEDs / Jog modes)
    public func handleIncomingCommand(json: String) {
        guard let data = json.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let action = dict["action"] as? String else { return }
        
        lock.lock()
        guard let device = activeDevice else {
            lock.unlock()
            return
        }
        lock.unlock()
        
        if action == "set_leds", let bitfield = dict["value"] as? UInt32 {
            // Set standard button LEDs
            var report = [UInt8](repeating: 0, count: 5)
            report[0] = 0x02
            report[1] = UInt8(bitfield & 0xFF)
            report[2] = UInt8((bitfield >> 8) & 0xFF)
            report[3] = UInt8((bitfield >> 16) & 0xFF)
            report[4] = UInt8((bitfield >> 24) & 0xFF)
            
            let res = IOHIDDeviceSetReport(device, kIOHIDReportTypeOutput, 2, &report, report.count)
            if res != kIOReturnSuccess {
                print("❌ Failed to set button LEDs: \(res)")
            }
            
        } else if action == "set_jog_leds", let bitfield = dict["value"] as? UInt8 {
            // Set JOG, SHTL, SCRL LEDs
            var report = [UInt8](repeating: 0, count: 2)
            report[0] = 0x04
            report[1] = bitfield
            
            let res = IOHIDDeviceSetReport(device, kIOHIDReportTypeOutput, 4, &report, report.count)
            if res != kIOReturnSuccess {
                print("❌ Failed to set Jog LEDs: \(res)")
            }
            
        } else if action == "set_jog_mode", let mode = dict["value"] as? UInt8 {
            // Set Jog Mode
            var report = [UInt8](repeating: 0, count: 7)
            report[0] = 0x03
            report[1] = mode
            report[2] = 0x00
            report[3] = 0x00
            report[4] = 0x00
            report[5] = 0x00
            report[6] = 0xFF // Unknown default
            
            let res = IOHIDDeviceSetReport(device, kIOHIDReportTypeOutput, 3, &report, report.count)
            if res != kIOReturnSuccess {
                print("❌ Failed to set Jog Mode: \(res)")
            }
        }
    }
    
    private func sendEvent(json: String) {
        onInputEvent?(json)
    }
}
