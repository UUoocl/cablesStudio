# Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation

This custom operator integrates Apple's high-performance native **Vision Framework** to isolate people from video inputs in real-time, outputting a high-quality person segmentation mask WebGL texture. It runs a completely self-contained background sidecar process and transfers GPU data over direct **IOSurface** shared memory bridges.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────┐
│           Cables GL Patch UI           │
│        (WebGL Texture Render)          │
└────────────────────────────────────────┘
     │                              ▲
     │ 1. Writes pixels to Surface  │ 4. Uploads 1-channel mask
     ▼                              │
┌────────────────────────────────────────┐
│       iosurface_shared Addon           │
│     (Handles input & output mapping)   │
└────────────────────────────────────────┘
     │                              ▲
     │ 2. Sends input surface ID    │ 3. Sends mask surface ID
     ▼                              │
┌────────────────────────────────────────┐
│      Swift Segmentation Daemon         │
│  - Wraps input as CVPixelBuffer        │
│  - Vision runs person segmentation     │
│  - Extracts mask IOSurface             │
└────────────────────────────────────────┘
```

1. **Zero-Copy Input Sharing**: JavaScript downsamples the input WebGL texture to a max dimension of 384px on the GPU, writes the pixels directly into a mapped shared `IOSurface`, and sends the surface ID via WebSocket to the Swift sidecar.
2. **Vision Integration**: The Swift daemon maps the input surface to a `CVPixelBuffer` via `CVPixelBufferCreateWithIOSurface` in zero-copy GPU memory, performing the segmentation request (`VNGeneratePersonSegmentationRequest`) with hardware acceleration.
3. **Zero-Copy Grayscale Output**: The generated mask is a 1-channel grayscale pixel buffer. Swift extracts its underlying `IOSurfaceRef` and sends its ID back to JS.
4. **WebGL GPU Swizzling**: JS reads the mask directly from the shared memory buffer and uploads it to WebGL as a 1-channel `gl.RED` texture. GPU swizzle parameters are applied natively to render the grayscale mask with zero performance overhead.

---

## 2. Compilation & Building

To build the native Node addon, run:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation
npm install node-addon-api --no-save
npx node-gyp rebuild --target=31.7.3 --dist-url=https://electronjs.org/headers
```

To build the Swift sidecar daemon:
```bash
swift build -c release
cp .build/release/SwiftPersonSegmentation swift_bin/SwiftPersonSegmentation
```

---

## 3. Lifecycle & Permissions

- **Parent Lifecycle Tracking**: To prevent zombie background daemons, the Swift binary tracks its parent process ID. If the parent Cables process exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
