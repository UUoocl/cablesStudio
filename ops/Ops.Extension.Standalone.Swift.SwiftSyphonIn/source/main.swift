import Foundation
import Metal

typealias SharedDirectoryFunc = @convention(c) (AnyClass, Selector) -> AnyObject
typealias ServersFunc = @convention(c) (AnyObject, Selector) -> NSArray
typealias InitFunc = @convention(c) (AnyObject, Selector, NSDictionary, AnyObject, NSDictionary?, @convention(block) (AnyObject) -> Void) -> AnyObject?
typealias NewFrameImageFunc = @convention(c) (AnyObject, Selector) -> MTLTexture?
typealias StopFunc = @convention(c) (AnyObject, Selector) -> Void

final class WebSocketClient: @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    private var reconnectTimer: Task<Void, Never>?
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
    
    func send(data: Data) {
        lock.lock()
        let activeTask = webSocketTask
        let connected = isConnected
        lock.unlock()
        
        guard connected, let task = activeTask else { return }
        let wsMessage = URLSessionWebSocketTask.Message.data(data)
        task.send(wsMessage) { error in
            if let error = error {
                print("❌ WebSocket Send Data Error: \(error.localizedDescription)")
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

final class SyphonManager: @unchecked Sendable {
    private var currentClient: AnyObject?
    private let device: MTLDevice
    private let wsClient: WebSocketClient
    private let lock = NSLock()
    private var tempFilePath: String = ""
    
    private var clientClass: AnyClass?
    private var newFrameImageFunc: (@convention(c) (AnyObject, Selector) -> MTLTexture?)?
    private var stopFunc: (@convention(c) (AnyObject, Selector) -> Void)?
    
    init(device: MTLDevice, wsClient: WebSocketClient, port: Int) {
        self.device = device
        self.wsClient = wsClient
        
        let fm = FileManager.default
        let ramDiskPath = "/Volumes/CablesRAMDisk"
        if fm.fileExists(atPath: ramDiskPath) {
            self.tempFilePath = "\(ramDiskPath)/syphon_in_\(port).raw"
        } else {
            self.tempFilePath = "\(NSTemporaryDirectory())syphon_in_\(port).raw"
        }
        print("📁 Using shared frame file: \(self.tempFilePath)")
        
        if let clientClass = NSClassFromString("SyphonMetalClient") {
            self.clientClass = clientClass
            
            if let newFrameImageMethod = class_getInstanceMethod(clientClass, Selector(("newFrameImage"))) {
                self.newFrameImageFunc = unsafeBitCast(method_getImplementation(newFrameImageMethod), to: NewFrameImageFunc.self)
            }
            if let stopMethod = class_getInstanceMethod(clientClass, Selector(("stop"))) {
                self.stopFunc = unsafeBitCast(method_getImplementation(stopMethod), to: StopFunc.self)
            }
        }
    }
    
    func selectServer(name: String?, appName: String?) {
        lock.lock()
        defer { lock.unlock() }
        
        // Stop current client if any
        if let client = currentClient, let stop = stopFunc {
            stop(client, Selector(("stop")))
            currentClient = nil
            print("Disconnected from previous Syphon server.")
        }
        
        guard let name = name, name != "None" else {
            print("Selected None.")
            return
        }
        
        print("Selecting Syphon server: \(name) (\(appName ?? "Unknown App"))")
        
        guard let clientClass = clientClass else {
            print("SyphonMetalClient class is not loaded.")
            return
        }
        
        // Find matching server description in SyphonServerDirectory
        guard let serverDesc = findServer(name: name, appName: appName) else {
            print("Could not find matching server: \(name)")
            return
        }
        
        guard let method = class_getInstanceMethod(clientClass, Selector(("initWithServerDescription:device:options:newFrameHandler:"))) else {
            print("Could not find initWithServerDescription:device:options:newFrameHandler: method.")
            return
        }
        
        let initFunc = unsafeBitCast(method_getImplementation(method), to: InitFunc.self)
        let allocatedClient = clientClass.alloc()
        
        // Setup handler to stream frames
        let handler: @convention(block) (AnyObject) -> Void = { [weak self] client in
            self?.streamFrame(client: client)
        }
        
        guard let client = initFunc(allocatedClient, Selector(("initWithServerDescription:device:options:newFrameHandler:")), serverDesc, self.device, nil, handler) else {
            print("Failed to initialize SyphonMetalClient.")
            return
        }
        
        self.currentClient = client
        print("Successfully connected to Syphon server: \(name)")
    }
    
    private func streamFrame(client: AnyObject) {
        guard let newFrameImage = newFrameImageFunc,
              let texture = newFrameImage(client, Selector(("newFrameImage"))) else {
            return
        }
        
        let width = texture.width
        let height = texture.height
        
        let bytesPerPixel = 4
        let bytesPerRow = width * bytesPerPixel
        var pixelBytes = [UInt8](repeating: 0, count: width * height * bytesPerPixel)
        let region = MTLRegionMake2D(0, 0, width, height)
        texture.getBytes(&pixelBytes, bytesPerRow: bytesPerRow, from: region, mipmapLevel: 0)
        
        // Convert BGRA to RGBA (WebGL standard)
        for i in stride(from: 0, to: pixelBytes.count, by: 4) {
            let b = pixelBytes[i]
            let r = pixelBytes[i+2]
            pixelBytes[i] = r
            pixelBytes[i+2] = b
        }
        
        // Write raw bytes directly to shared frame file
        let fileUrl = URL(fileURLWithPath: self.tempFilePath)
        do {
            try Data(pixelBytes).write(to: fileUrl)
        } catch {
            print("❌ Failed to write frame to shared file: \(error)")
            return
        }
        
        // Send lightweight text notification
        let notification = "{\"type\":\"frame\",\"width\":\(width),\"height\":\(height)}"
        self.wsClient.send(message: notification)
    }
    
    private func findServer(name: String, appName: String?) -> NSDictionary? {
        guard let directoryClass = NSClassFromString("SyphonServerDirectory") else { return nil }
        
        guard let sharedDirectoryMethod = class_getClassMethod(directoryClass, Selector(("sharedDirectory"))) else { return nil }
        let sharedDirectoryFunc = unsafeBitCast(method_getImplementation(sharedDirectoryMethod), to: SharedDirectoryFunc.self)
        let sharedDirectory = sharedDirectoryFunc(directoryClass, Selector(("sharedDirectory")))
        
        guard let serversMethod = class_getInstanceMethod(directoryClass, Selector(("servers"))) else { return nil }
        let serversFunc = unsafeBitCast(method_getImplementation(serversMethod), to: ServersFunc.self)
        let servers = serversFunc(sharedDirectory, Selector(("servers"))) as! [NSDictionary]
        
        for desc in servers {
            let serverName = desc["SyphonServerDescriptionNameKey"] as? String ?? ""
            let app = desc["SyphonServerDescriptionAppNameKey"] as? String ?? ""
            
            if serverName == name {
                if appName == nil || appName == app {
                    return desc
                }
            }
        }
        return nil
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var syphonManager: SyphonManager?
    
    func start(host: String, port: Int, device: MTLDevice) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl) { [weak self] jsonStr in
            guard let self = self,
                  let data = jsonStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }
            
            if type == "select" {
                let name = json["name"] as? String
                let appName = json["appName"] as? String
                self.syphonManager?.selectServer(name: name, appName: appName)
            }
        }
        
        self.wsClient = ws
        self.syphonManager = SyphonManager(device: device, wsClient: ws, port: port)
        ws.connect()
    }
}

func loadSyphonFramework() -> Bool {
    let parentDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
    
    let paths = [
        parentDir.appendingPathComponent("Frameworks/Syphon.framework").path,
        parentDir.appendingPathComponent("../Frameworks/Syphon.framework").path,
        "/Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.NodeSyphon/Ops.Extension.Standalone.SyphonIn/node_modules/node-syphon/dist/Frameworks/Syphon.framework",
        "/Library/Frameworks/Syphon.framework",
        NSHomeDirectory() + "/Library/Frameworks/Syphon.framework"
    ]
    
    for path in paths {
        if FileManager.default.fileExists(atPath: path) {
            if let bundle = Bundle(path: path), bundle.load() {
                print("✅ Successfully loaded Syphon.framework from \(path)")
                return true
            }
        }
    }
    return false
}

func publishServerList(wsClient: WebSocketClient) {
    guard let directoryClass = NSClassFromString("SyphonServerDirectory") else { return }
    
    guard let sharedDirectoryMethod = class_getClassMethod(directoryClass, Selector(("sharedDirectory"))) else { return }
    let sharedDirectoryFunc = unsafeBitCast(method_getImplementation(sharedDirectoryMethod), to: SharedDirectoryFunc.self)
    let sharedDirectory = sharedDirectoryFunc(directoryClass, Selector(("sharedDirectory")))
    
    guard let serversMethod = class_getInstanceMethod(directoryClass, Selector(("servers"))) else { return }
    let serversFunc = unsafeBitCast(method_getImplementation(serversMethod), to: ServersFunc.self)
    let servers = serversFunc(sharedDirectory, Selector(("servers"))) as! [NSDictionary]
    
    var serversList: [[String: String]] = []
    for desc in servers {
        let name = desc["SyphonServerDescriptionNameKey"] as? String ?? "Unnamed"
        let appName = desc["SyphonServerDescriptionAppNameKey"] as? String ?? "Unknown App"
        let uuid = desc["SyphonServerDescriptionUUIDKey"] as? String ?? ""
        serversList.append([
            "name": name,
            "appName": appName,
            "uuid": uuid
        ])
    }
    
    let payload: [String: Any] = [
        "type": "servers",
        "servers": serversList
    ]
    
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
       let str = String(data: data, encoding: .utf8) {
        wsClient.send(message: str)
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

// 1. Dynamic Framework Loading
guard loadSyphonFramework() else {
    print("❌ Failed to load Syphon.framework from any standard search path.")
    exit(1)
}

// 2. Metal Setup
guard let device = MTLCreateSystemDefaultDevice() else {
    print("❌ Failed to create system default Metal Device.")
    exit(1)
}

// 3. Connect to Private WebSocket via Session
let session = Session()
session.start(host: host, port: port, device: device)

// 4. Periodically publish active Syphon Server Directory updates
Task {
    while true {
        if let ws = session.wsClient {
            publishServerList(wsClient: ws)
        }
        try? await Task.sleep(nanoseconds: 1_500_000_000)
    }
}

// 5. Parent Lifecycle Tracking (Prevent Orphan Processes)
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

print("💡 Activating Swift Syphon Client sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
