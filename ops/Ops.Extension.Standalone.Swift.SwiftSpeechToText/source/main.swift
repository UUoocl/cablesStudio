import Foundation
import AVFoundation
import Speech
import CoreAudio
import AudioToolbox

typealias SharedDirectoryFunc = @convention(c) (AnyClass, Selector) -> AnyObject

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

final class SpeechManager: @unchecked Sendable {
    private let wsClient: WebSocketClient
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let lock = NSLock()
    private var currentLocale = "en-US"
    private var currentDeviceUID: String?
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
        checkSpeechAuthorizationStatus()
    }
    
    private func checkSpeechAuthorizationStatus() {
        print("🎙️ Querying speech recognition authorization status...")
        let status = SFSpeechRecognizer.authorizationStatus()
        switch status {
        case .authorized:
            print("✅ Speech recognition is authorized.")
        case .denied:
            print("❌ Speech recognition is denied. Please enable it in System Settings.")
        case .restricted:
            print("❌ Speech recognition is restricted on this device.")
        case .notDetermined:
            print("⚠️ Speech recognition authorization is not determined yet.")
        @unknown default:
            break
        }
    }
    
    func setLocale(_ localeIdentifier: String) {
        lock.lock()
        defer { lock.unlock() }
        
        guard currentLocale != localeIdentifier else { return }
        currentLocale = localeIdentifier
        print("🌐 Locale changed to: \(localeIdentifier)")
        
        // If recording is active, restart it with the new locale
        if audioEngine.isRunning {
            stopRecordingInternal()
            try? startRecordingInternal()
        }
    }
    
    func setAudioDevice(uid: String) {
        lock.lock()
        defer { lock.unlock() }
        
        guard currentDeviceUID != uid else { return }
        currentDeviceUID = uid
        print("🎤 Audio input device changed to UID: \(uid)")
        
        // If recording is active, restart it to bind the new device
        if audioEngine.isRunning {
            stopRecordingInternal()
            try? startRecordingInternal()
        }
    }
    
    func startRecording() {
        lock.lock()
        defer { lock.unlock() }
        
        do {
            try startRecordingInternal()
        } catch {
            print("❌ Failed to start recording: \(error.localizedDescription)")
        }
    }
    
    func stopRecording() {
        lock.lock()
        defer { lock.unlock() }
        stopRecordingInternal()
    }
    
    func resetTranscription() {
        lock.lock()
        defer { lock.unlock() }
        
        print("🎙️ Resetting transcription (hot-swapping recognition task)...")
        guard audioEngine.isRunning else {
            print("⚠️ AVAudioEngine is not running, skipping reset.")
            return
        }
        
        // 1. End old request and cancel old task
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        // 2. Create the new request
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: currentLocale))
        guard let recognizer = speechRecognizer else {
            print("❌ Speech recognizer is nil for locale \(currentLocale)")
            return
        }
        guard recognizer.isAvailable else {
            print("❌ Speech recognizer is not available for locale \(currentLocale)")
            return
        }
        
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        self.recognitionRequest = request
        
        // 3. Start the new recognition task
        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            
            self.lock.lock()
            let isActive = (self.recognitionRequest === request)
            self.lock.unlock()
            
            guard isActive else {
                return
            }
            
            if let result = result {
                let text = result.bestTranscription.formattedString
                let payload: [String: Any] = [
                    "type": "transcription",
                    "text": text,
                    "isFinal": result.isFinal
                ]
                
                if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
                   let str = String(data: data, encoding: .utf8) {
                    self.wsClient.send(message: str)
                }
            }
            
            if error != nil || result?.isFinal == true {
                self.lock.lock()
                if self.recognitionRequest === request {
                    self.audioEngine.stop()
                    self.audioEngine.inputNode.removeTap(onBus: 0)
                    self.recognitionRequest = nil
                    self.recognitionTask = nil
                }
                self.lock.unlock()
            }
        }
        print("✅ Hot-swapped speech recognition task!")
    }
    
    func publishAudioDevices() {
        let devices = getAudioInputDevices()
        let payload: [String: Any] = [
            "type": "devices",
            "devices": devices
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
           let str = String(data: data, encoding: .utf8) {
            wsClient.send(message: str)
        }
    }
    
    private func startRecordingInternal() throws {
        print("🎙️ Clearing any existing recognition task...")
        if let task = recognitionTask {
            task.cancel()
            self.recognitionTask = nil
        }
        
        // 1. Crash-safety guard: Ensure we have at least one active audio input device
        print("🎙️ Checking connected audio input devices via CoreAudio...")
        let devices = getAudioInputDevices()
        guard devices.count > 1 else {
            print("❌ No physical audio input devices found on the system.")
            return
        }
        
        print("🎙️ Creating SFSpeechRecognizer for locale \(currentLocale)...")
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: currentLocale))
        guard let recognizer = speechRecognizer else {
            print("❌ Speech recognizer is nil for locale \(currentLocale)")
            return
        }
        guard recognizer.isAvailable else {
            print("❌ Speech recognizer is not available for locale \(currentLocale)")
            return
        }
        
        print("🎙️ Creating SFSpeechAudioBufferRecognitionRequest...")
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let request = recognitionRequest else {
            print("❌ Unable to create speech recognition request.")
            return
        }
        request.shouldReportPartialResults = true
        
        print("🎙️ Accessing audioEngine inputNode...")
        let inputNode = audioEngine.inputNode
        
        // Dynamic CoreAudio device configuration on the input node's Audio Unit
        if let uid = currentDeviceUID, uid != "Default", let deviceID = getAudioDeviceID(from: uid) {
            print("🎙️ Binding inputNode to AudioDeviceID: \(deviceID)...")
            guard let inputAudioUnit = inputNode.audioUnit else {
                print("❌ Input node has no valid Audio Unit.")
                return
            }
            
            var devID = deviceID
            let size = UInt32(MemoryLayout<AudioDeviceID>.size)
            let status = AudioUnitSetProperty(
                inputAudioUnit,
                kAudioOutputUnitProperty_CurrentDevice,
                kAudioUnitScope_Global,
                0,
                &devID,
                size
            )
            
            if status == noErr {
                print("✅ Successfully set AudioDeviceID on input node: \(deviceID)")
            } else {
                print("❌ Failed to set AudioDeviceID on input node. Status: \(status)")
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        print("🎙️ Input node output format: sampleRate=\(recordingFormat.sampleRate), channels=\(recordingFormat.channelCount)")
        
        // 2. Crash-safety guard: Ensure recordingFormat is valid (sampleRate > 0 and channels > 0)
        guard recordingFormat.sampleRate > 0, recordingFormat.channelCount > 0 else {
            print("❌ Invalid input format: sampleRate=\(recordingFormat.sampleRate), channels=\(recordingFormat.channelCount)")
            return
        }
        
        print("🎙️ Safely removing any existing tap on bus 0...")
        inputNode.removeTap(onBus: 0)
        
        print("🎙️ Installing new buffer tap on bus 0...")
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] (buffer, when) in
            guard let self = self else { return }
            self.lock.lock()
            if let activeRequest = self.recognitionRequest {
                activeRequest.append(buffer)
            }
            self.lock.unlock()
        }
        
        print("🎙️ Preparing AVAudioEngine...")
        audioEngine.prepare()
        
        print("🎙️ Starting AVAudioEngine...")
        try audioEngine.start()
        print("🎤 Microphone tap installed, AVAudioEngine running...")
        
        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            
            self.lock.lock()
            let isActive = (self.recognitionRequest === request)
            self.lock.unlock()
            
            guard isActive else {
                return
            }
            
            if let result = result {
                let text = result.bestTranscription.formattedString
                let payload: [String: Any] = [
                    "type": "transcription",
                    "text": text,
                    "isFinal": result.isFinal
                ]
                
                if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
                   let str = String(data: data, encoding: .utf8) {
                    self.wsClient.send(message: str)
                }
            }
            
            if error != nil || result?.isFinal == true {
                self.lock.lock()
                if self.recognitionRequest === request {
                    self.audioEngine.stop()
                    inputNode.removeTap(onBus: 0)
                    self.recognitionRequest = nil
                    self.recognitionTask = nil
                }
                self.lock.unlock()
            }
        }
    }
    
    private func stopRecordingInternal() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        print("🛑 Stopped audio engine and recognition task.")
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var speechManager: SpeechManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onMessage: { [weak self] jsonStr in
            guard let self = self,
                  let data = jsonStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }
            
            if type == "locale" {
                let locale = json["value"] as? String ?? "en-US"
                self.speechManager?.setLocale(locale)
            } else if type == "audioDevice" {
                let uid = json["value"] as? String ?? "Default"
                self.speechManager?.setAudioDevice(uid: uid)
            } else if type == "start" {
                self.speechManager?.startRecording()
            } else if type == "stop" {
                self.speechManager?.stopRecording()
            } else if type == "reset" {
                self.speechManager?.resetTranscription()
            }
        })
        
        self.wsClient = ws
        self.speechManager = SpeechManager(wsClient: ws)
        ws.connect()
    }
}

// ----------------------------------------------------
// Core Audio & AVCapture Helpers
// ----------------------------------------------------

func getAudioInputDevices() -> [[String: String]] {
    var address = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    var size: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size)
    guard status == noErr else {
        return [["name": "Default System Microphone", "id": "Default"]]
    }
    
    let count = Int(size) / MemoryLayout<AudioDeviceID>.size
    var devices = [AudioDeviceID](repeating: 0, count: count)
    status = AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size, &devices)
    guard status == noErr else {
        return [["name": "Default System Microphone", "id": "Default"]]
    }
    
    var list = [["name": "Default System Microphone", "id": "Default"]]
    
    for device in devices {
        // Query streams in input scope to see if it has input capability
        var streamAddress = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreams,
            mScope: kAudioObjectPropertyScopeInput,
            mElement: kAudioObjectPropertyElementMain
        )
        
        var streamSize: UInt32 = 0
        status = AudioObjectGetPropertyDataSize(device, &streamAddress, 0, nil, &streamSize)
        if status != noErr || streamSize == 0 {
            continue
        }
        
        // Query localized name
        var nameAddress = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceNameCFString,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var nameString: Unmanaged<CFString>? = nil
        var nameSize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        status = AudioObjectGetPropertyData(device, &nameAddress, 0, nil, &nameSize, &nameString)
        let name = (status == noErr && nameString != nil) ? (nameString!.takeRetainedValue() as String) : "Unknown Input"
        
        // Query UID string
        var uidAddress = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var uidString: Unmanaged<CFString>? = nil
        var uidSize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        status = AudioObjectGetPropertyData(device, &uidAddress, 0, nil, &uidSize, &uidString)
        let uid = (status == noErr && uidString != nil) ? (uidString!.takeRetainedValue() as String) : "Unknown UID"
        
        list.append([
            "name": name,
            "id": uid
        ])
    }
    
    return list
}

func getAudioDeviceID(from uid: String) -> AudioDeviceID? {
    var address = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    var size: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size)
    guard status == noErr else { return nil }
    
    let count = Int(size) / MemoryLayout<AudioDeviceID>.size
    var devices = [AudioDeviceID](repeating: 0, count: count)
    status = AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size, &devices)
    guard status == noErr else { return nil }
    
    for device in devices {
        var uidAddress = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        
        var uidString: Unmanaged<CFString>? = nil
        var uidSize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        
        status = AudioObjectGetPropertyData(device, &uidAddress, 0, nil, &uidSize, &uidString)
        if status == noErr, let uidStr = uidString?.takeRetainedValue() as String?, uidStr == uid {
            return device
        }
    }
    return nil
}

// ----------------------------------------------------
// Executable Entry Point
// ----------------------------------------------------

// Disable output buffering to ensure console outputs are immediately visible in parent logs
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

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

// Start Session
let session = Session()
session.start(host: host, port: port)

// Periodically publish active Audio Input Devices (handles hot-plugging)
Task {
    while true {
        session.speechManager?.publishAudioDevices()
        try? await Task.sleep(nanoseconds: 3_000_000_000)
    }
}

// Parent Lifecycle Tracking (Prevent Orphan Processes)
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("💀 Parent process exited (adopted by PID 1). Self-terminating...")
            exit(0)
        }
    }
}

print("💡 Activating Swift Speech to Text sidecar process, waiting for events...")

// Run loop keep-alive
try await Task.sleep(nanoseconds: UInt64.max)
