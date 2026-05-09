# Cables MediaPipe Standalone Patch

This patch provides a fully offline, high-performance integration of Google MediaPipe tracking (Face, Hand, and Pose) within the Cables Electron standalone environment. 

## Features

- **Offline Tracking**: Local loading of `.task` models and MediaPipe WASM libraries.
- **Explicit URL Configuration**: Load vision models and WASM binaries from a local server (e.g., `http://127.0.0.1:8080`), bypassing the need for an internet connection.
- **Direct Texture Processing**: Tracking operators process WebGL textures from webcams or video files directly.
- **Cross-Op Support**: Output data is compatible with standard Cables JSON and Array operators.

## Included Operators

### 1. `Ops.Local.MediaPipe.FaceLandmarker`
Tracks facial landmarks and provides blendshape data.
- **Inputs**: Texture In, Execute, Vision Module URL, Vision WASM URL, Model URL, Num Faces.
- **Outputs**: Landmarks Array, Found (Number), Result Object, Next (Trigger).

### 2. `Ops.Local.MediaPipe.HandLandmarker`
Tracks hand positions and finger joints.
- **Inputs**: Texture In, Execute, Vision Module URL, Vision WASM URL, Model URL, Num Hands.
- **Outputs**: Landmarks Array (normalized 0-1), Found (Number), Result Object, Next (Trigger).

### 3. `Ops.Local.MediaPipe.PoseLandmarker`
Full-body skeletal tracking.
- **Inputs**: Texture In, Execute, Vision Module URL, Vision WASM URL, Model URL.
- **Outputs**: Landmarks Array, Found (Number), Result Object, Next (Trigger).

---

## Developer Overview: How it Works

### Local File Resolution
The tracking operators load their underlying MediaPipe libraries via explicit URLs. For local development in Electron, it is recommended to serve these files using a local HTTP server (like the `Ops.Local.Fastify` operator) and point the URL inputs to `http://127.0.0.1:8080/`.

### Model Loading
Models are stored in the `/models` directory. Each operator has a `Model URL` input where you can specify the full URL to the `.task` file.

### Handling Landmarks
Landmarks are output as Arrays of objects `{x, y, z}`. These coordinates are **normalized (0 to 1)** relative to the input texture dimensions.
- To map them to your 3D scene, multiply them by your viewport dimensions or use an `Ops.Gl.Points.Points` operator.

## Installation & Setup

1. **Libraries**: Ensure the `libs/` directory contains the required MediaPipe vision library (`vision_bundle.js` and the `wasm/` folder).
2. **Models**: Place the required `.task` files in the `models/` folder.
3. **Local Server**: Run a local server (e.g., using `Ops.Local.Fastify`) pointing to the root of your project/assets.
4. **Operator Configuration**: Set the **Vision Module URL**, **Vision WASM URL**, and **Model URL** on the operators to point to your local server (e.g., `http://127.0.0.1:8080/libs/mediapipe/vision_bundle.js`).

---

## Attribution & Licensing

This project utilizes [Google MediaPipe](https://github.com/google-ai-edge/mediapipe) models and libraries.

- **MediaPipe Models**: The `.task` files are provided by Google under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
- **MediaPipe Libraries**: The JavaScript and WASM libraries are part of the MediaPipe framework and are subject to the same Apache 2.0 license.

---

## Performance Tips
- **Disable Unused Features**: If you don't need Face Blendshapes, they are disabled by default to save CPU/GPU cycles.
- **Resolution**: Processing lower-resolution textures (e.g., 640x480) significantly improves tracking FPS.
- **Fail-Safe Polling**: Use the `Fail-Safe Polling` option to ensure the operator continues to process even if the main trigger is inconsistent.

## AI Disclaimer
> **Disclaimer**: The code, operators, and documentation in this repository were generated, refactored, and tested with the assistance of Artificial Intelligence.
