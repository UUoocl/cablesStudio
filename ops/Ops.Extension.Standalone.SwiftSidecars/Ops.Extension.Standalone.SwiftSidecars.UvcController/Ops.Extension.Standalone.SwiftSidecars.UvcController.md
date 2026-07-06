# Ops.Extension.Standalone.SwiftSidecars.UvcController

Controls UVC camera hardware properties (Pan, Tilt, Zoom, exposure, etc.) using a native high-speed Swift sidecar daemon. Communication is routed over private local WebSocket servers to avoid Electron sandboxing restrictions and performance overhead.

## Layout & Ports

### Inputs
- **Active** (Boolean): Starts the WebSocket server, launches the daemon, and enables background polling.
- **UVC Camera Target** (String Dropdown): Dynamically populated dropdown listing the connected UVC cameras.
- **Poll Rate Per Second** (Number): Frequency (in Hz) at which the camera parameters are fetched.
- **Camera Control Command** (String JSON): Command payload to set or query properties (e.g. `{"action": "set_value", "control": "zoom-abs", "value": 10}`).
- **Trigger Update** (Trigger): Dispatches the command in the JSON input to the active camera.

### Outputs
- **Trigger Out** (Trigger): Fires when a poll event or command response arrives.
- **Result Object** (Object): The parsed response object from the sidecar.
- **Properties Object** (Object): Key-value dictionary containing all active UVC control values mapped by name.
- **Pan** (Number): Current pan position of the camera.
- **Tilt** (Number): Current tilt position of the camera.
- **Zoom** (Number): Current zoom level of the camera.
- **Running** (Boolean): Daemon connection status.
- **Status** (String): Detailed sidecar logs.

## Command Schemas

### Get All Controls
```json
{"action": "get_controls"}
```

### Set Specific Value (e.g., Absolute Zoom)
```json
{"action": "set_value", "control": "zoom-abs", "value": 10}
```

### Set Combined Value (e.g., Pan & Tilt)
```json
{"action": "set_value", "control": "pan-tilt-abs", "value": {"pan": 86400, "tilt": 7200}}
```

## Compilation
To compile the sidecar:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.UvcController
swift build -c release
mkdir -p swift_bin
cp .build/release/CablesUvcController swift_bin/CablesUvcController
```
