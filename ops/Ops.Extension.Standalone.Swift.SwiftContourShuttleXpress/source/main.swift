import Foundation

actor WebSocketClient {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private var reconnectTimer: Task<Void, Never>?
    
    init(url: URL) {
        self.url = url
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
        if text.contains("setInfo") {
            self.send(message: "{\"type\":\"response\",\"data\":{\"status\":\"authenticated\"}}")
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
let wsClient = WebSocketClient(url: serverUrl)
await wsClient.connect()

let monitor = ShuttleMonitor()

monitor.onInputEvent = { @Sendable json in
    Task {
        await wsClient.send(message: json)
    }
}

// Check for parent process lifecycle (adopted by launchd (PID 1) when parent dies)
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

print("💡 Activating IOHIDManager ShuttleXpress Monitor...")
if monitor.start() {
    // Check if device is connected right away
    let isConnected = monitor.isDeviceConnected()
    let deviceName = isConnected ? "Contour ShuttleXpress" : "Contour ShuttleXpress (Not Connected)"
    let status = isConnected ? "connected" : "searching"
    
    Task {
        await wsClient.send(message: "{\"type\":\"info\",\"status\":\"\(status)\",\"device\":\"\(deviceName)\"}")
    }
}

defer {
    print("🛑 Terminating IOHIDManager ShuttleXpress Monitor...")
    monitor.stop()
    Task { await wsClient.disconnect() }
}

try await Task.sleep(nanoseconds: UInt64.max)
