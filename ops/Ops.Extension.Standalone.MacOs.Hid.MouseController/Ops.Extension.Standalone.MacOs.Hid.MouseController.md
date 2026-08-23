# Ops.Extension.Standalone.MacOs.Hid.MouseController

Generates synthetic OS-level mouse movements, clicks, drags, and scrolling events across all macOS displays using native CoreGraphics event generation.

---

## Features
- **Cursor Positioning**: Moves cursor to absolute coordinates (`x`, `y`).
- **Click & Drag**: Supports left, right, and center mouse down/up/click/drag actions.
- **Scroll Wheel**: Generates vertical and horizontal scroll wheel deltas (`scrollX`, `scrollY`).

---

## Ports

### Inputs
* **`Active`**: Enables mouse emission.
* **`Emit`**: Trigger to emit the mouse event.
* **`Mouse Object`**: Object configuring the event:
  * `{ "action": "move", "x": 500, "y": 300 }`
  * `{ "action": "click", "button": "left" }`
  * `{ "action": "scroll", "scrollY": -5 }`

### Outputs
* **`On Emitted`**: Trigger executed when emission completes.
* **`Emitted Mouse`**: Echo of the executed mouse parameters.
* **`Running`**: `true` while the driver is loaded and active.
* **`Status`**: Current runtime status.
