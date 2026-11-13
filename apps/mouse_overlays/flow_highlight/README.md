# Flow Highlight Overlay

High-performance GPU fluid simulation overlay driven by Cables.gl that highlights mouse cursor movements with fluid splats and vorticity.

## Architecture

This overlay follows the modular architecture of `apps/space_type_generator-ws`:
- **`index.html`**: Host page containing the transparent WebGL canvas and script tags.
- **`preset.js`**: Collection of fluid dynamic presets (`default`, `neon_flow`, `high_viscosity`, `rapid_dissolve`, `intense_splat`).
- **`registration.js`**: Manifest schema (`client:register`), Tweakpane integration, and fluid parameter schema.
- **`websocket.js`**: Dual WebSocket (Dashboard & SlidesStudio) / BroadcastChannel bridge with Soft Takeover filter.
- **`main.js`**: Cables.gl patch loader (`../patches/Fast_Fluid_Simulation.js`), multi-monitor bounds remapping, and patch variable synchronization.
- **`style.css`**: Fullscreen transparent canvas styles.

## Supported Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientID` / `clientId` | string | `cables-flow-highlight` | Unique client ID for multi-instance dashboard targeting |
| `preset` / `p` | string | `default` | Initial preset loaded on start |
| `ws` | boolean / string | - | Enable WebSocket client connection (e.g. `ws=1` or `ws=127.0.0.1:8080`) |
| `bc` / `channel` | string | `flowhighlight-sync` | BroadcastChannel name for local synchronization |
| `width` / `height` | number | window size | Initial viewport dimension override |

