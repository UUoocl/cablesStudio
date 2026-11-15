# STG Field (Headless & Remote Controlled)

This version of the Space Type Generator (Field) is designed for headless rendering within Cables, direct WebSocket registration with `apps/settings_dashboard.html`, and real-time visual overlays in **OBS Studio** (via Browser Source) or **Camo Studio** (as a web overlay).

## Live Streaming & Camera Overlay (OBS / Camo)

The sketch is specifically intended for broadcast and camera overlays:
- **Transparent Background**: Set `bkgdColor` to `#ffffff00`, `#00000000`, or `transparent`. The WebGL buffer is cleared to transparent `(0, 0, 0, 0)` so camera and video feeds show through cleanly underneath the animated typographic grid.
- **OBS Studio Setup**:
  1. Add a **Browser Source** in OBS Studio.
  2. Set the URL: `http://127.0.0.1:8080/space_type_generator-ws/field/index.html?width=1920&height=1080`
  3. Set Width/Height to match your canvas (e.g., `1920` x `1080`).
  4. Ensure background remains transparent.
- **Camo Studio Setup**:
  1. Add a **Web Overlay** layer in Camo Studio.
  2. Point the URL to: `http://127.0.0.1:8080/space_type_generator-ws/field/index.html`
  3. Live parameters can be dynamically controlled in real time via `apps/settings_dashboard.html` or Cables Standalone.

## Integration

### 1. Settings Dashboard (`apps/settings_dashboard.html`)
```
http://127.0.0.1:8080/space_type_generator-ws/field/index.html
```
When connected, the client automatically dispatches a `client:register` manifest under client ID `stg-field` (or a custom `clientID` if specified). In the dashboard, parameters are dynamically rendered into grouped Tweakpane controls (`Content`, `Grid`, `Typography`, `Wave`, `Camera`, `Colors`, and `Text Clear`), with support for undocking into a separate draggable pane.

### 2. Multi-Instance Setup (No Feedback Loop)
You can open multiple concurrent instances of the client simultaneously without interference or feedback loops by providing unique `clientID` and initial `preset` query parameters:

```
Instance 1:
http://127.0.0.1:8080/space_type_generator-ws/field/index.html?clientID=field-left&preset=stacks

Instance 2:
http://127.0.0.1:8080/space_type_generator-ws/field/index.html?clientID=field-right&preset=complexz
```

- **`clientID`**: Sets an isolated client identifier (`stg-field` by default). Messages and parameter updates destined for one client ID are ignored by other instances.
- **`preset`** (or `p`): Immediately applies a preset style (`default`, `stacks`, `bricks`, `simplez`, `complexz`, `zebra`, `harlequin`, `pride`) on initial load and synchronizes it with the dashboard manifest.

### 3. Connection & Query Parameters
WebSocket connection connects automatically on load (defaulting to the current host or `127.0.0.1:8080`).
```
http://127.0.0.1:8080/space_type_generator-ws/field/index.html?clientID=field-1&preset=simplez&width=1920&height=1080
```
- `ws`: Custom WebSocket host/port (e.g. `?ws=127.0.0.1:8080` or disable with `?ws=false`).
- `clientID`: Custom client ID for targeted message handling.
- `preset` (or `p`): Preload visual preset on startup.
- `width` / `height`: Optional initial canvas dimensions.

## Settings Schema

All values are optional. The sketch updates only the keys provided in the JSON object.

| Key | Type | Description | Range |
| :--- | :--- | :--- | :--- |
| `text` | `string` | The text content to render | Any |
| `preset` | `string` | Apply a predefined visual style | `default`, `stacks`, `bricks`, `simplez`, `complexz`, `zebra`, `harlequin`, `pride`, `reset` |
| `fullText` | `boolean` | Repeat text to fill the grid (`row * column`) | `true` / `false` |
| `column` | `number` | Number of grid columns | 1 - 100 |
| `row` | `number` | Number of grid rows | 1 - 100 |
| `tracking` | `number` | Horizontal character spacing | -10 - 100 |
| `lineSpace` | `number` | Vertical line spacing | -10 - 100 |
| `typeX` | `number` | Character width | 1 - 100 |
| `typeY` | `number` | Character height | 1 - 100 |
| `typeStroke` | `number` | Stroke weight | 0.1 - 10 |
| `speed` | `number` | Wave animation speed | -10 - 10 |
| `xOffset` | `number` | Horizontal wave frequency scale | 0.1 - 60 |
| `yOffset` | `number` | Vertical wave frequency scale | 0.1 - 60 |
| `zWave` | `number` | Z-axis wave amplitude | 0 - 200 |
| `xWave` | `number` | X-axis wave amplitude | 0 - 200 |
| `yWave` | `number` | Y-axis wave amplitude | 0 - 200 |
| `xRotCamera` | `number` | Camera X rotation (deg) | -180 - 180 |
| `yRotCamera` | `number` | Camera Y rotation (deg) | -180 - 180 |
| `zRotCamera` | `number` | Camera Z rotation (deg) | -180 - 180 |
| `zoomCamera` | `number` | Camera Z offset | -500 - 500 |
| `bkgdColor` | `string` | Background color (`#ffffff00` for transparent) | CSS / Hex |
| `color1`..`color6` | `string` | Row colors | CSS / Hex |
| `inpNumber` | `number` | Number of active colors | 1 - 6 |

