/**
 * Ops.Extension.Standalone.MacOs.Hid.StreamDeckStretchedTexture
 * 
 * Captures a WebGL Texture and spans/stretches it across the entire physical key grid
 * of an Elgato Stream Deck device with correct key ordering and high-performance tile slicing.
 */

const
    inRender = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inConnection = op.inObject("Connection"),
    inTexture = op.inTexture("Texture"),
    inMaxFps = op.inFloat("Max FPS", 30),
    inQuality = op.inFloat("JPEG Quality", 0.85),
    inFlipY = op.inBool("Flip Y", true),
    inFlipTileX = op.inBool("Flip Tile X", true),

    outNext = op.outTrigger("Next"),
    outIsSending = op.outBool("Is Sending", false),
    outFps = op.outNumber("Actual FPS", 0);

op.setPortGroup("Target", [inConnection]);
op.setPortGroup("Rendering", [inRender, inTexture, inActive, outNext]);
op.setPortGroup("Settings", [inMaxFps, inQuality, inFlipY, inFlipTileX]);
op.setPortGroup("Diagnostics", [outIsSending, outFps]);

op.toWorkPortsNeedToBeLinked(inRender);

const cgl = op.patch.cgl;

let canvasTemp = null;
let ctxTemp = null;
let canvasGrid = null;
let ctxGrid = null;
let pixelBuffer = null;
let fbo = null;

let tileCanvases = [];
let tileContexts = [];

let lastFrameTime = 0;
let isTransferring = false;
let frameCount = 0;
let lastFpsUpdate = 0;

function cleanup() {
    canvasTemp = null;
    ctxTemp = null;
    canvasGrid = null;
    ctxGrid = null;
    pixelBuffer = null;
    tileCanvases = [];
    tileContexts = [];

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

    if (!inActive.get()) return;

    const conn = inConnection.get();
    const tex = inTexture.get();

    if (!conn || !tex || !tex.tex) return;

    const now = performance.now();
    const maxFps = Math.max(1, inMaxFps.get());
    const minFrameInterval = 1000 / maxFps;

    if (now - lastFrameTime < minFrameInterval) return;
    if (isTransferring) return;

    const gl = cgl.gl;
    const w = tex.width;
    const h = tex.height;

    if (w <= 0 || h <= 0) return;

    const cols = conn.cols || 5;
    const rows = conn.rows || 3;
    const kw = conn.key_width || conn.iconSize || 72;
    const kh = conn.key_height || conn.iconSize || 72;
    const totalKeys = cols * rows;

    const gridW = cols * kw;
    const gridH = rows * kh;

    // Allocate temporary readback buffer
    const byteLength = w * h * 4;
    if (!pixelBuffer || pixelBuffer.byteLength !== byteLength) {
        pixelBuffer = new Uint8Array(byteLength);
        canvasTemp = document.createElement("canvas");
        canvasTemp.width = w;
        canvasTemp.height = h;
        ctxTemp = canvasTemp.getContext("2d", { "willReadFrequently": true });
    }

    // Allocate master grid canvas
    if (!canvasGrid || canvasGrid.width !== gridW || canvasGrid.height !== gridH) {
        canvasGrid = document.createElement("canvas");
        canvasGrid.width = gridW;
        canvasGrid.height = gridH;
        ctxGrid = canvasGrid.getContext("2d");
    }

    // Allocate tile canvas cache
    if (tileCanvases.length !== totalKeys || tileCanvases[0]?.width !== kw) {
        tileCanvases = [];
        tileContexts = [];
        for (let i = 0; i < totalKeys; i++) {
            const c = document.createElement("canvas");
            c.width = kw;
            c.height = kh;
            tileCanvases.push(c);
            tileContexts.push(c.getContext("2d"));
        }
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

    // Flip and scale onto master grid canvas
    ctxGrid.clearRect(0, 0, gridW, gridH);

    if (inFlipY.get()) {
        ctxGrid.save();
        ctxGrid.translate(0, gridH);
        ctxGrid.scale(1, -1);
        ctxGrid.drawImage(canvasTemp, 0, 0, w, h, 0, 0, gridW, gridH);
        ctxGrid.restore();
    } else {
        ctxGrid.drawImage(canvasTemp, 0, 0, w, h, 0, 0, gridW, gridH);
    }

    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));

    lastFrameTime = now;
    isTransferring = true;
    outIsSending.set(true);

    // Slice each tile and upload with inverted row mapping (row 1 <-> row 3)
    const uploadPromises = [];

    for (let r = 0; r < rows; r++) {
        const sourceRow = rows - 1 - r; // Row 1 on Row 3, Row 3 on Row 1

        for (let c = 0; c < cols; c++) {
            const keyIndex = r * cols + c;
            const tCanvas = tileCanvases[keyIndex];
            const tCtx = tileContexts[keyIndex];

            if (tCanvas && tCtx) {
                tCtx.clearRect(0, 0, kw, kh);

                if (inFlipTileX.get()) {
                    tCtx.save();
                    tCtx.translate(kw, 0);
                    tCtx.scale(-1, 1);
                    tCtx.drawImage(canvasGrid, c * kw, sourceRow * kh, kw, kh, 0, 0, kw, kh);
                    tCtx.restore();
                } else {
                    tCtx.drawImage(canvasGrid, c * kw, sourceRow * kh, kw, kh, 0, 0, kw, kh);
                }

                if (typeof conn.fillKeyImage === "function") {
                    uploadPromises.push(conn.fillKeyImage(keyIndex, tCanvas, quality));
                } else if (typeof conn.send === "function") {
                    const dataUrl = tCanvas.toDataURL("image/jpeg", quality);
                    const base64 = dataUrl.split(",")[1];
                    if (base64) {
                        conn.send("set_key_image", { "key": keyIndex, "image": base64 });
                    }
                }
            }
        }
    }

    Promise.all(uploadPromises)
        .catch((e) => {
            op.logWarn("[MacOs.Hid.StreamDeckStretchedTexture] Upload error: " + e.message);
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
