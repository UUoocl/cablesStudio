# Ops.Extension.Standalone.MacOs.Hid.StreamDeckKeyTexture

Captures any WebGL Texture in real time and streams it directly to a specific LCD key on an Elgato Stream Deck device on macOS.

---

## Description
This op reads WebGL textures via Framebuffer Object (FBO) readback, rescales the frame to the native key icon resolution (e.g. 72x72 for Stream Deck V2), and streams JPEG frames to `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Connection`**: Connect to the `Connection` output of `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.
* **`Texture`**: The WebGL texture to display on the hardware key.
* **`Key Index`**: Target key number (`0` to `keyCount - 1`).
* **`Max FPS`**: Framerate limiter to throttle USB bus utilization (`0` = unlimited / event-driven).
* **`JPEG Quality`**: Compression ratio (`0.1` to `1.0`, default `0.88`).

### Outputs
* **`Next`**: Pass-through render execution trigger.
* **`Loaded`**: Triggered once the key texture has finished loading and uploading to the Stream Deck key display.
* **`Is Sending`**: `true` while a frame payload is being transmitted.
* **`Actual FPS`**: Live frame rate delivered to the hardware.
