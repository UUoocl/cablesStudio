# Ops.Local.Standalone.ExternalWebSocketClient

A popup window bridge WebSocket client that allows a Cables patch running in a Chrome browser (e.g. `cables.gl`) to connect directly to an Electron Standalone WebSocket server (such as `Ops.Extension.Standalone.HttpFileServer` or any local/remote WebSocket broker).

---

## Overview

When editing or running patches in a web browser on `https://cables.gl`, connecting directly to a local WebSocket server (like `ws://127.0.0.1:8080`) can face browser security or lifecycle constraints. `Ops.Local.Standalone.ExternalWebSocketClient` solves this by opening a dedicated popup window bridge that manages the native browser WebSocket connection and communicates with your main Cables patch in real-time via `BroadcastChannel`.

It exports a standard `Client Connection` object (`outConnection`), making it completely interchangeable with [`Ops.Local.Standalone.WebSocketClient`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Standalone.WebSocketClient/Ops.Local.Standalone.WebSocketClient.js) for downstream subscription and publishing ops.

---

## Features

- **Chrome Browser to Electron Standalone Bridge**: Easily connect from web browser `cables.gl` to your local Electron Standalone patch running `HttpFileServer`.
- **Full Pub/Sub Channel Compatibility**: Seamlessly links with [`Ops.Local.Standalone.WebSocketClientSub`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Standalone.WebSocketClientSub/Ops.Local.Standalone.WebSocketClientSub.js) and [`Ops.Local.Standalone.WebSocketClientPub`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Local.Standalone.WebSocketClientPub/Ops.Local.Standalone.WebSocketClientPub.js).
- **Auto-Reconnection & Subscription Recovery**: Automatically reconnects if the Electron app restarts and restores all active channel subscriptions.
- **Dedicated Diagnostics Popup UI**: Includes a dark-themed live monitor showing:
  - Target URL & BroadcastChannel status
  - Active channel subscriptions list
  - Real-time Rx / Tx packet counters
  - Color-coded packet log (`IN`, `OUT`, `SUB`, `PUB`, `SYS`, `ERR`)
  - Interactive test publishing bar for live debugging
- **Direct Send Convenience Ports**: Built-in `Send Channel`, `Send Data`, `Send Text`, and `Send` trigger ports for quick testing without requiring additional pub ops.

---

## Patch Workflow Example

```
[ Ops.Local.Standalone.ExternalWebSocketClient ] (URL: ws://127.0.0.1:8080)
   │
   ├─► [Client Connection] ──► [ Ops.Local.Standalone.WebSocketClientSub ] (Channel: "sensors")
   │                               └─► [On Message] ──► [Data] ──► (Your patch logic)
   │
   └─► [Client Connection] ──► [ Ops.Local.Standalone.WebSocketClientPub ] (Channel: "controls")
                                  ├─► [Data] (Object / Value)
                                  └─► [Publish] (Trigger)
```

---

## Ports Reference

### Inputs
- **`URL`**: Target WebSocket server URL (e.g. `ws://127.0.0.1:8080`).
- **`Protocols`**: Optional subprotocols (comma-separated).
- **`Broadcast Channel Name`**: Name of the internal BroadcastChannel bridge.
- **`Active`**: Enable or disable the connection.
- **`Auto Open Popup`**: Automatically opens the popup window on load.
- **`Auto Reconnect`**: Automatically reconnects if connection is dropped.
- **`Reconnect Interval`**: Time in seconds between reconnect attempts.
- **`Open Popup` / `Close Popup`**: Manual popup window controls.
- **`Connect` / `Disconnect`**: Manual WebSocket connection triggers.
- **`Send Channel` / `Send Data` / `Send Text` / `Send`**: Direct publishing ports.

### Outputs
- **`Client Connection`**: Object reference passed to `WebSocketClientSub`, `WebSocketClientPub`, `WebSocketSub`, or `WebSocketPub`.
- **`Popup Open`**: True when popup bridge window is active.
- **`Connected`**: True when WebSocket connection to server is open.
- **`Connecting`**: True when connection attempt is in progress.
- **`On Connected` / `On Disconnected`**: Connection lifecycle event triggers.
- **`On Message`**: Fires on any incoming message from the server.
- **`Received Data`**: Parsed JSON or data object of the latest message.
- **`Raw Message`**: Unparsed raw string.
- **`Status`**: Current status string (`connected`, `connecting`, `disconnected`, `popup open`, `popup closed`, `error`).
- **`Error`**: Error message string if a connection error occurs.
