# Ops.Strudel Operator & Sample Page

This directory contains the `Ops.Strudel` Cables operator and its embedded sample REPL page (`sample.html`).

## Reference

- [Strudel Technical Manual: Project Start - @strudel/repl](https://strudel.cc/technical-manual/project-start/#strudelrepl)
- [@strudel/repl Package README](https://codeberg.org/uzu/strudel/src/branch/main/packages/repl#strudel-repl)

## Cables Operator: `Ops.Strudel`

The `Ops.Strudel` op opens a pop-up window in the browser containing the embedded [`sample.html`](file:///Users/jonwood/Github_local_dev/strudel%20for%20cables/Ops/Ops.Strudel/sample.html) page.

### Operator Inputs:
- **Open REPL Window** (`Trigger`): Opens or focuses the pop-up window containing the Strudel REPL.
- **Close REPL Window** (`Trigger`): Closes the active pop-up window.
- **Auto Open On Load** (`Boolean`): Automatically launches the pop-up window when the patch loads.
- **Width** (`Number`, default: `1000`): Width in pixels of the pop-up window.
- **Height** (`Number`, default: `750`): Height in pixels of the pop-up window.
- **Window Title** (`String`, default: `"Strudel REPL"`): Title of the pop-up window.
- **Strudel CSS Variables** (`String Editor / JSON`): JSON object containing `:root` CSS variable key-value pairs (e.g. `{"--background": "#22200000 !important", ...}`) broadcasted live via BroadcastChannel API (`strudel_theme_channel`) and applied automatically when the Strudel editor finishes loading.
- **Volume** (`Number`, default: `1.0`): Master volume scaling factor for the output WebAudio node.
- **Popup Sound Output** (`Boolean`, default: `true`): Toggles local speaker sound playback in the pop-up window. When disabled (`false`), local pop-up speakers are muted while the live WebAudio stream to Cables continues.

### Operator Outputs:
- **Is Open** (`Boolean`): `true` when the pop-up window is active and open.
- **Window Object** (`Object`): Reference to the pop-up `Window` instance.
- **Canvas Element** (`Object`): Reference to the `HTMLCanvasElement` (`#html-canvas`) in the pop-up window.
- **Audio Node** (`Object`): WebAudio GainNode reference streaming live audio from the pop-up window into Cables WebAudio graph.

---

## Standalone Sample Page: `sample.html`

`sample.html` is embedded directly into the operator and can also be opened standalone in any browser.

### Features:
1. **`<strudel-editor>` Web Component**: CodeMirror live editor with `@strudel/repl`.
2. **Playback Controls**: Dedicated **▶ Play** and **⏹ Stop** buttons calling `repl.editor.evaluate()` and `repl.editor.stop()`.
3. **Live Sound Updates**: Automatic debounced evaluation on user live edits.
4. **Preset Selector**: Quick preset loading buttons.
5. **Real-time WebAudio Stream**: Dual-routing into `MediaStreamDestinationNode` for streaming to parent window while maintaining optional local speaker output.
