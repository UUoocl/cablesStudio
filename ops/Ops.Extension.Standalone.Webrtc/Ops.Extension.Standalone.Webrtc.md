# Standalone WebRTC Peer-to-Peer Connection (Generic)

This operator establishes a peer-to-peer WebRTC connection between two local/networked machines using raw Session Description Protocol (SDP) strings. Instead of relying on a filesystem directory or dedicated signaling server, it exposes the raw SDP strings directly. This allows you to perform the initial signaling handshake via manual copy-paste, or automate it by routing SDP strings over any transport (such as SMB file sharing, Swift/native integrations, WebSocket pub-sub, or even QR codes) using cables.gl patching logic.

## Features:
- **Generic Signaling**: Zero dependencies on Node.js file system APIs. Exposes raw SDP inputs/outputs, allowing deployment on standard browser patches.
- **Vanilla ICE Strategy**: Gathers all local ICE candidates into a single, complete SDP description before generating the final string. This avoids Trickle ICE candidate synchronization issues, making copy-paste connections simple and reliable.
- **Media Streaming Support**: Optional input ports to accept canvas elements (to stream WebGL/render textures) and audio MediaStreams.
- **Video Encoding Selection**: Supports prioritizing H.264, VP9, and HEVC codecs.
- **Track Capability Inspector**: Built-in inspector booleans indicating whether the processed connection string config includes active audio, video, or data streams.
- **Bi-directional Data Channel**: Sends and receives character payloads (JSON, text messages, trigger coordinates) between peers.

---

## Handshake Walkthrough

A WebRTC handshake involves exchanging an **Offer** (from the Initiator) and an **Answer** (from the Receiver).

### Step 1: Generate the Offer (Initiator)
1. On the **Initiator** machine, trigger the **Create Offer** button.
2. The operator will create the peer connection, initialize the data channel, process any connected media tracks (canvas/audio), and begin gathering ICE candidates.
3. When ICE gathering finishes, the **Channel Status** changes to `Connecting`, the **Local SDP Output** is updated with the JSON offer, and the **On SDP Generated** trigger fires.
4. Copy the JSON string from **Local SDP Output** and send it to the Receiver.

### Step 2: Process the Offer and Generate the Answer (Receiver)
1. On the **Receiver** machine, paste the Initiator's offer string into the **Remote SDP Input** port.
2. Trigger the **Set Remote SDP** button.
3. The operator parses the offer, configures the remote description, attaches any local media tracks (canvas/audio), and creates an automated Answer.
4. When ICE gathering finishes on the Receiver, their **Local SDP Output** updates with the JSON answer, and **On SDP Generated** fires.
5. Copy the Receiver's JSON string from **Local SDP Output** and send it back to the Initiator.

### Step 3: Complete the Handshake (Initiator)
1. On the **Initiator** machine, paste the Receiver's answer string into the **Remote SDP Input** port.
2. Trigger the **Set Remote SDP** button.
3. The peer connection completes. **Channel Status** changes to `Open`.

---

## Webcam & Video Streaming Setup

To stream video from a webcam and render it on the remote machine:

1. **Sender Side (WebCam to WebRTC)**:
   - Patch a **WebCamTexture** op to grab your webcam frames.
   - Route the texture output of **WebCamTexture** to a drawing op (e.g. **DrawTexture**).
   - Place this rendering inside a **RenderTarget** operator.
   - Feed the **RenderTarget**'s `canvas` element output object into the **Target Canvas Object** input of this WebRTC operator.
   - When the connection is established, the WebRTC operator captures the canvas frame buffer dynamically.

2. **Receiver Side (WebRTC to Render)**:
   - Connect the **Remote Video Element** output of this WebRTC operator directly to the video element input of a **VideoTexture** operator.
   - The **VideoTexture** op converts the HTML video element frames into a WebGL texture.
   - Connect this texture to any shader or drawing material to render the remote feed in your scene.

---

## Port Guide

### 📥 Inputs
- **Create Offer** (Trigger): Initiates the peer connection, data channel, and gathers ICE candidates to generate a local SDP Offer.
- **Remote SDP Input** (String): Paste the remote peer's JSON SDP (Offer or Answer) or raw SDP text here.
- **Set Remote SDP** (Trigger): Executes the handshake logic by parsing the Remote SDP Input. If it's an Offer, generates an Answer. If it's an Answer, completes the connection.
- **Send Data** (Trigger): Sends the payload in `Data to Send` over the open data channel.
- **Data to Send** (String): The text/JSON payload to transmit.
- **Target Canvas Object** (Object): *Optional.* Connect a canvas reference (e.g. from `RenderTarget`). If provided, captures and streams the WebGL visual frames (`m=video`).
- **Target Audio Stream** (Object): *Optional.* Connect a Web Audio API `MediaStream` reference. If active, streams audio frames (`m=audio`).
- **Video Encoding** (Dropdown): Select the video encoding / codec preferences for WebRTC connection: `H.264`, `VP9`, or `HEVC`. Prioritizes the chosen codec in WebRTC transceiver preferences.

### 📤 Outputs
- **Local SDP Output** (String): Exposes the generated local SDP profile (JSON description).
- **On SDP Generated** (Trigger): Fires when the local SDP has finished compiling.
- **Channel Status** (String): Connection state (`Disconnected`, `Connecting`, `Open`, `Closed`).
- **On Data Received** (Trigger): Fires when a message payload is received from the peer.
- **Received Data** (String): Displays the raw message string delivered by the peer.
- **Has Audio** (Boolean): True if the connection config contains an active audio track.
- **Has Video** (Boolean): True if the connection config contains an active video track.
- **Has Data** (Boolean): True if the connection config contains an active data channel protocol.
- **Remote Video Element** (Object): Exposes an HTML `<video>` element playing the incoming remote stream. Connect to a **VideoTexture** operator to render.
- **Remote Audio Stream** (Object): Exposes the raw incoming remote `MediaStream` containing audio tracks for audio playback or custom node routing.
