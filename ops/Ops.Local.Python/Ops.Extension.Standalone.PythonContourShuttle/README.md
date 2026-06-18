# Contour ShuttlePRO v2 Standalone Python Operator

This operator interfaces directly with the **Contour ShuttlePRO v2** multimedia controller in a standalone (Electron) environment using a background Python daemon communicating via WebSockets.

It streams real-time events from the jog wheel, shuttle ring, and all 15 buttons.

---

## Installation & Setup

Because this operator communicates directly with the USB HID interface of your controller, you must configure your system's USB HID libraries.

### Step 1: Close Conflicting Software
The official Contour Shuttle companion software locks the USB HID interface exclusively.
*   **You must quit the official Contour companion software** before running this operator.

### Step 2: Install System Dependencies
Your system needs the C-based driver libraries to allow Python to communicate with the device.

#### **On macOS (Intel & Apple Silicon)**:
1. Ensure you have **Homebrew** installed (from [brew.sh](https://brew.sh)).
2. Open Terminal and install the `libusb` and `hidapi` packages:
   ```bash
   brew install libusb hidapi
   ```
   *Note: Homebrew installs these libraries to `/opt/homebrew/lib/` (Apple Silicon) or `/usr/local/lib/` (Intel). The Python script includes a built-in pre-loader to automatically locate them under Electron.*

#### **On Linux (Ubuntu/Debian)**:
1. Install the required libraries:
   ```bash
   sudo apt update
   sudo apt install libhidapi-libusb0 libhidapi-hidraw0 libusb-1.0-0-dev libudev-dev
   ```
2. Configure permissions to allow non-root users to access the device:
   ```bash
   sudo nano /etc/udev/rules.d/99-contour.rules
   ```
   Add the following rule:
   ```text
   SUBSYSTEM=="usb", ATTRS{idVendor}=="0b33", ATTRS{idProduct}=="0030", MODE="0666", GROUP="plugdev"
   ```
3. Reload the udev rules and replug your device:
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

---

### Step 3: Install Python Dependencies
You must install the required dependencies using the specific Python environment that Cables is configured to run (configured via the **`Ops.Extension.Standalone.PythonConfig`** operator).

Call the `pip` package manager through your specific Python executable path:

*   **On macOS**:
    ```bash
    /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install hidapi websocket-client
    ```
    *(If you receive a permission error, add the `--user` flag to the command.)*

*   **On Linux**:
    ```bash
    python3 -m pip install hidapi websocket-client
    ```

---

## Operator Ports

### Inputs
*   **`Active`** (boolean): Set to `true` to spin up the private WebSocket server, launch the Python sidecar process, and connect to the device. Set to `false` to cleanly terminate the process and close the server.

### Outputs
*   **`On Event`** (trigger): Fires when any event (jog wheel turn, shuttle ring move, button press/release) occurs.
*   **`Status`** (string): Current operator/daemon status (e.g. `Stopped`, `Listening...`, `Connected: Contour ShuttlePRO v2`, `Disconnected`, `Error: ...`).
*   **`Running`** (boolean): Returns `true` if the Python background process is actively running.
*   **`Jog Value`** (integer): The absolute encoder position of the jog wheel (0–255).
*   **`Jog Delta`** (integer): The relative turn amount of the jog wheel on the current tick (typically `1` or `-1`).
*   **`Jog Turned`** (trigger): Fires when the jog wheel turns.
*   **`Shuttle Value`** (integer): The current position of the spring-loaded shuttle ring (-7 to 7).
*   **`Shuttle Moved`** (trigger): Fires when the shuttle ring deflection changes.
*   **`Button Index`** (integer): The 0-indexed number of the last button event (0–14).
*   **`Button Pressed`** (boolean): Returns `true` if the last button event was a press, `false` if it was a release.
*   **`Button Event`** (trigger): Fires when any button is pressed or released.

---

## Troubleshooting

### Error: `Failed to open ShuttlePRO v2: ...`
*   Verify that the physical controller is connected directly to your computer.
*   Verify that the official Contour driver utility is completely closed/quit.

### Error: `Missing python-hidapi` or `websocket-client`
*   Verify you ran the `pip install` commands using the **same** Python executable path that is configured in your patch's **`PythonConfig`** operator.
