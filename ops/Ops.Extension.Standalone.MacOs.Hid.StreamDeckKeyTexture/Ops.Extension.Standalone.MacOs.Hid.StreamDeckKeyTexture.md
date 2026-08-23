# Ops.Extension.Standalone.MacOs.Hid.StreamDeckKeyTexture

Captures any WebGL Texture in real time and streams it directly to a specific LCD key on an Elgato Stream Deck device on macOS.

---

## Description
This op reads WebGL textures via Framebuffer Object (FBO) readback, rescales the frame to the native key icon resolution (e.g. 72x72 for Stream Deck V2), applies optional `Flip Y` orientation correction, and streams JPEG frames to `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Connection`**: Connect to the `Connection` output of `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.
* **`Texture`**: The WebGL texture to display on the hardware key.
* **`Key Index`**: Target key number (`0` to `keyCount - 1`).
* **`Max FPS`**: Framerate limiter to throttle USB bus utilization (default `30`).
* **`JPEG Quality`**: Compression ratio (`0.1` to `1.0`, default `0.88`).
* **`Flip Y`**: Flips vertical orientation to match bottom-left WebGL with top-left LCD screens.

### Outputs
* **`Next`**: Pass-through render execution trigger.
* **`Is Sending`**: `true` while a frame payload is being transmitted.
* **`Actual FPS`**: Live frame rate delivered to the hardware.
