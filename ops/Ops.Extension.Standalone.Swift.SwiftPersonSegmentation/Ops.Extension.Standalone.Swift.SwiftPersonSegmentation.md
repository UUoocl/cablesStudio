# Ops.Extension.Standalone.Swift.SwiftPersonSegmentation

This custom operator integrates Apple's high-performance native **Vision Framework** to isolate people from video inputs in real-time, outputting a high-quality segmentation mask WebGL texture. It runs a completely self-contained background sidecar process and transfers GPU data over direct binary sockets.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Triggering Render starts private server  │ 4. Streams raw binary
    │    & spawns sidecar segmentation daemon      │    grayscale mask at 30-60fps
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│              Private Local WS Connection               │
│          (Direct, zero middleman middle-pipe)         │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Converts pixel bytes to CVPixelBuffer     │ 3. Performs Apple Vision
    │    for the Vision image request handler      │    VNGeneratePersonSegmentationRequest
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                Apple Vision Neural Core                │
│          (CoreOS Segment Neural Network model)         │
└────────────────────────────────────────────────────────┘
```

1. **Private Local Pipe**: The JS operator spins up a private WebSocket server on a dynamically allocated local port and spawns the `SwiftPersonSegmentation` background daemon with `--port <port>` arguments.
2. **WebGL Texture Capture**: When `Render` is triggered, the JS operator creates a temporary Framebuffer Object (FBO) and performs a highly optimized `gl.readPixels` call to fetch uncompressed RGBA pixel data.
3. **Binary WebSocket Envelope**: The pixel data is wrapped into a binary package containing:
   - **Bytes 0-3**: `width` (UInt32 little endian)
   - **Bytes 4-7**: `height` (UInt32 little endian)
   - **Bytes 8+**: Raw RGBA pixel bytes
   And streamed directly to the sidecar.
4. **Apple Vision Processing**: The Swift sidecar loads the raw RGBA pixels into a `CVPixelBuffer`, instantiates a `VNImageRequestHandler`, and executes `VNGeneratePersonSegmentationRequest` in `.accurate` quality mode.
5. **Mask Translation**: The resulting grayscale segment mask (`OneComponent8`) is unpacked, mapped to standard RGBA bytes, wrapped in a binary package, and streamed back to the Cables JS operator to be uploaded as a WebGL texture.

---

## 2. Compilation & Building

To compile the Swift binary, run:
```bash
cd ops/Ops.Extension.Standalone.Swift.SwiftPersonSegmentation
swift build -c release
mkdir -p swift_bin
cp .build/release/SwiftPersonSegmentation swift_bin/SwiftPersonSegmentation
```

---

## 3. Lifecycle & Permissions

- **Parent Lifecycle Tracking**: To prevent zombie background daemons, the Swift binary tracks its parent process ID. If the parent Cables process exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
