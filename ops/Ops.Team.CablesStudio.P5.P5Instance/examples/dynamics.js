// Interfaces 2026 – Dynamics Sketch (Adapted for Cables P5Instance Op)
//
// A flowing motion-trail visualisation inspired by slow ballet.
// Each joint leaves behind drifting, luminous wisps whose colour and
// intensity reflect the joint's gentle velocity between successive frames.
//
// The aesthetic is deliberately calm: think ink dissolving in still water,
// or ribbons of light drawn by a dancer's hands.  Fast movement produces
// slightly more vivid trails; slow, contemplative poses leave faint hazes.
//
// Colour palette: cool aqua (hue 180) → soft violet (hue 270).
// No harsh reds or explosive bursts — the full range stays in the
// tranquil blue-green-violet spectrum.

// ── Configuration ────────────────────────────────────────────────────────────
const SCENE_WIDTH = 800;
const SCENE_HEIGHT = 600;
const MAX_PARTICLES = 500;

// All 33 MediaPipe joints contribute trails; extremities get a slightly
// higher weight via the burst multiplier below.
const EMITTER_JOINTS = [
    0,                           // nose
    11, 12,                      // shoulders
    13, 14,                      // elbows
    15, 16,                      // wrists
    23, 24,                      // hips
    25, 26,                      // knees
    27, 28, 29, 30, 31, 32,      // ankles / feet
];

// Skeleton connections for the delicate background skeleton.
const CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28],
    [27, 29], [27, 31], [28, 30], [28, 32],
];

// MAIN PART START
export default function (p, op, w, h) {
    let currentWidth = w || SCENE_WIDTH;
    let currentHeight = h || SCENE_HEIGHT;

    // State local to each instance of this operator
    let _prevLandmarks = null;
    const _particles = [];
    let LIVEMODE = false;
    let DATA = [];
    let index = 0;

    p.onDataChange = function (cablesData) {
        if (!cablesData) return;

        LIVEMODE = true;
        if (cablesData.landmarks && cablesData.landmarks.length > 0) {
            DATA = [cablesData]; // Store the whole object
        } else if (Array.isArray(cablesData) && cablesData.length > 0) {
            DATA = [cablesData]; // Store as direct array of landmarks
        } else {
            LIVEMODE = false;
            return;
        }
        index = 0;
        p.loop(); // Ensure drawing loop runs
    };

    p.setup = function () {
        p.createCanvas(p.width || currentWidth, p.height || currentHeight);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.frameRate(30); // 30 fps gives motion a weightier, more dance-like tempo
    };

    p.draw = function () {
        // Low-opacity background lets old particles linger as long fading trails
        p.background(230, 30, 5, 8);

        let data_chunk = DATA[index];

        if (!data_chunk) {
            index = 0;
            _drawIdleMessage("Waiting for data…", "Start a data source in the control panel");
            return;
        }

        // Extract landmarks exactly like stickman.js
        let lm = null;
        if (Array.isArray(data_chunk)) {
            lm = data_chunk;
        } else {
            lm = data_chunk.landmarks || data_chunk.pose || data_chunk.poseLandmarks;
            if (lm && Array.isArray(lm[0])) {
                lm = lm[0];
            }
        }

        if (!lm || lm.length === 0) {
            _drawIdleMessage("Waiting for data…", "Start a data source in the control panel");
            return;
        }

        // ── Delicate background skeleton ─────────────────────────────────────────
        p.stroke(210, 30, 70, 10);
        p.strokeWeight(1);
        for (const [a, b] of CONNECTIONS) {
            if (!lm[a] || !lm[b]) continue;
            p.line(lm[a].x * p.width, lm[a].y * p.height, lm[b].x * p.width, lm[b].y * p.height);
        }

        // ── Emit soft trail particles from moving joints ──────────────────────────
        if (_prevLandmarks) {
            for (const j of EMITTER_JOINTS) {
                const cur = lm[j];
                const prev = _prevLandmarks[j];
                if (!cur || !prev) continue;

                const dvx = (cur.x - prev.x) * p.width;
                const dvy = (cur.y - prev.y) * p.height;
                const speed = Math.sqrt(dvx * dvx + dvy * dvy);

                // Only emit above a quiet threshold — avoids noise from static poses.
                if (speed < 0.6) continue;

                // Hue: 180 (aqua) → 270 (soft violet) — entirely in the cool spectrum.
                const hue = p.constrain(p.map(speed, 0, 10, 180, 270), 180, 270);

                // At most 2–3 particles per joint per frame: gentle, continuous wisps.
                const burst = Math.min(Math.ceil(speed * 0.7), 3);
                const px = cur.x * p.width;
                const py = cur.y * p.height;

                for (let i = 0; i < burst; i++) {
                    if (_particles.length >= MAX_PARTICLES) break;
                    const spread = speed * 0.15; // tight cluster — stays close to the joint path
                    _particles.push({
                        x: px + p.random(-1.5, 1.5),
                        y: py + p.random(-1.5, 1.5),
                        vx: dvx * 0.05 + p.random(-spread, spread),
                        vy: dvy * 0.05 + p.random(-spread, spread),
                        life: 255,
                        size: p.random(2, 4.5),
                        hue,
                        speed,
                    });
                }

                // ── Subtle glow only at genuinely fast joints ────────────────────────
                if (speed > 6) {
                    p.noStroke();
                    const radius = 6 + speed * 1.5;
                    for (let r = radius; r > 0; r -= 5) {
                        const alpha = p.map(r, 0, radius, 0, 12); // very faint
                        p.fill(hue, 55, 90, alpha);
                        p.ellipse(px, py, r * 2, r * 2);
                    }
                }
            }
        }

        // ── Update and render particles ─────────────────────────────────────────
        p.noStroke();
        for (let i = _particles.length - 1; i >= 0; i--) {
            const part = _particles[i];
            part.x += part.vx;
            part.y += part.vy;
            // Gentle deceleration — particles glide rather than snap to a stop.
            part.vx *= 0.96;
            part.vy *= 0.96;
            // Slow fade: particles stay visible long enough to feel like flowing ribbons.
            part.life -= 1.8 + part.speed * 0.12;

            if (part.life <= 0) {
                _particles.splice(i, 1);
                continue;
            }

            const alpha = p.map(part.life, 0, 255, 0, 42); // dim and translucent throughout
            const sz = part.size * (part.life / 255);
            p.fill(part.hue, 55, 92, alpha);
            p.ellipse(part.x, part.y, sz, sz);
        }

        // Snapshot x/y/z per landmark for velocity calculation on the next frame.
        _prevLandmarks = lm.map((l) => (l ? { x: l.x, y: l.y, z: l.z } : null));

        // ── HUD ────────────────────────────────────────────────────────────────
        p.noStroke();
        p.fill(210, 15, 65, 55);
        p.textSize(11);
        p.textAlign(p.LEFT, p.TOP);
        p.textFont("monospace");
        p.text(
            "frame #" + (data_chunk.index || index) +
            "  |  source: " + (data_chunk.sourceName || "Cables") +
            "  |  particles: " + _particles.length,
            8, 8
        );
        p.textAlign(p.CENTER, p.CENTER);

        if (!LIVEMODE) {
            if (index >= DATA.length - 1) {
                index = 0;
            } else {
                index++;
            }
        }
    };

    function _drawIdleMessage(headline, sub) {
        p.noStroke();
        p.fill(210, 20, 60);
        p.textSize(18);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(headline, p.width / 2, p.height / 2);
        p.fill(210, 10, 45);
        p.textSize(13);
        p.text(sub, p.width / 2, p.height / 2 + 30);
        p.textSize(18);
    }
}