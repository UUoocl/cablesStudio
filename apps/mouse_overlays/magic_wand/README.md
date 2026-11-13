# Magic Wand Overlay

Sparkly star particle effect trailing mouse movements and bursting stars on mouse button clicks.

## Architecture

This overlay follows the modular architecture of `apps/space_type_generator-ws`:
- **`index.html`**: Host page loading libraries and modular scripts.
- **`preset.js`**: Collection of built-in particle presets (`default`, `sparkle`, `fire`, `neon`, `galaxy`, `pastel`).
- **`registration.js`**: Parameter manifest (`client:register`), Tweakpane integration, preset options, and color helpers.
- **`websocket.js`**: WebSocket & BroadcastChannel bridge, Soft Takeover filtering, and target client filtering.
- **`class.js`**: `Star` particle physics and shape rendering.
- **`sketch.js`**: P5 canvas setup, render loop, preset application, and event handling.
- **`style.css`**: Transparent fullscreen layout.

## Supported Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientID` / `clientId` | string | `p5-magic-wand` | Unique client ID for multi-instance dashboard targeting |
| `preset` / `p` | string | `default` | Initial preset loaded on start |
| `ws` | boolean / string | - | Enable WebSocket client connection (e.g. `ws=1` or `ws=127.0.0.1:8080`) |
| `bc` / `channel` | string | `magicwand-sync` | BroadcastChannel name for local synchronization |
| `width` / `height` | number | window size | Initial viewport dimension override |

