# Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices

Queries and lists all available USB Video Class (UVC) cameras, capture cards, and webcams on macOS via direct memory access using a native Node-API (`.node`) Objective-C++ addon.

---

## Architecture & Direct Memory Access
The `Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices` operator communicates directly with macOS IOKit from Electron using a compiled Native Node-API (`.node`) addon:
- **Instant Query**: Synchronous hardware enumeration with zero socket latency or process overhead.
- **Universal Binary Support**: Native support for Apple Silicon (`arm64`) and Intel (`x86_64`).

---

## Features
- **Hardware Enumeration**: Scans connected USB video devices via native IOKit interfaces.
- **Dynamic Names and Indices**: Outputs array of full device descriptors and clean string name lists for UI dropdowns.

---

## Ports

### Inputs
* **`Active`**: When enabled, automatically queries device list on initialization.
* **`Refresh Devices`**: Manually re-scans USB bus for newly connected devices.

### Outputs
* **`Trigger Out`**: Fired when device list query completes.
* **`Devices`**: Array of device objects containing name, location ID, vendor ID, product ID, UVC version, and index.
* **`Device Names`**: Array of human-readable camera names.
* **`Running`**: `true` when devices have been queried.
* **`Status`**: Status message and device count.

---

## Compiling the Native Addon
If you modify `uvc_get_devices.mm` or the core sources:
```bash
cd ops/Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices
npx node-gyp rebuild
cp build/Release/uvc_get_devices.node uvc_get_devices.node
```
