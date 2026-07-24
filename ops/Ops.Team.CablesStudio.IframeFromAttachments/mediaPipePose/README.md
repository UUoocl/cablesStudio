# MediaPipe Pose Integration Example

This directory contains a p5.js sketch configured in **instance mode** to render custom particle brush-strokes and drips based on live body pose data received from Cables.gl via MediaPipe.

## Files

- [index.html](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/mediaPipePose/index.html): Loader HTML importing p5.js, the sketch, and the bridge.
- [sketch.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/mediaPipePose/sketch.js): p5 instance mode sketch defining the rendering logic.
- [cablesBridge.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/mediaPipePose/cablesBridge.js): Decoupled communication layer bridging incoming BroadcastChannel messages to p5 instance callbacks.

## How it works

1. **Instance Mode Bootstrapping**:
   - The operator's script inliner automatically converts the ES6 export statement (`export default function (p, op, w, h)`) in `sketch.js` to a global variable assignment (`window.sketchFunction = function (p, op, w, h)`).
   - [cablesBridge.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/mediaPipePose/cablesBridge.js) instantiates the p5 instance `new p5(...)` and binds it to `window.sketchFunction`.

2. **Low-Latency Pose Updates**:
   - The parent Cables patch sends pose landmarker data via the BroadcastChannel using the `cablesData` key:
     ```json
     {
       "type": "SET_VAR",
       "key": "cablesData",
       "value": { "landmarks": [ ... ] }
     }
     ```
   - The bridge intercepts this message and directly calls `p5Instance.onDataChange(e.data.value)` to feed coordinate frames to the sketch without any delay or global namespace pollution.
