# WebSocket External Popup Bridge

This op establishes a connection to any local or remote WebSocket server (such as `ws://127.0.0.1:8080`, `ws://localhost:3000`, or secure `wss://` endpoints) using an external popup window.

Because Cables patches often run inside HTTPS or sandboxed iframe environments where browser security policies (such as mixed-content rules, private network access restrictions, or iframe sandbox limitations) block direct connections to insecure `ws://localhost` or `ws://127.0.0.1` servers, this op spawns a clean popup window to establish the connection and relays all messages bidirectionally via `BroadcastChannel`.

## Features

* **Custom URL**: Connect to any WebSocket URL (`ws://` or `wss://`) including custom ports and query strings.
* **Bidirectional Relay**: Seamlessly send and receive strings and JSON objects.
* **Auto-Reconnect**: Automatically reconnects with configurable retry intervals upon unexpected disconnection.
* **Visual Bridge Window**: Includes a dark-mode diagnostic interface displaying connection state, traffic metrics (sent/received counts), interactive test message sender, and live color-coded event logs.

## Parameters

### Connection

* **WebSocket URL**: The target WebSocket server URL (e.g. `ws://127.0.0.1:8080` or `ws://localhost:3000`).
* **Protocols**: Optional sub-protocols string (e.g. `soap, wamp` or leave blank).
* **Broadcast Channel Name**: The name of the `BroadcastChannel` used to communicate with the popup window (default: `ws-external-bridge`).
* **Auto Connect**: If enabled, the op will automatically attempt to open the popup and connect when the patch loads. Note that browsers may block popups opened without user interaction.
* **Auto Reconnect**: When enabled, the popup window will automatically attempt to reconnect if the connection drops.
* **Reconnect Interval (ms)**: Delay in milliseconds between reconnection attempts (default: `3000`).
* **Open Popup**: Button to open the popup bridge window.
* **Close Popup**: Button to close the popup window.
* **Connect**: Trigger to connect or reconnect to the WebSocket server.
* **Disconnect**: Trigger to cleanly disconnect from the WebSocket server.

### Send Message

* **Send**: Trigger button to transmit the message.
* **Message Data**: Object or Array to send when transmitting structured JSON.
* **Message Text**: String to send when transmitting raw text.
* **Format**: Selector determining payload format:
  * `Auto`: Transmits **Message Data** if provided; otherwise transmits **Message Text**.
  * `Text / String`: Transmits **Message Text** as a raw string.
  * `JSON / Object`: Serializes **Message Data** to JSON before transmission.

## Outputs

* **Popup Open**: `true` if the popup bridge window is currently open.
* **Connected**: `true` when the WebSocket connection is active (`readyState === 1`).
* **Connecting**: `true` while the WebSocket is in the process of establishing a connection (`readyState === 0`).
* **On Message Received**: Trigger fired every time a message is received from the WebSocket server.
* **Received Text**: The raw string content of the latest received message.
* **Received JSON**: The parsed JSON object (if the message was valid JSON, otherwise `null`).
* **On Open**: Trigger fired when the WebSocket connection successfully opens.
* **On Close**: Trigger fired when the WebSocket connection closes.
* **On Error**: Trigger fired when a WebSocket error occurs.
* **Close Code**: The numeric close status code returned by the server (e.g., `1000` for normal closure).
* **Close Reason**: The text explanation string provided by the server upon closure.
* **Error**: Error message string if an error occurs.
