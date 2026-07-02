const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    
    outHands = op.outArray("Hands Array"),
    outNumHands = op.outNumber("Detected Hands"),
    outTrigger = op.outTrigger("On Hands Detected"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let addon = null;
let isProcessing = false;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/human_hand.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[HumanHand] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[HumanHand] Failed to load native addon: " + e.message);
        return false;
    }
}

render.onTriggered = () => {
    if (!inActive.get()) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    // Backpressure Control: Skip frame if background thread is still processing previous frame
    if (isProcessing) return;

    if (!initAddon()) return;

    const width = tex.width;
    const height = tex.height;
    const gl = op.patch.cgl.gl;

    // Downsample target calculations (max 384px dimension for high performance hand tracking)
    const maxDimension = 384;
    let targetW = width;
    let targetH = height;

    if (width > maxDimension || height > maxDimension) {
        if (width > height) {
            targetW = maxDimension;
            targetH = Math.round((height * maxDimension) / width);
        } else {
            targetH = maxDimension;
            targetW = Math.round((width * maxDimension) / height);
        }
    }

    // Setup downsample GPU texture and FBO
    if (!op._downsampleTex || op._downsampleTex.width !== targetW || op._downsampleTex.height !== targetH) {
        if (op._downsampleTex) op._downsampleTex.dispose();
        op._downsampleTex = new CGL.Texture(op.patch.cgl, {
            width: targetW,
            height: targetH,
            filter: CGL.Texture.FILTER_LINEAR
        });
    }
    if (!op._downsampleFbo) op._downsampleFbo = gl.createFramebuffer();

    // Attach input texture to read framebuffer
    if (!op._fbo) op._fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._fbo);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

    // Attach downsample texture to draw framebuffer
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, op._downsampleFbo);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, op._downsampleTex.tex, 0);

    // Perform Blit downsampling completely on the GPU
    gl.blitFramebuffer(
        0, 0, width, height,
        0, 0, targetW, targetH,
        gl.COLOR_BUFFER_BIT,
        gl.LINEAR
    );

    // Allocate CPU buffer for downsampled dimensions
    if (!op._pixelBuffer || op._pixelBuffer.length !== targetW * targetH * 4) {
        op._pixelBuffer = new Uint8Array(targetW * targetH * 4);
    }

    // Read the smaller pixel buffer (15x faster GPU-to-CPU transfer)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
    gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    try {
        isProcessing = true;
        
        // Pass JS Buffer directly to C++ memory space (zero-copy) and run on libuv background threads
        const bufferWrapper = Buffer.from(op._pixelBuffer.buffer, op._pixelBuffer.byteOffset, op._pixelBuffer.byteLength);
        
        addon.track(bufferWrapper, targetW, targetH)
            .then(hands => {
                isProcessing = false;
                outHands.set(hands || []);
                outNumHands.set(hands ? hands.length : 0);
                outTrigger.trigger();
            })
            .catch(err => {
                isProcessing = false;
                op.logError("[HumanHand] Hand pose background tracking failed: " + err.message);
                outStatus.set("Processing Error");
            });
            
    } catch (e) {
        isProcessing = false;
        op.logWarn("[HumanHand] Failed to invoke native hand tracker: " + e.message);
    }
};

inActive.onChange = () => {
    if (inActive.get()) {
        if (initAddon()) {
            outRunning.set(true);
            outStatus.set("Running");
        }
    } else {
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

op.onDelete = () => {
    const gl = op.patch.cgl.gl;
    if (op._fbo) {
        try { gl.deleteFramebuffer(op._fbo); } catch (e) {}
        op._fbo = null;
    }
    if (op._downsampleFbo) {
        try { gl.deleteFramebuffer(op._downsampleFbo); } catch (e) {}
        op._downsampleFbo = null;
    }
    if (op._downsampleTex) {
        op._downsampleTex.dispose();
        op._downsampleTex = null;
    }
};

// Initialize status
if (inActive.get()) {
    if (initAddon()) {
        outRunning.set(true);
        outStatus.set("Running");
    }
} else {
    outStatus.set("Stopped");
}
