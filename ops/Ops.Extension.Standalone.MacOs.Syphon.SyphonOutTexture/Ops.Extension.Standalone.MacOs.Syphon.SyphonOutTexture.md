# Ops.Extension.Standalone.MacOs.Syphon.SyphonOutTexture

A high-performance Cables Standalone operator that **connects to any intermediate WebGL `Texture` port** in your patch and publishes it as a native macOS **Syphon server** on Apple Silicon (`arm64`).

---

## Asynchronous Zero-Stall Pipeline

Traditional WebGL texture readback (`gl.readPixels`) forces synchronous GPU-to-CPU synchronization, stalling the render thread and causing major frame drops at 1080p and 4K.

`SyphonOutTexture` solves this by using a **WebGL2 Double-Buffered Pixel Buffer Object (PBO) pipeline**:
1. **Frame $N$**: Dispatches an asynchronous, non-blocking DMA pixel copy into `PBO[write]`.
2. **Frame $N-1$**: Simultaneously reads completed pixels from `PBO[read]` via `gl.getBufferSubData()`.
3. **Direct Memory Copy**: Copies pixels into a shared Apple `IOSurface` in unified memory.
4. **Metal Syphon Broadcast**: The `IOSurface` is bound directly into an Apple Metal texture (`MTLTexture`) and published to `SyphonMetalServer` on an asynchronous background command buffer.

```
+---------------------------------------------------------------------------------+
|                                 WebGL2 Context                                  |
|                                                                                 |
|  [ InTexture (CGL.Texture) ] ---> [ Dedicated FBO ]                             |
|                                         |                                       |
|             (Frame N: Async Non-Blocking DMA Pack)                              |
|                                         v                                       |
|                            [ PBO 0 ] <======> [ PBO 1 ]                         |
|                                         |                                       |
|             (Frame N-1: Read SubData into Shared Buffer)                        |
+-----------------------------------------|---------------------------------------+
                                          v
                         [ Native Node-API Metal Addon ]
                                          |
                      (Direct memcpy to Shared Apple IOSurface)
                                          v
                          [ Metal 2D Texture (MTLTexture) ]
                                          |
                              [ SyphonMetalServer ]
                                          |
                                          v
                      [ External Syphon Clients (OBS, Resolume) ]
```

---

## Features

- **Connects to Any Texture**: Works with FBO outputs, shader effects, image generators, video textures, and subpatch textures.
- **Zero Render-Thread Stalls**: Asynchronous double-buffered PBO DMA eliminates GPU stalls.
- **Zero Garbage Collection**: Uses pre-allocated static ring buffers. No dynamic allocation during 60 FPS streaming.
- **Dynamic Resolution Tracking**: Automatically adapts if the connected texture changes size (e.g. 1080p $\rightarrow$ 4K).
- **Embedded Syphon Framework**: Ships with Apple Silicon `arm64` Syphon framework embedded with `@rpath` resolution.
- **Real-Time Telemetry**: Reports streaming FPS, texture dimensions, IOSurface ID, and client attachment status.

---

## Inputs & Ports

| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Render** | Trigger | — | Render trigger (connect to MainLoop or texture update trigger). |
| **Texture** | Texture | — | The intermediate WebGL texture to publish. |
| **Active** | Boolean | `true` | Enables or disables the Syphon server. |
| **Server Name** | String | `Cables Texture Output` | Broadcast name visible to Syphon clients. |

---

## Outputs & Telemetry

| Port | Type | Description |
| :--- | :--- | :--- |
| **Is Publishing** | Boolean | True when the Syphon server is actively broadcasting. |
| **Status** | String | Human-readable status (e.g. `Publishing (Active Client)`, `Running`). |
| **Width** | Number | Width of the published texture in pixels. |
| **Height** | Number | Height of the published texture in pixels. |
| **FPS** | Number | Live output frame rate. |
| **Has Clients** | Boolean | True if an external application is currently receiving frames. |
| **IOSurface ID** | Number | Apple IOSurface system identifier. |
