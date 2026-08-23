# Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices

Queries and lists all available USB Video Class (UVC) cameras, capture cards, and webcams on macOS.

---

## Features
- **Hardware Enumeration**: Scans connected USB video devices via native IOKit interfaces.
- **Dynamic Names and Indices**: Outputs array of full device descriptors and clean string name lists for UI dropdowns.

---

## Ports

### Inputs
* **`Active`**: Starts background detection daemon.
* **`Refresh Devices`**: Manually re-scans USB bus for newly connected devices.

### Outputs
* **`Trigger Out`**: Fired when device list query completes.
* **`Devices`**: Array of device objects containing name, device ID, and index.
* **`Device Names`**: Array of human-readable camera names.
* **`Running`**: `true` while the query sidecar is running.
* **`Status`**: Status message and device count.
