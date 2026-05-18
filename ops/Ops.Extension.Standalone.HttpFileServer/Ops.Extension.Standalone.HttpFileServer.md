# Standalone Http File Server

This operator implements a high-performance, lightweight HTTP server for cables standalone (Electron) environments.
It supports serving static files, a generic API routing system, and integrated Server-Sent Events (SSE).

Root directory defaults to the current patch directory.

Features:
- **Integrated SSE**: Built-in support for Server-Sent Events at the `/sse` endpoint.
- **Generic API Routing**: Any request starting with `/api/` triggers the `On HTTP Request` port. POST requests have their JSON bodies automatically parsed.
- **Optimized for Local Performance**: Configured with `noDelay: true` (disables Nagle's algorithm) and `keepAlive: true` for minimum latency.
- **Fastify Aligned**: Output ports and signals (Started, Stopped, Ready, Request) match the standard `Ops.Local.Fastify` pattern.
- **Start / Stop Buttons**: Manually control the server state.
- **Auto Start**: Option to automatically start the server immediately on patch load.
- **Detailed Outputs**: Exposes HTTP URL, Request Data, and Response Data for every request.
- **Error Handling**: Error messages are piped to the `Error` output port.
- **Health Check**: Built-in `/health` endpoint for readiness verification.

SSE Usage:
- Clients connect to `http://<hostname>:<port>/sse` or any sub-path starting with `/sse/` (e.g., `/sse/my-topic`).
- The server dynamically creates routes based on the connection path.
- The broadcast logic uses a unified JSON structure: `{"route": "...", "eventName": "...", "data": "..."}`.
- Use the **SSE Route**, **SSE Event Name**, and **SSE Data** ports to configure the payload, then trigger **Broadcast SSE**.
- The operator will only broadcast to clients connected to the exact route specified in the **SSE Route** port.

API Usage:
- Requests to `http://<hostname>:<port>/api/*` are intercepted and triggered on the **On HTTP Request** port.
- For POST requests, the parsed JSON body is available in the **HTTP Request Data** object.
- If no other operator ends the response within 100ms, the server sends a default `200 OK` response.

Supports MIME types for:
- HTML, CSS, JS (Module)
- WASM
- Images (PNG, JPG, SVG, WebP, GIF)
- Video (MP4, WebM, OGG)
- Audio (MP3, WAV, OGG)
