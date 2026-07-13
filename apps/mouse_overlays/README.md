# Magic Wand Broadcast Channel Interface Documentation

The Magic Wand Overlay uses a high-performance, local-only `BroadcastChannel` communication protocol instead of WebSockets. The communication is facilitated by the `Ops.Gl.ExternalUrl_v2` operator in Cables.

## How it Works

1. The cables operator `Ops.Gl.ExternalUrl_v2` opens the `p5_magicWand.html` overlay page.
2. The operator appends the configured **Broadcast Channel Name** to the URL query string, for example:
   `p5_magicWand.html?channel=url-sync`
3. The page parses the `channel` parameter. If not specified (e.g. opened directly), it defaults to `magicwand-sync`.
4. The page initializes a `BroadcastChannel` instance using that name.
5. As the mouse moves, clicks occur, or settings change, the cables patch broadcasts updated payload objects over the channel, which the sketch processes dynamically.

---

## Broadcast Channel Protocol (Payload Schema)

All messages are sent as JSON objects over the broadcast channel. The `type` field specifies the event type.

### 1. Mouse Move (`mouse_move`)
Sent when coordinates are updated in the Cables patch.

```json
{
  "type": "mouse_move",
  "x": 0.5,
  "y": 0.8,
  "normalized": true
}
```
* **`x`** (Number): Horizontal position.
* **`y`** (Number): Vertical position.
* **`normalized`** (Boolean): If `true`, the page scales `x` and `y` (expected `[0.0, 1.0]`) to `window.innerWidth` and `window.innerHeight`. If `false`, the page treats them as absolute pixel coordinates.

#### Coordinate Mapping to the Canvas
When using normalized coordinates (`normalized: true`), the sketch maps coordinates from `[0.0, 1.0]` to the browser window dimensions:
* `mappedX = x * window.innerWidth`
* `mappedY = y * window.innerHeight`

Since the canvas is configured to use 100% of the window width and height on load, this mapping ensures the trail position matches the viewport dimensions regardless of the window dimensions or aspect ratio.

### 2. Mouse Click (`mouse_click`)
Sent when the mouse pressed state changes.

```json
{
  "type": "mouse_click",
  "pressed": true,
  "button": "MB1"
}
```
* **`pressed`** (Boolean): Whether the button is pressed (`true`) or released (`false`).
* **`button`** (String): Identifier for the button, e.g. `"MB1"` (Left Click / Primary) or other buttons.

### 3. Configuration (`config`)
Sent to dynamically style the sparkle particles.

```json
{
  "type": "config",
  "colorMove": [255, 255, 0],
  "colorClick": [255, 0, 255],
  "starSize": 10.0,
  "starDecay": 5.0
}
```
* **`colorMove`** (Array of 3 numbers): RGB colors `[0-255]` for trails left by mouse movement.
* **`colorClick`** (Array of 3 numbers): RGB colors `[0-255]` for click bursts.
* **`starSize`** (Number): Maximum random size of the sparkle stars.
* **`starDecay`** (Number): Value subtracted from star opacity (`life`) per frame (higher value = shorter trail).
---

## Cables Sub-Operator Setup Guidelines

To generate the payloads expected by the Magic Wand client page, the cables developer should construct a custom sub-operator (or compose them using object operators) to build these payload objects.

### Suggested Sub-Op Structure

* **Inputs**:
  - `Mouse X` (Number) & `Mouse Y` (Number)
  - `Mouse Pressed` (Boolean)
  - `Color Move` (Array: RGB)
  - `Color Click` (Array: RGB)
  - `Star Size` (Number)
  - `Star Decay` (Number)
* **Outputs**:
  - `Payload` (Object) -> Linked to `Payload` port of `Ops.Gl.ExternalUrl_v2`

### Behavior Flow

Your sub-operator should output one of the following payload structures to its `Payload` output port depending on the event:

#### A. Mouse Position Update Event (`mouse_move`)
Triggered when the mouse coordinates change.
```json
{
  "type": "mouse_move",
  "x": 0.485,
  "y": 0.312,
  "normalized": true
}
```

#### B. Mouse Click Event (`mouse_click`)
Triggered when the mouse is pressed or released.
```json
{
  "type": "mouse_click",
  "pressed": true,
  "button": "MB1"
}
```

#### C. Configuration Update Event (`config`)
Triggered when configuration settings are adjusted.
```json
{
  "type": "config",
  "colorMove": [255, 255, 0],
  "colorClick": [255, 0, 255],
  "starSize": 12,
  "starDecay": 4
}
```

### Implementation Steps
1. Connect `Mouse X` and `Mouse Y` to change listeners. When they change, construct and output the `mouse_move` object.
2. Connect `Mouse Pressed` to change listeners. When the state changes, construct and output the `mouse_click` object.
3. Combine all configuration ports (`Color Move`, `Color Click`, `Star Size`, `Star Decay`) into a single `config` object. Output this object whenever a setting is changed.

---

## Remapping a Desktop Region to Normalized [0-1] Range

If the mouse coordinates generated inside Cables are in absolute screen pixels (for example, spanning a multi-monitor layout or a specific window region), you should normalize them to the `[0, 1]` range before broadcasting.

### Using Cables Math Operators

You can perform this normalization inside your Cables patch or sub-operator using the built-in **`Ops.Math.MapRange`** (or **`Ops.Math.Map`**) operator:

1. **For Horizontal Coordinate (X):**
   - Place a `MapRange` operator.
   - Connect your raw `Mouse X` coordinate to the `Value` input.
   - Set `Old Min` to the left-most pixel coordinate of your desktop region (e.g., `0`).
   - Set `Old Max` to the right-most pixel coordinate of your desktop region (e.g., `1920` or `3840` for dual screen).
   - Set `New Min` to `0.0`.
   - Set `New Max` to `1.0`.
   - The output value will be the normalized X coordinate.

2. **For Vertical Coordinate (Y):**
   - Place another `MapRange` operator.
   - Connect your raw `Mouse Y` coordinate to the `Value` input.
   - Set `Old Min` to the top-most pixel coordinate of your desktop region (e.g., `0`).
   - Set `Old Max` to the bottom-most pixel coordinate of your desktop region (e.g., `1080`).
   - Set `New Min` to `0.0`.
   - Set `New Max` to `1.0`.
   - The output value will be the normalized Y coordinate.

### Custom Desktop Region Example
If you only want to map a specific window region or monitor of your desktop:
- **Left monitor (1920x1080):** Set Old Min X = `0`, Old Max X = `1920`.
- **Right monitor (1920x1080 in dual setup):** Set Old Min X = `1920`, Old Max X = `3840`.
- **Specific window bounds (`x: 200` to `800`, `y: 100` to `700`):** Set Old Min X = `200`, Old Max X = `800`, and Old Min Y = `100`, Old Max Y = `700`.


