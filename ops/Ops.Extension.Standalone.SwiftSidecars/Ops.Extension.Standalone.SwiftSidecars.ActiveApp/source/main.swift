import AppKit
import Foundation

final class WebSocketClient: @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    private var reconnectTimer: Timer?
    private let onMessage: @Sendable (String) -> Void
    
    init(url: URL, onMessage: @escaping @Sendable (String) -> Void) {
        self.url = url
        self.onMessage = onMessage
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
        
        reconnectTimer?.invalidate()
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
                    self.onMessage(text)
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
        reconnectTimer?.invalidate()
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.reconnectTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: false) { [weak self] _ in
                print("🔄 Attempting automatic reconnection to Cables server...")
                self?.connect()
            }
        }
        lock.unlock()
    }
}

// ----------------------------------------------------
// Global Monitor State
// ----------------------------------------------------
var wsClient: WebSocketClient?
var intervalMs: Int = 500
var lastPID: pid_t = 0
var lastTitle: String = ""

func getActiveWindowTitle(forPID pid: pid_t) -> String? {
    // Get info of all on-screen windows (excluding desktop elements)
    guard let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else {
        return nil
    }
    
    // Find the first window owned by the active application PID, at layer 0 (normal windows)
    for window in windowList {
        guard let windowOwnerPID = window[kCGWindowOwnerPID as String] as? pid_t,
              windowOwnerPID == pid,
              let windowLayer = window[kCGWindowLayer as String] as? Int,
              windowLayer == 0,
              let windowName = window[kCGWindowName as String] as? String,
              !windowName.isEmpty else {
            continue
        }
        return windowName
    }
    return nil
}

@MainActor
func checkActiveApp() {
    // Prevent orphan process when parent exits (Adopted by init with PID 1)
    if getppid() == 1 {
        print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
        exit(0)
    }
    
    guard let frontmostApp = NSWorkspace.shared.frontmostApplication else { return }
    let pid = frontmostApp.processIdentifier
    let name = frontmostApp.localizedName ?? "Unknown"
    let bundleId = frontmostApp.bundleIdentifier ?? ""
    let title = getActiveWindowTitle(forPID: pid) ?? ""
    
    if pid != lastPID || title != lastTitle {
        lastPID = pid
        lastTitle = title
        
        let payload: [String: Any] = [
            "type": "activeApp",
            "name": name,
            "bundleId": bundleId,
            "pid": pid,
            "windowTitle": title
        ]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: payload),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            wsClient?.send(message: jsonString)
        }
    }
}

// ----------------------------------------------------
// Command Line Arguments Parsing & Setup
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
    } else if arguments[i] == "--interval" || arguments[i] == "-t", i + 1 < arguments.count {
        if let parsedInterval = Int(arguments[i + 1]) {
            intervalMs = parsedInterval
        }
        i += 1
    }
    i += 1
}

let serverUrl = URL(string: "ws://\(host):\(port)")!
wsClient = WebSocketClient(url: serverUrl, onMessage: { _ in })
wsClient?.connect()

// Schedule recurring poll timer on the Main RunLoop
let timer = Timer.scheduledTimer(withTimeInterval: Double(intervalMs) / 1000.0, repeats: true) { _ in
    DispatchQueue.main.async {
        checkActiveApp()
    }
}


print("💡 Activating Swift Active App Monitor sidecar process (CablesActiveAppMonitor), polling every \(intervalMs)ms...")
RunLoop.main.run()
