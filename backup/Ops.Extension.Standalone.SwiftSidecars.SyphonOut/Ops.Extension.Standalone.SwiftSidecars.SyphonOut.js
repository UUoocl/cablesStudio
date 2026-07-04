/**
 * Ops.Extension.Standalone.SwiftSidecars.SyphonOut
 * Publishes a Cables WebGL texture as a native macOS Syphon server
 * utilizing a high-performance native Swift-backed sidecar process and Metal.
 */
const WebSocket = op.require("ws");
const { spawn, execSync } = op.require("child_process");
const fs = op.require("fs");
const os = op.require("os");
const path = op.require("path");

const
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    serverName = op.inString("Server Name", "Cables_Output"),
    inStreamMode = op.inValueSelect("Stream Mode", ["RGBA Texture", "WebRTC Stream"], "RGBA Texture"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped"),
    outWebRtcTrack = op.outObject("WebRTC Video Track", null);

let wss = null;
let cp = null;
let currentWs = null;
let lastWidth = 0;
let lastHeight = 0;
let lastServerName = "";
let tempFilePath = null;

// WebRTC state
let localPc = null;
let remotePc = null;
let senderReader = null;

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
        op.log("[SyphonOut] Terminating native Swift Syphon process...");
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
    if (wss) {
        op.log("[SyphonOut] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    if (tempFilePath) {
        try {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        } catch (e) {}
        tempFilePath = null;
    }
    outStatus.set("Stopped");
    closeWebRtcSender();
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            tempFilePath = path.join(getRamDiskPath(), "syphon_out_" + port + ".raw");
            op.log("[SyphonOut] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SyphonOut] Swift sidecar connected!");
            currentWs = ws;

            ws.on("close", () => {
                op.log("[SyphonOut] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SyphonOut] Sidecar connection error: " + err.message);
            });

            // Immediately send current server name and mode configurations
            sendServerNameConfig();
        });

    } catch (e) {
        op.logError("[SyphonOut] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonOut/swift_bin/SwiftSyphonOut`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SyphonOut] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SyphonOut] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SyphonOut] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SyphonOut Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SyphonOut Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SyphonOut] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SyphonOut] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SyphonOut] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function sendServerNameConfig() {
    if (!currentWs) return;
    const name = serverName.get() || "Cables_Output";
    try {
        currentWs.send(JSON.stringify({
            type: "serverName",
            name: name
        }));
        lastServerName = name;

        // Send active mode configuration
        const mode = inStreamMode.get() === "WebRTC Stream" ? "webrtc" : "rgba";
        currentWs.send(JSON.stringify({
            type: "config",
            mode: mode
        }));
    } catch (e) {
        op.logWarn("[SyphonOut] Failed to send server name: " + String(e));
    }
}

function setupWebRtcSender() {
    closeWebRtcSender();

    const canvas = op.patch.cgl.canvas;
    if (!canvas) return;

    // Capture the WebGL viewport canvas stream at 60fps
    const stream = canvas.captureStream(60);
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    localPc = new RTCPeerConnection({ encodedInsertableStreams: true });
    remotePc = new RTCPeerConnection();

    localPc.onicecandidate = (e) => {
        if (e.candidate) remotePc.addIceCandidate(e.candidate).catch(() => {});
    };
    remotePc.onicecandidate = (e) => {
        if (e.candidate) localPc.addIceCandidate(e.candidate).catch(() => {});
    };

    remotePc.ontrack = (e) => {
        outWebRtcTrack.set(e.track);
    };

    const sender = localPc.addTrack(track, stream);
    
    // Intercept H.264 packets via Insertable Streams
    const senderStreams = sender.createEncodedStreams();
    const readable = senderStreams.readable;
    senderReader = readable.getReader();

    function readEncodedFrames() {
        if (!senderReader) return;
        senderReader.read().then(({ done, value }) => {
            if (done) return;
            if (value && value.data) {
                const payload = new Uint8Array(value.data);
                const header = new Uint8Array(9);
                header[0] = (value.type === "key") ? 1 : 0;
                
                const view = new DataView(header.buffer);
                view.setBigUint64(1, BigInt(value.timestamp * 1000), true);
                
                const msgData = new Uint8Array(header.length + payload.length);
                msgData.set(header, 0);
                msgData.set(payload, header.length);

                if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                    currentWs.send(msgData);
                }
            }
            readEncodedFrames();
        }).catch(() => {});
    }
    readEncodedFrames();

    localPc.createOffer()
        .then(offer => localPc.setLocalDescription(offer))
        .then(() => remotePc.setRemoteDescription(localPc.localDescription))
        .then(() => remotePc.createAnswer())
        .then(answer => remotePc.setLocalDescription(answer))
        .then(() => localPc.setRemoteDescription(remotePc.localDescription))
        .catch(err => {
            op.logError("[SyphonOut WebRTC] Loopback negotiation failed: " + err.message);
        });
}

function closeWebRtcSender() {
    if (senderReader) {
        try { senderReader.cancel(); } catch(e) {}
        senderReader = null;
    }
    if (localPc) {
        try { localPc.close(); } catch(e) {}
        localPc = null;
    }
    if (remotePc) {
        try { remotePc.close(); } catch(e) {}
        remotePc = null;
    }
    outWebRtcTrack.set(null);
}

render.onTriggered = () => {
    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    // Lazy load the WebSocket server and sidecar client on first render call
    if (!wss && !cp) {
        startServerAndProcess();
        if (inStreamMode.get() === "WebRTC Stream") {
            setupWebRtcSender();
        }
        return;
    }

    if (currentWs) {
        const name = serverName.get() || "Cables_Output";
        if (name !== lastServerName) {
            sendServerNameConfig();
        }

        if (inStreamMode.get() === "RGBA Texture") {
            const width = tex.width;
            const height = tex.height;
            const gl = op.patch.cgl.gl;

            // Allocate buffer for reading texture pixels
            if (!op._pixelBuffer || op._pixelBuffer.length !== width * height * 4) {
                op._pixelBuffer = new Uint8Array(width * height * 4);
            }

            // Attach texture to a temporary FBO to perform gl.readPixels
            if (!op._fbo) op._fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, op._fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

            // Fetch uncompressed RGBA pixel data (Synchronous / CPU-bound)
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // Write the raw RGBA pixels directly to shared file synchronously
            if (tempFilePath) {
                try {
                    fs.writeFileSync(tempFilePath, op._pixelBuffer);
                    const payload = JSON.stringify({
                        type: "frame",
                        width: width,
                        height: height
                    });
                    currentWs.send(payload);
                } catch (e) {
                    op.logWarn("[SyphonOut] Failed to stream frame via RAM Disk: " + String(e));
                }
            }
        }
    }
};

inStreamMode.onChange = () => {
    sendServerNameConfig();
    if (inStreamMode.get() === "WebRTC Stream") {
        setupWebRtcSender();
    } else {
        closeWebRtcSender();
    }
};

serverName.onChange = () => {
    if (currentWs) {
        sendServerNameConfig();
    }
};

op.onDelete = () => {
    stopServerAndProcess();
    if (op._fbo) {
        try {
            op.patch.cgl.gl.deleteFramebuffer(op._fbo);
        } catch (e) {}
        op._fbo = null;
    }
};
