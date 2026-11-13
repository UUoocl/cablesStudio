# Mouse Overlays

Interactive visual overlay applications designed to follow or react to mouse movement, clicks, and scroll events. These overlays can run standalone in a browser, inside OBS browser sources, or integrated with Cables.gl and the Tweakpane Settings Dashboard (`apps/settings_dashboard.html`).

## Directory Structure

The overlay applications are structured into dedicated subfolders mirroring the modular architecture of `apps/space_type_generator-ws/`:

```
apps/mouse_overlays/
├── magic_wand/                  # p5.js sparkly magic wand particle trail & click bursts
│   ├── index.html
│   ├── preset.js                # Preset definitions (default, sparkle, fire, neon, galaxy, pastel)
│   ├── registration.js          # Client manifest & parameter schema
│   ├── websocket.js             # Dual WebSocket & BroadcastChannel bridge + Soft Takeover
│   ├── class.js                 # Star particle physics and drawing
│   ├── sketch.js                # p5 canvas setup and particle render loop
│   ├── style.css
│   └── README.md
│
├── trassel/                     # Canvas 2D procedural ribbon & brush drawing
│   ├── index.html
│   ├── preset.js                # Preset definitions (default, brush, line, dash, worm, turbo_brush)
│   ├── registration.js          # Client manifest & parameter schema
│   ├── websocket.js             # Dual WebSocket & BroadcastChannel bridge + Soft Takeover
│   ├── sketch.js                # Multi-canvas procedural drawing engine
│   ├── style.css
│   └── README.md
│
├── astro_bee/                   # p5.js WebGL 3D robot cursor follower
│   ├── index.html
│   ├── preset.js                # Preset definitions (default, close_up, fast_follower, zen, mini)
│   ├── registration.js          # Client manifest & parameter schema
│   ├── websocket.js             # Dual WebSocket & BroadcastChannel bridge + Soft Takeover
│   ├── sketch.js                # WebGL 3D model rendering, lighting & microgravity physics
│   ├── style.css
│   └── README.md
│
├── flow_highlight/              # Cables.gl GPU fast fluid simulation overlay
│   ├── index.html
│   ├── preset.js                # Preset definitions (default, neon_flow, high_viscosity, rapid_dissolve)
│   ├── registration.js          # Client manifest & parameter schema
│   ├── websocket.js             # Dual WebSocket & BroadcastChannel bridge + Soft Takeover
│   ├── main.js                  # Cables patch controller and variable synchronization
│   ├── style.css
│   └── README.md
│
├── lib/                         # Shared libraries (p5.min.js, tweakpane.min.js)
├── models/                      # 3D models (bee.glb, bee3.obj, etc.)
├── patches/                     # Cables exported patches (Fast_Fluid_Simulation.js)
│
├── p5_magicWand.html            # Backward-compatibility redirect wrapper -> magic_wand/
├── js_trassel.html              # Backward-compatibility redirect wrapper -> trassel/
├── p5_astro_bee.html            # Backward-compatibility redirect wrapper -> astro_bee/
└── cables_flow_highlight.html   # Backward-compatibility redirect wrapper -> flow_highlight/
```

## Shared Architectural Pattern

Each overlay subfolder adheres to the unified client structure:
1. **`preset.js`**: Defines `var customPresets = { ... }` with preset parameters. Supports `POST /api/savepreset` from `settings_dashboard.html`.
2. **`registration.js`**: Identifies the client (`CLIENT_ID`, `originId`), registers parameters with `client:register`, dynamically builds preset options, and supports custom query params (`clientID`, `preset`).
3. **`websocket.js`**: Listens for WebSocket and BroadcastChannel events, prevents feedback loops, integrates `SoftTakeoverClient` filtering, and routes updates.
4. **`sketch.js` / `main.js`**: Renders the visuals, reacts to mouse/click/scroll events, applies presets (`applyCustomPreset`), and registers with the dashboard on startup.

## Common URL Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientID` / `clientId` | string | Subfolder default | Custom identifier for multi-instance dashboard targeting |
| `preset` / `p` | string | `default` | Initial preset loaded on start |
| `ws` | boolean / string | - | Enable WebSocket client connection (e.g. `ws=1` or `ws=127.0.0.1:8080`) |
| `bc` / `channel` | string | Overlay default | BroadcastChannel name for local synchronization |
| `width` / `height` | number | window size | Initial viewport dimension override |

## Broadcast Channel Protocol (Payload Schema)

All messages sent over BroadcastChannel or WebSocket use standard JSON payloads:

### 1. Mouse Move (`mouse_move`)
```json
{
  "type": "mouse_move",
  "x": 0.5,
  "y": 0.8,
  "normalized": true
}
```
* **`normalized`**: If `true`, coordinates are scaled from `[0.0, 1.0]` to `window.innerWidth` and `window.innerHeight`.

### 2. Mouse Click (`mouse_click`)
```json
{
  "type": "mouse_click",
  "pressed": true,
  "button": "MB1"
}
```

### 3. Mouse Scroll (`mouse_scroll`)
```json
{
  "type": "mouse_scroll",
  "dy": -12.5
}
```

### 4. Parameter Updates (`client:update` / `param:update`)
```json
{
  "type": "param:update",
  "clientId": "p5-magic-wand",
  "parameters": {
    "starSize": 18,
    "colorMove": "#00ffff"
  }
}
```
