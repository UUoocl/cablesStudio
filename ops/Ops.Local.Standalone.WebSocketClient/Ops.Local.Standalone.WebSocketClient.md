# Ops.Local.Standalone.WebSocketClient

Connects a Cables patch as a client to a WebSocket server broker (such as `Ops.Local.Standalone.HttpFileServer` or any remote WebSocket server).

## Overview
Provides a full-featured client connection manager that supports auto-reconnection, heartbeat/keepalive handling, and state synchronization with `WebSocketClientSub` and `WebSocketClientPub` ops.

## Features
- **Auto-Reconnection**: Automatically detects connection loss and reconnects with configurable backoff.
- **Automatic Subscription Sync**: Restores all active channel subscriptions immediately upon reconnecting.
- **Universal Compatibility**: Runs both inside Cables Standalone and in browser-based Cables patches.


>Three new client-side operations have been created to allow any Cables patch (running in another Standalone instance or in a web browser) to connect to the >WebSocket server, manage channel subscriptions, and exchange messages:

---

### 1. New Client Operations

| Operation | Purpose |
| :--- | :--- |
| **[`Ops.Local.Standalone.WebSocketClient`](file:///Users/jonwood/Github_local_dev/cables_standalone_for_mac/patch/ops/Ops.Local.Standalone.WebSocketClient/Ops.Local.Standalone.WebSocketClient.js)** | Establishes and manages the WebSocket connection to `ws://localhost:8080` (or remote IP) with automatic reconnect and state sync. |
| **[`Ops.Local.Standalone.WebSocketClientSub`](file:///Users/jonwood/Github_local_dev/cables_standalone_for_mac/patch/ops/Ops.Local.Standalone.WebSocketClientSub/Ops.Local.Standalone.WebSocketClientSub.js)** | Subscribes to a specific channel/topic (or `*` for all), handles incoming messages, and automatically resubscribes upon reconnecting. |
| **[`Ops.Local.Standalone.WebSocketClientPub`](file:///Users/jonwood/Github_local_dev/cables_standalone_for_mac/patch/ops/Ops.Local.Standalone.WebSocketClientPub/Ops.Local.Standalone.WebSocketClientPub.js)** | Publishes data payloads to specific channels, specific client IDs, or broadcasts to all clients/channels. |

---

### 2. How to Use in a Client Cables Patch

```
[ Ops.Local.Standalone.WebSocketClient ] (URL: ws://localhost:8080)
   │
   ├─► [Client Connection] ──► [ Ops.Local.Standalone.WebSocketClientSub ] (Channel: "sensors")
   │                               └─► [On Message] ──► [Data] ──► (Your patch logic)
   │
   └─► [Client Connection] ──► [ Ops.Local.Standalone.WebSocketClientPub ] (Channel: "controls")
                                  ├─► [Data] (Object / Value)
                                  └─► [Publish] (Trigger)
```

---

### 3. Key Features

1. **Automatic Subscription Lifecycle**: When you change the `Channel` port in `WebSocketClientSub`, it automatically sends `unsubscribe` for the old channel and `subscribe` for the new channel.
2. **Auto-Reconnect with Subscription Recovery**: If the connection drops or the server restarts, `WebSocketClient` automatically reconnects and re-establishes all active channel subscriptions seamlessly.
3. **Cross-Compatible**: Works inside Cables Standalone for Mac, in separate Electron instances, or inside standard browser-based Cables exports without needing native Node dependencies.
4. **Interchangeability**: [`Ops.Local.Standalone.WebSocketSub`](file:///Users/jonwood/Github_local_dev/cables_standalone_for_mac/patch/ops/Ops.Local.Standalone.WebSocketSub/Ops.Local.Standalone.WebSocketSub.js) and [`Ops.Local.Standalone.WebSocketPub`](file:///Users/jonwood/Github_local_dev/cables_standalone_for_mac/patch/ops/Ops.Local.Standalone.WebSocketPub/Ops.Local.Standalone.WebSocketPub.js) have also been updated so their connection inputs accept both `Server Instance` and `Client Connection` objects.