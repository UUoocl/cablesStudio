/**
 * Ops.Extension.Standalone.Swift.SwiftMouseMonitor
 * Operator that connects to the native macOS backend server via WebSockets
 * to stream high-frequency global mouse movements, click states, and scrolls.
 * Automatically manages spawning and stopping its native background sidecar daemon.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),
    inPps = op.inInt("PPS Limit", 20),

    outUpdate = op.outTrigger("On Update"),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outClick = op.outString("Click", ""),
    outScrollDeltaX = op.outNumber("Scroll Delta X", 0),
    outScrollDeltaY = op.outNumber("Scroll Delta Y", 0),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let currentWs = null;
let cp = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftMouseMonitor] Terminating background Swift Mouse Monitor process...");
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

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftMouseMonitor/swift_bin/SwiftMouseMonitor`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftMouseMonitor] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftMouseMonitor] Warning setting execute permissions: " + String(e));
    }

    const host = "127.0.0.1";
    const pps = inPps.get() || 20;
    const channel = "mouseEvents";
    const args = [
        "--host", host,
        "--port", String(port),
        "--pps", String(pps),
        "--channel", channel
    ];

    op.log("[SwiftMouseMonitor] Spawning sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftMouseMonitor Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftMouseMonitor Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftMouseMonitor] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftMouseMonitor] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftMouseMonitor] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftMouseMonitor] Closing private WebSocket Server...");
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
            op.log("[SwiftMouseMonitor] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftMouseMonitor] Swift sidecar connected!");
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
                op.log("[SwiftMouseMonitor] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftMouseMonitor] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftMouseMonitor] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function handleTextMessage(str) {
    if (!str) return;
    try {
        const envelope = JSON.parse(str);
        
        // Handle both pub/sub wrappers (envelope.type === "event" or "publish") and raw data
        const msg = envelope.type === "event" || envelope.type === "publish" ? envelope.data : envelope;
        let updated = false;

        if (msg.type === "mousePosition") {
            outPosX.set(msg.data.x);
            outPosY.set(msg.data.y);
            updated = true;
        } else if (msg.type === "mouseClick") {
            outPosX.set(msg.data.x);
            outPosY.set(msg.data.y);
            outClick.set(`${msg.data.button} ${msg.data.pressed ? "down" : "up"}`);
            updated = true;
        } else if (msg.type === "mouseScroll") {
            outPosX.set(msg.data.x);
            outPosY.set(msg.data.y);
            outScrollDeltaX.set(msg.data.dx);
            outScrollDeltaY.set(msg.data.dy);
            updated = true;
        }

        if (updated) {
            outUpdate.trigger();
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
inPps.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
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
