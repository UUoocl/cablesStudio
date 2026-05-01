# OBS WebSocket Standalone Patch

This patch provides a robust set of operators for controlling OBS Studio via the WebSocket v5 protocol within the Cables GL Electron environment. It enables real-time scene management, source control, and event monitoring.

## Included Operators

- **[ObsLaunch](ops/Ops.Local.ObsLaunch/Ops.Local.ObsLaunch.md)**: Launches OBS Studio with appropriate command-line arguments for remote debugging and WebSocket access.
- **[ObsConnect](ops/Ops.Local.ObsConnect/Ops.Local.ObsConnect.md)**: Establishes a connection to the OBS WebSocket server. Features:
    - Embedded `obs-websocket-js` library.
    - **Connection Naming**: Label instances for easy multi-connection management.
    - **Granular Subscriptions**: Choose exactly which events to receive, including high-volume data like volume meters and transform changes.
- **[ObsEvent](ops/Ops.Local.ObsEvent/Ops.Local.ObsEvent.md)**: Listen for specific events from OBS (e.g., scene changes, input active/inactive, transitions).
- **[ObsRequest](ops/Ops.Local.ObsRequest/Ops.Local.ObsRequest.md)**: Send single commands to OBS (e.g., `SetCurrentProgramScene`).
- **[ObsBatchRequest](ops/Ops.Local.ObsBatchRequest/Ops.Local.ObsBatchRequest.md)**: Group multiple requests into a single batch sent at a controlled frequency (Hz) to optimize performance and prevent network congestion.

## Setup

1. **Enable WebSocket in OBS**: Go to **Tools -> WebSocket Server Settings**. Ensure the server is enabled and note the port and password.
2. **Launch OBS**: Use **ObsLaunch** or start OBS manually.
3. **Connect**: Use **ObsConnect** with your IP, port, and password. For multiple connections (e.g., one for events and one for requests), give each a unique **Connection Name**.
4. **Subscribe**: Toggle the required **Subscriptions** in the ObsConnect op. By default, standard events are enabled. High-volume events (like Volume Meters) must be explicitly enabled.

## Example Usage

### Monitoring Events
Connect an **ObsEvent** op to an **ObsConnect** op to see incoming event types and data. Use this to trigger animations or state changes in Cables when something happens in OBS.

### Batching Updates
To update multiple scene items or filters at once smoothly, use **ObsBatchRequest**. Set the **Request Rate (Hz)** to something like `30` for smooth, performant updates.

## Protocol Documentation
For a full list of available requests and events, refer to the [OBS WebSocket v5 Protocol Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md).

---

*AI Disclaimer: This project and its documentation were developed with the assistance of AI tools to ensure compatibility and implement best practices within the Cables GL Electron environment.*
