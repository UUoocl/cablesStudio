# Client Registry (`Ops.Extension.Standalone.ClientRegistry`)

Manages dynamic registration of visualization clients (`client:register`) and synchronizes editable parameters in real time with the Tweakpane Settings Dashboard (`apps/mouse_overlays/settings_dashboard.html`).

## Protocol

### 1. Client Registration (`client:register`)
Visualization clients announce their editable parameters on WebSocket connection or when prompted by `client:discover`:

```json
{
  "type": "client:register",
  "originId": "p5-magic-wand-a1b2c3d",
  "manifest": {
    "clientId": "p5-magic-wand",
    "clientType": "p5",
    "name": "magic wand",
    "parameters": {
      "starSize": { "type": "float", "value": 10.0, "min": 1.0, "max": 50.0, "step": 0.5, "group": "Rendering" },
      "starDecay": { "type": "float", "value": 5.0, "min": 0.5, "max": 25.0, "step": 0.5, "group": "Rendering" },
      "colorMove": { "type": "color", "value": "#ffff00", "group": "Rendering" },
      "colorClick": { "type": "color", "value": "#ff00ff", "group": "Rendering" }
    },
    "subscriptions": { "mouse": true, "keyboard": false, "stateUpdates": true }
  }
}
```

### 2. Parameter Mutation (`client:update`)
When a parameter is adjusted in the Tweakpane Dashboard, it dispatches:

```json
{
  "type": "client:update",
  "originId": "dashboard-9f8e7d6",
  "clientId": "p5-magic-wand",
  "key": "starSize",
  "value": 18.5,
  "parameters": { "starSize": 18.5 }
}
```

### 3. Registry Synchronization (`registry:request` / `registry:sync`)
When a dashboard connects, it sends `{ "type": "registry:request" }`. The operator responds with `{ "type": "registry:sync", "clients": { ... } }` and triggers `{ "type": "client:discover" }` so any running visualization pages report their manifests.

## Patch Wiring
- **Automatic Mode**: Connect `Server Instance` from `Ops.Extension.Standalone.HttpFileServer` to `Server Instance` on `ClientRegistry`.
- **Port-Wired Mode**: Connect `On WS Message` -> `Process Message` and `WS Message Data` -> `WS Message Data`. Optionally wire `Send WS Trigger` -> `Send WS Message` and `WS Out Data` -> `WS Data`.

