# STG Cylinder (Headless & Remote Controlled)

This version of the Space Type Generator (Cylinder) is designed for headless rendering within Cables, direct WebSocket registration with `apps/settings_dashboard.html`, and real-time visual overlays in **OBS Studio** (via Browser Source) or **Camo Studio** (as a web overlay).

## Live Streaming & Camera Overlay (OBS / Camo)

The sketch is specifically intended for broadcast and camera overlays:
- **Transparent Background**: Set `bkgdColor` to `#ffffff00`, `#00000000`, or `transparent`. The WebGL buffer is cleared to transparent `(0, 0, 0, 0)` so camera and video feeds show through cleanly underneath the rotating 3D typography without any background clipping.
- **OBS Studio Setup**:
  1. Add a **Browser Source** in OBS Studio.
  2. Set the URL: `http://127.0.0.1:8080/space_type_generator-ws/cylinder/index.html?ws=true&width=1920&height=1080`
  3. Set Width/Height to match your canvas (e.g., `1920` x `1080`).
  4. Ensure background remains transparent.
- **Camo Studio Setup**:
  1. Add a **Web Overlay** layer in Camo Studio.
  2. Point the URL to: `http://127.0.0.1:8080/space_type_generator-ws/cylinder/index.html?ws=true`
  3. Live parameters can be dynamically controlled in real time via `apps/settings_dashboard.html` or MIDI hardware knobs.

## Integration

### 1. Settings Dashboard (`apps/settings_dashboard.html`)
Launch with `?ws=true` (or pointing to a custom WebSocket server):
```
http://127.0.0.1:8080/space_type_generator-ws/cylinder/index.html?ws=true
```
When connected, the client automatically dispatches a `client:register` manifest under client ID `stg-cylinder`. In the dashboard, all 36 parameters are dynamically rendered into grouped Tweakpane controls (`Content`, `Cylinder`, `Wave & Depth`, `Typography`, `Camera`, `Colors`, and `Text Clear`), with support for undocking into a separate draggable pane and MIDI knob mapping.

### 2. BroadcastChannel
```
http://127.0.0.1:8080/space_type_generator-ws/cylinder/index.html?channel=YOUR_CHANNEL_NAME&width=1024&height=1024
```
- `channel` or `bc`: BroadcastChannel name for synchronization.
- `width` / `height`: Optional initial canvas dimensions.
- `ws`: Enable WebSocket client connection (defaults to `127.0.0.1:8080` or pass custom host `?ws=127.0.0.1:8080`).

### 3. Capture
Use the `Ops.Local.GetIframeCanvas` operator in Cables to retrieve the DOM canvas element from the iframe and pipe it into a `CanvasToTexture` operator.


## Settings Schema

All values are optional. The sketch updates only the keys provided in the JSON object.

| Key | Type | Description | Range |
| :--- | :--- | :--- | :--- |
| `text` | `string` | The text content to render | Any |
| `preset` | `string` | Apply a predefined visual style | `simple`, `jellyfish`, `crown`, `complex`, `weave`, `zebra`, `hoops`, `pride`, `reset` |
| `radius` | `number` | Cylinder radius | 0 - 1000 |
| `stackNum` | `number` | Number of text rings in the stack | 1 - 30 |
| `rRotate` | `number` | Constant rotation speed | -100 - 100 |
| `rOffset` | `number` | Step rotation between rings | 0 - 1.57 (PI/2) |
| `rWaveCount` | `number` | Number of wave peaks | 0 - 10 |
| `rWaveSpeed` | `number` | Speed of wave animation | 0 - 100 |
| `rWave` | `number` | Latitude wave intensity | 0 - 200 |
| `rZaxis` | `number` | Ripple/Depth intensity | 0 - 100 |
| `strecherX` | `number` | Horizontal wave scaling | 0 - 80 |
| `strecherY` | `number` | Vertical wave scaling | 0 - 100 |
| `typeX` | `number` | Font width scaling | 0 - 100 |
| `typeY` | `number` | Font height scaling | 0 - 100 |
| `typeStroke` | `number` | Outline thickness | 0 - 10 |
| `xRotCamera` | `number` | Camera X rotation | -180 - 180 |
| `yRotCamera` | `number` | Camera Y rotation | -180 - 180 |
| `zRotCamera` | `number` | Camera Z rotation | -180 - 180 |
| `zoomCamera` | `number` | Camera zoom (Z-translate) | -500 - 500 |
| `bkgdColor` | `string` | Background color (Hex / Alpha / Transparent) | e.g. `"#ffffff00"` (transparent), `"#000000"` |
| `color1` | `string` | Text/Stroke color (Hex) | e.g. `"#000000"` |

## Example Payload

Copy this into a Cables **Object** node and send it to the `BcSTG_Cylinder` operator:

```json
{
  "preset": "jellyfish",
  "text": "MODERNIZED",
  "zoomCamera": -100
}
```

## Internal Bridge Logic

- **Ready Signal**: Upon initialization, the sketch broadcasts a `ready` message. This can be used to trigger the `GetIframeCanvas` operator to start the capture.
- **Draw Synchronization**: The sketch broadcasts a `draw` message every frame. Connect the `On Draw` trigger from `BcSTG_Cylinder` to a `CanvasToTexture` operator for frame-accurate updates.
- **Dynamic Resizing**: The sketch listens for `resize` messages from the parent window to update its canvas dimensions without a reload.
- **Initial Sizing**: The canvas size can be initialized via the `width` and `height` query parameters in the URL.


