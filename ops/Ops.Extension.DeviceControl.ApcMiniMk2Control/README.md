# AKAI APC Mini MK2 Cables.gl Operator

This operator provides bidirectional control of the **AKAI Professional APC Mini MK2** MIDI controller in Cables.gl. It exposes inputs and outputs for the 8x8 RGB pad matrix, bottom track buttons, side scene buttons, the Shift button, and the 9 physical faders.

---

## Folder Contents
* `Ops.Extension.DeviceControl.ApcMiniMk2Control.json`: Port definitions and layout grouping.
* `Ops.Extension.DeviceControl.ApcMiniMk2Control.js`: Operator implementation.
* `Ops.Extension.DeviceControl.ApcMiniMk2Control.md`: In-editor cables.gl documentation.
* `README.md`: Comprehensive usage guide and examples (this file).

---

## 1. Pad Matrix Controls (8x8 RGB Grid)

The pad matrix has 64 RGB LEDs arranged in an 8x8 grid. You can feed them using either an array or an object. To drive them using a WebGL texture, you should use the companion downsampler operator.

### A. WebGL Texture Input (Decoupled Workflow)
To drive pads using a texture:
1. Connect a WebGL texture to the `Texture` port of the **Ops.Extension.DeviceControl.TextureToApcMiniMk2PadObject** operator.
2. Connect the **update** input of that operator to your main rendering loop.
3. Connect the output **Pads Object** of the downsampler to the **Pads Object** input of `ApcMiniMk2Control`.
4. Connect the **update** trigger of `ApcMiniMk2Control` to the **trigger** output of `TextureToApcMiniMk2PadObject` (or trigger it as needed).

This decoupled approach ensures WebGL operations run synchronously in the draw loop while MIDI commands are buffered and rate-limited.

### B. Array Input (`Pads Array`)
Accepts three formats to control the 64 pads:
* **Format 1**: Flat array of 192 floats/numbers (groups of `[r, g, b]` from 0.0 - 1.0 or 0 - 255).
* **Format 2**: Flat array of 64 palette color index values (0-127).
* **Format 3**: Flat array of 64 objects representing custom RGB (`{ r: 255, g: 0, b: 0 }`) or palette colors with behaviors (`{ color: 21, behavior: "pulse", speed: "1/4" }`).

### C. Object Input (`Pads Object`)
Accepts an object mapping pad notes (0-63) to their states. Useful for updating specific pads dynamically:
```javascript
{
  "0": 5, // Pad 0 (bottom-left) set to palette color 5 (Red)
  "63": { "color": 21, "behavior": "pulse", "speed": "1/4" }, // Pad 63 (top-right) pulsing Green
  "12": { "r": 0, "g": 255, "b": 255 } // Pad 12 custom RGB cyan
}
```

---

## 2. Horizontal and Vertical Button Controls

Track Buttons (horizontal buttons 1-8 below the grid) and Scene Buttons (vertical buttons 1-8 on the right of the grid) support three LED states: `"off"` (or `false`/`0`), `"on"` (or `true`/`1`), and `"blink"` (or `2`).

### A. Horizontal Buttons (Track Buttons)
* **Horizontal Pads Array**: Array of 8 states.
* **Horizontal Pads Object**: Object mapping indexes/names to states.
```javascript
// Array format
[true, false, "blink", true, false, false, "blink", false]

// Object format
{
  "track1": "on",
  "track3": "blink",
  "track8": "off"
}
```

### B. Vertical Buttons (Scene Buttons)
* **Vertical Pads Array**: Array of 8 states.
* **Vertical Pads Object**: Object mapping indexes/names to states.
```javascript
// Array format
["on", "off", "on", "off", "blink", "blink", "off", "off"]

// Object format
{
  "scene1": "on",
  "scene5": "blink",
  "scene8": "off"
}
```

### C. Shift Button
Exposes a `Shift Button` input port and a `Shift State` output port:
* **Shift Button Input**: Control the Shift button LED. Exposes a **String** port. Accepts string values (`"on"`, `"off"`, `"blink"`) or coerced booleans/numbers (`"true"`, `"false"`, `"0"`, `"1"`, `"2"`).
* **Shift State Output**: Emits `true` while the physical Shift button is held down.

---

## 3. Faders and Encoders

The APC Mini MK2 contains 9 sliding faders (8 channel faders + 1 master fader) corresponding to CC values `0x30` to `0x38`.
* **Fader Outputs**: Ports `Fader 1` through `Fader 8` and `Master Fader` emit normalized values (0.0 to 1.0).
* **Fader Turn Triggers**: Ports like `Fader 1 Turn` fire a trigger when that fader's value changes.
* **Faders Array**: Emits a flat array of 9 values.
* **Faders Object**: Emits an object representation (`{ fader1: 0.5, master: 1.0 }`).
* **Presets**: Set default values using the `Fader Defaults` input array, and trigger `Reset Faders` to apply them.

---

## 4. Copy-Pasteable Input Examples

### Pads Array (Alternating checkerboard)
```javascript
[
  5, 0, 5, 0, 5, 0, 5, 0,
  0, 5, 0, 5, 0, 5, 0, 5,
  5, 0, 5, 0, 5, 0, 5, 0,
  0, 5, 0, 5, 0, 5, 0, 5,
  5, 0, 5, 0, 5, 0, 5, 0,
  0, 5, 0, 5, 0, 5, 0, 5,
  5, 0, 5, 0, 5, 0, 5, 0,
  0, 5, 0, 5, 0, 5, 0, 5
]
```

### Pads Object (Custom Colors and Pulse/Blink)
```javascript
{
  "0": { "color": 5, "behavior": "solid" },      // Red solid
  "7": { "color": 21, "behavior": "pulse", "speed": "1/4" },  // Green pulsing
  "56": { "color": 45, "behavior": "blink", "speed": "1/2" }, // Blue blinking
  "63": { "r": 255, "g": 255, "b": 0 }           // Yellow custom RGB SysEx
}
```

### Fader Defaults (Channel 1-8 at 0.5, Master at 1.0)
```javascript
[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0]
```

### Horizontal Pads Array & Object (Track Buttons 1-8)
```javascript
// Horizontal Pads Array (Alternating On / Blink / Off)
[true, false, "blink", "on", 0, 1, 2, "off"]

// Horizontal Pads Object (Keys can be track names, button indexes, or note values)
{
  "track1": "on",
  "track2": false,
  "track3": "blink",
  "4": "on",        // Index (0-based)
  "0x69": "blink",  // Note hex (note 105)
  "106": "off"      // Note decimal (note 106)
}
```

### Vertical Pads Array & Object (Scene Buttons 1-8)
```javascript
// Vertical Pads Array (Blink all even scene buttons)
[false, "blink", false, "blink", false, "blink", false, "blink"]

// Vertical Pads Object (Keys can be scene names, button indexes, or note values)
{
  "scene1": "on",
  "scene2": "blink",
  "scene8": "off",
  "3": "on",        // Index (0-based)
  "0x74": "blink",  // Note hex (note 116)
  "117": "off"      // Note decimal (note 117)
}
```

### Shift Button Input (LED control)
The `Shift Button` is a String input port. You can feed it direct strings or coerced values:
```javascript
"on"       // Turn LED solid on
"blink"    // Blink LED
"off"      // Turn LED off
"true"     // Coerced to on
"false"    // Coerced to off
"1"        // Coerced to on
"2"        // Coerced to blink
"0"        // Coerced to off
```

