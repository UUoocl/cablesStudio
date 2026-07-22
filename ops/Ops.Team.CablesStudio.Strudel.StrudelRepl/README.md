# Ops.Team.CablesStudio.Strudel.StrudelRepl

**Premium HTML-Wrapped Strudel REPL Operator for Cables.gl**

`StrudelRepl` mounts the Strudel REPL live-coding interface (`<strudel-editor>`) inside a DOM container, allowing users to write and run patterns interactively inside a Cables patch. 

It renders the REPL UI in the DOM, outputs the container element directly via the `Element` outport, and redirects Strudel's synth/sample audio output through the `Audio Node` outport. This allows Strudel's audio output to be cleanly processed by downstream Cables WebAudio nodes (such as delay, reverb, or analysis operators).

---

## Features

- **Embedded Editor**: Instantiates a standard CodeMirror editor loaded dynamically from `@strudel/repl`.
- **Flexible Styling**: Accepts custom CSS theme variables to tailor the editor skin.
- **Dedicated DOM Output**: Emits the container element via its `Element` outport, providing clean DOM modularity.
- **Integrated WebAudio Routing**: Seamlessly captures the internal audio output using an AudioContext-level wrapper and routes it to an output `Audio Node`.
- **Direct Sound Control**: Supports toggling between playing Strudel's audio directly to speakers or muting direct speaker output to exclusively route sound through Cables.

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
- `Volume` (Number): Volume level multiplier for the output Audio Node.
- `Popup Sound Output` (Boolean): Toggle whether Strudel audio is sent directly to the device speakers (true) or muted so it only outputs through Cables WebAudio (false).

---

## Output Ports

- `Element` (Object): The DOM container element of the REPL editor.
- `Audio Node` (Object): WebAudio `GainNode` containing the live audio output of the Strudel engine.
