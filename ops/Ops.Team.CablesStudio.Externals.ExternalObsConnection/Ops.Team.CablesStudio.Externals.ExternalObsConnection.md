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
* **Send Request**: Trigger to dispatch the API request defined in **Request Data**. Updating **Request Data** will also automatically trigger the request.
* **Request Rate (Hz)**: Rate-limiting and batching frequency. When set to `0` (default), requests execute immediately. When greater than `0`, requests sent within the rate window (`1000 / Rate` ms) are automatically bundled into a single batch request to OBS.
* **Request Data**: An Object or Array containing the request payload.

## Single Request Examples

**Canonical object:**
```json
{
  "requestType": "GetSceneList",
  "requestData": {}
}
```

**Flat parameters object:**
```json
{
  "requestType": "SetCurrentProgramScene",
  "sceneName": "Main Scene"
}
```

## Batch Request Examples

### 1. Direct Batch Array
Pass an Array of requests to **Request Data**:
```json
[
  { "requestType": "SetCurrentProgramScene", "requestData": { "sceneName": "Main Scene" } },
  { "requestType": "GetInputVolume", "requestData": { "inputName": "Mic" } }
]
```

### 2. Automated Request Batching
When **Request Rate (Hz)** is greater than `0` (e.g. `10 Hz`), any sequential single requests dispatched within the interval window are automatically compiled into a bundled `RequestBatch` and executed in a single WebSocket tick, reducing network traffic and preventing race conditions. When the batch response arrives, each request triggers **On Response** with its respective result.

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
