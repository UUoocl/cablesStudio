# Ops.Team.CablesStudio.Strudel.IframeStrudel

**AGPL-3.0 / MIT Compatible Embedded Iframe Strudel Operator for Cables.gl**

`IframeStrudel` embeds Strudel live-coding patterns directly inside a Cables.gl patch using an isolated `<iframe>` DOM container. It provides zero-copy WebGL texture generation, WebAudio stream forwarding, live CodeMirror pattern editing, and real-time note telemetry—all while remaining **100% MIT-compatible with Cables.gl core**.

---

## Why It's AGPL / MIT Compatible

- **Process-Isolated Browsing Context**: Strudel's AGPL-3.0 codebase runs entirely inside an isolated `<iframe>` document.
- **Asynchronous IPC**: The Cables operator (MIT) communicates with Strudel (AGPL) strictly across process boundaries using standard Web Messaging APIs (`BroadcastChannel`, `postMessage`, `createImageBitmap`).
- **Legal Compliance**: The FSF GPL/AGPL guidelines state that asynchronous web message passing between process-isolated browsing contexts constitutes separate programs, preventing copyleft contamination of the host Cables codebase.

---

## Features & Highlights

- **Embedded Overlay Iframe**: Renders directly inside the Cables canvas interface with configurable overlay positions (Top-Right, Top-Left, Bottom-Right, Bottom-Left, Center, Hidden).
- **Native WebGL `CGL.Texture` Output**: Automatically converts incoming `ImageBitmap` frames into native WebGL textures via `gl.texImage2D` with zero CPU memory copy overhead.
- **WebAudio Routing**: Forwards Strudel synth/sample output into a Cables WebAudio `GainNode` connected to downstream Cables audio effects.
- **Real-Time Note Telemetry**: Broadcasts active notes, MIDI note numbers (`[48, 52]`), note names (`["C3", "E3"]`), CPS, BPM, cycle progress, and event triggers over `strudel_telemetry_channel`.

---

## Input Ports

- `Show Iframe` (Bool): Toggle visibility of the embedded HTML iframe element.
- `Play / Stop` (Bool): Start or stop pattern evaluation.
- `Width` (Number): Pixel width of the iframe container.
- `Height` (Number): Pixel height of the iframe container.
- `Iframe Position` (Select): Overlay position mode (`Overlay Top-Right`, `Overlay Top-Left`, `Overlay Bottom-Right`, `Overlay Bottom-Left`, `Center`, `Hidden`).
- `Opacity` (Number): Opacity float (0.0 to 1.0) of the iframe overlay.
- `Strudel CSS Variables` (String): CSS variables for editor theme styling.
- `Pattern Code` (String): Strudel live coding pattern.
- `Volume` (Number): Output volume multiplier.
- `Flip Y` (Bool): Enable `gl.UNPACK_FLIP_Y_WEBGL` for texture orientation.

---

## Output Ports

- `Is Active` (Bool): True when the iframe is mounted and active.
- `Iframe Element` (Object): Reference to the DOM `HTMLIFrameElement`.
- `Image Bitmap` (Object): Raw `ImageBitmap` object.
- `Texture` (Texture): Native Cables `CGL.Texture` for WebGL shaders.
- `Texture Updated` (Trigger): Fired when a GPU texture frame is uploaded.
- `Audio Node` (Object): WebAudio `GainNode` output.
- `Current Pattern` (String): Code string in the editor.
- `Is Playing` (Bool): True during pattern playback.
- `Active Notes` (Array): Array of active note objects.
- `Active MIDI Notes` (Array): Array of active MIDI note numbers.
- `Active Note Names` (Array): Array of active note name strings.
- `Active Note Count` (Number): Count of active notes.
- `On Note Event` (Trigger): Fired on note event.
- `CPS` / `BPM` (Number): Cycles per second / Beats per minute.
- `Cycle Progress` / `Current Cycle` (Number): Phase in cycle / cycle index.
- `On Cycle` (Trigger): Fired on cycle boundary.
- `Last Event` / `Last Sound` (Object/String): Last hap event / sound name.
- `Error` (String): Evaluation error message if syntax fails.
