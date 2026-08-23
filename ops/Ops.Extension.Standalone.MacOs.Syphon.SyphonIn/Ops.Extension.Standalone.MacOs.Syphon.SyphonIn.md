# Ops.Extension.Standalone.MacOs.Syphon.SyphonIn

A high-performance Cables Standalone operator that **discovers and receives real-time video feeds from any macOS Syphon server** (OBS Studio, Resolume Arena, MadMapper, TouchDesigner, Millumin, other Cables instances, etc.) into a Cables WebGL `Texture` on Apple Silicon (`arm64`).

---

## Zero-GC Ingestion Pipeline

`SyphonIn` leverages the **Syphon Framework** and Apple Silicon unified memory:
1. **Auto-Discovery**: Uses `SyphonServerDirectory` to monitor system announcements and automatically populate the `Server` dropdown with active video streams.
2. **Unified Memory Direct Mapping**: `SyphonMetalClient` acquires the shared `IOSurface` frame. The native addon locks the `IOSurface` directly in unified memory and maps it to a reusable V8 TypedArray without intermediate buffer copies.
3. **In-Place WebGL Texture Upload**: Pre-allocates a persistent `CGL.Texture` and updates pixel data using `gl.texSubImage2D`, avoiding texture reallocation and garbage collection stalls.

```
+-----------------------------------------------------------------------------+
|                      External Syphon Server (OBS, Resolume)                 |
+--------------------------------------|--------------------------------------+
                                       v  (Shared Apple IOSurface / Metal)
                         [ SyphonServerDirectory ]
                                       |
                   (Automatic Discovery & Server Selection)
                                       v
                             [ SyphonMetalClient ]
                                       |
                   (Maps Unified Memory IOSurface in Node-API)
                                       v
                    [ Pre-Allocated Direct Pixel Buffer ]
                                       |
                    [ WebGL texSubImage2D / CGL.Texture ]
                                       v
                       [ Cables GL Texture Output Port ]
```

---

## Features

- **Automatic Server Discovery**: Real-time detection of new and closed Syphon servers on macOS.
- **Auto-Connect Mode**: Automatically hooks into the first available Syphon server if none is manually selected.
- **Zero-GC In-Place Updates**: Pre-allocated texture and memory buffers eliminate frame drops during 60 FPS streaming.
- **Dynamic Resolution Scaling**: Seamlessly handles upstream resolution switches (e.g. 720p $\rightarrow$ 1080p $\rightarrow$ 4K).
- **Embedded Syphon Framework**: Ships with Apple Silicon `arm64` Syphon framework embedded with `@rpath` resolution.
- **Telemetry & Event Trigger**: Provides live FPS, dimensions, status messages, and an `On Frame` trigger output.

---

## Inputs & Ports

| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Render** | Trigger | — | Render trigger to check and ingest the latest available video frame. |
| **Active** | Boolean | `true` | Enables or disables the Syphon receiver. |
| **Server** | Dropdown | `""` | Select an active Syphon server from the auto-populated list. |
| **Auto Connect**| Boolean | `true` | Automatically connects to the first discovered server. |

---

## Outputs & Telemetry

| Port | Type | Description |
| :--- | :--- | :--- |
| **Texture** | Texture | The incoming video feed mapped as a `CGL.Texture`. |
| **On Frame** | Trigger | Fires whenever a new video frame is received and uploaded. |
| **Server List** | Array | Array of all active Syphon server titles discovered on macOS. |
| **Status** | String | Human-readable connection status (e.g. `Receiving: OBS`, `Listening for Servers`). |
| **Width** | Number | Width of the received video stream in pixels. |
| **Height** | Number | Height of the received video stream in pixels. |
| **FPS** | Number | Live receiving frame rate. |

---

## Setup with OBS Studio / Resolume

### In OBS Studio
1. In OBS, add a **Syphon Server** filter to any source or scene (or use the OBS Syphon plugin).
2. Set the server name (e.g. `OBS Studio Video`).

### In Cables
1. Add `Ops.Extension.Standalone.MacOs.Syphon.SyphonIn` to your patch.
2. Connect `Render` to `MainLoop`.
3. In the `Server` dropdown, select `OBS Studio Video`.
4. Connect the `Texture` output to your materials, geometry, or post-processing pipeline.
