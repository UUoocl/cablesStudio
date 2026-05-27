/**
 * Ops.Extension.Standalone.Swift.SwiftUvcGetDevices
 * Queries available UVC video capture devices using a native Swift sidecar.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inRefresh = op.inTriggerButton("Refresh Devices"),
    
    outDevices = op.outObject("Devices"),
    outDeviceNames = op.outObject("Device Names"),
    outTrigger = op.outTrigger("Trigger Out"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let cp = null;
let currentWs = null;

function killProcess() {
    if (cp) {
        op.log("[SwiftUvcGetDevices] Terminating native Swift UvcGetDevices daemon...");
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
        op.log("[SwiftUvcGetDevices] Closing private WebSocket Server...");
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
            op.log("[SwiftUvcGetDevices] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftUvcGetDevices] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                if (!isBinary && typeof message === "string") {
                    handleTextMessage(message);
                } else {
                    handleTextMessage(message.toString());
                }
            });

            ws.on("close", () => {
                op.log("[SwiftUvcGetDevices] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SwiftUvcGetDevices] Sidecar connection error: " + err.message);
            });
            
            // Request devices list immediately upon connection
            requestDevices();
        });

    } catch (e) {
        op.logError("[SwiftUvcGetDevices] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftUvcGetDevices/swift_bin/SwiftUvcGetDevices`;
    
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftUvcGetDevices] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftUvcGetDevices] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftUvcGetDevices] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[SwiftUvcGetDevices Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftUvcGetDevices Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftUvcGetDevices] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftUvcGetDevices] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SwiftUvcGetDevices] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function requestDevices() {
    if (currentWs) {
        try {
            currentWs.send(JSON.stringify({ type: "list_devices" }));
        } catch (e) {
            op.logWarn("[SwiftUvcGetDevices] Failed to request devices: " + String(e));
        }
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "devices") {
            if (payload.status === "success") {
                const devs = payload.devices || [];
                outDevices.set(devs);
                
                const names = devs.map(d => d.name || `Device ${d.index}`);
                outDeviceNames.set(names);
                
                outTrigger.trigger();
                outStatus.set(`Found ${devs.length} device(s)`);
            } else {
                op.logWarn("[SwiftUvcGetDevices] Failed to get devices: " + payload.message);
                outStatus.set("Query Failed: " + payload.message);
            }
        }
    } catch (e) {
        op.logWarn("[SwiftUvcGetDevices] Error parsing sidecar response: " + String(e));
    }
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

op.onDelete = () => {
    stopServerAndProcess();
};
