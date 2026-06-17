const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false),

    outKnobEvent = op.outTrigger("Knob Event"),
    outEventKnobIndex = op.outNumber("Event Knob Index", 0),
    outEventKnobDirection = op.outNumber("Event Knob Direction", 0),
    outKnob0Value = op.outNumber("Knob 0 Value", 0),
    outKnob1Value = op.outNumber("Knob 1 Value", 0),
    outKnob2Value = op.outNumber("Knob 2 Value", 0),

    outKnobClickEvent = op.outTrigger("Knob Click Event"),
    outEventKnobClickIndex = op.outNumber("Event Knob Click Index", 0),
    outEventKnobClickPressed = op.outBool("Event Knob Click Pressed", false);

op.setPortGroup("Controls", [inActive]);

let childProc = null;
let knob0Val = 0;
let knob1Val = 0;
let knob2Val = 0;

outConnection.set(null);
outDeviceInfo.set(null);
resetKnobValues();

function resetKnobValues() {
    knob0Val = 0;
    knob1Val = 0;
    knob2Val = 0;
    outKnob0Value.set(0);
    outKnob1Value.set(0);
    outKnob2Value.set(0);
}

function stopProcess() {
    if (childProc) {
        op.log("[PythonSoomfonController] Stopping background Python process...");
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
    resetKnobValues();
    
    const pythonExe = op.patch.pythonStandaloneExecutable || "python3";
    let scriptPath = `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonSoomfonController/python_script/soomfon_bridge.py`;
    
    if (op.patch && typeof op.patch.filePath === "function") {
        scriptPath = op.patch.filePath(scriptPath);
    }
    
    if (!fs.existsSync(scriptPath)) {
        op.logError("[PythonSoomfonController] Python script not found at: " + scriptPath);
        outStatus.set("Bridge Script Not Found");
        return;
    }
    
    op.log("[PythonSoomfonController] Spawning Python process: " + pythonExe + " " + scriptPath);
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
                        op.logError("[PythonSoomfonController] Failed writing to process: " + e);
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
                            connection.send("connect");
                        }
                    } else if (msg.type === "connected") {
                        outIsConnected.set(true);
                        outDeviceInfo.set(msg);
                        outConnection.set(connection);
                        outStatus.set("Connected");
                        op.log(`[PythonSoomfonController] Connected to ${msg.model}`);
                    } else if (msg.type === "key_event") {
                        outEventKeyIndex.set(msg.key);
                        outEventPressed.set(msg.pressed);
                        outKeyEvent.trigger();
                    } else if (msg.type === "knob_turn") {
                        outEventKnobIndex.set(msg.knob);
                        outEventKnobDirection.set(msg.direction);
                        if (msg.knob === 0) {
                            knob0Val += msg.direction;
                            outKnob0Value.set(knob0Val);
                        } else if (msg.knob === 1) {
                            knob1Val += msg.direction;
                            outKnob1Value.set(knob1Val);
                        } else if (msg.knob === 2) {
                            knob2Val += msg.direction;
                            outKnob2Value.set(knob2Val);
                        }
                        outKnobEvent.trigger();
                    } else if (msg.type === "knob_click") {
                        outEventKnobClickIndex.set(msg.knob);
                        outEventKnobClickPressed.set(msg.pressed);
                        outKnobClickEvent.trigger();
                    } else if (msg.type === "error") {
                        outStatus.set("Error: " + msg.message);
                        outIsConnected.set(false);
                        outConnection.set(null);
                        op.logError("[PythonSoomfonController] Sidecar error: " + msg.message);
                    } else if (msg.type === "disconnected") {
                        outIsConnected.set(false);
                        outConnection.set(null);
                        outStatus.set("Disconnected");
                    }
                } catch (e) {
                    op.logWarn("[PythonSoomfonController] Error parsing stdout line: " + e + " | Line: " + line);
                }
            });
        });
        
        childProc.stderr.on("data", (data) => {
            op.log("[PythonSoomfonController Sidecar Debug] " + data.toString().trim());
        });
        
        childProc.on("close", (code) => {
            op.log(`[PythonSoomfonController] Sidecar process exited with code ${code}`);
            childProc = null;
            outIsConnected.set(false);
            outConnection.set(null);
            if (outStatus.get() === "Initializing..." || outStatus.get() === "Connected") {
                outStatus.set("Process Exited (Code: " + code + ")");
            }
        });
        
    } catch (e) {
        op.logError("[PythonSoomfonController] Failed to start Python process:", e);
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
