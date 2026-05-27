# Ops.Extension.Standalone.Swift.SwiftSyphonOut

This custom operator refactors the legacy Node.js/NPM-based Syphon publishing client into a high-performance native Swift-backed sidecar process. It streams WebGL textures from Cables at maximum frame-rate to any global macOS Syphon client (such as OBS, Resolume, MadMapper, or Max/MSP) with zero external compile-time dependencies.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Triggering Render starts private server  │ 4. Receives raw binary
    │    & spawns SwiftSyphonOut daemon            │    RGBA frames at 60fps
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│              Private Local WS Connection               │
│          (Direct, zero middleman middle-pipe)         │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Dynamically loads Syphon.framework        │ 3. Publishes GPU textures
    │    and creates MTLDevice context             │    via SyphonMetalServer
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core Graphics                  │
│            (Metal GPU & Syphon Client Feed)            │
└────────────────────────────────────────────────────────┘
```

1. **Private Local Pipeline**: The JS operator spins up a private WebSocket server on a dynamically allocated local port and spawns the `SwiftSyphonOut` background daemon with `--port <port>` arguments.
2. **WebGL Texture Capture**: When `Render` is triggered, the JS operator creates a temporary Framebuffer Object (FBO) and performs a highly optimized `gl.readPixels` call to fetch uncompressed RGBA pixel data.
3. **Binary WebSocket Envelope**: The pixel data is wrapped into a binary package containing:
   - **Bytes 0-3**: `width` (UInt32 little endian)
   - **Bytes 4-7**: `height` (UInt32 little endian)
   - **Bytes 8+**: Raw RGBA pixel bytes
   And streamed directly to the sidecar at maximum frame rate.
4. **Metal Integration**: The Swift sidecar loads the raw RGBA pixels into a GPU-backed `MTLTexture` using `.rgba8Unorm`, and publishes the texture on a `MTLCommandBuffer` via `SyphonMetalServer`.

---

## 2. Dynamic Server Name Updates

- The operator passes the **Server Name** configuration down to the sidecar.
- If the **Server Name** is changed in the editor, the operator dynamically notifies the Swift process via a control WebSocket message:
  ```json
  { "type": "serverName", "name": "New_Name" }
  ```
- The Swift sidecar dynamically stops the previous server instance and starts a new `SyphonMetalServer` immediately without disconnecting the WebSocket client or dropping processes.

---

## 3. Compilation & Building

To compile the Swift binary, run:
```bash
cd ops/Ops.Extension.Standalone.Syphon/Ops.Extension.Standalone.Swift.SwiftSyphonOut
swift build -c release
mkdir -p swift_bin
cp .build/release/SwiftSyphonOut swift_bin/SwiftSyphonOut
```

---

## 4. Lifecycle & Permissions

- **Parent Lifecycle Tracking**: To prevent zombie background daemons, the Swift binary tracks its parent process ID. If the parent Cables process exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
