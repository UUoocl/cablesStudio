# 8BitDo Lite SE Xbox Controller Standalone Python Operator

This standalone Cables operator interfaces directly with the **8BitDo Lite SE 2.4G Wireless Controller for Xbox** (USB Vendor ID: `0x2dc8`, Product ID: `0x2008`) via a background Python subprocess sidecar.

It allows you to read button presses, analog joysticks, and analog triggers in real time, and dynamically trigger haptic rumble feedback on any of the four motors.

## Key Features

- **Zero WebSockets Overhead**: Communicates using high-speed standard I/O (stdin/stdout) JSON lines.
- **Dynamic Rumble Control**: Control the body motors (left/right) and trigger motors (left/right impulse triggers) independently.
- **Automatic Disconnect/Reconnect**: Seamlessly handles USB plugging and unplugging events.

## Prerequisites

Before utilizing this operator under Electron, ensure the following dependencies are installed:

### 1. Install `libusb` (OS level)
On macOS, `libusb` is required for Python's `pyusb` to communicate with the USB interface:
```bash
brew install libusb
```

### 2. Install `pyusb` (Python level)
Ensure `pyusb` is installed in the specific python environment that Cables is configured to use:
```bash
pip install pyusb
```

> [!IMPORTANT]
> **Claiming USB Interface 0**:
> Xbox controllers communicate over raw GIP/HID. Only one application can open the device at a time. Make sure to close Google Chrome or any other application using WebUSB/HID before activating this operator.

## Port Layout

### Inputs
- **Active** (Boolean): Starts or stops the background Python bridge daemon.
- **Rumble Left** (Number, 0.0 - 1.0): Vibrates the left heavy body motor.
- **Rumble Right** (Number, 0.0 - 1.0): Vibrates the right light body motor.
- **Rumble Left Trigger** (Number, 0.0 - 1.0): Vibrates the left impulse trigger motor.
- **Rumble Right Trigger** (Number, 0.0 - 1.0): Vibrates the right impulse trigger motor.
- **Trigger Rumble** (Trigger): Instantly writes the current rumble settings to the controller.
- **Send Rumble on Change** (Boolean): If enabled, automatically updates vibration values whenever any rumble input value changes.

### Outputs
- **On Event** (Trigger): Fires whenever new controller data (axis motion, button press/release) is received.
- **Is Connected** (Boolean): Indicates whether the controller has been found and claimed.
- **Status** (String): Status representation (e.g. "Disconnected", "Searching...", "Connected", "Error: ...").
- **Buttons Pressed** (Object): List of all currently held button names (e.g. `["A", "LB", "Dpad Up"]`).
- **LS X** / **LS Y** (Number, -1.0 to 1.0): Left joystick axes.
- **RS X** / **RS Y** (Number, -1.0 to 1.0): Right joystick axes.
- **LT** / **RT** (Number, 0.0 to 1.0): Left and right trigger analog depths.
- **Individual Buttons** (Booleans): True if held (A, B, X, Y, Dpad directions, bumpers, stick clicks, Menu, View, Guide, Share).
