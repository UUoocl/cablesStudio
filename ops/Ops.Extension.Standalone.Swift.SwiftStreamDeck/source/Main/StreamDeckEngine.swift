import Foundation
import CoreGraphics
import ImageIO
import Codedeck
import HIDSwift

class StreamDeckEngine: HIDDeviceMonitorDelegate {
    private let monitor: HIDDeviceMonitor
    private var activeStreamDeck: StreamDeck?
    private let lock = NSLock()
    
    // Callbacks to notify WebSocket client
    var onConnected: ((String, StreamDeckProduct) -> Void)?
    var onDisconnected: (() -> Void)?
    var onKeyEvent: ((Int, Bool) -> Void)?
    var onError: ((String) -> Void)?
    
    init() {
        self.monitor = HIDDeviceMonitor(streamDeckProducts: StreamDeckProduct.allCases)
    }
    
    func start() {
        monitor.startMonitoring(delegate: self)
    }
    
    func stop() {
        monitor.stopMonitoring()
        closeCurrentDeck()
    }
    
    private func closeCurrentDeck() {
        lock.lock()
        defer { lock.unlock() }
        
        if let deck = activeStreamDeck {
            deck.reset()
            activeStreamDeck = nil
            onDisconnected?()
        }
    }
    
    func connect(deviceIndex: Int) {
        closeCurrentDeck()
        
        // Wait up to 1.5 seconds (15 * 100ms) for the monitor to populate devices
        var retries = 0
        while monitor.knownDevices.isEmpty && retries < 15 {
            try? Thread.sleep(forTimeInterval: 0.1)
            retries += 1
        }
        
        lock.lock()
        defer { lock.unlock() }
        
        // Sort devices by serial number to have stable indexing
        let devices = monitor.knownDevices.values.sorted { $0.serialNumber < $1.serialNumber }
        
        guard !devices.isEmpty else {
            onError?("No Stream Decks connected.")
            return
        }
        
        guard deviceIndex >= 0 && deviceIndex < devices.count else {
            onError?("Device index \(deviceIndex) out of range (0-\(devices.count - 1)).")
            return
        }
        
        let targetDevice = devices[deviceIndex]
        do {
            let deck = try StreamDeck(device: targetDevice)
            deck.reset()
            try deck.clearAllKeys()
            
            // Set callbacks
            deck.onKeyDown = { [weak self] userKeyIndex in
                // Codedeck uses 1-indexed logical keys, JS expects 0-indexed logical keys
                self?.onKeyEvent?(userKeyIndex - 1, true)
            }
            deck.onKeyUp = { [weak self] userKeyIndex in
                self?.onKeyEvent?(userKeyIndex - 1, false)
            }
            
            self.activeStreamDeck = deck
            onConnected?(targetDevice.name, deck.product)
        } catch {
            onError?("Failed to open Stream Deck: \(error.localizedDescription)")
        }
    }
    
    func setKeyImage(keyIndex: Int, base64: String) {
        guard let deck = activeStreamDeck else { return }
        
        guard let data = Data(base64Encoded: base64),
              let cgImage = cgImage(from: data) else {
            onError?("Failed to decode base64 image data for key \(keyIndex).")
            return
        }
        
        lock.lock()
        defer { lock.unlock() }
        
        do {
            // JS sends 0-indexed logical keys. Codedeck expects 1-indexed.
            let userKey = keyIndex + 1
            let keyObj = try deck.key(for: userKey)
            keyObj.setImage { context, size in
                context.draw(cgImage, in: CGRect(origin: .zero, size: size))
            }
        } catch {
            onError?("Failed to set key image: \(error.localizedDescription)")
        }
    }
    
    func setStretchedImage(base64: String) {
        guard let deck = activeStreamDeck else { return }
        
        guard let data = Data(base64Encoded: base64),
              let cgImage = cgImage(from: data) else {
            onError?("Failed to decode base64 stretched image data.")
            return
        }
        
        lock.lock()
        defer { lock.unlock() }
        
        let product = deck.product
        
        // Define column and row counts based on product key count
        var cols = 5
        var rows = 3
        if product.keyCount == 6 {
            cols = 3
            rows = 2
        } else if product.keyCount == 8 {
            cols = 4
            rows = 2
        } else if product.keyCount == 32 {
            cols = 8
            rows = 4
        }
        
        let kw = product.iconSize
        let kh = product.iconSize
        
        let gridW = cols * kw
        let gridH = rows * kh
        
        // Resize the incoming image to fit the overall sliced grid
        guard let resized = resize(image: cgImage, to: CGSize(width: gridW, height: gridH)) else {
            onError?("Failed to resize stretched image.")
            return
        }
        
        // Crop and set for each key
        for r in 0..<rows {
            for c in 0..<cols {
                let cropRect = CGRect(
                    x: CGFloat(c * kw),
                    y: CGFloat(r * kh),
                    width: CGFloat(kw),
                    height: CGFloat(kh)
                )
                
                if let cropped = resized.cropping(to: cropRect) {
                    let userKey = (r * cols + c) + 1
                    if let keyObj = try? deck.key(for: userKey) {
                        keyObj.setImage { context, size in
                            context.draw(cropped, in: CGRect(origin: .zero, size: size))
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - HIDDeviceMonitorDelegate
    
    func HIDDeviceAdded(device: HIDDevice) {
        // Log info
    }
    
    func HIDDeviceRemoved(device: HIDDevice) {
        lock.lock()
        if let deck = activeStreamDeck, deck.device.serialNumber == device.serialNumber {
            lock.unlock()
            closeCurrentDeck()
        } else {
            lock.unlock()
        }
    }
    
    func HIDDeviceError(error: Error) {
        // Log error
    }
    
    // MARK: - Image Helpers
    
    private func cgImage(from data: Data) -> CGImage? {
        guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(imageSource, 0, nil)
    }
    
    private func resize(image: CGImage, to size: CGSize) -> CGImage? {
        guard let context = CGContext(
            data: nil,
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
        ) else {
            return nil
        }
        context.interpolationQuality = .high
        context.draw(image, in: CGRect(origin: .zero, size: size))
        return context.makeImage()
    }
}
