# MIDI Monitor SC

A real-time MIDI monitoring and control application built for the Cables Studio environment. This app uses **SocketCluster** to receive and send MIDI-related messages in a format compatible with Cables.gl SocketCluster extensions.

## Usage

The application is a standalone HTML file that connects to the local SocketCluster server (typically running on port 8000).

### Monitoring and Sending on Channels
To see MIDI messages flowing through a specific SocketCluster channel and send to another:
- Open `midi_monitor_sc.html` in your browser.
- Append `?inChannel=YOUR_INPUT_CHANNEL&outChannel=YOUR_OUTPUT_CHANNEL` to the URL.
- **Example:** `midi_monitor_sc.html?inChannel=midi_recv&outChannel=myProject`
- The status bar will show "Connected" when the SocketCluster link is active.
- The app subscribes to `YOUR_INPUT_CHANNEL/objects` for monitoring.
- The app publishes to `YOUR_OUTPUT_CHANNEL/objects` with the topic `midi_send` when interacting with the test buttons.

### Features
- **Live Logging:** Real-time display of MIDI messages including Type (Note On/Off, CC), Channel, Note, Velocity, and Controller values.
- **Cables.gl Compatibility:** Listens for and sends data in the standard object format `{ topic, clientId, payload }` used by Cables.gl SC extensions.
- **Remote Control Test:** Buttons to send sample MIDI Note On, Note Off, and Control Change messages to the output channel.

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
      "type": "noteon" | "noteoff" | "controlchange",
      "channel": number,
      "note": number (optional),
      "velocity": number (optional),
      "controller": number (optional),
      "value": number (optional)
    }
  }
  ```

### Sending MIDI
The test buttons publish to `${outChannel}/objects` using the topic `midi_send`:
```javascript
socket.transmitPublish(`${outChannel}/objects`, {
    topic: 'midi_send',
    clientId: socket.clientId,
    payload: {
        type: 'noteon',
        note: 60,
        velocity: 0.8,
        channel: 1
    }
});
```

## Integration with Cables.gl
1. Add a **SocketClusterClient** op to your Cables patch and set its **Channel** to your project name.
2. Use **SocketClusterReceiveObject** to listen for messages with the topic `midi_send`.
3. Use **SocketClusterSendObject** to send MIDI data from your patch to this monitor by setting the topic appropriately and providing a payload with MIDI fields (`type`, `channel`, etc.).
