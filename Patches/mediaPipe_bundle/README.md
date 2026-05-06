# Cables MediaPipe Bundled Vision Patch

This patch provides a fully self-contained, high-performance integration of Google MediaPipe vision tracking (Face, Hand, and Pose) for Cables. It is designed for **air-gapped** or **offline** environments by bundling all required SDKs, WASM binaries, and models directly into the operator source code.

## 🚀 The VisionBundle Operator

The primary operator in this patch is `Ops.User.MediaPipe.VisionBundle`. 

Unlike standard implementations that require external downloads, this Op contains everything it needs to run. It allows you to switch between different vision tasks dynamically without reloading the page or re-initializing the core engine.

### Key Features
- **3-in-1 Task Support**: Switch between **Pose**, **Hand**, and **Face** landmarker tasks within a single operator.
- **Zero Dependencies**: No external CDN or internet connection required.
- **Global Memory Optimization**: Shared WASM/SDK assets and cached model buffers ensure minimal memory overhead, even with multiple Op instances.
- **Reactive Configuration**: Adjust confidence thresholds and detection counts on the fly without breaking the tracking state.

### How to Use
1. **Add the Op**: Place `Ops.User.MediaPipe.VisionBundle` in your patch.
2. **Select Task**: Use the **Task** dropdown to choose "Pose", "Hand", or "Face".
3. **Connect Texture**: Input a WebGL texture (e.g., from a webcam or video player).
4. **Configure Parameters**:
   - **Max Detections**: Number of objects to track (1-10).
   - **Min Confidence**: Threshold for detection.
   - **Output Format**: Choose between raw MediaPipe arrays or ML5-compatible objects.

---

## 🛠 Technical Approach

This patch solves the "offline WASM" challenge in Cables by using a **Base64-In-JS Bundling Strategy**.

### 1. Asset Inlining
The MediaPipe SDK (`vision_bundle.js`), the internal WASM bridge (`vision_wasm_internal.js`), and the heavy WASM binary (`vision_wasm_internal.wasm`) are encoded into Base64 strings and embedded directly into the operator's Javascript file.

### 2. Global Asset Caching
To prevent browser memory from exploding when using multiple instances of the Op, we use a **Global Synchronization Layer**:
- **SDK & WASM**: Stored on `window.__MP_VISION_SDK__`. The WASM binary is converted to a Blob URL only once per session.
- **Models**: Stored in `window.__MP_MODELS__`. Models are decoded from Base64 into `Uint8Array` buffers only once. All instances of the `VisionBundle` Op share these buffers, saving approximately 17MB of RAM per instance.

### 3. Dynamic Task Switching
The Op manages its own `VisionGraph` lifecycle. When you switch tasks (e.g., from Hand to Pose), it cleanly closes the existing MediaPipe landmarker and initializes the new one using the shared global assets.

---

## 📦 Maintenance: Bundling Updates

The operators in this patch are **generated** from templates to ensure consistent handling of the base64 assets.

### How to Regenerate the Bundle
If you update the models in the `/models` folder or the libraries in `/libs`, you must regenerate the operator:

```bash
# From the project root
node scripts/generate_bundle.js
```

This script will:
1. Read the latest `.task` files and MediaPipe JS/WASM files.
2. Encode them into Base64.
3. Inject them into the Op template.
4. Output the updated operator to `ops/Ops.User.MediaPipe.VisionBundle/`.

### Adding New Tasks
To add a new MediaPipe vision task (e.g., Object Detection):
1. Add the `.task` file to the `/models` directory.
2. Update the `tasks` configuration object in `scripts/generate_bundle.js` with the new task parameters and options builder.
3. Run the generation script.

---

## Performance & Optimization
- **Binary Bloat**: Base64 encoding adds ~33% overhead to the file size. However, by bundling all 3 tasks, we eliminate the redundant 10MB of WASM/SDK data that would be present if they were separate standalone files. Total bundle size is **~35MB**.
- **Execution**: Tracking is performed on the GPU where possible. For maximum FPS, use input textures at **640x480** or lower.

## Attribution & Licensing
This project utilizes [Google MediaPipe](https://github.com/google-ai-edge/mediapipe).
- **Models**: Provided by Google under [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
- **Libraries**: Part of the MediaPipe framework (Apache 2.0).

---
*Generated and optimized with the assistance of Antigravity AI.*
