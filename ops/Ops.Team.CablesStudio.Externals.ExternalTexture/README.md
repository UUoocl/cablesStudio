# External Texture Display Op

This op opens a separate, external popup window to display and render a WebGL or WebGPU texture directly from Cables, bypassing mixed-content or sandbox limits, and shares metadata via a `BroadcastChannel`.

## Parameters

* **Update**: Trigger to update and render the texture to the external window.
* **Texture**: The WebGL or WebGPU texture to display.
* **Broadcast Channel Name**: The broadcast channel to use for sending texture metadata updates (default: `texture-sync`).
* **Pos X / Pos Y**: The X/Y screen coordinates to place the external window.
* **Width / Height**: The initial width and height dimensions of the popup.
* **Smoothing**: Toggle bilinear filtering/smoothing on the canvas representation.
* **Stretch**: Stretch the texture to fill the window viewport.
* **Transparent background**: Enables transparency on the subwindow's body background.
* **Title**: Document title for the spawned window.
* **Open Window**: Button/trigger to open the external window.
* **Fullscreen**: Button/trigger to request fullscreen mode.
* **Close**: Button/trigger to close the external window.

## Outputs

* **Next**: Trigger passed to downstream ops.
* **Element**: The DOM body element reference of the external window.
* **Mode**: Current active rendering pathway (`WebGL`, `WebGPU`, or `Inactive`).
* **Window Title**: The title string of the window (synced with the **Title** input parameter).
* **Window Number**: Incremental sequence number of the window (starts at 1, resets to 0 when closed).
* **Window Name**: The unique browser window target/name identifier of the opened window (e.g. `view#<uuid>`).
* **Window Created**: Trigger output that fires immediately when the external window is created.
