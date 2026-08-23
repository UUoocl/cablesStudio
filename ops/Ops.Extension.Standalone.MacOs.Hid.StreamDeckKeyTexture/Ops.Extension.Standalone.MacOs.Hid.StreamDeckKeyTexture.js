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
    inMaxFps = op.inFloat("Max FPS", 30),
    inQuality = op.inFloat("JPEG Quality", 0.88),
    inFlipY = op.inBool("Flip Y", true),
    inFlipX = op.inBool("Flip X", false),

    outNext = op.outTrigger("Next"),
    outIsSending = op.outBool("Is Sending", false),
    outFps = op.outNumber("Actual FPS", 0);

op.setPortGroup("Rendering", [inRender, inTexture, inKeyIndex, outNext]);
op.setPortGroup("Settings", [inConnection, inMaxFps, inQuality, inFlipY, inFlipX]);
op.setPortGroup("Diagnostics", [outIsSending, outFps]);

const cgl = op.patch.cgl;
let fbo = null;
let canvasTemp = null;
let ctxTemp = null;
let canvasTarget = null;
let ctxTarget = null;
let pixelBuffer = null;

let lastFrameTime = 0;
let isTransferring = false;
let frameCount = 0;
let lastFpsUpdate = 0;

inRender.onTriggered = () => {
    outNext.trigger();

    const conn = inConnection.get();
    if (!conn) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex || !tex.width || !tex.height) return;

    const now = performance.now();
    const maxFps = Math.max(1, inMaxFps.get());
    const minFrameInterval = 1000 / maxFps;

    if (now - lastFrameTime < minFrameInterval) return;
    if (isTransferring) return;

    const gl = cgl.gl;
    const w = tex.width;
    const h = tex.height;
    const kw = conn.iconSize || 72;
    const kh = conn.iconSize || 72;

    // Allocate temporary readback buffer
    const byteSize = w * h * 4;
    if (!pixelBuffer || pixelBuffer.byteLength !== byteSize) {
        pixelBuffer = new Uint8Array(byteSize);
        canvasTemp = document.createElement("canvas");
        canvasTemp.width = w;
        canvasTemp.height = h;
        ctxTemp = canvasTemp.getContext("2d", { "willReadFrequently": true });
    }

    // Allocate target key canvas
    if (!canvasTarget || canvasTarget.width !== kw || canvasTarget.height !== kh) {
        canvasTarget = document.createElement("canvas");
        canvasTarget.width = kw;
        canvasTarget.height = kh;
        ctxTarget = canvasTarget.getContext("2d");
    }

    // Read WebGL texture pixels via FBO
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

    // Orient and scale onto key canvas
    ctxTarget.clearRect(0, 0, kw, kh);

    const flipX = inFlipX.get();
    const flipY = inFlipY.get();

    if (flipX || flipY) {
        ctxTarget.save();
        ctxTarget.translate(flipX ? kw : 0, flipY ? kh : 0);
        ctxTarget.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctxTarget.drawImage(canvasTemp, 0, 0, w, h, 0, 0, kw, kh);
        ctxTarget.restore();
    } else {
        ctxTarget.drawImage(canvasTemp, 0, 0, w, h, 0, 0, kw, kh);
    }

    const keyIndex = inKeyIndex.get();
    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));

    lastFrameTime = now;
    isTransferring = true;
    outIsSending.set(true);

    const uploadPromise = (typeof conn.fillKeyImage === "function")
        ? conn.fillKeyImage(keyIndex, canvasTarget, quality)
        : Promise.resolve();

    uploadPromise
        .catch((e) => {
            op.logWarn("[MacOs.Hid.StreamDeckKeyTexture] Upload error: " + e.message);
        })
        .finally(() => {
            isTransferring = false;
            outIsSending.set(false);

            frameCount++;
            if (now - lastFpsUpdate >= 1000) {
                outFps.set(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
                frameCount = 0;
                lastFpsUpdate = now;
            }
        });
};

op.onDelete = () => {
    if (fbo && cgl && cgl.gl) {
        try { cgl.gl.deleteFramebuffer(fbo); } catch (e) {}
        fbo = null;
    }
    pixelBuffer = null;
    canvasTemp = null;
    ctxTemp = null;
    canvasTarget = null;
    ctxTarget = null;
};
