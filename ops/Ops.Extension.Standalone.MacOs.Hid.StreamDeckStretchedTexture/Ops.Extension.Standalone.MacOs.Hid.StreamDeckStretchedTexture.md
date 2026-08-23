# Ops.Extension.Standalone.MacOs.Hid.StreamDeckStretchedTexture

Captures a WebGL Texture and spans/stretches it across the entire physical key grid of an Elgato Stream Deck device on macOS.

---

## Description
This op captures any WebGL texture via Framebuffer Object (FBO) readback, rescales and crops the image across the Stream Deck grid dimensions (e.g. 5 columns × 3 rows = 360 × 216 px for a 15-key Stream Deck), slices individual key tiles, and streams them simultaneously to `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Connection`**: Connect to the `Connection` output of `Ops.Extension.Standalone.MacOs.Hid.StreamDeck`.
* **`Texture`**: The WebGL texture to span across the device grid.
* **`Active`**: Enable or disable continuous rendering.
* **`Max FPS`**: Framerate limiter to throttle USB bus utilization (default `30`).
* **`JPEG Quality`**: Compression ratio (`0.1` to `1.0`, default `0.85`).
* **`Flip Y`**: Flips vertical orientation to match bottom-left WebGL with top-left LCD screens.

### Outputs
* **`Next`**: Pass-through render execution trigger.
* **`Is Sending`**: `true` while a frame payload is being transmitted.
* **`Actual FPS`**: Live frame rate delivered to the hardware.
* **`Flip Tile X`**: Flips individual tiles horizontally across the device keys.

Listed directory Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation
Viewed person_segmentation.mm:1-80
Viewed Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.js:1-100

### How Data is Shared Between `MacOs` Ops & Electron

The `Ops.Extension.Standalone.MacOs` operators communicate with Electron through **Native Node-API (N-API) C++/Objective-C++ addons (`.node` binaries)** loaded directly into the renderer process via `op.require()`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Electron Renderer Process                          │
│                                                                        │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │ Cables JS Engine (V8)   │          │ Native Addon (.node)        │  │
│  │ - WebGL Context / Canvas│◄────────►│ - Objective-C++ / Cocoa     │  │
│  │ - Op Graph & UI Loop    │  Direct  │ - IOKit / IOHIDManager      │  │
│  └───────────┬─────────────┘  In-Proc │ - CoreGraphics / Vision     │  │
│              │                Memory  └──────────────┬──────────────┘  │
│              │                                       │                 │
│              │ Thread-Safe Callback                  │ Off-Thread      │
│              │ (Napi::ThreadSafeFunction)            │ Background Work │
│              │                                       │                 │
│              ▼                                       ▼                 │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │ V8 Event Loop           │          │ Background Worker Threads   │  │
│  │ (Zero UI Stutter)       │          │ (libuv / GCD / std::thread) │  │
│  └─────────────────────────┘          └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Architecture Advantages:
1. **Zero IPC Overhead**:
   Unlike standard Electron apps that send messages between Main and Renderer processes via `ipcRenderer.send()` (which JSON-serializes all data), the `.node` binary loads **in-process**. C++ functions are called directly with raw pointers.
2. **Direct Buffer Sharing (`Uint8Array` / `Napi::Buffer`)**:
   Binary pixel arrays (`uint8_t*`, `ArrayBuffer`, or `CVPixelBuffer`) are passed directly without copying or encoding overhead.
3. **Background Thread Pool Execution**:
   Heavy hardware operations (IOKit USB packets, BLE streaming, or ML inference) run entirely on background threads. When data is ready, it is posted back to JavaScript using `Napi::ThreadSafeFunction` or `Napi::AsyncWorker`, ensuring the 60+ FPS Cables canvas never drops a frame.

---

### Would this Pattern Work for Apple Vision Framework Segmentation?

**Yes — this is the fastest possible way to run Apple Vision on macOS.**

Because the native addon runs Objective-C directly, it has native access to Apple's **`VNGeneratePersonSegmentationRequest`**, Metal, and CoreVideo.

#### Vision Segmentation Architecture Pipeline:

1. **GPU Pixel Extraction (JS / WebGL)**:
   * Cables captures the input video/texture via Framebuffer Object (FBO) readback (`gl.readPixels`) into a shared `Uint8Array`.
2. **Zero-Copy `CVPixelBuffer` Wrapping (Native C++)**:
   * The native addon wraps the raw bytes into a `CVPixelBuffer` with `kCVPixelBufferMetalCompatibilityKey` enabled.
3. **Hardware-Accelerated Neural Engine Inference**:
   * The `VNGeneratePersonSegmentationRequest` executes asynchronously on background worker threads via **Apple Neural Engine (ANE)** and Metal GPU cores:
     * `VNGeneratePersonSegmentationRequestQualityLevelFast` (~2ms inference)
     * `VNGeneratePersonSegmentationRequestQualityLevelBalanced` (~5ms inference)
     * `VNGeneratePersonSegmentationRequestQualityLevelAccurate` (~12ms inference)
4. **Mask Output $\rightarrow$ WebGL Texture (JS)**:
   * Vision outputs a grayscale matte (`kCVPixelFormatType_OneComponent8`).
   * The native layer passes the raw mask bytes back as a `Uint8Array`.
   * Cables uploads the mask to a `CGL.Texture` via `gl.texImage2D`, producing a live WebGL texture mask ready for chroma keying, background replacement, or particle fx.

Viewed Ops.Extension.Standalone.MacOs.Hid.StreamDeckStretchedTexture.md:2-62
Edited Ops.Extension.Standalone.MacOs.Hid.StreamDeckStretchedTexture.md