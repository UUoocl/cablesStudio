import Foundation
import CoreGraphics

private func eventTapCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passRetained(event) }
    let monitor = Unmanaged<MouseMonitor>.fromOpaque(refcon).takeUnretainedValue()
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

public final class MouseMonitor: @unchecked Sendable {
    private var thread: Thread?
    private var runLoop: CFRunLoop?
    private var eventTap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    
    private let lock = NSLock()
    private var errorStream = StandardError()
    
    private var _onInputEvent: (@Sendable (String) -> Void)?
    public var onInputEvent: (@Sendable (String) -> Void)? {
        get { lock.lock(); defer { lock.unlock() }; return _onInputEvent }
        set { lock.lock(); defer { lock.unlock() }; _onInputEvent = newValue }
    }
    
    private var _targetPps = 20
    public var targetPps: Int {
        get { lock.lock(); defer { lock.unlock() }; return _targetPps }
        set { lock.lock(); defer { lock.unlock() }; _targetPps = newValue }
    }
    
    private var _channel = "mouseEvents"
    public var channel: String {
        get { lock.lock(); defer { lock.unlock() }; return _channel }
        set { lock.lock(); defer { lock.unlock() }; _channel = newValue }
    }
    
    private var lastMoveTime = Date.distantPast
    
    public init() {}
    
    public func start() {
        lock.lock()
        defer { lock.unlock() }
        
        guard thread == nil else { return }
        
        thread = Thread { [weak self] in
            self?.runMonitorLoop()
        }
        thread?.name = "CablesMouseMonitorThread"
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
        
        let eventMask = (1 << CGEventType.mouseMoved.rawValue)
                      | (1 << CGEventType.leftMouseDown.rawValue)
                      | (1 << CGEventType.leftMouseUp.rawValue)
                      | (1 << CGEventType.leftMouseDragged.rawValue)
                      | (1 << CGEventType.rightMouseDown.rawValue)
                      | (1 << CGEventType.rightMouseUp.rawValue)
                      | (1 << CGEventType.rightMouseDragged.rawValue)
                      | (1 << CGEventType.otherMouseDown.rawValue)
                      | (1 << CGEventType.otherMouseUp.rawValue)
                      | (1 << CGEventType.otherMouseDragged.rawValue)
                      | (1 << CGEventType.scrollWheel.rawValue)
        
        guard let eventTap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap,
            eventsOfInterest: CGEventMask(eventMask),
            callback: eventTapCallback,
            userInfo: selfPointer
        ) else {
            print("[MouseMonitor] Warning: Failed to create CGEventTap for mouse. Accessibility permissions might be missing.", to: &errorStream)
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
        let location = event.location
        
        switch type {
        case .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged:
            let now = Date()
            let pps = targetPps
            let minInterval = 1.0 / Double(pps)
            
            lock.lock()
            let timePassed = now.timeIntervalSince(lastMoveTime)
            if timePassed >= minInterval {
                lastMoveTime = now
                lock.unlock()
                
                let x = Int(location.x)
                let y = Int(location.y)
                let payload = "{\"type\":\"publish\",\"channel\":\"\(channel)\",\"data\":{\"type\":\"mousePosition\",\"data\":{\"x\":\(x),\"y\":\(y)}}} "
                onInputEvent?(payload)
            } else {
                lock.unlock()
            }
            
        case .leftMouseDown, .leftMouseUp, .rightMouseDown, .rightMouseUp, .otherMouseDown, .otherMouseUp:
            let buttonNumber = event.getIntegerValueField(.mouseEventButtonNumber)
            let btnCode = "MB\(buttonNumber + 1)"
            let pressed = (type == .leftMouseDown || type == .rightMouseDown || type == .otherMouseDown)
            let x = Int(location.x)
            let y = Int(location.y)
            let payload = "{\"type\":\"publish\",\"channel\":\"\(channel)\",\"data\":{\"type\":\"mouseClick\",\"data\":{\"button\":\"\(btnCode)\",\"x\":\(x),\"y\":\(y),\"pressed\":\(pressed)}}}"
            onInputEvent?(payload)
            
        case .scrollWheel:
            let dy = event.getDoubleValueField(.scrollWheelEventFixedPtDeltaAxis1)
            let dx = event.getDoubleValueField(.scrollWheelEventFixedPtDeltaAxis2)
            let x = Int(location.x)
            let y = Int(location.y)
            let payload = "{\"type\":\"publish\",\"channel\":\"\(channel)\",\"data\":{\"type\":\"mouseScroll\",\"data\":{\"x\":\(x),\"y\":\(y),\"dx\":\(dx),\"dy\":\(dy)}}}"
            onInputEvent?(payload)
            
        default:
            break
        }
    }
}
