# Cables Python Standalone Patch

## Description
This project provides a standalone Cables GL patch environment (`python_standalone.cables`) integrated with custom Python-driven operators. It ports hardware monitoring and camera control logic—originally written for the SlideStudio Obsidian plugin—to run natively inside the Cables GL Electron environment.

The patch exposes three primary capabilities via custom Ops:
1. **Global Keyboard Monitor** (`Ops.Extension.Standalone.PythonGlobalKeyboardMonitor`): Captures system-wide keystrokes and key combinations.
2. **Global Mouse Monitor** (`Ops.Extension.Standalone.PythonGlobalMouseMonitor`): Tracks global mouse positions, scrolling deltas, and button clicks.
3. **UVC PTZ Camera Control (macOS Only)** (`Ops.Extension.Standalone.PythonUvcPtzControl`): Bridges communication to a local UVC camera (e.g. OBSBOT Tiny 2) to control pan, tilt, zoom, and other hardware properties.

It also includes a **Python Config** Op to verify and configure the local Python environment required to run these standalone scripts.

## Usage
1. Open the `python_standalone.cables` patch within the Cables GL standalone editor.
2. The patch relies on a local Python 3 installation. The **Python Config** Op defaults the path to `/usr/bin/python3`. *(Note: On macOS, if you installed Python via the official installer, your path is likely `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`)*
3. The custom Ops automatically spawn their associated background Python scripts (located in the `pythonScripts/` directory) when the patch loads or their `Active` ports are triggered.
4. **UVC Camera Control**: Wait for the op to initialize, and then select your connected camera from the dynamic dropdown in the `UVC Camera Target` port. The Op fetches available devices automatically upon initialization or when the `Refresh Devices` button is clicked.

### Important: macOS Gatekeeper & UVC Library (Unquarantine)
If the UVC PTZ Control fails to locate your camera or throws an error indicating `library load disallowed by system policy`, macOS Gatekeeper is likely blocking the `libuvcutil.dylib` C-library due to quarantine flags.

To resolve this, open your terminal, navigate to the `pythonScripts/` directory, and run the following commands to remove the quarantine flag and locally sign the library:

```bash
xattr -d com.apple.quarantine libuvcutil.dylib
codesign --force --sign - libuvcutil.dylib
```

### Camera Control Commands
You can interact directly with the UVC script by passing JSON strings into the **Camera Control Command** port and firing the **Trigger Update** port.

**Get All Controls (includes min, max, and current values):**
```json
{"action": "get_controls"}
```
*(The result will be output on the `Result Object` port as an array detailing each control's properties like `minimum`, `maximum`, and `current-value`.)*

**Set a Specific Value (Example: Absolute Zoom):**
```json
{"action": "set_value", "control": "zoom-abs", "value": 10}
```

**Set a Compound Value (Example: Absolute Pan & Tilt):**
*(Many cameras combine Pan and Tilt into a single control that accepts an object)*
```json
{"action": "set_value", "control": "pan-tilt-abs", "value": {"pan": 86400, "tilt": 7200}}
```

**Get a Specific Value:**
```json
{"action": "get_value", "control": "pan-tilt-abs"}
```

## Developer Overview
- **Architecture**: Communication between Cables GL and the Python environment relies entirely on standard I/O streams (`stdin` / `stdout`) via the native Node.js `child_process` API.
- **Data Protocol**: The Python scripts output strictly newline-delimited JSON payloads. The custom Cables Ops listen to the `stdout` stream, parse the incoming JSON, and map the extracted data to their respective output ports.
- **Electron Sandboxing**: Because Cables GL Standalone runs inside an Electron sandbox, standard Node `require()` calls are restricted. The custom Ops utilize Cables' internal `op.require('child_process')` method to access native OS APIs.
- **Standalone Conversion**: The Python scripts (`keyboard_monitor_cables.py`, `mouse_monitor_cables.py`, `uvc_util_bridge_cables.py`) were heavily refactored to strip out their original `websockets` dependencies in favor of continuous `print()`/`sys.stdin.readline()` loops, ensuring lower latency and zero port-conflict issues.

## AI Disclaimer
> **Disclaimer**: The code, operators, and documentation in this repository were generated, refactored, and tested with the assistance of Artificial Intelligence. While efforts have been made to ensure stability, please review all scripts and native library calls for security and compatibility within your specific local environment.
