# Ops.Extension.DeviceControl.LaunchPadMatrixSplitter

Splits a single texture into 4 quadrant textures to control a 2x2 matrix of Launchpads.

## Description
This operator crops an input texture into 4 quadrants (representing Top-Left, Top-Right, Bottom-Left, Bottom-Right segments). It allows you to configure which quadrant maps to which output port, and provides independent rotation and flipping for each output to match the physical mounting orientation of individual Launchpad displays (e.g. rotated to routes cables, ports facing outwards).

## Ports

### Inputs
- **render**: Trigger input to execute the split.
- **Texture**: The high-resolution source texture to split.
- **Output Resolution**: The output resolution size of the 4 quadrants (Default 256x256, 128x128, 64x64, 8x8, 9x9, or half the input's resolution).
- **Source [TL/TR/BL/BR]**: Selects which quadrant of the input texture to use.
- **Rotation [TL/TR/BL/BR]**: Rotates the cropped output by None, 90° CW, 180°, or 270° CW.
- **Flip X [TL/TR/BL/BR]**: Mirrors the cropped output horizontally.
- **Flip Y [TL/TR/BL/BR]**: Mirrors the cropped output vertically.

### Outputs
- **trigger**: Trigger output after processing.
- **Texture [TL/TR/BL/BR]**: The transformed quadrant texture outputs.
