/**
 * Ops.Extension.Standalone.Swift.SwiftSyphonOut
 * Publishes a Cables WebGL texture as a native macOS Syphon server
 * utilizing a high-performance native Swift-backed sidecar process and Metal.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    serverName = op.inString("Server Name", "Cables_Output"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let cp = null;
let currentWs = null;
let lastWidth = 0;
let lastHeight = 0;
let lastServerName = "";

function killProcess() {
    if (cp) {
        op.log("[SwiftSyphonOut] Terminating native Swift Syphon process...");
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
        op.log("[SwiftSyphonOut] Closing private WebSocket Server...");
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
            op.log("[SwiftSyphonOut] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftSyphonOut] Swift sidecar connected!");
            currentWs = ws;

            ws.on("close", () => {
                op.log("[SwiftSyphonOut] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftSyphonOut] Sidecar connection error: " + err.message);
            });

            // Immediately send current server name configurations
            sendServerNameConfig();
        });

    } catch (e) {
        op.logError("[SwiftSyphonOut] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftSyphonOut/swift_bin/SwiftSyphonOut`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftSyphonOut] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftSyphonOut] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftSyphonOut] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftSyphonOut Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftSyphonOut Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftSyphonOut] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftSyphonOut] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftSyphonOut] Failed to spawn: " + String(e));
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
    } catch (e) {
        op.logWarn("[SwiftSyphonOut] Failed to send server name: " + String(e));
    }
}

render.onTriggered = () => {
    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    // Lazy load the WebSocket server and sidecar client on first render call
    if (!wss && !cp) {
        startServerAndProcess();
        return;
    }

    if (currentWs) {
        const name = serverName.get() || "Cables_Output";
        if (name !== lastServerName) {
            sendServerNameConfig();
        }

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

        // Fetch uncompressed RGBA pixel data
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Pack binary WebSocket envelope:
        // Bytes 0-3: width (UInt32 little-endian)
        // Bytes 4-7: height (UInt32 little-endian)
        // Bytes 8+: Raw RGBA bytes
        const byteLength = 8 + op._pixelBuffer.length;
        const binaryPkg = new Uint8Array(byteLength);
        const view = new DataView(binaryPkg.buffer);

        view.setUint32(0, width, true);
        view.setUint32(4, height, true);
        binaryPkg.set(op._pixelBuffer, 8);

        // Send binary buffer directly to the Swift sidecar at maximum frame rate
        try {
            currentWs.send(binaryPkg);
        } catch (e) {
            op.logWarn("[SwiftSyphonOut] Failed to stream frame: " + String(e));
        }
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
