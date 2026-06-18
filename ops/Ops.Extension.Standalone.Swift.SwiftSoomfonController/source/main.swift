import Foundation
import CoreGraphics
import ImageIO

struct WSMessage: Codable {
    let action: String
    let device_index: Int?
    let key: Int?
    let image: String?
}

actor WebSocketClient {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private var reconnectTimer: Task<Void, Never>?
    private let engine: SoomfonEngine
    
    init(url: URL, engine: SoomfonEngine) {
        self.url = url
        self.engine = engine
    }
    
    func connect() {
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
        reconnectTimer?.cancel()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        print("🛑 WebSocket disconnected.")
    }
    
    func send(message: String) {
        guard isConnected, let task = webSocketTask else { return }
        let wsMessage = URLSessionWebSocketTask.Message.string(message)
        task.send(wsMessage) { error in
            if let error = error {
                print("❌ WebSocket Send Error: \(error.localizedDescription)")
            }
        }
    }
    
    private func handleIncomingText(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        do {
            let msg = try JSONDecoder().decode(WSMessage.self, from: data)
            switch msg.action {
            case "connect":
                let index = msg.device_index ?? 0
                engine.connect(deviceIndex: index)
            case "set_key_image":
                if let key = msg.key, let img = msg.image {
                    engine.setKeyImage(keyIndex: key, base64: img)
                }
            case "set_stretched_image":
                if let img = msg.image {
                    engine.setStretchedImage(base64: img)
                }
            case "close":
                engine.stop()
                exit(0)
            default:
                break
            }
        } catch {
            print("⚠️ Error decoding WS message: \(error.localizedDescription)")
        }
    }
    
    private func listenForMessages(task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    Task { await self.handleIncomingText(text) }
                default:
                    break
                }
                Task { await self.listenForMessages(task: task) }
            case .failure(let error):
                print("⚠️ WebSocket Connection lost: \(error.localizedDescription)")
                Task { await self.handleDisconnect() }
            }
        }
    }
    
    private func handleDisconnect() {
        self.isConnected = false
        self.webSocketTask = nil
        reconnectTimer?.cancel()
        reconnectTimer = Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            guard !Task.isCancelled else { return }
            print("🔄 Attempting automatic reconnection to Cables...")
            self.connect()
        }
    }
}

// Controller Engine
final class SoomfonEngine: @unchecked Sendable {
    private let monitor = SoomfonMonitor()
    private var activeDevice: SoomfonDevice?
    private let lock = NSLock()
    private var keepAliveTimer: Timer?
    
    var onConnected: ((String) -> Void)?
    var onDisconnected: (() -> Void)?
    var onKeyEvent: ((Int, Bool) -> Void)?
    var onKnobClick: ((Int, Bool) -> Void)?
    var onKnobTurn: ((Int, Int) -> Void)?
    var onError: ((String) -> Void)?
    
    init() {
        monitor.onDeviceRemoved = { [weak self] device in
            self?.lock.lock()
            if let active = self?.activeDevice, active.rawDevice === device {
                self?.lock.unlock()
                self?.disconnect()
            } else {
                self?.lock.unlock()
            }
        }
    }
    
    func start() {
        _ = monitor.start()
    }
    
    func stop() {
        disconnect()
        monitor.stop()
    }
    
    private func disconnect() {
        lock.lock()
        keepAliveTimer?.invalidate()
        keepAliveTimer = nil
        
        if let dev = activeDevice {
            dev.close()
            activeDevice = nil
            onDisconnected?()
        }
        lock.unlock()
    }
    
    func connect(deviceIndex: Int) {
        disconnect()
        
        // Wait up to 1.5s for devices to match
        var retries = 0
        while monitor.knownDevices.isEmpty && retries < 15 {
            Thread.sleep(forTimeInterval: 0.1)
            retries += 1
        }
        
        lock.lock()
        defer { lock.unlock() }
        
        let devices = monitor.knownDevices.values.sorted {
            let s1 = (IOHIDDeviceGetProperty($0, kIOHIDSerialNumberKey as CFString) as? String) ?? ""
            let s2 = (IOHIDDeviceGetProperty($1, kIOHIDSerialNumberKey as CFString) as? String) ?? ""
            return s1 < s2
        }
        
        guard !devices.isEmpty else {
            onError?("No Soomfon devices connected.")
            return
        }
        
        guard deviceIndex >= 0 && deviceIndex < devices.count else {
            onError?("Device index \(deviceIndex) out of range (0-\(devices.count - 1)).")
            return
        }
        
        let target = devices[deviceIndex]
        let dev = SoomfonDevice(rawDevice: target)
        
        if dev.open() {
            dev.onButtonEvent = { [weak self] key, pressed in
                self?.onKeyEvent?(key, pressed)
            }
            dev.onKnobClickEvent = { [weak self] knob, pressed in
                self?.onKnobClick?(knob, pressed)
            }
            dev.onKnobTurnEvent = { [weak self] knob, dir in
                self?.onKnobTurn?(knob, dir)
            }
            
            activeDevice = dev
            
            // Start Keep-Alive heartbeats (every 10 seconds)
            DispatchQueue.main.async { [weak self] in
                self?.keepAliveTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in
                    self?.activeDevice?.keepAlive()
                }
            }
            
            let name = (IOHIDDeviceGetProperty(target, kIOHIDProductKey as CFString) as? String) ?? "Soomfon Stream Controller"
            onConnected?(name)
        } else {
            onError?("Failed to open Soomfon device.")
        }
    }
    
    func setKeyImage(keyIndex: Int, base64: String) {
        guard let data = Data(base64Encoded: base64),
              let cgImage = cgImage(from: data) else {
            onError?("Failed to decode base64 image data.")
            return
        }
        
        // Rotate image 270 degrees (90 CCW) as expected by the device
        guard let rotated = rotate90CCW(image: cgImage),
              let jpegBytes = jpegData(from: rotated, quality: 0.9) else {
            onError?("Failed to rotate and encode image for key \(keyIndex).")
            return
        }
        
        activeDevice?.setKeyImage(keyIndex: keyIndex, jpegData: jpegBytes)
    }
    
    func setStretchedImage(base64: String) {
        guard let data = Data(base64Encoded: base64),
              let cgImage = cgImage(from: data) else {
            onError?("Failed to decode stretched base64 data.")
            return
        }
        
        let cols = 3
        let rows = 2
        let kw = 60
        let kh = 60
        
        // Slice, rotate each slice 90 CCW, convert to JPEG, and upload
        for r in 0..<rows {
            for c in 0..<cols {
                let cropRect = CGRect(
                    x: CGFloat(c * kw),
                    y: CGFloat(r * kh),
                    width: CGFloat(kw),
                    height: CGFloat(kh)
                )
                
                if let cropped = cgImage.cropping(to: cropRect),
                   let rotated = rotate90CCW(image: cropped),
                   let jpegBytes = jpegData(from: rotated, quality: 0.9) {
                    
                    let keyIndex = r * cols + c
                    activeDevice?.setKeyImage(keyIndex: keyIndex, jpegData: jpegBytes)
                }
            }
        }
    }
    
    // MARK: - Image Helpers
    
    private func cgImage(from data: Data) -> CGImage? {
        guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(imageSource, 0, nil)
    }
    
    private func rotate90CCW(image: CGImage) -> CGImage? {
        let w = image.height
        let h = image.width
        guard let context = CGContext(
            data: nil,
            width: w,
            height: h,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
        ) else {
            return nil
        }
        
        // Center rotation origin, rotate by -90 degrees, and draw
        context.translateBy(x: CGFloat(w) / 2.0, y: CGFloat(h) / 2.0)
        context.rotate(by: -.pi / 2.0)
        context.draw(image, in: CGRect(x: -CGFloat(image.width) / 2.0, y: -CGFloat(image.height) / 2.0, width: CGFloat(image.width), height: CGFloat(image.height)))
        
        return context.makeImage()
    }
    
    private func jpegData(from cgImage: CGImage, quality: Double) -> Data? {
        let data = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(data as CFMutableData, "public.jpeg" as CFString, 1, nil) else {
            return nil
        }
        let options: [CFString: Any] = [
            kCGImageDestinationLossyCompressionQuality: quality
        ]
        CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
            return nil
        }
        return data as Data
    }
}

// CLI Parameter Parsing
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
let engine = SoomfonEngine()
let wsClient = WebSocketClient(url: serverUrl, engine: engine)

// Engine Events
engine.onConnected = { name in
    let info: [String: Any] = [
        "type": "connected",
        "model": name,
        "keys": 9,
        "display_keys": 6,
        "rows": 2,
        "cols": 3,
        "key_width": 60,
        "key_height": 60
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: info, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onDisconnected = {
    Task {
        await wsClient.send(message: "{\"type\":\"disconnected\"}")
    }
}

engine.onKeyEvent = { keyIndex, pressed in
    let event: [String: Any] = [
        "type": "key_event",
        "key": keyIndex,
        "pressed": pressed
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: event, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onKnobClick = { knobIndex, pressed in
    let event: [String: Any] = [
        "type": "knob_click",
        "knob": knobIndex,
        "pressed": pressed
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: event, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onKnobTurn = { knobIndex, direction in
    let event: [String: Any] = [
        "type": "knob_turn",
        "knob": knobIndex,
        "direction": direction
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: event, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

engine.onError = { message in
    let errorMsg: [String: Any] = [
        "type": "error",
        "message": message
    ]
    if let jsonData = try? JSONSerialization.data(withJSONObject: errorMsg, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        Task {
            await wsClient.send(message: jsonString)
        }
    }
}

// Start Engine
engine.start()

// Connect WebSocket
await wsClient.connect()

// Parent Lifecycle monitor
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited. Terminating...")
            engine.stop()
            exit(0)
        }
    }
}

print("💡 Activating SwiftSoomfonController Sidecar Engine...")

// Keep alive run loop
try await Task.sleep(nanoseconds: UInt64.max)
