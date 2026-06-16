# Headless Space Type Generator (STG)

This project contains modular standalone implementations of the Space Type Generator sketches (original designs and concepts by Kiel Mutschelknaus). They have been refactored into a high-performance, **headless, transparent, and remote-controlled architecture** optimized for seamless embedding inside browser environments (e.g. Electron, Cables GL, WebGL layers, or standalone IFrames) using `BroadcastChannel` (Pub/Sub) APIs.

---

## 🚀 Architecture Overview

1. **Host Integration**: Load a sketch using an iframe:
   `http://127.0.0.1:8080/space_type_generator/[sketch]/index.html?channel=YOUR_CHANNEL_NAME&width=1024&height=1024`
2. **Dynamic Synchronization**:
   - **Settings Receiver (`sub-[channel]`)**: Sketches listen to JSON payloads sent via BroadcastChannel to update variables instantly.
   - **Frame & State Triggers (`pub-[channel]`)**: Sketches notify the host on initialize (`ready`) and at the end of each frame (`draw`). This enables frame-accurate texture capturing.
3. **Common Assets & Libraries**:
   - Centralized fonts reside inside `/assets/`.
   - Shared dependencies (P5 libraries and keyboard layout engines) are consolidated inside `/lib/`.

---

## 🛠️ Common Settings (All Sketches)

Every sketch dynamically supports these common attributes:

| Key | Data Type | Default | Description | Options |
| :--- | :--- | :--- | :--- | :--- |
| `text` / `string` | `string` | `"..."` | Text content to be rendered on screen | Any text strings / line breaks |
| `bkgdColor` | `string` | `"#ffffff00"` | Hex or RGBA string for canvas background | e.g., `"#ff0000"`, `"rgba(0,0,0,0)"` |
| `foreColor` | `string` | `"#ffffff"` | Main stroke/fill color | Hex color code |
| `color1` | `string` | `"#ff0000"` | Secondary element / stripe color | Hex color code |
| `clearTextDelay` | `number` | `0` | Delay in ms before text starts erasing (0 to disable) | `0` - `86400000` |
| `clearMethod` | `string` | `"all at once"`| How characters are removed over time | `"all at once"`, `"sequential"`, `"reverseSeq"` |
| `seqInterval` | `number` | `100` | Delay in ms between character deletions | `1` - `10000` |
| `hideNoText` | `boolean` | `false` | Clears and skips draw frame when text is empty | `true`, `false` |

---

## 🎨 Catalog of Converted Sketches

Below is the complete technical documentation for all 16 headless generator sketches.

### 1. Cascade (`/cascade`)
Draws text in overlapping vertical cascade cascades.
- **Unique Settings**: `speed` (scroll speed), `spacing` (line gap), `tracking` (char width adjustment), `cascadeNum` (cascading columns).
- **Presets**: `classic`, `checker`, `mosaic`, `reset`.

### 2. Coil (`/coil`)
Arranges typography along a helical 3D spiral.
- **Unique Settings**: `radius` (coil radius), `pitch` (spiral spacing), `speed` (revolving speed), `twist` (helix angle distortion).
- **Presets**: `spiral`, `helical`, `vortex`, `reset`.

### 3. Crash (`/crash`)
Matter.js physics-driven character simulation that responds to gravity and forces.
- **Unique Settings**: `gravity` (force multiplier), `restitution` (body bounciness), `friction` (surface slide resistance).
- **Presets**: `avalanche`, `pileup`, `float`, `reset`.

### 4. Cylinder (`/cylinder`)
Wraps text around a revolving three-dimensional column.
- **Unique Settings**: 
  - `radius` (radius of column), `stackNum` (vertical rows stacked), `rRotate` (y-spin speed).
  - `rOffset` (spiral phase offset), `rWaveCount` / `rWaveSpeed` / `rWave` (harmonic waves).
  - `xRotCamera` / `yRotCamera` / `zRotCamera` (global camera rotation angles).
- **Presets**: `simple`, `jellyfish`, `crown`, `complex`, `weave`, `zebra`, `hoops`, `pride`, `reset`.

### 5. Danger (`/danger`)
Offscreen graphics buffering yielding highly distorted noise textures.
- **Unique Settings**: `noiseScale` (frequency of distortion), `speed` (noise offset animation), `glitch` (phase shifts).
- **Presets**: `static`, `hazard`, `reset`.

### 6. Field (`/field`)
Displays character blocks inside a grid with WebGL coordinate shift waves.
- **Unique Settings**: `gridSize` (rows/columns count), `waveFrequency` (wavelength), `waveSpeed` (speed), `depth` (3D distance).
- **Presets**: `ripple`, `swell`, `reset`.

### 7. Flag (`/flag`)
Binds kinetic typography to a waving banner fabric simulation.
- **Unique Settings**: `frequency` (wave frequency), `amplitude` (wave height), `speed` (flutter speed).
- **Presets**: `banner`, `breeze`, `gale`, `reset`.

### 8. Flash (`/flash`)
Renders text sequences using abrupt camera scene-transitions.
- **Unique Settings**: `interval` (timestep in frames), `transition` (transition styles like cut, slide, scale), `zoom` (camera zoom).
- **Presets**: `strobe`, `panoramic`, `reset`.

### 9. Layers (`/layers`)
Displays parallel text slices in depth layers.
- **Unique Settings**: `layerCount` (number of planes), `spacing` (Z-depth gaps), `scrollSpeed` (fly-through speed).
- **Presets**: `tunnel`, `slice`, `reset`.

### 10. Morisawa (`/morisawa`)
Multi-layered mirrored scrolling typography.
- **Unique Settings**: `axes` (number of mirror axes), `speed` (scroll speed), `spacing` (mirror gap).
- **Presets**: `kaleidoscope`, `symmetric`, `reset`.

### 11. Pow (`/pow`)
Fires bursting typography elements when triggered by clicks or scheduled events.
- **Unique Settings**: `burstCount` (letters spawned), `scatter` (velocity spread), `lifespan` (fading rate).
- **Presets**: `pop`, `firework`, `splode`, `reset`.

### 12. Ribbon (`/ribbon`)
Draws text onto serpentine paths like waving streamers.
- **Unique Settings**: 
  - `segmentSpace` (gap between segments), `segmentCount` (length of paths), `depth` (ribbon height).
  - `middleStretch` (flat-section stretch), `count` (number of parallel ribbons), `zSpace` / `xSpace` (3D gap adjustments).
  - `altCheck` (alternating phase offsets), `gradientCheck` (color transitions), `bSideCheck` (double-sided render).
- **Presets**: `basic`, `river`, `streamer`, `terrace`, `link`, `sea`, `web_ribbon`, `primary`, `snake`, `hotcold`, `track`, `track2`, `reset`.

### 13. Shine (`/shine`)
Renders radial spoke-slicing bright ray typography from a central focal point.
- **Unique Settings**: 
  - `resLon` (number of longitude rays), `scaler` (text scale factor), `taperOn` (taper stroke weight).
  - `minFlux` / `maxFlux` / `randomFlux` (inward/outward spoke distance offset distortions).
  - `baseSW` (straight stroke weight), `minSW` / `maxSW` (taper stroke limits).
  - `stageAstrength` / `stageAdirect` / `stageAlength` (intro acceleration interpolation parameters).
  - `stageBstrength` / `stageBdirect` / `stageBlength` (outro acceleration parameters).
  - `colorType` (none/triple/quintuple blend palettes), `scrubOn` / `scrubVal` (manual timeline control).
- **Presets**: `set0`, `set1`, `set2`, `set3`, `set4`, `set5`, `set6`, `set7`, `reset`.

### 14. Snap (`/snap`)
Snaps multiple horizontal text groups in highly-eased elastic steps.
- **Unique Settings**: `pgTextSize` (text scale size), `groupCount` (number of horizontal layers), `selFont` (font style selector).
- **Presets**: `default`, `compact`, `bold`, `reset`.

### 15. Stripes (`/stripes`)
Slides character textures along horizontal bands.
- **Unique Settings**:
  - `tracking` (character gaps), `ribbonCount` (stripe layers stacked), `ribbonSpaceX` / `ribbonSpaceY` (stripe positioning).
  - `ribbonSize` (width of stripe tracks), `ribbonOffset` (wavelength phase shifts).
  - `yWave` (amplitude of tracking waves), `speed` (stripe travel velocity), `slope` (wave steepness curve).
- **Presets**: `marquee`, `subway`, `simplewave`, `oldsea`, `colorsea`, `wow`, `stacks`, `notsoweird`, `racer`, `simplewave2`, `pride`, `reset`.

### 16. Vessel (`/vessel`)
Encapsulates words inside animated rounded borders that flex and snap.
- **Unique Settings**: 
  - `fontSel` (font styles), `textScale` (size adjustment), `vesselSW` (capsule border weight).
  - `crestType` (outline vs solid filled capsule), `charDelay` / `lineDelay` (snap phase offsets).
  - `stageAlength` / `stageBlength` (intro/outro transition lengths).
- **Presets**: `default`, `bold_blue`, `filled_pink`, `reset`.

---

## 💾 Presets Integration Protocol

All sketches share a standardized dynamic preset saving and loading schema that communicates directly with your Cables operator.

### 1. Preset Payload Structure
Sketches output and input preset parameters inside a unified object:
```json
{
  "type": "savePreset",
  "iframeSrc": "http://127.0.0.1:8080/space_type_generator/[sketch]/index.html?channel=myChannel",
  "name": "preset_name",
  "settings": {
    "textColor": "#ffffff",
    "bkgdColor": "#00000000",
    "typeX": 25,
    "speed": 0.05
  }
}
```

### 2. Disk Loading Workflow
When the host sends `"preset": "preset_name"` on the BroadcastChannel (`sub-[channel]`):
1. The sketch runs a case-insensitive search across the `customPresets` dictionary located in its local `preset.js`.
2. Upon matching, the sketch resets its environment (`reSetting()`) and loads the presets dictionary parameters dynamically.

### 3. Disk Saving Workflow
When you request a save:
1. Send `{ action: "savePreset", name: "preset_name" }` to the sketch via the input Broadcast Channel.
2. The sketch aggregates its active configuration fields and posts a `"savePreset"` payload (shown above) back on `pub-[channel]`.
3. Cables intercepts this message, extracts the path via `iframeSrc`, prompts the user, merges the key/values into the corresponding `preset.js` file, and writes the updated dictionary back to disk.
