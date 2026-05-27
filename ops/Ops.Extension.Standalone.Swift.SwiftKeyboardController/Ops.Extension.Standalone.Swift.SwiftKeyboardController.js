/**
 * Ops.Extension.Standalone.Swift.SwiftKeyboardController
 * Emits virtual keyboard keystrokes globally on macOS using CGEvent synthesis and a native background sidecar process.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inEmit = op.inTrigger("Emit"),
    inKeystrokeObj = op.inObject("Keystroke Object"),
    
    outCombo = op.outString("Emitted Keystroke", ""),
    outTrigger = op.outTrigger("On Emitted"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let cp = null;
let currentWs = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftKeyboardController] Terminating native Swift KeyboardController daemon...");
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
        op.log("[SwiftKeyboardController] Closing private WebSocket Server...");
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
            op.log("[SwiftKeyboardController] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftKeyboardController] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SwiftKeyboardController] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftKeyboardController] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftKeyboardController] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftKeyboardController/swift_bin/SwiftKeyboardController`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftKeyboardController] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftKeyboardController] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftKeyboardController] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftKeyboardController Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftKeyboardController Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftKeyboardController] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftKeyboardController] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftKeyboardController] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "emitted") {
            if (payload.status === "success") {
                outCombo.set(payload.combo);
                outTrigger.trigger();
            } else {
                op.logWarn("[SwiftKeyboardController] Keystroke emission failed: " + payload.message);
                outStatus.set("Emission Failed: " + payload.message);
            }
        }
    } catch (e) {
        op.logWarn("[SwiftKeyboardController] Error parsing sidecar response: " + String(e));
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
        op.logWarn("[SwiftKeyboardController] Cannot emit: sidecar process is not active or connected.");
        return;
    }
    
    const obj = inKeystrokeObj.get();
    if (!obj) {
        op.logWarn("[SwiftKeyboardController] Cannot emit: Keystroke Object is null.");
        return;
    }
    
    const key = obj.key || obj.Key || "";
    if (!key || String(key).trim() === "") {
        op.logWarn("[SwiftKeyboardController] Cannot emit: 'key' property is empty or missing in Keystroke Object.");
        return;
    }
    
    let modifiers = obj.modifier || obj.modifiers || obj.Modifier || obj.Modifiers || "";
    if (typeof modifiers === "string" && modifiers.toLowerCase() === "none") {
        modifiers = "";
    }
    
    try {
        const message = JSON.stringify({
            type: "emit",
            key: String(key),
            modifiers: String(modifiers)
        });
        currentWs.send(message);
    } catch (e) {
        op.logWarn("[SwiftKeyboardController] Failed to send emit message: " + String(e));
    }
};

op.onDelete = () => {
    stopServerAndProcess();
};
