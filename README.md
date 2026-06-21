# Cables Studio Standalone Patches

A professional, high-performance ecosystem of custom operators and patches designed for the Cables Studio Electron and browser environments. **This project demonstrates Cables as a powerful, low-code local automation tool**, bridging WebGL interactive rendering with local hardware, native Apple APIs, local network gateways, and real-time streaming protocols. 

By using visual patching logic, developers and artists can build sophisticated automation workflows—from offline neural vision pipelines to automated presentation controls—without writing complex backend boilerplate code.

---

## 🔌 Cables as a Low-Code Local Automation Hub

Traditionally, WebGL environments are isolated sandboxes. Cables Studio breaks these boundaries, serving as a local runtime orchestrator:

*   **Visual Workflow Orchestration**: Chain data flows and triggers (such as voice recognition, global keystrokes, gamepad actions, or REST API calls) directly into rendering transformations, scene updates, or system-level actions.
*   **Zero-Boilerplate Desktop Bridges**: Avoid writing custom native C++/Swift wrappers, Node server scripts, or complex socket pipelines. The standalone operators handle background process execution, hardware bindings, and IPC protocols under the hood, exposing them as standard, reusable inputs and outputs in the Cables patch editor.
*   **Rapid Prototyping & Testing**: Combine visual modules to rapidly construct pipelines (e.g. routing a webcam feed to an offline CoreML hand tracker, converting coordinates to game controller rumble parameters, or triggering PowerPoint transitions via Stream Deck).

---

## 🚀 Core Architectural Pillars

### 1. Swift Sidecar Framework (macOS Native Integrations)
A robust suite of macOS-exclusive operators that launch compiled native Swift binaries in the background. These sidecars communicate with the Electron host using local IPC/sockets, granting the WebGL patch direct, low-overhead access to native Apple frameworks and specialized hardware.

*   **CoreML Vision & Face Tracking**: High-precision, offline neural analysis using Apple’s Vision framework, including `SwiftHumanFace`, `SwiftHumanHand`, `SwiftHumanPose2d`/`SwiftHumanPose3d`, and `SwiftPersonSegmentation`.
*   **Speech Recognition**: Real-time voice-to-text dictation utilizing Apple’s native Speech Recognition framework (`SwiftSpeechToText`).
*   **Office Controls**: Direct scripting interfaces to automate and query Microsoft PowerPoint (`SwiftPowerPointApi`) and Apple Keynote (`SwiftKeynoteApi`) presentations.
*   **Peripherals & Stream Decks**: Direct integration with hardware including Stream Decks (`SwiftStreamDeckKeyTexture`, `SwiftStreamDeckStretchedTexture`), Soomfon controllers (`SwiftSoomfonController`, `SwiftSoomfonKeyTexture`, `SwiftSoomfonStretchedTexture`), Ulanzi smart pixel clocks (`SwiftUlanziController`), and 8BitDo Xbox controllers.
*   **PTZ Camera Control**: High-speed, native control for Pan, Tilt, and Zoom operations on UVC-compliant cameras (`SwiftUvcController`, `SwiftUvcGetDevices`).
*   **System Event Monitors**: Background monitoring and control of keyboard/mouse events (`SwiftKeyboardMonitor`, `SwiftMouseMonitor`, `SwiftKeyboardController`, `SwiftMouseController`).

---

### 2. HttpFileServer Hub (Web API & Socket Gateway)
A local networking hub that transforms your Cables patch into a network-accessible automation controller, enabling client browsers (like phones, iPads, or other local devices) to interact with your WebGL scene in real-time.

*   **Asset & UI Server**: Spins up a local HTTP server (`HttpFileServer`) to host static files, custom control panel web interfaces, or remote assets.
*   **Custom REST APIs**: Listens to custom HTTP API endpoints (`HttpApiRouter`, `HttpFileServerResponse`) to receive remote GET/POST requests and return JSON responses.
*   **Real-time Sockets & SSE**: Handles bi-directional communication using WebSockets (`WebSocketRouter`, `WsPubSub`) and server-to-client events (`SubPatchSendSSE`) to push triggers, coordinates, and parameter updates to client screens instantly.

---

### 3. Real-Time Video Share: Syphon In/Out (macOS)
An open-source macOS framework integration for real-time video frame sharing between Cables and other creative video tools (Resolume Arena, MadMapper, OBS Studio, Millumin, etc.) at high frame rates and with minimal latency.

*   **Dual Integration Paths**: Supports both native Node-based wrappers (`NodeSyphon.SyphonIn`, `NodeSyphon.SyphonOut`) and compiled Swift-based sidecars (`SwiftSyphonIn`, `SwiftSyphonOut`).
*   **Ingest & Publish**: Stream your Cables GL viewport or offscreen RenderTargets directly to other software, or ingest external textures to use inside your Cables shaders.

---

### 4. Generic WebRTC Peer-to-Peer
A decoupled, zero-dependency WebRTC operator (`Ops.Extension.Standalone.Webrtc`) designed to work inside both local Electron apps and standard browser patches.

*   **Decoupled Signaling**: Exposes raw SDP strings as inputs and outputs, allowing you to establish connections manually via copy-paste or automate it by routing SDP strings over any patch transport (such as SMB file sharing, WebSocket pub-sub, or even QR codes).
*   **Media Streaming**: Captures WebGL canvas render buffers and Web Audio API MediaStreams to stream them P2P.
*   **Remote Displays**: Automatically aggregates remote tracks and exposes the incoming feed as a **Remote Video Element** object (plugs into `VideoTexture` to draw) and a **Remote Audio Stream** object (plugs into Web Audio nodes).
*   **Capability Indicators**: Status flags (`Has Audio`, `Has Video`, `Has Data`) dynamically inspect capability changes on connection descriptions.

---

## 🛠️ Other Available Patches

### 5. MediaPipe Local Standalone (Offline Computer Vision)
Provides offline, high-performance computer vision capabilities using Google's MediaPipe framework.
*   **FaceLandmarker**: Detects detailed face landmarks and blendshapes from a video or image texture.
*   **HandLandmarker**: Tracks hand positions, skeletal structures, and gestures in real-time.
*   **PoseLandmarker**: Performs full-body skeletal tracking for motion analysis and interaction.

https://github.com/user-attachments/assets/94d5deb8-cff3-42bc-ac68-60818ae5247b

### 6. OBS WebSocket Standalone
Enables direct control and automation of OBS Studio via the WebSocket v5 protocol.
*   **ObsLaunch**: Starts OBS Studio with the necessary command-line arguments for remote control and debugging.
*   **ObsConnect**: Establishes a persistent connection to OBS and broadcasts real-time server events.
*   **ObsRequest**: Composes and sends arbitrary requests to control scenes, sources, and settings in OBS.

https://github.com/user-attachments/assets/23b2c86b-44c5-4024-9fc8-cf518a19ee42

### 7. P5.js Standalone
Integrates the creative coding power of P5.js directly into the Cables GL rendering pipeline.
*   **P5Instance**: Executes P5.js sketches in instance mode and shares the resulting canvas as a high-performance texture.

### 8. Python Pynput Standalone
Bridges Cables with Python to access system-wide input monitoring and specialized hardware control.
*   **PythonConfig**: Defines the local environment settings and paths for the Python bridge execution.
*   **PythonGlobalKeyboardMonitor**: Listens for system-wide keyboard events and keystrokes regardless of window focus.
*   **PythonGlobalMouseMonitor**: Tracks global mouse coordinates and button clicks across the entire desktop.
*   **PythonUvcPtzControl**: Manages Pan, Tilt, and Zoom operations for UVC-compatible cameras through native commands.

https://github.com/user-attachments/assets/29ab12af-3d3f-43de-bddc-a37ac925ef1f

### 9. Headless Space Type Generator (STG)
Offline, standalone, transparent, and remote-controlled implementations of the 16 Kiel Mutschelknaus kinetic typography generators.
*   **Headless & Standalone**: Stripped of local DOM sliders and pickers, running entirely on a transparent canvas inside isolated iframe contexts.
*   **BroadcastChannel Sync**: Integrates a bi-directional messaging bridge (`pub-[channel]` and `sub-[channel]`) enabling remote control of sizes, counts, speeds, styles, and custom presets directly from Cables GL.
*   **Frame-Accurate Texture Capture**: Notifies the host operator on every single frame draw loop (`captureFrame`) to achieve seamless real-time WebGL rendering and frame-accurate capturing.
*   **Automated Text Erasure**: Built-in standardized timings (`clearTextDelay`, `seqInterval`) and erasure patterns (`all at once`, `sequential`, `reverseSeq`) directly inside the sketch drawing loop.

---

*AI Disclaimer: This project and its documentation were developed with the assistance of AI tools to ensure compatibility and maintain rigorous architectural standards across the standalone ecosystem.*
