/**
 * Ops.Extension.Standalone.Swift.SwiftStreamDeck
 * 
 * Interfacing natively with Elgato Stream Deck devices using compiled macOS Swift binary
 * communicating via WebSockets.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Settings", [inDeviceIndex]);

let wss = null;
let currentWs = null;
let cp = null;
outConnection.set(null);
outDeviceInfo.set(null);

function killProcess() {
    if (cp) {
        op.log("[SwiftStreamDeck] Terminating background Swift process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outIsConnected.set(false);
}

function launchProcess(port) {
    killProcess();
    if (!inActive.get()) return;

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftStreamDeck/swift_bin/SwiftStreamDeck`;

    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftStreamDeck] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftStreamDeck] Warning setting execute permissions: " + String(e));
    }

    const args = ["--port", String(port)];
    op.log("[SwiftStreamDeck] Spawning sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SwiftStreamDeck Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftStreamDeck Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftStreamDeck] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[SwiftStreamDeck] Sidecar exited with code ${code}`);
            cp = null;
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening...") {
                outStatus.set(`Exited (Code ${code})`);
            }
        });

    } catch (e) {
        op.logError("[SwiftStreamDeck] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftStreamDeck] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outConnection.set(null);
    outDeviceInfo.set(null);
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });

        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SwiftStreamDeck] Private WebSocket Server listening on port " + port);
            outStatus.set("Listening...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftStreamDeck] Swift sidecar connected!");
            currentWs = ws;
            
            // Automatically send connect action with device_index once Swift connects
            const connectPayload = {
                action: "connect",
                device_index: inDeviceIndex.get()
            };
            ws.send(JSON.stringify(connectPayload));

            // Connection bridge object exposed to texture writers
            const connection = {
                key_width: 72,
                key_height: 72,
                cols: 5,
                rows: 3,
                send(action, params) {
                    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                        try {
                            const payload = Object.assign({ "action": action }, params);
                            currentWs.send(JSON.stringify(payload));
                        } catch (e) {
                            op.logError("[SwiftStreamDeck] Failed writing to WebSocket: " + e);
                        }
                    }
                }
            };

            ws.on("message", (message, isBinary) => {
                let text = "";
                if (!isBinary && typeof message === "string") {
                    text = message;
                } else {
                    text = message.toString();
                }
                handleTextMessage(text, connection);
            });

            ws.on("close", () => {
                op.log("[SwiftStreamDeck] Swift sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outIsConnected.set(false);
                    outConnection.set(null);
                    outDeviceInfo.set(null);
                    outStatus.set("Disconnected");
                }
            });

            ws.on("error", (err) => {
                op.logError("[SwiftStreamDeck] Sidecar connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[SwiftStreamDeck] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function handleTextMessage(str, connection) {
    if (!str) return;
    try {
        const msg = JSON.parse(str);

        if (msg.type === "connected") {
            outIsConnected.set(true);
            outDeviceInfo.set(msg);
            
            // Update connection parameters based on actual device specifications
            connection.key_width = msg.key_width || 72;
            connection.key_height = msg.key_height || 72;
            connection.cols = msg.cols || 5;
            connection.rows = msg.rows || 3;
            
            outConnection.set(connection);
            outStatus.set("Connected to " + msg.model);
            op.log(`[SwiftStreamDeck] Connected to ${msg.model} (${msg.keys} keys)`);
        } else if (msg.type === "key_event") {
            outEventKeyIndex.set(msg.key);
            outEventPressed.set(msg.pressed);
            outKeyEvent.trigger();
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            outIsConnected.set(false);
            outConnection.set(null);
            op.logError("[SwiftStreamDeck] Sidecar error: " + msg.message);
        } else if (msg.type === "disconnected") {
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Disconnected");
        }
    } catch (e) {
        op.logWarn("[SwiftStreamDeck] Error parsing message: " + e + " | Message: " + str);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get() && currentWs && currentWs.readyState === WebSocket.OPEN) {
        const connectPayload = {
            action: "connect",
            device_index: inDeviceIndex.get()
        };
        currentWs.send(JSON.stringify(connectPayload));
    }
};

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
