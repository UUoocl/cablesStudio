# Ops.Extension.Standalone.SwiftSidecars.SyphonOut

This custom operator publishes WebGL textures from Cables directly as a native macOS Syphon server. It uses a native **IOSurface** shared memory bridge and a Swift-backed sidecar process to publish textures with zero network loopback, zero CPU H.264 compression, and zero disk writing.

---

## 1. IOSurface & Asynchronous PBO Architecture

```
┌────────────────────────────────────────┐
│           Cables GL Patch UI           │
│        (WebGL Texture Render)          │
└────────────────────────────────────────┘
                    │
                    │ 1. Async WebGL2 PBO readback (no CPU stalls)
                    ▼
┌────────────────────────────────────────┐
│        Cage-Safe JS Uint8Array         │
│     (Pre-allocated inside V8 heap)     │
└────────────────────────────────────────┘
                    │
                    │ 2. sharedSurface.write(buffer) -> Native memcpy
                    ▼
┌────────────────────────────────────────┐
│       iosurface_shared Addon           │
│    (Creates IOSurface & copies pixels) │
└────────────────────────────────────────┘
                    │
                    │ 3. Sends Surface ID over WebSocket (tiny JSON packet)
                    ▼
┌────────────────────────────────────────┐
│         Swift Syphon Sidecar           │
│  - IOSurfaceLookup(surfaceID)          │
│  - Zero-copy MTLCreateSystemDefault... │
│  - Publishes directly via Syphon       │
└────────────────────────────────────────┘
```

1. **Allocating Shared Surface**: When the operator runs, the native Node-API addon (`iosurface_shared.node`) creates a macOS global `IOSurface` with the texture's width and height.
2. **Asynchronous Double-Buffered PBO Readback**: To prevent GPU pipeline stalls, we pre-allocate two WebGL Pixel Buffer Objects (PBOs) and a cage-safe `Uint8Array`.
   - Each frame, `gl.getBufferSubData(...)` reads the completed pixels from the previous frame's PBO into the array (non-blocking and instant).
   - Simultaneously, `gl.readPixels(...)` triggers an asynchronous copy of the current frame's pixels into the other PBO (returns immediately without blocking).
3. **Memory Cage Compliance**: Modern Electron/V8 sandbox restrictions prohibit wrapping external pointers (like `IOSurface` CPU memory) in JS `Buffer` objects. The JS operator passes the cage-safe `Uint8Array` to the native `.write()` method on the addon, which locks the `IOSurface` and performs a native `memcpy` to the surface's base address.
4. **Event Notification**: The JS operator sends a tiny JSON message containing the global `IOSurfaceID` via a local WebSocket connection to the Swift daemon.
5. **Zero-Copy Metal Publishing**: The Swift daemon looks up the shared surface by its ID using `IOSurfaceLookup(...)`. Metal binds it as an `MTLTexture` in a hardware-accelerated, zero-copy operation. The texture is immediately published to the `SyphonMetalServer` on the GPU.

---

## 2. Compilation & Building

To build the native Node addon, run:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonOut
npm install node-addon-api --no-save
npx node-gyp rebuild --target=31.7.3 --dist-url=https://electronjs.org/headers
```

To build the Swift sidecar daemon:
```bash
swift build -c release
cp .build/release/SwiftSyphonOut swift_bin/SwiftSyphonOut
```

---

## 3. Lifecycle & Permissions

- **Parent Lifecycle Tracking**: To prevent zombie background daemons, the Swift binary tracks its parent process ID. If the parent Cables process exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
