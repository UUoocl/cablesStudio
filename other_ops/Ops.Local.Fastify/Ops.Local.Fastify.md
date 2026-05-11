# Ops.Local.Fastify

Creates a local Fastify server that can serve static files, handle HTTP requests, and manage WebSocket connections. This Op is designed to be used in standalone cables.gl environments.

## Setup

The Fastify server requires a `Port` and a `Root Directory`. When `Start Server` is triggered, the server will bind to `127.0.0.1` on the specified port.

- The `Root Directory` is used to serve static files. 
- Only incoming HTTP requests on routes starting with `/callback/` will trigger the `On HTTP Request` port, outputting the URL and request data. Other requests are ignored and fallback to serving static files or returning 404.
- Incoming WebSocket messages on the `/ws` route will trigger the `On WS Message` port.

## Output Ports

- **Server Started**: Triggered when the server successfully starts.
- **Server Stopped**: Triggered when the server is stopped.
- **On HTTP Request**: Triggered when a new HTTP request is received.
- **HTTP URL**: The URL of the incoming HTTP request.
- **HTTP Request Data**: The raw Fastify request object.
- **HTTP Response Data**: The raw Fastify reply object.
- **On WS Message**: Triggered when a WebSocket message is received.
- **WS Message Data**: The parsed WebSocket message, along with socket and request metadata.
- **Server Instance**: The Fastify server instance object. Pass this to `Ops.Local.FastifyWebSocketSend` to broadcast messages.
- **Error**: Outputs any errors encountered during startup or runtime.
- **Is Running**: Boolean indicating whether the server is currently active.
