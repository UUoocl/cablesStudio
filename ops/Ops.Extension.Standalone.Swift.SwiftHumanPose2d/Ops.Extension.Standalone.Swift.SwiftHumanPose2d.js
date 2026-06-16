/**
 * Ops.Extension.Standalone.Swift.SwiftHumanPose2d
 * Captures 2D human body pose joint landmarks in real-time using native Apple Vision neural tracking.
 */
const WebSocket = op.require("ws");
const { spawn, execSync } = op.require("child_process");
const fs = op.require("fs");
const os = op.require("os");
const path = op.require("path");

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

let wss = null;
let cp = null;
let currentWs = null;
let inFilePath = null;

function getRamDiskPath() {
    let ramDiskPath = "/Volumes/CablesRAMDisk";
    if (os.platform() === "darwin") {
        if (!fs.existsSync(ramDiskPath)) {
            try {
                op.log("[RAM Disk] Creating a 256MB RAM Disk at /Volumes/CablesRAMDisk...");
                const dev = execSync("hdiutil attach -nomount ram://524288").toString().trim();
                execSync(`diskutil erasevolume HFS+ "CablesRAMDisk" ${dev}`);
                op.log("[RAM Disk] RAM Disk successfully mounted.");
            } catch (e) {
                op.logWarn("[RAM Disk] Failed to mount RAM disk, falling back to temp dir: " + String(e));
                ramDiskPath = os.tmpdir();
            }
        }
    } else {
        ramDiskPath = os.tmpdir();
    }
    return ramDiskPath;
}

function killProcess() {
    if (cp) {
        op.log("[SwiftHumanPose2d] Terminating native Swift HumanPose2d daemon...");
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
        op.log("[SwiftHumanPose2d] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    if (inFilePath) {
        try {
            if (fs.existsSync(inFilePath)) fs.unlinkSync(inFilePath);
        } catch (e) {}
        inFilePath = null;
    }
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            const ramDiskPath = getRamDiskPath();
            inFilePath = path.join(ramDiskPath, "pose2d_in_" + port + ".raw");
            op.log("[SwiftHumanPose2d] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftHumanPose2d] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else if (message instanceof Buffer || (Buffer && Buffer.isBuffer(message))) {
                    handleTextMessage(message.toString());
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SwiftHumanPose2d] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftHumanPose2d] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftHumanPose2d] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftHumanPose2d/swift_bin/SwiftHumanPose2d`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftHumanPose2d] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftHumanPose2d] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftHumanPose2d] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftHumanPose2d Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftHumanPose2d Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftHumanPose2d] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftHumanPose2d] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftHumanPose2d] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

let isProcessing = false;

function handleTextMessage(str) {
    isProcessing = false; // Release backpressure flag
    
    try {
        const poses = JSON.parse(str);
        outPoses.set(poses || []);
        outNumPoses.set(poses ? poses.length : 0);
        outTrigger.trigger();
    } catch (e) {
        op.logWarn("[SwiftHumanPose2d] Error parsing sidecar response: " + String(e));
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

render.onTriggered = () => {
    if (!inActive.get() || !currentWs) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    // 1. Backpressure: Skip frame if sidecar is busy processing previous frame
    if (isProcessing) return;

    if (currentWs) {
        const width = tex.width;
        const height = tex.height;
        const gl = op.patch.cgl.gl;

        // 2. Downsample target calculations (dynamic maxDimension for performance/precision scaling)
        const maxDimension = inMaxDimension.get();
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

        // 8. Read the smaller pixel buffer (15x faster GPU-to-CPU transfer)
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
        gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 9. Write pixels to RAM Disk file and send notification trigger with parameters
        try {
            isProcessing = true;
            fs.writeFileSync(inFilePath, op._pixelBuffer);
            currentWs.send(JSON.stringify({
                type: "frame",
                width: targetW,
                height: targetH,
                minConfidence: inMinConfidence.get(),
                roiX: inRoiX.get(),
                roiY: inRoiY.get(),
                roiWidth: inRoiWidth.get(),
                roiHeight: inRoiHeight.get()
            }));
        } catch (e) {
            isProcessing = false;
            op.logWarn("[SwiftHumanPose2d] Failed to stream frame: " + String(e));
        }
    }
};

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
    if (op._downsampleTex) {
        op._downsampleTex.dispose();
        op._downsampleTex = null;
    }
};
