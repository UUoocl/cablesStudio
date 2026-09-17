# Ops.Extension.Standalone.Electron.WebView

Runs an embedded Electron `<webview>` inside the standalone cables editor environment, loading a specified web URL or local HTML page and injecting a customizable preload script from the patch's `ops/` folder. Renders guest web content directly into a WebGL `CGL.Texture` using an HTML-in-Canvas zero-copy GPU transfer pipeline, and provides a bidirectional Object messaging interface for cross-boundary communication.

## Architecture

```
+-------------------------------------------------------------------------+
|                              Cables Patch                               |
|                                                                         |
|  [Message In (Object)] --+                                              |
|  [Send (Trigger)] -------+                                              |
|                          |                                              |
|                          v                                              |
|  +-------------------------------------------------------------------+  |
|  |             Ops.Extension.Standalone.Electron.WebView             |  |
|  |                                                                   |  |
|  |  Inputs:  [Render, Send, Message In, URL, Preload File, Active]   |  |
|  |  Outputs: [Next, Texture, On Message, Message Out, Is Loaded...]  |  |
|  |                                                                   |  |
|  |         | (cables-init-port)              ^ (Zero-Copy ImageBitmap) |
|  |         | (Bidirectional MessagePort)     | (Response Objects)      |
|  |         v                                 |                         |
|  |  +-------------------------------------------------------------+  |  |
|  |  |                     Electron <webview>                      |  |  |
|  |  |                                                             |  |  |
|  |  |  [Guest Page / Web Application]                             |  |  |
|  |  |  [Preload Script (e.g. slides_preload.js)]                 |  |  |
|  |  |   - Executes in guest context before page scripts run       |  |  |
|  |  |   - Handles bidirectional RPC and DOM events                |  |  |
|  |  |   - HTML-in-Canvas zero-copy GPU frame capture              |  |  |
|  |  +-------------------------------------------------------------+  |  |
|  |                                           |                       |  |
|  |                                           v                       |  |
|  |                                [WebGL CGL.Texture Output]         |  |
|  +-------------------------------------------------------------------+  |
|                          |                                              |
|                          v                                              |
|  [Message Out (Object)] -+                                              |
|  [On Message (Trigger)] -+                                              |
+-------------------------------------------------------------------------+
```

---

## Role of the Preload Script

In Electron, a **Preload Script** runs in the `<webview>` execution context before other guest scripts execute. In this op, the preload script serves two primary roles:

1. **Zero-Copy GPU Frame Compositing**: Hooks into the guest DOM to rasterize content via Chromium's Blink HTML-in-Canvas compositor, capturing `ImageBitmap` frames and transferring them with zero CPU memory copy to WebGL (`CGL.Texture`).
2. **Cross-Boundary Message Bridge**: Listens for inbound control objects over a private `MessagePort` and emits response objects back to the host Cables patch.

Preload script files are resolved strictly within the patch's `ops/` directory (e.g. `slides_preload.js`).

---

## Inputs

- **Render** (*Trigger*): Triggers the next downstream op and requests the latest rendered frame from the webview.
- **Send** (*Trigger*): Dispatches the current object on **Message In** across the boundary to the preload script.
- **Message In** (*Object*): The JavaScript object payload to send to the preload script.
- **URL** (*String*): The target web URL or local HTML page to load inside the webview.
- **Preload File** (*String*): Preload script filename (resolved strictly within the patch's `ops/` directory). Examples include `zoom_preload.js` and `slides_preload.js`.
- **Show Element** (*Boolean*): When enabled, brings the `<webview>` element into foreground view with interactive mouse/keyboard pointer events. When disabled, the webview remains offscreen in background frame capture mode.
- **Active** (*Boolean*): Enables or disables the webview and texture capture.
- **Texture Width** (*Integer*): Target width in pixels for the captured WebGL texture and webview bounds. Default is `1920`.
- **Texture Height** (*Integer*): Target height in pixels for the captured WebGL texture and webview bounds. Default is `1080`.
- **Flip Y** (*Boolean*): Inverts the vertical texture orientation when uploading to WebGL. Default is `true`.

## Outputs

- **Next** (*Trigger*): Passthrough execution trigger.
- **Texture** (*Texture*): The active WebGL `CGL.Texture` containing the live rendered frames of the webview (e.g. Zoom's zero-copy video stream, Google Slides presentation, or web page).
- **On Message** (*Trigger*): Fires when a message or response is received from the preload script.
- **Message Out** (*Object*): The JavaScript object payload emitted by the preload script.
- **Is Loaded** (*Boolean*): `true` when the webview has completed initial DOM loading.
- **Current Slide** (*Number*): Current tracked slide or page index.
- **Width** (*Number*): Actual pixel width of the captured frame texture.
- **Height** (*Number*): Actual pixel height of the captured frame texture.
- **Error** (*String*): Contains error descriptions if the webview fails to instantiate or load.
