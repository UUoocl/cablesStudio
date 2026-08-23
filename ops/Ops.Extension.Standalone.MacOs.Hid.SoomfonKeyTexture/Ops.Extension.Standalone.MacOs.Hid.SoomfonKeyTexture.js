/**
 * Ops.Extension.Standalone.MacOs.Hid.SoomfonKeyTexture
 * 
 * Captures a WebGL Texture, formats/scales it to 60x60, and streams it to a specific LCD key
 * on a Soomfon controller via Ops.Extension.Standalone.MacOs.Hid.SoomfonController.
 */

const
    inRender = op.inTrigger("Render"),
    inConnection = op.inObject("Connection"),
    inTexture = op.inTexture("Texture"),
    inKeyIndex = op.inInt("Key Index", 0),
    inMaxFps = op.inFloat("Max FPS", 30),
    inQuality = op.inFloat("JPEG Quality", 0.85),
    inFlipY = op.inBool("Flip Y", true),
    inFlipX = op.inBool("Flip X", false),

    outNext = op.outTrigger("Next"),
    outIsSending = op.outBool("Is Sending", false),
    outFps = op.outNumber("Actual FPS", 0);

op.setPortGroup("Rendering", [inRender, inTexture, inKeyIndex, outNext]);
op.setPortGroup("Settings", [inConnection, inMaxFps, inQuality, inFlipY, inFlipX]);
op.setPortGroup("Diagnostics", [outIsSending, outFps]);

op.toWorkPortsNeedToBeLinked(inRender);

const cgl = op.patch.cgl;

let canvasTemp = null;
let ctxTemp = null;
let canvasTarget = null;
let ctxTarget = null;
let pixelBuffer = null;
let fbo = null;

let lastFrameTime = 0;
let isTransferring = false;
let frameCount = 0;
let lastFpsUpdate = 0;

function cleanup() {
    canvasTemp = null;
    ctxTemp = null;
    canvasTarget = null;
    ctxTarget = null;
    pixelBuffer = null;

    if (fbo && cgl && cgl.gl) {
        try {
            cgl.gl.deleteFramebuffer(fbo);
        } catch (e) {}
        fbo = null;
    }
}

op.onDelete = cleanup;

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

    if (w <= 0 || h <= 0) return;

    const kw = conn.key_width || conn.iconSize || 60;
    const kh = conn.key_height || conn.iconSize || 60;

    // Validate key index for the 6 display keys on Soomfon (0 to 5)
    const keyIdx = Math.max(0, Math.min(5, inKeyIndex.get()));

    // Allocate temporary readback buffer
    const byteLength = w * h * 4;
    if (!pixelBuffer || pixelBuffer.byteLength !== byteLength) {
        pixelBuffer = new Uint8Array(byteLength);
        canvasTemp = document.createElement("canvas");
        canvasTemp.width = w;
        canvasTemp.height = h;
        ctxTemp = canvasTemp.getContext("2d", { "willReadFrequently": true });
    }

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

    // Draw pixels to temp canvas
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

    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));

    lastFrameTime = now;
    isTransferring = true;
    outIsSending.set(true);

    const uploadPromise = (typeof conn.fillKeyImage === "function")
        ? conn.fillKeyImage(keyIdx, canvasTarget, quality)
        : (typeof conn.send === "function")
            ? Promise.resolve().then(() => {
                const dataUrl = canvasTarget.toDataURL("image/jpeg", quality);
                const base64 = dataUrl.split(",")[1];
                if (base64) {
                    conn.send("set_key_image", { "key": keyIdx, "image": base64 });
                }
            })
            : Promise.resolve();

    Promise.resolve(uploadPromise)
        .catch((e) => {
            op.logWarn("[MacOs.Hid.SoomfonKeyTexture] Upload error: " + e.message);
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
