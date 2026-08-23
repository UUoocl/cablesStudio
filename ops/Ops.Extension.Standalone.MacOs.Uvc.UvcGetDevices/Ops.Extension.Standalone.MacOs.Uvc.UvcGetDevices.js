/**
 * Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices
 * 
 * Queries available UVC video capture devices using a native macOS sidecar.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", false),
    inRefresh = op.inTriggerButton("Refresh Devices"),
    
    outDevices = op.outObject("Devices"),
    outDeviceNames = op.outObject("Device Names"),
    outTrigger = op.outTrigger("Trigger Out"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inRefresh]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger]);
op.setPortGroup("Devices", [outDevices, outDeviceNames]);

let wss = null;
let cp = null;
let currentWs = null;

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
    const relative = "ops/Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices/swift_bin/CablesUvcGetDevices";
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
                op.logError("[MacOs.Uvc.UvcGetDevices] Sidecar error: " + err.message);
            });
            
            requestDevices();
        });

    } catch (e) {
        op.logError("[MacOs.Uvc.UvcGetDevices] Failed to start WebSocket server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    const binaryPath = getBinaryPath();
    if (!fs.existsSync(binaryPath)) {
        op.logError("[MacOs.Uvc.UvcGetDevices] Native binary not found at: " + binaryPath);
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
            op.logError("[MacOs.Uvc.UvcGetDevices] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code) => {
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[MacOs.Uvc.UvcGetDevices] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function requestDevices() {
    if (currentWs) {
        try {
            currentWs.send(JSON.stringify({ type: "list_devices" }));
        } catch (e) {}
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "devices") {
            if (payload.status === "success") {
                const devs = payload.devices || [];
                outDevices.set(devs);
                
                const names = devs.map((d) => d.name || `Device ${d.index}`);
                outDeviceNames.set(names);
                
                outTrigger.trigger();
                outStatus.set(`Found ${devs.length} device(s)`);
            } else {
                op.logWarn("[MacOs.Uvc.UvcGetDevices] Failed to get devices: " + payload.message);
                outStatus.set("Query Failed: " + payload.message);
            }
        }
    } catch (e) {}
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inRefresh.onTriggered = () => {
    if (!cp) {
        if (inActive.get()) {
            startServerAndProcess();
        }
    } else {
        requestDevices();
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
