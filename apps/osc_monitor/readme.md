# OSC Monitor SC

A real-time OSC (Open Sound Control) monitoring and control application built for the Cables Studio environment. This app uses **SocketCluster** to receive and send messages in a format compatible with Cables.gl SocketCluster extensions.

## Usage

The application is a standalone HTML file that connects to the local SocketCluster server (typically running on port 8000).

### Monitoring and Sending on Channels
To see OSC messages flowing through a specific SocketCluster channel and send to another:
- Open `osc_monitor_sc.html` in your browser.
- Append `?inChannel=YOUR_INPUT_CHANNEL&outChannel=YOUR_OUTPUT_CHANNEL` to the URL.
- **Example:** `osc_monitor_sc.html?inChannel=osc_recv&outChannel=myProject`
- The status bar will show "Connected" when the SocketCluster link is active.
- The app subscribes to `YOUR_INPUT_CHANNEL/objects` for monitoring.
- The app publishes to `YOUR_OUTPUT_CHANNEL/objects` when interacting with UI controls.

### Features
- **Live Logging:** Real-time display of messages including Topic, Address, and Arguments.
- **Cables.gl Compatibility:** Listens for and sends data in the standard format used by Cables.gl SC extensions.
- **Remote Control Demo:** A "Toggle OSC" button that sends an OSC-style payload to the output channel.

## Developer Overview

### Technical Stack
- **Library:** `socketcluster-client` (v16+)
- **Transport:** WebSockets (via SocketCluster protocol)
- **Styling:** Vanilla CSS (VS Code dark theme inspired)

### SocketCluster Communication
The app follows the pattern used by `Ops.Extension.SocketCluster.SocketClusterClient`:

- **Subscription:** Subscribes to `${inChannel}/objects`.
- **Message Format:** Expects objects with the following structure:
  ```json
  {
    "topic": "string",
    "clientId": "string",
    "payload": {
      "address": "string",
      "args": []
    }
  }
  ```

### Remote Control Logic
The "Toggle OSC" button publishes to `${outChannel}/objects` using the standard format:
```javascript
socket.transmitPublish(`${outChannel}/objects`, {
    topic: 'osc_send',
    clientId: socket.clientId,
    payload: {
        address: '/4/toggle1',
        args: [1] // or 0
    }
});
```

## Integration with Cables.gl
1. Add a **SocketClusterClient** op to your Cables patch and set its **Channel** to `myProject`.
2. Use **SocketClusterReceiveObject** to listen for messages with topic `osc_send`.
3. Use **SocketClusterSendObject** to send messages to this monitor by setting the topic to `osc` (or any other) and providing a payload with `address` and `args` fields.
