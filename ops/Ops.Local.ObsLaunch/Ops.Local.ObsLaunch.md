# ObsLaunch

This Op launches OBS Studio with specific command-line arguments to enable remote control and debugging. It is designed for use in the Cables standalone environment (Electron).

## Inputs

- **App Name**: The name of the OBS application (e.g., "OBS" on macOS, "obs64.exe" on Windows).
- **App Path**: The directory where OBS is installed (primarily used on Windows to resolve DLL dependencies).
- **Collection**: The name of the Scene Collection to load on launch.
- **Debug Port**: The port for remote debugging (default: 9222). This enables browser-based remote control of OBS.
- **WSS Port**: The port for the OBS WebSocket server (default: 4455).
- **WSS Password**: The password for the OBS WebSocket server.
- **Launch OBS**: Trigger button to execute the launch command.

## Outputs

- **Success**: Boolean indicating if the command was successfully sent.
- **Error**: Error message if the launch failed.

## Platform Specifics

### macOS
Uses `open -n -a` to launch a new instance of OBS. Arguments are passed via `--args`.

### Windows
Changes the current directory to the OBS executable path before launching to ensure all DLLs are correctly loaded. Uses `cd /d` followed by the launch command.

## Requirements
- This Op requires the **Cables Standalone** version as it uses Node.js `child_process` via `op.require`.
- OBS Studio must be installed on the system.
