# Astro Bee Overlay

3D Astro Bee robot cursor follower in p5.js WebGL with dynamic pitch/yaw rotation, zero-gravity oscillation, and click reactions.

## Architecture

This overlay follows the modular architecture of `apps/space_type_generator-ws`:
- **`index.html`**: Host page loading p5.js, modular scripts, and 3D WebGL canvas.
- **`preset.js`**: Collection of robot presets (`default`, `close_up`, `fast_follower`, `zen`, `wide_orbit`, `mini`).
- **`registration.js`**: Parameter manifest (`client:register`), Tweakpane integration, and dynamic options.
- **`websocket.js`**: Dual WebSocket (Dashboard & SlidesStudio) / BroadcastChannel bridge with Soft Takeover filter.
- **`sketch.js`**: WebGL 3D model loader (`models/bee3.obj`), lighting, smooth lerp tracking, and oscillation.
- **`style.css`**: Fullscreen transparent canvas styles.

## Supported Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientID` / `clientId` | string | `p5-astro-bee` | Unique client ID for multi-instance dashboard targeting |
| `preset` / `p` | string | `default` | Initial preset loaded on start |
| `ws` | boolean / string | - | Enable WebSocket client connection (e.g. `ws=1` or `ws=127.0.0.1:8080`) |
| `bc` / `channel` | string | `astrobee-sync` | BroadcastChannel name for local synchronization |
| `width` / `height` | number | window size | Initial viewport dimension override |

