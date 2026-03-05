# Ops.Local.SocketClusterToMidiOutput

Bridges SocketCluster messages to hardware or virtual MIDI Output devices. This operator listens for incoming objects on a SocketCluster channel and forwards them to the selected MIDI device on your system.

## Features

- **Device Selection**: Automatically lists all available MIDI output devices on your system.
- **Dynamic Routing**: Listens for a specific SocketCluster topic (default: `midi_send`).
- **Multiple Schemas**: Supports three common MIDI data formats:
    1. **Standard Object**: `{ type: "noteon", channel: 1, note: 60, velocity: 0.8 }`
    2. **Raw Byte Array**: `[144, 60, 100]` (decodes status bytes automatically)
    3. **Status/Data Object**: `{ status: 144, data1: 60, data2: 100 }`
- **Auto-Type Mapping**: Handles conversion between 0-127 MIDI values and 0.0-1.0 normalized values (e.g., for velocity).

## Inputs

| Port | Type | Description |
| :--- | :--- | :--- |
| **SC Socket** | Object | The SocketCluster socket from a `SocketClusterClient` op. |
| **SC Topic Filter** | String | The topic to listen for (default: `midi_send`). |
| **Active** | Boolean | Enables or disables the bridge. |
| **Refresh Devices** | Trigger | Refreshes the list of available MIDI output devices. |
| **Output Device** | DropDown | Select the destination MIDI device. |

## Outputs

| Port | Type | Description |
| :--- | :--- | :--- |
| **Forwarded** | Trigger | Triggers whenever a message is successfully sent to MIDI. |
| **Debug Info** | String | Real-time connection and activity logs. |

## Usage with Cables.gl

1. Add a **SocketClusterClient** and set its channel (e.g., `myProject`).
2. Add this op and link the **SC Socket**.
3. Select your desired **Output Device**.
4. Any client (like the **MIDI Monitor SC** app) publishing to `myProject/objects` with the topic `midi_send` will now trigger your physical MIDI hardware.

## Requirements
- Requires the **Cables Standalone** environment.
- Uses the `webmidi` npm package (included in dependencies).
