/**
 * Ops.Extension.Standalone.Swift.SwiftContourShuttleXpress
 * 
 * Interfacing natively with Contour ShuttleXpress using compiled macOS Swift binary
 * communicating via WebSockets.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

const
    inActive = op.inBool("Active", false),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outRunning = op.outBool("Running", false),

    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),

    outShuttleValue = op.outNumber("Shuttle Value", 0),
    outShuttleMoved = op.outTrigger("Shuttle Moved"),

    outButtonIndex = op.outNumber("Button Index", -1),
    outButtonPressed = op.outBool("Button Pressed", false),
    outButtonEvent = op.outTrigger("Button Event");

let wss = null;
let currentWs = null;
let cp = null;

outRunning.set(false);

function killProcess() {
    if (cp) {
        op.log("[SwiftContourShuttleXpress] Terminating background Swift process...");
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

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftContourShuttleXpress/swift_bin/SwiftContourShuttleXpress`;

    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftContourShuttleXpress] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftContourShuttleXpress] Warning setting execute permissions: " + String(e));
    }

    const args = ["--port", String(port)];
    op.log("[SwiftContourShuttleXpress] Spawning sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });
        outRunning.set(true);

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SwiftContourShuttleXpress Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftContourShuttleXpress Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftContourShuttleXpress] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[SwiftContourShuttleXpress] Sidecar exited with code ${code}`);
            cp = null;
            outRunning.set(false);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening...") {
                outStatus.set(`Exited (Code ${code})`);
            }
        });

    } catch (e) {
        op.logError("[SwiftContourShuttleXpress] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftContourShuttleXpress] Closing private WebSocket Server...");
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
            op.log("[SwiftContourShuttleXpress] Private WebSocket Server listening on port " + port);
            outStatus.set("Listening...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftContourShuttleXpress] Swift sidecar connected!");
            currentWs = ws;
            outStatus.set("Connected");

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
                op.log("[SwiftContourShuttleXpress] Swift sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outStatus.set("Disconnected");
                }
            });

            ws.on("error", (err) => {
                op.logError("[SwiftContourShuttleXpress] Sidecar connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[SwiftContourShuttleXpress] Failed to start private server: " + String(e));
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
            }
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            op.logError("[SwiftContourShuttleXpress] Sidecar error: " + msg.message);
        } else if (msg.type === "shuttle") {
            outShuttleValue.set(msg.value);
            outShuttleMoved.trigger();
            outEvent.trigger();
        } else if (msg.type === "jog") {
            outJogDelta.set(msg.delta);
            outJogValue.set(msg.value);
            outJogTurned.trigger();
            outEvent.trigger();
        } else if (msg.type === "button") {
            outButtonIndex.set(msg.index);
            outButtonPressed.set(msg.pressed);
            outButtonEvent.trigger();
            outEvent.trigger();
        }
    } catch (e) {
        op.logWarn("[SwiftContourShuttleXpress] Error parsing message: " + e + " | Message: " + str);
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
