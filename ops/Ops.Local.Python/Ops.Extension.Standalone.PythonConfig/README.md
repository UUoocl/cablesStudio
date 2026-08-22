# Python Configuration Standalone Operator

`Ops.Extension.Standalone.PythonConfig`

## Purpose

The **Python Config** operator serves as the central configuration and environment validator for all Python-based standalone operators in Cables GL (such as Global Keyboard/Mouse Monitors, Stream Deck, Soomfon Controller, Contour Shuttle, 8BitDo Controller, and UVC PTZ Camera Control).

It sets and manages the patch-wide `op.patch.pythonStandaloneExecutable` variable, ensuring all child processes spawned by downstream Python operators use the correct and verified Python 3 runtime on your system.

---

## Description

In the standalone Electron environment of Cables GL, Python operators spawn background sidecar processes using standard I/O streams. The `PythonConfig` operator performs the following tasks:

1. **Path Verification**: Checks whether the specified Python executable path exists on disk.
2. **Runtime Validation**: Executes `<python_path> --version` via Node's `child_process.exec` to confirm that the binary is functional and report the detected version string (e.g., `Found: Python 3.12.3`).
3. **Global Registration**: Assigns the verified path to `op.patch.pythonStandaloneExecutable` so all other standalone Python ops automatically inherit it without requiring individual path configuration.
4. **Lifecycle Triggers**: Provides `Start Engine` and `Stop Engine` triggers to coordinate the initialization or teardown of downstream Python services.

---

## Port Reference

### Inputs
- **Python Install Location** (`String`): The absolute path to the Python 3 binary on your system.
  - *macOS Default:* `/usr/bin/python3`
  - *macOS Python.org Framework:* `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3` (or corresponding version)
  - *macOS Homebrew:* `/opt/homebrew/bin/python3` (Apple Silicon) or `/usr/local/bin/python3` (Intel)
  - *Linux Default:* `/usr/bin/python3`
  - *Windows Default:* `C:\Python312\python.exe` or `%LOCALAPPDATA%\Programs\Python\Python312\python.exe`
- **Start Engine** (`TriggerButton`): Fires the `On Started` output trigger to initialize connected Python operators.
- **Stop Engine** (`TriggerButton`): Sets the status to `"Stopped"` and fires the `On Stopped` trigger to shut down connected Python operators.

### Outputs
- **Status** (`String`): Current status of the executable verification (e.g., `"Found: Python 3.12.3"`, `"Path not found"`, `"Executable invalid: ..."`, `"Stopped"`).
- **Found** (`Boolean`): `true` if the binary was found and successfully reported its version; `false` otherwise.
- **On Started** (`Trigger`): Emitted when the `Start Engine` button is clicked.
- **On Stopped** (`Trigger`): Emitted when the `Stop Engine` button is clicked.

---

## Dependency Installation: `pynput` and `websocket-client`

Several downstream operators require Python libraries such as `pynput` (for system-wide mouse and keyboard monitoring/controlling) and `websocket-client` (for WebSocket bridge communications).

You **must** install these packages into the **exact Python environment** configured in this operator.

### 1. Install via Terminal using your Target Python Executable

To prevent installing packages into the wrong Python environment, invoke `pip` directly through the specific Python executable path you configured in `Python Install Location`.

#### **macOS (Official Python Installer / Framework)**
```bash
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install pynput websocket-client
```
*If you encounter permission errors, append the `--user` flag:*
```bash
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install --user pynput websocket-client
```

#### **macOS (Homebrew Python)**
```bash
/opt/homebrew/bin/python3 -m pip install pynput websocket-client
```

#### **Linux (Ubuntu / Debian)**
```bash
# Ensure pip is available
sudo apt update && sudo apt install python3-pip

# Install packages
python3 -m pip install pynput websocket-client
```

#### **Windows**
```cmd
python -m pip install pynput websocket-client
```
*Or using the full path:*
```cmd
"C:\Program Files\Python312\python.exe" -m pip install pynput websocket-client
```

---

## Special Permissions Note (macOS)

When using operators that rely on **`pynput`** (such as `PythonGlobalKeyboardMonitor` or `PythonGlobalMouseMonitor`), macOS requires explicit user permissions:

1. Open **System Settings > Privacy & Security**.
2. Under **Accessibility**, ensure that **Cables** (or the Electron runner / Terminal) is enabled.
3. Under **Input Monitoring**, grant permission to **Cables** to allow capturing global keyboard events.
4. Restart Cables after granting permissions if events are not detected.

---

## Troubleshooting

- **`Path not found`**: Ensure the path in `Python Install Location` is an absolute path to the executable, not just a directory.
- **`Executable invalid`**: Verify that the file at the path has execute permissions (`chmod +x <path>`) and is a valid Python 3 binary.
- **`ModuleNotFoundError: No module named 'pynput'` or `'websocket'`**: Verify that you ran `pip install` using the exact Python path specified in this operator (`<configured_python_path> -m pip install pynput websocket-client`).
