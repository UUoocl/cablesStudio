# Ops.Extension.Standalone.MacOs.Hid.EightBitDoXboxLiteSe

Native macOS IOKit HID driver interface for the **8BitDo Lite SE** and compatible Xbox wireless/wired gamepads.

---

## Features
- **Dual Analog Sticks & Triggers**: High-precision axes (`LS X/Y`, `RS X/Y`, `LT`, `RT`).
- **All Face & System Buttons**: Discrete boolean outputs for `A`, `B`, `X`, `Y`, `D-Pad`, `LB`, `RB`, `LS/RS Click`, `Menu`, `View`, `Guide`, and `Share`.
- **4-Motor Haptic Force Feedback**: Independent control over Left/Right grip motors and Left/Right trigger motors (`0.0 .. 1.0`).

---

## Ports

### Inputs
* **`Active`**: Starts or stops listening to controller events.
* **`Rumble Left`**: Intensity of the heavy low-frequency left grip motor (`0.0 .. 1.0`).
* **`Rumble Right`**: Intensity of the high-frequency right grip motor (`0.0 .. 1.0`).
* **`Rumble Left Trigger`**: Intensity of the left trigger impulse motor.
* **`Rumble Right Trigger`**: Intensity of the right trigger impulse motor.
* **`Trigger Rumble`**: Executed to transmit rumble parameters.
* **`Send Rumble on Change`**: Automatically pushes updates when rumble values change.

### Outputs
* **`On Event`**: Trigger executed whenever any stick, trigger, or button moves.
* **`Is Connected`**: `true` when gamepad is paired and active.
* **`Status`**: Current connection state (`Connected`, `Searching...`, `Stopped`).
* **`Buttons Pressed`**: Array of button names currently held down.
* **`LS X / LS Y`**: Left analog stick coordinates (`-1.0 .. 1.0`).
* **`RS X / RS Y`**: Right analog stick coordinates (`-1.0 .. 1.0`).
* **`LT / RT`**: Analog trigger travel (`0.0 .. 1.0`).
* **Face Buttons (`A`, `B`, `X`, `Y`)**: Boolean button states.
* **D-Pad (`Up`, `Down`, `Left`, `Right`)**: Directional pad states.
* **Shoulders & Sticks (`LB`, `RB`, `LS Click`, `RS Click`)**: Bumper and stick click states.
* **System (`Menu`, `View`, `Guide`, `Share`)**: Special function buttons.
