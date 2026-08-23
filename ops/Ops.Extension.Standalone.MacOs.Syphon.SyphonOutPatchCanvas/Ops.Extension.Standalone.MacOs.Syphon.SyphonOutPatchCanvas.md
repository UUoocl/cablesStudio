# Ops.Extension.Standalone.MacOs.Syphon.SyphonOutPatchCanvas

A high-performance Cables Standalone operator that **taps directly into Electron's macOS native view layer** (`NSView` / `CALayer`) from the main/renderer bridge, extracting Chromium's live composite `IOSurfaceRef` with **true zero CPU copy**, wrapping it into Apple Metal, and publishing it to the system via the **Syphon Framework** on Apple Silicon (`arm64`).

---

## Zero-Copy GPU Architecture

### Why Traditional WebGL Syphon Had CPU Overhead
In standard browser and Electron sandboxed WebGL environments:
- WebGL texture IDs are virtualized under ANGLE / Chromium's sandbox.
- Native Node addons cannot directly access sandboxed WebGL textures in GPU VRAM without performing `gl.readPixels`.
- This forced a high-overhead roundtrip:
  $$\text{GPU VRAM} \xrightarrow{\text{gl.readPixels}} \text{CPU RAM (V8 ArrayBuffer)} \xrightarrow{\text{Node Buffer}} \text{Native Addon} \xrightarrow{\text{Upload}} \text{GPU Syphon Texture}$$
  This resulted in CPU spikes, main-thread blocking, and frame drops at 1080p+ / 4K.

### The Zero-Copy Solution in this Operator
Chromium's compositor (*Viz*) on macOS renders its final composite layer directly into a native macOS CoreAnimation `CALayer` backed by an **`IOSurfaceRef`** in GPU VRAM.

`SyphonOutPatchCanvas` bridges the renderer and native layer:
1. Accesses Electron's native window handle (`BrowserWindow.getNativeWindowHandle()`).
2. Traverses the native `NSView` $\rightarrow$ `CALayer` hierarchy to extract the live `IOSurfaceRef`.
3. Binds the `IOSurfaceRef` directly to an Apple Metal texture (`MTLTexture`) in GPU memory without reading pixels to the CPU.
4. Publishes the texture to `SyphonMetalServer` on a dedicated Metal command buffer.
5. Runs an optional decoupled `CVDisplayLink` loop synchronized with macOS ProMotion / 60/120Hz display refresh.

```
+-------------------------------------------------------------+
|                     Electron / Chromium                     |
|  [ Cables GL Canvas ]  ---> [ Chromium Viz / Compositor ]  |
+--------------------------------------|----------------------+
                                       v
                     [ macOS NSView Layer Hierarchy ]
                                       |
                   [ CALayer backed by IOSurfaceRef ] (GPU VRAM)
                                       |
                   (Zero-Copy Native Hook / Node-API)
                                       v
                    [ Metal 2D Texture (MTLTexture) ]
                                       |
                        [ SyphonMetalServer ]
                                       |
                                       v
                [ External Syphon Clients (OBS, Resolume) ]
```

---

## Features & Capabilities

- **Zero CPU Bottleneck**: GPU-to-GPU memory sharing via Apple `IOSurface` and Metal.
- **Embedded Syphon Framework**: Ships with Apple Silicon `arm64` Syphon framework (`Frameworks/Syphon.framework`).
- **Auto-Crop to Patch Canvas**: Automatically detects the Cables `<canvas>` element bounding rectangle (multiplied by `devicePixelRatio`) so only the canvas is published, omitting editor panels.
- **Full Window Mode**: Disable canvas crop to broadcast the full Electron window.
- **Custom Crop**: Precise pixel coordinate region definition.
- **Continuous DisplayLink**: Hardware-synchronized `CVDisplayLink` thread delivering buttery smooth 60/120 FPS output without JavaScript event loop jitter.
- **Triggered Mode**: Synchronous on-demand publishing linked to Cables `Render` trigger.
- **Real-Time Telemetry**: Real-time FPS, surface dimensions, client attachment detection, and IOSurface ID monitoring.

---

## Inputs & Controls

| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Active** | Boolean | `true` | Enables or disables the Syphon server. |
| **Render** | Trigger | — | Manual frame trigger (used when Continuous DisplayLink is disabled). |
| **Continuous DisplayLink** | Boolean | `true` | Uses a background `CVDisplayLink` thread for 60/120Hz streaming. |
| **Server Name** | String | `Cables Patch Canvas` | Broadcast name visible to Syphon clients. |
| **Crop To Patch Canvas** | Boolean | `true` | Automatically crops output to the exact Cables canvas element bounds. |
| **Custom Crop** | Boolean | `false` | Enables manual coordinate cropping. |
| **Crop X / Y / Width / Height**| Number | `0, 0, 1920, 1080` | Manual sub-region coordinates in physical surface pixels. |

---

## Outputs & Telemetry

| Port | Type | Description |
| :--- | :--- | :--- |
| **Is Publishing** | Boolean | True when the Syphon server is actively broadcasting. |
| **Status** | String | Status message (e.g. `Publishing (Active Client)`, `Running`). |
| **Surface Width** | Number | Physical pixel width of the Chromium composite. |
| **Surface Height**| Number | Physical pixel height of the Chromium composite. |
| **FPS** | Number | Live output frame rate. |
| **IOSurface ID** | Number | macOS system IOSurface ID. |
| **Has Clients** | Boolean | True if an external application is currently receiving frames. |

---

## Usage in External Applications

### OBS Studio
1. Add a **Syphon Client** source to your OBS scene (or use the Syphon plugin).
2. Select **Cables Patch Canvas** (or your custom server name) from the Source dropdown.

### Resolume Arena / Avenue
1. In Resolume, navigate to the **Sources** tab.
2. Under **Syphon**, drag the **Cables Patch Canvas** source onto any layer/clip.

### MadMapper & TouchDesigner
1. TouchDesigner: Use the `Syphon Spout In` TOP and select the Cables server.
2. MadMapper: Double-click the Cables Syphon stream in the **Media** panel.
