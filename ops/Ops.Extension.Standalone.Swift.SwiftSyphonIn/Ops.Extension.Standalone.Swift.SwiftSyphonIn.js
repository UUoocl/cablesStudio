/**
 * Ops.Extension.Standalone.Swift.SwiftSyphonIn
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
    
    outTex = op.outTexture("Texture"),
    outNext = op.outTrigger("Next"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outFound = op.outBool("Found"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

inServer.setUiAttribs({ "display": "dropdown", "values": ["None"] });

let wss = null;
let cp = null;
let texture = null;
let currentWs = null;
let servers = [];
let tempFilePath = null;

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
        op.log("[SwiftSyphonIn] Terminating native Swift Syphon process...");
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
        op.log("[SwiftSyphonIn] Closing private WebSocket Server...");
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
}

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            tempFilePath = path.join(getRamDiskPath(), "syphon_in_" + port + ".raw");
            op.log("[SwiftSyphonIn] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftSyphonIn] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message) => {
                handleTextMessage(message.toString());
            });

            ws.on("close", () => {
                op.log("[SwiftSyphonIn] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftSyphonIn] Sidecar connection error: " + err.message);
            });

            sendSelectionToSidecar();
        });

    } catch (e) {
        op.logError("[SwiftSyphonIn] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftSyphonIn/swift_bin/SwiftSyphonIn`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftSyphonIn] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftSyphonIn] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftSyphonIn] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftSyphonIn Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftSyphonIn Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftSyphonIn] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftSyphonIn] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftSyphonIn] Failed to spawn: " + String(e));
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
        op.logWarn("[SwiftSyphonIn] Error parsing message: " + String(e));
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
        op.log(`[SwiftSyphonIn] Selected server: ${name} (${appName})`);
    } catch (e) {
        op.logWarn("[SwiftSyphonIn] Failed to send selection: " + String(e));
    }
}

function handleFileFrame(width, height) {
    if (!tempFilePath) return;
    try {
        if (!fs.existsSync(tempFilePath)) return;
        const pixelData = fs.readFileSync(tempFilePath);
        
        if (!texture || texture.width !== width || texture.height !== height) {
            op.log("[SwiftSyphonIn] Creating texture: " + width + "x" + height);
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
        op.logWarn("[SwiftSyphonIn] Error handling file frame: " + String(e));
    }
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

inServer.onChange = sendSelectionToSidecar;

op.onDelete = () => {
    stopServerAndProcess();
    if (texture) {
        texture.dispose();
        texture = null;
    }
};
