# Ops.Extension.DeviceControl.LaunchPadMiniMk1Control

Converts textures to a format suitable for the original Novation Launchpad (Mk1/Mini) and controls its LED grids directly.

## Description

This operator enables real-time color control over the original Novation Launchpad (Mk1/Mini) controller. It accepts any WebGL texture as input, resizes/downsamples it internally to a target grid resolution (8x8 or 9x9), extracts the colors using WebGL pixel reading, and formats them into standard MIDI Note-On and Control Change (CC) messages.

To prevent overwhelming the low-bandwidth USB MIDI implementation on legacy Launchpad Mk1 units (limited to ~400 MIDI messages per second), this operator utilizes a built-in **state diffing cache**. It tracks the state of each LED across frames and only transmits MIDI updates for pads whose color/velocity has changed, ensuring responsive performance and zero light-lag.

As the Launchpad Mk1 does not natively support hardware-level text scrolling, this operator implements a **software-driven text scrolling animator** using the 8x8 font dictionary. When triggered, the operator shifts and draws characters column-by-column across the grid.

## Ports

### Inputs
- **update**: Triggers the downsampling, pixel extraction, and MIDI command generation.
- **Texture**: The WebGL texture source to convert.
- **Active**: Toggle to enable or disable processing.
- **Mode**: Switch between "Direct MIDI" (direct browser WebMIDI output) or "Message Output Only" (useful for routing generated messages).
- **MIDI Device**: Selection dropdown of detected MIDI outputs on the system.
- **Grid Size**: Select between "8x8 Grid" (main grid pads only) or "9x9 Full (with Buttons)" (including top CC buttons and right scene launch buttons).
- **Brightness**: Overall multiplier for grid brightness (0.0 to 1.0).
- **Reset Device**: Resets the Launchpad Mk1 controller (sends `[0xB0, 0x00, 0x00]` and clears the local state cache).
- **Clear Grid**: Resets all pad colors to off.
- **Scroll Text**: The text message to scroll across the grid.
- **Trigger Scroll**: Begins the software-driven text scrolling animation.
- **Scroll Speed**: Controls the text scrolling speed (ranges from slow to fast).
- **Character**: A single character to display on the 8x8 grid.
- **Char Transition**: Select transition type for character changes ("Glitch", "Scroll", or "Collapse").
- **Transition Duration**: Time in seconds for the transition animation.
- **Char Color**: The color to render the character or scrolling text in ("Yellow", "Red", "Orange", "Green", "Lime", "Dim Red", "Dim Green", "Dim Yellow", "Off").
- **Char Rotation**: Rotation of the character rendering on the grid ("0", "90", "180", or "270" degrees).

### Outputs
- **trigger**: Triggers upon render frame completion.
- **MIDI Messages**: Outputs the array of concatenated MIDI bytes sent in the current frame.
- **Status**: Visual string reflecting device status (e.g. Connected, Disconnected, Send Error).
- **Connected**: Boolean indicating whether a device is successfully linked.
