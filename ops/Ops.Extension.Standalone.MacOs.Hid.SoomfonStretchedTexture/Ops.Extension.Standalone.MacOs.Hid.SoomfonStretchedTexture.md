# Ops.Extension.Standalone.MacOs.Hid.SoomfonStretchedTexture

Captures a WebGL Texture and stretches it across the 3×2 LCD button matrix (180×120 total resolution) of a Soomfon controller device on macOS.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Connection`**: Connect to the `Connection` output of `Ops.Extension.Standalone.MacOs.Hid.SoomfonController`.
* **`Texture`**: The WebGL texture to span across the 3×2 LCD grid.
* **`Active`**: Enable or disable continuous streaming.
* **`Max FPS`**: Framerate limiter (default `30`).
* **`JPEG Quality`**: Compression ratio (`0.1` to `1.0`, default `0.85`).
* **`Flip Y`**: Flips vertical orientation (default `true`).
* **`Flip Tile X`**: Flips individual tiles horizontally (default `false`).

### Outputs
* **`Next`**: Pass-through render execution trigger.
* **`Is Sending`**: `true` while the frame payload is transmitting.
* **`Actual FPS`**: Live frame rate delivered to the hardware.
