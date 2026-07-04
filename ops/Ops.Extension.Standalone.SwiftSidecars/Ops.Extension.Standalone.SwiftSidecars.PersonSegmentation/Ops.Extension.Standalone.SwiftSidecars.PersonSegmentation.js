/**
 * Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation
 * Isolates a person from an input texture using native macOS Apple Vision,
 * outputting a high-quality person segmentation mask in real-time.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

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

inActive.onChange = () => {
    if (inActive.get()) {
        if (!wss && !cp) startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inQuality.onChange = () => {
    if (cp && inActive.get()) {
        op.log("[PersonSegmentation] Quality level changed to " + inQuality.get() + ". Restarting sidecar process...");
        startServerAndProcess();
    }
};

let wss = null;
let cp = null;
let currentWs = null;
let texture = null;

// Native IOSurface Addon state
let iosurfaceShared = null;
let sharedInputSurface = null;
let sharedInputBuffer = null;
let sharedInputSurfaceWidth = 0;
let sharedInputSurfaceHeight = 0;

try {
    const addonPath = path.join(
        op.patch.config.prefixAssetPath,
        "ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation/build/Release/iosurface_shared.node"
    );
    const resolvedPath = op.patch && typeof op.patch.filePath === "function" ? op.patch.filePath(addonPath) : addonPath;
    if (fs.existsSync(resolvedPath)) {
        iosurfaceShared = op.require(resolvedPath);
        op.log("[PersonSegmentation] Loaded native iosurface_shared addon.");
    } else {
        op.logWarn("[PersonSegmentation] Native addon not compiled yet at: " + resolvedPath);
    }
} catch (e) {
    op.logError("[PersonSegmentation] Error requiring native addon: " + String(e));
}

function killProcess() {
    if (cp) {
        op.log("[PersonSegmentation] Terminating native Swift Segmentation process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    isProcessing = false; // Reset backpressure flag
    if (wss) {
        op.log("[PersonSegmentation] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    sharedInputSurface = null;
    sharedInputBuffer = null;
    sharedInputSurfaceWidth = 0;
    sharedInputSurfaceHeight = 0;
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[PersonSegmentation] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[PersonSegmentation] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message) => {
                handleTextMessage(message.toString());
            });

            ws.on("close", () => {
                op.log("[PersonSegmentation] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[PersonSegmentation] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[PersonSegmentation] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation/swift_bin/SwiftPersonSegmentation`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[PersonSegmentation] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[PersonSegmentation] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port),
        "--quality", inQuality.get().toLowerCase()
    ];

    op.log("[PersonSegmentation] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
    outStatus.set("Launching...");

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        outRunning.set(true);
        outStatus.set("Running");

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[PersonSegmentation Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[PersonSegmentation Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[PersonSegmentation] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[PersonSegmentation] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[PersonSegmentation] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

let isProcessing = false;
let lastInputWidth = 0;
let lastInputHeight = 0;

render.onTriggered = () => {
    if (!inActive.get()) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    // 1. Backpressure Control
    if (isProcessing) return;

    // Lazy load the private server and child process
    if (!wss && !cp) {
        startServerAndProcess();
        return;
    }

    if (currentWs) {
        const width = tex.width;
        const height = tex.height;
        const gl = op.patch.cgl.gl;

        lastInputWidth = width;
        lastInputHeight = height;

        // 2. Downsample calculations (max 384px dimension for performance)
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

        // 3. Setup downsample GPU texture and FBO
        if (!op._downsampleTex || op._downsampleTex.width !== targetW || op._downsampleTex.height !== targetH) {
            if (op._downsampleTex) op._downsampleTex.dispose();
            op._downsampleTex = new CGL.Texture(op.patch.cgl, {
                width: targetW,
                height: targetH,
                filter: CGL.Texture.FILTER_LINEAR
            });
        }
        if (!op._downsampleFbo) op._downsampleFbo = gl.createFramebuffer();

        // 4. Attach input texture to read framebuffer
        if (!op._fbo) op._fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._fbo);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

        // 5. Attach downsample texture to draw framebuffer
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, op._downsampleFbo);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, op._downsampleTex.tex, 0);

        // 6. Perform Blit downsampling completely on the GPU
        gl.blitFramebuffer(
            0, 0, width, height,
            0, 0, targetW, targetH,
            gl.COLOR_BUFFER_BIT,
            gl.LINEAR
        );

        // Try hot-loading native addon if not loaded yet
        if (!iosurfaceShared) {
            try {
                const addonPath = path.join(
                    op.patch.config.prefixAssetPath,
                    "ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.PersonSegmentation/build/Release/iosurface_shared.node"
                );
                const resolvedPath = op.patch && typeof op.patch.filePath === "function" ? op.patch.filePath(addonPath) : addonPath;
                if (fs.existsSync(resolvedPath)) {
                    iosurfaceShared = op.require(resolvedPath);
                }
            } catch(e) {}
        }

        // 7. Allocate shared input surface
        if (!sharedInputSurface || sharedInputSurfaceWidth !== targetW || sharedInputSurfaceHeight !== targetH) {
            sharedInputSurface = null;
            sharedInputBuffer = null;
            if (iosurfaceShared) {
                try {
                    op.log(`[PersonSegmentation] Allocating input IOSurface: ${targetW}x${targetH}`);
                    sharedInputSurface = new iosurfaceShared.IOSurfaceWrap(targetW, targetH);
                    sharedInputBuffer = sharedInputSurface.getBuffer();
                    sharedInputSurfaceWidth = targetW;
                    sharedInputSurfaceHeight = targetH;
                } catch(e) {
                    op.logError("[PersonSegmentation] Failed to allocate input IOSurface: " + String(e));
                }
            }
        }

        if (sharedInputSurface && sharedInputBuffer) {
            try {
                isProcessing = true;

                // 8. Read the downsampled pixels directly into the shared surface memory
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
                sharedInputSurface.lock();
                gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, sharedInputBuffer);
                sharedInputSurface.unlock();

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                // 9. Send surface ID to Swift
                currentWs.send(JSON.stringify({
                    type: "surface",
                    id: sharedInputSurface.id,
                    width: targetW,
                    height: targetH
                }));
            } catch (e) {
                isProcessing = false;
                op.logWarn("[PersonSegmentation] Failed to stream frame via IOSurface: " + String(e));
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
};

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "mask") {
            const maskID = payload.id;
            const maskW = payload.width;
            const maskH = payload.height;
            if (maskW === 0 || maskH === 0) return;
            handleIosurfaceMask(maskID, maskW, maskH);
        }
    } catch (e) {
        op.logWarn("[PersonSegmentation] Error parsing text message: " + String(e));
    }
}

function handleIosurfaceMask(maskID, maskW, maskH) {
    isProcessing = false; // Release backpressure

    if (!iosurfaceShared) return;

    try {
        // 1. Lookup mask surface
        const sharedMaskSurface = new iosurfaceShared.IOSurfaceLookupWrap(maskID);
        const sharedMaskBuffer = sharedMaskSurface.getBuffer();

        if (!sharedMaskSurface || !sharedMaskBuffer) return;

        const gl = op.patch.cgl.gl;

        // 2. Upload received 1-channel mask to temporary small texture
        if (!op._maskSmallTex || op._maskSmallTex.width !== maskW || op._maskSmallTex.height !== maskH) {
            if (op._maskSmallTex) op._maskSmallTex.dispose();
            op._maskSmallTex = new CGL.Texture(op.patch.cgl, {
                width: maskW,
                height: maskH,
                filter: CGL.Texture.FILTER_LINEAR
            });
        }

        gl.bindTexture(gl.TEXTURE_2D, op._maskSmallTex.tex);

        sharedMaskSurface.lock();
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R8,
            maskW,
            maskH,
            0,
            gl.RED,
            gl.UNSIGNED_BYTE,
            sharedMaskBuffer
        );

        // Swizzle red channel across R, G, B channels and force alpha to 1.0 (opaque)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_SWIZZLE_R, gl.RED);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_SWIZZLE_G, gl.RED);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_SWIZZLE_B, gl.RED);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_SWIZZLE_A, gl.ONE);

        sharedMaskSurface.unlock();

        // 3. Allocate/Resize output texture to MATCH THE ORIGINAL INPUT SIZE
        const originalW = lastInputWidth || maskW;
        const originalH = lastInputHeight || maskH;

        if (!texture || texture.width !== originalW || texture.height !== originalH) {
            op.log("[PersonSegmentation] Creating upscale mask texture: " + originalW + "x" + originalH);
            if (texture) texture.dispose();
            texture = new CGL.Texture(op.patch.cgl, {
                width: originalW,
                height: originalH,
                filter: CGL.Texture.FILTER_LINEAR,
            });
            outTex.set(texture);
        }

        outWidth.set(originalW);
        outHeight.set(originalH);

        // 4. Upscale temporary mask back to original size on the GPU using FBO Blit
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
        op.logWarn("[PersonSegmentation] Error handling mask: " + String(e));
    }
}

op.onDelete = () => {
    stopServerAndProcess();
    
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
