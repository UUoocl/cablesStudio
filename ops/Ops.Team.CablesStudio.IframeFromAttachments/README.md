# Ops.Team.CablesStudio.IframeFromAttachments

**Unified Iframe Engine Bridge with Attachment Dependency Resolution for Cables.gl**

`IframeFromAttachments` dynamically loads and runs custom interactive HTML/JS attachment files (e.g. `index.html`) inside an isolated, cross-origin safe iframe context. It enables seamless integration of arbitrary web technologies (Three.js, P5.js, Reveal.js, D3.js, custom canvas apps, Web Audio synths) inside Cables.gl patches by streaming low-latency GPU frames and routing Web Audio outputs directly back into the Cables patch.

---

## Key Features

- **Automatic Dependency Resolution**: Injects a `<base>` tag referencing the absolute Cables asset path directory. This ensures relative `<script src="sketch.js">` or asset references inside your HTML attachment resolve cleanly and load without errors.
- **Zero-Copy GPU Frame Streaming**: Utilizes WebCodecs `VideoFrame` API to capture the iframe's internal `<canvas>` at its native frame rate, transferring GPU texture handles directly to Cables.gl with zero CPU memory copies.
- **Universal Web Audio Interception**: Monkey-patches `AudioNode.prototype.connect` inside the iframe. Any synth, sample player, or sound library (Tone.js, Howler.js, P5.sound, etc.) connecting to the speakers is automatically rerouted into a Cables Web Audio node, muting local speaker output to prevent double-audio issues.
- **Bi-directional Variables IPC**: Implements BroadcastChannel messaging (`postMessage`) to remotely update variables inside the iframe's JS context. Supports targeting nested object namespaces (e.g. `p5.instance`).
- **Flexible UI Layout controls**: Choose whether the iframe is fully visible/interactive on screen at a specific pixel size, offset position, layer ordering (z-index), and opacity, or let it run offscreen (`Show UI = false`) where the browser will continue rendering canvas frames without throttling.

---

## Input Ports

### Source
- `HTML Attachment` (String): The filename of the uploaded Cables HTML attachment to load (e.g. `index.html`).
- `Iframe ID` (String): The DOM `id` attribute set on the iframe element (useful for targeted CSS styling or query selector lookup).

### IPC
- `Target Object Scope` (String): Dot-separated object path in the iframe to receive incoming variables (e.g., `window`, `p5.instance`).
- `Broadcast Channel` (String): Name of the `BroadcastChannel` to communicate with the iframe.

### Layout
- `Show UI` (Boolean): Toggle visibility of the iframe overlay on the Cables canvas. If `false`, the iframe runs offscreen to prevent browser throttling.
- `Width` (Number): CSS width in pixels.
- `Height` (Number): CSS height in pixels.
- `Position X` (Number): X coordinate offset in pixels.
- `Position Y` (Number): Y coordinate offset in pixels.
- `Position Z` (Number): CSS `z-index` layer offset of the iframe UI overlay.
- `Opacity` (Number): Opacity multiplier (0.0 to 1.0) of the iframe UI overlay.

### Texture
- `Flip Y` (Boolean): Vertically flip the captured GPU texture frame (standard for WebGL mapping).

---

## Output Ports

- `Texture Out` (Texture): Native Cables `CGL.Texture` containing the latest frame from the iframe's canvas.
- `Texture Updated` (Trigger): Fired on every new frame upload, letting downstream ops know a redraw is needed.
- `Audio Node Out` (Object): Web Audio API `AudioNode` containing all audio output intercepted from the iframe.
- `Iframe Element` (Object): Reference to the created HTMLIframeElement.
- `Message Out` (Object): Outputs the last message received from the iframe over the BroadcastChannel.
- `Message Received` (Trigger): Fired whenever a new message is received from the iframe over the BroadcastChannel.

---

## Setup & Implementation Details

When the attachment HTML loads:
1. A `<base href="[CABLES_ASSETS_DIR]">` tag is injected before the rest of the `<head>` scripts run, mapping relative references to the Cables patch assets folder.
2. A variable proxy script is pre-injected to listen for BroadcastChannel messages. It updates global properties on the window (e.g. `window.fontSize = 100`) and automatically triggers standard updates like `window.onMessageChange()` or `window.redraw()`.
3. Intercepted audio is routed via `cablesAudioCtx.createMediaStreamSource(win._cablesAudioStream)`.

---

## BroadcastChannel IPC Control Examples

To send variables from Cables.gl to the iframe's Javascript context, open a `BroadcastChannel` using the name specified in the **Broadcast Channel** input port (defaults to `cables_iframe_channel`).

### Example A: Single Variable Update
To set a single variable, send a message containing the `key` and `value` fields:
```javascript
const channel = new BroadcastChannel("cables_iframe_channel");

// Set the variable window.message to "CABLES"
channel.postMessage({
  type: "SET_VAR",
  key: "message",
  value: "CABLES"
});
```

### Example B: Multiple/Batch Variable Update
To update multiple variables simultaneously and avoid callback overhead (the operator will apply all updates and trigger a single redraw callback at the end of the batch), send a `vars` dictionary object:
```javascript
const channel = new BroadcastChannel("cables_iframe_channel");

// Set multiple window variables all at once
channel.postMessage({
  type: "SET_VARS", // or "SET_VAR"
  vars: {
    message: "BATCHED",
    fontSize: 150,
    lineMultiplication: 25,
    randomness: 0.5
  }
});
```

