# SwiftMouseController

Controls the physical mouse cursor position, emits virtual clicks and drags, and scrolls globally on macOS using CGEvent synthesis and a high-performance native background sidecar process.

## Description

This operator utilizes a private WebSocket server to send text commands to a compiled macOS Swift sidecar executable. The sidecar synthesizes the virtual mouse movement, dragging, click, and scrolling events using CoreGraphics C-APIs (`CGEvent`) and posts them globally to the macOS Window Server.

This allows Cables standalone applications to control external macOS interfaces, simulate clicks in other tools, automate dragging, and perform smooth horizontal or vertical scrolling.

## Inputs

* **Active**: Starts or stops the native Swift MouseController sidecar process and its WebSocket server.
* **Emit**: Fires a trigger to synthesize and emit the virtual mouse actions globally.
* **Mouse Object**: A JSON object specifying the mouse actions to perform.

  **Example Mouse Objects:**
  *Move Cursor to Coordinate:*
  ```json
  {
    "x": 800,
    "y": 450
  }
  ```
  
  *Perform a Right Click at Current Position:*
  ```json
  {
    "button": "right",
    "action": "click"
  }
  ```
  
  *Drag Left Button to Coordinate:*
  ```json
  {
    "x": 1024,
    "y": 768,
    "button": "left",
    "action": "drag"
  }
  ```
  
  *Scroll Down Vertically by 5 Lines:*
  ```json
  {
    "scrollY": -5
  }
  ```

## Outputs

* **Emitted Mouse**: An object echoing the last successfully emitted mouse state configuration.
* **On Emitted**: Fires a trigger every time a virtual mouse event is successfully emitted globally.
* **Running**: True if the native mouse control sidecar process is running.
* **Status**: Human-readable status of the Swift sidecar process (e.g. Spawning, Running, Stopped).

---

## Supported Object Properties

The sidecar performs case-insensitive parsing and supports the following optional keys in the **Mouse Object**:

* **`x`** (Number, Optional): Target absolute horizontal coordinate on the primary monitor.
* **`y`** (Number, Optional): Target absolute vertical coordinate on the primary monitor.
* **`button`** (String, Optional): The mouse button target:
  - `"left"` (Default)
  - `"right"`
  - `"middle"` (Mouse wheel button click)
* **`action`** (String, Optional): The click or movement type to synthesize:
  - `"move"`: Warps cursor to `(x, y)` position. (Default if `x` or `y` is present and no button action is specified).
  - `"drag"`: Performs cursor drag to `(x, y)` with the specified `button` held down.
  - `"click"`: Synthesizes a mouse-down followed by a mouse-up at the target position.
  - `"down"`: Synthesizes a mouse-down without releasing it.
  - `"up"`: Synthesizes a mouse-up releasing the held button.
* **`scrollX`** (Number, Optional): Horizontal scrolling delta (measured in lines, positive scrolls right, negative left).
* **`scrollY`** (Number, Optional): Vertical scrolling delta (measured in lines, positive scrolls up, negative down).

---

## System Requirements & Accessibility Entitlements

> [!IMPORTANT]
> Synthesizing global virtual mouse clicks and cursor movement requires macOS Accessibility entitlements.
> When executing, you may be prompted to allow the parent application (Cables Studio or the exported standalone binary) in:
> **System Settings ➔ Privacy & Security ➔ Accessibility**
> If the mouse event fails to emit, ensure this permission is turned ON for the parent application.

---

## Technical Details & Performance Optimizations

1. **HID Integration**: Mouse event synthesis is injected directly into the Human Interface Device (HID) layer using `CGEvent.post(tap: .cghidEventTap)`. This ensures that virtual mouse events behave exactly like physical hardware coordinates and interact with active windows normally.
2. **Timing Control**: For clicks, the native binary executes a subtle 10-millisecond delay (`usleep(10000)`) between down and up events, ensuring the operating system and targeted GUI widgets fully register the click.
3. **Automatic Orphan Garbage Collection**: The native sidecar monitors its parent process PID. If the parent Cables application exits, the sidecar instantly self-terminates (`getppid() == 1`), avoiding background zombie processes.
