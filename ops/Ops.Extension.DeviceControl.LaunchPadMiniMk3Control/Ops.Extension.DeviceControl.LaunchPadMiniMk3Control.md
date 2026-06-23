# Ops.Extension.DeviceControl.LaunchPadMiniMk3Control

Converts textures to a format suitable for the Novation Launchpad Mini [MK3] and controls its LED grids directly.

## Description
This operator enables real-time color control over the Novation Launchpad Mini [MK3] controller. It accepts any WebGL texture as input, resizes/downsamples it internally to a target grid resolution (8x8 or 9x9), extracts the colors using WebGL pixel reading, and formats them into standard SysEx MIDI payloads.

## Ports

### Inputs
- **update**: Triggers the downsampling, pixel extraction, and MIDI command generation.
- **Texture**: The WebGL texture source to convert.
- **Active**: Toggle to enable or disable processing.
- **Mode**: Switch between "Direct MIDI" (direct browser WebMIDI output) or "Message Output Only" (useful for routing generated messages).
- **MIDI Device**: Selection dropdown of detected MIDI outputs on the system.
- **Grid Size**: Select between "8x8 Grid" (main grid pads only) or "9x9 Full" (including top row, right column, and logo buttons).
- **Color Mode**: Select between 24-bit custom "RGB (SysEx)" or "Palette (Velocity)" using Launchpad's internal color palette.
- **Brightness**: Overall multiplier for grid brightness (0.0 to 1.0).
- **Send Handshake**: Sends Programmer Mode SysEx command to put the Launchpad Mini [MK3] in programmer state.
- **Clear Grid**: Resets all pad colors to off.
- **Scroll Text**: The text message to scroll on the Launchpad Mini [MK3].
- **Trigger Scroll**: Begins text scrolling animation.

### Outputs
- **trigger**: Triggers upon render frame completion.
- **MIDI Messages**: Outputs the array of MIDI / SysEx bytes for the generated frame or command.
- **Status**: Visual string reflecting device status (e.g. Connected, Disconnected, Send Error).
- **Connected**: Boolean indicating whether a device is successfully linked.
