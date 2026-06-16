# Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor

This custom operator connects to the native, high-performance macOS backend daemon via WebSockets to stream global system-wide keyboard events and hotkey combination combos in real-time.

---

## 1. Purpose & Design

The `SwiftKeyboardMonitor` operator provides zero-latency global keyboard input telemetry from outside the Cables focused window boundaries. It is fully integrated with the consolidated native Swift sidecar daemon:

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│           (Standalone Electron WebGL Wrapper)          │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. startServer() triggers daemon             │ 3. Establishes
    │    (handled by SwiftServer operator)         │    WebSocket client
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│               Swift 6 Background Agent                 │
│         (Hummingbird HTTP & WebSocket Server)          │
└────────────────────────────────────────────────────────┘
    │                                              │
    │ 2. Spawns CoreGraphics CGEventTap            │ 4. Broadcasts global
    │    listen thread on a CFRunLoop              │    keyboard events as JSON
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core OS                        │
│          (Session Window Server Daemon)                │
└────────────────────────────────────────────────────────┘
```

1. **Native Keyboard Event Tap**: The Swift daemon registers a high-speed `CGEventTap` targeting session-level events. This lets it capture absolute key presses, releases, and modifier key shifts globally.
2. **Dedicated Dispatch Thread**: To ensure maximum WebGL UI frame-rate and server request processing stability, the input event loop runs on its own background OS thread utilizing a dedicated CoreFoundation `CFRunLoop`.
3. **Advanced Modifiers and Combo Caching**: The daemon captures modifier shifts (`Ctrl`, `Alt`, `Shift`, `Cmd`) dynamically, caching modifier flags thread-safely. When a regular key is pressed, it instantly formats the complete combo string (e.g. `"ctrl + shift + a"`) and broadcasts it down to the UI operator via WebSockets.
4. **Lightweight WebSocket Client**: The `SwiftKeyboardMonitor` operator opens a browser WebSocket connection directly to the telemetry server (`ws://127.0.0.1:8080/events`). It streams events and fires press/release triggers straight into your WebGL canvas.

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

1. **Activate the Server**: First, load and trigger the `SwiftServer` operator to compile and boot the background daemon binary.
2. **Place the Monitor**: Add the `SwiftKeyboardMonitor` operator to your patch.
3. **Turn Active On**: Toggle **Active** to true. The operator will open a WebSocket connection to the sidecar, immediately streaming system-wide coordinates and clicks!
4. **macOS Permissions**: Global event tapping requires **Accessibility Permissions**. Ensure your Electron wrapper application or terminal is enabled under **macOS System Settings -> Privacy & Security -> Accessibility**. If permissions are missing, check the terminal `stderr` logs for action-oriented warnings.
