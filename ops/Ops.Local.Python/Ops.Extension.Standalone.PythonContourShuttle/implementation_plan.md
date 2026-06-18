# Contour ShuttlePRO v2 Python Standalone Operator

Create a new Cables GL standalone operator (`Ops.Extension.Standalone.PythonContourShuttle`) that interfaces with the Contour ShuttlePRO v2 multimedia controller. 

Following the pattern requested, the operator will launch a background Python sidecar process. The JS operator will start a local WebSocket server on a dynamically allocated port and pass that port to the Python script. The Python script will connect to the WebSocket server as a client and stream real-time events (jog wheel rotation, shuttle ring movement, and button states) over the connection.

## User Review Required

> [!IMPORTANT]
> The Python script depends on the following libraries, which must be installed in the target Python environment:
> 1. `hidapi` (via `pip install hidapi`)
> 2. `websocket-client` (via `pip install websocket-client`)
>
> On macOS, System Integrity Protection (SIP) blocks child processes from inheriting environment paths such as `DYLD_LIBRARY_PATH`. To ensure `ctypes` can locate the Homebrew installation of `libhidapi.dylib` (which is required by the `hid` library), we include a built-in monkey-patch in the Python script. The user must install the system library:
> ```bash
> brew install libusb hidapi
> ```

> [!WARNING]
> **Conflict with Official Contour Drivers:** The official ShuttlePRO companion application locks the USB HID interface exclusively. For this operator to receive raw HID packets, **the official companion software must be closed or disabled**.

## Open Questions

None at this time. The architecture cleanly mirrors existing patterns in the codebase (e.g., `SwiftMouseMonitor` for the WebSocket loop and `PythonSoomfonController` for the macOS-specific SIP libraries dynamic preloading).

## Proposed Changes

We will create a new operator directory under `ops/Ops.Local.Python/`.

---

### Cables Operator Component

#### [NEW] [Ops.Extension.Standalone.PythonContourShuttle.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/Ops.Extension.Standalone.PythonContourShuttle.json)
- Define metadata for the operator, specifying the name, author, library requirements, and port layout (both input and output ports).

#### [NEW] [Ops.Extension.Standalone.PythonContourShuttle.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/Ops.Extension.Standalone.PythonContourShuttle.js)
- Implement Javascript logic:
  - Initialize the private WebSocket server on port `0` (dynamic allocation).
  - Spawn the Python background script passing the resolved port.
  - Listen to WebSocket messages and map parsed JSON events to output ports (`Jog Value`, `Jog Delta`, `Shuttle Value`, `Button Index`, `Button Pressed`).
  - Gracefully clean up the child process on deletion/unload or patch stop.

#### [NEW] [README.md](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/README.md)
- Provide step-by-step setup documentation (system dependencies, library installation, operator ports, troubleshooting).

---

### Python Sidecar Bridge Component

#### [NEW] [shuttle_bridge.py](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/python_script/shuttle_bridge.py)
- Implement Python bridge logic:
  - Apply the `ctypes` pre-load monkey-patch to resolve `/opt/homebrew/lib/libhidapi.dylib` under Electron.
  - Set up argparse to parse `--port` and `--host` arguments.
  - Connect to the private local WebSocket server.
  - Open the HID connection to Contour ShuttlePRO v2 (Vendor ID: `0x0b33`, Product ID: `0x0030`).
  - Read non-blocking input reports (5 bytes) from the device:
    - Byte 0: Shuttle ring position (interpreting as signed 8-bit, from -7 to 7).
    - Byte 1: Jog wheel position (0 to 255; calculate delta with wrap-around handling).
    - Byte 2: Unused.
    - Byte 3: Button group 1 (buttons 1-8 bitmask).
    - Byte 4: Button group 2 (buttons 9-15 bitmask).
  - Stream parsed JSON events over the WebSocket connection.
  - Terminate gracefully if the WebSocket connection is severed.

## Verification Plan

### Automated / Syntax Verification
- Run syntax/compilation check on Python script using standard syntax checker (e.g. `python3 -m py_compile`).

### Manual Verification
- The user will:
  1. Close the official Contour driver.
  2. Install dependencies: `brew install libusb hidapi` and `pip install hidapi websocket-client`.
  3. Load the new `Ops.Extension.Standalone.PythonContourShuttle` operator in Cables.
  4. Toggle the **Active** input to `true`.
  5. Interact with the ShuttlePRO v2 (turning the jog wheel, rotating the shuttle ring, and pressing buttons) and verify that output ports in Cables change instantly with zero latency.
