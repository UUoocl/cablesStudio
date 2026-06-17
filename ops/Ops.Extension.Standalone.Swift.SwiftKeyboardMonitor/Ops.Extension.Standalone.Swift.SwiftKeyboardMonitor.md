# Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor

This custom operator automatically spawns and manages a native, high-performance macOS background daemon to stream global, system-wide keyboard events and hotkey combinations in real-time.

---

## 1. Purpose & Design

The `SwiftKeyboardMonitor` operator provides zero-latency global keyboard input telemetry from outside the focused WebGL wrapper window boundaries. It runs completely self-contained:

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│         (Standalone Electron JS Op Environment)        │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true starts private server       │ 3. WebSocket client
    │    & spawns daemon with dynamic port         │    connects directly to
    │    argument                                  │    the private port
    │                                              │
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│               Private WebSocket Server                 │
│          (Spawned on Port 0, localhost only)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 2. Spawns CoreGraphics CGEventTap            │ 4. Streams global
    │    listen thread on a CFRunLoop              │    keyboard events as JSON
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core OS                        │
│          (Session Window Server Daemon)                │
└────────────────────────────────────────────────────────┘
```

1. **Self-Managed Process**: Toggling the **Active** pin to `true` instantly starts a private, dynamic WebSocket Server bound to `127.0.0.1` on port `0` (dynamic port allocation) and spawns the `swift_bin/SwiftKeyboardMonitor` executable.
2. **Dynamic Client Connection**: The JS operator passes the assigned port to the Swift daemon via `--port`. The Swift process then establishes a direct, 1-hop client connection to the local WebSocket server.
3. **Native Keyboard Event Tap**: The Swift daemon registers a high-speed `CGEventTap` targeting session-level events. This lets it capture absolute key presses, releases, and modifier key shifts globally.
4. **Dedicated Dispatch Thread**: To ensure maximum WebGL UI frame-rate and server stability, the input event loop runs on its own background OS thread utilizing a dedicated CoreFoundation `CFRunLoop`.
5. **Advanced Modifiers and Combo Caching**: The daemon captures modifier shifts (`Ctrl`, `Alt`, `Shift`, `Cmd`) dynamically, caching modifier flags thread-safely. When a regular key is pressed or released, it instantly formats the complete combo string (e.g. `"ctrl + shift + a"`) and broadcasts it down to the UI operator via WebSockets.

---

## 2. Telemetry Payload Schemas

The WebSocket receives JSON objects with the following schema mappings:

### A. Key Press Event
```json
{
  "type": "keyboardPress",
  "data": {
    "combo": "ctrl + alt + delete",
    "key": "delete",
    "modifiers": "ctrl + alt",
    "event": "press"
  }
}
```
* Fires the **On Press** trigger output pin, and updates **Combo**, **Key**, and **Modifiers** string outputs.

### B. Key Release Event
```json
{
  "type": "keyboardRelease",
  "data": {
    "combo": "ctrl + alt + delete",
    "key": "delete",
    "modifiers": "ctrl + alt",
    "event": "release"
  }
}
```
* Fires the **On Release** trigger output pin, and updates **Combo**, **Key**, and **Modifiers** string outputs.

---

## 3. Configuration & Usage

1. **Add the Operator**: Add the `SwiftKeyboardMonitor` operator directly to your WebGL patch.
2. **Compile the Binary**: Ensure you have compiled the native executable in the operator folder:
   ```bash
   cd Patch/ops/Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor
   swift build -c release
   mkdir -p swift_bin
   cp .build/release/SwiftKeyboardMonitor swift_bin/SwiftKeyboardMonitor
   ```
3. **Turn Active On**: Toggle the **Active** input pin to `true`. The operator will configure permissions (`chmod +x`), spawn the sidecar process, and open the telemetry WebSocket client connection immediately.
4. **macOS Permissions**: Global event tapping requires **Accessibility Permissions**. Ensure your Electron wrapper application or terminal is enabled under **macOS System Settings -> Privacy & Security -> Accessibility**. If permissions are missing, check the terminal or Cables console `stderr` warnings.
