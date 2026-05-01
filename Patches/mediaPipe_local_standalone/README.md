# Cables MediaPipe Standalone Patch

This patch provides a fully offline, high-performance integration of Google MediaPipe tracking (Face, Hand, and Pose) within the Cables Electron standalone environment. It uses the custom `esm://` protocol to load vision models and WASM binaries locally, bypassing the need for an internet connection or external CDN.

## Features

- **Offline Tracking**: Local loading of `.task` models and MediaPipe WASM libraries.
- **Protocol Optimization**: Uses the `esm://` handler to resolve local file paths correctly within the Electron session.
- **Direct Texture Processing**: Tracking operators process WebGL textures from webcams or video files directly.
- **Cross-Op Support**: Output data is compatible with standard Cables JSON and Array operators.

## Included Operators

### 1. `Ops.LocalMP.FaceLandmarker`
Tracks facial landmarks and provides blendshape data.
- **Inputs**: Texture In, Active, Model Path, Min Detection Confidence.
- **Outputs**: Landmarks Array, Blendshapes Object, Face Detected (Bool).

### 2. `Ops.LocalMP.HandLandmarker`
Tracks hand positions and finger joints.
- **Inputs**: Texture In, Active, Model Path, Max Hands.
- **Outputs**: Hand Landmarks Array (normalized 0-1), Hand Count.

### 3. `Ops.LocalMP.PoseLandmarker`
Full-body skeletal tracking.
- **Inputs**: Texture In, Active, Model Path.
- **Outputs**: Pose Landmarks Array, Segmentation Mask (Texture).

---

## Developer Overview: How it Works

### Local File Resolution (`esm://`)
The tracking operators load their underlying MediaPipe libraries using a custom Electron protocol handler. This ensures that ES modules and WASM files are loaded with the correct MIME types, which is typically a challenge with standard `file://` URLs in Electron.

### Model Loading
Models are stored in the `/models` directory. The operators expect a path relative to the patch or an absolute path.
Example Model Paths:
- `models/face_landmarker.task`
- `models/hand_landmarker.task`
- `models/pose_landmarker.task`

### Handling Landmarks
Landmarks are output as Arrays of objects `{x, y, z}`. These coordinates are **normalized (0 to 1)** relative to the input texture dimensions.
- To map them to your 3D scene, multiply them by your viewport dimensions or use an `Ops.Gl.Points.Points` operator.

## Installation & Setup

1. **Libraries**: Ensure the `libs/` directory contains the required MediaPipe vision library (`vision_bundle.js` or equivalent).
2. **Models**: Download the latest `.task` files from the [MediaPipe Solutions](https://developers.google.com/mediapipe/solutions/vision) page and place them in the `models/` folder.
3. **Electron Configuration**: This patch requires the `electron_endpoint.js` in your Cables Electron setup to have the `esm://` protocol registered.

---

## Attribution & Licensing

This project utilizes [Google MediaPipe](https://github.com/google-ai-edge/mediapipe) models and libraries.

- **MediaPipe Models**: The `.task` files located in the `models/` directory are provided by Google under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
- **MediaPipe Libraries**: The JavaScript and WASM libraries in the `libs/` directory are part of the MediaPipe framework and are subject to the same Apache 2.0 license.

A copy of the Apache 2.0 License is included in the [LICENSE](file:///Users/jonwood/Github_local_dev/cablesStudio/Patches/mediaPipe_local_standalone/LICENSE) file within this directory.


---

## Performance Tips
- **Disable Unused Features**: If you don't need Face Blendshapes, disable them in the Op settings to save CPU/GPU cycles.
- **Resolution**: Processing lower-resolution textures (e.g., 640x480) significantly improves tracking FPS with minimal loss in accuracy.
- **Detection Interval**: Use a `Timer` or `MainLoop` trigger to control how often the detection runs if you are on low-power hardware.

## AI Disclaimer
> **Disclaimer**: The code, operators, and documentation in this repository were generated, refactored, and tested with the assistance of Artificial Intelligence. While efforts have been made to ensure stability, please review all scripts and native library calls for security and compatibility within your specific local environment.

