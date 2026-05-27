/**
 * Ops.Extension.Standalone.Swift.SwiftUvcController
 * Controls UVC PTZ cameras (e.g. pan, tilt, zoom) using a native Swift sidecar.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

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

inCameraTarget.setUiAttribs({ "display": "dropdown", "values": ["default"] });

let wss = null;
let cp = null;
let currentWs = null;
let availableDevices = [];

function killProcess() {
    if (cp) {
        op.log("[SwiftUvcController] Terminating native Swift UvcController daemon...");
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
        op.log("[SwiftUvcController] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SwiftUvcController] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftUvcController] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SwiftUvcController] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftUvcController] Sidecar connection error: " + err.message);
            });
            
            // Reconfigure first, then list devices
            sendConfigure();
            setTimeout(() => {
                sendCommand({ action: "list_devices" });
            }, 500);
        });

    } catch (e) {
        op.logError("[SwiftUvcController] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftUvcController/swift_bin/SwiftUvcController`;
    
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftUvcController] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftUvcController] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftUvcController] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftUvcController Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftUvcController Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftUvcController] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftUvcController] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftUvcController] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function sendConfigure() {
    if (currentWs) {
        const targetName = inCameraTarget.get();
        const dev = availableDevices.find(d => d.name === targetName);
        const idx = dev ? dev.index : 0;
        
        const configMsg = {
            type: "configure",
            config: {
                name: targetName,
                index: idx,
                pollingEnabled: inActive.get(),
                pollsPerSecond: inPollRate.get(),
                mapEnabled: false, // matches Python implementation default
                mapMin: 0,
                mapMax: 1
            }
        };
        try {
            currentWs.send(JSON.stringify(configMsg));
        } catch (e) {
            op.logWarn("[SwiftUvcController] Failed to send configuration: " + String(e));
        }
    }
}

function sendCommand(payload) {
    if (currentWs) {
        try {
            currentWs.send(JSON.stringify({
                type: "command",
                payload: payload
            }));
        } catch (e) {
            op.logWarn("[SwiftUvcController] Failed to send command: " + String(e));
        }
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
        const msg = JSON.parse(str);
        
        if (msg.type === "uvcResponse" && msg.action === "list_devices") {
            if (Array.isArray(msg.data)) {
                availableDevices = msg.data;
                const names = msg.data.map(d => d.name);
                if (names.length === 0) names.push("default");
                inCameraTarget.setUiAttribs({ "values": names });
                
                if (names.length > 0 && (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "default")) {
                    inCameraTarget.set(names[0]);
                }
                sendConfigure();
            }
        } else if (msg.type === "uvc_poll") {
            outResult.set(msg.data);
            const props = {};
            if (Array.isArray(msg.data)) {
                msg.data.forEach(ctrl => {
                    const name = ctrl.name || "";
                    if (name) {
                        props[name] = ctrl['current-value'];
                    }
                    
                    const nameLower = name.toLowerCase();
                    if (nameLower.includes("pan") || nameLower.includes("tilt")) {
                        if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null) {
                            if (ctrl['current-value'].pan !== undefined) outPan.set(ctrl['current-value'].pan);
                            if (ctrl['current-value'].tilt !== undefined) outTilt.set(ctrl['current-value'].tilt);
                        } else if (nameLower === "pan") {
                            outPan.set(ctrl['current-value']);
                        } else if (nameLower === "tilt") {
                            outTilt.set(ctrl['current-value']);
                        }
                    }
                    
                    if (nameLower.includes("zoom")) {
                        if (typeof ctrl['current-value'] === 'number') {
                            outZoom.set(ctrl['current-value']);
                        } else if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null && ctrl['current-value'].zoom !== undefined) {
                            outZoom.set(ctrl['current-value'].zoom);
                        }
                    }
                });
            }
            outProperties.set(props);
            outTrigger.trigger();
        } else {
            outResult.set(msg);
            outProperties.set(null);
            outTrigger.trigger();
        }
    } catch (e) {
        op.logWarn("[SwiftUvcController] Error parsing sidecar message: " + String(e));
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
        op.logWarn("[SwiftUvcController] Invalid JSON command: " + String(e));
    }
};

op.onDelete = () => {
    stopServerAndProcess();
};

// Autostart
setTimeout(() => {
    if (inActive.get()) {
        startServerAndProcess();
    }
}, 500);
