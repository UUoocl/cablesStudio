import Foundation
import Metal
import CoreVideo
import Vision

// Disable stdout/stderr output buffering to ensure logs are immediately visible in Cables Studio console
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

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

final class PoseManager: @unchecked Sendable {
    private let wsClient: WebSocketClient
    private let request = VNDetectHumanBodyPoseRequest()
    private let lock = NSLock()
    private var inFilePath: String = ""
    
    // Cached pixel buffer and size for input frames to avoid per-frame allocations
    private var inputPixelBuffer: CVPixelBuffer?
    private var inputWidth = 0
    private var inputHeight = 0
    
    init(wsClient: WebSocketClient, port: Int) {
        self.wsClient = wsClient
        
        let fm = FileManager.default
        let ramDiskPath = "/Volumes/CablesRAMDisk"
        if fm.fileExists(atPath: ramDiskPath) {
            self.inFilePath = "\(ramDiskPath)/pose2d_in_\(port).raw"
        } else {
            self.inFilePath = "\(NSTemporaryDirectory())pose2d_in_\(port).raw"
        }
        print("📁 Using shared file path: \(self.inFilePath)")
    }
    
    private func preparePixelBuffer(width: Int, height: Int) -> CVPixelBuffer? {
        if let buffer = inputPixelBuffer, inputWidth == width, inputHeight == height {
            return buffer
        }
        
        // Clean up old one
        inputPixelBuffer = nil
        
        var pixelBuffer: CVPixelBuffer? = nil
        let attrs = [
            kCVPixelBufferMetalCompatibilityKey: true,
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ] as CFDictionary
        
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32BGRA,
            attrs,
            &pixelBuffer
        )
        
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
            return nil
        }
        
        inputPixelBuffer = buffer
        inputWidth = width
        inputHeight = height
        return buffer
    }
    
    func processFrame(
        width w: Int,
        height h: Int,
        minConfidence: Float,
        roiX: Float,
        roiY: Float,
        roiWidth: Float,
        roiHeight: Float
    ) {
        lock.lock()
        defer { lock.unlock() }
        
        guard w > 0, h > 0 else { return }
        
        // Read input raw RGBA bytes from shared file
        let fileUrl = URL(fileURLWithPath: self.inFilePath)
        guard let data = try? Data(contentsOf: fileUrl) else {
            print("❌ Failed to read frame from shared file: \(self.inFilePath)")
            return
        }
        
        guard data.count >= w * h * 4 else { return }
        
        // 1. Prepare or reuse cached CVPixelBuffer
        guard let pixelBuffer = preparePixelBuffer(width: w, height: h) else {
            print("❌ Failed to create/prepare CVPixelBuffer.")
            return
        }
        
        // 2. Lock base address and copy raw bytes from incoming Data directly into the CVPixelBuffer base address (converting RGBA to BGRA)
        CVPixelBufferLockBaseAddress(pixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
        
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        if let dstBaseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) {
            let dstPtr = dstBaseAddress.assumingMemoryBound(to: UInt8.self)
            
            data.withUnsafeBytes { rawBuffer in
                guard let srcBaseAddress = rawBuffer.baseAddress else { return }
                let srcPtr = srcBaseAddress.assumingMemoryBound(to: UInt8.self)
                
                for y in 0..<h {
                    let srcRowPtr = srcPtr + (y * w * 4)
                    let dstRowPtr = dstPtr + (y * bytesPerRow)
                    
                    for x in 0..<w {
                        let pixelIdx = x * 4
                        let r = srcRowPtr[pixelIdx]
                        let g = srcRowPtr[pixelIdx + 1]
                        let b = srcRowPtr[pixelIdx + 2]
                        let a = srcRowPtr[pixelIdx + 3]
                        
                        // Convert RGBA to BGRA in-place
                        dstRowPtr[pixelIdx] = b
                        dstRowPtr[pixelIdx + 1] = g
                        dstRowPtr[pixelIdx + 2] = r
                        dstRowPtr[pixelIdx + 3] = a
                    }
                }
            }
        }
        CVPixelBufferUnlockBaseAddress(pixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
        
        // 3. Configure Region of Interest (ROI) dynamically on request
        // In Vision's coordinate system, origin is bottom-left, y increases upwards.
        // We flip Cables' top-left y coordinate space to Vision's bottom-left space:
        let visionY = 1.0 - roiY - roiHeight
        self.request.regionOfInterest = CGRect(
            x: CGFloat(roiX),
            y: CGFloat(visionY),
            width: CGFloat(roiWidth),
            height: CGFloat(roiHeight)
        )
        
        // 4. Perform Apple Vision 2D Human Pose Landmark Request
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("❌ Vision pose detection error: \(error.localizedDescription)")
            self.wsClient.send(message: "[]")
            return
        }
        
        // 5. Parse detected poses
        guard let results = request.results else {
            self.wsClient.send(message: "[]")
            return
        }
        
        var posesListJSON: [[String: Any]] = []
        
        for observation in results {
            var jointsJSON: [String: [String: Any]] = [:]
            
            // Query all recognized joint landmarks in the pose
            guard let recognizedPoints = try? observation.recognizedPoints(.all) else { continue }
            
            for (jointName, recognizedPoint) in recognizedPoints {
                // Ignore keypoints lower than the dynamic confidence threshold
                guard recognizedPoint.confidence > minConfidence else { continue }
                
                // jointName.rawValue.rawValue returns string key (e.g. "nose_joint")
                let cleanName = jointName.rawValue.rawValue
                
                // Map coordinates. In Vision's coordinate system, y is normalized from bottom-left.
                // We invert y to map to standard top-left screen Cartesian coordinates used in WebGL/JS:
                let x = recognizedPoint.x
                let y = 1.0 - recognizedPoint.y
                
                jointsJSON[cleanName] = [
                    "x": x,
                    "y": y,
                    "confidence": recognizedPoint.confidence
                ]
            }
            
            posesListJSON.append([
                "confidence": observation.confidence,
                "joints": jointsJSON
            ])
        }
        
        // 6. Serialize pose joints to JSON and transmit back
        if let jsonData = try? JSONSerialization.data(withJSONObject: posesListJSON, options: []),
           let jsonStr = String(data: jsonData, encoding: .utf8) {
            self.wsClient.send(message: jsonStr)
        } else {
            self.wsClient.send(message: "[]")
        }
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var poseManager: PoseManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onMessage: { [weak self] jsonStr in
            guard let self = self,
                  let data = jsonStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }
            
            if type == "frame" {
                let width = json["width"] as? Int ?? 0
                let height = json["height"] as? Int ?? 0
                let minConfidence = (json["minConfidence"] as? NSNumber)?.floatValue ?? 0.1
                let roiX = (json["roiX"] as? NSNumber)?.floatValue ?? 0.0
                let roiY = (json["roiY"] as? NSNumber)?.floatValue ?? 0.0
                let roiWidth = (json["roiWidth"] as? NSNumber)?.floatValue ?? 1.0
                let roiHeight = (json["roiHeight"] as? NSNumber)?.floatValue ?? 1.0
                
                self.poseManager?.processFrame(
                    width: width,
                    height: height,
                    minConfidence: minConfidence,
                    roiX: roiX,
                    roiY: roiY,
                    roiWidth: roiWidth,
                    roiHeight: roiHeight
                )
            }
        })
        
        self.wsClient = ws
        self.poseManager = PoseManager(wsClient: ws, port: port)
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

print("💡 Activating Swift Human Pose 2D sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
