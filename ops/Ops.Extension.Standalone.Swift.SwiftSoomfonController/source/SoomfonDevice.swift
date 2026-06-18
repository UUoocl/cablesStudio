import Foundation
import IOKit.hid

class SoomfonDevice {
    let rawDevice: IOHIDDevice
    let vendorId: Int
    let productId: Int
    
    private var inputBuffer = [UInt8](repeating: 0, count: 512)
    private let writeLock = NSLock()
    
    var onButtonEvent: ((Int, Bool) -> Void)?
    var onKnobTurnEvent: ((Int, Int) -> Void)?
    var onKnobClickEvent: ((Int, Bool) -> Void)?
    
    init(rawDevice: IOHIDDevice) {
        self.rawDevice = rawDevice
        
        let vidVal = IOHIDDeviceGetProperty(rawDevice, kIOHIDVendorIDKey as CFString) as? Int
        let pidVal = IOHIDDeviceGetProperty(rawDevice, kIOHIDProductIDKey as CFString) as? Int
        
        self.vendorId = vidVal ?? 0
        self.productId = pidVal ?? 0
    }
    
    func open() -> Bool {
        // Phase 1: Wake
        let openRes = IOHIDDeviceOpen(rawDevice, IOOptionBits(kIOHIDOptionsTypeNone))
        guard openRes == kIOReturnSuccess else { return false }
        
        sendInitSequence()
        IOHIDDeviceClose(rawDevice, IOOptionBits(kIOHIDOptionsTypeNone))
        
        // Sleep for WAKE_DELAY (500ms)
        Thread.sleep(forTimeInterval: 0.5)
        
        // Phase 2: Reconnect for operation
        let openRes2 = IOHIDDeviceOpen(rawDevice, IOOptionBits(kIOHIDOptionsTypeNone))
        guard openRes2 == kIOReturnSuccess else { return false }
        
        sendInitSequence()
        
        // Start reading input reports
        startReading()
        
        return true
    }
    
    func close() {
        writeLock.lock()
        defer { writeLock.unlock() }
        
        // Send shutdown and sleep commands
        sendPacketLocked(cmd: [0x43, 0x4C, 0x45, 0x00, 0x00, 0x44, 0x43]) // SHUTDOWN
        sendPacketLocked(cmd: [0x48, 0x41, 0x4E]) // SLEEP/STANDBY
        
        IOHIDDeviceClose(rawDevice, IOOptionBits(kIOHIDOptionsTypeNone))
    }
    
    func setBrightness(_ percent: Int) {
        let percentByte = UInt8(clamping: percent)
        sendPacket(cmd: [0x4C, 0x49, 0x47, 0x00, 0x00, percentByte])
    }
    
    func clearAllImages() {
        sendPacket(cmd: [0x43, 0x4C, 0x45, 0x00, 0x00, 0x00, 0xFF]) // CLEAR
        sendPacket(cmd: [0x53, 0x54, 0x50]) // FLUSH
    }
    
    func setKeyImage(keyIndex: Int, jpegData: Data) {
        writeLock.lock()
        defer { writeLock.unlock() }
        
        // Send announcement
        let size = jpegData.count
        let sizeHi = UInt8((size >> 8) & 0xFF)
        let sizeLo = UInt8(size & 0xFF)
        let keyByte = UInt8(keyIndex + 1)
        
        let announceCmd: [UInt8] = [0x42, 0x41, 0x54, 0x00, 0x00, sizeHi, sizeLo, keyByte]
        sendPacketLocked(cmd: announceCmd)
        
        // Send JPEG chunks (1024 bytes each)
        var offset = 0
        while offset < jpegData.count {
            let chunkLength = min(1024, jpegData.count - offset)
            let chunk = jpegData.subdata(in: offset ..< (offset + chunkLength))
            
            var chunkPacket = [UInt8](repeating: 0, count: 1024)
            chunk.copyBytes(to: &chunkPacket[0], count: chunkLength)
            
            IOHIDDeviceSetReport(
                rawDevice,
                kIOHIDReportTypeOutput,
                CFIndex(0),
                chunkPacket,
                chunkPacket.count
            )
            
            offset += 1024
        }
        
        // Send flush packet
        sendPacketLocked(cmd: [0x53, 0x54, 0x50])
    }
    
    func keepAlive() {
        sendPacket(cmd: [0x43, 0x4F, 0x4E, 0x4E, 0x45, 0x43, 0x54]) // CONNECT
    }
    
    // MARK: - Internal Packet Helpers
    
    private func sendInitSequence() {
        sendPacket(cmd: [0x44, 0x49, 0x53, 0x00, 0x00]) // DIS
        setBrightness(80)
        clearAllImages()
    }
    
    private func sendPacket(cmd: [UInt8]) {
        writeLock.lock()
        defer { writeLock.unlock() }
        sendPacketLocked(cmd: cmd)
    }
    
    private func sendPacketLocked(cmd: [UInt8]) {
        var packet = [UInt8](repeating: 0, count: 1024)
        // Header starts at index 0: b"CRT\x00\x00"
        packet[0...4] = [0x43, 0x52, 0x54, 0x00, 0x00]
        // Command starts at index 5
        for (idx, byte) in cmd.enumerated() {
            if 5 + idx < packet.count {
                packet[5 + idx] = byte
            }
        }
        
        IOHIDDeviceSetReport(
            rawDevice,
            kIOHIDReportTypeOutput,
            CFIndex(0),
            packet,
            packet.count
        )
    }
    
    // MARK: - Input Reports
    
    private func startReading() {
        let selfPointer = UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        
        let callback: IOHIDReportCallback = { context, result, sender, type, reportID, report, reportLength in
            guard result == kIOReturnSuccess, let context = context else { return }
            let data = Array(UnsafeBufferPointer(start: report, count: reportLength))
            
            let device = Unmanaged<SoomfonDevice>.fromOpaque(context).takeUnretainedValue()
            device.processInputReport(data)
        }
        
        IOHIDDeviceRegisterInputReportCallback(
            rawDevice,
            &inputBuffer,
            inputBuffer.count,
            callback,
            selfPointer
        )
    }
    
    private func processInputReport(_ data: [UInt8]) {
        guard data.count >= 11 else { return }
        
        // Byte 9 is action code
        // Byte 10 is state
        let action = data[9]
        let state = data[10]
        
        // Action code mappings:
        // Buttons:
        let buttonMapping: [UInt8: Int] = [
            0x01: 0, 0x02: 1, 0x03: 2, 0x04: 3, 0x05: 4, 0x06: 5,
            0x25: 6, 0x30: 7, 0x31: 8
        ]
        
        // Knob twists:
        let knobTwistMapping: [UInt8: (Int, Int)] = [
            0x90: (0, -1), 0x91: (0, 1),
            0x50: (1, -1), 0x51: (1, 1),
            0x60: (2, -1), 0x61: (2, 1)
        ]
        
        // Knob presses (clicks):
        let knobPressMapping: [UInt8: Int] = [
            0x33: 0, 0x35: 1, 0x34: 2
        ]
        
        if let keyIndex = buttonMapping[action] {
            let pressed = (state != 0)
            onButtonEvent?(keyIndex, pressed)
        } else if let (knobIndex, direction) = knobTwistMapping[action] {
            onKnobTurnEvent?(knobIndex, direction)
        } else if let knobIndex = knobPressMapping[action] {
            let pressed = (state != 0)
            onKnobClickEvent?(knobIndex, pressed)
        }
    }
}
