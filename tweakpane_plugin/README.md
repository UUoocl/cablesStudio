# Tweakpane Soft Takeover (MIDI Pickup) Plugin

A custom **Tweakpane 3.1.10** plugin providing **Soft Takeover (MIDI Pickup / Catch-up Mode)** for multi-pane control surfaces driven by hardware controllers (such as an Akai 24-knob MIDI mixer over WebSocket).

When switching between panes, incoming hardware values stay **unlatched** and do not modify the active pane's component value until the physical knob catches up to (within tolerance) or crosses the component's stored value.

## UI States

1. **Number Sliders — Twin-Thumb Track**
   - **Unlatched**:
     - **Target Thumb** (solid cyan highlight): Remains locked at the pane's stored value.
     - **Ghost / Pickup Thumb** (hollow amber ring): Tracks the physical potentiometer position in real time.
     - **Connective Track Band**: Diagonally striped span connecting the two thumbs to visualize the remaining delta.
   - **Latched**: The ghost thumb glides into the target thumb and fades out, snapping back to the standard single-thumb slider.

2. **Text Lists / Dropdowns — Blade Label Directional Badge**
   - **Unlatched**: Appends a directional pill onto the blade label:
     - `Hardware index < Target index`: `▲ Turn CW`
     - `Hardware index > Target index`: `▼ Turn CCW`
   - **Latched**: Once the knob matches or crosses the target option index, the badge disappears and normal dropdown control resumes.

3. **Color Controls (RGBA) — 4-Channel Chevron Strip**
   - Each channel (`R`, `G`, `B`, `A`) tracks soft takeover independently.
   - Displays a compact channel strip beneath the color header:
     `[R: ▲] [G: ✓] [B: ▼] [A: ✓]`
   - Supports both full color payloads (`'#rrggbbaa'`, `'rgba(...)'`, `{ r, g, b, a }`) and individual channel updates (`{ channel: 'r', value: 180 }` or `{ r: 180 }`).
   - Only latched channels update the active color; as all channels catch their targets, the strip fades out cleanly.

---

## Quick Start

```html
<script src="../apps/lib/tweakpane.min.js"></script>
<script src="./tweakpane-soft-takeover.js"></script>
<script>
  const pane = new Tweakpane.Pane();
  pane.registerPlugin(TweakpaneSoftTakeoverPlugin);

  const manager = TweakpaneSoftTakeoverPlugin.createManager({
    toleranceRatio: 0.02, // 2% of slider range
    colorTolerance: 4,    // 4/255 for R, G, B
    alphaTolerance: 0.02  // 0.02 for Alpha
  });

  const params = { speed: 0.2, preset: 'marquee', color: '#ff0000cc' };

  pane.addInput(params, 'speed', {
    min: 0, max: 1, step: 0.01,
    softTakeover: { manager, paneId: 'pane-a', key: 'speed' }
  });

  pane.addInput(params, 'preset', {
    options: { Marquee: 'marquee', Subway: 'subway', OldSea: 'oldsea' },
    softTakeover: { manager, paneId: 'pane-a', key: 'preset' }
  });

  pane.addInput(params, 'color', {
    view: 'color',
    color: { alpha: true },
    softTakeover: { manager, paneId: 'pane-a', key: 'color' }
  });

  // On pane switch: unlatch newly active pane so knobs must catch up
  manager.setActivePane('pane-a');

  // On incoming WebSocket MIDI message:
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    // msg = { clientId: 'pane-a', key: 'speed', value: 0.75 }
    manager.handleUpdate(msg.clientId, msg.key, msg.value);
  };
</script>
```

## API Reference

- `TweakpaneSoftTakeoverPlugin.createManager(options)`: Creates a multi-pane `SoftTakeoverManager`.
  - `toleranceRatio` (default `0.02`): Catch-up tolerance as a fraction of `[min, max]`.
  - `colorTolerance` (default `4`): Catch-up tolerance for RGB (`0..255`).
  - `alphaTolerance` (default `0.02`): Catch-up tolerance for Alpha (`0..1`).
  - `fadeLatchedMs` (default `700`): Delay before hiding the 4-channel strip after all channels latch.
  - `cwLabel` / `ccwLabel`: Custom text for list directional badges (`'▲ Turn CW'` / `'▼ Turn CCW'`).
- `manager.setActivePane(paneId)`: Marks a pane active and unlatches its controls (clearing prior hardware history to prevent false crossings).
- `manager.handleUpdate(paneId, key, hwValue)`: Feeds a mapped hardware value to a specific control.
- `manager.handleBatchUpdate(paneId, { key: hwValue, ... })`: Feeds an object of mapped values to a pane.
- `manager.syncTarget(paneId, key, targetValue)`: Authoritatively updates a control's target value without latching divergent hardware positions.
- `manager.unlatchPane(paneId)` / `manager.unlatchAll()`: Forces controls into unlatched pickup mode.
- `TweakpaneSoftTakeoverPlugin.pushValue(binding, hwValue)` / `pushColorChannel(binding, channel, value)`: Direct per-binding helpers when not using a manager.

## Interactive Demo
Open [demo.html](file:///Users/jonwood/Github_local_dev/cablesStudio/tweakpane_plugin/demo.html) in a browser to test Pane A / Pane B switching with simulated Akai MIDI knobs.

## Targeting `settings_dashboard.html` & Client-Side Filtering
- **Dashboard-Only Updates**: Send `{ type: "dashboard:update", clientId: "<paneId>", key: "...", value: ... }` (or add `target: "dashboard"` on `client:update`, or `clientId: "active"`). Clients ignore dashboard-targeted messages until the dashboard latches and relays `client:update`.
- **Switch Panes via WebSocket**: Send `{ type: "client:select", clientId: "<paneId>" }` (or `pane:select` / `tab:select`).
- **Common Client Filter**: Clients include [soft-takeover-client.js](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/lib/soft-takeover-client.js) to protect against direct `cables-midi` broadcasts and auto-unlatch when MIDI traffic switches to another `clientId`.

