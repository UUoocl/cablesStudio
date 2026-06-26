# Ops.Extension.DeviceControl.FlStudioFireControl

Interact with and control the AKAI Fire MIDI controller, including its pad grid, relative knobs, mute/solo buttons, and custom OLED display.

## Description

This operator provides comprehensive bidirectional control of the AKAI Fire controller. It converts Cables textures or data arrays into the device's native SysEx/MIDI protocols:
1. **Pads Matrix (16x4)**: Feed a 16x4 WebGL texture or color array to control the 64 RGB pads. Includes intelligent caching to only transmit MIDI changes, minimizing USB MIDI bandwidth.
2. **OLED Screen (128x64)**: Send strings directly using the built-in character set, or render a 128x64 WebGL texture (e.g. shapes, text, animations) onto the physical screen. Updates are throttled to avoid interface congestion.
3. **Knobs**: Decodes relative 7-bit two's complement rotation messages from the 4 primary encoders (Volume, Pan, Filter, Resonance) and the Select encoder. Outputs both triggers for increments/decrements and absolute accumulated values.
4. **Mute / Buttons**: Bidirectional control for the 4 Mute/Solo buttons and their red LED indicators, as well as general button triggers.

---

## Ports

### Inputs
- **update**: Triggers downsampling, pixel extraction, and MIDI command generation.
- **Active**: Enable or disable the MIDI device polling and update loops.
- **Mode**: "Direct MIDI" (direct WebMIDI browser communication) or "Message Output Only".
- **MIDI Device**: Selects the connected AKAI Fire device from detected system MIDI ports.
- **Pads Texture**: A 16x4 WebGL texture source where each pixel maps to a pad's RGB LED.
- **Pads Array**: An alternative color array (flat 192 floats or array of colors) to drive the pads.
- **Mute Lights**: Array of 4 booleans or values (0-127) to control the red Solo/Mute button LEDs.
- **OLED Texture**: A 128x64 WebGL texture to render onto the monochrome screen.
- **OLED Text**: Simple string to draw directly onto the screen.
- **OLED Draw Mode**: Choose between "Text Only", "Texture Only", or "Combined" display.
- **OLED Send Trigger**: Manual trigger to send the OLED frame buffer.
- **Button Lights**: Configures other button lights on the device.
- **Brightness**: General scaling factor (0.0 to 1.0) for pad colors.
- **Reset Knobs**: Triggers a reset of all absolute encoder positions.
- **Knob Defaults**: Starter defaults for the 5 knobs `[Vol, Pan, Filter, Res, Select]`.

### Outputs
- **trigger**: Triggers upon render loop execution.
- **Connected**: Returns `true` if connected successfully to the device.
- **Status**: Visual status string (e.g., "Connected to FL STUDIO FIRE").
- **MIDI Messages**: Outputs sent/received MIDI message arrays.
- **Knobs Object**: Object containing current knob values.
- **Knob Vol / Pan / Filter / Res / Select**: Current absolute values (0.0 to 1.0).
- **Knob Turn Triggers**: Fired when a corresponding knob is turned.
- **Pad Press / Release**: Fired on any pad touch events.
- **Last Pad Index / Row / Col / Velocity**: Coordinates and velocity of the last pad action.
- **Pads State**: Array of 64 booleans representing physical pad states.
- **Mute 1 / 2 / 3 / 4**: State of the four side Mute buttons.
- **Buttons State**: Status of all other buttons.
