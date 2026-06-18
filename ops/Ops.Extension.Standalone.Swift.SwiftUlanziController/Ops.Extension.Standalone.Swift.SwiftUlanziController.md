# SwiftUlanziController

Interfaces with the Ulanzi D100H Dial Controller on macOS using a native background Swift process communicating via standard input/output pipes.

## Description

This operator utilizes a native background Swift process to control and capture input events from the **Ulanzi D100H Dial Creative Controller** via Bluetooth Low Energy (BLE). It dynamically handles connection states, secure authentication handshakes, battery events, dial rotations, and button presses.

Input events are streamed to Cables in real-time. Control commands, such as adjusting the tactile dial's haptic motor strength, can be sent back to the device.

## Inputs

* **Active**: Starts or stops the native Swift Ulanzi controller sidecar process.
* **Haptic Strength**: The strength value (0 to 100) to set for the dial's tactile haptic motor clicks.
* **Send Haptic**: Trigger this button/input port to send the current `Haptic Strength` value to the connected device.

## Outputs

* **On Event**: Fires a trigger every time any event is received from the controller.
* **Event Type**: The event identifier (e.g. `"connected"`, `"disconnected"`, `"deviceKeyEvent"`, `"deviceBattery"`, `"bluetooth_status"`).
* **Connected**: Boolean indicating whether the controller is successfully connected via BLE.
* **MAC Address**: The BLE MAC address of the connected controller.
* **Battery**: The battery percentage of the controller (0 to 100).
* **Button Index**: The index of the button/dial action that occurred:
  - `1` to `7`: Physical buttons on the controller.
  - `8`: Dial press (click).
  - `9`: Dial rotated Counter-Clockwise (CCW).
  - `10`: Dial rotated Clockwise (CW).
* **Button Pressed**: Boolean indicating whether the button was pressed (`true`) or released (`false`).
* **On Button Event**: Fires a trigger when a button press or release occurs (indices 1 to 8).
* **On Dial CW**: Fires a trigger when the dial is rotated Clockwise (index 10).
* **On Dial CCW**: Fires a trigger when the dial is rotated Counter-Clockwise (index 9).
* **Raw Message**: The raw parsed JSON message object from the sidecar.
* **Running**: True if the native background sidecar process is running.
* **Status**: Human-readable status of the Swift process (e.g. "Launching...", "Running", "Stopped").

---

## Dial Event Mapping Reference

The physical dial controls map to the following output states:

| Physical Control | Event Type | Button Index | Button Pressed | Output Triggers |
| :--- | :--- | :---: | :---: | :--- |
| **Buttons 1-7** | `deviceKeyEvent` | `1` to `7` | `true` (press) / `false` (release) | `On Button Event` |
| **Dial Click** | `deviceKeyEvent` | `8` | `true` (press) / `false` (release) | `On Button Event` |
| **Dial CW Rotate** | `deviceKeyEvent` | `10` | `true` (Impulse only) | `On Dial CW` |
| **Dial CCW Rotate**| `deviceKeyEvent` | `9` | `true` (Impulse only) | `On Dial CCW` |
| **Battery Status** | `deviceBattery` | — | — | Updates `Battery` value |

---

## Technical Details

1. **Stdout/Stdin IPC**: Since the Swift application communicates directly via line-buffered stdout/stdin streams, the JavaScript operator handles chunked standard streams in real-time, parsing them as clean JSON messages.
2. **Dynamic Library Binding**: The Ulanzi SDK relies on `kwdm.dylib`. This library is automatically distributed alongside the sidecar in the `swift_bin/` directory and loaded dynamically by the executable.
