/**
 * Ops.Extension.Standalone.MacOs.Hid.StreamDeckKeyTexture
 * 
 * Captures any WebGL Texture in real time and streams it directly to a specific LCD key
 * on an Elgato Stream Deck device via Ops.Extension.Standalone.MacOs.Hid.StreamDeck.
 */

const
    inRender = op.inTrigger("Render"),
    inConnection = op.inObject("Connection"),
    inTexture = op.inTexture("Texture"),
    inKeyIndex = op.inInt("Key Index", 0),
    inMaxFps = op.inFloat("Max FPS", 0),
    inQuality = op.inFloat("JPEG Quality", 0.88),

    outNext = op.outTrigger("Next"),
    outLoaded = op.outTrigger("Loaded"),
    outIsSending = op.outBool("Is Sending", false),
    outFps = op.outNumber("Actual FPS", 0);

op.setPortGroup("Rendering", [inRender, inTexture, inKeyIndex, outNext, outLoaded]);
op.setPortGroup("Settings", [inConnection, inMaxFps, inQuality]);
op.setPortGroup("Diagnostics", [outIsSending, outFps]);

const cgl = op.patch.cgl;
let fbo = null;
let canvasTemp = null;
let ctxTemp = null;
let pixelBuffer = null;

let isTransferring = false;
let frameCount = 0;
let lastFpsUpdate = 0;
const lastKeyFrameTimes = new Map();
const queue = [];

function cleanup() {
    queue.length = 0;
    isTransferring = false;
    outIsSending.set(false);
    lastKeyFrameTimes.clear();

    if (fbo && cgl && cgl.gl) {
        try { cgl.gl.deleteFramebuffer(fbo); } catch (e) {}
        fbo = null;
    }
    pixelBuffer = null;
    canvasTemp = null;
    ctxTemp = null;
}

op.onDelete = cleanup;

async function processQueue() {
    if (isTransferring) return;
    if (queue.length === 0) return;

    const conn = inConnection.get();
    if (!conn) {
        queue.length = 0;
        return;
    }

    const task = queue.shift();
    isTransferring = true;
    outIsSending.set(true);

    try {
        const uploadPromise = (typeof conn.fillKeyImage === "function")
            ? conn.fillKeyImage(task.keyIndex, task.canvas, task.quality)
            : (typeof conn.send === "function"
                ? conn.send("set_key_image", { "key": task.keyIndex, "image": task.canvas })
                : Promise.resolve());

        if (uploadPromise && typeof uploadPromise.then === "function") {
            await uploadPromise;
        }
    } catch (e) {
        op.logWarn("[MacOs.Hid.StreamDeckKeyTexture] Upload error: " + (e ? e.message : e));
    } finally {
        isTransferring = false;
        outIsSending.set(false);

        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
            outFps.set(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
            frameCount = 0;
            lastFpsUpdate = now;
        }
    }

    // Trigger Loaded once device has finished loading and is completely ready for the next texture
    outLoaded.trigger();

    // Process any next queued tasks in rapid succession
    if (queue.length > 0 && !isTransferring) {
        processQueue();
    }
}

inRender.onTriggered = () => {
    outNext.trigger();

    const conn = inConnection.get();
    if (!conn) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex || !tex.width || !tex.height) return;

    const keyIndex = inKeyIndex.get();
    const maxFps = inMaxFps.get();
    const now = performance.now();

    if (maxFps > 0) {
        const minFrameInterval = 1000 / maxFps;
        const lastKeyTime = lastKeyFrameTimes.get(keyIndex) || 0;
        if (now - lastKeyTime < minFrameInterval) {
            return;
        }
    }
    lastKeyFrameTimes.set(keyIndex, now);

    const gl = cgl.gl;
    const w = tex.width;
    const h = tex.height;
    const kw = conn.iconSize || conn.key_width || 72;
    const kh = conn.iconSize || conn.key_height || 72;

    // Allocate temporary readback buffer
    const byteSize = w * h * 4;
    if (!pixelBuffer || pixelBuffer.byteLength !== byteSize) {
        pixelBuffer = new Uint8Array(byteSize);
        canvasTemp = document.createElement("canvas");
        canvasTemp.width = w;
        canvasTemp.height = h;
        ctxTemp = canvasTemp.getContext("2d", { "willReadFrequently": true });
    }

    // Read WebGL texture pixels synchronously during the current render pass
    if (!fbo) fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Put pixels into temp canvas
    const imgData = ctxTemp.createImageData(w, h);
    imgData.data.set(pixelBuffer);
    ctxTemp.putImageData(imgData, 0, 0);

    // Create an isolated target key canvas for this frame
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = kw;
    frameCanvas.height = kh;
    const frameCtx = frameCanvas.getContext("2d");

    frameCtx.drawImage(canvasTemp, 0, 0, w, h, 0, 0, kw, kh);

    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));
    const task = {
        keyIndex,
        canvas: frameCanvas,
        quality
    };

    // If an item for the same keyIndex is already waiting in queue, replace with latest
    const existingIdx = queue.findIndex((t) => t.keyIndex === keyIndex);
    if (existingIdx !== -1) {
        queue[existingIdx] = task;
    } else {
        queue.push(task);
    }

    processQueue();
};
