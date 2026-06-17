# Elgato Stream Deck Standalone Python Operators

A collection of Cables GL operators designed for the standalone (Electron) environment to interface directly with Elgato Stream Decks using Python.

## Included Operators

1. **`PythonStreamDeck`**: Manages the connection lifecycle of the background Python sidecar process. Listens to button presses/releases, and exposes a shared Connection object.
2. **`PythonStreamDeckKeyTexture`**: Renders and maps a Cables WebGL texture to a single specific key on the Stream Deck.
3. **`PythonStreamDeckStretchedTexture`**: Renders and tiles a single Cables WebGL texture across the entire physical screen grid of the Stream Deck.

---

## Detailed Installation & Setup

These operators communicate directly with the USB HID interface of your Stream Deck, bypassing the official Elgato software. Please follow the steps below carefully to configure your system.

### Step 1: Close Conflicting Software
The official Elgato Stream Deck desktop application locks the USB HID interface exclusively. 
*   **You must close/quit the official Stream Deck software** before starting the Cables connection. Check your system tray/menu bar to ensure it is fully exited.

### Step 2: Install System dependencies (USB HID libraries)
Your system needs the C-based driver libraries to allow Python to communicate with the Stream Deck over USB.

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
2. Configure permissions to allow non-root users to access the Stream Deck:
   * Add your user to the `plugdev` group:
     ```bash
     sudo usermod -a -G plugdev $USER
     ```
   * Create a udev rules file:
     ```bash
     sudo nano /etc/udev/rules.d/10-streamdeck.rules
     ```
     Add the following line to the file, save, and exit:
     ```text
     SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", ATTRS{idProduct}=="*", MODE="0666", GROUP="plugdev"
     ```
   * Reload the udev rules and replug your Stream Deck:
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
Call the `pip` package manager through your specific Python executable path:

*   **On macOS (using the 3.12 Installer path as an example)**:
    ```bash
    /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install streamdeck Pillow hidapi
    ```
    If you receive a permission error (e.g. `Permission denied`), run it with the `--user` flag:
    ```bash
    /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m pip install --user streamdeck Pillow hidapi
    ```

*   **On Linux / Standard Environments**:
    ```bash
    python3 -m pip install streamdeck Pillow hidapi
    ```

---

### Step 4: Configure the Operators in Cables

1. Place the **`Ops.Extension.Standalone.PythonConfig`** operator in your patch.
2. In its properties, set **`Python Install Location`** to the absolute path of your Python executable (e.g., `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`). Click **`Start Engine`**.
3. Place the **`Ops.Extension.Standalone.PythonStreamDeck`** operator.
4. Toggle **`Active`** to `true`. Its status should update to `Connected to [Stream Deck Model Name]` and output details (like key layout) under `Device Info`.
5. Connect the `Connection` output port of `PythonStreamDeck` to the `Connection` input port of either `PythonStreamDeckKeyTexture` or `PythonStreamDeckStretchedTexture`.
6. Attach a trigger to `Render` (to run every frame) and feed your WebGL `Texture` to display it on the keys!

---

## Troubleshooting & Common Errors

### Error: `Probe failed to find any functional HID backend.`
*   **Cause**: The Python script cannot find the `libhidapi.dylib` (macOS) or `libhidapi-libusb.so` (Linux) library on your system, or the python `hidapi` package isn't installed.
*   **Resolution**: 
    1. Verify you ran `brew install hidapi` (macOS) or `sudo apt install libhidapi-libusb0` (Linux).
    2. Make sure you installed the python package wrapper: `python3 -m pip install hidapi`.

### Error: `NameError: name 'Image' is not defined`
*   **Cause**: The background script failed to load dependencies (like `Pillow`).
*   **Resolution**: Ensure `Pillow` is installed in your python environment: `python3 -m pip install Pillow`.

### Error: `Sidecar process exited with code 1` or `No Stream Decks connected.`
*   **Cause**: Either the official Elgato software is still running in the background, or your Stream Deck is plugged into a USB port that has permissions blocked.
*   **Resolution**: Fully quit the Elgato app. Try replugging the device into a direct USB port (avoid unpowered hubs).
