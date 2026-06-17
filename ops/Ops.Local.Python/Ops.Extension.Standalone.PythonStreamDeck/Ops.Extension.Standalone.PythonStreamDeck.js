const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Settings", [inDeviceIndex]);

let childProc = null;
outConnection.set(null);
outDeviceInfo.set(null);

function stopProcess() {
    if (childProc) {
        op.log("[PythonStreamDeck] Stopping background Python process...");
        try {
            if (childProc.stdin && childProc.stdin.writable) {
                childProc.stdin.write(JSON.stringify({ "action": "close" }) + "\n");
            }
        } catch (e) {}
        
        // Ensure it is terminated
        setTimeout(() => {
            if (childProc) {
                try {
                    childProc.kill("SIGKILL");
                } catch (e) {}
                childProc = null;
            }
        }, 500);
    }
    
    outIsConnected.set(false);
    outConnection.set(null);
    outDeviceInfo.set(null);
    outStatus.set("Stopped");
}

function startProcess() {
    stopProcess();
    
    const pythonExe = op.patch.pythonStandaloneExecutable || "python3";
    let scriptPath = `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonStreamDeck/python_script/streamdeck_bridge.py`;
    
    if (op.patch && typeof op.patch.filePath === "function") {
        scriptPath = op.patch.filePath(scriptPath);
    }
    
    if (!fs.existsSync(scriptPath)) {
        op.logError("[PythonStreamDeck] Python script not found at: " + scriptPath);
        outStatus.set("Bridge Script Not Found");
        return;
    }
    
    op.log("[PythonStreamDeck] Spawning Python process: " + pythonExe + " " + scriptPath);
    outStatus.set("Initializing...");
    
    try {
        childProc = spawn(pythonExe, [scriptPath]);
        
        // Connection bridge object exposed to texture writers
        const connection = {
            send(action, params) {
                if (childProc && childProc.stdin && childProc.stdin.writable) {
                    try {
                        const payload = Object.assign({ "action": action }, params);
                        childProc.stdin.write(JSON.stringify(payload) + "\n");
                    } catch (e) {
                        op.logError("[PythonStreamDeck] Failed writing to process: " + e);
                    }
                }
            }
        };
        
        childProc.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");
            lines.forEach((line) => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);
                    
                    if (msg.type === "info") {
                        if (msg.status === "started") {
                            // Automatically connect once Python daemon starts
                            connection.send("connect", { "device_index": inDeviceIndex.get() });
                        }
                    } else if (msg.type === "connected") {
                        outIsConnected.set(true);
                        outDeviceInfo.set(msg);
                        outConnection.set(connection);
                        outStatus.set("Connected to " + msg.model);
                        op.log(`[PythonStreamDeck] Connected to ${msg.model} (${msg.keys} keys)`);
                    } else if (msg.type === "key_event") {
                        outEventKeyIndex.set(msg.key);
                        outEventPressed.set(msg.pressed);
                        outKeyEvent.trigger();
                    } else if (msg.type === "error") {
                        outStatus.set("Error: " + msg.message);
                        outIsConnected.set(false);
                        outConnection.set(null);
                        op.logError("[PythonStreamDeck] Sidecar error: " + msg.message);
                    } else if (msg.type === "disconnected") {
                        outIsConnected.set(false);
                        outConnection.set(null);
                        outStatus.set("Disconnected");
                    }
                } catch (e) {
                    op.logWarn("[PythonStreamDeck] Error parsing stdout line: " + e + " | Line: " + line);
                }
            });
        });
        
        childProc.stderr.on("data", (data) => {
            op.log("[PythonStreamDeck Sidecar Debug] " + data.toString().trim());
        });
        
        childProc.on("close", (code) => {
            op.log(`[PythonStreamDeck] Sidecar process exited with code ${code}`);
            childProc = null;
            outIsConnected.set(false);
            outConnection.set(null);
            if (outStatus.get() === "Initializing..." || outStatus.get().startsWith("Connected")) {
                outStatus.set("Process Exited (Code: " + code + ")");
            }
        });
        
    } catch (e) {
        op.logError("[PythonStreamDeck] Failed to start Python process:", e);
        outStatus.set("Spawn Failed");
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startProcess();
    } else {
        stopProcess();
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get() && outConnection.get()) {
        outConnection.get().send("connect", { "device_index": inDeviceIndex.get() });
    }
};

const handleProcessExit = () => {
    stopProcess();
};

const hasProcess = typeof process !== "undefined";
if (hasProcess) {
    process.on("exit", handleProcessExit);
    process.on("SIGINT", handleProcessExit);
    process.on("SIGTERM", handleProcessExit);
}

op.onDelete = () => {
    stopProcess();
    if (hasProcess) {
        try {
            process.off("exit", handleProcessExit);
            process.off("SIGINT", handleProcessExit);
            process.off("SIGTERM", handleProcessExit);
        } catch (e) {}
    }
};
