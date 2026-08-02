# Ops.Extension.DeviceControl.LaunchControlXlMk3LedControl

Controls the LED colors on the knobs, buttons, and navigation/transport controls of the Novation LaunchControl XL mk3.

## Description
This operator manages sending MIDI Control Change and System Exclusive messages to update the colors of the LaunchControl XL mk3 LEDs in DAW Mode. It supports coloring individual knobs or buttons (with reactive updates on parameter changes) and sending bulk color states through array inputs.

## Ports

### Inputs

- **Active**: Master toggle for sending MIDI commands.
- **Mode**: Choose between "Direct MIDI" (direct WebMIDI output) or "Message Output Only" (useful for routing the generated message objects manually).
- **MIDI Device**: Selection dropdown of discovered system MIDI output devices.
- **Target Mode**:
  - **Individual Control**: Allows selection and coloring of a single knob or button LED.
  - **All Knobs Array**: Updates all 24 endless encoder LEDs at once using array data.
  - **All Buttons Array**: Updates the 16 bottom buttons (Row 1 Focus, Row 2 Control) using array data.
  - **Clear All**: Turns off all LEDs on the device.
- **Control**: Select which knob, button, or navigation/transport control to update when **Target Mode** is set to "Individual Control".
- **Color Mode**: Select between standard color presets ("Palette") or 7-bit RGB coloring ("RGB").
- **Palette Color**: Preset color index (0 to 127) when Color Mode is "Palette". (0 turns the LED off).
- **Red, Green, Blue**: Scale float sliders (0.0 to 1.0) when Color Mode is "RGB".
- **Palette Array**: Flat array of up to 24 integers (for Knobs) or 16 integers (for Buttons) defining palette colors.
- **RGB Array**: Flat array of up to 72 floats (for Knobs: 24 * 3) or 48 floats (for Buttons: 16 * 3) defining normalized RGB triplets.
- **Send**: Trigger button to dispatch color states.

### Outputs

- **MIDI Messages**: Outputs the array of generated MIDI/SysEx bytes.
- **Status**: Text representation of the WebMIDI connection/error status.
- **Connected**: Boolean indicating whether a device is successfully linked.

---

## Usage Examples

### 1. Individual Control Examples

#### Example A: Turn the Record button Red (Palette Mode)
Set the following ports:
- **Target Mode**: `Individual Control`
- **Control**: `Record`
- **Color Mode**: `Palette`
- **Palette Color**: `5` (Standard red preset)
- **Result**: The Record button immediately lights up red.

#### Example B: Custom Purple color on Knob Row 1 Column 3 (RGB Mode)
Set the following ports:
- **Target Mode**: `Individual Control`
- **Control**: `Knob R1 C3`
- **Color Mode**: `RGB`
- **Red**: `0.8` (translates to `102` / `127`)
- **Green**: `0.1` (translates to `12` / `127`)
- **Blue**: `1.0` (translates to `127` / `127`)
- **Result**: The LED of the third knob in the first row turns bright purple.

---

### 2. Bulk Array Examples

#### Example A: Color all 24 Knobs in groups of 4 (Palette Array)
Set the following ports:
- **Target Mode**: `All Knobs Array`
- **Color Mode**: `Palette`
- Connect a **Palette Array** containing 24 numbers (Row 1: 4 Red, 4 Orange; Row 2: 4 Yellow, 4 Green; Row 3: 4 Cyan, 4 Blue):
  ```json
  [
    5, 5, 5, 5, 9, 9, 9, 9,
    13, 13, 13, 13, 21, 21, 21, 21,
    37, 37, 37, 37, 45, 45, 45, 45
  ]
  ```
- Trigger **Send**.

#### Example B: Alternate Bottom Row Buttons Green and Off (RGB Array)
Set the following ports:
- **Target Mode**: `All Buttons Array`
- **Color Mode**: `RGB`
- Connect an **RGB Array** containing 48 floats (16 buttons * 3 RGB values, where the first 8 triplets are for Focus buttons, and the last 8 triplets are for Control buttons):
  ```json
  [
    0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
    0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
    0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0
  ]
  ```
- Trigger **Send**.


