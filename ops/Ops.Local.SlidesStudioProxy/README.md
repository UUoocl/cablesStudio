# Ops.Local.SlidesStudioProxy

The **SlidesStudioProxy** operator serves as a centralized communication bridge between the **Slides Studio** web application and **OBS Studio**. It handles WebSocket message routing, request/response cycles for OBS commands, and real-time broadcasting of events.

## Description
This operator is designed to work in tandem with the **Ops.Local.Fastify** and **Ops.Local.ObsConnect** operators. It replaces the legacy SocketCluster-based proxy with a native Cables-integrated implementation.

## Ports

### Inputs
- **Server Instance** (Object): The Fastify server instance from the `Ops.Local.Fastify` operator.
- **On WS Message** (Trigger): Connect to the `On WS Message` output of the `Ops.Local.Fastify` operator.
- **WS Message Data** (Object): Connect to the `WS Message Data` output of the `Ops.Local.Fastify` operator.
- **OBS Connection** (Object): The active OBS connection from `Ops.Local.ObsConnect`.
- **On OBS Event** (Trigger): Connect to the `Received` output of an `Ops.Local.ObsEvent` operator.
- **OBS Event Type** (String): Connect to the `Event Type` output of an `Ops.Local.ObsEvent` operator.
- **OBS Event Data** (Object): Connect to the `Event Data` output of an `Ops.Local.ObsEvent` operator.

### Outputs
- **On Proxy Error** (Trigger): Fires when a message processing error occurs.
- **Error Message** (String): Contains details of the last error encountered.

## Setup
1. Place an **Ops.Local.Fastify** operator and set its root directory to `slides_studio/slide-studio-app`.
2. Place an **Ops.Local.ObsConnect** operator and configure your OBS credentials.
3. Place this **Ops.Local.SlidesStudioProxy** operator.
4. Wire the `Server Instance`, `WS Message` trigger, and `WS Message Data` from the Fastify op to this proxy.
5. Wire the `OBS Connection` from the OBS op to this proxy.
6. (Optional) Use an **Ops.Local.ObsEvent** (set to `__anyEvent`) and wire its outputs to this proxy to enable real-time OBS event broadcasting to all connected slides views.

## Protocols
The proxy uses a JSON-based protocol over WebSockets:

### Call (Request/Response)
Used for OBS commands and state checks.
```json
{
  "type": "call",
  "id": "unique_request_id",
  "method": "obsRequest",
  "data": {
    "requestType": "GetVersion",
    "requestData": {}
  }
}
```

### Publish (Broadcasting)
Used for cross-client synchronization (e.g., slide changes, choreography updates).
```json
{
  "type": "publish",
  "channel": "slides_navigation",
  "data": { "indexh": 1, "indexv": 0 }
}
```

### Event (Incoming from Proxy)
Used for broadcasting events to clients.
```json
{
  "type": "event",
  "channel": "obsEvents",
  "data": {
    "eventName": "CurrentProgramSceneChanged",
    "eventData": { "sceneName": "Main Scene" }
  }
}
```

## Functions
- **OBS Command Routing**: Automatically routes `obsRequest` calls to the connected OBS instance and returns the response to the *specific* requesting client.
- **Subscription Tracking**: Maintains a list of client subscriptions to minimize unnecessary broadcast traffic.
- **Centralized Synchronization**: Forwards `publish` messages to all other connected clients, ensuring the Speaker View and OBS Browser Source stay in sync.
- **OBS Event Bridge**: Translates native OBS events into the Slides Studio event format and broadcasts them to the `obsEvents` channel.
