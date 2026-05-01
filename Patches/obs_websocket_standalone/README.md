# OBS WebSocket Standalone Patch

This patch provides operators for controlling OBS Studio via the WebSocket v5 protocol in a standalone Cables Electron environment.

## Included Operators

- **ObsLaunch**: Launches OBS Studio with appropriate command-line arguments for remote debugging and WebSocket access.
- **ObsConnect**: Establishes a connection to the OBS WebSocket server. Features an embedded `obs-websocket-js` library for maximum compatibility and an event output port for real-time feedback.
- **ObsRequest**: Composes and sends arbitrary requests to OBS (e.g., `SetCurrentProgramScene`, `GetInputVolume`, etc.).

## Setup

1. Ensure OBS Studio is installed.
2. Enable WebSocket in OBS Studio: **Tools -> WebSocket Server Settings**.
3. Use **ObsLaunch** to start OBS with the required flags, or ensure your manual OBS instance is running with the correct port and password.
4. Use **ObsConnect** with the corresponding port and password.
5. Send requests using **ObsRequest**.

## Example Request: Changing a Scene

To change the current program scene in OBS, use the **ObsRequest** operator with the following configuration:

- **Request Type**: `SetCurrentProgramScene`
- **Request Data**: 
  ```json
  {
    "sceneName": "YourSceneName"
  }
  ```

### Protocol Documentation
For a full list of available requests and events, refer to the [OBS WebSocket v5 Protocol Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md).

---

*AI Disclaimer: This project and its documentation were developed with the assistance of AI tools to ensure compatibility and implement best practices within the Cables GL Electron environment.*
