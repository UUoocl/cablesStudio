import Foundation
import Metal
import CoreGraphics
import IOSurface

typealias ServerInitFunc = @convention(c) (AnyObject, Selector, NSString?, AnyObject, NSDictionary?) -> AnyObject?
typealias PublishFrameTextureFunc = @convention(c) (AnyObject, Selector, AnyObject, AnyObject, NSRect, Bool) -> Void
typealias ServerStopFunc = @convention(c) (AnyObject, Selector) -> Void

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

final class SyphonServerManager: @unchecked Sendable {
    private var currentServer: AnyObject?
    private var currentName: String?
    private let device: MTLDevice
    private let commandQueue: MTLCommandQueue
    private let lock = NSLock()
    
    private var currentSurface: IOSurface?
    private var currentTexture: MTLTexture?
    
    private var serverClass: AnyClass?
    private var publishFunc: (@convention(c) (AnyObject, Selector, AnyObject, AnyObject, NSRect, Bool) -> Void)?
    private var stopFunc: (@convention(c) (AnyObject, Selector) -> Void)?
    
    init(device: MTLDevice) {
        self.device = device
        self.commandQueue = device.makeCommandQueue()!
        
        if let serverClass = NSClassFromString("SyphonMetalServer") {
            self.serverClass = serverClass
            
            if let publishMethod = class_getInstanceMethod(serverClass, Selector(("publishFrameTexture:onCommandBuffer:imageRegion:flipped:"))) {
                self.publishFunc = unsafeBitCast(method_getImplementation(publishMethod), to: PublishFrameTextureFunc.self)
            }
            
            if let stopMethod = class_getInstanceMethod(serverClass, Selector(("stop"))) {
                self.stopFunc = unsafeBitCast(method_getImplementation(stopMethod), to: ServerStopFunc.self)
            }
        }
    }
    
    func registerSurface(id: UInt32, width: Int, height: Int) {
        lock.lock()
        defer { lock.unlock() }
        
        print("🔗 Registering IOSurface ID: \(id), dimensions: \(width)x\(height)")
        
        guard let surface = IOSurfaceLookup(IOSurfaceID(id)) else {
            print("❌ Failed to lookup IOSurface by ID: \(id)")
            return
        }
        
        self.currentSurface = surface
        
        // Bind the IOSurface directly to a Metal texture in a zero-copy GPU operation
        let descriptor = MTLTextureDescriptor.texture2DDescriptor(
            pixelFormat: .rgba8Unorm, // Match kCVPixelFormatType_32RGBA
            width: width,
            height: height,
            mipmapped: false
        )
        descriptor.usage = [.shaderRead, .shaderWrite]
        
        guard let texture = device.makeTexture(descriptor: descriptor, iosurface: surface, plane: 0) else {
            print("❌ Failed to bind IOSurface to Metal texture.")
            return
        }
        
        self.currentTexture = texture
        print("✅ Bound IOSurface to Metal texture successfully.")
    }
    
    func updateServer(name: String) {
        lock.lock()
        defer { lock.unlock() }
        
        if currentServer != nil && currentName == name {
            return
        }
        
        if let server = currentServer, let stop = stopFunc {
            stop(server, Selector(("stop")))
            currentServer = nil
            print("Stopped previous Syphon server.")
        }
        
        guard let serverClass = serverClass else {
            print("SyphonMetalServer class not loaded.")
            return
        }
        
        guard let method = class_getInstanceMethod(serverClass, Selector(("initWithName:device:options:"))) else {
            print("Could not find initWithName:device:options: method.")
            return
        }
        
        let initFunc = unsafeBitCast(method_getImplementation(method), to: ServerInitFunc.self)
        let allocatedServer = serverClass.alloc()
        
        guard let server = initFunc(allocatedServer, Selector(("initWithName:device:options:")), name as NSString, self.device, nil) else {
            print("Failed to initialize SyphonMetalServer.")
            return
        }
        
        self.currentServer = server
        self.currentName = name
        print("🚀 Successfully started Syphon server: \(name)")
    }
    
    func publishCurrentFrame() {
        lock.lock()
        let texture = currentTexture
        let server = currentServer
        let publish = publishFunc
        lock.unlock()
        
        guard let texture = texture, let server = server, let publish = publish else { return }
        
        guard let commandBuffer = commandQueue.makeCommandBuffer() else {
            print("❌ Failed to create MTLCommandBuffer.")
            return
        }
        
        let rect = NSRect(x: 0, y: 0, width: CGFloat(texture.width), height: CGFloat(texture.height))
        publish(server, Selector(("publishFrameTexture:onCommandBuffer:imageRegion:flipped:")), texture, commandBuffer, rect, true)
        commandBuffer.commit()
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var serverManager: SyphonServerManager?
    
    func start(host: String, port: Int, device: MTLDevice) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        self.serverManager = SyphonServerManager(device: device)
        
        let ws = WebSocketClient(url: serverUrl, onMessage: { [weak self] jsonStr in
            guard let self = self,
                  let data = jsonStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }
            
            if type == "serverName" {
                let name = json["name"] as? String ?? "Cables_Output"
                self.serverManager?.updateServer(name: name)
            } else if type == "surface" {
                let id = json["id"] as? UInt32 ?? 0
                let width = json["width"] as? Int ?? 0
                let height = json["height"] as? Int ?? 0
                self.serverManager?.registerSurface(id: id, width: width, height: height)
            } else if type == "frame" {
                self.serverManager?.publishCurrentFrame()
            }
        })
        
        self.wsClient = ws
        ws.connect()
    }
}

func loadSyphonFramework() -> Bool {
    let parentDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
    
    let paths = [
        parentDir.appendingPathComponent("Frameworks/Syphon.framework").path,
        parentDir.appendingPathComponent("../Frameworks/Syphon.framework").path,
        "/Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SyphonIn/node_modules/node-syphon/dist/Frameworks/Syphon.framework",
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

guard loadSyphonFramework() else {
    print("❌ Failed to load Syphon.framework from any standard search path.")
    exit(1)
}

guard let device = MTLCreateSystemDefaultDevice() else {
    print("❌ Failed to create system default Metal Device.")
    exit(1)
}

let session = Session()
session.start(host: host, port: port, device: device)

Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

print("💡 Activating Swift Syphon Server sidecar process, waiting for events...")

try await Task.sleep(nanoseconds: UInt64.max)
