---
dg-publish: true
title: Connecting Cables to OBS Studio
tags:
  - cables
  - obs-studio
  - live-streaming
  - websockets
  - interactive-graphics
---
If you love building interactive visuals in [Cables.gl](https://cables.gl), you already know the thrill of generative graphics, audio reactivity, and real-time WebGL canvas shaders. But when you want to bring those visuals into live broadcasting—or turn your visual patch into a stream deck that commands your live broadcast—you quickly hit a snag: **browser sandbox restrictions**.

Because Cables patches often run within an `<iframe>` or under strict browser origin sandboxing, establishing direct local WebSocket connections to `127.0.0.1:4455` can trigger security blocks or CORS issues. 

Enter **`Ops.Team.CablesStudio.Externals.ExternalObsConnection`**: an op that establishes a reliable, bidirectional link between your Cables patch and **OBS Studio** using a dedicated top-level popup bridge and the native browser `BroadcastChannel` API.

Here is a friendly, step-by-step introduction to how it works and how to set it up in your own patches!

---

### What is ExternalObsConnection?

`ExternalObsConnection` is a specialized op designed to connect Cables directly to **OBS Studio via WebSocket v5**. 

Instead of fighting sandbox and mixed-content limitations inside the Cables canvas frame, the op launches a sleek external popup bridge. That popup lives as a top-level window, connects directly to OBS Studio over local WebSocket (`ws://127.0.0.1:4455`), and mirrors commands and broadcast events back and forth using the high-performance browser `BroadcastChannel` API.

#### Why Use It?

- **Zero Sandbox Headaches:** Bypasses iframe restrictions cleanly without requiring custom browser flags or insecure workarounds.
- **Full OBS WebSocket v5 Power:** Control scenes, toggle sources, adjust audio filters, trigger transitions, start/stop streams, and query status.
- **Smart Request Handling:** Supports canonical OBS payload formats, flat convenience objects, and multi-command batch arrays.
- **Automated Rate-Limiting & Batching:** Set a throttling rate (`Request Rate (Hz)`) to automatically bundle rapid slider or fader events into a single WebSocket `RequestBatch`, preventing socket congestion and race conditions.
- **Live Bidirectional Events:** Listen for real-time OBS state changes (e.g. `CurrentProgramSceneChanged`, `InputMuteStateChanged`) and feed them directly into your Cables animations.
- **Built-in Visual Diagnostic Bridge:** The popup window displays real-time connection status badges, host addresses, and live event/request logs so you always know what is happening under the hood.

---

### How the Pieces Fit Together

Here is a look at the data flow between Cables, your browser, and OBS Studio:

```
┌────────────────────────────────────────────────────────┐
│                      Your Browser                      │
│                                                        │
│  ┌────────────────────────┐                            │
│  │   Cables.gl Patch      │                            │
│  │   (Inside Iframe)      │                            │
│  │                        │                            │
│  │  ExternalObsConnection │                            │
│  └───────────┬────────────┘                            │
│              │                                         │
│              │ BroadcastChannel                        │
│              │ ("obs-external-bridge")                 │
│              ▼                                         │
│  ┌────────────────────────┐      Local WebSocket       │
│  │  Popup Bridge Window   │ ◄────────────────────────► │
│  │  (Top-Level Context)   │   ws://127.0.0.1:4455      │
│  └────────────────────────┘                            │
└────────────────────────────────────────┼───────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │    OBS Studio     │
                               │  (WebSocket v5)   │
                               │  - Scenes         │
                               │  - Audio Mixer    │
                               │  - Transitions    │
                               └───────────────────┘
```

---

### Step-by-Step Setup Guide

#### Step 1: Enable the WebSocket Server in OBS Studio

Before touching Cables, ensure OBS Studio is ready to accept WebSocket connections:

1. Open **OBS Studio** (v28 or newer, which includes WebSocket v5 natively).
2. Go to **Tools** > **WebSocket Server Settings**.
3. Check **Enable WebSocket server**.
4. Check or configure the **Server Port** (default is `4455`).
5. (Optional but recommended) Enable authentication and enter a **Server Password**.
6. Click **Apply** and **OK**.

---

#### Step 2: Add the Op to Your Cables Patch

1. In the Cables editor, press `Escape` or double-click to open the Op selector.
2. Search for and place:
   ```
   Ops.Team.CablesStudio.Externals.ExternalObsConnection
   ```
3. Set your connection parameters in the op inspector:
   - **Host / URL**: `127.0.0.1` (or your OBS machine's IP address)
   - **Port**: `4455`
   - **Password**: Enter the password set in OBS (leave blank if authentication is disabled)
   - **Broadcast Channel Name**: Keep as `obs-external-bridge` (or give it a unique name if running multiple patches)

---

#### Step 3: Open the Popup Bridge

Click the **Open Popup** button in the op inspector (or trigger it with an op like `Button` or `Once`).

> **Tip on Popups:** Browsers will typically block popups that open automatically on page load. Triggering **Open Popup** via a user interaction (like clicking a button in your patch) ensures your browser permits the popup window without warnings.

Once opened, the popup bridge window will open with a dark diagnostic interface. It connects to OBS and displays a glowing green **Connected** badge, confirming that Cables and OBS are linked.

---

### Sending Commands to OBS

The **Request Data** input accepts clean JSON objects. Updating **Request Data** automatically sends the request, or you can trigger **Send Request** manually.

#### 1. Canonical OBS Request
You can pass the standard OBS WebSocket v5 structure:

```json
{
  "requestType": "GetSceneList",
  "requestData": {}
}
```

#### 2. Convenient Flat Parameters
For quick setup, you can place parameters directly at the top level without nesting `requestData`:

```json
{
  "requestType": "SetCurrentProgramScene",
  "sceneName": "Camera 1"
}
```

#### 3. Direct Batch Requests
Want to execute multiple operations at once? Pass an array into **Request Data**:

```json
[
  {
    "requestType": "SetCurrentProgramScene",
    "requestData": { "sceneName": "Main Presentation" }
  },
  {
    "requestType": "SetInputMute",
    "requestData": { "inputName": "Microphone", "inputMuted": false }
  }
]
```

---

### Automatic Rate Limiting & Throttling

When binding Cables UI sliders, MIDI faders, or mouse coordinates to OBS properties (like volume or filter settings), you might produce dozens or hundreds of events every second. Firing individual network requests at high frequency can overwhelm the WebSocket connection.

`ExternalObsConnection` includes an intelligent batching system:

- Set **Request Rate (Hz)** to a non-zero value (e.g. `10 Hz` or `20 Hz`).
- Any requests triggered within that time window (`1000 / Rate` ms) are automatically bundled into a single OBS WebSocket `RequestBatch`.
- When OBS returns the batch results, the op automatically demultiplexes the response and triggers **On Response** sequentially for each transaction.

---

### Reacting to Live OBS Events

Communication isn't just one-way! When you switch scenes or adjust volume in OBS, `ExternalObsConnection` captures those events in real time.

1. Connect the **On Event** output trigger to your patch logic.
2. Read **Event Name** (e.g., `CurrentProgramSceneChanged`, `InputMuteStateChanged`, or `RecordStateChanged`).
3. Inspect **Event Data** to extract payloads such as the active scene name or volume levels.
4. Use subscriptions in the op inspector (e.g., **Sub Scenes**, **Sub Inputs**, **Sub Volume Meters**) to toggle which event categories you want to receive.

---

### Summary of Ports

| Port Name | Direction | Description |
| :--- | :--- | :--- |
| **Host / URL** | Input | IP or hostname of the OBS WebSocket server (default: `127.0.0.1`). |
| **Port** | Input | Port number of the server (default: `4455`). |
| **Password** | Input | WebSocket authentication password. |
| **Open / Close Popup** | Input | Buttons to open or dismiss the external bridge window. |
| **Request Rate (Hz)** | Input | Automated batching frequency (`0` = immediate execution). |
| **Request Data** | Input | Payload object or array describing the OBS command. |
| **Connected** | Output | Boolean indicating if the bridge is currently connected to OBS. |
| **On Response** | Output | Triggered whenever a command returns its response. |
| **Response Data** | Output | The response payload returned by OBS. |
| **On Event** | Output | Triggered when OBS broadcasts an event. |
| **Event Name** | Output | Name of the emitted event (e.g., `CurrentProgramSceneChanged`). |
| **Error** | Output | String containing error messages if a connection or request fails. |

---

### Wrapping Up

With `ExternalObsConnection`, Cables becomes an interactive command center for your stream. Whether you're building interactive stream overlays that react to scene changes, generative VJ visuals triggered by OBS hotkeys, or custom browser-based remote control surfaces, you can now link Cables and OBS Studio with ease.

Happy patching!
