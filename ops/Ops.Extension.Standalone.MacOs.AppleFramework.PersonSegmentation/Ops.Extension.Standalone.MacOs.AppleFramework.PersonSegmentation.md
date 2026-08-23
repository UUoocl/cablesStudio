# Ops.Extension.Standalone.MacOs.AppleFramework.PersonSegmentation

Hardware-accelerated real-time person segmentation and background removal using macOS **Apple Vision Framework** and the **Apple Neural Engine (ANE)**.

---

## Features
- **Apple Neural Engine Hardware Acceleration**: Executes Apple Vision's `VNGeneratePersonSegmentationRequest` asynchronously on libuv background threads without UI lag.
- **Selectable Quality Profiles**:
  - `Fast`: Low latency (~2ms inference), ideal for high frame rate live interaction.
  - `Balanced`: Optimal compromise between edge fidelity and performance.
  - `Accurate`: Maximum edge clarity for intricate hair and silhouette detail.
- **GPU-Accelerated Texture Pipeline**: Downsamples input textures on the GPU via FBO blitting, feeds the neural network, and upscales the resulting mask back to the original source dimensions.

---

## Ports

### Inputs
* **`Render`**: Trigger executed in the render loop.
* **`Texture`**: Input video or image texture containing a person or subject.
* **`Active`**: Enables or disables segmentation inference.
* **`Quality Level`**: Quality profile (`Fast`, `Balanced`, `Accurate`).

### Outputs
* **`On Mask Ready`**: Trigger fired when a new mask texture frame has been generated.
* **`Segmentation Mask`**: WebGL texture output containing the 8-bit alpha silhouette matte.
* **`Mask Width` / `Mask Height`**: Dimensions of the output mask texture.
* **`Running`**: `true` while the native vision pipeline is active.
* **`Status`**: Current runtime status (`Running`, `Stopped`, `Processing Error`).
