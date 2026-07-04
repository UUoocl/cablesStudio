import Foundation
import Metal
import VideoToolbox
import CoreMedia
import QuartzCore
import IOSurface

// Disable buffering for stdout and stderr so that prints are output immediately to the parent process
let _ = setvbuf(stdout, nil, _IONBF, 0)
let _ = setvbuf(stderr, nil, _IONBF, 0)


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

final class H264Encoder {
    private var session: VTCompressionSession?
    private let onFrame: (Data, Bool) -> Void
    
    init(width: Int, height: Int, onFrame: @escaping (Data, Bool) -> Void) {
        self.onFrame = onFrame
        
        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: Int32(width),
            height: Int32(height),
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: { refCon, sourceFrameRefCon, status, infoFlags, sampleBuffer in
                guard status == noErr, let sampleBuffer = sampleBuffer else { return }
                let encoder = Unmanaged<H264Encoder>.fromOpaque(refCon!).takeUnretainedValue()
                encoder.handleEncodedFrame(sampleBuffer: sampleBuffer)
            },
            refcon: Unmanaged.passUnretained(self).toOpaque(),
            compressionSessionOut: &session
        )
        
        if status == noErr, let session = session {
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_High_AutoLevel)
            VTCompressionSessionPrepareToEncodeFrames(session)
        }
    }
    
    func encode(texture: MTLTexture, presentationTimeStamp: CMTime) {
        guard let session = session else { return }
        
        var pixelBuffer: CVPixelBuffer?
        let width = texture.width
        let height = texture.height
        
        let attrs = [
            kCVPixelBufferMetalCompatibilityKey as String: kCFBooleanTrue as Any,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:] as Any
        ] as CFDictionary
        
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32BGRA,
            attrs,
            &pixelBuffer
        )
        
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return }
        
        CVPixelBufferLockBaseAddress(buffer, CVPixelBufferLockFlags(rawValue: 0))
        if let baseAddress = CVPixelBufferGetBaseAddress(buffer) {
            let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
            let region = MTLRegionMake2D(0, 0, width, height)
            texture.getBytes(baseAddress, bytesPerRow: bytesPerRow, from: region, mipmapLevel: 0)
        }
        CVPixelBufferUnlockBaseAddress(buffer, CVPixelBufferLockFlags(rawValue: 0))
        
        VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: buffer,
            presentationTimeStamp: presentationTimeStamp,
            duration: .invalid,
            frameProperties: nil,
            sourceFrameRefcon: nil,
            infoFlagsOut: nil
        )
    }
    
    private func handleEncodedFrame(sampleBuffer: CMSampleBuffer) {
        guard let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer) else { return }
        
        var isKeyframe = false
        if let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false) as? [CFDictionary],
           let attachment = attachments.first {
            let notSync = CFDictionaryGetValue(attachment, Unmanaged.passUnretained(kCMSampleAttachmentKey_NotSync).toOpaque())
            isKeyframe = (notSync == nil)
        }
        
        var dataPayload = Data()
        
        if isKeyframe {
            var parameterSetCount = 0
            CMVideoFormatDescriptionGetH264ParameterSetAtIndex(formatDescription, parameterSetIndex: 0, parameterSetPointerOut: nil, parameterSetSizeOut: nil, parameterSetCountOut: &parameterSetCount, nalUnitHeaderLengthOut: nil)
            
            for index in 0..<parameterSetCount {
                var parameterSetPointer: UnsafePointer<UInt8>?
                var parameterSetSize = 0
                CMVideoFormatDescriptionGetH264ParameterSetAtIndex(formatDescription, parameterSetIndex: index, parameterSetPointerOut: &parameterSetPointer, parameterSetSizeOut: &parameterSetSize, parameterSetCountOut: nil, nalUnitHeaderLengthOut: nil)
                
                if let pointer = parameterSetPointer {
                    dataPayload.append(contentsOf: [0, 0, 0, 1])
                    dataPayload.append(pointer, count: parameterSetSize)
                }
            }
        }
        
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }
        var totalLength = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &totalLength, dataPointerOut: &dataPointer)
        
        if let pointer = dataPointer {
            var offset = 0
            while offset < totalLength - 4 {
                let lengthBytes = pointer.advanced(by: offset)
                var nalUnitLength: UInt32 = 0
                memcpy(&nalUnitLength, lengthBytes, 4)
                nalUnitLength = CFSwapInt32BigToHost(nalUnitLength)
                
                if nalUnitLength > 0 {
                    dataPayload.append(contentsOf: [0, 0, 0, 1])
                    dataPayload.append(UnsafePointer<UInt8>(OpaquePointer(pointer.advanced(by: offset + 4))), count: Int(nalUnitLength))
                    offset += 4 + Int(nalUnitLength)
                } else {
                    break
                }
            }
        }
        
        if !dataPayload.isEmpty {
            self.onFrame(dataPayload, isKeyframe)
        }
    }
    
    deinit {
        if let session = session {
            VTCompressionSessionInvalidate(session)
        }
    }
}

final class SyphonManager: @unchecked Sendable {
    private var currentClient: AnyObject?
    private let device: MTLDevice
    private let wsClient: WebSocketClient
    private let lock = NSLock()
    
    private var clientClass: AnyClass?
    private var newFrameImageFunc: (@convention(c) (AnyObject, Selector) -> MTLTexture?)?
    private var stopFunc: (@convention(c) (AnyObject, Selector) -> Void)?
    
    private var streamMode = "iosurface"
    private var h264Encoder: H264Encoder?
    private var lastWidth = 0
    private var lastHeight = 0
    private var lastSurfaceID: UInt32 = 0
    private var startTime = CACurrentMediaTime()
    
    init(device: MTLDevice, wsClient: WebSocketClient) {
        self.device = device
        self.wsClient = wsClient
        
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
    
    func setStreamMode(mode: String) {
        lock.lock()
        defer { lock.unlock() }
        self.streamMode = mode
        print("Stream mode set to: \(mode)")
        if mode == "iosurface" {
            self.h264Encoder = nil
            self.lastWidth = 0
            self.lastHeight = 0
            self.lastSurfaceID = 0
        }
    }
    
    func selectServer(name: String?, appName: String?) {
        lock.lock()
        defer { lock.unlock() }
        
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
        
        if h264Encoder == nil || lastWidth != width || lastHeight != height {
            lastWidth = width
            lastHeight = height
            startTime = CACurrentMediaTime()
            h264Encoder = H264Encoder(width: width, height: height) { [weak self] h264Data, isKeyframe in
                self?.sendH264Frame(h264Data: h264Data, isKeyframe: isKeyframe)
            }
        }
        let elapsed = CACurrentMediaTime() - startTime
        let pts = CMTime(seconds: elapsed, preferredTimescale: 1000)
        h264Encoder?.encode(texture: texture, presentationTimeStamp: pts)
    }
    
    private func sendH264Frame(h264Data: Data, isKeyframe: Bool) {
        var header = Data(count: 9)
        header[0] = isKeyframe ? 1 : 0
        let elapsedUs = UInt64((CACurrentMediaTime() - startTime) * 1_000_000)
        withUnsafeBytes(of: elapsedUs.littleEndian) { ptr in
            header.replaceSubrange(1...8, with: ptr)
        }
        var messageData = Data()
        messageData.append(header)
        messageData.append(h264Data)
        self.wsClient.send(data: messageData)
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
            } else if type == "config" {
                let mode = json["mode"] as? String ?? "iosurface"
                self.syphonManager?.setStreamMode(mode: mode)
            }
        }
        
        self.wsClient = ws
        self.syphonManager = SyphonManager(device: device, wsClient: ws)
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

// publishServerList removed since dropdown discovery is deprecated in favor of manual connection

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

print("💡 Activating Swift Syphon Client sidecar process, waiting for events...")

RunLoop.main.run()
