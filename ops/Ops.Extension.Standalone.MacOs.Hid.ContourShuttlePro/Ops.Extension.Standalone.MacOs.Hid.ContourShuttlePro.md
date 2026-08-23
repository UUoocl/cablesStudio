# Ops.Extension.Standalone.MacOs.Hid.ContourShuttlePro

Native macOS IOKit HID driver interface for the **Contour ShuttlePRO v2** multimedia controller.

---

## Features
- **Continuous Jog Wheel**: Detects infinite incremental rotation with absolute position counter and relative delta steps (`+1/-1`).
- **Spring-Loaded Shuttle Ring**: Emits current deflection angle (`-7` to `+7`, `0` when centered).
- **15 Programmable Buttons**: Fast push/release state detection for all 15 hardware buttons (top row, center cluster, and bottom wings).

---

## Ports

### Inputs
* **`Active`**: Starts or stops listening to the ShuttlePRO hardware.

### Outputs
* **`On Event`**: Trigger fired on any input interaction.
* **`Status`**: Current connection state (`Connected: Contour ShuttlePRO v2`, `Searching...`, `Stopped`).
* **`Running`**: `true` while the native background listener is active.
* **`Jog Value`**: Cumulative step position of the inner wheel.
* **`Jog Delta`**: Step change per event (`+1` clockwise, `-1` counter-clockwise).
* **`Jog Turned`**: Trigger executed when the inner jog dial rotates.
* **`Shuttle Value`**: Current angle of the spring-loaded outer ring (`-7 .. 7`).
* **`Shuttle Moved`**: Trigger executed when the outer ring turns.
* **`Button Index`**: Index of the interacted button (`0 .. 14`).
* **`Button Pressed`**: State of the button.
* **`Button Event`**: Trigger executed on button press/release.
