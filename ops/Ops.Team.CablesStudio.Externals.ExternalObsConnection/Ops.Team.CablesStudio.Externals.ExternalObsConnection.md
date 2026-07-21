# External OBS Connection Bridge

This op establishes a connection to OBS Studio via a WebSocket v5 protocol using an external popup window. 

Since Cables patches often run inside iframe contexts or sandboxed pages that prevent direct connection to local websocket ports (like `127.0.0.1:4455`) due to security restrictions, this op bypasses those limits by opening a same-origin top-level popup window and communicating via a `BroadcastChannel`.

## Parameters

* **Host / URL**: The IP address or hostname of the OBS WebSocket server (e.g. `127.0.0.1` or `localhost`).
* **Port**: The port number of the OBS WebSocket server (default is `4455`).
* **Password**: The password defined in your OBS WebSocket settings.
* **Broadcast Channel Name**: The name of the channel used to relay messages between Cables and the popup (default: `obs-external-bridge`).
* **Auto Connect**: If enabled, the op will automatically attempt to spawn the popup window and connect on load. Note: Browsers may block popups opened without user interaction.
* **Open Popup**: Button to trigger opening the popup.
* **Close Popup**: Button to close the popup.
* **Send Request**: Trigger to dispatch the API request defined in the ports below.
* **Request Name**: The request name/method (e.g., `GetVersion`, `SetCurrentProgramScene`). Set to `RequestBatch` or leave blank when triggering a batch request.
* **Request Data**: An Object or Array containing parameters for the request.

## Single Request Example

To retrieve the scene list, configure:
* **Request Name**: `GetSceneList`
* **Request Data**: `{}` (empty object)

## Batch Request Example

To dispatch multiple operations concurrently in a single batch, pass an Array of requests to **Request Data** and set **Request Name** to `"RequestBatch"` (or empty):
```json
[
  { "requestType": "SetCurrentProgramScene", "requestData": { "sceneName": "Main Scene" } },
  { "requestType": "GetVolume", "requestData": { "sourceName": "Mic" } }
]
```

## Outputs

* **Popup Open**: Boolean value indicating whether the popup window is currently active.
* **Connected**: Boolean value showing connection status to the local OBS WebSocket server.
* **Response Success**: True if the last API request completed successfully.
* **Response Data**: Returns the response payload from OBS (either an object or an array of batch results).
* **On Response**: Triggers when a request response returns from the server.
* **Request Type**: The request type/name of the completed request.
* **Request Status Result**: True if the request status result was successful, false if it failed.
* **Event Name**: Emitted event name from OBS (e.g. `CurrentProgramSceneChanged`).
* **Event Data**: Emitted event payload.
* **On Event**: Triggers when any subscribed event is broadcast by OBS.
* **Error**: Contains the error message if the connection or request fails.
