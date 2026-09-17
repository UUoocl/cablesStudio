# Ops.Extension.Standalone.MacOs.Uvc.UvcController

Controls standard USB Video Class (UVC) cameras, webcams, and PTZ video capture hardware on macOS via direct in-process memory access using a native Node-API (`.node`) Objective-C++ addon.

---

## Architecture & Direct Memory Access
The `Ops.Extension.Standalone.MacOs.Uvc.UvcController` operator communicates directly with the macOS IOKit USB subsystem from Electron using a compiled Native Node-API (`.node`) addon:
- **Zero Socket Latency**: Direct function invocation without WebSocket or HTTP IPC network hops.
- **Threadsafe Telemetry Streaming**: Background worker thread polls hardware registers and dispatches state updates directly to JavaScript memory via `napi_threadsafe_function`.
- **Universal Binary Support**: Native support for Apple Silicon (`arm64`) and Intel (`x86_64`).

---

## Features
- **PTZ Camera Control**: Reads and sets Pan, Tilt, Zoom, Focus, Exposure, Brightness, Contrast, Hue, Saturation, Gamma, and White Balance.
- **Hardware Telemetry Polling**: Streams live hardware position states back into Cables at configurable rates (up to 120 Hz).
- **Auto-Normalization (`0.0` to `1.0`)**: Automatically reads device hardware minimum and maximum limits and maps all position values into a normalized `0.0 .. 1.0` range.
- **Device Target Selection**: Dynamically enumerates and addresses multiple connected UVC video devices.

---

## Ports

### Inputs
* **`Active`**: Starts or stops communication with the UVC hardware.
* **`UVC Camera Target`**: Dropdown selector of detected UVC camera devices.
* **`Poll Rate Per Second`**: Frequency (Hz) at which hardware telemetry values are queried.
* **`Normalize`**: When enabled (`true`), automatically maps all telemetry parameters (`Pan`, `Tilt`, `Zoom`, properties) from hardware min/max to `0.0 .. 1.0`.
* **`Camera Control Command`**: JSON string payload for sending parameters (e.g. `{"action": "set", "property": "zoom-absolute", "value": 150}`).
* **`Trigger Update`**: Executes transmission of the current command payload.

### Outputs
* **`Trigger Out`**: Fired on each hardware property update or command result.
* **`Result Object`**: JSON response payload for command execution.
* **`Properties Object`**: Complete telemetry dictionary of all supported camera properties and current values.
* **`Pan` / `Tilt` / `Zoom`**: Current numerical telemetry positions (raw or normalized `0..1`).
* **`Running`**: `true` while the native driver interface is actively open.
* **`Status`**: Connection state string.

---

## Compiling the Native Addon
If you modify `uvc_controller.mm` or the core sources:
```bash
cd ops/Ops.Extension.Standalone.MacOs.Uvc.UvcController
npx node-gyp rebuild
cp build/Release/uvc_controller.node uvc_controller.node
```
