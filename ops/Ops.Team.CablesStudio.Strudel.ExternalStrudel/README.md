# Ops.Team.CablesStudio.Strudel.ExternalStrudel

This operator embeds the **Strudel REPL** live coding editor (from `@strudel/repl`) within a separate browser popup window.

## Key Features

- **Popup Window Isolation**: Keeps the editor UI in an independent popup window, enabling multi-monitor setups and freeing up canvas real estate.
- **WebAudio Stream Routing**: Automatically captures the WebAudio output from the popup window, routes it through a Cables `GainNode`, and exposes it via the `Audio Node` port.
- **Telemetry & Triggers**:
  - `On Note Event` & `On Cycle`: Real-time note/pattern telemetry triggers.
  - `On Play`: Fired when pattern compilation succeeds and playback begins.
  - `On Stop`: Fired when playback is hushed/stopped.
  - `On Error`: Fired when pattern compilation fails.
- **DOM Element Access**: Outputs the editor DOM node inside the popup window via the `Element` port.
- **Clean Structure**: Excludes custom CSS strings, styling presets, canvas texture rendering, and html-in-canvas scaling.

## Input Ports

- **Open REPL Window**: Trigger to open the popup window.
- **Close REPL Window**: Trigger to close the popup window.
- **Play / Stop**: Toggle to play (evaluate) or stop (hush) the pattern.
- **Auto Open On Load**: Automatically open the popup window when the patch loads.
- **Width**: Width of the popup window in pixels.
- **Height**: Height of the popup window in pixels.
- **Window Title**: Title of the popup window.
- **Pattern Code**: Strudel pattern code to load initially.
- **Enable Telemetry**: Enable/disable active note, cycle, and event polling to save CPU.
- **Volume**: Gain scale factor for the output audio node.
- **Sound Output**: If `true`, playback is sent directly to the device speakers; if `false`, audio is muted to speakers and only output via the `Audio Node` WebAudio port.
- **Show Line Numbers**: Toggle line numbers in the editor window.

## Output Ports

- **Element**: The editor DOM element inside the popup window.
- **Audio Node**: WebAudio GainNode containing the routed Strudel audio output.
- **Current Pattern**: Code currently typed/modified in the popup editor interface.
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
