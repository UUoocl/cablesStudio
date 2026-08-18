# Trassel Generative Brush Art Example

This directory contains the **Trassel** generative thread/brush painting animation adapted for Cables.gl `IframeFromAttachments` using a dedicated BroadcastChannel bridge (`cablesBridge.js`).

## Files

- [index.html](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/index.html): Main HTML entry point.
- [cablesBridge.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/cablesBridge.js): BroadcastChannel listener receiving `mouseScrollY`, mode changes, and resize events.
- [trassel.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/trassel.js): Generative brush art engine utilizing infinite virtual scrolling.

## How it works

The sketch runs in pure **BroadcastChannel** mode (default channel: `cables_iframe_channel`). Messages can be sent from a Cables patch via `Ops.Team.CablesStudio.BroadcastChannel.BroadcastChannelSend` or `IframeFromAttachments`.

### Supported Broadcast Messages

#### 1. Mouse Scroll / Wheel Delta (`mouseScrollY`)
Advances the generative painting threads based on the scroll velocity:
```json
{
  "scrollY": 8.788436889648438
}
```

#### 2. Mode Change (`mode`)
Switches brush rendering style (`brush`, `line`, `dash`, `worm`):
```json
{
  "mode": "line"
}
```
*(Or send `{ "button": 1 }` to cycle to the next mode)*

#### 3. Reset (`reset`)
Clears existing canvas lines and re-initializes brushes:
```json
{
  "reset": true
}
```

### Cables.gl Patch Setup

1. In Cables, add `Ops.Team.CablesStudio.IframeFromAttachments`.
2. Set `HTML Attachment` to `index.html`.
3. Add the files to the `Files` multiport:
   - `index.html`
   - `cablesBridge.js`
   - `trassel.js`
4. Use `BroadcastChannelSend` (Channel: `cables_iframe_channel`) to post event objects (`{ "scrollY": ... }`).
