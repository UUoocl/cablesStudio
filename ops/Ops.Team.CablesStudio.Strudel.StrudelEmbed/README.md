# Ops.Team.CablesStudio.Strudel.StrudelEmbed

This operator embeds the **Strudel REPL** live coding editor (from `@strudel/repl`) within an isolated, same-origin `iframe` component.

## Key Features

- **Iframe Isolation**: Prevents Strudel editor CSS and Javascript libraries from leaking into or conflicting with the parent Cables canvas and environment.
- **WebAudio Stream Routing**: Automatically intercepts the WebAudio context created inside the iframe, routes it through a parent Cables WebAudio `GainNode` and exposes it via the `Audio Node` port.
- **Triggers & Events**:
  - `On Play`: Fired when pattern compilation succeeds and playback begins.
  - `On Stop`: Fired when playback is hushed/stopped.
  - `On Note Event` & `On Cycle`: Real-time note/pattern telemetry triggers.
  - `On Error`: Fired when pattern compilation fails.
- **Strictly DOM**: Output only the outer DOM element (`Element` port). This operator does not feature any canvas texture generation or html-in-canvas scaling.

## Input Ports

- **Show UI**: Show or hide the editor.
- **Play / Stop**: Toggle to play (evaluate) or stop (hush) the pattern code.
- **Width**: Width of the container element in pixels.
- **Height**: Height of the container element in pixels.
- **Opacity**: Opacity of the container element.
- **Pattern Code**: JavaScript/Strudel code pattern to play.
- **Enable Telemetry**: Enable/disable active note, cycle, and event polling to save CPU.
- **Volume**: Gain scale factor for the output audio node.
- **Sound Output**: If `true`, playback is sent directly to the speakers; if `false`, audio is muted to speakers and only output via the `Audio Node` WebAudio port.
- **Transparent Background**: Makes editor panels transparent.
- **Show Line Numbers**: Show or hide the editor line numbers gutter.

## Output Ports

- **Element**: The wrapper DOM container element containing the iframe.
- **Audio Node**: WebAudio GainNode containing the routed Strudel audio output.
- **Current Pattern**: Code currently typed/modified in the editor interface.
- **Is Playing**: Play state status.
- **Active Notes**: Array of note objects currently active.
- **Active MIDI Notes**: Array of MIDI pitch values currently active.
- **Active Note Names**: Array of pitch names (e.g. `C4`, `E4`) currently active.
- **Active Note Count**: Number of concurrent active notes.
- **On Note Event**: Fires when a note begins.
- **On Cycle**: Fires at the start of a pattern cycle.
- **On Play**: Fires when pattern begins playing.
- **On Stop**: Fires when pattern is stopped.
- **On Error**: Fires when pattern compilation fails.
- **Last Event**: Event object structure of the last triggered note.
- **Last Sound**: Name of the instrument/sound of the last note.
- **Error**: Compilation or syntax error message.
