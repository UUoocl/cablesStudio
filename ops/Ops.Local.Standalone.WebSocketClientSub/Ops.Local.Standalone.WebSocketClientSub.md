# Ops.Local.Standalone.WebSocketClientSub

Subscribes to a channel/topic on a WebSocket server from a client Cables patch.

## Overview
Connects to `Ops.Local.Standalone.WebSocketClient`. When connected, automatically registers the channel subscription on the server and listens for incoming messages.

## Features
- **Automatic Subscription Management**: Subscribes upon connection and handles channel changes automatically.
- **JSON Decoding**: Parses incoming JSON payloads into JavaScript objects.
- **Wildcard Support**: Subscribe to `*` to receive messages from all channels.
