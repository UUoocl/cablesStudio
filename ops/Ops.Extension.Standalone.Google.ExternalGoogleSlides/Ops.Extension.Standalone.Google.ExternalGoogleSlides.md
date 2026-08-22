# Ops.Extension.Standalone.Google.ExternalGoogleSlides

Opens a standalone Electron window (with support for transparency and frameless modes), embeds Google Slides using an Electron `<webview>` tag with a local preload script (`slides_preload.js`), strips color-keyed backgrounds to transparency, and provides bidirectional BroadcastChannel communication with incremental mouse-wheel simulation for in-slide steps.

## How it works
By using Electron's native `<webview>` tag coupled with `slides_preload.js`, the script runs directly inside the Google Slides page context before DOM completion. This completely bypasses browser cross-origin (CORS) boundaries, enabling:
* Full DOM access to strip specific slide background colors (`#abcdef` or user-defined) and remove black slide backdrops.
* Direct SVG background shape stripping.
* Simulated mouse wheel navigation (`scroll-down` / `scroll-up`) to advance through animations and bullet points incrementally.

## Inputs

### Presentation
* **Presentation URL**: The published presentation URL (`/pub` or `/embed`) of the Google Slides presentation.
* **Background Color to Remove**: Hex color string (e.g. `#abcdef`) of the slide background to make transparent.
* **Remove Background Color**: Trigger to manually re-apply background color stripping.

### Window
* **Open Window**: Triggers opening the Electron popup window.
* **Close Window**: Closes the open window.
* **Window Title**: The window title text.
* **Transparent Window**: Enables window transparency (requires Electron Standalone).
* **Frameless Window**: Removes OS title bar and borders.
* **Auto Open**: Automatically opens the window on op initialization.
* **Window Width**: Initial width in pixels (defaults to `1920`).
* **Window Height**: Initial height in pixels (defaults to `1080`).
* **Window X**: Screen X coordinate.
* **Window Y**: Screen Y coordinate.

### Controls
* **Next Slide**: Sends a "Next Slide" navigation message over BroadcastChannel and simulates a mouse scroll down in the webview to step through in-slide animations.
* **Previous Slide**: Sends a "Previous Slide" navigation message over BroadcastChannel and simulates a mouse scroll up in the webview.
* **Broadcast Channel Name**: Custom BroadcastChannel name (defaults to `cables_externalslides_<op_id>` when left empty).

## Outputs

* **On Window Opened**: Fires when the window is opened.
* **On Window Closed**: Fires when the window is closed.
* **On Next Received**: Fires when a Next navigation event is acknowledged/triggered.
* **On Previous Received**: Fires when a Previous navigation event is acknowledged/triggered.
* **Is Window Open**: Boolean status indicating whether the window is currently open.
* **Current Slide**: The current slide index number.
* **Broadcast Channel**: The active BroadcastChannel name.
* **Current URL**: The active presentation URL.
* **Error**: Error message if popup or window opening fails.
