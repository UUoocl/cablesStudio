/**
 * Ops.Extension.Standalone.Swift.SwiftBmdSpeedEditor
 * 
 * Interfacing natively with Blackmagic Design DaVinci Resolve Speed Editor
 * using compiled macOS Swift binary communicating via WebSockets.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),
    inButtonLeds = op.inInt("Button LEDs", 0),
    inJogLeds = op.inInt("Jog LEDs", 0),
    inJogMode = op.inInt("Jog Mode", 0),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outRunning = op.outBool("Running", false),
    outKeysPressed = op.outArray("Keys Pressed"),
    outKeyNames = op.outArray("Key Names"),
    outLastKey = op.outString("Last Key", ""),
    outLastKeyPressed = op.outBool("Last Key Pressed", false),
    outKeyEvent = op.outTrigger("Key Event"),
    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),
    outBatteryLevel = op.outNumber("Battery Level", 0),
    outCharging = op.outBool("Charging", false);

let wss = null;
let currentWs = null;
let cp = null;

outRunning.set(false);

function killProcess() {
    if (cp) {
        op.log("[SwiftBmdSpeedEditor] Terminating background Swift process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function launchProcess(port) {
    killProcess();
    if (!inActive.get()) return;

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftBmdSpeedEditor/swift_bin/SwiftBmdSpeedEditor`;

    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftBmdSpeedEditor] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftBmdSpeedEditor] Warning setting execute permissions: " + String(e));
    }

    const args = ["--port", String(port)];
    op.log("[SwiftBmdSpeedEditor] Spawning sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });
        outRunning.set(true);

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SwiftBmdSpeedEditor Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftBmdSpeedEditor Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftBmdSpeedEditor] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[SwiftBmdSpeedEditor] Sidecar exited with code ${code}`);
            cp = null;
            outRunning.set(false);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening...") {
                outStatus.set(`Exited (Code ${code})`);
            }
        });

    } catch (e) {
        op.logError("[SwiftBmdSpeedEditor] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function sendCommand(action, value) {
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        try {
            currentWs.send(JSON.stringify({ action, value }));
        } catch (e) {
            op.logWarn("[SwiftBmdSpeedEditor] Error sending command: " + String(e));
        }
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftBmdSpeedEditor] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
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
            op.log("[SwiftBmdSpeedEditor] Private WebSocket Server listening on port " + port);
            outStatus.set("Listening...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftBmdSpeedEditor] Swift sidecar connected!");
            currentWs = ws;
            outStatus.set("Connected");

            // Sync initial states
            sendCommand("set_leds", inButtonLeds.get());
            sendCommand("set_jog_leds", inJogLeds.get());
            sendCommand("set_jog_mode", inJogMode.get());

            ws.on("message", (message, isBinary) => {
                let text = "";
                if (!isBinary && typeof message === "string") {
                    text = message;
                } else {
                    text = message.toString();
                }
                handleTextMessage(text);
            });

            ws.on("close", () => {
                op.log("[SwiftBmdSpeedEditor] Swift sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outStatus.set("Disconnected");
                }
            });

            ws.on("error", (err) => {
                op.logError("[SwiftBmdSpeedEditor] Sidecar connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[SwiftBmdSpeedEditor] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function handleTextMessage(str) {
    if (!str) return;
    try {
        const msg = JSON.parse(str);

        if (msg.type === "info") {
            if (msg.status === "connected") {
                outStatus.set(`Connected: ${msg.device}`);
            } else if (msg.status === "searching") {
                outStatus.set("Searching...");
            }
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            op.logError("[SwiftBmdSpeedEditor] Sidecar error: " + msg.message);
        } else if (msg.type === "jog") {
            outJogDelta.set(msg.delta);
            outJogValue.set(msg.value);
            outJogTurned.trigger();
            outEvent.trigger();
        } else if (msg.type === "keys") {
            outKeysPressed.set(msg.codes);
            outKeyNames.set(msg.names);
            outEvent.trigger();
        } else if (msg.type === "key_event") {
            outLastKey.set(msg.name);
            outLastKeyPressed.set(msg.pressed);
            outKeyEvent.trigger();
            outEvent.trigger();
        } else if (msg.type === "battery") {
            outBatteryLevel.set(msg.level);
            outCharging.set(msg.charging);
            outEvent.trigger();
        }
    } catch (e) {
        op.logWarn("[SwiftBmdSpeedEditor] Error parsing message: " + e + " | Message: " + str);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inButtonLeds.onChange = () => {
    sendCommand("set_leds", inButtonLeds.get());
};

inJogLeds.onChange = () => {
    sendCommand("set_jog_leds", inJogLeds.get());
};

inJogMode.onChange = () => {
    sendCommand("set_jog_mode", inJogMode.get());
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
