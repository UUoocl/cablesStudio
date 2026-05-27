import Foundation
import CoreGraphics

// Disable stdout/stderr output buffering to ensure logs flush instantly to parent process
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

final class WebSocketClient: @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    private var reconnectTimer: Task<Void, Never>?
    private let onTextMessage: @Sendable (String) -> Void
    
    init(url: URL, onTextMessage: @escaping @Sendable (String) -> Void) {
        self.url = url
        self.onTextMessage = onTextMessage
    }
    
    func connect() {
        lock.lock()
        defer { lock.unlock() }
        
        guard !isConnected else { return }
        let session = URLSession(configuration: .default)
        let task = session.webSocketTask(with: url)
        self.webSocketTask = task
        self.isConnected = true
        task.resume()
        print("🔌 Connecting to local Cables Standalone WebSocket server at \(url.absoluteString)...")
        listenForMessages(task: task)
    }
    
    func disconnect() {
        lock.lock()
        defer { lock.unlock() }
        
        reconnectTimer?.cancel()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        print("🛑 WebSocket disconnected.")
    }
    
    func send(message: String) {
        lock.lock()
        let activeTask = webSocketTask
        let connected = isConnected
        lock.unlock()
        
        guard connected, let task = activeTask else { return }
        let wsMessage = URLSessionWebSocketTask.Message.string(message)
        task.send(wsMessage) { error in
            if let error = error {
                print("❌ WebSocket Send Error: \(error.localizedDescription)")
            }
        }
    }
    
    private func listenForMessages(task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.onTextMessage(text)
                default:
                    break
                }
                self.listenForMessages(task: task)
            case .failure(let error):
                print("⚠️ WebSocket Connection lost/closed: \(error.localizedDescription)")
                self.handleDisconnect()
            }
        }
    }
    
    private func handleDisconnect() {
        lock.lock()
        self.isConnected = false
        self.webSocketTask = nil
        reconnectTimer?.cancel()
        reconnectTimer = Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            guard !Task.isCancelled else { return }
            print("🔄 Attempting automatic reconnection to Cables server...")
            self.connect()
        }
        lock.unlock()
    }
}

final class MouseControllerManager: @unchecked Sendable {
    private let lock = NSLock()
    private weak var wsClient: WebSocketClient?
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
    }
    
    func handleIncomingMessage(_ jsonStr: String) {
        lock.lock()
        defer { lock.unlock() }
        
        guard let data = jsonStr.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String,
              type == "emit" else {
            return
        }
        
        // Resolve Target Position (default to current mouse cursor position)
        let currentPos = CGEvent(source: nil)?.location ?? CGPoint.zero
        var targetX = currentPos.x
        var targetY = currentPos.y
        
        if let xVal = json["x"] as? Double { targetX = CGFloat(xVal) }
        if let yVal = json["y"] as? Double { targetY = CGFloat(yVal) }
        
        let targetPos = CGPoint(x: targetX, y: targetY)
        
        // Extract mouse buttons and action types
        let buttonStr = (json["button"] as? String)?.lowercased() ?? ""
        let actionStr = (json["action"] as? String)?.lowercased() ?? ""
        
        // Extract scrolls
        var sX = 0.0
        var sY = 0.0
        if let scrollXVal = json["scrollX"] as? Double { sX = scrollXVal }
        if let scrollYVal = json["scrollY"] as? Double { sY = scrollYVal }
        
        // 1. Synthesize Scrolling if scroll is requested
        if sX != 0.0 || sY != 0.0 {
            // Association line represents scrolling by lines. wheelCount: 2 handles vert (wheel1) and horiz (wheel2)
            guard let scrollEvent = CGEvent(scrollWheelEvent2Source: nil, units: CGScrollEventUnit.line, wheelCount: 2, wheel1: Int32(sY), wheel2: Int32(sX), wheel3: 0) else {
                sendErrorResponse(message: "Failed to create CGEvent scrollWheelEvent2")
                return
            }
            scrollEvent.post(tap: CGEventTapLocation.cghidEventTap)
            print("🖱️ Emitted Scroll - Vertical: \(sY), Horizontal: \(sX)")
        }
        
        // 2. Synthesize Mouse Movement, Clicks or Presses
        if !actionStr.isEmpty || json["x"] != nil || json["y"] != nil {
            let cgBtn: CGMouseButton
            let downType: CGEventType
            let upType: CGEventType
            let dragType: CGEventType
            
            if buttonStr == "right" {
                cgBtn = .right
                downType = .rightMouseDown
                upType = .rightMouseUp
                dragType = .rightMouseDragged
            } else if buttonStr == "middle" {
                cgBtn = .center
                downType = .otherMouseDown
                upType = .otherMouseUp
                dragType = .otherMouseDragged
            } else {
                cgBtn = .left
                downType = .leftMouseDown
                upType = .leftMouseUp
                dragType = .leftMouseDragged
            }
            
            switch actionStr {
            case "down":
                guard let event = CGEvent(mouseEventSource: nil, mouseType: downType, mouseCursorPosition: targetPos, mouseButton: cgBtn) else {
                    sendErrorResponse(message: "Failed to create CGEvent down")
                    return
                }
                event.post(tap: .cghidEventTap)
                print("🖱️ Emitted Mouse Down: Button \(buttonStr) at \(targetPos)")
                
            case "up":
                guard let event = CGEvent(mouseEventSource: nil, mouseType: upType, mouseCursorPosition: targetPos, mouseButton: cgBtn) else {
                    sendErrorResponse(message: "Failed to create CGEvent up")
                    return
                }
                event.post(tap: .cghidEventTap)
                print("🖱️ Emitted Mouse Up: Button \(buttonStr) at \(targetPos)")
                
            case "click":
                guard let downEvent = CGEvent(mouseEventSource: nil, mouseType: downType, mouseCursorPosition: targetPos, mouseButton: cgBtn),
                      let upEvent = CGEvent(mouseEventSource: nil, mouseType: upType, mouseCursorPosition: targetPos, mouseButton: cgBtn) else {
                    sendErrorResponse(message: "Failed to create CGEvent click pair")
                    return
                }
                downEvent.post(tap: .cghidEventTap)
                usleep(10000) // 10ms click hold down delay
                upEvent.post(tap: .cghidEventTap)
                print("🖱️ Emitted Mouse Click: Button \(buttonStr) at \(targetPos)")
                
            case "drag":
                guard let event = CGEvent(mouseEventSource: nil, mouseType: dragType, mouseCursorPosition: targetPos, mouseButton: cgBtn) else {
                    sendErrorResponse(message: "Failed to create CGEvent drag")
                    return
                }
                event.post(tap: .cghidEventTap)
                print("🖱️ Emitted Mouse Drag: Button \(buttonStr) to \(targetPos)")
                
            case "move":
                guard let event = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: targetPos, mouseButton: .left) else {
                    sendErrorResponse(message: "Failed to create CGEvent move")
                    return
                }
                event.post(tap: .cghidEventTap)
                print("🖱️ Emitted Mouse Move: \(targetPos)")
                
            default:
                // If action is empty but x/y coords were supplied, perform simple warp/move
                if json["x"] != nil || json["y"] != nil {
                    guard let event = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: targetPos, mouseButton: .left) else {
                        sendErrorResponse(message: "Failed to create CGEvent warp move")
                        return
                    }
                    event.post(tap: .cghidEventTap)
                    print("🖱️ Emitted Mouse Warp Move: \(targetPos)")
                }
            }
        }
        
        // Send success back to JS
        var emittedObj: [String: Any] = [
            "x": targetPos.x,
            "y": targetPos.y
        ]
        if !buttonStr.isEmpty { emittedObj["button"] = buttonStr }
        if !actionStr.isEmpty { emittedObj["action"] = actionStr }
        if sX != 0.0 { emittedObj["scrollX"] = sX }
        if sY != 0.0 { emittedObj["scrollY"] = sY }
        
        let response: [String: Any] = [
            "type": "emitted",
            "status": "success",
            "emitted": emittedObj
        ]
        
        if let respData = try? JSONSerialization.data(withJSONObject: response),
           let respStr = String(data: respData, encoding: .utf8) {
            wsClient?.send(message: respStr)
        }
    }
    
    private func sendErrorResponse(message: String) {
        let response: [String: Any] = [
            "type": "emitted",
            "status": "error",
            "message": message
        ]
        if let respData = try? JSONSerialization.data(withJSONObject: response),
           let respStr = String(data: respData, encoding: .utf8) {
            wsClient?.send(message: respStr)
        }
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var controllerManager: MouseControllerManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onTextMessage: { [weak self] textMessage in
            self?.controllerManager?.handleIncomingMessage(textMessage)
        })
        
        self.wsClient = ws
        self.controllerManager = MouseControllerManager(wsClient: ws)
        ws.connect()
    }
}

// ----------------------------------------------------
// Executable Entry Point
// ----------------------------------------------------

let arguments = CommandLine.arguments
var host = "127.0.0.1"
var port = 8080

var i = 1
while i < arguments.count {
    if arguments[i] == "--host" || arguments[i] == "-h", i + 1 < arguments.count {
        host = arguments[i + 1]
        i += 1
    } else if arguments[i] == "--port" || arguments[i] == "-p", i + 1 < arguments.count {
        if let parsedPort = Int(arguments[i + 1]) {
            port = parsedPort
        }
        i += 1
    }
    i += 1
}

// 1. Initialize and Start Session
let session = Session()
session.start(host: host, port: port)

// 2. Parent Lifecycle Tracking (Prevent Orphan Processes)
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

print("💡 Activating Swift Mouse Controller sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
