# Magic Wand Overlay Example

This directory contains the **Sparkly Magic Wand** p5.js sketch adapted for Cables.gl `IframeFromAttachments` using a dedicated BroadcastChannel bridge (`cablesBridge.js`).

## Files

- [index.html](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/index.html): Entry HTML loading p5.js, the star particle class, bridge, and sketch.
- [cablesBridge.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/cablesBridge.js): BroadcastChannel listener receiving position and button click JSON messages.
- [sketch.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/sketch.js): p5.js animation sketch driven by bridge events.
- [star.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/star.js): Particle class for animated star effects with per-particle color support.
- [p5.min.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/p5.min.js): Bundled p5.js library.

## How it works

The sketch runs in pure **BroadcastChannel** mode (default channel: `cables_iframe_channel`). Messages can be sent from a Cables patch via `Ops.Team.CablesStudio.BroadcastChannel.BroadcastChannelSend` or `IframeFromAttachments`.

### Supported Broadcast Messages

#### 1. Mouse / Cursor Position (`mousePosition`)
Updates the virtual magic wand position and generates a trail of sparkle stars:
```json
{
  "posX": 3307,
  "posY": 1882
}
```

#### 2. Mouse Button / Trigger (`mouseButton`)
Triggers an explosion burst of 20–50 stars radiating outwards from the current position. Each button index maps to a unique color from the color palette array:
```json
{
  "button": 1
}
```

##### Button Color Mapping:
| Button Value | Array Index | Color | Default RGB |
| :--- | :--- | :--- | :--- |
| `button: 1` | `0` | Magenta / Pink | `[255, 0, 255]` |
| `button: 2` | `1` | Sky Blue / Cyan | `[129, 210, 235]` |
| `button: 3` | `2` | Gold / Yellow | `[255, 215, 0]` |
| `button: 4` | `3` | Spring Green | `[0, 255, 128]` |
| `button: 5` | `4` | Orange | `[255, 102, 0]` |
| `button: 6` | `5` | Violet / Purple | `[180, 100, 255]` |
| `button: 7` | `6` | Red | `[255, 50, 50]` |
| `button: 8` | `7` | Deep Cyan | `[0, 200, 255]` |

You can also dynamically customize the color palette by sending a `buttonColors` array:
```json
{
  "type": "SET_VAR",
  "key": "buttonColors",
  "value": [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255]
  ]
}
```

### Cables.gl Patch Setup

1. In Cables, add `Ops.Team.CablesStudio.IframeFromAttachments`.
2. Set `HTML Attachment` to `index.html`.
3. Add the files to the `Files` multiport:
   - `index.html`
   - `star.js`
   - `cablesBridge.js`
   - `sketch.js`
   - `p5.min.js`
4. Use `BroadcastChannelSend` (Channel: `cables_iframe_channel`) to post event objects (`{ "posX": ..., "posY": ... }` and `{ "button": 1 }`).


## performance improvement
Here are the key performance bottlenecks causing the lag and the most effective ways to gain **5x–10x higher FPS and smooth rendering**:

---

### 1. 🚨 **Remove `drawingContext.shadowBlur` (The #1 Bottleneck)**
In [star.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/star.js#L34-L37):
```javascript
drawingContext.shadowOffsetX = 5;
drawingContext.shadowOffsetY = -5;
drawingContext.shadowBlur = 10;
drawingContext.shadowColor = color(0, 0, 0, 50);
```
- **Why it lags**: Canvas 2D `shadowBlur` recalculates a software Gaussian blur pass for **every single particle on every single frame**. With 50–200 stars, that's 200 blur passes 60 times a second, which instantly causes major frame drops.
- **Fix**: Remove `shadowBlur` (or set `shadowBlur = 0`). If a glow or soft edge is needed, use an alpha gradient or pre-rendered sprite.

---

### 2. 🧹 **Remove Verbose `console.log` on Mouse Movement**
- **Why it lags**: Mouse position updates arrive at 60Hz–240Hz. Logging multiple styled strings (`%c[cablesBridge]...`) to DevTools on every single message blocks the JavaScript thread and triggers heavy garbage collection.
- **Fix**: Disable or guard position/trail logs so they only print when debugging.

---

### 3. ⚡ **Replace `p5.Vector` with Raw Floats (Eliminate GC Churn)**
In [star.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/star.js#L3-L5) & [star.js:L21](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.IframeFromAttachments/magicWand/star.js#L21):
```javascript
// Current: Allocates 2 new Vector objects per particle every frame
this.acceleration = p5.Vector.random2D().mult(0.05);
this.velocity.add(this.acceleration);
this.position.add(this.velocity);
```
- **Why it lags**: With 150 stars at 60 FPS, this allocates **~18,000 objects per second**, causing periodic stutter when the browser runs Garbage Collection (GC).
- **Fix**: Use primitive floats (`this.x`, `this.y`, `this.vx`, `this.vy`).

---

### 4. 🎨 **Use `Path2D` or Direct Canvas Drawing Instead of `beginShape()`**
- **Why it lags**: `beginShape()` + `quadraticVertex()` in p5.js creates intermediate arrays and parses curves on every frame.
- **Fix**: Use native Canvas 2D commands directly on `drawingContext` or pre-compile the shape into a `Path2D`:
```javascript
const starPath = new Path2D();
// pre-defined 4-point star path scaled with ctx.scale()
```

---

### 5. 🛡️ **Particle Cap (Max Stars Limit)**
- Add a safety ceiling (e.g. `MAX_STARS = 250`). If star count exceeds the limit during fast bursts or rapid movements, drop the oldest stars:
```javascript
if (stars.length > 250) {
    stars.splice(0, stars.length - 250);
}
```

---

### Suggested Optimized `star.js` Preview

```javascript
class Star {
    constructor(x, y, vx, vy, fillColor) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.fillColor = fillColor || [255, 255, 0];
        this.rot = Math.random() * Math.PI * 2;
        this.size = Math.random() * 9 + 1;
        this.life = 255;
        this.done = false;
        this.rand = Math.random() > 0.5;
    }

    update() {
        this.life -= 5;
        if (this.life <= 0) {
            this.done = true;
            return;
        }

        if (this.rand) {
            const angle = Math.random() * Math.PI * 2;
            this.vx += Math.cos(angle) * 0.05;
            this.vy += Math.sin(angle) * 0.05;
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    display() {
        const ctx = drawingContext;
        const s = this.size;
        const [r, g, b] = this.fillColor;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = `rgba(${r},${g},${b},${this.life / 255})`;

        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
```