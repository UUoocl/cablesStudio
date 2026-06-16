import Foundation
import Metal
import CoreVideo
import Vision

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
    
    private var inFilePath: String = ""
    private var outFilePath: String = ""
    
    // Cached pixel buffer and size for input frames
    private var inputPixelBuffer: CVPixelBuffer?
    private var inputWidth = 0
    private var inputHeight = 0
    
    // Cached output Data buffer
    private var outputData = Data()
    
    init(wsClient: WebSocketClient, quality: String, port: Int) {
        self.wsClient = wsClient
        
        let fm = FileManager.default
        let ramDiskPath = "/Volumes/CablesRAMDisk"
        if fm.fileExists(atPath: ramDiskPath) {
            self.inFilePath = "\(ramDiskPath)/seg_in_\(port).raw"
            self.outFilePath = "\(ramDiskPath)/seg_out_\(port).raw"
        } else {
            self.inFilePath = "\(NSTemporaryDirectory())seg_in_\(port).raw"
            self.outFilePath = "\(NSTemporaryDirectory())seg_out_\(port).raw"
        }
        print("📁 Using shared files:\n  In: \(self.inFilePath)\n  Out: \(self.outFilePath)")
        
        switch quality.lowercased() {
        case "accurate":
            self.request.qualityLevel = .accurate
        case "fast":
            self.request.qualityLevel = .fast
        default:
            self.request.qualityLevel = .balanced
        }
        
        self.request.outputPixelFormat = kCVPixelFormatType_OneComponent8
        print("👤 [SwiftPersonSegmentation] Initialized with quality level: \(self.request.qualityLevel.rawValue)")
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
    
    func processFrame(width: Int, height: Int) {
        lock.lock()
        defer { lock.unlock() }
        
        guard width > 0, height > 0 else { return }
        
        // Read input raw RGBA bytes from shared file
        let fileUrl = URL(fileURLWithPath: self.inFilePath)
        guard let data = try? Data(contentsOf: fileUrl) else {
            print("❌ Failed to read frame from shared file: \(self.inFilePath)")
            return
        }
        
        guard data.count >= width * height * 4 else { return }
        
        // Prepare or reuse cached input CVPixelBuffer
        guard let pixelBuffer = preparePixelBuffer(width: width, height: height) else {
            print("❌ Failed to create/prepare CVPixelBuffer.")
            return
        }
        
        // Lock and copy raw bytes from incoming Data directly into the CVPixelBuffer base address
        CVPixelBufferLockBaseAddress(pixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
        
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        if let dstBaseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) {
            let dstPtr = dstBaseAddress.assumingMemoryBound(to: UInt8.self)
            
            data.withUnsafeBytes { rawBuffer in
                guard let srcPtr = rawBuffer.baseAddress?.assumingMemoryBound(to: UInt8.self) else { return }
                
                for y in 0..<height {
                    let srcRowPtr = srcPtr + (y * width * 4)
                    let dstRowPtr = dstPtr + (y * bytesPerRow)
                    
                    for x in 0..<width {
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
        
        // Perform Apple Vision Segmentation
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("❌ Vision segmentation error: \(error.localizedDescription)")
            return
        }
        
        // Retrieve segmentation mask
        guard let result = request.results?.first else {
            print("❌ Vision returned no segmentation results.")
            return
        }
        
        let maskPixelBuffer = result.pixelBuffer
        
        // Lock mask pixel buffer for reading
        CVPixelBufferLockBaseAddress(maskPixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(maskPixelBuffer, .readOnly) }
        
        guard let maskBaseAddress = CVPixelBufferGetBaseAddress(maskPixelBuffer) else {
            print("❌ Failed to get mask base address.")
            return
        }
        
        let maskWidth = CVPixelBufferGetWidth(maskPixelBuffer)
        let maskHeight = CVPixelBufferGetHeight(maskPixelBuffer)
        let maskBytesPerRow = CVPixelBufferGetBytesPerRow(maskPixelBuffer)
        
        let expectedPayloadSize = maskWidth * maskHeight * 4
        
        // Reuse cached outputData buffer
        if outputData.count != expectedPayloadSize {
            outputData = Data(count: expectedPayloadSize)
        }
        
        outputData.withUnsafeMutableBytes { rawBuffer in
            guard let basePtr = rawBuffer.baseAddress else { return }
            
            // Map grayscale segment mask directly to output RGBA bytes using unsafe pointers
            let payloadPtr = basePtr.assumingMemoryBound(to: UInt8.self)
            
            for y in 0..<maskHeight {
                let rowPtr = maskBaseAddress.assumingMemoryBound(to: UInt8.self) + (y * maskBytesPerRow)
                let dstRowPtr = payloadPtr + (y * maskWidth * 4)
                
                for x in 0..<maskWidth {
                    let val = rowPtr[x]
                    let dstIdx = x * 4
                    
                    dstRowPtr[dstIdx] = val
                    dstRowPtr[dstIdx + 1] = val
                    dstRowPtr[dstIdx + 2] = val
                    dstRowPtr[dstIdx + 3] = 255
                }
            }
        }
        
        // Write raw mask bytes to outFilePath
        let outFileUrl = URL(fileURLWithPath: self.outFilePath)
        do {
            try outputData.write(to: outFileUrl)
        } catch {
            print("❌ Failed to write mask frame to shared file: \(error)")
            return
        }
        
        // Send JSON notification back to JS
        let notification = "{\"type\":\"mask\",\"width\":\(maskWidth),\"height\":\(maskHeight)}"
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
            
            if type == "frame" {
                let width = json["width"] as? Int ?? 0
                let height = json["height"] as? Int ?? 0
                self.segmentationManager?.processFrame(width: width, height: height)
            }
        })
        
        self.wsClient = ws
        self.segmentationManager = SegmentationManager(wsClient: ws, quality: quality, port: port)
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
try await Task.sleep(nanoseconds: UInt64.max)
