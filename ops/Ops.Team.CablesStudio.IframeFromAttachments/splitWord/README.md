# SplitWord P5.js Example

This directory contains the `SplitWord` p5.js sketch. It demonstrates how to build an interactive, high-performance typography sketch inside an iframe and control its internal p5 variables dynamically from Cables.gl using the **BroadcastChannel IPC** bridge.

---

## Controlled Variables

The custom operator `IframeFromAttachments` automatically pre-injects a BroadcastChannel proxy script into the iframe. 

### Zero-Config Variable Management
To make integration completely seamless and require **no changes to your sketch code**, the operator performs two automated operations:
1. **Scope Promotion**: When script attachments are inlined, the operator dynamically rewrites `let` and `const` declarations to `var` in the loaded code. This automatically promotes variables (such as `message`, `fontSize`) and p5 slider objects (such as `sliderFontSize`) to properties of the global `window` object.
2. **Smart UI Synchronization**: The pre-injected BroadcastChannel proxy listens for incoming `SET_VAR` messages. When setting a variable, it automatically resolves corresponding p5 slider/input objects (e.g. mapping `fontSize` to `sliderFontSize` or `message` to `input`) and updates their DOM values via `.value()`.
3. **Automatic Redraw Hooks**: After updating values, it automatically invokes `window.onMessageChange()` and `window.redraw()` if they exist to trigger immediate visual updates in p5.js.

Because of this system, **you can keep your sketch code exactly as-is without any modifications!**

Exposed variables you can control:

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `message` | String | `"LOVE"` | The text content to split and connect. |
| `fontSize` | Number | `300` | Base font size. |
| `lineMultiplication` | Number | `10` | Number of connection lines drawn between split letter segments. |
| `lineOpacity` | Number | `0.6` | Transparency multiplier (0.0 to 1.0) of connection lines. |
| `lineWidth` | Number | `0.3` | Stroke thickness of the connection lines. |
| `rangeX` | Number | `0.2` | Horizontal spread offset of connection bezier curves. |
| `rangeY` | Number | `0.2` | Vertical spread offset of connection bezier curves. |
| `randomness` | Number | `0.2` | Amount of random connection paths mapped between letters. |
| `crop` | Number | `0` | Center crop spacing gap between top and bottom text splits. |

---

## Controlling Variables from Cables.gl

In Cables, you can use a custom script Op or a BroadcastChannel transmitter to send updates. 

### Method A: Using a custom Cables script Op
You can call `op.setIframeVar(key, value)` directly on the `IframeFromAttachments` Op instance in your Cables JS code:

```javascript
// Get a reference to your IframeFromAttachments operator instance
const iframeOp = op.patch.getOpById("your_iframe_op_id");

// Set variables dynamically
iframeOp.setIframeVar("message", "CABLES");
iframeOp.setIframeVar("fontSize", 200);
iframeOp.setIframeVar("lineMultiplication", 25);
iframeOp.setIframeVar("randomness", 0.5);
```

### Method B: Using native BroadcastChannel API in Cables
You can also send variables directly from any JS Op by opening a BroadcastChannel named `cables_iframe_channel` (or your custom channel name).

#### 1. Single Variable Update
```javascript
const channel = new BroadcastChannel("cables_iframe_channel");

channel.postMessage({
  type: "SET_VAR",
  key: "message",
  value: "STUDIO"
});
```

#### 2. Batch Variable Update (Multiple Variables at Once)
To update multiple variables simultaneously and avoid overhead (the operator will update all values and trigger a single redraw pass at the end of the batch), send a `vars` dictionary object:
```javascript
const channel = new BroadcastChannel("cables_iframe_channel");

channel.postMessage({
  type: "SET_VARS", // or "SET_VAR"
  vars: {
    message: "BATCHED",
    fontSize: 150,
    lineMultiplication: 25,
    randomness: 0.5
  }
});
```

---

## Loading Custom Fonts from Patch Files

Thanks to the automated `<base href="...">` injection, relative paths inside the iframe resolve directly to the Cables patch files directory. To load a custom font like `BebasNeue-Regular.ttf` that is uploaded to your patch:

1. Upload the font file `BebasNeue-Regular.ttf` as a patch file in Cables.
2. In your sketch's `preload` function, load the font using a relative path:
   ```javascript
   let myFont;
   
   function preload() {
       myFont = loadFont('BebasNeue-Regular.ttf');
   }
   
   function setup() {
       createCanvas(windowWidth, windowHeight);
       textFont(myFont);
   }
   ```
3. The sketch will fetch and apply the font automatically from your same-origin patch directory.
