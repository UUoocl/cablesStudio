# Soomfon Stream Controller SE Standalone Python Operators

A collection of Cables GL operators designed for the standalone (Electron) environment to interface directly with the **Soomfon Stream Controller SE** (a rebranded Ajazz AKP03 clone) using Python.

## Included Operators

1. **`PythonSoomfonController`**: Manages the connection lifecycle of the background Python sidecar process. Listens to button presses/releases, rotary encoder knob turns, and knob clicks, and exposes a shared Connection object.
2. **`PythonSoomfonKeyTexture`**: Renders and maps a Cables WebGL texture to a single specific LCD key (0-5) on the controller.
3. **`PythonSoomfonStretchedTexture`**: Renders and tiles a single Cables WebGL texture across the physical 3x2 LCD key grid.

---

## Detailed Installation & Setup

These operators communicate directly with the USB HID interface of your Soomfon Controller, bypassing any official companion software. Follow the steps below carefully to configure your system.

### Step 1: Close Conflicting Software
Any official StreamDock / Soomfon companion application locks the USB HID interface exclusively.
*   **You must close/quit the official companion software** before starting the Cables connection.

### Step 2: Install System Dependencies (USB HID libraries)
Your system needs the C-based driver libraries to allow Python to communicate with the device over USB.

#### **On macOS (Intel & Apple Silicon)**:
1. Ensure you have **Homebrew** installed. If not, install it from [brew.sh](https://brew.sh).
2. Open Terminal and install the `libusb` and `hidapi` packages:
   ```bash
   brew install libusb hidapi
   ```
   *Note: Homebrew installs these libraries to `/opt/homebrew/lib/` (Apple Silicon) or `/usr/local/lib/` (Intel). The Python sidecar automatically sets dynamic search paths to locate them under Electron.*

#### **On Linux (Ubuntu/Debian)**:
1. Install the required system library headers and dev tools:
   ```bash
   sudo apt update
   sudo apt install libhidapi-libusb0 libhidapi-hidraw0 libusb-1.0-0-dev libudev-dev
   ```
2. Configure permissions to allow non-root users to access the device:
   * Add your user to the `plugdev` group:
     ```bash
     sudo usermod -a -G plugdev $USER
     ```
   * Create a udev rules file:
     ```bash
     sudo nano /etc/udev/rules.d/10-soomfon.rules
     ```
      Add the following lines to the file to support both the standard Ajazz and the rebranded Soomfon hardware variants:
      ```text
      # Ajazz AKP03E (standard variant)
      SUBSYSTEM=="usb", ATTRS{idVendor}=="0300", ATTRS{idProduct}=="3002", MODE="0666", GROUP="plugdev"
      # Soomfon Stream Controller SE clone
      SUBSYSTEM=="usb", ATTRS{idVendor}=="1500", ATTRS{idProduct}=="3001", MODE="0666", GROUP="plugdev"
      ```
   * Reload the udev rules and replug your device:
     ```bash
     sudo udevadm control --reload-rules
     sudo udevadm trigger
     ```

---

### Step 3: Install Python Packages
You need Python 3 installed. You must install the required dependencies using the specific Python environment that Cables is configured to run.

#### **Find the Correct Python Path**:
Check the path specified in your patch's **`Ops.Extension.Standalone.PythonConfig`** operator.
- *macOS Default Python Installer Path:* `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`
- *Linux Default Python Path:* `/usr/bin/python3`

#### **Install via Terminal**:
Call the `pip` package manager through your specific Python executable path to install the custom library `ajazz-akp03e` alongside `Pillow` and `hidapi`:

*   **On macOS (using the 3.12 Installer path as an example)**:
     ```bash
     /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install git+https://github.com/tomekceszke/ajazz-akp03e.git Pillow hidapi
     ```
     If you receive a permission error (e.g., `Permission denied`), run it with the `--user` flag:
     ```bash
     /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install --user git+https://github.com/tomekceszke/ajazz-akp03e.git Pillow hidapi
     ```

*   **On Linux / Standard Environments**:
     ```bash
     python3 -m pip install git+https://github.com/tomekceszke/ajazz-akp03e.git Pillow hidapi
     ```

---

### Step 4: Configure the Operators in Cables

1. Place the **`Ops.Extension.Standalone.PythonConfig`** operator in your patch.
2. In its properties, set **`Python Install Location`** to the absolute path of your Python executable. Click **`Start Engine`**.
3. Place the **`Ops.Extension.Standalone.PythonSoomfonController`** operator.
4. Toggle **`Active`** to `true`. Its status should update to `Connected` and output details under `Device Info`.
5. Connect the `Connection` output port of `PythonSoomfonController` to the `Connection` input port of either `PythonSoomfonKeyTexture` or `PythonSoomfonStretchedTexture`.
6. Attach a trigger to `Render` (to run every frame) and feed your WebGL `Texture` to display it on the key screens!

---

## Troubleshooting & Common Errors

### Error: `Probe failed to find any functional HID backend.`
*   **Cause**: The Python script cannot find `libhidapi.dylib` (macOS) or `libhidapi-libusb.so` (Linux) library on your system.
*   **Resolution**:
    1. Verify you ran `brew install hidapi` (macOS) or `sudo apt install libhidapi-libusb0` (Linux).
    2. Make sure you installed the python package wrapper: `python3 -m pip install hidapi`.

### Error: `Failed to import dependencies: Unable to load any of the following libraries...` (macOS SIP Issue)
*   **Cause**: On macOS, Electron spawns child processes with system paths (like `DYLD_LIBRARY_PATH`) stripped by System Integrity Protection (SIP), preventing Python's standard `hid` package from locating `libhidapi.dylib` by name.
*   **Resolution**: The `soomfon_bridge.py` includes a built-in patch that intercepts dynamic linker requests and loads the library directly from `/opt/homebrew/lib/libhidapi.dylib` (or `/usr/local/lib/libhidapi.dylib`). Ensure you have run `brew install hidapi`.

### Error: `Failed to open Soomfon device: No Ajazz AKP03E found. Is the device plugged in?`
*   **Cause**: The physical controller is not plugged in, or the official companion app is running and locking the USB interface, or the device has a different USB Vendor/Product ID.
*   **Resolution**: 
    1. Ensure the official companion software is fully closed.
    2. Unplug and replug the USB cable directly into a computer USB port (avoid unpowered USB hubs).
    3. The sidecar script automatically scans and detects both standard AKP03E (`0x0300`/`0x3002`) and Soomfon SE (`0x1500`/`0x3001`) IDs. If your device has a different ID, run `hid.enumerate()` in python to find it, and verify the connection.

### Error: `Failed to import dependencies: No module named 'ajazz_akp03e'`
*   **Cause**: The background script failed to load `ajazz_akp03e`.
*   **Resolution**: Ensure `ajazz-akp03e` is installed directly from Github source using the specified Python binary:
    `python3 -m pip install git+https://github.com/tomekceszke/ajazz-akp03e.git`
