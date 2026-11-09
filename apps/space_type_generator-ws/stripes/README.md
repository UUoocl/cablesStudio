# STG Stripes (Headless & Remote Controlled)

This version of the Space Type Generator (Stripes) is designed for headless rendering within Cables, direct WebSocket registration with `apps/settings_dashboard.html`, and real-time visual overlays in **OBS Studio** (via Browser Source) or **Camo Studio** (as a web overlay).

## Live Streaming & Camera Overlay (OBS / Camo)

The sketch is specifically intended for broadcast and camera overlays:
- **Transparent Background**: Set `bkgdColor` to `#ffffff00`, `#00000000`, or `transparent`. The canvas buffer is cleared to transparent `(0, 0, 0, 0)` so camera and video feeds show through cleanly underneath the animated ribbon stripes.
- **OBS Studio Setup**:
  1. Add a **Browser Source** in OBS Studio.
  2. Set the URL: `http://127.0.0.1:8080/space_type_generator-ws/stripes/index.html?ws=true&width=1920&height=1080`
  3. Set Width/Height to match your canvas (e.g., `1920` x `1080`).
  4. Ensure background remains transparent.
- **Camo Studio Setup**:
  1. Add a **Web Overlay** layer in Camo Studio.
  2. Point the URL to: `http://127.0.0.1:8080/space_type_generator-ws/stripes/index.html?ws=true`
  3. Live parameters can be dynamically controlled in real time via `apps/settings_dashboard.html` or Cables Standalone.

## Integration

### 1. Settings Dashboard (`apps/settings_dashboard.html`)
Launch with `?ws=true` (or pointing to a custom WebSocket server):
```
http://127.0.0.1:8080/space_type_generator-ws/stripes/index.html?ws=true
```
When connected, the client automatically dispatches a `client:register` manifest under client ID `stg-stripes`. In the dashboard, parameters are dynamically rendered into grouped Tweakpane controls (`Content`, `Ribbons`, `Wave`, `Typography`, `Colors`, and `Text Clear`), with support for undocking into a separate draggable pane.

### 2. BroadcastChannel
```
http://127.0.0.1:8080/space_type_generator-ws/stripes/index.html?channel=YOUR_CHANNEL_NAME&width=1024&height=1024
```
- `channel` or `bc`: BroadcastChannel name for synchronization.
- `width` / `height`: Optional initial canvas dimensions.
- `ws`: Enable WebSocket client connection (defaults to `127.0.0.1:8080` or pass custom host `?ws=127.0.0.1:8080`).

### 3. Real-Time Keyboard Input
The sketch listens for `keyboard_pressed` messages from the macOS keyboard monitor or WebSocket bridges:
```json
{
  "type": "keyboard_pressed",
  "combo": "cmd + tab",
  "key": "tab",
  "modifiers": "cmd"
}
```
When received, the ribbon text updates immediately to display the pressed key or key combo, resetting the auto-clear timer.

## Settings Schema

All values are optional. The sketch updates only the keys provided in the JSON object.

| Group | Key | Type | Description | Range |
| :--- | :--- | :--- | :--- | :--- |
| **Content** | `text` | `string` | The text string rendered along ribbons | Any string |
| | `preset` | `string` | Visual preset style | `marquee`, `subway`, `simplewave`, `oldsea`, `colorsea`, `wow`, `stacks`, `notsoweird`, `racer`, `simplewave2`, `pride`, `reset` |
| | `hideNoText` | `boolean` | Suppress rendering when text is empty | `true` / `false` |
| **Ribbons** | `ribbonCount` | `int` | Number of ribbon stripes | 1 - 50 |
| | `ribbonSpaceX` | `float` | Horizontal spacing between ribbons | -100 - 100 |
| | `ribbonSpaceY` | `float` | Vertical spacing between ribbons | -100 - 100 |
| | `ribbonSize` | `float` | Ribbon ribbon ribbon width/thickness | 1 - 100 |
| | `ribbonOffset` | `float` | Phase offset between ribbons | 0 - 5 |
| **Wave** | `yWave` | `float` | Wave amplitude | 0 - 300 |
| | `speed` | `float` | Wave speed | -0.1 - 0.1 |
| | `offset` | `float` | Wave phase offset | 0 - 6.28 |
| | `slope` | `float` | Wave slope / curvature | 0.1 - 10 |
| **Typography** | `typeX` | `float` | Character width | 1 - 100 |
| | `typeY` | `float` | Character height | 1 - 100 |
| | `typeStroke` | `float` | Font stroke thickness | 0.5 - 10 |
| | `tracking` | `float` | Letter tracking / spacing | -50 - 100 |
| **Colors** | `bkgdColor` | `color` | Background color (supports alpha) | e.g. `"#ffffff00"` (transparent) |
| | `color1`..`color6` | `color` | Ribbon & typography color slots | Hex color strings |
| | `inpNumber` | `int` | Number of active color slots | 1 - 6 |
| **Text Clear** | `clearTextDelay` | `float` | Delay before auto-clearing (ms) | 0 - 10000 |
| | `clearMethod` | `string` | Clearing transition style | `all at once`, `sequential`, `reverseSeq` |
| | `seqInterval` | `float` | Step interval for sequential clear (ms) | 10 - 1000 |

