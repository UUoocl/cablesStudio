# Ops.Extension.Standalone.Swift.SwiftMouseMonitor

This custom operator automatically spawns and manages a native, high-performance macOS background daemon to stream global, system-wide mouse movements, click states, and scroll wheel deltas in real-time.

---

## 1. Purpose & Design

The `SwiftMouseMonitor` operator provides zero-latency global mouse telemetry from outside the focused WebGL wrapper window boundaries. It runs completely self-contained:

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│           (Standalone Electron WebGL Wrapper)          │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true spawns daemon               │ 3. WebSocket client
    │    (swift_bin/SwiftMouseMonitor)             │    connects to server
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│                Cables Standalone Server                │
│         (HttpFileServer / WebSocket Server)            │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Spawns CoreGraphics CGEventTap            │ 4. Broadcasts global
    │    listen thread on a CFRunLoop              │    mouse events as JSON
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core OS                        │
│          (Session Window Server Daemon)                │
└────────────────────────────────────────────────────────┘
```

1. **Self-Managed Process**: Toggling the **Active** pin to `true` instantly spawns the `swift_bin/SwiftMouseMonitor` executable compiled locally in the operator directory.
2. **Native Mouse Event Tap**: The Swift daemon registers a high-speed `CGEventTap` targeting session-level events. This lets it capture absolute cursor coordinate moves, click state transitions, and scroll events system-wide.
3. **Dedicated Dispatch Thread**: To ensure maximum WebGL UI frame-rate and server stability, the input event loop runs on its own background OS thread utilizing a dedicated CoreFoundation `CFRunLoop`.
4. **High-Performance Telemetry Stream**: Telemetry events are parsed, rate-limited (to `PPS Limit` frequency), serialized as compact JSON strings, and broadcast concurrently over a WebSocket stream (`ws://127.0.0.1:8080/events`).

---

## 2. Telemetry Payload Schemas

The WebSocket receives JSON objects with the following schema mappings:

### A. Mouse Position Move
```json
{
  "type": "mousePosition",
  "data": {
    "x": 1024,
    "y": 768
  }
}
```
* Maps to **Pos X** and **Pos Y** output pins.

### B. Mouse Click State
```json
{
  "type": "mouseClick",
  "data": {
    "button": "MB1",
    "x": 1024,
    "y": 768,
    "pressed": true
  }
}
```
* Maps to **Pos X**, **Pos Y**, and formats **Click** to `"MB1 down"` or `"MB1 up"`.

### C. Scroll Wheel Movement
```json
{
  "type": "mouseScroll",
  "data": {
    "x": 1024,
    "y": 768,
    "dx": 0,
    "dy": -1
  }
}
```
* Maps to **Pos X**, **Pos Y**, and sets horizontal/vertical delta values to **Scroll Delta X** and **Scroll Delta Y**.

---

## 3. Configuration & Usage

1. **Add the Operator**: Add the `SwiftMouseMonitor` operator directly to your WebGL patch.
2. **Compile the Binary**: Ensure you have compiled the native executable in the operator folder:
   ```bash
   cd Patch/ops/Ops.Extension.Standalone.Swift.SwiftMouseMonitor
   swift build -c release
   mkdir -p swift_bin
   cp .build/release/SwiftMouseMonitor swift_bin/SwiftMouseMonitor
   ```
3. **Turn Active On**: Toggle the **Active** input pin to `true`. The operator will configure permissions (`chmod +x`), spawn the sidecar process, and open the telemetry WebSocket client connection immediately.
4. **macOS Permissions**: Global event tapping requires **Accessibility Permissions**. Ensure your Electron wrapper application or terminal is enabled under **macOS System Settings -> Privacy & Security -> Accessibility**. If permissions are missing, check the terminal or Cables console `stderr` warnings.
