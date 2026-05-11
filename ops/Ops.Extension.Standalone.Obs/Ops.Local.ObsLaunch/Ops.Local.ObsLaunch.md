# ObsLaunch

Launches OBS Studio with command-line arguments to enable remote control.

## Parameters

- **App Name**: The name or path of the OBS executable.
- **App Path**: (Windows only) The directory containing the OBS executable.
- **Collection**: The name of the scene collection to load.
- **Debug Port**: The remote debugging port.
- **WSS Port**: The WebSocket port to force OBS to use.
- **WSS Password**: The WebSocket password to force OBS to use.
- **Launch OBS**: Trigger to start the application.

## Outputs

- **Success**: Boolean indicating if the process started successfully.
- **Error**: String containing error messages if launching fails.
