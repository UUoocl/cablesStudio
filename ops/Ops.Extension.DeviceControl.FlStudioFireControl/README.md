# AKAI FL Studio Fire Cables.gl Operator

This operator provides bidirectional control of the **AKAI FL Studio Fire** MIDI controller in Cables.gl, exposing inputs and outputs for the 4x16 RGB pads, relative encoders (knobs), mute buttons/lights, other hardware buttons, and the monochrome OLED display.

---

## Folder Contents
* `Ops.Extension.DeviceControl.FlStudioFireControl.json`: Port definitions and metadata.
* `Ops.Extension.DeviceControl.FlStudioFireControl.js`: Operator implementation.
* `Ops.Extension.DeviceControl.FlStudioFireControl.md`: In-editor documentation.
* `README.md`: Comprehensive usage guide and examples (this file).

---

## 1. Pad Matrix Examples

The pad matrix has 64 RGB LEDs arranged in a 16x4 grid. You can feed them using either a WebGL texture or a data array.

### A. Texture Input (`Pads Texture`)
* Feed any WebGL texture into the **Pads Texture** port.
* The operator automatically downsamples the texture to `16x4` using an internal framebuffer and reads the pixel colors.
* *Note: The top-left of the texture maps to Row 0, Column 0 (pad index 0) of the physical controller.*

### B. Array Input (`Pads Array`)
If the texture port is empty, the operator falls back to the **Pads Array** port. This port accepts three formats:

#### Format 1: Flat Array of Numbers (192 values)
A flat array of `r, g, b` floats representing the 64 pads:
```javascript
// A simple checkerboard pattern (red and black)
const data = [];
for (let i = 0; i < 64; i++) {
    const isEven = (Math.floor(i / 16) + (i % 16)) % 2 === 0;
    if (isEven) {
        data.push(1.0, 0.0, 0.0); // Red (values 0.0 - 1.0)
    } else {
        data.push(0.0, 0.0, 0.0); // Off
    }
}
// Connect this array to the "Pads Array" port
```

#### Format 2: Array of Sub-Arrays
An array of 64 arrays, each containing `[r, g, b]`:
```javascript
const data = [];
for (let i = 0; i < 64; i++) {
    // Green gradient across the columns
    const col = i % 16;
    const intensity = col / 15;
    data.push([0, intensity * 255, 0]); // Supports 0-255 scaling
}
```

#### Format 3: Array of Objects
An array of 64 objects with `r, g, b` keys:
```javascript
const data = [];
for (let i = 0; i < 64; i++) {
    data.push({
        r: i < 16 ? 127 : 0, // Row 0 is Red
        g: i >= 16 && i < 32 ? 127 : 0, // Row 1 is Green
        b: i >= 32 && i < 48 ? 127 : 0 // Row 2 is Blue
    });
}
```

---

## 2. Button and Light Control Examples

### A. Mute Lights (`Mute Lights` Input)
Controls the red LEDs for the 4 `Mute/Solo` buttons on the left side of the pad grid.
* Acceptable format: Array of 4 booleans or numeric values (`0` for off, `1` or `2` for on):
```javascript
// Turn on Mute Lights 1 & 3, turn off 2 & 4
const muteStates = [true, false, true, false];
// Connect to the "Mute Lights" port
```

### B. Button Lights (`Button Lights` Input)
Allows control of the secondary button LEDs (e.g. `Grid Left/Right`, `Browser`, `Pattern Up/Down`, `Play`, `Stop`, `Record`, `Step`, `Note`, `Drum`, `Perform`, `Shift`, `Alt`).
* Accepts a flat **Object** mapping button names (or numeric CC identifiers) to their light states. Values can be boolean or direct MIDI velocity values (`0` for off, `1` for dim, `2` for bright):
```javascript
const lights = {
    "play": 2,             // Play light active (Green LED)
    "record": true,        // Record light active (Red LED)
    "stop": false,         // Stop light off
    "step": 1,             // Step button dim
    "gridLeft": 0          // Grid Left off
};
```

### C. Mute and Button Outputs
* **Mute Outputs (`Mute 1`, `Mute 2`, `Mute 3`, `Mute 4`)**: Boolean ports emitting `true` while the respective Solo button is held down.
* **Buttons State (`Buttons State`)**: Emits an object indicating the current hold state of all other physical buttons:
```json
{
  "patternUp": false,
  "patternDown": true,
  "browser": false,
  "gridLeft": false,
  "gridRight": false,
  "selectPress": false
}
```

---

## 3. Knobs and Relative Encoders

The FL Studio Fire has 5 endless rotary encoders: `Volume`, `Pan`, `Filter`, `Resonance`, and `Select`.

* **Relative Turn Triggers**: Ports like `Knob Vol Turn` emit a trigger pulse on rotation.
* **Absolute Outputs**: Ports like `Knob Vol` output a smoothed/accumulated float value between `0.0` and `1.0`.
* **Preset/Resetting**:
  1. Input starting values into the **Knob Defaults** array port (e.g. `[0.5, 0.5, 0.5, 0.5, 0.0]`).
  2. Pulse the **Reset Knobs** trigger port to force the encoder positions to the defaults.

---

## 4. OLED Display Controls

The monochrome `128x64` display supports three modes selected via the **OLED Draw Mode** input port:

1. **Text Only**: Renders the string from the **OLED Text** port using the controller's built-in 5x8 pixel font (centered vertically).
2. **Texture Only**: Samples a `128x64` WebGL texture connected to the **OLED Texture** port. Pixels with an average brightness > 50% are mapped to white, others to black.
3. **Combined**: Overlays the **OLED Text** on top of the **OLED Texture**.

*Note: Since rendering the full screen requires sending a large SysEx packet, updates are throttled to a maximum frequency (every 150ms) to ensure smooth operation without overloading the MIDI connection. To force an immediate update, trigger the **OLED Send Trigger** port.*

---

## 5. Sample Input Arrays (Copy-Pasteable)

Here are literal copy-pasteable array structures that you can paste directly into Cables.gl or a custom JS script to feed into the respective array input ports.

### A. Pads Array Port (`Pads Array`)

#### Example 1: Flat Array of Numbers (Checkerboard Alternating Red/Black)
```javascript
[
  255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0,
  0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0,
  255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0,
  0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0, 0,0,0, 255,0,0
]
```

#### Example 2: Array of Sub-Arrays (Row-Based Colors - Red, Yellow, Green, Blue)
```javascript
[
  [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0], [127,0,0],
  [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0], [127,127,0],
  [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0], [0,127,0],
  [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127], [0,0,127]
]
```

#### Example 3: Array of Objects (All Pads Off except corners: top-left, top-right, bottom-left, bottom-right in White)
```javascript
[
  {"r":127,"g":127,"b":127}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":127,"g":127,"b":127},
  {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0},
  {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0},
  {"r":127,"g":127,"b":127}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":127,"g":127,"b":127}
]
```

### B. Mute Lights Port (`Mute Lights`)

#### Example 1: Alternate Lights (1 and 3 on, 2 and 4 off)
```javascript
[true, false, true, false]
```

#### Example 2: All On
```javascript
[true, true, true, true]
```

#### Example 3: First Light Only
```javascript
[true, false, false, false]
```

### C. Button Lights Port (`Button Lights`)

#### Example 1: Mode Selection State (Step active, others off/dim)
```javascript
{
  "step": 2,       // Bright (Active)
  "note": 0,       // Off
  "drum": 0,       // Off
  "perform": 0     // Off
}
```

#### Example 2: DAW Transport Control State (Playback Active, Record Armed)
```javascript
{
  "play": 2,       // Play light active (Green LED)
  "stop": 0,       // Stop light off
  "record": 2,     // Record light active (Red LED)
  "shift": false,  // Shift light off
  "alt": false     // Alt light off
}
```

#### Example 3: All Bottom Buttons & Navigation Active (Full Illumination)
```javascript
{
  "shift": true,
  "alt": true,
  "play": 2,
  "stop": 2,
  "record": 2,
  "step": 2,
  "note": 2,
  "drum": 2,
  "perform": 2,
  "patternUp": true,
  "patternDown": true
}
```

### D. Knob Defaults Port (`Knob Defaults`)

#### Example 1: Center Values (Volume, Pan, Filter, Resonance at 0.5, Select at 0.0)
```javascript
[0.5, 0.5, 0.5, 0.5, 0.0]
```

#### Example 2: Zeroed Positions
```javascript
[0.0, 0.0, 0.0, 0.0, 0.0]
```

#### Example 3: Custom Preset Configuration (Vol: 1.0, Pan: 0.25, Filter: 0.75, Res: 0.1, Select: 0.5)
```javascript
[1.0, 0.25, 0.75, 0.1, 0.5]
```*
