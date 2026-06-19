# Native Swift 8BitDo Xbox Controller Standalone Operator

This standalone Cables operator interfaces natively with the **8BitDo Lite SE 2.4G Wireless Controller for Xbox** (USB Vendor ID: `0x2dc8`, Product ID: `0x2008`) via a compiled Swift/Objective-C sidecar process.

Unlike the Python-based version, this operator communicates directly with macOS's native **IOKit USB stack**, providing a compiled high-performance binary with **zero external dependencies** (no Python, no `pyusb`, and no `libusb` installation needed).

## Key Features

- **Zero External Dependencies**: Runs out of the box on modern Macs (Intel and Apple Silicon).
- **Native Hotplugging**: Automatically detects when the controller receiver is plugged or unplugged and recovers communication.
- **Dynamic Rumble Control**: Control the body motors (left/right) and trigger motors (left/right impulse triggers) independently.
- **Private WebSockets**: Integrates with standard Cables Swift-operator communication conventions over a private WebSocket connection.

## Compilation (Optional)

A precompiled binary is included in the `swift_bin/` folder. If you wish to rebuild the binary from source, run:

```bash
swift build -c release
mkdir -p swift_bin
cp .build/release/Swift8BitDoXbox swift_bin/
```

> [!IMPORTANT]
> **Claiming USB Interface 0**:
> Because the controller communicates over raw USB, only one application can claim the interface at a time. Close Google Chrome or any other application using WebUSB before activating this operator.

## Port Layout

### Inputs
- **Active** (Boolean): Starts or stops the background Swift bridge process.
- **Rumble Left** (Number, 0.0 - 1.0): Vibrates the left heavy body motor.
- **Rumble Right** (Number, 0.0 - 1.0): Vibrates the right light body motor.
- **Rumble Left Trigger** (Number, 0.0 - 1.0): Vibrates the left impulse trigger motor.
- **Rumble Right Trigger** (Number, 0.0 - 1.0): Vibrates the right impulse trigger motor.
- **Trigger Rumble** (Trigger): Instantly writes the current rumble settings to the controller.
- **Send Rumble on Change** (Boolean): If enabled, automatically updates vibration values whenever any rumble input value changes.

### Outputs
- **On Event** (Trigger): Fires whenever new controller data (axis motion, button press/release) is received.
- **Is Connected** (Boolean): Indicates whether the controller has been found and claimed.
- **Status** (String): Status representation (e.g. "Disconnected", "Searching...", "Connected: ...").
- **Buttons Pressed** (Object): List of all currently held button names (e.g. `["A", "LB", "Dpad Up"]`).
- **LS X** / **LS Y** (Number, -1.0 to 1.0): Left joystick axes.
- **RS X** / **RS Y** (Number, -1.0 to 1.0): Right joystick axes.
- **LT** / **RT** (Number, 0.0 to 1.0): Left and right trigger analog depths.
- **Individual Buttons** (Booleans): True if held (A, B, X, Y, Dpad directions, bumpers, stick clicks, Menu, View, Guide, Share).
