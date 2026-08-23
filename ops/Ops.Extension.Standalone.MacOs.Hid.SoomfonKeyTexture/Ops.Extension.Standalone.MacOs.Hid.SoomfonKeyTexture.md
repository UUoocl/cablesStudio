# Ops.Extension.Standalone.MacOs.Hid.SoomfonKeyTexture

Captures a WebGL Texture, rescales and formats it to 60×60, and streams it to a specific LCD display key on a Soomfon controller via `Ops.Extension.Standalone.MacOs.Hid.SoomfonController`.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Connection`**: Connect to the `Connection` output of `Ops.Extension.Standalone.MacOs.Hid.SoomfonController`.
* **`Texture`**: The WebGL texture to upload.
* **`Key Index`**: Target key (`0..5`).
* **`Max FPS`**: Framerate limiter (default `30`).
* **`JPEG Quality`**: Compression ratio (`0.1` to `1.0`, default `0.85`).
* **`Flip Y`**: Flips vertical orientation (default `true`).
* **`Flip X`**: Flips horizontal orientation (default `false`).

### Outputs
* **`Next`**: Pass-through render execution trigger.
* **`Is Sending`**: `true` while the frame payload is transmitting.
* **`Actual FPS`**: Live frame rate delivered to the hardware key.
