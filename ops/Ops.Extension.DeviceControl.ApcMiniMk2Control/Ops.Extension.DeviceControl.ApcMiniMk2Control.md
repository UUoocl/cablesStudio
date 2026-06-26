# Ops.Extension.DeviceControl.ApcMiniMk2Control

Interact with and control the AKAI Professional APC Mini MK2 MIDI controller, including its 8x8 pad grid, bottom track buttons, side scene buttons, shift button, and faders.

## Description

This operator provides bidirectional control of the APC Mini MK2. It translates standard Cables arrays or state objects into WebMIDI messages:
1. **Pads Matrix (8x8)**: Use a flat color array or an object to drive the 64 RGB pads. Support is included for 128-color palette mappings (with solid, pulse, and blink behaviors) and SysEx-based 24-bit custom RGB colors. MIDI messages are cached and rate-limited to 8 updates per frame to optimize bandwidth and prevent device buffer overflows.
2. **Horizontal Pads**: Control the 8 track buttons below the pad matrix. Can be driven by array or object.
3. **Vertical Pads**: Control the 8 scene buttons on the right side of the pad matrix. Can be driven by array or object.
4. **Shift Button**: LED state control for the Shift button (MIDI note `0x7A`).
5. **Faders**: Read absolute fader positions for faders 1-8 and the master fader, outputting both normalized values and turn triggers. The fader states can be reset to custom defaults.

---

## Decoupled Texture Downsampling

To drive the APC Mini MK2 pads with a WebGL texture, combine this operator with [Ops.Extension.DeviceControl.TextureToApcMiniMk2PadObject](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.DeviceControl.TextureToApcMiniMk2PadObject/Ops.Extension.DeviceControl.TextureToApcMiniMk2PadObject.md).
1. Connect your WebGL texture to the **Texture** port of `TextureToApcMiniMk2PadObject`.
2. Connect `TextureToApcMiniMk2PadObject`'s **update** input to the main draw loop.
3. Connect the output **Pads Object** of `TextureToApcMiniMk2PadObject` to the **Pads Object** input of `ApcMiniMk2Control`.
4. Connect the **update** trigger of `ApcMiniMk2Control` to the **trigger** output of `TextureToApcMiniMk2PadObject` or drive it at your desired rate.

---

## Ports

### Inputs
- **update**: Triggers the input parsing and MIDI transmission loop.
- **Active**: Toggle the MIDI communication and update loops.
- **Mode**: "Direct MIDI" (direct WebMIDI browser communication) or "Message Output Only".
- **MIDI Device**: Selection dropdown of active system MIDI output ports.
- **Pads Array**: A flat color array (flat 192 floats or array of color values) to drive the pads.
- **Pads Object**: An object mapping pad indexes (0-63) to color configurations.
- **Horizontal Pads Array**: Array of 8 states for the bottom track buttons.
- **Horizontal Pads Object**: Object mapping track button indexes/names to states.
- **Vertical Pads Array**: Array of 8 states for the side scene buttons.
- **Vertical Pads Object**: Object mapping scene button indexes/names to states.
- **Shift Button**: Control state for the Shift button LED (note 0x7A). Exposes a String port accepting "on", "off", "blink", or coerced boolean/numeric values ("true", "false", "0", "1", "2").
- **Reset Faders**: Resets all fader outputs to defaults.
- **Fader Defaults**: Array of 9 default starting values for the faders.

### Outputs
- **trigger**: Fires on update loop completion.
- **Connected**: Returns `true` if connected successfully.
- **Status**: Visual status string (e.g., "Connected to APC mini mk2").
- **MIDI Messages**: Emits sent/received MIDI byte arrays.
- **Faders Array**: Flat array of 9 fader values (0.0 to 1.0).
- **Faders Object**: Key-value pairs of current fader positions.
- **Fader 1 - 8 / Master Fader**: Current absolute fader values (0.0 to 1.0).
- **Fader Turn Triggers**: Fired when a corresponding fader moves.
- **Pad Press / Release**: Fired on pad matrix touch events.
- **Last Pad Index / Row / Col / Velocity**: Details of the last pad interaction.
- **Pads State / Pads State Object**: Pressed states for all 64 pads.
- **Horizontal / Vertical Press & Release Triggers**: Button touch events.
- **Last Horizontal / Vertical Index**: Index of the last button pressed.
- **Horizontal / Vertical State**: Pressed states for track/scene buttons.
- **Shift State**: Pressed state of the physical Shift button.
- **Buttons State**: Status of all other physical buttons.
