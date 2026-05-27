import Foundation
import Metal
import CoreVideo
import Vision

// Disable stdout/stderr output buffering to ensure logs flush instantly to parent process
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

final class WebSocketClient: @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    private var reconnectTimer: Task<Void, Never>?
    private let onBinaryMessage: @Sendable (Data) -> Void
    
    init(url: URL, onBinaryMessage: @escaping @Sendable (Data) -> Void) {
        self.url = url
        self.onBinaryMessage = onBinaryMessage
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
                case .data(let data):
                    self.onBinaryMessage(data)
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

final class FaceManager: @unchecked Sendable {
    private let wsClient: WebSocketClient
    private let request = VNDetectFaceLandmarksRequest()
    private let lock = NSLock()
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
    }
    
    func processFrame(data: Data) {
        lock.lock()
        defer { lock.unlock() }
        
        // Bytes 0-3: width (UInt32 little endian)
        // Bytes 4-7: height (UInt32 little endian)
        // Bytes 8...: raw RGBA pixels
        guard data.count > 8 else { return }
        
        let width = data.subdata(in: 0..<4).withUnsafeBytes { $0.load(as: UInt32.self) }
        let height = data.subdata(in: 4..<8).withUnsafeBytes { $0.load(as: UInt32.self) }
        
        let w = Int(width)
        let h = Int(height)
        
        guard w > 0, h > 0, data.count >= 8 + w * h * 4 else { return }
        
        // 1. Read raw RGBA bytes
        let pixelBytes = [UInt8](data.subdata(in: 8..<8 + w * h * 4))
        
        // 2. Create CVPixelBuffer
        guard let pixelBuffer = createPixelBuffer(width: w, height: h, rgbaBytes: pixelBytes) else {
            print("❌ Failed to create CVPixelBuffer.")
            return
        }
        
        // 3. Perform Apple Vision Face Landmark Request
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("❌ Vision face landmark detection error: \(error.localizedDescription)")
            self.wsClient.send(message: "[]")
            return
        }
        
        // 4. Parse results
        guard let results = request.results else {
            self.wsClient.send(message: "[]")
            return
        }
        
        var facesListJSON: [[String: Any]] = []
        
        for observation in results {
            let box = observation.boundingBox
            
            // Map box to standard top-left screen coordinates
            let boxJSON: [String: Any] = [
                "x": box.origin.x,
                "y": 1.0 - (box.origin.y + box.size.height),
                "w": box.size.width,
                "h": box.size.height
            ]
            
            var landmarksJSON: [String: [[String: Any]]] = [:]
            
            if let landmarks = observation.landmarks {
                let regions: [(String, VNFaceLandmarkRegion2D?)] = [
                    ("faceContour", landmarks.faceContour),
                    ("leftEye", landmarks.leftEye),
                    ("rightEye", landmarks.rightEye),
                    ("leftEyebrow", landmarks.leftEyebrow),
                    ("rightEyebrow", landmarks.rightEyebrow),
                    ("nose", landmarks.nose),
                    ("noseCrest", landmarks.noseCrest),
                    ("medianLine", landmarks.medianLine),
                    ("outerLips", landmarks.outerLips),
                    ("innerLips", landmarks.innerLips),
                    ("leftPupil", landmarks.leftPupil),
                    ("rightPupil", landmarks.rightPupil)
                ]
                
                for (name, region) in regions {
                    guard let region = region else { continue }
                    var pointsJSON: [[String: Any]] = []
                    
                    let points = region.normalizedPoints
                    for p in points {
                        // Map local face-relative normalized points to image-relative coordinates
                        let x = box.origin.x + p.x * box.size.width
                        let y = 1.0 - (box.origin.y + p.y * box.size.height)
                        pointsJSON.append(["x": x, "y": y])
                    }
                    
                    landmarksJSON[name] = pointsJSON
                }
            }
            
            // Extract roll, yaw, pitch orientation
            let roll = observation.roll?.floatValue ?? 0.0
            let yaw = observation.yaw?.floatValue ?? 0.0
            let pitch = observation.pitch?.floatValue ?? 0.0
            
            facesListJSON.append([
                "confidence": observation.confidence,
                "boundingBox": boxJSON,
                "landmarks": landmarksJSON,
                "roll": roll,
                "yaw": yaw,
                "pitch": pitch
            ])
        }
        
        // 5. Serialize face landmarks to JSON and transmit back
        if let jsonData = try? JSONSerialization.data(withJSONObject: facesListJSON, options: []),
           let jsonStr = String(data: jsonData, encoding: .utf8) {
            self.wsClient.send(message: jsonStr)
        } else {
            self.wsClient.send(message: "[]")
        }
    }
    
    private func createPixelBuffer(width: Int, height: Int, rgbaBytes: [UInt8]) -> CVPixelBuffer? {
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
        
        CVPixelBufferLockBaseAddress(buffer, CVPixelBufferLockFlags(rawValue: 0))
        defer { CVPixelBufferUnlockBaseAddress(buffer, CVPixelBufferLockFlags(rawValue: 0)) }
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(buffer) else {
            return nil
        }
        
        let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
        let dstPtr = baseAddress.assumingMemoryBound(to: UInt8.self)
        
        for y in 0..<height {
            let srcRowOffset = y * width * 4
            let dstRowOffset = y * bytesPerRow
            
            for x in 0..<width {
                let srcPixelOffset = srcRowOffset + (x * 4)
                let dstPixelOffset = dstRowOffset + (x * 4)
                
                let r = rgbaBytes[srcPixelOffset]
                let g = rgbaBytes[srcPixelOffset + 1]
                let b = rgbaBytes[srcPixelOffset + 2]
                let a = rgbaBytes[srcPixelOffset + 3]
                
                // Write as BGRA format
                dstPtr[dstPixelOffset] = b
                dstPtr[dstPixelOffset + 1] = g
                dstPtr[dstPixelOffset + 2] = r
                dstPtr[dstPixelOffset + 3] = a
            }
        }
        
        return buffer
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var faceManager: FaceManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onBinaryMessage: { [weak self] binaryData in
            self?.faceManager?.processFrame(data: binaryData)
        })
        
        self.wsClient = ws
        self.faceManager = FaceManager(wsClient: ws)
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

print("💡 Activating Swift Human Face sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
