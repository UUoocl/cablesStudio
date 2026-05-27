/**
 * Ops.Extension.Standalone.Swift.SwiftPersonSegmentation
 * Isolates a person from an input texture using native macOS Apple Vision,
 * outputting a high-quality person segmentation mask in real-time.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
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

inActive.onChange = () => {
    if (inActive.get()) {
        if (!wss && !cp) startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inQuality.onChange = () => {
    if (cp && inActive.get()) {
        op.log("[SwiftPersonSegmentation] Quality level changed to " + inQuality.get() + ". Restarting sidecar process...");
        startServerAndProcess();
    }
};

let wss = null;
let cp = null;
let currentWs = null;
let texture = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftPersonSegmentation] Terminating native Swift Segmentation process...");
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
        op.log("[SwiftPersonSegmentation] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SwiftPersonSegmentation] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftPersonSegmentation] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (isBinary || message instanceof Buffer || (Buffer && Buffer.isBuffer(message))) {
                    handleBinaryFrame(message);
                }
            });

            ws.on("close", () => {
                op.log("[SwiftPersonSegmentation] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftPersonSegmentation] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftPersonSegmentation] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftPersonSegmentation/swift_bin/SwiftPersonSegmentation`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftPersonSegmentation] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftPersonSegmentation] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port),
        "--quality", inQuality.get().toLowerCase()
    ];

    op.log("[SwiftPersonSegmentation] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftPersonSegmentation Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftPersonSegmentation Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftPersonSegmentation] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftPersonSegmentation] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftPersonSegmentation] Failed to spawn: " + String(e));
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

    // 1. Backpressure Control: Skip frame if sidecar is still processing previous frame
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

        // 2. Downsample target calculations (max 384px dimension for high performance)
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

        // 7. Allocate CPU buffer for downsampled dimensions
        if (!op._pixelBuffer || op._pixelBuffer.length !== targetW * targetH * 4) {
            op._pixelBuffer = new Uint8Array(targetW * targetH * 4);
        }

        // 8. Read the smaller pixel buffer (15x faster transfer)
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
        gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 9. Pack binary envelope
        const byteLength = 8 + op._pixelBuffer.length;
        const binaryPkg = new Uint8Array(byteLength);
        const view = new DataView(binaryPkg.buffer);

        view.setUint32(0, targetW, true);
        view.setUint32(4, targetH, true);
        binaryPkg.set(op._pixelBuffer, 8);

        // Send binary buffer to Swift sidecar
        try {
            isProcessing = true;
            currentWs.send(binaryPkg);
        } catch (e) {
            isProcessing = false;
            op.logWarn("[SwiftPersonSegmentation] Failed to stream frame: " + String(e));
        }
    }
};

function handleBinaryFrame(data) {
    isProcessing = false; // Release backpressure flag

    try {
        const buffer = data.buffer || data;
        const byteOffset = data.byteOffset || 0;
        const byteLength = data.byteLength || data.length;
        
        const view = new DataView(buffer, byteOffset, byteLength);
        
        const maskW = view.getUint32(0, true);
        const maskH = view.getUint32(4, true);
        
        if (maskW === 0 || maskH === 0) return;

        const gl = op.patch.cgl.gl;

        // 1. Upload received mask to a small temporary texture
        if (!op._maskSmallTex || op._maskSmallTex.width !== maskW || op._maskSmallTex.height !== maskH) {
            if (op._maskSmallTex) op._maskSmallTex.dispose();
            op._maskSmallTex = new CGL.Texture(op.patch.cgl, {
                width: maskW,
                height: maskH,
                filter: CGL.Texture.FILTER_LINEAR
            });
        }

        gl.bindTexture(gl.TEXTURE_2D, op._maskSmallTex.tex);
        const pixelData = new Uint8Array(buffer, byteOffset + 8, byteLength - 8);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            maskW,
            maskH,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixelData
        );

        // 2. Allocate/Resize output texture to MATCH THE ORIGINAL INPUT SIZE!
        const originalW = lastInputWidth || maskW;
        const originalH = lastInputHeight || maskH;

        if (!texture || texture.width !== originalW || texture.height !== originalH) {
            op.log("[SwiftPersonSegmentation] Creating upscale mask texture: " + originalW + "x" + originalH);
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
        op.logWarn("[SwiftPersonSegmentation] Error handling mask: " + String(e));
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
