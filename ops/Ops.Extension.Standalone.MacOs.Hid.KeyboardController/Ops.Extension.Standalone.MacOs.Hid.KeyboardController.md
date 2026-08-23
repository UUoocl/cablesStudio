# Ops.Extension.Standalone.MacOs.Hid.KeyboardController

Emits synthetic keyboard events, character inputs, and key combinations with modifier flags (Command, Option, Control, Shift) on macOS via CoreGraphics event taps.

---

## Features
- **Full Keystroke Generation**: Generates native OS-level key down/up events.
- **Modifier Combination Support**: Supports `"cmd"`, `"alt"` / `"option"`, `"ctrl"`, `"shift"`, and multiple combinations (e.g. `"cmd+shift"`).
- **Keystroke Object Format**: Accepts `{ "key": "c", "modifiers": "cmd" }` or `{ "key": "Enter" }`.

---

## Ports

### Inputs
* **`Active`**: Enables keyboard event emission.
* **`Emit`**: Trigger to send the keystroke event.
* **`Keystroke Object`**: Object containing `"key"` and optional `"modifiers"`.

### Outputs
* **`On Emitted`**: Trigger executed when keystroke emission completes.
* **`Emitted Keystroke`**: Formatted string of the emitted key combo (e.g. `CMD+C`).
* **`Running`**: `true` while the driver is loaded and active.
* **`Status`**: Current runtime status.
