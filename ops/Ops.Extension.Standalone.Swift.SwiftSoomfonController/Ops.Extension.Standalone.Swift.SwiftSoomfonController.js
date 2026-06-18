/**
 * Ops.Extension.Standalone.Swift.SwiftSoomfonController
 * 
 * Interfacing natively with Soomfon Stream Controller SE (Ajazz AKP03 clone) using compiled macOS Swift binary
 * communicating via WebSockets.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false),

    outKnobEvent = op.outTrigger("Knob Event"),
    outEventKnobIndex = op.outNumber("Event Knob Index", 0),
    outEventKnobDirection = op.outNumber("Event Knob Direction", 0),
    outKnob0Value = op.outNumber("Knob 0 Value", 0),
    outKnob1Value = op.outNumber("Knob 1 Value", 0),
    outKnob2Value = op.outNumber("Knob 2 Value", 0),

    outKnobClickEvent = op.outTrigger("Knob Click Event"),
    outEventKnobClickIndex = op.outNumber("Event Knob Click Index", 0),
    outEventKnobClickPressed = op.outBool("Event Knob Click Pressed", false);

op.setPortGroup("Controls", [inActive]);

let wss = null;
let currentWs = null;
let cp = null;

let knob0Val = 0;
let knob1Val = 0;
let knob2Val = 0;

outConnection.set(null);
outDeviceInfo.set(null);
resetKnobValues();

function resetKnobValues() {
    knob0Val = 0;
    knob1Val = 0;
    knob2Val = 0;
    outKnob0Value.set(0);
    outKnob1Value.set(0);
    outKnob2Value.set(0);
}

function killProcess() {
    if (cp) {
        op.log("[SwiftSoomfonController] Terminating background Swift process...");
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

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/swift_bin/SwiftSoomfonController`;

    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftSoomfonController] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftSoomfonController] Warning setting execute permissions: " + String(e));
    }

    const args = ["--port", String(port)];
    op.log("[SwiftSoomfonController] Spawning sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SwiftSoomfonController Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftSoomfonController Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftSoomfonController] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[SwiftSoomfonController] Sidecar exited with code ${code}`);
            cp = null;
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening...") {
                outStatus.set(`Exited (Code ${code})`);
            }
        });

    } catch (e) {
        op.logError("[SwiftSoomfonController] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftSoomfonController] Closing private WebSocket Server...");
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
    resetKnobValues();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });

        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SwiftSoomfonController] Private WebSocket Server listening on port " + port);
            outStatus.set("Listening...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftSoomfonController] Swift sidecar connected!");
            currentWs = ws;
            
            // Automatically send connect action once Swift connects
            ws.send(JSON.stringify({ action: "connect", device_index: 0 }));

            // Connection bridge object exposed to texture writers
            const connection = {
                key_width: 60,
                key_height: 60,
                cols: 3,
                rows: 2,
                send(action, params) {
                    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                        try {
                            const payload = Object.assign({ "action": action }, params);
                            currentWs.send(JSON.stringify(payload));
                        } catch (e) {
                            op.logError("[SwiftSoomfonController] Failed writing to WebSocket: " + e);
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
                op.log("[SwiftSoomfonController] Swift sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outIsConnected.set(false);
                    outConnection.set(null);
                    outDeviceInfo.set(null);
                    outStatus.set("Disconnected");
                }
            });

            ws.on("error", (err) => {
                op.logError("[SwiftSoomfonController] Sidecar connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[SwiftSoomfonController] Failed to start private server: " + String(e));
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
            outConnection.set(connection);
            outStatus.set("Connected");
            op.log(`[SwiftSoomfonController] Connected to ${msg.model}`);
        } else if (msg.type === "key_event") {
            outEventKeyIndex.set(msg.key);
            outEventPressed.set(msg.pressed);
            outKeyEvent.trigger();
        } else if (msg.type === "knob_turn") {
            outEventKnobIndex.set(msg.knob);
            outEventKnobDirection.set(msg.direction);
            if (msg.knob === 0) {
                knob0Val += msg.direction;
                outKnob0Value.set(knob0Val);
            } else if (msg.knob === 1) {
                knob1Val += msg.direction;
                outKnob1Value.set(knob1Val);
            } else if (msg.knob === 2) {
                knob2Val += msg.direction;
                outKnob2Value.set(knob2Val);
            }
            outKnobEvent.trigger();
        } else if (msg.type === "knob_click") {
            outEventKnobClickIndex.set(msg.knob);
            outEventKnobClickPressed.set(msg.pressed);
            outKnobClickEvent.trigger();
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            outIsConnected.set(false);
            outConnection.set(null);
            op.logError("[SwiftSoomfonController] Sidecar error: " + msg.message);
        } else if (msg.type === "disconnected") {
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Disconnected");
        }
    } catch (e) {
        op.logWarn("[SwiftSoomfonController] Error parsing message: " + e + " | Message: " + str);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
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
