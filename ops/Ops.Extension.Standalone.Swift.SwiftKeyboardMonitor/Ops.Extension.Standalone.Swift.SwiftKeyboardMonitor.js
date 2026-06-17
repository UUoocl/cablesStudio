/**
 * Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor
 * Operator that connects to the native macOS backend server via WebSockets
 * to stream high-frequency global keyboard events and hotkey combos.
 * Automatically manages spawning and stopping its native background sidecar daemon.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),

    outPress = op.outTrigger("On Press"),
    outRelease = op.outTrigger("On Release"),
    outCombo = op.outString("Combo", ""),
    outKey = op.outString("Key", ""),
    outModifiers = op.outString("Modifiers", ""),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let currentWs = null;
let cp = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftKeyboardMonitor] Terminating background Swift Keyboard Monitor process...");
        try {
            cp.kill();
        } catch (e) { }
        cp = null;
    }
    outRunning.set(false);
}

function launchProcess(port) {
    killProcess();
    if (!inActive.get()) return;

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor/swift_bin/SwiftKeyboardMonitor`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftKeyboardMonitor] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftKeyboardMonitor] Warning setting execute permissions: " + String(e));
    }

    const host = "127.0.0.1";
    const channel = "keyboardEvents";
    const args = [
        "--host", host,
        "--port", String(port),
        "--channel", channel
    ];

    op.log("[SwiftKeyboardMonitor] Spawning sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftKeyboardMonitor Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftKeyboardMonitor Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftKeyboardMonitor] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftKeyboardMonitor] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftKeyboardMonitor] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftKeyboardMonitor] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) { }
        wss = null;
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
            op.log("[SwiftKeyboardMonitor] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftKeyboardMonitor] Swift sidecar connected!");
            currentWs = ws;

            // Send "setInfo" message immediately to complete handshaking
            try {
                ws.send(JSON.stringify({ type: "setInfo" }));
            } catch (e) {}

            ws.on("message", (message, isBinary) => {
                let text = "";
                if (!isBinary && typeof message === "string") {
                    text = message;
                } else if (message instanceof Buffer || (Buffer && Buffer.isBuffer(message))) {
                    text = message.toString();
                } else {
                    text = message.toString();
                }
                handleTextMessage(text);
            });

            ws.on("close", () => {
                op.log("[SwiftKeyboardMonitor] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftKeyboardMonitor] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftKeyboardMonitor] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function handleTextMessage(str) {
    if (!str) return;
    try {
        const envelope = JSON.parse(str);
        
        // Handle both pub/sub wrappers (envelope.type === "event" or "publish") and raw data
        const msg = envelope.type === "event" || envelope.type === "publish" ? envelope.data : envelope;
        
        if (msg.event === "press" || msg.type === "keyboardPress") {
            outCombo.set("");
            outKey.set("");
            outModifiers.set("");
            
            outCombo.set(msg.data?.combo || msg.combo || "");
            outKey.set(msg.data?.key || msg.key || "");
            outModifiers.set(msg.data?.modifiers || msg.modifiers || "");
            outPress.trigger();
        } else if (msg.event === "release" || msg.type === "keyboardRelease") {
            outCombo.set("");
            outKey.set("");
            outModifiers.set("");
            
            outCombo.set(msg.data?.combo || msg.combo || "");
            outKey.set(msg.data?.key || msg.key || "");
            outModifiers.set(msg.data?.modifiers || msg.modifiers || "");
            outRelease.trigger();
        }
    } catch (e) { }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

// Ensure process is killed on parent exit
const handleProcessExit = () => {
    stopServerAndProcess();
};

const hasProcess = typeof process !== "undefined";
if (hasProcess) {
    process.on("exit", handleProcessExit);
    process.on("SIGINT", handleProcessExit);
    process.on("SIGTERM", handleProcessExit);
}

op.onDelete = () => {
    stopServerAndProcess();
    if (hasProcess) {
        try {
            process.off("exit", handleProcessExit);
            process.off("SIGINT", handleProcessExit);
            process.off("SIGTERM", handleProcessExit);
        } catch (e) {}
    }
};
