# Ops.Local.WsPubSub

The **WsPubSub** operator serves as a native, lightweight, SocketCluster-compatible WebSocket server and pub/sub message hub inside Cables. It manages client connections, tracks channel subscriptions, forwards messages between clients, and delegates asynchronous RPC (Request/Response) cycles directly to Cables dataflow.

---

## Description

This operator integrates the `@slides_studio/slide-studio-app` (originally designed for a standalone SocketCluster server) directly into the Cables GL Electron context. By listening to HTTP `upgrade` events on a shared server, it intercepts and manages connections to the `/websocket/` path, eliminating the need for external server processes.

It is designed to be **100% generic and modular**. It contains no hardcoded references or connections to OBS. Instead, all RPC methods and event broadcasts are routed using generic ports, allowing Cables patch designers to wire arbitrary backend handlers (like `ObsRequest` or `ObsEvent`).

---

## Ports

### Inputs
- **Server Instance** (Object): The shared Node.js HTTP server instance (e.g. from `Ops.Extension.Standalone.HttpFileServer` or `Ops.Local.Fastify`).
- **Channel** (String): A channel name to publish a message to from within Cables.
- **Message Data** (Object): The message payload to publish from within Cables.
- **Publish** (Trigger): Trigger button to broadcast the message to the channel.
- **Response Data** (Object): The result payload to send back to a specific client RPC call.
- **Send Response** (Trigger): Trigger button to dispatch the response.

### Outputs
- **On Message Received** (Trigger): Fires whenever a client publishes a message.
- **Received Channel** (String): The channel name of the received message.
- **Received Data** (Object): The payload of the received message.
- **Active Clients** (Number): The total number of currently connected WebSocket clients.
- **On Request** (Trigger): Fires whenever a client makes a method request.
- **Request Data** (Object): The incoming request payload containing the `requestId`, `requestType`, and `requestData`.

---

## Request/Response Asynchronous Correlation

Because WebSocket communication is inherently asynchronous, the **`Response Data`** and **`Send Response`** ports are designed to uniquely map replies back to the specific client that initiated the query:

1. **Client Dispatches a Call**: A client initiates a call (e.g. `await socket.invoke('obsRequest', payload)`). The protocol tags this query with a unique `requestId`.
2. **Server Stores Transaction State**: `WsPubSub` registers this active request ID and pairs it with the caller's connection. It then formats the request and outputs it via the **`Request Data`** port, triggering **`On Request`**.
3. **Cables Resolves the Action**: The Cables patch receives this data, forwards it to an execution block (like `ObsRequest`), and receives the result.
4. **Cables Responds**: Cables forwards the result to the **`Response Data`** input, carrying the original `requestId`:
   ```json
   {
       "requestId": "abc-123",
       "requestStatus": { "result": true },
       "responseData": { ...actual response payload... }
   }
   ```
5. **Targeted WebSocket Delivery**: When **`Send Response`** is triggered, `WsPubSub` parses the `requestId`, pulls the target client connection from its active registry, and forwards the response back *only* to them. This ensures their Promise resolves successfully without broadcasting it to other clients.

---

## Setup & Wiring (e.g., OBS Integration)

To connect the generic `WsPubSub` operator to handle OBS requests and events:

1. Connect `ObsConnection`'s **`obsConnection`** output to `ObsEvent`'s **`obsConnection`** input.
2. Wire `ObsEvent`'s **`Event Type`** and **`Event Data`** into an object-building operator to compile:
   ```json
   { "eventName": eventType, "eventData": eventData }
   ```
3. Connect the output of the object builder to `WsPubSub`'s **`Message Data`** input.
4. Set `WsPubSub`'s **`Channel`** input to `"obsEvents"`.
5. Connect `ObsEvent`'s **`Received`** trigger output to `WsPubSub`'s **`Publish`** trigger input.

This completes the real-time event pipeline entirely inside your Cables visual patch!
