import Foundation
import IOKit
import IOKit.hid

print("🔍 Starting Contour Shuttle USB Sniffer...")
print("🔌 Searching for ShuttleXpress (0x0020) and ShuttlePRO v2 (0x0030) under Vendor ID 0x0b33...")

let manager = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))

let matchingDicts: [[String: Any]] = [
    [
        kIOHIDVendorIDKey: 0x0b33,
        kIOHIDProductIDKey: 0x0020 // ShuttleXpress
    ],
    [
        kIOHIDVendorIDKey: 0x0b33,
        kIOHIDProductIDKey: 0x0030 // ShuttlePRO v2
    ]
]

IOHIDManagerSetDeviceMatchingMultiple(manager, matchingDicts as CFArray)

let callback: IOHIDReportCallback = { context, result, sender, type, reportID, report, reportLength in
    guard result == kIOReturnSuccess else { return }
    let data = Array(UnsafeBufferPointer(start: report, count: reportLength))
    
    // Print the raw byte sequence
    let byteStrings = data.map { String(format: "%02X (%d)", $0, $0) }
    print("📥 Raw HID Report (length \(reportLength)): [\(byteStrings.joined(separator: ", "))]")
}

let context = UnsafeMutableRawPointer(Unmanaged.passUnretained(manager).toOpaque())
IOHIDManagerRegisterInputReportCallback(manager, callback, context)
IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), CFRunLoopMode.defaultMode.rawValue)

let openResult = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
if openResult != kIOReturnSuccess {
    print("❌ Failed to open IOHIDManager. Error code: \(openResult)")
    exit(1)
}

print("✅ Sniffer is active! Press buttons and rotate the dials on your Shuttle device.")
print("ℹ️  Press Ctrl+C in your Terminal to exit.\n")

CFRunLoopRun()
