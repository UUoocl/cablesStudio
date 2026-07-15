# Generic WebRTC Peer-to-Peer Connection

This operator establishes a peer-to-peer WebRTC connection between two local or networked machines inside cables.gl using raw Session Description Protocol (SDP) strings.

Signaling is completely decoupled from any specific transport. You can perform the initial handshake manually by copy-pasting the generated SDP strings, or automate it by routing SDP strings over any transport (such as SMB file sharing, Swift/native desktop apps, WebSockets, or QR codes) using standard cables.gl patching logic.

---

## Port Guide

### 📥 Input Ports (Left Side)
*   **Create Offer** (Trigger): *Initiator Only.* Initializes the connection, creates the data channel, attaches any local media tracks, and compiles the local SDP Offer.
*   **Remote SDP Input** (String): Paste the remote counterpart's JSON SDP string or raw SDP text here.
*   **Set Remote SDP** (Trigger): Processes the SDP in `Remote SDP Input`. If it's an Offer, generates an Answer. If it's an Answer, completes the connection.
*   **Send Data** (Trigger): Instantly transmits the string payload in `Data to Send` over the open P2P data channel.
*   **Data to Send** (String): The text or JSON payload to transmit.
*   **Target Canvas Object** (Object): *Optional.* Connect a canvas reference (e.g. from `RenderTarget`). Captures the WebGL visual frame stream (`m=video`).
*   **Target Audio Stream** (Object): *Optional.* Connect a Web Audio API `MediaStream` reference to append audio (`m=audio`).
*   **Video Encoding** (Dropdown): Select the video encoding / codec preferences for WebRTC connection: `H.264 no alpha`, `VP9 with alpha`, or `HEVC with Alpha`. Prioritizes the chosen codec in WebRTC transceiver preferences.

### 📤 Output Ports (Right Side)
*   **Local SDP Output** (String): Exposes the generated local SDP profile (JSON description).
*   **On SDP Generated** (Trigger): Fires when the local SDP has finished compiling.
*   **Channel Status** (String): Displays the connection status: `Disconnected`, `Connecting`, `Open`, or `Closed`.
*   **On Data Received** (Trigger): Fires on every incoming data packet.
*   **Received Data** (String): Displays the raw message string delivered by the peer.
*   **Has Audio** (Boolean): True if the connection config includes active audio segments.
*   **Has Video** (Boolean): True if the connection config includes active video tracks.
*   **Has Data** (Boolean): True if the connection config includes an active data channel.
*   **Remote Video Element** (Object): Exposes an HTML `<video>` element playing the incoming remote stream.
*   **Remote Audio Stream** (Object): Exposes the raw incoming remote `MediaStream` containing audio tracks.

---

## Connection Setup Walkthrough

To establish a P2P connection between an **Initiator** (Sender) and a **Receiver** (Viewer):

### Step 1: Generate the Offer (Initiator)
1. On the **Initiator** machine, trigger the **Create Offer** button on the operator.
2. If you are sending video, make sure a **RenderTarget**'s canvas is connected to the **Target Canvas Object** input.
3. Once ICE candidate gathering completes, the **Local SDP Output** will fill with the JSON offer, and the **On SDP Generated** trigger will fire.
4. Copy the JSON string from **Local SDP Output** and send it to the Receiver (e.g. via chat, file transfer, or copy-paste).

### Step 2: Set Offer & Generate Answer (Receiver)
1. On the **Receiver** machine, paste the Initiator's JSON offer into the **Remote SDP Input** port.
2. Trigger the **Set Remote SDP** button.
3. The operator sets the remote description, attaches any local media tracks, and generates an Answer.
4. Once ICE candidate gathering completes, the Receiver's **Local SDP Output** will update with the JSON answer, and **On SDP Generated** will fire.
5. Copy the JSON string from the Receiver's **Local SDP Output** and send it back to the Initiator.

### Step 3: Complete Handshake (Initiator)
1. On the **Initiator** machine, paste the Receiver's JSON answer into the **Remote SDP Input** port.
2. Trigger the **Set Remote SDP** button.
3. The connection will establish, and the **Channel Status** on both ends will change to `Open`.

---

## Rendering Received Video & Audio (As implemented in webRTC_receiver.cables)

When a peer-to-peer connection is opened and video/audio is being transmitted, the receiver patch handles the incoming media elements as follows:

### 1. Rendering Remote Video
In webRTC_receiver.cables, the incoming remote video stream is rendered onto the main canvas:
*   The **Remote Video Element** output port of the WebRTC operator is patched into the `Canvas` input port of a CanvasToTexture operator
*   This operator binds the HTML `<video>` element playing the incoming stream to a WebGL texture.
*   The resulting texture is then routed to a FullSCreenRectangle operator linked to the main **Canvas/Render** engine . This draws the remote video feed directly onto the screen.

### 2. Rendering Remote Audio
For incoming audio tracks:
*   The **Remote Audio Stream** output port of the WebRTC operator exposes the raw HTML5 `MediaStream` containing the audio tracks.
*   By default, the operator plays the stream. However, you can route the `MediaStream` object into standard Web Audio API operators in cables.gl (e.g. an Audio Context destination or an analyzer node) for spatialization, volume controls, or frequency analysis.

---

## Appendix: Secure Automated SMB Signaling

If you choose to write custom cables.gl patching logic to automate the SDP exchange via a shared directory (like an SMB folder), you should secure that folder to prevent unauthorized network access.

### Step 1: Configure a Dedicated Bridge
1. Connect the two Macs directly using a certified Thunderbolt or Ethernet cable.
2. Open **System Settings > Network** on both Macs.
3. Go to TCP/IP settings for **Thunderbolt Bridge** (or LAN) and set **Configure IPv4** to **Manually**.
4. Set static IP addresses on a separate private subnet:
   * **Mac A (Host):** IP Address: `10.0.1.1` | Subnet Mask: `255.255.255.0`
   * **Mac B (Client):** IP Address: `10.0.1.2` | Subnet Mask: `255.255.255.0`
5. Leave the router fields blank and click Apply.

### Step 2: Configure macOS File Sharing
1. On the Host Mac (Mac A), navigate to **System Settings > General > Sharing**.
2. Enable **File Sharing** and configure your shared directory folder permissions.

### Step 3: Restrict SMB Traffic to the Bridge
To block local Wi-Fi or Ethernet devices from accessing the host share, configure the macOS packet filter (`pf`) firewall to only accept incoming SMB connections on the Thunderbolt bridge (`bridge0`).

1. Create a firewall anchor rule file `/etc/pf.anchors/com.local.smbblock`:
   ```text
   # Block incoming SMB traffic by default
   block in proto tcp from any to any port 445

   # Allow incoming SMB traffic ONLY on the Thunderbolt Bridge interface
   pass in on bridge0 proto tcp from any to any port 445
   ```
2. Enable and test the anchor configuration:
   ```bash
   sudo pfctl -a com.local.smbblock -f /etc/pf.anchors/com.local.smbblock
   sudo pfctl -e
   ```
3. Connect from the client Mac using the dedicated bridge IP: `smb://10.0.1.1`.