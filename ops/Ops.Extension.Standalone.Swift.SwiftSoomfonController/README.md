# Swift Soomfon Stream Controller SE Standalone Swift Operators

A collection of native Cables GL operators designed for the standalone (Electron) environment to interface directly with the **Soomfon Stream Controller SE** (a rebranded Ajazz AKP03 clone) using compiled macOS Swift binaries communicating via local WebSockets.

---

## Key Advantages Over Python Operators

*   **Zero External Dependencies**: Unlike the Python version, there is **no need** to install Homebrew, Python, `libusb`, `hidapi`, `Pillow`, or git packages. The sidecar relies entirely on Apple's native, built-in `IOHIDManager` and `CoreGraphics` frameworks.
*   **Instant Startup & Low Latency**: Native compilation means instant process spawning and rapid processing.
*   **Automatic Wake Cycle**: Built-in support for the Soomfon's double-open/close wake cycle reset, preventing interface locks.
*   **Native Image Operations**: Crop slicing, WebGL Y-flipping adjustments, and physical 270-degree rotation (90 CCW display correction) are performed directly using macOS hardware-accelerated `CoreGraphics` and `ImageIO`.

---

## Included Operators

1.  **`SwiftSoomfonController`**: Spawns the pre-compiled Swift sidecar binary, manages private WebSocket connections on a dynamic port (`port: 0`), and monitors button and encoder knob event reports.
2.  **`SwiftSoomfonKeyTexture`**: Captures a Cables WebGL texture, resizes and flips it to 60x60, and updates a specific key's LCD.
3.  **`SwiftSoomfonStretchedTexture`**: Tiles/slices a large WebGL texture (180x120 pixels) across the 3x2 screen matrix.

---

## Detailed Installation & Setup

### Step 1: Close Conflicting Software
Any official StreamDock / Soomfon companion application locks the USB HID interface exclusively.
*   **You must close/quit the official companion software** before starting the Cables connection.

### Step 2: Configure the Operators in Cables

1.  Place the **`Ops.Extension.Standalone.Swift.SwiftSoomfonController`** operator in your patch.
2.  Toggle **`Active`** to `true`.
    *   The JS operator starts a private local WebSocket server on a dynamic port.
    *   It automatically spawns the compiled Swift sidecar binary, passing the dynamic port.
    *   The sidecar connects as a client, discovers the USB HID controller, and activates it.
    *   Its status updates to `Connected` and outputs details under `Device Info`.
3.  Connect the `Connection` output port of `SwiftSoomfonController` to the `Connection` input port of either `SwiftSoomfonKeyTexture` or `SwiftSoomfonStretchedTexture`.
4.  Attach a trigger to `Render` (to run every frame) and feed your WebGL `Texture` to display it on the key screens!

---

## Inside the Swift Sidecar Codebase

The Swift sidecar consists of three key components compiled via Swift Package Manager:

*   [`main.swift`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/source/main.swift): Manages CLI argument parsing, manages the loopback WebSocket client connection using Apple's native `URLSessionWebSocketTask`, decodes base64-encoded image payloads, and routes JSON commands.
*   [`SoomfonMonitor.swift`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/source/SoomfonMonitor.swift): Matches Ajazz AKP03E (`VID: 0x0300`, `PID: 0x3002`) and Soomfon (`VID: 0x1500`, `PID: 0x3001`) on Vendor Specific Usage Page `0xFFA0` asynchronously. Translates raw USB reports into knob turns/clicks and button press events.
*   [`SoomfonDevice.swift`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/source/SoomfonDevice.swift): Handles the exclusive USB HID communication. Sends the init packets (`DIS`, `LIG`, `CLE`, `STP`), writes JPEG slices via 1025-byte USB report chunks (featuring header announcement, payload looping, and flushing packets), and handles the critical wake/reconnect timing sequence.

---

## Troubleshooting & Common Errors

### Error: `No Soomfon devices connected.`
*   **Cause**: The sidecar scanned for matching HID devices but found none.
*   **Resolution**: 
    1. Check that the USB cable is connected directly to your Mac.
    2. Confirm the official companion software is fully quit.

### Error: `Exited (Code X)` or `Spawn Failed`
*   **Cause**: The Electron app was unable to spawn the Swift binary, or the binary crashed.
*   **Resolution**: The operator automatically sets execute permissions (`chmod +x`) on startup. If it fails, open a terminal and run:
    ```bash
    chmod +x ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/swift_bin/SwiftSoomfonController
    ```
