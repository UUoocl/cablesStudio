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

// Global key to CGKeyCode map
let keyToKeyCode: [String: CGKeyCode] = [
    "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9,
    "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "y": 16, "t": 17, "1": 18, "2": 19,
    "3": 20, "4": 21, "6": 22, "5": 23, "=": 24, "9": 25, "7": 26, "-": 27, "8": 28,
    "0": 29, "]": 30, "o": 31, "u": 32, "[": 33, "i": 34, "p": 35, "return": 36, "l": 37,
    "j": 38, "'": 39, "k": 40, ";": 41, "\\": 42, ",": 43, "/": 44, "n": 45, "m": 46,
    ".": 47, "tab": 48, "space": 49, "`": 50, "delete": 51, "enter": 76, "escape": 53, "esc": 53,
    "f17": 64, "clear": 71,
    "f18": 79, "f19": 80, "f20": 90, "f5": 96, "f6": 97, "f7": 98, "f3": 99,
    "f8": 100, "f9": 101, "f11": 103, "f13": 105, "f16": 106, "f14": 107, "f10": 109,
    "f12": 111, "f15": 113, "home": 115, "pageup": 116, "pgup": 116, "end": 119,
    "f4": 118, "f2": 120, "pagedown": 121, "pgdn": 121, "f1": 122, "left": 123, "right": 124, "down": 125, "up": 126
]

func parseModifiers(_ modifierStr: String) -> CGEventFlags {
    var flags = CGEventFlags()
    let lowerStr = modifierStr.lowercased()
    
    if lowerStr.contains("cmd") || lowerStr.contains("command") || lowerStr.contains("⌘") {
        flags.insert(.maskCommand)
    }
    if lowerStr.contains("shift") || lowerStr.contains("⇧") {
        flags.insert(.maskShift)
    }
    if lowerStr.contains("alt") || lowerStr.contains("option") || lowerStr.contains("⌥") || lowerStr.contains("opt") {
        flags.insert(.maskAlternate)
    }
    if lowerStr.contains("ctrl") || lowerStr.contains("control") || lowerStr.contains("⌃") {
        flags.insert(.maskControl)
    }
    
    return flags
}

final class KeyboardControllerManager: @unchecked Sendable {
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
        
        let key = json["key"] as? String ?? ""
        let modifiers = json["modifiers"] as? String ?? ""
        
        let normalizedKey = key.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard let keyCode = keyToKeyCode[normalizedKey] else {
            print("❌ Unknown key: '\(key)'")
            sendErrorResponse(message: "Unknown key: '\(key)'")
            return
        }
        
        let flags = parseModifiers(modifiers)
        
        print("⌨️ Emitting virtual keystroke globally: Key \(normalizedKey) (code \(keyCode)) with modifiers: '\(modifiers)'")
        
        // Synthesize virtual keystroke
        let source = CGEventSource(stateID: .combinedSessionState)
        
        guard let keyDown = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: true) else {
            sendErrorResponse(message: "Failed to create CGEvent keyDown")
            return
        }
        keyDown.flags = flags
        keyDown.post(tap: .cghidEventTap)
        
        guard let keyUp = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: false) else {
            sendErrorResponse(message: "Failed to create CGEvent keyUp")
            return
        }
        keyUp.flags = flags
        keyUp.post(tap: .cghidEventTap)
        
        // Format the emitted combination beautifully for Cables output
        var emittedParts: [String] = []
        let lowerMods = modifiers.lowercased()
        if lowerMods.contains("ctrl") || lowerMods.contains("control") { emittedParts.append("ctrl") }
        if lowerMods.contains("alt") || lowerMods.contains("option") || lowerMods.contains("opt") { emittedParts.append("alt") }
        if lowerMods.contains("shift") { emittedParts.append("shift") }
        if lowerMods.contains("cmd") || lowerMods.contains("command") { emittedParts.append("cmd") }
        emittedParts.append(normalizedKey)
        
        let comboStr = emittedParts.joined(separator: " + ")
        
        let response: [String: Any] = [
            "type": "emitted",
            "status": "success",
            "combo": comboStr
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
    var controllerManager: KeyboardControllerManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onTextMessage: { [weak self] textMessage in
            self?.controllerManager?.handleIncomingMessage(textMessage)
        })
        
        self.wsClient = ws
        self.controllerManager = KeyboardControllerManager(wsClient: ws)
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

print("💡 Activating Swift Keyboard Controller sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
