# Trassel Overlay

Generative procedural ribbon and brush drawing overlay that reacts to mouse scrolling and clicks.

## Architecture

This overlay follows the modular architecture of `apps/space_type_generator-ws`:
- **`index.html`**: Host page loading modular scripts and canvas container.
- **`preset.js`**: Collection of drawing presets (`default`, `brush`, `line`, `dash`, `worm`, `turbo_brush`, `slow_line`).
- **`registration.js`**: Manifest schema (`client:register`), Tweakpane integration, and parameter definitions.
- **`websocket.js`**: WebSocket & BroadcastChannel bridge with Soft Takeover filter and client targeting.
- **`sketch.js`**: Multi-layered canvas drawing pipeline, velocity calculation, and continuous scroll tracking.
- **`style.css`**: Layout and positioning styles.

## Supported Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientID` / `clientId` | string | `js-trassel` | Unique client ID for multi-instance dashboard targeting |
| `preset` / `p` | string | `default` | Initial preset loaded on start |
| `ws` | boolean / string | - | Enable WebSocket client connection (e.g. `ws=1` or `ws=127.0.0.1:8080`) |
| `bc` / `channel` | string | `trassel-sync` | BroadcastChannel name for local synchronization |
| `width` / `height` | number | window size | Initial viewport dimension override |

