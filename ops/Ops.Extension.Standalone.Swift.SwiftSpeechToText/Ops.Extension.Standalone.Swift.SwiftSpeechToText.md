# Ops.Extension.Standalone.Swift.SwiftSpeechToText

This custom operator integrates Apple's high-performance native **Speech Recognition Framework** to transcribe microphone input audio into text strings in real-time. It runs a completely self-contained background sidecar process and streams text results over direct WebSocket connections.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true starts private server       │ 5. Streams transcribed
    │    & spawns sidecar speech daemon            │    text segments as JSON
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│              Private Local WS Connection               │
│          (Direct, zero middleman middle-pipe)         │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Scans audio inputs using AVCaptureDevice  │ 4. Feeds buffers into
    │    and configures CoreAudio Audio Unit       │    SFSpeechRecognizer
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core Audio                     │
│          (Selected Hardware Input Device)              │
└────────────────────────────────────────────────────────┘
```

1. **Private Local Pipe**: The JS operator spins up a private WebSocket server on a dynamically allocated local port and spawns the `SwiftSpeechToText` background daemon with `--port <port>` arguments.
2. **Audio Input Device Discovery**: The Swift sidecar queries macOS system hardware for all active microphonic/line input devices dynamically using `AVCaptureDevice.DiscoverySession`.
3. **Dynamic Device Switching**: When the user selects a hardware device (e.g., USB microphone or audio interface) in the Cables **Audio Input Device** dropdown, the sidecar maps the unique device UID using CoreAudio to its raw `AudioDeviceID`. It then sets the **`kAudioOutputUnitProperty_CurrentDevice`** property on the `AVAudioEngine` input node's underlying hardware AudioUnit.
4. **Speech Recognition Feed**: An audio tap is installed on the audio input node (`inputNode.installTap`), feeding audio buffers concurrently into a `SFSpeechAudioBufferRecognitionRequest` configured for real-time partial results reporting.
5. **Decoder Updates**: As Apple's localized neural speech model decodes speech, transcription updates are captured in real-time and streamed back as JSON payloads:
   ```json
   { "type": "transcription", "text": "hello world", "isFinal": false }
   ```

---

## 2. Compilation & Building

To compile the Swift binary, run:
```bash
cd ops/Ops.Extension.Standalone.Swift.SwiftSpeechToText
swift build -c release
mkdir -p swift_bin
cp .build/release/SwiftSpeechToText swift_bin/SwiftSpeechToText
```

---

## 3. Hot-Plugging Support

- The Swift sidecar process periodically queries CoreAudio (every 3 seconds) for hardware state modifications.
- If a new USB microphone is plugged in or unplugged, the available devices list is immediately re-compiled and pushed to the Cables JS operator to refresh the dropdown in real-time without reloading the patch!
