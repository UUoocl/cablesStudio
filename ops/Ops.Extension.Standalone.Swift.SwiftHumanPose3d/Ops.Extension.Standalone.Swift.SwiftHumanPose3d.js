/**
 * Ops.Extension.Standalone.Swift.SwiftHumanPose3d
 * Captures 3D human body pose skeletal joint landmarks in real-time using native Apple Vision neural tracking.
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
        op.log("[SwiftHumanPose3d] Terminating native Swift HumanPose3d daemon...");
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
        op.log("[SwiftHumanPose3d] Closing private WebSocket Server...");
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
            inFilePath = path.join(ramDiskPath, "pose3d_in_" + port + ".raw");
            op.log("[SwiftHumanPose3d] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftHumanPose3d] Swift sidecar connected!");
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
                op.log("[SwiftHumanPose3d] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftHumanPose3d] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftHumanPose3d] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftHumanPose3d/swift_bin/SwiftHumanPose3d`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftHumanPose3d] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftHumanPose3d] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftHumanPose3d] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftHumanPose3d Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftHumanPose3d Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftHumanPose3d] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftHumanPose3d] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftHumanPose3d] Failed to spawn: " + String(e));
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
        op.logWarn("[SwiftHumanPose3d] Error parsing sidecar response: " + String(e));
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

        // 2. Downsample target calculations (max 384px dimension for high performance 3D pose extraction)
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

        // 8. Read the smaller pixel buffer (15x faster GPU-to-CPU transfer)
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, op._downsampleFbo);
        gl.readPixels(0, 0, targetW, targetH, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 9. Write pixels to RAM Disk file and send notification trigger
        try {
            isProcessing = true;
            fs.writeFileSync(inFilePath, op._pixelBuffer);
            currentWs.send(JSON.stringify({
                type: "frame",
                width: targetW,
                height: targetH
            }));
        } catch (e) {
            isProcessing = false;
            op.logWarn("[SwiftHumanPose3d] Failed to stream frame: " + String(e));
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
