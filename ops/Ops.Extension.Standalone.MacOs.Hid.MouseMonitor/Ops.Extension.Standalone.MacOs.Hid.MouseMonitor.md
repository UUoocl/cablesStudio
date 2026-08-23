# Ops.Extension.Standalone.MacOs.Hid.MouseMonitor

Monitors all global system-wide mouse movement, clicks, and scroll wheel operations across macOS in real time using native CoreGraphics event taps.

---

## Features
- **Global Cursor Tracking**: Streams live cursor coordinates (`Pos X`, `Pos Y`) across multiple monitors.
- **Click & Release Detection**: Detects Left (1), Right (2), and Center (3) mouse button clicks and releases.
- **Scroll Wheel Deltas**: Captures vertical and horizontal scrolling deltas (`Scroll Delta X`, `Scroll Delta Y`).
- **Configurable Rate Limiting**: Adjustable packets-per-second throttling (`PPS Limit`) to maintain ultra-smooth UI performance.

---

## Ports

### Inputs
* **`Active`**: Enables global mouse listening.
* **`PPS Limit`**: Max position event rate limit per second (default `20`).

### Outputs
* **`On Move`**: Trigger fired when cursor coordinates change.
* **`On Click`**: Trigger fired on mouse button press or release.
* **`On Scroll`**: Trigger fired when scroll wheel turns.
* **`Pos X` / `Pos Y`**: Absolute screen coordinates.
* **`Button`**: Index of the mouse button (`1` = Left, `2` = Right, `3` = Center).
* **`Button Is Down`**: `true` while the button is held down.
* **`Button Is Up`**: `true` upon release.
* **`Scroll Delta X` / `Scroll Delta Y`**: Scroll amounts.
* **`Running`**: `true` while the background listener is running.
* **`Status`**: Current hook status (`Running`, `Stopped`, `Failed (Accessibility?)`).
