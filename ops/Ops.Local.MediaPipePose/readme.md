# Ops.Local.MediaPipePose

MediaPipe Pose detection operator for Cables Standalone. This operator performs real-time body pose tracking using the MediaPipe Vision SDK, optimized for local offline usage via a sidecar server.

## Purpose
The operator receives a video element (e.g., from `Ops.Local.DesktopTexture`) and outputs normalized landmarks and 3D world landmarks for body tracking. It avoids environment-specific "require" issues by loading the SDK assets via HTTP from the local `SocketClusterStaticServer`.

## Developer Overview

### Loading Strategy
This operator uses a **Server-Side Asset Loading Strategy**:
1. **Host**: The `Ops.Local.SocketClusterStaticServer` serves the MediaPipe assets from the local filesystem.
2. **Library**: The operator performs a dynamic `import()` of the ESM bundle (`vision_bundle.mjs`) from the server.
3. **Initialization**: The SDK is initialized with server-hosted paths for WASM binaries and model files.

### Asset Locations
The server maps `/mediapipe/` requests to these local paths:
- **SDK Bundle**: `@ops/Ops.Local.MediaPipePose/tasks-vision/vision_bundle.mjs`
- **WASM Binaries**: `@ops/Ops.Local.MediaPipePose/tasks-vision/wasm/`
- **Models**: `@ops/Ops.Local.MediaPipePose/models/`

## Inputs

| Port Name | Type | Default Value | Example Input | Description |
|-----------|------|---------------|---------------|-------------|
| Render | Trigger | - | - | Triggers detection on the current video frame. |
| Active | Boolean | true | true | Enables or disables the pose detection logic. |
| Video Element | Object | - | [Video Object] | The HTML Video object to analyze (from DesktopTexture, etc). |
| Server URL | String | http://127.0.0.1:8000 | http://localhost:8000 | The base URL of the SocketCluster server hosting the assets. |
| Model Path | String | /mediapipe/models/pose_landmarker_heavy.task | /mediapipe/models/pose_landmarker_lite.task | Path to the `.task` model file on the server. |
| Delegate | DropDown | GPU | GPU | Processing unit: GPU (WebObject) or CPU (fallback). |
| Num Poses | Integer | 1 | 1 | Maximum number of individual bodies to detect. |
| Min Detection Confidence | Number | 0.5 | 0.7 | Threshold for a pose to be detected. |
| Min Tracking Confidence | Number | 0.5 | 0.6 | Threshold for tracking a detected pose between frames. |

## Outputs

| Port Name | Type | Description |
|-----------|------|-------------|
| Next | Trigger | Triggers the next operator in the chain after detection. |
| Landmarks | Object | Array of normalized pose landmarks (x, y, z in 0.0-1.0 range). |
| World Landmarks | Object | Array of 3D landmarks in meters (centered around the pelvis). |
| Loaded | Boolean | True when the model and WASM assets are successfully loaded. |
| Error | String | Detailed error message if initialization or detection fails. |

## Troubleshooting
If the operator fails to load:
1. Ensure the **SocketCluster Static Server** is active and its port matches the **Server URL**.
2. Check the server console for "MediaPipe file not found" errors to verify the absolute file paths.
3. Ensure the `tasks-vision` folder exists in the operator directory.
