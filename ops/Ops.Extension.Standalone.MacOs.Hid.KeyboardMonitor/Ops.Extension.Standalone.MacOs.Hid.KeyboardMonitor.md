# Ops.Extension.Standalone.MacOs.Hid.KeyboardMonitor

Monitors all global system-wide keystrokes and keyboard shortcut combinations across macOS in real time using native CoreGraphics event taps.

---

## Features
- **Global Key Interception**: Captures key down and key up events from any application running on macOS.
- **Modifier Combination Parsing**: Detects modifier flags (Command, Option, Control, Shift) and outputs normalized combos (e.g. `CMD+SHIFT+A`).
- **Discrete Press/Release Triggers**: Independent triggers for `On Press` and `On Release`.

---

## Ports

### Inputs
* **`Active`**: Enables or disables the global keyboard hook.

### Outputs
* **`On Press`**: Trigger executed when a key is pressed down.
* **`On Release`**: Trigger executed when a key is released.
* **`Combo`**: Complete formatted key combo string (e.g. `CMD+K`, `ALT+SPACE`).
* **`Key`**: Individual base key character or name.
* **`Modifiers`**: Comma-separated list of active modifier keys.
* **`Running`**: `true` while the background listener is running.
* **`Status`**: Current hook status (`Running`, `Stopped`, `Failed (Accessibility?)`).
