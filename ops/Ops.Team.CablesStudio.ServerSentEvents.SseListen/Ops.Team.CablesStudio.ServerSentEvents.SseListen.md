# SSE Listen

This operator connects to a Server-Sent Events (SSE) stream, allowing a Cables patch to listen for real-time messages.

It provides automatic URL assembly by appending the Event Name to the base URL, handles connections, and automatically attempts to parse incoming JSON payloads.

## Features:
- **Natively Integrated**: Built around the browser's standard `EventSource` API.
- **Dynamic Endpoint Assembly**: Automatically appends the Event Name to the target URL when enabled.
- **Convenient Parsed Outputs**: Exposes both the raw string payload and a parsed JSON object.
- **Auto Reconnect**: Automatically reconnects when any configuration ports change.

## Usage:
1. **URL**: Input the base URL of your SSE server (e.g. `http://localhost:8080/sse`).
2. **Event Name**: Input the name of the event you wish to listen for.
3. **Append Event to URL**:
   - If enabled (default), the final connection URL is resolved as `<URL>/<Event Name>` (e.g. `http://localhost:8080/sse/my-topic`).
   - If disabled, it connects directly to `<URL>`.
4. **Data Handling**:
   - When a message is received, `Received` fires.
   - `Data String` contains the raw text payload.
   - `Data Object` contains the parsed JSON representation (if the payload is valid JSON).
