# Ops.Local.Standalone.WebSocketClientPub

Publishes messages to a specific channel/topic from a client Cables patch.

## Overview
Connects to `Ops.Local.Standalone.WebSocketClient` and publishes structured data envelopes to the WebSocket server broker.

## Features
- **Channel Publishing**: Send messages to a dedicated channel (e.g. `joystickData`, `cursorPos`).
- **Broadcast Flags**: Supports `Send to All Clients` and `Send to All Channels`.
- **Target Unicast**: Direct messages to specific client IDs.
