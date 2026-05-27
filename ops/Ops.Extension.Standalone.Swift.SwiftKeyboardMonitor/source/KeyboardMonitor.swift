import Foundation
import CoreGraphics

private func eventTapCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passRetained(event) }
    let monitor = Unmanaged<KeyboardMonitor>.fromOpaque(refcon).takeUnretainedValue()
    monitor.handleEvent(type: type, event: event)
    return Unmanaged.passRetained(event)
}

struct StandardError: TextOutputStream, Sendable {
    func write(_ string: String) {
        if let data = string.data(using: .utf8) {
            FileHandle.standardError.write(data)
        }
    }
}

private let keyCodeMap: [Int: String] = [
    0: "a", 1: "s", 2: "d", 3: "f", 4: "h", 5: "g", 6: "z", 7: "x", 8: "c", 9: "v",
    11: "b", 12: "q", 13: "w", 14: "e", 15: "r", 16: "y", 17: "t", 18: "1", 19: "2",
    20: "3", 21: "4", 22: "6", 23: "5", 24: "=", 25: "9", 26: "7", 27: "-", 28: "8",
    29: "0", 30: "]", 31: "o", 32: "u", 33: "[", 34: "i", 35: "p", 36: "return", 37: "l",
    38: "j", 39: "'", 40: "k", 41: ";", 42: "\\", 43: ",", 44: "/", 45: "n", 46: "m",
    47: ".", 48: "tab", 49: "space", 50: "`", 51: "delete", 52: "enter", 53: "escape",
    64: "f17", 65: ".", 67: "*", 69: "+", 71: "clear", 75: "/", 76: "enter", 78: "-",
    79: "f18", 80: "f19", 81: "=", 82: "0", 83: "1", 84: "2", 85: "3", 86: "4", 87: "5",
    88: "6", 89: "7", 90: "f20", 91: "8", 92: "9", 96: "f5", 97: "f6", 98: "f7", 99: "f3",
    100: "f8", 101: "f9", 103: "f11", 105: "f13", 106: "f16", 107: "f14", 109: "f10",
    111: "f12", 113: "f15", 115: "home", 116: "pageup", 117: "delete", 118: "f4", 119: "end",
    120: "f2", 121: "pagedown", 122: "f1", 123: "left", 124: "right", 125: "down", 126: "up"
]

public final class KeyboardMonitor: @unchecked Sendable {
    private var thread: Thread?
    private var runLoop: CFRunLoop?
    private var eventTap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    
    private let lock = NSLock()
    private var errorStream = StandardError()
    
    private var isCtrlPressed = false
    private var isAltPressed = false
    private var isShiftPressed = false
    private var isCmdPressed = false
    
    private var _onInputEvent: (@Sendable (String) -> Void)?
    public var onInputEvent: (@Sendable (String) -> Void)? {
        get { lock.lock(); defer { lock.unlock() }; return _onInputEvent }
        set { lock.lock(); defer { lock.unlock() }; _onInputEvent = newValue }
    }
    
    private var _channel = "keyboardEvents"
    public var channel: String {
        get { lock.lock(); defer { lock.unlock() }; return _channel }
        set { lock.lock(); defer { lock.unlock() }; _channel = newValue }
    }
    
    public init() {}
    
    public func start() {
        lock.lock()
        defer { lock.unlock() }
        
        guard thread == nil else { return }
        
        thread = Thread { [weak self] in
            self?.runMonitorLoop()
        }
        thread?.name = "CablesKeyboardMonitorThread"
        thread?.start()
    }
    
    public func stop() {
        lock.lock()
        defer { lock.unlock() }
        
        if let runLoop = runLoop {
            CFRunLoopStop(runLoop)
        }
        if let eventTap = eventTap {
            CGEvent.tapEnable(tap: eventTap, enable: false)
        }
        
        thread = nil
        runLoop = nil
        eventTap = nil
        runLoopSource = nil
    }
    
    private func runMonitorLoop() {
        let selfPointer = Unmanaged.passUnretained(self).toOpaque()
        
        let eventMask = (1 << CGEventType.keyDown.rawValue)
                      | (1 << CGEventType.keyUp.rawValue)
                      | (1 << CGEventType.flagsChanged.rawValue)
        
        guard let eventTap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap,
            eventsOfInterest: CGEventMask(eventMask),
            callback: eventTapCallback,
            userInfo: selfPointer
        ) else {
            print("[KeyboardMonitor] Warning: Failed to create CGEventTap for keyboard. Accessibility permissions might be missing.", to: &errorStream)
            return
        }
        
        self.lock.lock()
        self.eventTap = eventTap
        self.runLoop = CFRunLoopGetCurrent()
        self.lock.unlock()
        
        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0)
        if let source = runLoopSource {
            CFRunLoopAddSource(CFRunLoopGetCurrent(), source, CFRunLoopMode.defaultMode)
        }
        
        CGEvent.tapEnable(tap: eventTap, enable: true)
        CFRunLoopRun()
    }
    
    fileprivate func handleEvent(type: CGEventType, event: CGEvent) {
        switch type {
        case .flagsChanged:
            let flags = event.flags
            lock.lock()
            isCtrlPressed = flags.contains(.maskControl)
            isAltPressed = flags.contains(.maskAlternate)
            isShiftPressed = flags.contains(.maskShift)
            isCmdPressed = flags.contains(.maskCommand)
            lock.unlock()
            
        case .keyDown, .keyUp:
            let keyCode = Int(event.getIntegerValueField(.keyboardEventKeycode))
            let keyStr = keyCodeMap[keyCode] ?? "Key_\(keyCode)"
            
            lock.lock()
            var modParts: [String] = []
            if isCtrlPressed { modParts.append("ctrl") }
            if isAltPressed { modParts.append("alt") }
            if isShiftPressed { modParts.append("shift") }
            if isCmdPressed { modParts.append("cmd") }
            lock.unlock()
            
            let modifiersStr = modParts.joined(separator: " + ")
            let comboStr: String
            if !modifiersStr.isEmpty {
                comboStr = "\(modifiersStr) + \(keyStr)"
            } else {
                comboStr = keyStr
            }
            
            let eventName = (type == .keyDown) ? "press" : "release"
            
            let payload = "{\"type\":\"publish\",\"channel\":\"\(channel)\",\"data\":{\"combo\":\"\(comboStr)\",\"key\":\"\(keyStr)\",\"modifiers\":\"\(modifiersStr)\",\"event\":\"\(eventName)\"}}"
            onInputEvent?(payload)
            
        default:
            break
        }
    }
}
