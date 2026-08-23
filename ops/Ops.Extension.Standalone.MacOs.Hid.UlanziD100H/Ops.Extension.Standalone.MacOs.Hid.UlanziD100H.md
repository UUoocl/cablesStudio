# Ops.Extension.Standalone.MacOs.Hid.UlanziD100H

Native macOS driver interface for the **Ulanzi D100H Dial Controller**.

---

## Features
- **Tactile Magnetic Dial**: Instantaneous rotation impulse triggers (`On Dial CW`, `On Dial CCW`) and dial push switch.
- **7 Programmable Quick Keys**: Discrete button event tracking for buttons `1 .. 7`.
- **Programmable Haptic Feedback**: Transmits vibration and detent intensity (`0 .. 100`) directly to the dial's internal haptic actuator.
- **Battery & Connection Telemetry**: Real-time battery percentage (`0 .. 100`) and BLE MAC address monitoring.

---

## Ports

### Inputs
* **`Active`**: Starts or stops listening to the controller.
* **`Haptic Strength`**: Value (`0 .. 100`) controlling tactile haptic feedback strength.
* **`Send Haptic`**: Trigger button to send the haptic command to the device.

### Outputs
* **`On Event`**: Trigger executed on any device update.
* **`Event Type`**: Identifier string (`connected`, `disconnected`, `deviceKeyEvent`, `deviceBattery`, `bluetooth_status`).
* **`Connected`**: `true` when the device is actively paired and connected.
* **`MAC Address`**: BLE hardware address of the controller.
* **`Battery`**: Current battery percentage (`0 .. 100`).
* **`Button Index`**:
  * `1 .. 7`: Face buttons.
  * `8`: Dial push click.
  * `9`: Dial rotated Counter-Clockwise (CCW).
  * `10`: Dial rotated Clockwise (CW).
* **`Button Pressed`**: State of the button.
* **`On Button Event`**: Trigger executed when buttons `1 .. 8` are pressed or released.
* **`On Dial CW`**: Trigger executed on clockwise dial rotation.
* **`On Dial CCW`**: Trigger executed on counter-clockwise dial rotation.
* **`Raw Message`**: Full parsed JSON payload object.
* **`Running`**: `true` while the background controller process is running.
* **`Status`**: Human-readable driver status (`Running`, `Stopped`, `Launching...`).
