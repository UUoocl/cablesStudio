import Foundation
import XboxControllerCore

class WebSocketClient: NSObject, @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    
    init(url: URL) {
        self.url = url
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
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        print("🛑 WebSocket disconnected.")
    }
    
    func send(message: String) {
        lock.lock()
        let task = webSocketTask
        let connected = isConnected
        lock.unlock()
        
        guard connected, let task = task else { return }
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
        } else if text.contains("\"type\":\"rumble\"") {
            if let data = text.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let left = (json["left"] as? Double) ?? 0.0
                let right = (json["right"] as? Double) ?? 0.0
                let lt = (json["left_trigger"] as? Double) ?? 0.0
                let rt = (json["right_trigger"] as? Double) ?? 0.0
                
                XboxControllerManager.shared().sendRumbleLeft(
                    Float(left),
                    right: Float(right),
                    leftTrigger: Float(lt),
                    rightTrigger: Float(rt)
                )
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
                    self.handleIncomingText(text)
                default:
                    break
                }
                self.listenForMessages(task: task)
            case .failure(let error):
                print("⚠️ WebSocket Connection lost: \(error.localizedDescription)")
                self.handleDisconnect()
            }
        }
    }
    
    private func handleDisconnect() {
        lock.lock()
        self.isConnected = false
        self.webSocketTask = nil
        lock.unlock()
        
        DispatchQueue.global().asyncAfter(deadline: .now() + 2.0) { [weak self] in
            guard let self = self else { return }
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
let wsClient = WebSocketClient(url: serverUrl)
wsClient.connect()

// Check for parent process termination (adopted by PID 1 when parent dies)
let parentWatcherQueue = DispatchQueue(label: "CablesParentWatcher")
parentWatcherQueue.async {
    while true {
        Thread.sleep(forTimeInterval: 1.0)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

// Setup Controller Manager C Callback
let contextPointer = Unmanaged.passUnretained(wsClient).toOpaque()

let callback: XboxControllerInputCallback = { state, jsonString, context in
    guard let jsonString = jsonString, let context = context else { return }
    let jsonStr = String(cString: jsonString)
    
    let client = Unmanaged<WebSocketClient>.fromOpaque(context).takeUnretainedValue()
    client.send(message: jsonStr)
}

print("💡 Activating IOKit Xbox Controller Manager...")
let manager = XboxControllerManager.shared()!
if manager.start(callback: callback, context: contextPointer) {
    let isConnected = manager.isDeviceConnected()
    let deviceName = isConnected ? "8BitDo Lite SE Xbox Controller" : "8BitDo Lite SE Xbox Controller (Not Connected)"
    let status = isConnected ? "connected" : "searching"
    wsClient.send(message: "{\"type\":\"info\",\"status\":\"\(status)\",\"device\":\"\(deviceName)\"}")
}

// Keep the runloop running for IOKit async reads and async timers
CFRunLoopRun()
