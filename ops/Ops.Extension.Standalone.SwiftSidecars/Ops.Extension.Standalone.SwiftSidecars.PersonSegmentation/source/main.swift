import Foundation
import Metal
import CoreVideo
import Vision
import IOSurface

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

final class SegmentationManager: @unchecked Sendable {
    private let wsClient: WebSocketClient
    private let request = VNGeneratePersonSegmentationRequest()
    private let lock = NSLock()
    
    init(wsClient: WebSocketClient, quality: String) {
        self.wsClient = wsClient
        
        switch quality.lowercased() {
        case "accurate":
            self.request.qualityLevel = .accurate
        case "fast":
            self.request.qualityLevel = .fast
        default:
            self.request.qualityLevel = .balanced
        }
        
        self.request.outputPixelFormat = kCVPixelFormatType_OneComponent8
        print("👤 [PersonSegmentation] Initialized with quality level: \(self.request.qualityLevel.rawValue)")
    }
    
    func processIosurfaceFrame(surfaceID: UInt32, width: Int, height: Int) {
        lock.lock()
        defer { lock.unlock() }
        
        guard width > 0, height > 0 else { return }
        
        // 1. Lookup external IOSurface by ID
        guard let surface = IOSurfaceLookup(surfaceID) else {
            print("❌ Failed to lookup input IOSurface by ID: \(surfaceID)")
            return
        }
        
        // 2. Wrap the IOSurface inside a CVPixelBuffer in zero-copy GPU memory
        var unmanagedPixelBuffer: Unmanaged<CVPixelBuffer>? = nil
        let attrs = [
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32RGBA,
            kCVPixelBufferMetalCompatibilityKey: true,
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ] as CFDictionary
        
        let status = CVPixelBufferCreateWithIOSurface(
            kCFAllocatorDefault,
            surface,
            attrs,
            &unmanagedPixelBuffer
        )
        
        guard status == kCVReturnSuccess, let inputBuffer = unmanagedPixelBuffer?.takeRetainedValue() else {
            print("❌ Failed to wrap IOSurface in CVPixelBuffer. Status: \(status)")
            return
        }
        
        // 3. Perform Apple Vision Segmentation
        let handler = VNImageRequestHandler(cvPixelBuffer: inputBuffer, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("❌ Vision segmentation error: \(error.localizedDescription)")
            return
        }
        
        // 4. Retrieve segmentation mask
        guard let result = request.results?.first else {
            print("❌ Vision returned no segmentation results.")
            return
        }
        
        let maskPixelBuffer = result.pixelBuffer
        
        // 5. Extract underlying IOSurfaceRef from the mask CVPixelBuffer
        guard let maskSurfaceUnmanaged = CVPixelBufferGetIOSurface(maskPixelBuffer) else {
            print("❌ Mask CVPixelBuffer is not backed by an IOSurface.")
            return
        }
        
        let maskSurface = maskSurfaceUnmanaged.takeUnretainedValue()
        let maskSurfaceID = IOSurfaceGetID(maskSurface)
        let maskW = CVPixelBufferGetWidth(maskPixelBuffer)
        let maskH = CVPixelBufferGetHeight(maskPixelBuffer)
        
        // 6. Send mask IOSurface ID back to JS
        let notification = "{\"type\":\"mask\",\"id\":\(maskSurfaceID),\"width\":\(maskW),\"height\":\(maskH)}"
        self.wsClient.send(message: notification)
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var segmentationManager: SegmentationManager?
    
    func start(host: String, port: Int, quality: String) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onMessage: { [weak self] jsonStr in
            guard let self = self,
                  let data = jsonStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }
            
            if type == "surface" {
                let idNum = json["id"] as? NSNumber
                let id = idNum?.uint32Value ?? 0
                let width = json["width"] as? Int ?? 0
                let height = json["height"] as? Int ?? 0
                self.segmentationManager?.processIosurfaceFrame(surfaceID: id, width: width, height: height)
            }
        })
        
        self.wsClient = ws
        self.segmentationManager = SegmentationManager(wsClient: ws, quality: quality)
        ws.connect()
    }
}

// ----------------------------------------------------
// Executable Entry Point
// ----------------------------------------------------

let arguments = CommandLine.arguments
var host = "127.0.0.1"
var port = 8080
var quality = "balanced"

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
    } else if arguments[i] == "--quality" || arguments[i] == "-q", i + 1 < arguments.count {
        quality = arguments[i + 1]
        i += 1
    }
    i += 1
}

// 1. Start Session
setbuf(stdout, nil)
setbuf(stderr, nil)

let session = Session()
session.start(host: host, port: port, quality: quality)

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

print("💡 Activating Swift Person Segmentation sidecar process, waiting for events...")

// Run loop keep-alive
dispatchMain()
