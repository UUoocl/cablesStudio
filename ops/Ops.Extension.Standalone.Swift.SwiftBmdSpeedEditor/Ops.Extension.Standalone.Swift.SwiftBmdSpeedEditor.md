# Swift Blackmagic DaVinci Resolve Speed Editor Standalone Operator

This operator natively monitors input from the **Blackmagic Design DaVinci Resolve Speed Editor** multimedia controller in a standalone (Electron) environment using macOS's built-in `IOKit/IOHIDManager` API and a WebSocket channel.

Because it compiles into a native executable and runs directly against the OS-native HID framework, it does **not require any external packages or libraries** (such as Homebrew libusb/hidapi, Python packages, or pip installs). It performs the proprietary challenge-response authentication handshake in Swift to unlock the device.

---

## Installation & Setup

### Step 1: Close Conflicting Software
*   **You must close/quit DaVinci Resolve** before running this operator, as Resolve claims exclusive control over the device and its handshake.

### Step 2: Build the Sidecar Binary
Since the operator uses a compiled macOS binary, it must be compiled locally:
1. Open Terminal and navigate to the operator directory:
   ```bash
   cd ops/Ops.Extension.Standalone.Swift.SwiftBmdSpeedEditor/
   ```
2. Build the package:
   ```bash
   swift build -c release
   ```
3. Copy the compiled executable to the destination directory:
   ```bash
   mkdir -p swift_bin
   cp .build/release/SwiftBmdSpeedEditor swift_bin/
   ```

---

## Operator Ports

### Inputs
*   **`Active`** (boolean): Set to `true` to launch the native Swift sidecar process, perform the challenge-response unlock handshake, and begin streaming events. Set to `false` to cleanly close.
*   **`Button LEDs`** (integer): A 32-bit bitfield controlling standard key LEDs (e.g. CUT, SMOOTH_CUT, CAM1-9, etc).
*   **`Jog LEDs`** (integer): A 3-bit bitfield controlling JOG, SHTL, and SCRL LEDs on the search dial.
*   **`Jog Mode`** (integer): Selects the jog wheel reporting mode (Relative or Absolute).

### Outputs
*   **`On Event`** (trigger): Fires when any event occurs.
*   **`Status`** (string): Current operator/daemon status.
*   **`Running`** (boolean): Returns `true` if the Swift background process is active.
*   **`Keys Pressed`** (array): List of numerical keycodes currently held down.
*   **`Key Names`** (array): List of friendly key names currently held down.
*   **`Last Key`** (string): Friendly name of the last key state change.
*   **`Last Key Pressed`** (boolean): `true` if pressed, `false` if released.
*   **`Key Event`** (trigger): Fires when any key is pressed or released.
*   **`Jog Value`** (integer): The absolute position value of the jog wheel.
*   **`Jog Delta`** (integer): The relative movement value since the last frame.
*   **`Jog Turned`** (trigger): Fires when the jog wheel is turned.
*   **`Battery Level`** (integer): Internal battery charge level (0-100).
*   **`Charging`** (boolean): `true` if the unit is charging via USB.
