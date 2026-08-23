# Ops.Extension.Standalone.MacOs.Hid.BmdSpeedEditor

Native macOS IOKit HID driver interface for the **Blackmagic Design DaVinci Resolve Speed Editor** keyboard and jog shuttle console.

---

## Features
- **Hardware Handshake & Authentication**: Performs the challenge-response authentication required by Blackmagic hardware.
- **Weighted Metal Jog Wheel**: Continuous high-precision rotation detection with velocity and accumulated step tracking.
- **Full Keyboard Matrix**: Reads all 43 dedicated video editing buttons simultaneously.
- **Independent LED Control**: Drives backlight LEDs for camera keys (`CAM1..CAM9`), editing actions (`CUT`, `DIS`, `TRANS`, etc.), and jog modes (`JOG`, `SHTL`, `SCRL`).
- **Battery & Charging Telemetry**: Monitors Bluetooth/USB battery percentage and power states.

---

## Ports

### Inputs
* **`Active`**: Starts or stops communication with the Speed Editor.
* **`LEDs State`**: Object mapping key names to boolean states (e.g. `{"CAM1": true, "CUT": true, "JOG": true}`).
* **`Button LEDs`**: Bitmask integer for button LED states.
* **`Jog LEDs`**: Bitmask integer for jog mode LEDs.
* **`Jog Mode`**: Controls electronic jog wheel clutch resistance (`0` = Free, `1` = Detents, `2` = Snap/Spring-back).

### Outputs
* **`On Event`**: Trigger executed on any state update.
* **`Status`**: Current device connection state.
* **`Running`**: `true` when the background driver is connected and streaming.
* **`Keys Pressed`**: Array of raw HID keycodes currently held down.
* **`Key Names`**: Array of human-readable button names currently held down.
* **`Last Key`**: Name of the most recently pressed/released button.
* **`Last Key Pressed`**: State of the last key interaction.
* **`Key Event`**: Trigger executed on any key press/release.
* **`Jog Value`**: Cumulative step position of the heavy jog wheel.
* **`Jog Delta`**: Instantaneous velocity/step change.
* **`Jog Turned`**: Trigger executed when the jog wheel rotates.
* **`Battery Level`**: Battery percentage (`0..100%`).
* **`Charging`**: `true` when the unit is connected to external power.
