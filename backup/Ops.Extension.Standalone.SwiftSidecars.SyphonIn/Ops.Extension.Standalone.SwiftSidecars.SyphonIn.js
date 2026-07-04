/**
 * Ops.Extension.Standalone.SwiftSidecars.SyphonIn
 * Captures real-time Syphon video streams from other macOS applications
 * utilizing a high-performance native Swift-backed sidecar client process.
 */
const WebSocket = op.require("ws");
const { spawn, execSync } = op.require("child_process");
const fs = op.require("fs");
const os = op.require("os");
const path = op.require("path");

const
    inActive = op.inBool("Active", false),
    inServer = op.inString("Server", "None"),
    inStreamMode = op.inValueSelect("Stream Mode", ["RGBA Texture", "WebRTC Stream"], "RGBA Texture"),
    
    outTex = op.outTexture("Texture"),
    outNext = op.outTrigger("Next"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outFound = op.outBool("Found"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped"),
    outWebRtcTrack = op.outObject("WebRTC Video Track", null);

inServer.setUiAttribs({ "display": "dropdown", "values": ["None"] });

let wss = null;
let cp = null;
let texture = null;
let currentWs = null;
let servers = [];
let tempFilePath = null;

// WebRTC & WebCodecs state
let localPc = null;
let remotePc = null;
let trackGenerator = null;
let trackWriter = null;
let remoteVideoElement = null;
let decoder = null;

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
        op.log("[SyphonIn] Terminating native Swift Syphon process...");
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
        op.log("[SyphonIn] Closing private WebSocket Server...");
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
    
    closeDecoder();
    closeWebRtcLoopback();
}

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    if (inStreamMode.get() === "WebRTC Stream") {
        setupWebRtcLoopback();
        setupDecoder();
    }

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            tempFilePath = path.join(getRamDiskPath(), "syphon_in_" + port + ".raw");
            op.log("[SyphonIn] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SyphonIn] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (isBinary || message instanceof Buffer || ArrayBuffer.isView(message)) {
                    handleBinaryMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SyphonIn] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SyphonIn] Sidecar connection error: " + err.message);
            });

            sendSelectionToSidecar();
        });

    } catch (e) {
        op.logError("[SyphonIn] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonIn/swift_bin/SwiftSyphonIn`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SyphonIn] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SyphonIn] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SyphonIn] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SyphonIn Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SyphonIn Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SyphonIn] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SyphonIn] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SyphonIn] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "servers") {
            servers = payload.servers || [];
            const names = ["None"];
            servers.forEach(s => {
                const name = s.name || "Unnamed";
                const app = s.appName || "Unknown App";
                names.push(`${app}: ${name}`);
            });
            
            const currentSelected = inServer.get();
            inServer.setUiAttribs({ "values": names });
            
            outFound.set(servers.length > 0);
        } else if (payload.type === "frame") {
            const width = payload.width;
            const height = payload.height;
            if (width === 0 || height === 0) return;
            handleFileFrame(width, height);
        }
    } catch (e) {
        op.logWarn("[SyphonIn] Error parsing message: " + String(e));
    }
}

function handleBinaryMessage(data) {
    if (inStreamMode.get() !== "WebRTC Stream") return;
    if (!decoder || !trackWriter) return;

    try {
        const buffer = data.buffer || data;
        const view = new DataView(buffer, data.byteOffset || 0, data.byteLength || data.length);
        const isKey = view.getUint8(0) === 1;
        const timestamp = Number(view.getBigUint64(1, true)); 
        const h264Data = new Uint8Array(buffer, (data.byteOffset || 0) + 9, data.byteLength - 9);

        const chunk = new EncodedVideoChunk({
            type: isKey ? "key" : "delta",
            timestamp: timestamp,
            data: h264Data
        });
        decoder.decode(chunk);
    } catch (e) {
        op.logWarn("[SyphonIn Decoder] Decode error: " + String(e));
    }
}

function sendSelectionToSidecar() {
    if (!currentWs) return;

    const currentVal = inServer.get();
    if (!currentVal || currentVal === "None") {
        try {
            currentWs.send(JSON.stringify({ type: "select", name: "None" }));
        } catch (e) {}
        return;
    }

    const parts = currentVal.split(": ");
    const appName = parts[0];
    const name = parts.slice(1).join(": ");

    try {
        currentWs.send(JSON.stringify({
            type: "select",
            name: name,
            appName: appName
        }));
        op.log(`[SyphonIn] Selected server: ${name} (${appName})`);

        // Send active mode configuration
        const mode = inStreamMode.get() === "WebRTC Stream" ? "webrtc" : "rgba";
        currentWs.send(JSON.stringify({
            type: "config",
            mode: mode
        }));
    } catch (e) {
        op.logWarn("[SyphonIn] Failed to send selection: " + String(e));
    }
}

function handleFileFrame(width, height) {
    if (!tempFilePath) return;
    try {
        if (!fs.existsSync(tempFilePath)) return;
        const pixelData = fs.readFileSync(tempFilePath);
        
        if (!texture || texture.width !== width || texture.height !== height) {
            op.log("[SyphonIn] Creating texture: " + width + "x" + height);
            if (texture) texture.dispose();
            texture = new CGL.Texture(op.patch.cgl, {
                width: width,
                height: height,
                filter: CGL.Texture.FILTER_LINEAR,
            });
            outTex.set(texture);
        }

        outWidth.set(width);
        outHeight.set(height);

        const gl = op.patch.cgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture.tex);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixelData
        );

        outNext.trigger();
    } catch (e) {
        op.logWarn("[SyphonIn] Error handling file frame: " + String(e));
    }
}

// ----------------------------------------------------
// GPU-Accelerated WebRTC Stream Setup
// ----------------------------------------------------

function setupDecoder() {
    closeDecoder();

    decoder = new VideoDecoder({
        output: (videoFrame) => {
            if (trackWriter) {
                trackWriter.write(videoFrame);
            }
            videoFrame.close();
        },
        error: (err) => {
            op.logError("[SyphonIn Decoder] WebCodecs Error: " + err.message);
        }
    });

    decoder.configure({
        codec: "avc1.64001f", // H.264 High Profile
        optimizeForLatency: true
    });
}

function closeDecoder() {
    if (decoder) {
        try { decoder.close(); } catch(e) {}
        decoder = null;
    }
}

function setupWebRtcLoopback() {
    closeWebRtcLoopback();

    trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });
    trackWriter = trackGenerator.writable.getWriter();

    localPc = new RTCPeerConnection();
    remotePc = new RTCPeerConnection();

    localPc.onicecandidate = (e) => {
        if (e.candidate) remotePc.addIceCandidate(e.candidate).catch(() => {});
    };
    remotePc.onicecandidate = (e) => {
        if (e.candidate) localPc.addIceCandidate(e.candidate).catch(() => {});
    };

    remotePc.ontrack = (e) => {
        const stream = new MediaStream([e.track]);
        outWebRtcTrack.set(e.track);

        if (!remoteVideoElement) {
            remoteVideoElement = document.createElement("video");
            remoteVideoElement.autoplay = true;
            remoteVideoElement.playsInline = true;
            remoteVideoElement.muted = true;
            remoteVideoElement.style.position = "absolute";
            remoteVideoElement.style.top = "-9999px";
            remoteVideoElement.style.left = "-9999px";
            remoteVideoElement.style.width = "1px";
            remoteVideoElement.style.height = "1px";
            document.body.appendChild(remoteVideoElement);
        }
        remoteVideoElement.srcObject = stream;
        remoteVideoElement.play().then(() => {
            remoteVideoElement.requestVideoFrameCallback(onVideoFramePresented);
        }).catch(() => {});
    };

    localPc.addTrack(trackGenerator);

    localPc.createOffer()
        .then(offer => localPc.setLocalDescription(offer))
        .then(() => remotePc.setRemoteDescription(localPc.localDescription))
        .then(() => remotePc.createAnswer())
        .then(answer => remotePc.setLocalDescription(answer))
        .then(() => localPc.setRemoteDescription(remotePc.localDescription))
        .catch(err => {
            op.logError("[SyphonIn WebRTC] Loopback negotiation failed: " + err.message);
        });
}

function onVideoFramePresented() {
    if (!remoteVideoElement) return;
    
    uploadVideoFrameToTexture();
    
    if (remoteVideoElement) {
        remoteVideoElement.requestVideoFrameCallback(onVideoFramePresented);
    }
}

function uploadVideoFrameToTexture() {
    if (!remoteVideoElement || remoteVideoElement.readyState < 2) return;
    
    const width = remoteVideoElement.videoWidth;
    const height = remoteVideoElement.videoHeight;
    if (width === 0 || height === 0) return;

    if (!texture || texture.width !== width || texture.height !== height) {
        op.log("[SyphonIn WebRTC] Creating texture: " + width + "x" + height);
        if (texture) texture.dispose();
        texture = new CGL.Texture(op.patch.cgl, {
            width: width,
            height: height,
            filter: CGL.Texture.FILTER_LINEAR,
        });
        outTex.set(texture);
    }

    outWidth.set(width);
    outHeight.set(height);

    const gl = op.patch.cgl.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture.tex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        remoteVideoElement
    );

    outNext.trigger();
}

function closeWebRtcLoopback() {
    if (trackWriter) {
        try { trackWriter.releaseLock(); } catch(e) {}
        trackWriter = null;
    }
    if (trackGenerator) {
        try { trackGenerator.stop(); } catch(e) {}
        trackGenerator = null;
    }
    if (localPc) {
        try { localPc.close(); } catch(e) {}
        localPc = null;
    }
    if (remotePc) {
        try { remotePc.close(); } catch(e) {}
        remotePc = null;
    }
    if (remoteVideoElement) {
        try {
            remoteVideoElement.pause();
            remoteVideoElement.srcObject = null;
            if (remoteVideoElement.parentNode) {
                remoteVideoElement.parentNode.removeChild(remoteVideoElement);
            }
        } catch(e) {}
        remoteVideoElement = null;
    }
    outWebRtcTrack.set(null);
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
        if (texture) {
            texture.dispose();
            texture = null;
            outTex.set(null);
        }
    }
};

inStreamMode.onChange = () => {
    sendSelectionToSidecar();
    if (inActive.get()) {
        if (inStreamMode.get() === "WebRTC Stream") {
            setupWebRtcLoopback();
            setupDecoder();
        } else {
            closeWebRtcLoopback();
            closeDecoder();
        }
    }
};

inServer.onChange = sendSelectionToSidecar;

op.onDelete = () => {
    stopServerAndProcess();
    if (texture) {
        texture.dispose();
        texture = null;
    }
};
