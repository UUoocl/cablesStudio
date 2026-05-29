# Space Type Generator (STG)

This project contains modular standalone implementations of the Space Type Generator (original designs by Kiel Mutschelknaus). They are optimized for **headless, transparent, and remote-controlled rendering** inside a Cables GL electron environment using `BroadcastChannel` (Pub/Sub) APIs.

---

## Architecture Overview

1. **Host Integration**: Load a sketch iframe:
   `http://127.0.0.1:8080/space_type_generator/[sketch]/index.html?channel=YOUR_CHANNEL_NAME&width=1024&height=1024`
2. **Synchronization**:
   - **Settings Receiver (`sub-[channel]`)**: Sketches subscribe to messages from the parent window or operator to apply layouts.
   - **Ready & Frame Triggers (`pub-[channel]`)**: Sketches notify the parent operator when they are fully initialized (`ready`) and when every single frame draws (`draw`), enabling frame-accurate texture capture in Cables.
3. **Common Assets & Libs**:
   - All shared resources (P5 libraries, font assets, keyboard engine) reside in `/lib/` and `/assets/` at the root of `space_type_generator`.

---

## 1. Common Settings (All Sketches)

All values are optional. Sketches dynamically update only the keys provided in the JSON payload object.

| Key | Data Type | Default | Description | Options / Range |
| :--- | :--- | :--- | :--- | :--- |
| `text` / `string` | `string` | `"..."` | The text content to render | Any text |
| `bkgdColor` | `string` | `"#ffffff00"` | Hex color of the canvas background | Hex string (e.g. `"#ff0000"`, `"#ffffff00"` for transparency) |
| `color1` | `string` | `"#ff0000"` | Hex color of the first text/stripe element | Hex string (e.g. `"#000000"`) |
| `clearTextDelay` | `number` | `0` | Delay in milliseconds before text starts clearing (0 to disable) | `0` to `86400000` |
| `clearMethod` | `string` | `"all at once"` | erasure style of the text | `'all at once'`, `'sequential'` (L-to-R), `'reverseSeq'` (R-to-L) |
| `seqInterval` | `number` | `100` | Time interval in milliseconds between character removals | `1` to `10000` |
| `hideNoText` | `boolean` | `false` | Clear and hide the canvas completely when the text is empty | `true`, `false` |

---

## 2. Cylinder Sketch (`/cylinder`)

The Cylinder sketch wraps the kinetic typography around a revolving three-dimensional column.

### Unique Settings

| Key | Data Type | Default | Description | Range |
| :--- | :--- | :--- | :--- | :--- |
| `radius` | `number` | `250` | Radius of the 3D cylinder | `0` - `1000` |
| `stackNum` | `number` | `1` | Number of rings stacked vertically | `1` - `30` |
| `rRotate` | `number` | `-5` | Continuous spin rotation speed | `-100` - `100` |
| `rOffset` | `number` | `0` | Spiral shift offset between stacked rings | `0` - `1.57` (PI/2) |
| `rWaveCount` | `number` | `2` | Wave frequency along the ring perimeter | `0` - `10` |
| `rWaveSpeed` | `number` | `0` | Animation speed of ring waves | `0` - `100` |
| `rWave` | `number` | `0` | Depth/latitude wave amplitude | `0` - `200` |
| `rZaxis` | `number` | `0` | Longitudinal ripple amplitude | `0` - `100` |
| `strecherX` | `number` | `0` | Horizontal wave-deformation multiplier | `0` - `80` |
| `strecherY` | `number` | `0` | Vertical wave-deformation multiplier | `0` - `100` |
| `typeX` | `number` | `20` | Character scaling width | `0` - `100` |
| `typeY` | `number` | `40` | Character scaling height | `0` - `100` |
| `typeStroke` | `number` | `2` | Character stroke thickness | `0` - `10` |
| `xRotCamera` | `number` | `15` | Global camera angle rotation on X-axis | `-180` - `180` |
| `yRotCamera` | `number` | `0` | Global camera angle rotation on Y-axis | `-180` - `180` |
| `zRotCamera` | `number` | `0` | Global camera angle rotation on Z-axis | `-180` - `180` |
| `zoomCamera` | `number` | `0` | Camera zoom offset | `-500` - `500` |
| `xRotTweak` | `number` | `0` | Inward/outward individual char X-axis tilt | `-90` - `90` |
| `yRotTweak` | `number` | `0` | Inward/outward individual char Y-axis tilt | `-90` - `90` |
| `zRotTweak` | `number` | `0` | Inward/outward individual char Z-axis tilt | `-90` - `90` |

### Cylinder Presets
Send one of these presets in `data.preset` to load pre-configured columns:
- `simple`
- `jellyfish`
- `crown`
- `complex`
- `weave`
- `zebra`
- `hoops`
- `pride`
- `reset` (loads standard columns)

---

## 3. Stripes Sketch (`/stripes`)

The Stripes sketch layers characters onto a series of overlapping ribbon waves that flex and slide in sync.

### Unique Settings

| Key | Data Type | Default | Description | Range |
| :--- | :--- | :--- | :--- | :--- |
| `tracking` | `number` | `10` | Spacing multiplier between characters | `0` - `40` |
| `ribbonCount` | `number` | `9` | Number of distinct overlapping stripes | `0` - `40` |
| `ribbonSpaceX` | `number` | `-17` | Horizontal spacing layout of stripes | `-60` - `60` |
| `ribbonSpaceY` | `number` | `-35` | Vertical spacing layout of stripes | `-60` - `60` |
| `ribbonSize` | `number` | `35` | Scale thickness padding of ribbons | `-20` - `100` |
| `ribbonOffset` | `number` | `0.2` | Wave phase offset between adjacent ribbons | `0` - `3.1416` (PI) |
| `yWave` | `number` | `95` | Amplitude height of the ribbon wave | `0` - `100` |
| `speed` | `number` | `0.01` | Travel speed of wave animation | `0` - `0.3` |
| `offset` | `number` | `0.26` | Wavelength multiplier along the stripe | `0` - `3.1416` (PI) |
| `slope` | `number` | `1` | Wave curve tightness/sharpness curvature | `0` - `4` |
| `typeX` | `number` | `20` | Character scaling width | `0` - `100` |
| `typeY` | `number` | `40` | Character scaling height | `0` - `100` |
| `typeStroke` | `number` | `2` | Character stroke thickness | `0` - `5` |
| `color2` | `string` | `"#0000ff"` | Hex color of the second sequence element | Hex string |
| `color3` | `string` | `"#ffff00"` | Hex color of the third sequence element | Hex string |
| `color4` | `string` | `"#ffffff"` | Hex color of the fourth sequence element | Hex string |
| `color5` | `string` | `"#000000"` | Hex color of the fifth sequence element | Hex string |
| `color6` | `string` | `"#760089"` | Hex color of the sixth sequence element | Hex string |

### Stripes Presets
Send one of these presets in `data.preset` to load preconfigured ribbon structures:
- `marquee`
- `subway`
- `simplewave`
- `oldsea`
- `colorsea`
- `wow`
- `stacks`
- `notsoweird`
- `racer`
- `simplewave2`
- `pride`
- `reset` (loads standard stripes)

---

## 4. Custom Preset Saving & Loading System

Both sketches support loading predefined visual states (presets) and exporting their current active layouts back to Cables to be saved as persistent configuration presets.

### A. Dynamic Loading Workflow

Each sketch folder contains a local `preset.js` file defining a dictionary of presets:
```javascript
var customPresets = {
  "myPresetName": {
    "typeX": 20,
    "typeY": 40,
    ...
  }
};
```
Since both sketches render inside isolated HTML iframe contexts, they load their own local `preset.js` dictionary into their isolated window scope without namespace collisions. 

To load a preset:
- Send `preset: "preset_name"` in the settings payload via the input Broadcast Channel (`sub-[channel]`).
- The sketch searches the `customPresets` keys case-insensitively.
- If a match is found, the sketch runs `reSetting()` to clear any residual layout states, then applies the matched preset's parameters dynamically.

### B. Dynamic Saving Workflow (Cables Integration)

To capture and save the current look of a sketch:
1. Send `{ action: "savePreset", name: "preset_name" }` to the sketch via the input Broadcast Channel (`sub-[channel]`).
2. The sketch aggregates its current active rendering parameters and broadcasts them back to Cables via the output Broadcast Channel (`pub-[channel]`) in this standard payload format:

```json
{
  "type": "savePreset",
  "iframeSrc": "http://127.0.0.1:8080/space_type_generator/cylinder/index.html?channel=myChannel",
  "name": "preset_name",
  "settings": {
    "typeX": 20,
    "typeY": 40,
    "typeStroke": 2,
    "bkgdColor": "rgba(255,255,255,0)",
    "color1": "rgb(255,0,0)",
    ...
  }
}
```

### C. Disk-Writing Implementation in Cables
Within your Cables patch backend or operator:
- Listen to the `pub-[channel]` channel.
- Upon receiving a `"savePreset"` payload, parse `iframeSrc` (e.g. searching for `/cylinder/` or `/stripes/`) to determine the target subfolder.
- Prompt the user to confirm or specify the preset name (using the standard `InputElement` operator in Cables).
- Merge the new key `[name]: settings` into `customPresets`.
- Write the updated file back to the target `preset.js` on disk using this structure:
  ```javascript
  const fileContent = `var customPresets = ${JSON.stringify(customPresets, null, 4)};`;
  fs.writeFileSync(presetFilePath, fileContent, "utf-8");
  ```
