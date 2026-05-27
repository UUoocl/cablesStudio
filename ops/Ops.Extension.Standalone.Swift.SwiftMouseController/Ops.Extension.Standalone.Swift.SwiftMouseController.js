/**
 * Ops.Extension.Standalone.Swift.SwiftMouseController
 * Controls mouse cursor position, emits virtual button clicks/drags, and scrolls globally on macOS using a native background sidecar.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inEmit = op.inTrigger("Emit"),
    inMouseObj = op.inObject("Mouse Object"),
    
    outEmitted = op.outObject("Emitted Mouse"),
    outTrigger = op.outTrigger("On Emitted"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let cp = null;
let currentWs = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftMouseController] Terminating native Swift MouseController daemon...");
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
        op.log("[SwiftMouseController] Closing private WebSocket Server...");
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
            op.log("[SwiftMouseController] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftMouseController] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SwiftMouseController] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftMouseController] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftMouseController] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftMouseController/swift_bin/SwiftMouseController`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftMouseController] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftMouseController] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftMouseController] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftMouseController Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftMouseController Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftMouseController] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftMouseController] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftMouseController] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "emitted") {
            if (payload.status === "success") {
                outEmitted.set(payload.emitted || {});
                outTrigger.trigger();
            } else {
                op.logWarn("[SwiftMouseController] Mouse event emission failed: " + payload.message);
                outStatus.set("Emission Failed: " + payload.message);
            }
        }
    } catch (e) {
        op.logWarn("[SwiftMouseController] Error parsing sidecar response: " + String(e));
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inEmit.onTriggered = () => {
    if (!inActive.get() || !currentWs) {
        op.logWarn("[SwiftMouseController] Cannot emit: sidecar process is not active or connected.");
        return;
    }
    
    const obj = inMouseObj.get();
    if (!obj) {
        op.logWarn("[SwiftMouseController] Cannot emit: Mouse Object is null.");
        return;
    }
    
    const payload = {
        type: "emit"
    };
    
    // Support properties flexibly
    if (obj.x !== undefined && obj.x !== null) payload.x = Number(obj.x);
    if (obj.y !== undefined && obj.y !== null) payload.y = Number(obj.y);
    if (obj.button !== undefined && obj.button !== null) payload.button = String(obj.button);
    if (obj.action !== undefined && obj.action !== null) payload.action = String(obj.action);
    if (obj.scrollX !== undefined && obj.scrollX !== null) payload.scrollX = Number(obj.scrollX);
    if (obj.scrollY !== undefined && obj.scrollY !== null) payload.scrollY = Number(obj.scrollY);
    
    try {
        currentWs.send(JSON.stringify(payload));
    } catch (e) {
        op.logWarn("[SwiftMouseController] Failed to send emit message: " + String(e));
    }
};

op.onDelete = () => {
    stopServerAndProcess();
};
