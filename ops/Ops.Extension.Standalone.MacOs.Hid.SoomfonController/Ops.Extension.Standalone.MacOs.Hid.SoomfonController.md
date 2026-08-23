# Ops.Extension.Standalone.MacOs.Hid.SoomfonController

Interfaces natively with **Soomfon Stream Controller / Visual Macro Keypad** devices on macOS using Apple `IOKit` / `IOHIDManager`.

---

## Description
Provides full bidirectional control for Soomfon macro controllers, including the 6 LCD visual display keys, 3 physical function keys, and 3 infinite rotary encoders with push-button clicks.

---

## Ports

### Inputs
* **`Active`**: Connects/disconnects the device.
* **`Device Index`**: Selects target device when multiple Soomfon keypads are connected.

### Outputs
* **`Connection`**: Connection bridge object passed to `SoomfonKeyTexture` and `SoomfonStretchedTexture`.
* **`Is Connected`**: `true` when the device is initialized.
* **`Status`**: Current driver connection state.
* **`Device Info`**: JSON metadata of the detected device.
* **`Key Event`**: Trigger fired on physical key press/release.
* **`Event Key Index`**: Index of the key (`0..8`).
* **`Event Pressed`**: `true` if pressed, `false` if released.
* **`Knob Event`**: Trigger fired on knob turn.
* **`Event Knob Index`**: Index of the knob (`0..2`).
* **`Event Knob Direction`**: `+1` (clockwise) or `-1` (counter-clockwise).
* **`Knob 0/1/2 Value`**: Accumulated rotary encoder step counters.
* **`Knob Click Event`**: Trigger fired on rotary knob press/release.
* **`Event Knob Click Index`**: Index of the clicked knob (`0..2`).
* **`Event Knob Click Pressed`**: State of the knob switch.
