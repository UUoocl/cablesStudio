# Walkthrough - Contour ShuttlePRO v2 Standalone Operator

We have successfully implemented the new `Ops.Extension.Standalone.PythonContourShuttle` operator. This operator allows Cables GL running in the standalone Electron environment to receive inputs from the Contour ShuttlePRO v2 device via a background Python daemon communicating over local WebSockets.

## What Was Created

### 1. [Ops.Extension.Standalone.PythonContourShuttle.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/Ops.Extension.Standalone.PythonContourShuttle.json)
- The metadata definition file mapping the operator's inputs (`Active`) and outputs (`Status`, `Running`, `Jog Value`, `Jog Delta`, `Jog Turned` trigger, `Shuttle Value`, `Shuttle Moved` trigger, `Button Index`, `Button Pressed`, `Button Event` trigger).

### 2. [Ops.Extension.Standalone.PythonContourShuttle.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/Ops.Extension.Standalone.PythonContourShuttle.js)
- The main operator JavaScript class that runs inside Node.js / Electron.
- Automatically spins up a private local WebSocket server listening on a dynamic port (`port: 0` to auto-allocate a free port).
- Spawns the background Python daemon, passing the port parameter as an argument.
- Listens to incoming event packets over the WebSocket and updates the Cables output ports accordingly.
- Cleanly closes connections and terminates the child process on deletion, deactivate, or patch exit.

### 3. [shuttle_bridge.py](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/python_script/shuttle_bridge.py)
- The Python script spawned as a background process.
- Implements the custom `ctypes` pre-loading monkey-patch to ensure `hidapi` is located successfully under macOS Electron environments.
- Establishes a client WebSocket connection to the local Cables server.
- Opens the ShuttlePRO v2 HID device (`vendor_id=0x0b33`, `product_id=0x0030`).
- Performs non-blocking byte reads to track changes in jog position, shuttle deflection, and all 15 buttons.
- Packs the events as JSON and streams them immediately over the WebSocket connection.
- **API Compatibility Update**: Configured to dynamically support both Python `hid` library variants:
  - `hidapi` library (which uses lowercase `hid.device()` instance and `.set_nonblocking(True)`)
  - `hid` library (which uses capitalized `hid.Device()` constructor and `.nonblocking = True` property)

### 4. [README.md](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/README.md)
- Complete setup and configuration instructions, detailing dependencies, OS-specific permissions (udev rules for Linux, Homebrew `hidapi` for macOS), and port descriptions.

---

## Verification and Testing

### 1. Syntax Check
We ran the standard Python compilation checker on the bridge script, and it compiled successfully without any errors:
```bash
python3 -m py_compile shuttle_bridge.py
```

### 2. Manual Verification Instructions
To test the operator:
1. Make sure you close the official Contour Shuttle app if it's currently running (to release exclusive HID access).
2. Install the necessary packages:
   - On macOS: `brew install libusb hidapi`
   - In your python environment: `pip install hidapi websocket-client` (or if you already have the `hid` package installed, that works too!)
3. Launch Cables, and instantiate the `Ops.Extension.Standalone.PythonConfig` operator to verify your Python executable is set correctly.
4. Place the new `Ops.Extension.Standalone.PythonContourShuttle` operator.
5. Set the `Active` checkbox to `true`. The status should change to `Connected: Contour ShuttlePRO v2`.
6. Turn the jog wheel, rotate the shuttle ring, and press the buttons to see the output ports update in real-time in the editor!
