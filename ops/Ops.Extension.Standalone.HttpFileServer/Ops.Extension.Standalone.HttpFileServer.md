# Standalone Http File Server

This operator implements a lightweight HTTP server for cables standalone (Electron) environments.
It supports serving static files, a health check route, and integrated Server-Sent Events (SSE).

Root directory defaults to the current patch directory.

Features:
- **Integrated SSE**: Built-in support for Server-Sent Events at the `/events` endpoint.
- **Fastify Aligned**: Output ports and signals (Started, Stopped, Ready, Request) match the `Ops.Local.Fastify` pattern.
- **Start / Stop Buttons**: Manually control the server state.
- **Auto Start**: Option to automatically start the server with a 500ms delay.
- **Detailed Outputs**: Exposes HTTP URL, Request Data, and Response Data for every request.
- **Error Handling**: Error messages are piped to the `Error` output port.
- **Health Check**: Built-in `/health` endpoint for readiness verification.

SSE Usage:
- Clients connect to `http://<hostname>:<port>/events`.
- Use the `SSE Event Name`, `SSE Data`, and `Broadcast SSE` ports to push updates.

Example Client:
You can find an example client in the operator folder: [example_sse.html](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.HttpFileServer/example_sse.html)
To use it, copy it to your patch directory and navigate to `http://127.0.0.1:8080/example_sse.html`.

Supports MIME types for:
- HTML, CSS, JS (Module)
- WASM
- Images (PNG, JPG, SVG, WebP, GIF)
- Video (MP4, WebM, OGG)
- Audio (MP3, WAV, OGG)
