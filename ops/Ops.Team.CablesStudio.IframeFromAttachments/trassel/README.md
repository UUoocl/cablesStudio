# Trassel Generative Brush Art Example

This directory contains the **Trassel** generative thread/brush painting animation adapted for Cables.gl `IframeFromAttachments` using a dedicated BroadcastChannel bridge (`cablesBridge.js`).

## Files

- [index.html](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/index.html): Main HTML entry point.
- [cablesBridge.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/cablesBridge.js): BroadcastChannel listener receiving `mouseScrollY`, mode changes, button triggers, and resize events.
- [trassel.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/trassel/trassel.js): Generative brush art engine supporting 4 distinct visual styles and infinite virtual scrolling.

## 4 Available Rendering Modes

| Mode Index | Mode ID | Mode Name | Style Description | Button Number |
| :---: | :---: | :---: | :---: | :---: |
| `0` | `"brush"` | **Brush Ribbon** | Smooth, flowing tapered ribbons with organic fill | `button: 1` |
| `1` | `"line"` | **Solid Line** | Crisp continuous smooth vector line | `button: 2` |
| `2` | `"dash"` | **Cross Hatch Dash** | Dynamic angled diagonal dashed cross-hatching | `button: 3` |
| `3` | `"worm"` | **Beaded Worm** | Segmented circular bead dots / caterpillar chain | `button: 4` |

---

## Supported Broadcast Messages

#### 1. Mouse Scroll / Wheel Delta (`mouseScrollY`)
Advances the generative painting threads:
```json
{
  "scrollY": 8.788436889648438
}
```

#### 2. Direct Mode Selection (`mode`)
Set mode by name (`"brush"`, `"line"`, `"dash"`, `"worm"`) or 1-based / 0-based number:
```json
{
  "mode": "dash"
}
```

#### 3. Button Mode Mapping / Cycling (`button`)
- Send `button: 1` to switch to **Brush Ribbon**
- Send `button: 2` to switch to **Solid Line**
- Send `button: 3` to switch to **Cross Hatch Dash**
- Send `button: 4` to switch to **Beaded Worm**
- Or send repeating button pulses to cycle through all 4 modes sequentially (1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; 1).

```json
{
  "button": 3
}
```

#### 4. Reset (`reset`)
Clears existing canvas lines and re-initializes brushes:
```json
{
  "reset": true
}
```

### Cables.gl Patch Setup

1. In Cables, add `Ops.Team.CablesStudio.IframeFromAttachments`.
2. Set `HTML Attachment` to `index.html`.
3. Add the files to the `Files` multiport:
   - `index.html`
   - `cablesBridge.js`
   - `trassel.js`
4. Use `BroadcastChannelSend` (Channel: `cables_iframe_channel`) to post event objects (`{ "scrollY": ... }`, `{ "button": ... }`, `{ "mode": ... }`).
