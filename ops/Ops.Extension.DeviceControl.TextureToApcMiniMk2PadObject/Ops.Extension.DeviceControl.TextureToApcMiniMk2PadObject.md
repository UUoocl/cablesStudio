# Ops.Extension.DeviceControl.TextureToApcMiniMk2PadObject

Convert a WebGL texture to a Pad Object suitable for controlling the AKAI Professional APC Mini MK2 grid pads.

## Description

This operator downsamples any input WebGL texture to an `8x8` matrix using an internal framebuffer and extracts colors. It outputs an object in the format `{ "0": { "color": [r, g, b] }, "1": { "color": [r, g, b] }, ... }` which can be connected directly to the `Pads Object` input of the `ApcMiniMk2Control` operator.

This decoupled design is recommended because WebGL rendering must occur within the main draw loop (triggered by a MainLoop operator), while MIDI messages can be sent on change or at a restricted frame rate to optimize device performance and prevent USB MIDI buffer overflow.

---

## Ports

### Inputs
- **update**: Triggers the downsampling render pass and pixel readback (must be connected to the MainLoop).
- **Texture**: The input WebGL texture to downsample.
- **Brightness**: General scaling factor (0.0 to 1.0) applied to the RGB channels.
- **High Contrast**: Boolean toggle that, when enabled, snaps each pad's color to match its nearest neighboring pad's color in RGB space to reduce noise and enhance color boundaries.

### Outputs
- **trigger**: Fires when a downsample pass and pixel readback completes.
- **Pads Object**: The downsampled pad colors mapped as a key-value object of RGB arrays.
