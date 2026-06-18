/**
 * Ops.Extension.Standalone.PythonContourShuttle
 * 
 * Interfacing with Contour ShuttlePRO v2 using a background Python daemon
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
        op.log("[PythonContourShuttle] Terminating background Python process...");
        try {
            cp.kill("SIGKILL");
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function launchProcess(port) {
    killProcess();
    if (!inActive.get()) return;

    const pythonExe = op.patch.pythonStandaloneExecutable || "python3";
    let scriptPath = `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonContourShuttle/python_script/shuttle_bridge.py`;

    if (op.patch && typeof op.patch.filePath === "function") {
        scriptPath = op.patch.filePath(scriptPath);
    }

    if (!fs.existsSync(scriptPath)) {
        op.logError("[PythonContourShuttle] Python script not found at: " + scriptPath);
        outStatus.set("Bridge Script Not Found");
        return;
    }

    const args = [scriptPath, "--port", String(port)];
    op.log("[PythonContourShuttle] Spawning Python process: " + pythonExe + " " + args.join(" "));

    try {
        cp = spawn(pythonExe, args);
        outRunning.set(true);

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[PythonContourShuttle Python stdout] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[PythonContourShuttle Python stderr] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[PythonContourShuttle] Spawn error: " + err.message);
            outStatus.set("Process Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[PythonContourShuttle] Process exited with code ${code}`);
            cp = null;
            outRunning.set(false);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening...") {
                outStatus.set(`Process Exited (Code: ${code})`);
            }
        });

    } catch (e) {
        op.logError("[PythonContourShuttle] Failed to spawn process: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[PythonContourShuttle] Closing private WebSocket Server...");
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
            op.log("[PythonContourShuttle] Private WebSocket Server listening on port " + port);
            outStatus.set("Listening...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[PythonContourShuttle] Python sidecar connected!");
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
                op.log("[PythonContourShuttle] Python sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outStatus.set("Disconnected");
                }
            });

            ws.on("error", (err) => {
                op.logError("[PythonContourShuttle] WebSocket connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[PythonContourShuttle] Failed to start WebSocket server: " + String(e));
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
            op.logError("[PythonContourShuttle] Python error: " + msg.message);
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
        op.logWarn("[PythonContourShuttle] Error parsing message: " + e + " | Message: " + str);
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
