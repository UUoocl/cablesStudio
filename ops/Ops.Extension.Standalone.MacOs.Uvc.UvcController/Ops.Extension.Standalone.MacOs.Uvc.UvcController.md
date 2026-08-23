# Ops.Extension.Standalone.MacOs.Uvc.UvcController

Controls standard USB Video Class (UVC) cameras, webcams, and PTZ video capture hardware on macOS.

---

## Features
- **PTZ Camera Control**: Reads and sets Pan, Tilt, Zoom, Focus, Exposure, Brightness, Contrast, Hue, Saturation, Gamma, and White Balance.
- **Hardware Telemetry Polling**: Streams live hardware position states back into Cables.
- **Device Target Selection**: Dynamically enumerates and addresses multiple connected UVC video devices.

---

## Ports

### Inputs
* **`Active`**: Starts or stops communication with the UVC hardware.
* **`UVC Camera Target`**: Dropdown selector of detected UVC camera devices.
* **`Poll Rate Per Second`**: Frequency (Hz) at which hardware telemetry values are queried.
* **`Camera Control Command`**: JSON string payload for sending parameters (e.g. `{"action": "set", "property": "absolute_zoom", "value": 150}`).
* **`Trigger Update`**: Executes transmission of the current command payload.

### Outputs
* **`Trigger Out`**: Fired on each hardware property update or command result.
* **`Result Object`**: JSON response payload for command execution.
* **`Properties Object`**: Complete telemetry dictionary of all supported camera properties and current values.
* **`Pan` / `Tilt` / `Zoom`**: Current numerical telemetry positions.
* **`Running`**: `true` while the daemon is actively connected.
* **`Status`**: Connection state string.
