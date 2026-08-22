# Ops.Extension.Standalone.Google.GoogleSlides

Runs an embedded Google Slides `<webview>` directly inside the Cables Studio editor, strips color-keyed backgrounds to transparency using a local preload script, and streams the rendered presentation into a WebGL `CGL.Texture` using Electron's native `capturePage()` API.

## How it works
1. **In-Editor Offscreen Webview**: Spawns an offscreen `<webview>` tag inside the Cables editor window attached to the DOM so Chromium's compositor renders frames continuously.
2. **Preload Script (`slides_preload.js`)**: Executes inside Google Slides before DOM completion, stripping the designated background color (`#abcdef`) and removing Google's black backdrop elements.
3. **Native Texture Streaming**: Uses `webview.capturePage()` to stream real-time frames directly into a `CGL.Texture` output for use in 3D scenes, shaders, materials, and canvas compositions.
4. **Incremental Navigation**: Inputs for `Next Slide` and `Previous Slide` simulate mouse wheel scroll down/up to step through in-slide animations and text builds incrementally.

## Inputs

### Execution
* **Render**: Trigger to process the op and update the texture output.

### Presentation
* **Presentation URL**: The published URL (`/pub` or `/embed`) of the Google Slides presentation.
* **Background Color to Remove**: Hex color (e.g. `#abcdef`) of the slide background to make transparent.
* **Remove Background Color**: Trigger to manually re-apply background color removal.

### Controls
* **Next Slide**: Advances to the next in-slide step/animation using simulated mouse wheel scroll down.
* **Previous Slide**: Steps backward using simulated mouse wheel scroll up.

### Capture Settings
* **Active**: Enables or disables the offscreen webview.
* **Continuous Capture**: When enabled, automatically captures frames at the specified `Capture FPS`.
* **Capture FPS**: Target capture rate (defaults to `30` FPS).
* **Flip Y**: Flips the texture vertically for standard WebGL UV coordinates.

### Resolution
* **Texture Width**: Width of the captured texture in pixels (defaults to `1920`).
* **Texture Height**: Height of the captured texture in pixels (defaults to `1080`).

## Outputs

* **Next**: Trigger passed downstream.
* **Texture**: The real-time WebGL `CGL.Texture` of the Google Slides presentation.
* **Is Loaded**: Boolean indicating whether the presentation has finished loading.
* **Current Slide**: The current slide index number.
* **Width**: Actual width of the output texture.
* **Height**: Actual height of the output texture.
* **Error**: Error message if loading or capture fails.
