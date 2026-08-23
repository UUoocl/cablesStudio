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
    inNormalize = op.inBool("Normalize", false),
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

op.setPortGroup("Controls", [inActive, inCameraTarget, inPollRate, inNormalize, inCommand, inTrigger]);
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
            outStatus.set("Connected");

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                if (currentWs === ws) currentWs = null;
                outStatus.set("Disconnected");
            });

            ws.on("error", (err) => {
                op.logError("[MacOs.Uvc.UvcController] Sidecar connection error: " + err.message);
            });
            
            // Request device list immediately
            sendConfigure();
            setTimeout(() => {
                sendCommand({ action: "list_devices" });
            }, 300);
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
                mapEnabled: inNormalize.get(),
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

function normalizeVal(val, min, max) {
    if (typeof val !== "number" || typeof min !== "number" || typeof max !== "number") return val;
    if (max === min) return 0;
    const norm = (val - min) / (max - min);
    return Math.max(0, Math.min(1, Math.round(norm * 10000) / 10000));
}

inCameraTarget.onChange = sendConfigure;
inPollRate.onChange = sendConfigure;
inNormalize.onChange = sendConfigure;
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
        const msg = JSON.parse(str);

        if (msg.type === "uvcResponse" && msg.action === "list_devices") {
            const list = Array.isArray(msg.data) ? msg.data : (msg.devices || []);
            availableDevices = list;
            const names = list.map((d) => d.name || `Device ${d.index}`);
            if (names.length === 0) names.push("default");
            
            inCameraTarget.setUiAttribs({ "values": names });
            if (names.length > 0 && (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "default")) {
                inCameraTarget.set(names[0]);
            }
            outStatus.set(`Connected (${list.length} devices found)`);
            sendConfigure();
        } else if (msg.type === "devices") {
            const list = msg.devices || [];
            availableDevices = list;
            const names = list.map((d) => d.name || `Device ${d.index}`);
            if (names.length === 0) names.push("default");
            
            inCameraTarget.setUiAttribs({ "values": names });
            if (names.length > 0 && (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "default")) {
                inCameraTarget.set(names[0]);
            }
            sendConfigure();
        } else if (msg.type === "uvc_poll") {
            outResult.set(msg.data);
            const props = {};
            const isNorm = inNormalize.get();

            if (Array.isArray(msg.data)) {
                msg.data.forEach((ctrl) => {
                    const name = ctrl.name || "";
                    if (name) {
                        props[name] = isNorm && ctrl["mapped-value"] !== undefined ? ctrl["mapped-value"] : ctrl["current-value"];
                    }
                    
                    const nameLower = name.toLowerCase();
                    const min = ctrl["minimum"];
                    const max = ctrl["maximum"];
                    const rawVal = ctrl["current-value"];
                    const mappedVal = ctrl["mapped-value"];

                    if (nameLower.includes("pan") || nameLower.includes("tilt")) {
                        if (typeof rawVal === "object" && rawVal !== null) {
                            if (rawVal.pan !== undefined) {
                                let p = rawVal.pan;
                                if (isNorm) {
                                    if (mappedVal && typeof mappedVal === "object" && mappedVal.pan !== undefined) {
                                        p = mappedVal.pan;
                                    } else if (min && max && typeof min === "object" && typeof max === "object" && min.pan !== undefined && max.pan !== undefined) {
                                        p = normalizeVal(p, min.pan, max.pan);
                                    }
                                }
                                outPan.set(p);
                            }
                            if (rawVal.tilt !== undefined) {
                                let t = rawVal.tilt;
                                if (isNorm) {
                                    if (mappedVal && typeof mappedVal === "object" && mappedVal.tilt !== undefined) {
                                        t = mappedVal.tilt;
                                    } else if (min && max && typeof min === "object" && typeof max === "object" && min.tilt !== undefined && max.tilt !== undefined) {
                                        t = normalizeVal(t, min.tilt, max.tilt);
                                    }
                                }
                                outTilt.set(t);
                            }
                        } else if (nameLower === "pan") {
                            let p = rawVal;
                            if (isNorm && min !== undefined && max !== undefined) {
                                p = (mappedVal !== undefined) ? mappedVal : normalizeVal(p, min, max);
                            }
                            outPan.set(p);
                        } else if (nameLower === "tilt") {
                            let t = rawVal;
                            if (isNorm && min !== undefined && max !== undefined) {
                                t = (mappedVal !== undefined) ? mappedVal : normalizeVal(t, min, max);
                            }
                            outTilt.set(t);
                        }
                    }
                    
                    if (nameLower.includes("zoom")) {
                        if (typeof rawVal === "number") {
                            let z = rawVal;
                            if (isNorm && min !== undefined && max !== undefined) {
                                z = (typeof mappedVal === "number") ? mappedVal : normalizeVal(z, min, max);
                            }
                            outZoom.set(z);
                        } else if (typeof rawVal === "object" && rawVal !== null && rawVal.zoom !== undefined) {
                            let z = rawVal.zoom;
                            if (isNorm) {
                                if (mappedVal && typeof mappedVal === "object" && mappedVal.zoom !== undefined) {
                                    z = mappedVal.zoom;
                                } else if (min && max && typeof min === "object" && typeof max === "object" && min.zoom !== undefined && max.zoom !== undefined) {
                                    z = normalizeVal(z, min.zoom, max.zoom);
                                }
                            }
                            outZoom.set(z);
                        }
                    }
                });
            }
            outProperties.set(props);
            outTrigger.trigger();
        } else {
            outResult.set(msg);
            outTrigger.trigger();
        }
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Error parsing sidecar message: " + e.message);
    }
}

inTrigger.onTriggered = () => {
    if (!cp) {
        startServerAndProcess();
    }
    
    try {
        const cmd = JSON.parse(inCommand.get());
        sendCommand(cmd);
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Invalid JSON command: " + e.message);
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
