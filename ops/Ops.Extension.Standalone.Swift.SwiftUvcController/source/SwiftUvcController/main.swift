import Foundation
import UVCControllerCore

// Disable stdout/stderr output buffering to ensure logs flush instantly to parent process
setvbuf(stdout, nil, _IONBF, 0)
setvbuf(stderr, nil, _IONBF, 0)

// --- WebSocket Client Interface ---
final class WebSocketClient: @unchecked Sendable {
    private let url: URL
    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected = false
    private let lock = NSLock()
    private var reconnectTimer: Task<Void, Never>?
    private let onTextMessage: @Sendable (String) -> Void
    
    init(url: URL, onTextMessage: @escaping @Sendable (String) -> Void) {
        self.url = url
        self.onTextMessage = onTextMessage
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
        print("[SwiftUvcController Daemon] Connecting to WebSocket server at \(url.absoluteString)...")
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
        print("[SwiftUvcController Daemon] WebSocket disconnected.")
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
                print("[SwiftUvcController Daemon] WebSocket Send Error: \(error.localizedDescription)")
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
                    self.onTextMessage(text)
                default:
                    break
                }
                self.listenForMessages(task: task)
            case .failure(let error):
                print("[SwiftUvcController Daemon] WebSocket lost connection: \(error.localizedDescription)")
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
            print("[SwiftUvcController Daemon] Reconnecting to Cables server...")
            self.connect()
        }
        lock.unlock()
    }
}

// --- Controller Configuration Struct ---
struct ControllerConfig {
    var name: String = "default"
    var index: Int = 0
    var pollingEnabled: Bool = false
    var pollsPerSecond: Double = 1.0
    var mapEnabled: Bool = false
    var mapMin: Double = 0.0
    var mapMax: Double = 1.0
}

// --- Controller Manager ---
final class UvcControllerManager: @unchecked Sendable {
    private weak var wsClient: WebSocketClient?
    
    private var currentConfig = ControllerConfig()
    private var pollingTimer: DispatchSourceTimer? = nil
    private var activeDevice: UVCController? = nil
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
    }
    
    func start() {
        startPollingLoop()
    }
    
    func handleIncomingMessage(_ jsonStr: String) {
        DispatchQueue.main.async { [weak self] in
            self?.processIncomingMessageOnMainThread(jsonStr)
        }
    }
    
    private func processIncomingMessageOnMainThread(_ jsonStr: String) {
        guard let data = jsonStr.data(using: String.Encoding.utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }
        
        if type == "configure" {
            if let configPayload = json["config"] as? [String: Any] {
                let name = configPayload["name"] as? String ?? "default"
                let index = configPayload["index"] as? Int ?? 0
                let pollingEnabled = configPayload["pollingEnabled"] as? Bool ?? false
                let pollsPerSecond = configPayload["pollsPerSecond"] as? Double ?? (configPayload["pollsPerSecond"] as? Int).map(Double.init) ?? 1.0
                let mapEnabled = configPayload["mapEnabled"] as? Bool ?? false
                let mapMin = configPayload["mapMin"] as? Double ?? (configPayload["mapMin"] as? Int).map(Double.init) ?? 0.0
                let mapMax = configPayload["mapMax"] as? Double ?? (configPayload["mapMax"] as? Int).map(Double.init) ?? 1.0
                
                self.currentConfig = ControllerConfig(
                    name: name,
                    index: index,
                    pollingEnabled: pollingEnabled,
                    pollsPerSecond: pollsPerSecond,
                    mapEnabled: mapEnabled,
                    mapMin: mapMin,
                    mapMax: mapMax
                )
                
                print("[SwiftUvcController Daemon] Reconfigured target device: \(name) [Index: \(index)], Polling: \(pollingEnabled), PPS: \(pollsPerSecond)")
                
                selectActiveDevice()
                startPollingLoop()
            }
            
        } else if type == "command" {
            guard let payload = json["payload"] as? [String: Any],
                  let action = payload["action"] as? String else {
                return
            }
            
            processCommandOnMainThread(action: action, payload: payload)
        }
    }
    
    private func selectActiveDevice() {
        let devices = UVCController.uvcControllers() as? [UVCController] ?? []
        if currentConfig.index < devices.count {
            let target = devices[currentConfig.index]
            
            if let prev = activeDevice, prev != target {
                prev.setIsInterfaceOpen(false)
            }
            
            activeDevice = target
            target.setIsInterfaceOpen(true)
            print("[SwiftUvcController Daemon] Natively opened USB control interface for camera: \(target.deviceName() ?? "")")
        } else {
            print("[SwiftUvcController Daemon] Error: Reconfigured device index \(currentConfig.index) is out of range")
            activeDevice = nil
        }
    }
    
    private func processCommandOnMainThread(action: String, payload: [String: Any]) {
        if action == "list_devices" {
            print("[SwiftUvcController Daemon] list_devices command started")
            let controllers = UVCController.uvcControllers() as? [UVCController] ?? []
            let devArray = controllers.enumerated().map { (index, controller) -> [String: Any] in
                return [
                    "name": controller.deviceName() ?? "Unknown Camera",
                    "index": index,
                    "vendorId": Int(controller.vendorId()),
                    "productId": Int(controller.productId()),
                    "locationId": Int(controller.locationId())
                ]
            }
            activeDevice?.setIsInterfaceOpen(true)
            
            sendResponse(action: action, data: devArray)
            print("[SwiftUvcController Daemon] list_devices command finished")
            return
        }
        
        guard let device = activeDevice else {
            sendErrorResponse(action: action, message: "No active UVC device targeted.")
            return
        }
        
        if !device.isInterfaceOpen() {
            device.setIsInterfaceOpen(true)
        }
        
        if action == "get_controls" {
            print("[SwiftUvcController Daemon] get_controls command started")
            let controlsArray = getControlsArray(for: device)
            sendResponse(action: action, data: controlsArray)
            print("[SwiftUvcController Daemon] get_controls command finished")
            
        } else if action == "get_value" {
            guard let controlName = payload["control"] as? String else {
                sendErrorResponse(action: action, message: "Missing control name in payload.")
                return
            }
            print("[SwiftUvcController Daemon] get_value command started for control '\(controlName)'")
            
            guard let control = device.control(withName: controlName) else {
                sendErrorResponse(action: action, message: "Control '\(controlName)' is not implemented.")
                return
            }
            
            guard control.supportsGetValue() else {
                sendErrorResponse(action: action, message: "Control '\(controlName)' does not support reading values.")
                return
            }
            
            var responseData: Any? = nil
            var mappedValue: Any? = nil
            
            if let valObj = control.currentValue() {
                responseData = parseUVCValue(valObj)
                
                if currentConfig.mapEnabled, let rawVal = responseData {
                    var mutableMeta = getControlMetadata(control)
                    mutableMeta["current-value"] = rawVal
                    let mappedList = applyMapping([mutableMeta], mapMin: currentConfig.mapMin, mapMax: currentConfig.mapMax)
                    if let first = mappedList.first, let mv = first["mapped-value"] {
                        mappedValue = mv
                    }
                }
            }
            
            var responseFields: [String: Any] = [
                "type": "uvcResponse",
                "action": action,
                "control": controlName
            ]
            if let dataVal = responseData {
                responseFields["data"] = dataVal
            }
            if let mappedVal = mappedValue {
                responseFields["mapped-value"] = mappedVal
            }
            
            if let respData = try? JSONSerialization.data(withJSONObject: responseFields),
               let respStr = String(data: respData, encoding: .utf8) {
                wsClient?.send(message: respStr)
            }
            print("[SwiftUvcController Daemon] get_value command finished")
            
        } else if action == "set_value" {
            guard let controlName = payload["control"] as? String,
                  let rawVal = payload["value"] else {
                sendErrorResponse(action: action, message: "Missing control or value in set_value command.")
                return
            }
            print("[SwiftUvcController Daemon] set_value command started for control '\(controlName)'")
            
            guard let control = device.control(withName: controlName) else {
                sendErrorResponse(action: action, message: "Control '\(controlName)' is not implemented.")
                return
            }
            
            guard control.supportsSetValue() else {
                sendErrorResponse(action: action, message: "Control '\(controlName)' does not support setting values.")
                return
            }
            
            let valStr = formatValueToString(rawVal)
            
            var success = false
            if control.setCurrentValueFromCString(valStr.cString(using: .utf8), flags: kUVCTypeScanFlagShowWarnings) {
                success = control.writeFromCurrentValue()
            }
            
            let responseFields: [String: Any] = [
                "type": "uvcResponse",
                "action": action,
                "control": controlName,
                "status": success ? "success" : "error"
            ]
            
            if let respData = try? JSONSerialization.data(withJSONObject: responseFields),
               let respStr = String(data: respData, encoding: .utf8) {
                wsClient?.send(message: respStr)
            }
            print("[SwiftUvcController Daemon] set_value command finished")
        }
    }
    
    private func executePollOnMainThread() {
        guard currentConfig.pollingEnabled, let device = activeDevice else {
            return
        }
        
        if !device.isInterfaceOpen() {
            device.setIsInterfaceOpen(true)
        }
        
        let controlsArray = getControlsArray(for: device)
        
        let response: [String: Any] = [
            "type": "uvc_poll",
            "device": currentConfig.name,
            "data": controlsArray
        ]
        
        if let respData = try? JSONSerialization.data(withJSONObject: response),
           let respStr = String(data: respData, encoding: .utf8) {
            wsClient?.send(message: respStr)
        }
    }
    
    private func startPollingLoop() {
        pollingTimer?.cancel()
        
        guard currentConfig.pollingEnabled else { return }
        
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
        let intervalMs = max(10, Int(1000.0 / max(0.1, currentConfig.pollsPerSecond)))
        
        timer.schedule(deadline: .now(), repeating: .milliseconds(intervalMs))
        timer.setEventHandler { [weak self] in
            self?.executePollOnMainThread()
        }
        timer.resume()
        pollingTimer = timer
    }
    
    // --- Native Control Helper Mapping Utilities ---
    private func getControlsArray(for device: UVCController) -> [[String: Any]] {
        let names = UVCController.controlStrings() as? [String] ?? []
        var result: [[String: Any]] = []
        
        for name in names {
            if let control = device.control(withName: name) {
                let meta = getControlMetadata(control)
                result.append(meta)
            }
        }
        return result
    }
    
    private func getControlMetadata(_ control: UVCControl) -> [String: Any] {
        let name = control.controlName() ?? ""
        var dict: [String: Any] = [
            "name": name,
            "supportsGet": control.supportsGetValue(),
            "supportsSet": control.supportsSetValue(),
            "hasRange": control.hasRange(),
            "hasStepSize": control.hasStepSize(),
            "hasDefaultValue": control.hasDefaultValue()
        ]
        
        if control.supportsGetValue() {
            if let valObj = control.currentValue() {
                dict["current-value"] = parseUVCValue(valObj)
            }
        }
        if control.hasRange() {
            if let minObj = control.minimum() { dict["minimum"] = parseUVCValue(minObj) }
            if let maxObj = control.maximum() { dict["maximum"] = parseUVCValue(maxObj) }
        }
        if control.hasStepSize() {
            if let stepObj = control.stepSize() { dict["step-size"] = parseUVCValue(stepObj) }
        }
        if control.hasDefaultValue() {
            if let defObj = control.defaultValue() { dict["default-value"] = parseUVCValue(defObj) }
        }
        
        if currentConfig.mapEnabled {
            let mappedList = applyMapping([dict], mapMin: currentConfig.mapMin, mapMax: currentConfig.mapMax)
            if let first = mappedList.first, let mappedVal = first["mapped-value"] {
                dict["mapped-value"] = mappedVal
            }
        }
        
        return dict
    }
    
    private func parseUVCValue(_ val: UVCValue) -> Any {
        let str = val.stringValue() ?? ""
        if str.hasPrefix("{") && str.hasSuffix("}") {
            var dict: [String: Double] = [:]
            let cleaned = str.dropFirst().dropLast()
            let parts = cleaned.split(separator: ",")
            for part in parts {
                let kv = part.split(separator: "=")
                if kv.count == 2 {
                    let k = String(kv[0]).trimmingCharacters(in: .whitespacesAndNewlines)
                    let vStr = String(kv[1]).trimmingCharacters(in: .whitespacesAndNewlines)
                    if let v = Double(vStr) {
                        dict[k] = v
                    }
                }
            }
            return dict
        } else if let doubleVal = Double(str) {
            return doubleVal
        } else {
            return str
        }
    }
    
    private func formatValueToString(_ val: Any) -> String {
        if let dict = val as? [String: Any] {
            let sortedKeys = dict.keys.sorted()
            let strVals = sortedKeys.compactMap { key -> String? in
                if let v = dict[key] {
                    return "\(v)"
                }
                return nil
            }
            return "{" + strVals.joined(separator: ",") + "}"
        } else if let arr = val as? [Any] {
            let strVals = arr.map { "\($0)" }
            return "{" + strVals.joined(separator: ",") + "}"
        } else if let b = val as? Bool {
            return b ? "1" : "0"
        } else {
            return "\(val)"
        }
    }
    
    private func lerp(val: Double, inMin: Double, inMax: Double, outMin: Double, outMax: Double) -> Double {
        if inMax == inMin {
            return outMin
        }
        let res = (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
        return (res * 10000.0).rounded() / 10000.0
    }
    
    private func applyMapping(_ controls: [[String: Any]], mapMin: Double, mapMax: Double) -> [[String: Any]] {
        var mappedControls: [[String: Any]] = []
        for var ctrl in controls {
            if let val = ctrl["current-value"],
               let cMin = ctrl["minimum"],
               let cMax = ctrl["maximum"] {
                
                if let valDict = val as? [String: Any],
                   let minDict = cMin as? [String: Any],
                   let maxDict = cMax as? [String: Any] {
                    var mappedDict: [String: Double] = [:]
                    for key in valDict.keys {
                        if let v = valDict[key] as? Double ?? (valDict[key] as? Int).map(Double.init),
                           let mn = minDict[key] as? Double ?? (minDict[key] as? Int).map(Double.init),
                           let mx = maxDict[key] as? Double ?? (maxDict[key] as? Int).map(Double.init) {
                            mappedDict[key] = lerp(val: v, inMin: mn, inMax: mx, outMin: mapMin, outMax: mapMax)
                        }
                    }
                    ctrl["mapped-value"] = mappedDict
                } else if let v = val as? Double ?? (val as? Int).map(Double.init),
                          let mn = cMin as? Double ?? (cMin as? Int).map(Double.init),
                          let mx = cMax as? Double ?? (cMax as? Int).map(Double.init) {
                    ctrl["mapped-value"] = lerp(val: v, inMin: mn, inMax: mx, outMin: mapMin, outMax: mapMax)
                }
            }
            mappedControls.append(ctrl)
        }
        return mappedControls
    }
    
    private func sendResponse(action: String, data: Any) {
        let response: [String: Any] = [
            "type": "uvcResponse",
            "action": action,
            "data": data
        ]
        if let respData = try? JSONSerialization.data(withJSONObject: response),
           let respStr = String(data: respData, encoding: String.Encoding.utf8) {
            wsClient?.send(message: respStr)
        }
    }
    
    private func sendErrorResponse(action: String, message: String) {
        let response: [String: Any] = [
            "type": "uvcResponse",
            "action": action,
            "status": "error",
            "message": message
        ]
        if let respData = try? JSONSerialization.data(withJSONObject: response),
           let respStr = String(data: respData, encoding: String.Encoding.utf8) {
            wsClient?.send(message: respStr)
        }
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var controllerManager: UvcControllerManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onTextMessage: { [weak self] textMessage in
            self?.controllerManager?.handleIncomingMessage(textMessage)
        })
        
        self.wsClient = ws
        self.controllerManager = UvcControllerManager(wsClient: ws)
        self.controllerManager?.start()
        ws.connect()
    }
}

// --- Main CLI Execution ---
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

let session = Session()
session.start(host: host, port: port)

// Prevent orphan processes
Task {
    while true {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        if getppid() == 1 {
            print("[SwiftUvcController Daemon] Parent process exited. Self-terminating...")
            exit(0)
        }
    }
}

print("[SwiftUvcController Daemon] Sidecar active and listening natively...")

// Run the main GCD queue
dispatchMain()
