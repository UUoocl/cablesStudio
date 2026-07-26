# Ops.Team.CablesStudio.Strudel.StrudelRepl

**Premium HTML-Wrapped Strudel REPL Operator for Cables.gl**

`StrudelRepl` mounts the Strudel REPL live-coding interface (`<strudel-editor>`) inside a DOM container, allowing users to write and run patterns interactively inside a Cables patch. 

It renders the REPL UI in the DOM, outputs the container element directly via the `Element` outport, and redirects Strudel's synth/sample audio output through the `Audio Node` outport. It also supports comprehensive note-level telemetry outputs, timing parameters (CPS, BPM, cycles), and event triggers for deep integration with Cables graphics, particle engines, and custom shaders.

---

## Features

- **Embedded Editor**: Instantiates a standard CodeMirror editor loaded dynamically from `@strudel/repl`.
- **Flexible Styling**: Accepts custom CSS theme variables to tailor the editor skin.
- **Dedicated DOM Output**: Emits the container element via its `Element` outport, providing clean DOM modularity.
- **Integrated WebAudio Routing**: Seamlessly captures the internal audio output using an AudioContext-level wrapper and routes it to an output `Audio Node`.
- **Direct Sound Control**: Supports toggling between playing Strudel's audio directly to speakers or muting direct speaker output to exclusively route sound through Cables.
- **Real-Time Note Telemetry**: Exposes active notes, MIDI note numbers (`[48, 52]`), note names (`["C3", "E3"]`), CPS, BPM, cycle progress, and event triggers directly to output ports.
- **Telemetry Performance Toggle**: Includes an `Enable Telemetry` toggle to turn off note hook/pooling logic and conserve CPU performance when telemetry isn't needed.

---

## Input Ports

- `Show UI` (Boolean): Toggle visibility of the editor container.
- `Play / Stop` (Boolean): Controls pattern evaluation.
- `Width` (Number): Width of the editor container.
- `Height` (Number): Height of the editor container.
- `Position X` / `Position Y` (Number): Fixed offset positioning coordinates.
- `Opacity` (Number): Opacity level of the editor container.
- `Strudel CSS Variables` (String): CSS styles/variables to override default colors and themes.
- `Pattern Code` (String): Initial/current pattern code template.
- `Enable Telemetry` (Boolean): Toggle whether Strudel note-level telemetry is gathered (true) or skipped to save performance (false).
- `Volume` (Number): Volume level multiplier for the output Audio Node.
- `Popup Sound Output` (Boolean): Toggle whether Strudel audio is sent directly to the device speakers (true) or muted so it only outputs through Cables WebAudio (false).

---

## Output Ports

- `Element` (Object): The DOM container element of the REPL editor.
- `Audio Node` (Object): WebAudio `GainNode` containing the live audio output of the Strudel engine.
- `Current Pattern` (String): The text typed inside the Strudel REPL editor.
- `Is Playing` (Boolean): True when Strudel is playing a pattern.
- `Active Notes` (Array): Array of active note telemetry object details.
- `Active MIDI Notes` (Array): Array of active MIDI note numbers.
- `Active Note Names` (Array): Array of active note name strings.
- `Active Note Count` (Number): Total number of notes currently active.
- `On Note Event` (Trigger): Fired whenever a note event begins.
- `CPS` / `BPM` (Number): Cycles per second / Beats per minute.
- `Cycle Progress` / `Current Cycle` (Number): Phase in cycle (0.0 - 1.0) / total elapsed cycle index.
- `On Cycle` (Trigger): Fired at the boundary of each new cycle.
- `Last Event` / `Last Sound` (Object/String): Last note event object / last sound bank name.
- `Error` (String): Compile/evaluation error messages.

---

## Known Limitations

- **Binary Background Transparency**: When mapping the HTML element container to a WebGL texture (e.g. using `HTMLInCanvas`), semi-transparent background colors (fractional alpha values between 0.01 and 0.99) are not preserved through the rendering pipeline. The background will render as either **0% visible** (completely transparent) or **100% visible** (fully opaque).

