/**
 * Ops.Extension.Standalone.Swift.SwiftMouseMonitor
 * Operator that connects to the native macOS backend server via WebSockets
 * to stream high-frequency global mouse movements, click states, and scrolls.
 * Automatically manages spawning and stopping its native background sidecar daemon.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inHost = op.inString("Hostname", "127.0.0.1"),
    inPort = op.inInt("Port", 8080),
    inPps = op.inInt("PPS Limit", 20),
    inChannel = op.inString("Channel Name", "mouseEvents"),

    outUpdate = op.outTrigger("On Update"),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outClick = op.outString("Click", ""),
    outScrollDeltaX = op.outNumber("Scroll Delta X", 0),
    outScrollDeltaY = op.outNumber("Scroll Delta Y", 0),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let ws = null;
let reconnectTimeout = null;
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
    outStatus.set("Stopped");
}

function launchProcess() {
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

    const host = inHost.get() || "127.0.0.1";
    const port = inPort.get() || 8080;
    const pps = inPps.get() || 20;
    const channel = inChannel.get() || "mouseEvents";
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
            killProcess();
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
        killProcess();
    }
}

function closeSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (ws) {
        op.log("[SwiftMouseMonitor] Closing WebSocket connection.");
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) { }
        ws = null;
    }
}

function connectSocket() {
    closeSocket();
    if (!inActive.get()) return;

    const host = inHost.get() || "127.0.0.1";
    const port = inPort.get() || 8080;
    const url = `ws://${host}:${port}/events`;

    op.log(`[SwiftMouseMonitor] Connecting to WebSocket at ${url}...`);

    try {
        ws = new WebSocket(url);

        ws.onopen = () => {
            op.log("[SwiftMouseMonitor] WebSocket connection established.");
            
            // Subscribe to the custom channel
            const channel = inChannel.get() || "mouseEvents";
            try {
                ws.send(JSON.stringify({
                    type: "subscribe",
                    channel: channel
                }));
                op.log(`[SwiftMouseMonitor] Subscribed to WebSocket channel: ${channel}`);
            } catch (e) {
                op.logWarn("[SwiftMouseMonitor] Failed to send subscription payload: " + String(e));
            }
        };

        ws.onmessage = (event) => {
            if (!event || !event.data) return;
            try {
                const envelope = JSON.parse(event.data);
                
                // standard flat pub/sub messages wrap payload inside the .data field
                const msg = envelope.type === "event" ? envelope.data : envelope;
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
        };

        ws.onerror = (err) => {
            op.logWarn("[SwiftMouseMonitor] WebSocket error encountered.");
        };

        ws.onclose = (event) => {
            op.log("[SwiftMouseMonitor] WebSocket connection closed.");
            ws = null;
            if (inActive.get()) {
                reconnectTimeout = setTimeout(() => { connectSocket(); }, 2000);
            }
        };

    } catch (e) {
        op.logError("[SwiftMouseMonitor] Failed to instantiate WebSocket: " + String(e));
        if (inActive.get()) {
            reconnectTimeout = setTimeout(() => { connectSocket(); }, 3000);
        }
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        launchProcess();
        setTimeout(connectSocket, 100);
    } else {
        closeSocket();
        killProcess();
    }
};

inHost.onChange = () => {
    if (inActive.get()) {
        launchProcess();
        setTimeout(connectSocket, 100);
    }
};

inPort.onChange = () => {
    if (inActive.get()) {
        launchProcess();
        setTimeout(connectSocket, 100);
    }
};

inPps.onChange = () => {
    if (inActive.get()) {
        launchProcess();
        setTimeout(connectSocket, 100);
    }
};

inChannel.onChange = () => {
    if (inActive.get()) {
        launchProcess();
        setTimeout(connectSocket, 100);
    }
};

// Ensure process is killed on parent exit
const handleProcessExit = () => {
    killProcess();
};

const hasProcess = typeof process !== "undefined";
if (hasProcess) {
    process.on("exit", handleProcessExit);
    process.on("SIGINT", handleProcessExit);
    process.on("SIGTERM", handleProcessExit);
}

op.onDelete = () => {
    closeSocket();
    killProcess();
    if (hasProcess) {
        try {
            process.off("exit", handleProcessExit);
            process.off("SIGINT", handleProcessExit);
            process.off("SIGTERM", handleProcessExit);
        } catch (e) {}
    }
};
