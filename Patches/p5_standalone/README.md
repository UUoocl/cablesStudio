# Cables P5.js Standalone Integration

This project provides a specialized Cables operator for running **P5.js** in instance mode within the Cables Electron standalone environment. It allows for high-performance creative coding sketches to be used as real-time texture generators within the Cables GL rendering pipeline.

## Features

- **Isolated Execution**: P5 instances are managed in off-screen DOM containers to prevent UI conflicts with the Cables editor.
- **WebGL Texture Bridge**: Seamless capture of the P5 canvas into a `CGL.Texture` for use in materials and post-processing.
- **Dynamic Hot-Reloading**: Edit your P5 sketch files and refresh them instantly within the running Cables patch.
- **Bidirectional Data**: Pass objects (like mouse coordinates, tracking data, or FFT values) from Cables into P5.

## Operator: `Ops.Extension.Standalone.P5JS.P5Instance`

### Input Ports

| Port | Type | Description |
| :--- | :--- | :--- |
| **P5 Library Path** | String | Path to the `p5.esm.min.js` file (relative to patch or absolute). |
| **Sketch File** | String | Path to your P5 `.js` sketch file. |
| **Input Data** | Object | Data passed to the sketch's `p.onDataChange` method. |
| **Flip Y** | Boolean | Vertically flips the texture (usually needed for P5 -> WebGL). |
| **Render** | Trigger | Manually trigger a redraw (optional, P5 loops internally by default). |
| **Manual Reload** | Trigger | Re-initializes the P5 instance and re-imports the sketch file. |

### Output Ports

| Port | Type | Description |
| :--- | :--- | :--- |
| **Rendered Texture** | Texture | The WebGL texture containing the current P5 canvas. |
| **Output Data** | Value | Data passed back from the sketch via `op.setOutData()`. |
| **Error** | String | Detailed error messages for library or sketch loading failures. |

---

## Developer Overview: Writing Sketches

Sketches must be written in **P5 Instance Mode** and exported as a default function.

### Basic Sketch Template (`sketch.js`)

```javascript
/**
 * @param {Object} p - The P5 instance
 * @param {Object} op - The Cables Operator instance
 */
export default function(p, op) {
    let inputData = { x: 0, y: 0 };

    p.setup = () => {
        p.createCanvas(512, 512);
        p.background(0);
    };

    p.draw = () => {
        p.clear();
        p.fill(255, 0, 0);
        // Use data from Cables
        p.ellipse(inputData.x * p.width, inputData.y * p.height, 50, 50);
        
        // Send data back to Cables
        op.setOutData({ frame: p.frameCount });
    };

    // Special hook called by the Cables Op when the 'Input Data' port changes
    p.onDataChange = (data) => {
        if (data) inputData = data;
    };
}
```

### Best Practices

1. **Normalized Coordinates**: Pass mouse or tracking data as `0.0` to `1.0` and scale them using `p.width` / `p.height` in the sketch.
2. **Animation Timing**: Use `p.millis()` for time-based animations to ensure smooth motion regardless of the Cables frame rate.
3. **Texture Flipping**: P5 uses a Y-down coordinate system, while WebGL/Cables uses Y-up. The **Flip Y** toggle on the operator should typically be enabled.
4. **Library Protocol**: In the Electron environment, the operator uses the `esm://` protocol to load local files as modules. Ensure your P5 library is the ESM version (`p5.esm.min.js`).

## Installation

1. Copy the `Ops.Extension.Standalone.P5JS.P5Instance` folder into your Cables project's `ops` directory.
2. Ensure `libs/p5.esm.min.js` is available in your patch directory.
3. Create a `.js` sketch file using the template above.
4. Add the `P5Instance` op to your patch and point the paths to your files.

## AI Disclaimer
> **Disclaimer**: The code, operators, and documentation in this repository were generated, refactored, and tested with the assistance of Artificial Intelligence. While efforts have been made to ensure stability, please review all scripts and native library calls for security and compatibility within your specific local environment.

