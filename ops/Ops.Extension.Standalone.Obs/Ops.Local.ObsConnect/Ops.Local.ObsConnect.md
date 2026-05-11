# ObsConnect

Connects to an OBS Studio instance using the WebSocket v5 protocol.

## Parameters

- **IP**: The IP address or hostname of the OBS machine (default: `localhost`).
- **Port**: The WebSocket port configured in OBS (default: `4455`).
- **Password**: The WebSocket password (if enabled in OBS).
- **Connect**: Trigger to establish the connection.
- **Disconnect**: Trigger to close the connection.

## Outputs

- **Connected**: Boolean indicating if the connection is active.
- **Obs event**: Outputs all OBS events as objects with `eventType` and `eventData`.
- **Error**: String containing error messages if the connection fails.
