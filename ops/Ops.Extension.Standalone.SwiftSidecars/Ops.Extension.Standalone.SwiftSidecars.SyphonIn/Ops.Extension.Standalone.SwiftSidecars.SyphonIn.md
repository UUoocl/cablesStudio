# Ops.Extension.Standalone.SwiftSidecars.SyphonIn

This custom operator publishes macOS global Syphon video frames directly into a Cables WebGL texture. It offers two high-performance modes: a zero-copy **IOSurface Shared Memory** mode and a hardware-accelerated **WebRTC H.264 Stream** mode.

---

## 1. IOSurface Shared Memory Architecture

```
┌────────────────────────────────────────┐
│         Swift Syphon Sidecar           │
│  - Receives frame from Syphon          │
│  - Extracts IOSurface ID from texture  │
│  - Sends ID via WebSocket to JS        │
└────────────────────────────────────────┘
                    │
                    │ 1. Sends Surface ID over WebSocket (tiny JSON packet)
                    ▼
┌────────────────────────────────────────┐
│       iosurface_shared Addon           │
│  - IOSurfaceLookup(surfaceID)          │
│  - Mapped shared memory buffer access  │
└────────────────────────────────────────┘
                    │
                    │ 2. gl.texImage2D directly from shared memory buffer
                    ▼
┌────────────────────────────────────────┐
│           Cables GL Patch UI           │
│   - WebGL 2 Texture Swizzle (BGRA)     │
│   - Renders with zero disk I/O         │
└────────────────────────────────────────┘
```

1. **Direct Handle Sharing**: The Swift sidecar captures incoming frames from the Syphon server on the GPU, extracts their underlying `IOSurfaceRef`, and sends the unique global `IOSurfaceID` over WebSocket to Electron.
2. **Mapped Shared memory lookup**: A custom native Node-API addon (`iosurface_shared.node`) in JavaScript performs `IOSurfaceLookup(id)` to map the surface's CPU-accessible pointer directly into JavaScript memory as a standard Node `Buffer` with zero-copy.
3. **Hardware Upload & Swizzling**: JavaScript calls `gl.texImage2D` to upload the pixels directly from the shared buffer into the WebGL context. Natively swaps BGRA to RGBA formats on the GPU using WebGL 2 swizzle parameters (`TEXTURE_SWIZZLE_R = GL_BLUE`, etc.) with zero performance overhead.

---

## 2. Streaming Modes

This operator allows selecting between two modes:

1. **IOSurface Share**:
   - Zero disk reads or writes (no RAM disk required).
   - Zero-copy shared memory mapping.
   - *Use Case*: Lossless 1:1 raw color quality, ultra-low latency, and low CPU usage.

2. **WebRTC Stream (GPU-Accelerated)**:
   - Swift compresses textures directly on the GPU using macOS **VideoToolbox** (H.264).
   - JS decodes frames via **WebCodecs API** (`VideoDecoder`) and pushes them to a local loopback WebRTC `RTCPeerConnection` for zero-copy texture composition using `requestVideoFrameCallback`.
   - *Use Case*: Extremely low CPU usage (all work happens on dedicated H.264 GPU decoding hardware), best for high-resolution 4K feeds.

---

## 3. Compilation & Building

To build the native Node addon, run:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonIn
npm install node-addon-api --no-save
npx node-gyp rebuild --target=31.7.3 --dist-url=https://electronjs.org/headers
```

To build the Swift sidecar daemon:
```bash
swift build -c release
cp .build/release/SwiftSyphonIn swift_bin/SwiftSyphonIn
```

---

## 4. Lifecycle & Permissions

- **macOS Sandboxing & Accessibility**: Ensure that the terminal or Electron environment running Cables has proper screen capture and accessibility permissions enabled if required under **System Settings -> Privacy & Security**.
- **Auto-Lifespan Management**: The Swift binary tracks its parent process ID. If the parent Cables editor exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
