import Foundation
import UVCControllerCore

// Disable stdout/stderr output buffering to ensure logs flush instantly to parent process
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

// --- WebSocket Client Interface ---
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
        print("[SwiftUvcGetDevices Daemon] Connecting to WebSocket server at \(url.absoluteString)...")
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
        print("[SwiftUvcGetDevices Daemon] WebSocket disconnected.")
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
                print("[SwiftUvcGetDevices Daemon] WebSocket Send Error: \(error.localizedDescription)")
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
                print("[SwiftUvcGetDevices Daemon] WebSocket lost connection: \(error.localizedDescription)")
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
            print("[SwiftUvcGetDevices Daemon] Reconnecting to Cables server...")
            self.connect()
        }
        lock.unlock()
    }
}

// --- Devices Manager ---
final class DevicesManager: @unchecked Sendable {
    private weak var wsClient: WebSocketClient?
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
    }
    
    func handleIncomingMessage(_ jsonStr: String) {
        // Run all queries on main thread for safety
        DispatchQueue.main.async { [weak self] in
            self?.processIncomingMessageOnMainThread(jsonStr)
        }
    }
    
    private func processIncomingMessageOnMainThread(_ jsonStr: String) {
        guard let data = jsonStr.data(using: String.Encoding.utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let action = json["type"] as? String else {
            return
        }
        
        if action == "list_devices" {
            print("[SwiftUvcGetDevices Daemon] Received request: list_devices")
            
            // Scan USB and retrieve UVC devices natively using UVCController Core!
            let controllers = UVCController.uvcControllers() as? [UVCController] ?? []
            
            let devArray = controllers.enumerated().map { (index, controller) -> [String: Any] in
                let name = controller.deviceName() ?? "Unknown Camera"
                let vendorId = controller.vendorId()
                let productId = controller.productId()
                let locationId = controller.locationId()
                
                return [
                    "name": name,
                    "index": index,
                    "vendorId": Int(vendorId),
                    "productId": Int(productId),
                    "locationId": Int(locationId)
                ]
            }
            
            let response: [String: Any] = [
                "type": "devices",
                "status": "success",
                "devices": devArray
            ]
            
            if let respData = try? JSONSerialization.data(withJSONObject: response),
               let respStr = String(data: respData, encoding: String.Encoding.utf8) {
                wsClient?.send(message: respStr)
            }
        }
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var devicesManager: DevicesManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onTextMessage: { [weak self] textMessage in
            self?.devicesManager?.handleIncomingMessage(textMessage)
        })
        
        self.wsClient = ws
        self.devicesManager = DevicesManager(wsClient: ws)
        ws.connect()
    }
}

// --- Main CLI Execution ---
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

let session = Session()
session.start(host: host, port: port)

// Prevent orphan processes
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("[SwiftUvcGetDevices Daemon] Parent process exited. Self-terminating...")
            exit(0)
        }
    }
}

print("[SwiftUvcGetDevices Daemon] Sidecar active and listening natively...")

// Run the main GCD queue
dispatchMain()
