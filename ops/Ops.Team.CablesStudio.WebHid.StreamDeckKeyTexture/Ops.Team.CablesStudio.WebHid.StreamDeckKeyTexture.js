/**
 * Ops.Team.CablesStudio.WebHid.StreamDeckKeyTexture
 * 
 * Captures a WebGL texture, resizes and y-flips it, and updates a specific key's display on the Stream Deck via WebHID.
 */
const
    inRender = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inConnection = op.inObject("Connection"),
    inKeyIndex = op.inInt("Key Index", 0),
    inTexture = op.inTexture("Texture"),
    inQuality = op.inFloat("JPEG Quality", 0.85),
    next = op.outTrigger("Next");

op.setPortGroup("Target", [inConnection, inKeyIndex]);
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
    
    const kw = conn.key_width || 72;
    const kh = conn.key_height || 72;
    
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
    
    if (!canvasTarget || canvasTarget.width !== kw || canvasTarget.height !== kh) {
        canvasTarget = document.createElement("canvas");
        canvasTarget.width = kw;
        canvasTarget.height = kh;
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
    
    // Scale onto target canvas
    ctxTarget.clearRect(0, 0, kw, kh);
    ctxTarget.drawImage(canvasTemp, 0, 0, w, h, 0, 0, kw, kh);
    
    // Export target canvas to base64 JPEG
    const quality = Math.max(0.1, Math.min(1.0, inQuality.get()));
    const dataUrl = canvasTarget.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];
    
    if (base64) {
        conn.send("set_key_image", {
            "key": inKeyIndex.get(),
            "image": base64
        });
    }
};
