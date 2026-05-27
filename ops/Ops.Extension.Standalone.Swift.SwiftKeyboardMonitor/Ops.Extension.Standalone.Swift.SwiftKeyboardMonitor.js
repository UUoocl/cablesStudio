/**
 * Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor
 * Operator that connects to the native macOS backend server via WebSockets
 * to stream high-frequency global keyboard events and hotkey combos.
 * Automatically manages spawning and stopping its native background sidecar daemon.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
console.log("Patch Asset folder",op.patch.config.prefixAssetPath)

const
    inActive = op.inBool("Active", false),
    inHost = op.inString("Hostname", "127.0.0.1"),
    inPort = op.inInt("Port", 8080),
    inChannel = op.inString("Channel Name", "keyboardEvents"),

    outPress = op.outTrigger("On Press"),
    outRelease = op.outTrigger("On Release"),
    outCombo = op.outString("Combo", ""),
    outKey = op.outString("Key", ""),
    outModifiers = op.outString("Modifiers", ""),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let ws = null;
let reconnectTimeout = null;
let cp = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftKeyboardMonitor] Terminating background Swift Keyboard Monitor process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
    outStatus.set("Stopped");
}

function launchProcess() {
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

    const host = inHost.get() || "127.0.0.1";
    const port = inPort.get() || 8080;
    const channel = inChannel.get() || "keyboardEvents";
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
            killProcess();
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
        killProcess();
    }
}

function closeSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (ws) {
        op.log("[SwiftKeyboardMonitor] Closing WebSocket connection.");
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) {}
        ws = null;
    }
}

function connectSocket() {
    closeSocket();
    if (!inActive.get()) return;

    const host = inHost.get() || "127.0.0.1";
    const port = inPort.get() || 8080;
    const url = `ws://${host}:${port}/events`;

    op.log(`[SwiftKeyboardMonitor] Connecting to WebSocket at ${url}...`);

    try {
        ws = new WebSocket(url);

        ws.onopen = () => {
            op.log("[SwiftKeyboardMonitor] WebSocket connection established.");
            
            // Subscribe to the custom channel
            const channel = inChannel.get() || "keyboardEvents";
            try {
                ws.send(JSON.stringify({
                    type: "subscribe",
                    channel: channel
                }));
                op.log(`[SwiftKeyboardMonitor] Subscribed to WebSocket channel: ${channel}`);
            } catch (e) {
                op.logWarn("[SwiftKeyboardMonitor] Failed to send subscription payload: " + String(e));
            }
        };

        ws.onmessage = (event) => {
            if (!event || !event.data) return;
            try {
                const envelope = JSON.parse(event.data);
                
                // standard flat pub/sub messages wrap payload inside the .data field
                const msg = envelope.type === "event" ? envelope.data : envelope;
                
                // Support both flat format from Swift (msg.event) and nested format (msg.type)
                const eventType = msg.type || msg.event;
                const dataObj = msg.data || msg;
                
                if (eventType === "keyboardPress" || eventType === "press") {
                    outCombo.set(dataObj.combo || "");
                    outKey.set(dataObj.key || "");
                    outModifiers.set(dataObj.modifiers || "");
                    outPress.trigger();
                } else if (eventType === "keyboardRelease" || eventType === "release") {
                    outCombo.set(dataObj.combo || "");
                    outKey.set(dataObj.key || "");
                    outModifiers.set(dataObj.modifiers || "");
                    outRelease.trigger();
                }
            } catch (e) {}
        };

        ws.onerror = (err) => {
            op.logWarn("[SwiftKeyboardMonitor] WebSocket error encountered.");
        };

        ws.onclose = (event) => {
            op.log("[SwiftKeyboardMonitor] WebSocket connection closed.");
            ws = null;
            if (inActive.get()) {
                reconnectTimeout = setTimeout(() => { connectSocket(); }, 2000);
            }
        };

    } catch (e) {
        op.logError("[SwiftKeyboardMonitor] Failed to instantiate WebSocket: " + String(e));
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
