# Swift Contour ShuttleXpress Standalone Operator

This operator natively monitors input from the **Contour ShuttleXpress** multimedia controller in a standalone (Electron) environment using macOS's built-in `IOKit/IOHIDManager` API and a WebSocket channel.

Because it compiles into a native executable and runs directly against the OS-native HID framework, it does **not require any external packages or libraries** (such as Homebrew libusb/hidapi, Python packages, or pip installs).

---

## Installation & Setup

### Step 1: Close Conflicting Software
The official Contour Shuttle companion software locks the USB HID interface exclusively.
*   **You must close/quit the official companion software** before running this operator.

### Step 2: Build the Sidecar Binary
Since the operator uses a compiled macOS binary, it must be compiled locally:
1. Open Terminal and navigate to the operator directory:
   ```bash
   cd ops/Ops.Extension.Standalone.Swift.SwiftContourShuttleXpress/
   ```
2. Build the package:
   ```bash
   swift build -c release
   ```
3. Copy the compiled executable to the destination directory:
   ```bash
   mkdir -p swift_bin
   cp .build/release/SwiftContourShuttleXpress swift_bin/
   ```

---

## Operator Ports

### Inputs
*   **`Active`** (boolean): Set to `true` to launch the native Swift sidecar process and begin streaming events. Set to `false` to cleanly close.

### Outputs
*   **`On Event`** (trigger): Fires when any event (jog wheel, shuttle ring, or button press/release) occurs.
*   **`Status`** (string): Current operator/daemon status.
*   **`Running`** (boolean): Returns `true` if the Swift background process is active.
*   **`Jog Value`** (integer): The absolute encoder position of the jog wheel (0–255).
*   **`Jog Delta`** (integer): The relative turn amount of the jog wheel (typically `1` or `-1`).
*   **`Jog Turned`** (trigger): Fires when the jog wheel turns.
*   **`Shuttle Value`** (integer): The current position of the spring-loaded shuttle ring (-7 to 7).
*   **`Shuttle Moved`** (trigger): Fires when the shuttle ring is deflected.
*   **`Button Index`** (integer): The last button event index (0–4, corresponding to the 5 buttons from left to right).
*   **`Button Pressed`** (boolean): `true` if pressed, `false` if released.
*   **`Button Event`** (trigger): Fires when any button is pressed or released.
