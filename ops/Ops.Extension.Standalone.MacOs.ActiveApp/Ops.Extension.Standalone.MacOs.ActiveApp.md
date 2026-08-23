# Ops.Extension.Standalone.MacOs.ActiveApp

Monitors the frontmost active application and window title on macOS in real time using a native Node-API addon.

---

## Features
- **Window & App Detection**: Resolves localized application name, bundle identifier, process ID (PID), and active window title using macOS CoreGraphics window server APIs.
- **Change Triggers**: Fires `On Changed` only when the active application, window title, or focused PID transitions.
- **Configurable Polling**: Adjustable query frequency via `Interval (ms)` (100ms – 10,000ms).

---

## Ports

### Inputs
* **`Active`**: Starts or stops polling.
* **`Interval (ms)`**: Polling check interval in milliseconds (default `500`).

### Outputs
* **`Application Name`**: Localized name of the active frontmost application (e.g. `DaVinci Resolve`, `Blender`, `Google Chrome`).
* **`Bundle Identifier`**: Reverse-DNS bundle ID (e.g. `com.blackmagic-design.DaVinciResolve`, `org.blenderfoundation.blender`).
* **`Process ID`**: Numerical PID of the owner application.
* **`Window Title`**: Title of the focused window document.
* **`On Changed`**: Trigger fired whenever the focused application or window title changes.
* **`Running`**: `true` while polling is active.
* **`Status`**: Status string (`Polling`, `Stopped`, `Addon Loaded`).
