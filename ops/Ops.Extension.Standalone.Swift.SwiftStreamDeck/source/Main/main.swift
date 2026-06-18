import Foundation
import Codedeck

struct WSMessage: Codable {
    let action: String
    let device_index: Int?
    let key: Int?
    let image: String?
}

actor WebSocketClient {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private var reconnectTimer: Task<Void, Never>?
    private let engine: StreamDeckEngine
    
    init(url: URL, engine: StreamDeckEngine) {
        self.url = url
        self.engine = engine
    }
    
    func connect() {
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
        reconnectTimer?.cancel()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        print("🛑 WebSocket disconnected.")
    }
    
    func send(message: String) {
        guard isConnected, let task = webSocketTask else { return }
        let wsMessage = URLSessionWebSocketTask.Message.string(message)
        task.send(wsMessage) { error in
            if let error = error {
                print("❌ WebSocket Send Error: \(error.localizedDescription)")
            }
        }
    }
    
    private func handleIncomingText(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        do {
            let msg = try JSONDecoder().decode(WSMessage.self, from: data)
            switch msg.action {
            case "connect":
                let index = msg.device_index ?? 0
                engine.connect(deviceIndex: index)
            case "set_key_image":
                if let key = msg.key, let img = msg.image {
                    engine.setKeyImage(keyIndex: key, base64: img)
                }
            case "set_stretched_image":
                if let img = msg.image {
                    engine.setStretchedImage(base64: img)
                }
            case "close":
                engine.stop()
                exit(0)
            default:
                break
            }
        } catch {
            print("⚠️ Error decoding incoming WS message: \(error.localizedDescription) | Text: \(text.prefix(100))...")
        }
    }
    
    private func listenForMessages(task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    Task { await self.handleIncomingText(text) }
                default:
                    break
                }
                Task { await self.listenForMessages(task: task) }
            case .failure(let error):
                print("⚠️ WebSocket Connection lost/closed: \(error.localizedDescription)")
                Task { await self.handleDisconnect() }
            }
        }
    }
    
    private func handleDisconnect() {
        self.isConnected = false
        self.webSocketTask = nil
        reconnectTimer?.cancel()
        reconnectTimer = Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            guard !Task.isCancelled else { return }
            print("🔄 Attempting automatic reconnection to Cables server...")
            self.connect()
        }
    }
}

// Parse Command Line Arguments
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

let serverUrl = URL(string: "ws://\(host):\(port)/events")!
let engine = StreamDeckEngine()
let wsClient = WebSocketClient(url: serverUrl, engine: engine)

// Hook up engine callbacks to WebSocket client
engine.onConnected = { name, product in
    var cols = 5
    var rows = 3
    if product.keyCount == 6 {
        cols = 3
        rows = 2
    } else if product.keyCount == 8 {
        cols = 4
        rows = 2
    } else if product.keyCount == 32 {
        cols = 8
        rows = 4
    }
    
    let info: [String: Any] = [
        "type": "connected",
        "model": name,
        "keys": product.keyCount,
        "rows": rows,
        "cols": cols,
        "key_width": product.iconSize,
        "key_height": product.iconSize
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: info, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onDisconnected = {
    Task {
        await wsClient.send(message: "{\"type\":\"disconnected\"}")
    }
}

engine.onKeyEvent = { keyIndex, pressed in
    let event: [String: Any] = [
        "type": "key_event",
        "key": keyIndex,
        "pressed": pressed
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: event, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onError = { message in
    let errorMsg: [String: Any] = [
        "type": "error",
        "message": message
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: errorMsg, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

// Start Engine
engine.start()

// Connect WebSocket
await wsClient.connect()

// Check for parent process lifecycle (adopted by launchd (PID 1) when parent dies)
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            engine.stop()
            exit(0)
        }
    }
}

print("💡 Activating SwiftStreamDeck Sidecar Engine...")

defer {
    print("🛑 Terminating SwiftStreamDeck Sidecar...")
    engine.stop()
    Task { await wsClient.disconnect() }
}

// Run loop keep alive
try await Task.sleep(nanoseconds: UInt64.max)
