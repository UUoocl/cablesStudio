# Ops.Extension.Standalone.Swift.SwiftSyphonIn

This custom operator refactors the legacy Node.js/NPM-based Syphon capture client into a high-performance native Swift-backed sidecar process. It streams macOS global Syphon video frames at maximum frame-rate directly into a Cables WebGL texture with zero external compile-time dependencies.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true starts private server       │ 4. Streams raw binary
    │    & spawns SwiftSyphonIn daemon             │    RGBA frames at 60fps
    ▼                                              │
┌────────────────────────────────────────────────────────┐
│              Private Local WS Connection               │
│          (Direct, zero middleman middle-pipe)         │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Dynamically loads Syphon.framework        │ 3. Captures GPU frames
    │    and creates MTLDevice context             │    via SyphonMetalClient
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                   macOS Core Graphics                  │
│            (Metal GPU & Syphon Server Feed)            │
└────────────────────────────────────────────────────────┘
```

1. **Private Local Pipeline**: Toggling the **Active** pin starts a temporary WebSocket server on a dynamically allocated local port, then spawns the `SwiftSyphonIn` background daemon with `--port <port>` arguments.
2. **Zero Linkage Compilation**: The Swift codebase compiles cleanly on any Mac using standard Swift APIs without requiring `Syphon.framework` to be linked or installed in standard system paths during build-time.
3. **Dynamic Runtime Loading**: When launched, the sidecar searches for `Syphon.framework` in local operator directories (`./Frameworks/`), node module paths, and `/Library/Frameworks/`, loading it dynamically via `Bundle`.
4. **Metal Integration**: Leverages `SyphonMetalClient` and Metal textures. Instead of heavy CPU-based rendering or legacy OpenGL pipelines, frames are fetched directly from the GPU.
5. **Zero-Overhead Binary Pipe**: Frame textures are fetched, translated from BGRA to RGBA directly in Swift, and pushed as uncompressed binary WebSocket packages containing:
   - **Bytes 0-3**: `width` (UInt32 little endian)
   - **Bytes 4-7**: `height` (UInt32 little endian)
   - **Bytes 8+**: Raw RGBA pixel buffer bytes

---

## 2. Dynamic Server Discovery & Dropdowns

- The Swift sidecar daemon periodically queries `SyphonServerDirectory.sharedDirectory().servers` dynamically.
- Server directories are translated to JSON array lists and pushed to the Cables JS operator.
- The operator dynamically populates the **Server** dropdown options in the form `AppName: ServerName`.
- When a user selects a server, the operator sends a selection payload to the Swift client to hot-swap or initialize the active `SyphonMetalClient`.

---

## 3. Compilation & Building

To compile the Swift binary, run:
```bash
cd ops/Ops.Extension.Standalone.Swift.SwiftSyphonIn
swift build -c release
mkdir -p swift_bin
cp .build/release/SwiftSyphonIn swift_bin/SwiftSyphonIn
```

---

## 4. Lifecycle & Permissions

- **macOS Sandboxing & Accessibility**: Ensure that the terminal or Electron environment running Cables has proper screen capture and accessibility permissions enabled if required under **System Settings -> Privacy & Security**.
- **Auto-Lifespan Management**: The Swift binary tracks its parent process ID. If the parent Cables editor exits, the sidecar detects the orphan adoption by PID 1 and automatically self-terminates.
