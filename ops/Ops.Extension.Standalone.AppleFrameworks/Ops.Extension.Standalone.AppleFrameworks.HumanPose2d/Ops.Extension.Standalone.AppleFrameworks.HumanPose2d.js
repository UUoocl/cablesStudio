const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    inMinConfidence = op.inValueSlider("Min Confidence", 0.1),
    inMaxDimension = op.inValueSelect("Max Dimension", [128, 256, 384, 512, 640], 384),
    inRoiX = op.inValueSlider("ROI X", 0.0),
    inRoiY = op.inValueSlider("ROI Y", 0.0),
    inRoiWidth = op.inValueSlider("ROI Width", 1.0),
    inRoiHeight = op.inValueSlider("ROI Height", 1.0),
    
    outPoses = op.outArray("Poses Array"),
    outNumPoses = op.outNumber("Detected Poses"),
    outTrigger = op.outTrigger("On Poses Detected"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let addon = null;
let isProcessing = false;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/human_pose2d.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[HumanPose2d] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[HumanPose2d] Failed to load native addon: " + e.message);
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

    // Downsample target calculations based on selected Max Dimension
    const maxDimension = parseInt(inMaxDimension.get(), 10) || 384;
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
        
        addon.track(
            bufferWrapper,
            targetW,
            targetH,
            parseFloat(inMinConfidence.get()),
            parseFloat(inRoiX.get()),
            parseFloat(inRoiY.get()),
            parseFloat(inRoiWidth.get()),
            parseFloat(inRoiHeight.get())
        )
        .then(poses => {
            isProcessing = false;
            outPoses.set(poses || []);
            outNumPoses.set(poses ? poses.length : 0);
            outTrigger.trigger();
        })
        .catch(err => {
            isProcessing = false;
            op.logError("[HumanPose2d] Body pose background tracking failed: " + err.message);
            outStatus.set("Processing Error");
        });
            
    } catch (e) {
        isProcessing = false;
        op.logWarn("[HumanPose2d] Failed to invoke native body pose tracker: " + e.message);
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
