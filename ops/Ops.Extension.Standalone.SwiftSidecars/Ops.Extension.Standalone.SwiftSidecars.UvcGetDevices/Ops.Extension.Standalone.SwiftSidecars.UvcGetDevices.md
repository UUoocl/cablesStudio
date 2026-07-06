# Ops.Extension.Standalone.SwiftSidecars.UvcGetDevices

Queries available USB Video Class (UVC) capture devices dynamically on macOS using a native Swift sidecar daemon that loads a precompiled dynamic library `libuvcutil.dylib` under the hood.

## Layout & Ports

### Inputs
- **Active** (Boolean): Spawns the native sidecar process and initiates the dynamic WebSocket connection.
- **Refresh Devices** (Trigger): Explicitly queries the device list from the daemon.

### Outputs
- **Devices** (Object): An array of objects detailing all available cameras, containing:
  - `name` (String): The friendly camera device name.
  - `index` (Number): The device selector index.
- **Device Names** (Object): A flat array of strings containing just the friendly names of connected cameras (useful for populating dropdown selections).
- **Trigger Out** (Trigger): Fires when a fresh list of devices is returned.
- **Running** (Boolean): Indicates if the native Swift daemon is active.
- **Status** (String): Detailed text status (e.g. "Found 2 device(s)", "Stopped", etc.).

## Compilation
To compile the native daemon sidecar, run:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.UvcGetDevices
swift build -c release
mkdir -p swift_bin
cp .build/release/CablesUvcGetDevices swift_bin/CablesUvcGetDevices
```
Ensure Xcode command line tools are installed on your macOS system.
