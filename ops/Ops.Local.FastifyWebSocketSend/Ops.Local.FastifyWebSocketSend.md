# Ops.Local.FastifyWebSocketSend

Broadcasts WebSocket messages to all clients connected to a local Fastify server.

## Usage

This Op requires a `Server Instance` object from the `Ops.Local.Fastify` Op.

When `Send Message` is triggered, the Op will format the message using the provided `Channel Name` and `Message To Send` payload, and broadcast it to all open WebSocket connections on the server.

- **Channel Name**: The topic or channel for the message (defaults to "broadcast").
- **Message To Send**: The data payload to send. Can be a string, number, or object.

## Output Ports

- **Message Sent**: Triggered after the message has been successfully broadcast to all connected clients.
- **Error**: Outputs any errors encountered while trying to send the message.
