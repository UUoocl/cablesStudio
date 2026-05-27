import Foundation
import AppKit

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
        print("[SwiftKeynoteApi Daemon] Connecting to WebSocket server at \(url.absoluteString)...")
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
        print("[SwiftKeynoteApi Daemon] WebSocket disconnected.")
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
                print("[SwiftKeynoteApi Daemon] WebSocket Send Error: \(error.localizedDescription)")
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
                print("[SwiftKeynoteApi Daemon] WebSocket lost connection: \(error.localizedDescription)")
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
            print("[SwiftKeynoteApi Daemon] Reconnecting to Cables server...")
            self.connect()
        }
        lock.unlock()
    }
}

// --- AppleScript Execution Utilities ---
final class AppleScriptRunner {
    static func run(_ source: String) -> NSAppleEventDescriptor? {
        guard let script = NSAppleScript(source: source) else { return nil }
        var error: NSDictionary? = nil
        let result = script.executeAndReturnError(&error)
        if let err = error {
            print("[AppleScript Error] \(err)")
            return nil
        }
        return result
    }
}

// --- Keynote Controller Logic ---
struct SlideInfo {
    let index: Int
    let skipped: Bool
    let presenterNotes: String
}

final class KeynoteControllerManager: @unchecked Sendable {
    private weak var wsClient: WebSocketClient?
    
    init(wsClient: WebSocketClient) {
        self.wsClient = wsClient
    }
    
    func handleIncomingMessage(_ jsonStr: String) {
        DispatchQueue.main.async { [weak self] in
            self?.processIncomingMessageOnMainThread(jsonStr)
        }
    }
    
    private func processIncomingMessageOnMainThread(_ jsonStr: String) {
        guard let data = jsonStr.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }
        
        if type == "command" {
            guard let command = json["command"] as? String else { return }
            let params = json["params"] as? [String: Any] ?? [:]
            let txId = json["txId"]
            executeCommandOnMainThread(command: command, params: params, txId: txId)
        }
    }
    
    private func executeCommandOnMainThread(command: String, params: [String: Any], txId: Any?) {
        var responseData: [String: Any] = [:]
        let action = command.lowercased()
        
        switch action {
        case "start":
            responseData = startKeynote()
        case "stop":
            responseData = stopKeynote()
        case "play":
            responseData = playPresentation()
        case "next":
            responseData = nextSlide()
        case "prev", "previous":
            responseData = prevSlide()
        case "goto":
            if let slide = params["slide"] as? Int {
                responseData = gotoSlide(adjustedNum: slide)
            } else if let slideStr = params["slide"] as? String, let slide = Int(slideStr) {
                responseData = gotoSlide(adjustedNum: slide)
            } else {
                responseData = ["status": "error", "error": "Missing or invalid slide parameter for goto command."]
            }
        case "setscene":
            if let slide = params["slide"] as? Int ?? (params["slide"] as? String).flatMap(Int.init) {
                let scene = params["scene"] as? String ?? ""
                let uuid = params["uuid"] as? String ?? ""
                responseData = setScene(adjustedNum: slide, sceneName: scene, uuid: uuid)
            } else {
                responseData = ["status": "error", "error": "Missing or invalid slide parameter for setscene command."]
            }
        case "getslides":
            responseData = getSlides()
        default:
            responseData = ["status": "error", "error": "Unsupported command request: \(command)"]
        }
        
        let status = responseData["error"] != nil ? "error" : "success"
        
        var response: [String: Any] = [
            "type": "response",
            "command": command,
            "status": status
        ]
        
        if let tx = txId {
            response["txId"] = tx
        }
        
        if status == "error" {
            response["error"] = responseData["error"] ?? "Unknown error occurred"
        } else {
            response["data"] = responseData
        }
        
        if let respData = try? JSONSerialization.data(withJSONObject: response, options: []),
           let respStr = String(data: respData, encoding: .utf8) {
            wsClient?.send(message: respStr)
        }
    }
    
    // --- Command Executors ---
    private func startKeynote() -> [String: Any] {
        if let app = NSWorkspace.shared.runningApplications.first(where: { $0.bundleIdentifier == "com.apple.iWork.Keynote" }) {
            app.activate(options: .activateIgnoringOtherApps)
            return ["status": "success", "message": "Keynote activated"]
        }
        
        if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.iWork.Keynote") {
            let configuration = NSWorkspace.OpenConfiguration()
            NSWorkspace.shared.openApplication(at: url, configuration: configuration) { _, error in
                if let error = error {
                    print("[SwiftKeynoteApi Daemon] Error launching Keynote: \(error.localizedDescription)")
                }
            }
            return ["status": "success", "message": "Keynote launched"]
        }
        
        return ["error": "Keynote application not found on this system."]
    }
    
    private func stopKeynote() -> [String: Any] {
        if let app = NSWorkspace.shared.runningApplications.first(where: { $0.bundleIdentifier == "com.apple.iWork.Keynote" }) {
            app.terminate()
            return ["status": "success", "message": "Keynote stopped"]
        }
        return ["error": "Keynote was not running"]
    }
    
    private func getRawSlides() -> [SlideInfo]? {
        let scriptSource = """
        tell application "Keynote"
          if not (exists document 1) then return "error:no_doc"
          tell document 1
            set outList to {}
            repeat with i from 1 to count of slides
              tell slide i
                set pNotes to presenter notes
                if pNotes is missing value then set pNotes to ""
                copy (skipped as text) & "|||" & (pNotes as text) to end of outList
              end tell
            end repeat
            return outList
          end tell
        end tell
        """
        
        guard let result = AppleScriptRunner.run(scriptSource) else { return nil }
        
        if result.numberOfItems == 0, let str = result.stringValue, str == "error:no_doc" {
            return nil
        }
        
        var slides: [SlideInfo] = []
        for i in 1...result.numberOfItems {
            if let str = result.atIndex(i)?.stringValue {
                let parts = str.components(separatedBy: "|||")
                let skipped = parts[0] == "true"
                let notes = parts.count > 1 ? parts[1] : ""
                slides.append(SlideInfo(index: i, skipped: skipped, presenterNotes: notes))
            }
        }
        return slides
    }
    
    private func getActiveSlideIndex() -> Int? {
        let scriptSource = """
        tell application "Keynote"
          if not (exists document 1) then return -1
          tell document 1
            return slide number of current slide
          end tell
        end tell
        """
        guard let result = AppleScriptRunner.run(scriptSource) else { return nil }
        let idx = Int(result.int32Value)
        return idx == -1 ? nil : idx
    }
    
    private func isKeynotePlaying() -> Bool {
        let scriptSource = """
        tell application "Keynote"
          if not (exists document 1) then return false
          return playing of document 1
        end tell
        """
        guard let result = AppleScriptRunner.run(scriptSource) else { return false }
        return result.booleanValue
    }
    
    private func computeAdjustedIndex(slides: [SlideInfo], targetIndex: Int) -> Int {
        var count = 0
        for slide in slides {
            if slide.index <= targetIndex {
                if !slide.skipped {
                    count += 1
                }
            } else {
                break
            }
        }
        return count
    }
    
    private func playPresentation() -> [String: Any] {
        let scriptSource = """
        tell application "Keynote"
          if not (exists document 1) then return "error:no_doc"
          tell document 1
            start
            return "success"
          end tell
        end tell
        """
        guard let result = AppleScriptRunner.run(scriptSource) else {
            return ["error": "Failed to play presentation"]
        }
        if result.stringValue == "error:no_doc" {
            return ["error": "No presentation open in Keynote"]
        }
        
        let slides = getRawSlides() ?? []
        let activeIdx = getActiveSlideIndex() ?? 1
        let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
        
        return [
            "status": "success",
            "message": "Started presentation slideshow",
            "activeIndex": adjustedActiveIndex
        ]
    }
    
    private func nextSlide() -> [String: Any] {
        guard let slides = getRawSlides() else {
            return ["error": "No presentation open in Keynote"]
        }
        
        let isPlaying = isKeynotePlaying()
        
        if isPlaying {
            let scriptSource = """
            tell application "Keynote"
              tell document 1 to show next
            end tell
            """
            _ = AppleScriptRunner.run(scriptSource)
            
            let activeIdx = getActiveSlideIndex() ?? 1
            let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
            return [
                "status": "success",
                "mode": "playing",
                "message": "Advanced slides via showNext()",
                "activeIndex": adjustedActiveIndex
            ]
        } else {
            let activeIdx = getActiveSlideIndex() ?? 1
            var nextSlideIdx: Int? = nil
            for slide in slides {
                if slide.index > activeIdx {
                    if !slide.skipped {
                        nextSlideIdx = slide.index
                        break
                    }
                }
            }
            
            if let targetIdx = nextSlideIdx {
                let scriptSource = """
                tell application "Keynote"
                  tell document 1 to set current slide to slide \(targetIdx)
                end tell
                """
                _ = AppleScriptRunner.run(scriptSource)
                let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: targetIdx)
                return [
                    "status": "success",
                    "mode": "editing",
                    "message": "Moved to slide \(adjustedActiveIndex)",
                    "activeIndex": adjustedActiveIndex
                ]
            } else {
                let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
                return ["error": "Already on the last non-skipped slide", "activeIndex": adjustedActiveIndex]
            }
        }
    }
    
    private func prevSlide() -> [String: Any] {
        guard let slides = getRawSlides() else {
            return ["error": "No presentation open in Keynote"]
        }
        
        let isPlaying = isKeynotePlaying()
        
        if isPlaying {
            let scriptSource = """
            tell application "Keynote"
              tell document 1 to show previous
            end tell
            """
            _ = AppleScriptRunner.run(scriptSource)
            
            let activeIdx = getActiveSlideIndex() ?? 1
            let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
            return [
                "status": "success",
                "mode": "playing",
                "message": "Went back slides via showPrevious()",
                "activeIndex": adjustedActiveIndex
            ]
        } else {
            let activeIdx = getActiveSlideIndex() ?? 1
            var prevSlideIdx: Int? = nil
            for slide in slides.reversed() {
                if slide.index < activeIdx {
                    if !slide.skipped {
                        prevSlideIdx = slide.index
                        break
                    }
                }
            }
            
            if let targetIdx = prevSlideIdx {
                let scriptSource = """
                tell application "Keynote"
                  tell document 1 to set current slide to slide \(targetIdx)
                end tell
                """
                _ = AppleScriptRunner.run(scriptSource)
                let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: targetIdx)
                return [
                    "status": "success",
                    "mode": "editing",
                    "message": "Moved to slide \(adjustedActiveIndex)",
                    "activeIndex": adjustedActiveIndex
                ]
            } else {
                let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
                return ["error": "Already on the first non-skipped slide", "activeIndex": adjustedActiveIndex]
            }
        }
    }
    
    private func gotoSlide(adjustedNum: Int) -> [String: Any] {
        guard let slides = getRawSlides() else {
            return ["error": "No presentation open in Keynote"]
        }
        
        var count = 0
        var realIdx: Int? = nil
        for slide in slides {
            if !slide.skipped {
                count += 1
                if count == adjustedNum {
                    realIdx = slide.index
                    break
                }
            }
        }
        
        guard let targetIdx = realIdx else {
            return ["error": "Non-skipped slide number \(adjustedNum) not found."]
        }
        
        let scriptSource = """
        tell application "Keynote"
          tell document 1 to set current slide to slide \(targetIdx)
        end tell
        """
        _ = AppleScriptRunner.run(scriptSource)
        
        return [
            "status": "success",
            "message": "Moved to slide \(adjustedNum)",
            "activeIndex": adjustedNum
        ]
    }
    
    private func setScene(adjustedNum: Int, sceneName: String, uuid: String) -> [String: Any] {
        guard let slides = getRawSlides() else {
            return ["error": "No presentation open in Keynote"]
        }
        
        var count = 0
        var realSlide: SlideInfo? = nil
        for slide in slides {
            if !slide.skipped {
                count += 1
                if count == adjustedNum {
                    realSlide = slide
                    break
                }
            }
        }
        
        guard let slide = realSlide else {
            return ["error": "Non-skipped slide number \(adjustedNum) not found."]
        }
        
        // Stop slideshow to release notes lock
        let stopScript = """
        tell application "Keynote"
          tell document 1
            try
              stop
            end try
          end tell
          try
            stop document 1
          end try
        end tell
        """
        _ = AppleScriptRunner.run(stopScript)
        
        let notes = slide.presenterNotes
        var cleanNotes = notes
        var metadata: [String: Any] = [:]
        
        if let delimiterRange = notes.range(of: "|||") {
            let metaString = String(notes[..<delimiterRange.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
            cleanNotes = String(notes[delimiterRange.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
            
            if let data = metaString.data(using: .utf8),
               let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                metadata = parsed
            } else {
                cleanNotes = notes
            }
        }
        
        metadata["Scene"] = sceneName
        if metadata["Id"] == nil && !uuid.isEmpty {
            metadata["Id"] = uuid
        }
        if metadata["Name"] == nil {
            metadata["Name"] = "Slide \(adjustedNum)"
        }
        if metadata["Section"] == nil {
            metadata["Section"] = ""
        }
        
        guard let metaData = try? JSONSerialization.data(withJSONObject: metadata, options: []),
              let metaString = String(data: metaData, encoding: .utf8) else {
            return ["error": "Failed to serialize updated slide metadata."]
        }
        
        let updatedNotes = metaString + "\n|||\n" + cleanNotes
        let escapedNotes = updatedNotes
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        
        let writeScript = """
        tell application "Keynote"
          tell document 1
            tell slide \(slide.index)
              set presenter notes to "\(escapedNotes)"
            end tell
            set current slide to slide \(slide.index)
          end tell
        end tell
        """
        
        guard let _ = AppleScriptRunner.run(writeScript) else {
            return ["error": "Failed to write slide presenter notes via AppleScript"]
        }
        
        return [
            "status": "success",
            "message": "Updated slide \(adjustedNum) with scene \(sceneName)",
            "activeIndex": adjustedNum
        ]
    }
    
    private func getSlides() -> [String: Any] {
        guard let slides = getRawSlides() else {
            return ["error": "No presentation open in Keynote"]
        }
        
        var slidesData: [[String: Any]] = []
        var nonSkippedCount = 0
        
        for slide in slides {
            if slide.skipped { continue }
            nonSkippedCount += 1
            
            let notes = slide.presenterNotes
            var cleanNotes = notes
            var metadata: [String: Any] = [:]
            
            if let delimiterRange = notes.range(of: "|||") {
                let metaString = String(notes[..<delimiterRange.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
                cleanNotes = String(notes[delimiterRange.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                
                if let data = metaString.data(using: .utf8),
                   let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    metadata = parsed
                } else {
                    cleanNotes = notes
                }
            }
            
            let slideInfo: [String: Any] = [
                "Index": nonSkippedCount,
                "Name": metadata["Name"] ?? "Slide \(nonSkippedCount)",
                "Scene": metadata["Scene"] ?? "",
                "Section": metadata["Section"] ?? "",
                "Id": metadata["Id"] ?? NSNull(),
                "Notes": cleanNotes
            ]
            slidesData.append(slideInfo)
        }
        
        let activeIdx = getActiveSlideIndex() ?? 1
        let adjustedActiveIndex = computeAdjustedIndex(slides: slides, targetIndex: activeIdx)
        
        return [
            "ActiveIndex": adjustedActiveIndex,
            "activeIndex": adjustedActiveIndex,
            "Slides": slidesData
        ]
    }
}

final class Session: @unchecked Sendable {
    var wsClient: WebSocketClient?
    var keynoteManager: KeynoteControllerManager?
    
    func start(host: String, port: Int) {
        let serverUrl = URL(string: "ws://\(host):\(port)")!
        
        let ws = WebSocketClient(url: serverUrl, onTextMessage: { [weak self] textMessage in
            self?.keynoteManager?.handleIncomingMessage(textMessage)
        })
        
        self.wsClient = ws
        self.keynoteManager = KeynoteControllerManager(wsClient: ws)
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
            print("[SwiftKeynoteApi Daemon] Parent process exited. Self-terminating...")
            exit(0)
        }
    }
}

print("[SwiftKeynoteApi Daemon] Sidecar active and listening natively...")

// Run the main GCD queue
dispatchMain()
