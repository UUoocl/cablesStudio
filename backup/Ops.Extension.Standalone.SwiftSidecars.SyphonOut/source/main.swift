import Foundation
import Metal
import CoreGraphics
import VideoToolbox
import CoreMedia
import QuartzCore

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
    private let onData: @Sendable (Data) -> Void
    
    init(url: URL, onMessage: @escaping @Sendable (String) -> Void, onData: @escaping @Sendable (Data) -> Void) {
        self.url = url
        self.onMessage = onMessage
        self.onData = onData
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
                case .data(let data):
                    self.onData(data)
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

final class H264Decoder {
    private var session: VTDecompressionSession?
    private var formatDescription: CMVideoFormatDescription?
    private let onFrame: (CVPixelBuffer) -> Void
    
    init(onFrame: @escaping (CVPixelBuffer) -> Void) {
        self.onFrame = onFrame
    }
    
    func decode(annexBData: Data) {
        var sps: Data?
        var pps: Data?
        
        var offsets: [Int] = []
        var i = 0
        while i < annexBData.count - 4 {
            if annexBData[i] == 0 && annexBData[i+1] == 0 && annexBData[i+2] == 0 && annexBData[i+3] == 1 {
                offsets.append(i)
                i += 4
            } else if annexBData[i] == 0 && annexBData[i+1] == 0 && annexBData[i+2] == 1 {
                offsets.append(i)
                i += 3
            } else {
                i += 1
            }
        }
        
        var nals: [Data] = []
        for idx in 0..<offsets.count {
            let start = offsets[idx]
            let end = (idx + 1 < offsets.count) ? offsets[idx+1] : annexBData.count
            
            var startCodeLength = 3
            if annexBData[start + 3] == 1 {
                startCodeLength = 4
            }
            let nal = annexBData.subdata(in: (start + startCodeLength)..<end)
            nals.append(nal)
        }
        
        var spsPointer: UnsafePointer<UInt8>?
        var ppsPointer: UnsafePointer<UInt8>?
        var spsSize = 0
        var ppsSize = 0
        
        var videoNal: Data?
        
        for nal in nals {
            guard !nal.isEmpty else { continue }
            let nalType = nal[0] & 0x1F
            
            if nalType == 7 {
                sps = nal
            } else if nalType == 8 {
                pps = nal
            } else if nalType == 5 || nalType == 1 {
                videoNal = nal
            }
        }
        
        if let sps = sps, let pps = pps {
            sps.withUnsafeBytes { ptr in
                spsPointer = ptr.baseAddress?.assumingMemoryBound(to: UInt8.self)
                spsSize = sps.count
            }
            pps.withUnsafeBytes { ptr in
                ppsPointer = ptr.baseAddress?.assumingMemoryBound(to: UInt8.self)
                ppsSize = pps.count
            }
            
            if let spsP = spsPointer, let ppsP = ppsPointer {
                let pointers = [spsP, ppsP]
                let sizes = [spsSize, ppsSize]
                
                var newFormatDesc: CMVideoFormatDescription?
                let status = CMVideoFormatDescriptionCreateFromH264ParameterSets(
                    allocator: kCFAllocatorDefault,
                    parameterSetCount: 2,
                    parameterSetPointers: pointers,
                    parameterSetSizes: sizes,
                    nalUnitHeaderLength: 4,
                    formatDescriptionOut: &newFormatDesc
                )
                
                if status == noErr, let desc = newFormatDesc {
                    if self.formatDescription == nil || !CMFormatDescriptionEqual(desc, otherFormatDescription: self.formatDescription!) {
                        self.formatDescription = desc
                        setupSession(formatDescription: desc)
                    }
                }
            }
        }
        
        guard let session = session, let videoNal = videoNal, let formatDesc = formatDescription else { return }
        
        var avccData = Data()
        var bigNalLength = UInt32(videoNal.count).bigEndian
        let bigNalData = Data(bytes: &bigNalLength, count: 4)
        avccData.append(bigNalData)
        avccData.append(videoNal)
        
        var blockBuffer: CMBlockBuffer?
        let status = avccData.withUnsafeBytes { ptr in
            CMBlockBufferCreateWithMemoryBlock(
                allocator: kCFAllocatorDefault,
                memoryBlock: UnsafeMutableRawPointer(mutating: ptr.baseAddress),
                blockLength: avccData.count,
                blockAllocator: kCFAllocatorNull,
                customBlockSource: nil,
                offsetToData: 0,
                dataLength: avccData.count,
                flags: 0,
                blockBufferOut: &blockBuffer
            )
        }
        
        guard status == kCMBlockBufferNoErr, let buffer = blockBuffer else { return }
        
        var sampleBuffer: CMSampleBuffer?
        var timingInfo = CMSampleTimingInfo(
            duration: .invalid,
            presentationTimeStamp: .zero,
            decodeTimeStamp: .invalid
        )
        
        CMSampleBufferCreateReady(
            allocator: kCFAllocatorDefault,
            dataBuffer: buffer,
            formatDescription: formatDesc,
            sampleCount: 1,
            sampleTimingEntryCount: 1,
            sampleTimingArray: &timingInfo,
            sampleSizeEntryCount: 0,
            sampleSizeArray: nil,
            sampleBufferOut: &sampleBuffer
        )
        
        guard let sBuffer = sampleBuffer else { return }
        
        VTDecompressionSessionDecodeFrame(
            session,
            sampleBuffer: sBuffer,
            flags: [],
            frameRefcon: nil,
            infoFlagsOut: nil
        )
    }
    
    private func setupSession(formatDescription: CMVideoFormatDescription) {
        if let session = session {
            VTDecompressionSessionInvalidate(session)
            self.session = nil
        }
        
        let destinationImageBufferAttributes = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferMetalCompatibilityKey as String: kCFBooleanTrue as Any,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:] as Any
        ] as CFDictionary
        
        var outputCallback = VTDecompressionOutputCallbackRecord(
            decompressionOutputCallback: { refCon, frameRefCon, status, infoFlags, imageBuffer, presentationTimeStamp, presentationDuration in
                guard status == noErr, let imageBuffer = imageBuffer else { return }
                let decoder = Unmanaged<H264Decoder>.fromOpaque(refCon!).takeUnretainedValue()
                decoder.onFrame(imageBuffer)
            },
            decompressionOutputRefCon: Unmanaged.passUnretained(self).toOpaque()
        )
        
        VTDecompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            formatDescription: formatDescription,
            decoderSpecification: nil,
            imageBufferAttributes: destinationImageBufferAttributes,
            outputCallback: &outputCallback,
            decompressionSessionOut: &session
        )
    }
    
    deinit {
        if let session = session {
            VTDecompressionSessionInvalidate(session)
        }
    }
}

final class SyphonServerManager: @unchecked Sendable {
    private var currentServer: AnyObject?
    private var currentName: String?
    private let device: MTLDevice
    private let commandQueue: MTLCommandQueue
    private let lock = NSLock()
    private var tempFilePath: String = ""
    private var textureCache: CVMetalTextureCache?
    private var h264Decoder: H264Decoder?
    
    private var serverClass: AnyClass?
    private var publishFunc: (@convention(c) (AnyObject, Selector, AnyObject, AnyObject, NSRect, Bool) -> Void)?
    private var stopFunc: (@convention(c) (AnyObject, Selector) -> Void)?
    
    init(device: MTLDevice, port: Int) {
        self.device = device
        self.commandQueue = device.makeCommandQueue()!
        
        let fm = FileManager.default
        let ramDiskPath = "/Volumes/CablesRAMDisk"
        if fm.fileExists(atPath: ramDiskPath) {
            self.tempFilePath = "\(ramDiskPath)/syphon_out_\(port).raw"
        } else {
            self.tempFilePath = "\(NSTemporaryDirectory())syphon_out_\(port).raw"
        }
        print("📁 Using shared frame file: \(self.tempFilePath)")
        
        CVMetalTextureCacheCreate(kCFAllocatorDefault, nil, device, nil, &textureCache)
        
        if let serverClass = NSClassFromString("SyphonMetalServer") {
            self.serverClass = serverClass
            
            if let publishMethod = class_getInstanceMethod(serverClass, Selector(("publishFrameTexture:onCommandBuffer:imageRegion:flipped:"))) {
                self.publishFunc = unsafeBitCast(method_getImplementation(publishMethod), to: PublishFrameTextureFunc.self)
            }
            
            if let stopMethod = class_getInstanceMethod(serverClass, Selector(("stop"))) {
                self.stopFunc = unsafeBitCast(method_getImplementation(stopMethod), to: ServerStopFunc.self)
            }
        }
        
        self.h264Decoder = H264Decoder { [weak self] pixelBuffer in
            self?.publishPixelBuffer(pixelBuffer)
        }
    }
    
    func handleBinaryData(_ data: Data) {
        guard data.count > 9 else { return }
        
        let h264Payload = data.subdata(in: 9..<data.count)
        self.h264Decoder?.decode(annexBData: h264Payload)
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
    
    func publishFrame(width: Int, height: Int) {
        lock.lock()
        let server = currentServer
        let publish = publishFunc
        lock.unlock()
        
        guard let server = server, let publish = publish else { return }
        guard width > 0, height > 0 else { return }
        
        let fileUrl = URL(fileURLWithPath: self.tempFilePath)
        guard let data = try? Data(contentsOf: fileUrl) else {
            print("❌ Failed to read frame from shared file: \(self.tempFilePath)")
            return
        }
        
        guard data.count >= width * height * 4 else { return }
        
        let pixelBytes = [UInt8](data.subdata(in: 0..<width * height * 4))
        
        let descriptor = MTLTextureDescriptor.texture2DDescriptor(
            pixelFormat: .rgba8Unorm,
            width: width,
            height: height,
            mipmapped: false
        )
        descriptor.usage = [.shaderRead, .shaderWrite]
        
        guard let texture = device.makeTexture(descriptor: descriptor) else {
            print("❌ Failed to create MTLTexture.")
            return
        }
        
        let region = MTLRegionMake2D(0, 0, width, height)
        texture.replace(region: region, mipmapLevel: 0, withBytes: pixelBytes, bytesPerRow: width * 4)
        
        guard let commandBuffer = commandQueue.makeCommandBuffer() else {
            print("❌ Failed to create MTLCommandBuffer.")
            return
        }
        
        let rect = NSRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))
        publish(server, Selector(("publishFrameTexture:onCommandBuffer:imageRegion:flipped:")), texture, commandBuffer, rect, true)
        commandBuffer.commit()
    }
    
    func publishPixelBuffer(_ pixelBuffer: CVPixelBuffer) {
        guard let textureCache = textureCache else { return }
        
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        var cvTextureOut: CVMetalTexture?
        let status = CVMetalTextureCacheCreateTextureFromImage(
            kCFAllocatorDefault,
            textureCache,
            pixelBuffer,
            nil,
            .bgra8Unorm,
            width,
            height,
            0,
            &cvTextureOut
        )
        
        guard status == kCVReturnSuccess, let cvTexture = cvTextureOut else {
            print("❌ Failed to create CVMetalTexture from cache.")
            return
        }
        
        guard let texture = CVMetalTextureGetTexture(cvTexture) else {
            print("❌ Failed to get MTLTexture from CVMetalTexture.")
            return
        }
        
        lock.lock()
        let server = currentServer
        let publish = publishFunc
        lock.unlock()
        
        guard let server = server, let publish = publish else { return }
        
        guard let commandBuffer = commandQueue.makeCommandBuffer() else { return }
        let rect = NSRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))
        publish(server, Selector(("publishFrameTexture:onCommandBuffer:imageRegion:flipped:")), texture, commandBuffer, rect, true)
        commandBuffer.commit()
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var serverManager: SyphonServerManager?
    
    func start(host: String, port: Int, device: MTLDevice) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        self.serverManager = SyphonServerManager(device: device, port: port)
        
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
            } else if type == "frame" {
                let width = json["width"] as? Int ?? 0
                let height = json["height"] as? Int ?? 0
                self.serverManager?.publishFrame(width: width, height: height)
            }
        }, onData: { [weak self] binaryData in
            self?.serverManager?.handleBinaryData(binaryData)
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
