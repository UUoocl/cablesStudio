# zoom_preload.js - Zoom Web Client Preload Specification

`zoom_preload.js` is a specialized preload script for **Zoom Web Client** meetings embedded within the `Ops.Extension.Standalone.Electron.WebView` op.

It observes meeting state (microphone mute status, video camera status, participant count, active speaker, and real-time chat messages via `MutationObserver`), relays all meeting events across the boundary to the host op's generic Object messaging interface (`Message Out`), and provides HTML-in-Canvas zero-copy GPU video frame streaming to WebGL `CGL.Texture`.

---

## Important Note on Video Canvas Streaming

> [!NOTE]
> **Video Canvas Lifecycle & Active Video Streams:**
> Zoom Web Client dynamically creates and paints to its native WebCodecs/WebGL rendering canvas (`<canvas id="video-player-canvas-...">` inside the Shadow DOM of `<video-player-container>`) **only when at least one participant has their video camera enabled or active screen sharing is occurring**.
>
> If no participants have video enabled (or during audio-only/avatar states), Zoom does not stream or paint video frames to the video canvas. During this state, the meeting state (`muted`, `videoOff`, `activeSpeaker`, `participantsCount`) and chat messages continue to be captured and emitted normally via `Message Out`. Video texture output becomes active as soon as a participant turns on their camera or begins sharing.

---

## Features

1. **Real-Time Meeting State Observer**:
   - Inspects the Zoom Web Client DOM and nested iframes (`#webclient`, `.pwa-webclient__iframe`).
   - Tracks:
     - `muted`: Microphone mute status (`true` / `false`).
     - `videoOff`: Video camera active status (`true` / `false`).
     - `participantsCount`: Current total participant count in the meeting (`number`).
     - `activeSpeaker`: Current active speaker display name (`string`).
   - Emits state updates immediately whenever a change occurs.

2. **Chat Message Stream via MutationObserver**:
   - Automatically detects and attaches a `MutationObserver` to the Zoom chat list container (`.chat-list`, `[class*="chat-list"]`, `[class*="chat-messages"]`).
   - Immediately captures and emits incoming chat messages with sender name, message text, and timestamp.

3. **Inbound Meeting Controls (`Message In`)**:
   - Responds to commands from the host op to control meeting features (mute/unmute, start/stop video, request frames, navigate).

4. **HTML-in-Canvas Zero-Copy GPU Compositing**:
   - Rasterizes the Zoom meeting view to WebGL textures via Blink HTML-in-Canvas / `ImageBitmap` zero-copy transfer pipeline at up to 30/60 FPS.

---

## Inbound Message Protocol (`Message In`)

Send these JavaScript objects to the **Message In** port on `Ops.Extension.Standalone.Electron.WebView` and trigger the **Send** button:

### 1. Toggle Microphone Mute
```json
{
  "type": "toggle-mic"
}
```
*Specific Actions*: `{ "type": "mute" }`, `{ "type": "unmute" }`

---

### 2. Toggle Video Camera
```json
{
  "type": "toggle-video"
}
```
*Specific Actions*: `{ "type": "start-video" }`, `{ "type": "stop-video" }`

---

### 3. Query Meeting State
Forces an immediate inspection and emission of the current meeting state:
```json
{
  "type": "get-state"
}
```

---

### 4. Navigate / Load URL
Navigates the webview to a new Zoom meeting URL:
```json
{
  "type": "load-url",
  "url": "https://app.zoom.us/wc/1234567890/join?fromPWA=1&pwd=your_password&uname=Your_Name"
}
```
*Aliases*: `{ "type": "set-url", "url": "..." }`, `{ "type": "navigate", "url": "..." }`

---

### 5. Request Immediate Video Frame
```json
{
  "type": "request-frame"
}
```

---

## Outbound Message Protocol (`Message Out`)

The preload script emits the following structured objects on **Message Out** and fires **On Message**:

### 1. Meeting State Update (`stateUpdate`)
Emitted whenever microphone, camera, active speaker, or participant count changes:
```json
{
  "type": "stateUpdate",
  "data": {
    "muted": false,
    "activeSpeaker": "Alice"
  },
  "muted": false,
  "videoOff": false,
  "activeSpeaker": "Alice",
  "participantsCount": 5
}
```

### 2. Chat Message (`chatMessage`)
Emitted instantly when a new chat message arrives:
```json
{
  "type": "chatMessage",
  "data": {
    "sender": "Bob",
    "message": "Hello everyone!",
    "timestamp": 1787391000000
  },
  "sender": "Bob",
  "message": "Hello everyone!"
}
```

### 3. Connection Status (`connectionStatus`)
Emitted on connection lifecycle events:
```json
{
  "type": "connectionStatus",
  "data": "connected"
}
```

---

## Zoom Meeting URL Format

When joining a meeting via URL in `Ops.Extension.Standalone.Electron.WebView`, construct the Zoom Web Client URL using this format:

```
https://app.zoom.us/wc/{MEETING_ID}/join?fromPWA=1&pwd={MEETING_PASSWORD}&uname={USER_NAME}
```

Example:
`https://app.zoom.us/wc/1234567890/join?fromPWA=1&pwd=abc123&uname=John%20Doe`
