# Ops.Extension.DeviceControl.LaunchControlXlMk3DawMode

Enables and configures DAW Mode on the Novation LaunchControl XL mk3 MIDI controller.

## Description
This operator manages the connection and mode configuration for the Novation LaunchControl XL mk3. It utilizes WebMIDI to auto-discover and connect to the device. Once connected, it can put the device in DAW mode (allowing access to secondary sub-modes like DAW Mixer and DAW Control) and configure other surface features such as encoder relative mode, fader pickup, and continuous touch event tracking.

## Ports

### Inputs

- **Active**: Master toggle for processing and sending MIDI commands.
- **Mode**: Choose between "Direct MIDI" (direct WebMIDI output) or "Message Output Only" (useful for routing the generated message objects manually).
- **MIDI Device**: Selection dropdown of discovered system MIDI output devices.
- **DAW Mode**: Toggle DAW Mode on the device.
- **Control Method**: Select how the DAW Mode command is sent:
  - **SysEx**: Send DAW Mode commands using System Exclusive messages (`F0 00 20 29 02 15 02 7F F7`).
  - **MIDI Note**: Send DAW Mode commands using a MIDI note message on the DAW interface (`9F 0C 7F` / Note on Channel 16, Note 12).
  - **Both**: Send both SysEx and MIDI Note messages.
- **Surface Mode**: Switch between DAW Mode sub-states:
  - **None**: Maintain the current mode.
  - **DAW Mixer**: Put the surface in DAW Mixer Mode.
  - **DAW Control**: Put the surface in DAW Control Mode.
  - **Custom Mode 1-16**: Toggle to custom templates.
- **Row 1-3 Relative**: Toggles the corresponding row of endless rotary encoders to Relative mode instead of Absolute CC mode.
- **Fader Pickup**: Toggle fader pickup behavior. When enabled, moving a physical fader will not update parameters until the fader reaches the current value of the parameter.
- **Touch Events**: Enable or disable continuous control touch event reports.
- **Send Message**: Manually force-sends the active DAW Mode command configuration payload.

### Outputs

- **MIDI Messages**: Outputs the array of generated MIDI/SysEx bytes.
- **Status**: Text representation of the WebMIDI connection/error status.
- **Connected**: Boolean indicating whether a device is successfully linked.

## Controlling the LEDs

In DAW Mode, all LED controls are addressed on **MIDI Channel 1** using standard Control Change (CC) messages or SysEx messages. Note that the CC indices listed below match the control itself.

### LED Control CC Mapping Table (DAW Mode)

| Control Group | Details / CC Indices (Channel 1) |
|---|---|
| **Knobs (Row 1)** | Columns 1–8: CC `13` to `20` (Hex `0Dh` to `14h`) |
| **Knobs (Row 2)** | Columns 1–8: CC `21` to `28` (Hex `15h` to `1Ch`) |
| **Knobs (Row 3)** | Columns 1–8: CC `29` to `36` (Hex `1Dh` to `24h`) |
| **Focus Buttons (Row 1)** | Columns 1–8: CC `37` to `44` (Hex `25h` to `2Ch`) |
| **Control Buttons (Row 2)** | Columns 1–8: CC `45` to `52` (Hex `2Dh` to `34h`) |
| **Navigation & Transport** | `Page ▲`: CC `106` (`6Ah`), `Page ▼`: CC `107` (`6Bh`), `Track ◄`: CC `103` (`67h`), `Track ►`: CC `102` (`66h`), `Play`: CC `116` (`74h`), `Record`: CC `118` (`76h`) |
| **Side Action Buttons** | `Solo / Arm`: CC `65` (`41h`), `Mute / Select`: CC `66` (`42h`), `Device`: CC `104` (`68h`) |

> [!NOTE]
> The **Shift** button (CC `63`) is handled directly by internal feature control and cannot be coloured manually.

### LED Output Message Structure

- **Palette Mode**: Send standard CC message on Channel 1 (`0xB0`):
  `[176, CC_Index, Colour_Index]` (where `Colour_Index` is between `0` and `127`).
- **RGB Mode**: Send System Exclusive message:
  `[240, 0, 32, 41, 2, 21, 1, 83, CC_Index, R, G, B, 247]` (where `R`, `G`, and `B` values are 7-bit, in the range `0` to `127`).

---

## Suggested Cables Workflow

To build a patch with LaunchControl XL mk3:

1. **Initialization**: Add one `LaunchControlXlMk3DawMode` op to your patch. Select your target MIDI device (e.g., `Launch Control XL 3 DAW Out`). Set **DAW Mode** to `true` to activate the DAW mode environment.
2. **MIDI Routing**:
   - If using **Direct MIDI** mode, both the DAW Mode op and any LED Control ops can write directly to the hardware.
   - If routing manually, set the DAW Mode and LED Control ops to **Message Output Only**. Connect their `MIDI Messages` output ports into a `MidiSender` or similar op to dispatch them to your physical output.
3. **LED Feedback**: Add the `LaunchControlXlMk3LedControl` op, choose the same MIDI Device, select individual controls or bulk arrays (e.g., a 24-element array of palette numbers for Knobs), and trigger the update to visually map color states onto your controller!

