# slides_preload.js - Google Slides Preload Specification

`slides_preload.js` is a specialized preload script for **Google Slides** presentations embedded within the `Ops.Extension.Standalone.Electron.WebView` op.

It provides zero-copy GPU frame rasterization, background transparency stripping, and smooth slide navigation with full transition animations via `MessagePort` object messaging.

---

## Features

1. **HTML-in-Canvas Zero-Copy GPU Compositing**:
   - Hooks into the Google Slides SVG render tree and draws elements into an internal canvas element.
   - Captures `ImageBitmap` frames on the GPU compositor and transfers them over a private `MessagePort` to WebGL (`CGL.Texture`) at up to 60 FPS with zero memory copy.
2. **Transparent Presentation Backgrounds**:
   - Injects custom CSS rules to strip backgrounds from `html`, `body`, `.punch-viewer-*`, `.sketchyViewer*`, overlays, and fullscreen backdrops.
   - Hides Google Slides bottom navigation and action bars (`.punch-viewer-navbar`, `.punch-viewer-action-bar`) so slides fill 100% of the viewport.
3. **SVG Backdrop Color Deletion**:
   - Scans and removes colored SVG backdrop rectangles (e.g. keying out `#abcdef` or default slide background colors).
4. **Smooth Slide Transition Animations**:
   - Dispatches natural mouse wheel input events (`deltaY: -120` / `120`) to the Google Slides viewer canvas, triggering Google Slides native CSS 3D/fade/slide transitions.
   - Initiates an automatic 600ms high-frequency frame capture burst during transitions so all intermediate animated frames render into WebGL.

---

## Inbound Message Protocol (`Message In`)

Send these JavaScript objects to the **Message In** port on `Ops.Extension.Standalone.Electron.WebView` and trigger the **Send** button:

### 1. Slide Navigation

#### Advance to Next Slide
```json
{
  "type": "next-slide"
}
```
*Aliases*: `{ "type": "next" }`

#### Return to Previous Slide
```json
{
  "type": "previous-slide"
}
```
*Aliases*: `{ "type": "prev" }`

#### Jump to Specific Slide Number
```json
{
  "type": "set-slide",
  "slide": 3
}
```

---

### 2. Background Color Stripping

Strips a specific background fill color from SVG rect/path elements across the presentation:

```json
{
  "type": "set-remove-color",
  "color": "#abcdef"
}
```
*Aliases*: `{ "type": "remove-bg-color", "payload": "#abcdef" }`

---

### 3. URL Loading

Loads a new Google Slides presentation URL or published embed link:

```json
{
  "type": "load-url",
  "url": "https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub"
}
```
*Aliases*: `{ "type": "set-url", "url": "..." }`, `{ "type": "navigate", "url": "..." }`

---

### 4. Frame Rendering Request

Forces an immediate capture and frame transfer:

```json
{
  "type": "request-frame"
}
```

---

## Outbound Message Protocol (`Message Out`)

The preload script emits the following objects to **Message Out** and triggers **On Message**:

### 1. Slide Navigation Confirmation
```json
{
  "type": "slide-navigated",
  "direction": "next"
}
```

### 2. Background Color Removal Confirmation
```json
{
  "type": "color-removed",
  "color": "#abcdef"
}
```

---

## Cables Patch Integration Example

```
+-----------------------------------------------------------------+
|                        Cables Patch Flow                        |
|                                                                 |
|  [Ops.Ui.Button (Next Slide)]                                   |
|           |                                                     |
|           v (Trigger)                                           |
|  [Ops.Object.Object] (Value: { "type": "next-slide" })          |
|           |                                                     |
|           v (Object)                                            |
|  [Ops.Extension.Standalone.Electron.WebView]                   |
|    - Message In <--- [Ops.Object.Object]                        |
|    - Send       <--- [Ops.Ui.Button]                            |
|    - Message Out ---> [Ops.Object.ObjectToString]              |
|    - On Message  ---> [Ops.Ui.TriggerCounter]                   |
|    - Texture     ---> [Ops.Gl.Texture.TexturePass]              |
+-----------------------------------------------------------------+
```
