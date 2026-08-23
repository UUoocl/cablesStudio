/**
 * Ops.Extension.Standalone.MacOs.AppleFramework.PersonSegmentation
 * 
 * Hardware-accelerated real-time person matte segmentation using macOS Apple Vision Framework and Apple Neural Engine.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    inActive = op.inBool("Active", true),
    inQuality = op.inValueSelect("Quality Level", ["Accurate", "Balanced", "Fast"], "Balanced"),
    
    outTex = op.outTexture("Segmentation Mask"),
    outNext = op.outTrigger("On Mask Ready"),
    outWidth = op.outNumber("Mask Width"),
    outHeight = op.outNumber("Mask Height"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Rendering", [render, inTexture, inActive, inQuality]);
op.setPortGroup("Outputs", [outNext, outTex, outWidth, outHeight]);
op.setPortGroup("Status", [outStatus, outRunning]);

let addon = null;
let texture = null;
let isProcessing = false;
let lastInputWidth = 0;
let lastInputHeight = 0;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.AppleFramework.PersonSegmentation/person_segmentation.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(relative);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, relative);
}

function initAddon() {
    if (addon) return true;

    const addonPath = getAddonPath();
    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MacOs.AppleFramework.PersonSegmentation] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.AppleFramework.PersonSegmentation] Failed to load native addon: " + e.message);
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
    if (!width || !height || width <= 0 || height <= 0) return;

    const gl = op.patch.cgl.gl;

    lastInputWidth = width;
    lastInputHeight = height;

    // Downsample target calculations (max 384px dimension for high performance)
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

    // Ensure even dimensions
    targetW = Math.max(16, targetW - (targetW % 2));
    targetH = Math.max(16, targetH - (targetH % 2));

    // Setup downsample GPU texture and FBO
    if (!op._downsampleTex || op._downsampleTex.width !== targetW || op._downsampleTex.height !== targetH) {
        if (op._downsampleTex) op._downsampleTex.dispose();
        op._downsampleTex = new CGL.Texture(op.patch.cgl, {
            "width": targetW,
            "height": targetH,
            "filter": CGL.Texture.FILTER_LINEAR
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

    // Read the smaller pixel buffer (15x faster transfer)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
    gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    try {
        isProcessing = true;
        const quality = (inQuality.get() || "Balanced").toLowerCase();
        
        // Pass JS Buffer directly to C++ memory space (zero-copy) and run on libuv background threads
        const bufferWrapper = Buffer.from(op._pixelBuffer.buffer, op._pixelBuffer.byteOffset, op._pixelBuffer.byteLength);
        
        addon.segment(bufferWrapper, targetW, targetH, quality)
            .then((result) => {
                handleMask(result.mask, result.width, result.height);
            })
            .catch((err) => {
                isProcessing = false;
                op.logError("[MacOs.AppleFramework.PersonSegmentation] Segmentation request failed: " + err.message);
                outStatus.set("Processing Error");
            });
            
    } catch (e) {
        isProcessing = false;
        op.logWarn("[MacOs.AppleFramework.PersonSegmentation] Failed to invoke native segment: " + e.message);
    }
};

function handleMask(maskBuffer, maskW, maskH) {
    isProcessing = false; // Release backpressure flag
    if (!inActive.get()) return;

    try {
        const gl = op.patch.cgl.gl;

        // 1. Upload received mask to a small temporary texture
        if (!op._maskSmallTex || op._maskSmallTex.width !== maskW || op._maskSmallTex.height !== maskH) {
            if (op._maskSmallTex) op._maskSmallTex.dispose();
            op._maskSmallTex = new CGL.Texture(op.patch.cgl, {
                "width": maskW,
                "height": maskH,
                "filter": CGL.Texture.FILTER_LINEAR
            });
        }

        gl.bindTexture(gl.TEXTURE_2D, op._maskSmallTex.tex);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            maskW,
            maskH,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            maskBuffer
        );

        // 2. Allocate/Resize output texture to MATCH THE ORIGINAL INPUT SIZE
        const originalW = lastInputWidth || maskW;
        const originalH = lastInputHeight || maskH;

        if (!texture || texture.width !== originalW || texture.height !== originalH) {
            if (texture) texture.dispose();
            texture = new CGL.Texture(op.patch.cgl, {
                "width": originalW,
                "height": originalH,
                "filter": CGL.Texture.FILTER_LINEAR,
            });
            outTex.set(texture);
        }

        outWidth.set(originalW);
        outHeight.set(originalH);

        // 3. Upscale temporary mask back to the original size on the GPU using FBO Blit
        if (!op._maskSmallFbo) op._maskSmallFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._maskSmallFbo);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, op._maskSmallTex.tex, 0);

        if (!op._maskUpscaleFbo) op._maskUpscaleFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, op._maskUpscaleFbo);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.tex, 0);

        gl.blitFramebuffer(
            0, 0, maskW, maskH,
            0, 0, originalW, originalH,
            gl.COLOR_BUFFER_BIT,
            gl.LINEAR
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        outNext.trigger();
    } catch (e) {
        op.logWarn("[MacOs.AppleFramework.PersonSegmentation] Error uploading mask: " + e.message);
    }
}

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
    if (op._maskSmallFbo) {
        try { gl.deleteFramebuffer(op._maskSmallFbo); } catch (e) {}
        op._maskSmallFbo = null;
    }
    if (op._maskUpscaleFbo) {
        try { gl.deleteFramebuffer(op._maskUpscaleFbo); } catch (e) {}
        op._maskUpscaleFbo = null;
    }
    
    if (op._downsampleTex) {
        op._downsampleTex.dispose();
        op._downsampleTex = null;
    }
    if (op._maskSmallTex) {
        op._maskSmallTex.dispose();
        op._maskSmallTex = null;
    }
    if (texture) {
        texture.dispose();
        texture = null;
    }
};

if (inActive.get()) {
    if (initAddon()) {
        outRunning.set(true);
        outStatus.set("Running");
    }
} else {
    outStatus.set("Stopped");
}
