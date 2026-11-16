# Cables Studio WebSocket Apps

Browser-based visual overlays, control dashboards, and input bridges designed to run with Cables Standalone over WebSocket (`ws://localhost:8080` by default, or `?ws=ws://host:port`).

## Contents

- [settings_dashboard.html](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/settings_dashboard.html) — Live Tweakpane control dashboard for discovering and controlling connected WebSocket clients, saving presets, and forwarding MIDI/dashboard updates.
- [space_type_generator-ws/](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/space_type_generator-ws/) — Interactive kinetic typography sketches (`cylinder`, `stripes`, `field`) driven by keyboard, STT, mouse, and dashboard parameters.
- [mouse_overlays/](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/mouse_overlays/) — Cursor-reactive visual overlays (`astro_bee`, `flow_highlight`, `magic_wand`, `trassel`).
- [speech-to-text/](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/speech-to-text/) — Browser Speech-to-Text transcribers (`stt_transcriber.html`, `stt_multi_transcriber.html`) that POST transcripts to `/api/stt/result` for Cables Standalone to process and broadcast.

---

## WebSocket Payloads

All incoming WebSocket messages are JSON objects with a `type` field. If a message includes `clientId`, only the client with a matching `CLIENT_ID` processes it; omit `clientId` to broadcast to all connected clients.

### 1. Keyboard Messages

Used by `space_type_generator-ws` sketches (when `textInputMode` is `'keyboard'` or `'both'`) and `mouse_overlays/astro_bee`.

#### `keyboard_pressed` (full string / combo / key)
Extracts text in priority order: `combo` → `key` → `value` → `text`.

```json
{
  "type": "keyboard_pressed",
  "combo": "HELLO WORLD"
}
```
```json
{
  "type": "keyboard_pressed",
  "key": "A",
  "clientId": "stg-cylinder"
}
```

#### `keyboard` (incremental typing or combo)
- If `combo` is non-empty, replaces the current text with `combo`.
- Otherwise uses `key`: `'Backspace'` deletes the last character, single-character keys append to the current text, and multi-character strings replace the text.

```json
{
  "type": "keyboard",
  "key": "Backspace"
}
```

#### `keyboardPress` (`mouse_overlays/astro_bee`)
Adjusts overlay zoom: `'+'` / `'='` zooms in, `'-'` zooms out.

```json
{
  "type": "keyboardPress",
  "key": "+"
}
```

---

### 2. Mouse Messages

Used by `mouse_overlays` and optionally by `space_type_generator-ws` (`cylinder` and `field` camera rotation when `interactiveCamera: true` or `?interactiveMouse` is set).

#### `mouse_move` (alias: `mousePosition`)
- When `normalized: true`, `x` and `y` are expected in `[0, 1]` and scaled to the viewport (`window.innerWidth`, `window.innerHeight`).
- When `normalized` is omitted or `false`, `x` and `y` are treated as pixel coordinates.

```json
{
  "type": "mouse_move",
  "x": 0.5,
  "y": 0.25,
  "normalized": true
}
```

For `space_type_generator-ws` camera control without `?interactiveMouse` in the URL:
```json
{
  "type": "mouse_move",
  "x": 0.65,
  "y": 0.4,
  "normalized": true,
  "interactiveCamera": true
}
```

#### `mouse_click` (alias: `mouseClick`)
Triggers click effects in `mouse_overlays` (`astro_bee`, `magic_wand`) when `pressed: true`.

```json
{
  "type": "mouse_click",
  "pressed": true
}
```

---

### 3. Speech-to-Text (STT) Messages

[stt_transcriber.html](file:///Users/jonwood/Github_local_dev/cablesStudio/apps/speech-to-text/stt_transcriber.html) sends HTTP `POST /api/stt/result` to Cables Standalone:
```json
{
  "results": [
    {
      "device": "vocals",
      "transcript": "hello world"
    }
  ]
}
```

Cables Standalone processes the result and broadcasts a WebSocket message to `space_type_generator-ws` clients (accepted when `textInputMode` is `'stt'` or `'both'`).

#### `stt_result` (alias: `stt`)
- Transcript is read in priority order: `transcript` → `text` → `value` → `results[0].transcript`.
- Channel/device is read from: `device` → `channel` → `results[0].device`.
- If the client has `sttChannel` configured (via `?channel=...` or the dashboard), messages that include a non-matching channel are ignored.

```json
{
  "type": "stt_result",
  "device": "vocals",
  "transcript": "everything is strange"
}
```

Bundled `results` array format is also supported:
```json
{
  "type": "stt",
  "results": [
    {
      "device": "vocals",
      "transcript": "everything is strange"
    }
  ]
}
```

---

## Common URL Query Parameters (`space_type_generator-ws`)

| Parameter | Alias | Default | Description |
| :--- | :--- | :--- | :--- |
| `clientID` | `clientId`, `clientid` | Sketch default (`stg-cylinder`, `stg-stripes`, `stg-field`) | Unique client identifier for targeting and dashboard panes |
| `preset` | `p` | Sketch default | Initial preset name |
| `textInput` | `input` | `keyboard` | Input source mode: `keyboard`, `stt`, or `both` |
| `channel` | `sttChannel` | `""` (all) | Optional STT `device` / channel filter (e.g. `vocals`) |
| `ws` | — | `ws://localhost:8080` | WebSocket server URL (`off` / `false` to disable) |
| `width` / `height` | — | Window size | Fixed canvas dimensions in pixels |
| `interactiveMouse` | — | unset | Enables camera control from `mouse_move` messages (`cylinder`, `field`) |
