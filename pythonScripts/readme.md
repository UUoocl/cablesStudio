# Python Monitoring Scripts

These scripts provide low-level system monitoring and hardware control for the CablesStudio ecosystem. They are designed to run as background processes, managed by the `Ops.Local.PythonScript` Op in Cables, and communicate in real-time using **SocketCluster**.

## Prerequisites

Ensure you have Python 3 installed. You must install the following dependencies:

```bash
pip install pynput socketclusterclient
```

## Scripts

### 1. Keyboard Monitor (`keyboard_monitor.py`)
Listens for global keyboard press and release events using `pynput`.

*   **Usage**: `python keyboard_monitor.py [websocket_url]`
*   **Default URL**: `ws://127.0.0.1:8000/socketcluster/`
*   **Emitted Events**:
    *   `keyboardPress`: Data includes `combo`, `key`, `modifiers`, and `event`.
    *   `keyboardRelease`: Data includes `combo`, `key`, `modifiers`, and `event`.

### 2. Mouse Monitor (`mouse_monitor.py`)
Listens for global mouse movement, clicks, and scroll events.

*   **Usage**: `python mouse_monitor.py [websocket_url] [pos:0|1] [clicks:0|1] [scroll:0|1]`
*   **Default URL**: `ws://127.0.0.1:8000/socketcluster/`
*   **Arguments**:
    *   `pos`: Track mouse position (default: 1).
    *   `clicks`: Track mouse clicks (default: 1).
    *   `scroll`: Track mouse scroll (default: 1).
*   **Emitted Events**:
    *   `mousePosition`: `{ "x": int, "y": int }` (Sent at ~20Hz).
    *   `mouseClick`: `{ "button": str, "x": int, "y": int, "pressed": bool }`.
    *   `mouseScroll`: `{ "x": int, "y": int, "dx": int, "dy": int }`.

### 3. UVC Utility Bridge (`uvc_util_bridge.py`)
A bridge to the native `libuvcutil.dylib` library for controlling UVC camera settings (focus, exposure, etc.).

*   **Usage**: `python uvc_util_bridge.py --url [websocket_url] --lib [path_to_dylib]`
*   **Communication**:
    *   **Subscribes to**: `uvcCommands` channel for incoming instructions.
    *   **Emits**: `uvcResponse` with status updates or command results.
*   **Actions Supported**: `list_devices`, `select_device`, `get_controls`, `get_value`, `set_value`.

---

## Developer Overview

### Architecture
These scripts act as **SocketCluster clients**. Instead of creating a direct TCP connection to Cables, they connect to a SocketCluster server (often hosted locally by the Cables application). This allows for:
- **Pub/Sub**: Multiple Ops in Cables can subscribe to the same mouse/keyboard events.
- **Bi-directional Communication**: The `uvc_util_bridge` can receive commands from Cables while simultaneously reporting status.

### Performance
- **Unbuffered Output**: When launched via the `PythonScript` Op, `PYTHONUNBUFFERED=1` is set to ensure `stdout` logs appear in Cables immediately.
- **Throttling**: The Mouse Monitor throttles position updates to 20Hz (every 50ms) to prevent saturating the WebSocket with high-frequency movement data.

### Lifecycle Management
The scripts are designed to be managed by the `Ops.Local.PythonScript` Op. When the Op is deactivated or deleted in Cables, it sends a termination signal to the Python process, which performs a clean shutdown.
