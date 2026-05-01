# ObsEvent

This operator listens to events from an OBS WebSocket connection.

## Inputs

- **obsConnection**: The connection object from an `ObsConnect` operator.

## Outputs

- **Event Type**: The name of the event (e.g., `SceneItemEnableStateChanged`).
- **Event Data**: The data payload associated with the event.
- **Received**: A trigger that fires whenever a new event is received.
