# ObsCall

This Op allows you to send any request to a connected OBS Studio instance via the OBS WebSocket protocol. It requires an active connection from an `ObsConnect` Op.

## Inputs

- **obsConnection**: The connection object from an `ObsConnect` Op.
- **Request Type**: The name of the OBS WebSocket request (e.g., `SetCurrentProgramScene`, `GetInputList`, `SetInputSettings`).
- **Request Data**: An object containing the parameters for the request.
- **Call**: Trigger button to execute the request.

## Outputs

- **Success**: Boolean indicating if the request was successful.
- **Response**: The data returned by OBS in response to the request.
- **Error**: Error message if the request failed.

## Usage Examples

### Switching a Scene
1. Set **Request Type** to `SetCurrentProgramScene`.
2. Set **Request Data** to `{"sceneName": "MyScene"}`.
3. Trigger **Call**.

### Refreshing a Browser Source
1. Set **Request Type** to `PressInputPropertiesButton`.
2. Set **Request Data** to `{"inputName": "my-browser", "propertyName": "refreshnocache"}`.
3. Trigger **Call**.

## Documentation
For a full list of available requests and their parameters, refer to the [OBS WebSocket Protocol Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#requests).
