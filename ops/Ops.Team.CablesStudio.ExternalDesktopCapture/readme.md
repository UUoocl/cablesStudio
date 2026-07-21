# External Desktop Capture Operator

**Op Identifier**: `Ops.Team.CablesStudio.ExternalDesktopCapture`

A high-performance Cables.gl operator designed to capture screen, monitor, window, or browser tab video and audio from a lightweight child popup runner window, streaming the media directly into WebGL textures and Web Audio nodes within Cables.

---

## Key Architecture & Features

### 1. Child Popup Runner Architecture
* **Cross-Origin & Permission Isolation**: Browser security policies restrict `navigator.mediaDevices.getDisplayMedia` when called from within embedded iframes or sandbox contexts. This operator launches a lightweight popup window ("Desktop Capture Runner") to safely prompt the user for screen capture permissions.
* **BroadcastChannel Synchronization**: Communicates status, capture start/stop events, and error messages bidirectionally between the runner window and Cables using a `BroadcastChannel` (`desktop-capture-sync`).

---

### 2. Direct GPU Canvas Frame Sharing
* **Zero-IPC / Zero-Peer Connection Overhead**: Because both the child popup runner window and the main Cables editor run in the same browser origin, the child window exposes its MediaStream instance (`window.captureStream`) directly to the parent context.
* **Direct WebGL Texture Upload**:
  - The parent operator binds the child's `captureStream` to a hidden `<video>` element (`videoElement`).
  - On every render tick (`Update`), the current video frame is uploaded straight to a WebGL texture (`CGL.Texture`) via `gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)`.
  - This bypasses slow WebRTC peer connections, WebSocket streaming, base64 encoding, or blob serialization, achieving maximum frame rates with minimal CPU/GPU overhead.
* **Orientation & Transformation Controls**:
  - **Flip Y**: Handled natively in WebGL pixel unpack alignment (`gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL)`).
  - **Flip X**: Uses a high-performance offscreen 2D canvas context (`offscreenCanvas`) to mirror the video horizontally (`scale(-1, 1)`) prior to WebGL texture upload.

---

### 3. Audio Sharing & Web Audio Integration
* **Track Extraction**: Automatically detects and extracts audio tracks from `childWindow.captureStream.getAudioTracks()`.
* **Web Audio Pipeline**:
  - Integrates with `CABLES.WEBAUDIO` (or global `AudioContext`).
  - Connects the captured stream to a `MediaStreamAudioSourceNode`.
  - Routes audio through a Web Audio `GainNode` linked to the `Volume` slider input.
  - Outputs `outAudioNode`, allowing captured desktop audio to be processed by downstream Cables audio ops (e.g. spectrum analyzers, equalizers, spatial audio, etc.).

---

## Inputs & Outputs Reference

### Input Ports

| Group | Port Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **Controls** | `Update` | Trigger | Render loop trigger. Uploads the latest video frame to WebGL texture. |
| | `Open Child` | Trigger Button | Opens the desktop capture runner popup window. |
| | `Close Child` | Trigger Button | Closes the child runner window and cleans up GPU/audio resources. |
| | `Start Capture` | Trigger Button | Initiates screen capture in the child runner window. |
| | `Stop Capture` | Trigger Button | Stops active screen capture. |
| | `Broadcast Channel Name` | String | Name of the BroadcastChannel used for IPC sync (default: `desktop-capture-sync`). |
| **Settings** | `Capture Type` | Select | Options: `Audio & Video`, `Video Only`, `Audio Only`. |
| | `Display Surface` | Select | Target restriction: `Any`, `Monitor`, `Window`, `Browser Tab`. |
| | `Show Child Preview` | Bool | Toggle video preview display inside the runner popup window. |
| **Resolution**| `Width` | Int | Ideal target width (default: `1280`). |
| | `Height` | Int | Ideal target height (default: `720`). |
| | `FPS` | Int | Ideal target frame rate (default: `30`). |
| **Audio** | `Volume` | Float | Audio gain multiplier (`0.0` to `1.0`+). |
| **Texture** | `Flip Y` | Bool | Flips the texture vertically (default: `true`). |
| | `Flip X` | Bool | Flips the texture horizontally (default: `false`). |

---

### Output Ports

| Port Name | Type | Description |
| :--- | :--- | :--- |
| `Next` | Trigger | Triggered on every update tick. |
| `Texture` | CGL Texture | The resulting WebGL texture containing the captured desktop video frame. |
| `Audio Node` | Object | Web Audio `GainNode` containing captured system/tab audio. |
| `Is Capturing` | Bool / Num | `true` when desktop capture is active and streaming. |
| `Texture Updated` | Trigger | Triggered whenever a new video frame is successfully uploaded to WebGL. |
| `Error` | String | Error message string if popup or capture fails. |
| `Window Status` | String | Status of child popup window (`open` or `closed`). |
| `WebRTC Status` | String | Pipeline status (`Direct GPU Sharing (Active)` or `disconnected`). |

---

## Quick Start Guide

1. Add **`Ops.Team.CablesStudio.ExternalDesktopCapture`** to your patch.
2. Click **Open Child** to launch the popup runner window.
3. Configure **Capture Type** (`Audio & Video`), **Resolution**, and **Display Surface**.
4. Click **Start Capture** (either from Cables or inside the runner window). Select the desired screen, window, or tab in the browser prompt.
5. Connect `Texture` to your WebGL material/mesh, and `Audio Node` to your Cables audio chain.
6. Connect your render loop to `Update`.
