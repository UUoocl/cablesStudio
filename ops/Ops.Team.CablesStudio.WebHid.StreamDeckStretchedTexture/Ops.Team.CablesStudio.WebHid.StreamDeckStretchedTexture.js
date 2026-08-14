/**
 * Ops.Team.CablesStudio.WebHid.StreamDeckStretchedTexture
 * 
 * Captures a WebGL texture, resizes/flips it to the overall display grid matrix of the Stream Deck, and uploads it via WebHID.
 */
const
    inRender = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inConnection = op.inObject("Connection"),
    inTexture = op.inTexture("Texture"),
    inQuality = op.inFloat("JPEG Quality", 0.85),
    next = op.outTrigger("Next");

op.setPortGroup("Target", [inConnection]);
op.setPortGroup("Texture", [inTexture, inActive, inQuality]);

op.toWorkPortsNeedToBeLinked(inRender);

const cgl = op.patch.cgl;

// Canvas cache for scaling and flipping
let canvasTemp = null;
let ctxTemp = null;
let canvasTarget = null;
let ctxTarget = null;
let pixelBuffer = null;
let fbo = null;

function cleanup() {
    canvasTemp = null;
    ctxTemp = null;
    canvasTarget = null;
    ctxTarget = null;
    pixelBuffer = null;
    
    if (fbo) {
        try {
            cgl.gl.deleteFramebuffer(fbo);
        } catch (e) {}
        fbo = null;
    }
}

op.onDelete = cleanup;

inRender.onTriggered = () => {
    next.trigger();
    
    if (!inActive.get()) return;
    
    const conn = inConnection.get();
    const tex = inTexture.get();
    
    if (!conn || !tex || !tex.tex) return;
    
    const gl = cgl.gl;
    const w = tex.width;
    const h = tex.height;
    
    if (w <= 0 || h <= 0) return;
    
    const cols = conn.cols || 5;
    const rows = conn.rows || 3;
    const kw = conn.key_width || 72;
    const kh = conn.key_height || 72;
    
    const gridW = cols * kw;
    const gridH = rows * kh;
    
    // Initialize or resize buffers
    if (!pixelBuffer || pixelBuffer.length !== w * h * 4) {
        pixelBuffer = new Uint8Array(w * h * 4);
    }
    
    if (!canvasTemp || canvasTemp.width !== w || canvasTemp.height !== h) {
        canvasTemp = document.createElement("canvas");
        canvasTemp.width = w;
        canvasTemp.height = h;
        ctxTemp = canvasTemp.getContext("2d");
    }
    
    if (!canvasTarget || canvasTarget.width !== gridW || canvasTarget.height !== gridH) {
        canvasTarget = document.createElement("canvas");
        canvasTarget.width = gridW;
        canvasTarget.height = gridH;
        ctxTarget = canvasTarget.getContext("2d");
    }
    
    // Bind texture to frame buffer to read pixels
    if (!fbo) fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);
    
    // Check if framebuffer is complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // Draw pixels to temp canvas
    const imgData = ctxTemp.createImageData(w, h);
    imgData.data.set(pixelBuffer);
    ctxTemp.putImageData(imgData, 0, 0);
    
    // Scale onto target grid canvas
    ctxTarget.clearRect(0, 0, gridW, gridH);
    ctxTarget.drawImage(canvasTemp, 0, 0, w, h, 0, 0, gridW, gridH);
    
    // Export target canvas to base64 JPEG
    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));
    const dataUrl = canvasTarget.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];
    
    if (base64) {
        conn.send("set_stretched_image", {
            "image": base64
        });
    }
};
