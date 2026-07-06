/**
 * Ops.Extension.Standalone.SwiftSidecars.ActiveApp
 * Monitors the frontmost active application and window title on macOS
 * and outputs app info and titles in real-time.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", true),
    inInterval = op.inValueInt("Interval (ms)", 500),
    
    outAppName = op.outString("Application Name", ""),
    outBundleId = op.outString("Bundle Identifier", ""),
    outPid = op.outNumber("Process ID", 0),
    outWindowTitle = op.outString("Window Title", ""),
    outChanged = op.outTrigger("On Changed"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

inInterval.setUiAttribs({
    "min": 100,
    "max": 10000,
    "step": 50
});

let wss = null;
let cp = null;
let currentWs = null;

function killProcess() {
    if (cp) {
        op.log("[ActiveApp] Terminating native Swift monitor process...");
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
        op.log("[ActiveApp] Closing private WebSocket Server...");
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
            op.log("[ActiveApp] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[ActiveApp] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message) => {
                handleTextMessage(message.toString());
            });

            ws.on("close", () => {
                op.log("[ActiveApp] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[ActiveApp] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[ActiveApp] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.ActiveApp/swift_bin/CablesActiveAppMonitor`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[ActiveApp] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[ActiveApp] Warning setting execute permissions: " + String(e));
    }

    const intervalVal = parseInt(inInterval.get()) || 500;
    const args = [
        "--host", "127.0.0.1",
        "--port", String(port),
        "--interval", String(intervalVal)
    ];

    op.log("[ActiveApp] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
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
            if (str) op.log("[ActiveApp Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[ActiveApp Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[ActiveApp] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[ActiveApp] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[ActiveApp] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "activeApp") {
            outAppName.set(payload.name || "");
            outBundleId.set(payload.bundleId || "");
            outPid.set(payload.pid || 0);
            outWindowTitle.set(payload.windowTitle || "");
            outChanged.trigger();
        }
    } catch (e) {
        op.logWarn("[ActiveApp] Error parsing socket payload: " + String(e));
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

inInterval.onChange = () => {
    if (cp && inActive.get()) {
        op.log("[ActiveApp] Interval changed. Restarting sidecar process...");
        startServerAndProcess();
    }
};

op.onDelete = () => {
    stopServerAndProcess();
};

// Auto-start on load if active
if (inActive.get()) {
    startServerAndProcess();
}
