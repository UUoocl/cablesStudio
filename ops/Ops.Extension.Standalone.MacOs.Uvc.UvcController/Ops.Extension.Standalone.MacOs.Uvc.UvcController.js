/**
 * Ops.Extension.Standalone.MacOs.Uvc.UvcController
 * 
 * Controls UVC PTZ cameras (pan, tilt, zoom, focus, exposure, white balance) on macOS using a native Swift sidecar daemon.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", true),
    inCameraTarget = op.inString("UVC Camera Target", "default"),
    inPollRate = op.inValue("Poll Rate Per Second", 30),
    inCommand = op.inString("Camera Control Command", "{}"),
    inTrigger = op.inTriggerButton("Trigger Update"),
    
    outTrigger = op.outTrigger("Trigger Out"),
    outResult = op.outObject("Result Object"),
    outProperties = op.outObject("Properties Object"),
    outPan = op.outNumber("Pan", 0),
    outTilt = op.outNumber("Tilt", 0),
    outZoom = op.outNumber("Zoom", 0),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inCameraTarget, inPollRate, inCommand, inTrigger]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger]);
op.setPortGroup("Telemetry", [outPan, outTilt, outZoom, outProperties, outResult]);

inCameraTarget.setUiAttribs({ "display": "dropdown", "values": ["default"] });

let wss = null;
let cp = null;
let currentWs = null;
let availableDevices = [];

function killProcess() {
    if (cp) {
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
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outStatus.set("Stopped");
}

function getBinaryPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Uvc.UvcController/swift_bin/CablesUvcController";
    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(relative);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, relative);
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[MacOs.Uvc.UvcController] Sidecar error: " + err.message);
            });
            
            sendConfigure();
            setTimeout(() => {
                sendCommand({ action: "list_devices" });
            }, 500);
        });

    } catch (e) {
        op.logError("[MacOs.Uvc.UvcController] Failed to start WebSocket server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    const binaryPath = getBinaryPath();
    if (!fs.existsSync(binaryPath)) {
        op.logError("[MacOs.Uvc.UvcController] Native binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {}

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    outStatus.set("Launching...");

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        outRunning.set(true);
        outStatus.set("Running");

        cp.stdout.on("data", () => {});
        cp.stderr.on("data", () => {});

        cp.on("error", (err) => {
            op.logError("[MacOs.Uvc.UvcController] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code) => {
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[MacOs.Uvc.UvcController] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function sendConfigure() {
    if (currentWs) {
        const targetName = inCameraTarget.get();
        const dev = availableDevices.find((d) => d.name === targetName);
        const idx = dev ? dev.index : 0;
        
        const configMsg = {
            type: "configure",
            config: {
                name: targetName,
                index: idx,
                pollingEnabled: inActive.get(),
                pollsPerSecond: inPollRate.get(),
                mapEnabled: false,
                mapMin: 0,
                mapMax: 1
            }
        };
        try {
            currentWs.send(JSON.stringify(configMsg));
        } catch (e) {}
    }
}

function sendCommand(payload) {
    if (currentWs) {
        try {
            currentWs.send(JSON.stringify({
                type: "command",
                payload: payload
            }));
        } catch (e) {}
    }
}

inCameraTarget.onChange = sendConfigure;
inPollRate.onChange = sendConfigure;
inActive.onChange = () => {
    if (inActive.get()) {
        if (!cp) startServerAndProcess();
        else sendConfigure();
    } else {
        stopServerAndProcess();
    }
};

function handleTextMessage(str) {
    try {
        const json = JSON.parse(str);

        if (json.type === "devices") {
            const list = json.devices || [];
            availableDevices = list;
            const names = list.map((d) => d.name);
            if (names.length === 0) names.push("default");
            
            inCameraTarget.setUiAttribs({ "values": names });
            if (!names.includes(inCameraTarget.get())) {
                inCameraTarget.set(names[0]);
            }
        } else if (json.type === "result") {
            outResult.set(json.result);
            outTrigger.trigger();
        } else if (json.type === "update") {
            const props = json.properties || {};
            outProperties.set(props);

            if (props.absolute_pan_tilt && props.absolute_pan_tilt.current) {
                const pan = props.absolute_pan_tilt.current.pan;
                const tilt = props.absolute_pan_tilt.current.tilt;
                if (typeof pan === "number") outPan.set(pan);
                if (typeof tilt === "number") outTilt.set(tilt);
            }
            if (props.absolute_zoom && typeof props.absolute_zoom.current === "number") {
                outZoom.set(props.absolute_zoom.current);
            }

            outTrigger.trigger();
        } else if (json.type === "status") {
            if (json.message) outStatus.set(json.message);
        }
    } catch (e) {}
}

inTrigger.onTriggered = () => {
    const rawCmd = inCommand.get();
    if (!rawCmd) return;

    try {
        const parsed = JSON.parse(rawCmd);
        sendCommand(parsed);
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Invalid JSON in Camera Control Command: " + e.message);
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

setTimeout(() => {
    if (inActive.get()) {
        startServerAndProcess();
    }
}, 500);
