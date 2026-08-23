/**
 * Ops.Extension.Standalone.MacOs.Hid.UlanziD100H
 * 
 * Native macOS driver interface for the Ulanzi D100H Dial Creative Controller.
 */

const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", false),
    inHapticStrength = op.inValue("Haptic Strength", 75),
    inSendHaptic = op.inTriggerButton("Send Haptic"),
    
    outEvent = op.outTrigger("On Event"),
    outEventType = op.outString("Event Type", ""),
    outConnected = op.outBool("Connected", false),
    outMacAddress = op.outString("MAC Address", ""),
    outBattery = op.outNumber("Battery", 0),
    outButtonIndex = op.outNumber("Button Index", -1),
    outButtonPressed = op.outBool("Button Pressed", false),
    outButtonEvent = op.outTrigger("On Button Event"),
    outDialCW = op.outTrigger("On Dial CW"),
    outDialCCW = op.outTrigger("On Dial CCW"),
    outRawMessage = op.outObject("Raw Message"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inHapticStrength, inSendHaptic]);
op.setPortGroup("Status", [outStatus, outRunning, outConnected, outMacAddress, outBattery, outEventType, outEvent]);
op.setPortGroup("Dial & Buttons", [outButtonIndex, outButtonPressed, outButtonEvent, outDialCW, outDialCCW]);
op.setPortGroup("Raw Data", [outRawMessage]);

let cp = null;
let stdoutBuffer = "";
let jsonAccumulator = "";
let braceCount = 0;

function killProcess() {
    if (cp) {
        try {
            cp.kill("SIGTERM");
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function stopProcess() {
    killProcess();
    outStatus.set("Stopped");
    outConnected.set(false);
    jsonAccumulator = "";
    braceCount = 0;
}

function getBinaryPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.UlanziD100H/swift_bin/UlanziController";
    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(relative);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, relative);
}

function startProcess() {
    stopProcess();
    if (!inActive.get()) return;

    const binaryPath = getBinaryPath();
    if (!fs.existsSync(binaryPath)) {
        op.logError("[MacOs.Hid.UlanziD100H] Native controller binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {}

    outStatus.set("Launching...");
    stdoutBuffer = "";
    jsonAccumulator = "";
    braceCount = 0;

    try {
        const binDir = path.dirname(binaryPath);
        cp = spawn(binaryPath, [], {
            detached: false,
            stdio: ["pipe", "pipe", "pipe"],
            cwd: binDir
        });

        outRunning.set(true);
        outStatus.set("Running");

        cp.stdout.on("data", (data) => {
            stdoutBuffer += data.toString();
            let lines = stdoutBuffer.split("\n");
            stdoutBuffer = lines.pop();
            for (let line of lines) {
                line = line.trim();
                if (line) {
                    processLine(line);
                }
            }
        });

        cp.stderr.on("data", () => {});

        cp.on("error", (err) => {
            op.logError("[MacOs.Hid.UlanziD100H] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopProcess();
        });

        cp.on("exit", (code) => {
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
            outConnected.set(false);
        });

    } catch (e) {
        op.logError("[MacOs.Hid.UlanziD100H] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopProcess();
    }
}

function countBraces(str) {
    let count = 0;
    let inQuotes = false;
    let escape = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '\\' && inQuotes) {
            escape = !escape;
            continue;
        }
        if (char === '"' && !escape) {
            inQuotes = !inQuotes;
        }
        escape = false;
        if (!inQuotes) {
            if (char === '{') count++;
            else if (char === '}') count--;
        }
    }
    return count;
}

function processLine(line) {
    if (braceCount === 0) {
        if (line.startsWith("{")) {
            const lineBraceCount = countBraces(line);
            if (lineBraceCount > 0) {
                jsonAccumulator = line;
                braceCount = lineBraceCount;
            } else {
                handleLine(line);
            }
        }
    } else {
        jsonAccumulator += "\n" + line;
        braceCount += countBraces(line);
        if (braceCount <= 0) {
            handleLine(jsonAccumulator);
            jsonAccumulator = "";
            braceCount = 0;
        }
    }
}

function handleLine(line) {
    if (line.startsWith("⏳") || line.startsWith("✅") || line.startsWith("🔎") || line.startsWith("❌") || line.startsWith("👋")) {
        return;
    }

    try {
        const msg = JSON.parse(line);
        outRawMessage.set(msg);

        if (msg.event === "bluetooth_status") {
            outEventType.set("bluetooth_status");
            outEvent.trigger();
        } else if (msg.event === "connected") {
            outConnected.set(true);
            if (msg.mac) outMacAddress.set(msg.mac);
            outEventType.set("connected");
            outEvent.trigger();
        } else if (msg.event === "disconnected") {
            outConnected.set(false);
            outEventType.set("disconnected");
            outEvent.trigger();
        } else if (msg.event === "message") {
            if (msg.mac) outMacAddress.set(msg.mac);
            
            const data = msg.data || {};
            if (data.type === "deviceKeyEvent") {
                outEventType.set("deviceKeyEvent");
                const idx = data.index;
                const status = data.status;
                outButtonIndex.set(idx);
                
                if (idx === 10) {
                    outButtonPressed.set(true);
                    outDialCW.trigger();
                } else if (idx === 9) {
                    outButtonPressed.set(true);
                    outDialCCW.trigger();
                } else {
                    const pressed = (status === 1);
                    outButtonPressed.set(pressed);
                    outButtonEvent.trigger();
                }
                outEvent.trigger();
            } else if (data.type === "deviceBattery") {
                outEventType.set("deviceBattery");
                if (typeof data.battery === "number") {
                    outBattery.set(data.battery);
                }
                outEvent.trigger();
            }
        }
    } catch (e) {}
}

inActive.onChange = () => {
    if (inActive.get()) {
        startProcess();
    } else {
        stopProcess();
    }
};

inSendHaptic.onTriggered = () => {
    if (!cp) return;
    const val = Math.round(inHapticStrength.get());
    if (val >= 0 && val <= 100) {
        try {
            cp.stdin.write(`haptic:${val}\n`);
        } catch (e) {
            op.logWarn("[MacOs.Hid.UlanziD100H] Failed writing haptic command: " + e.message);
        }
    }
};

op.onDelete = () => {
    stopProcess();
};

setTimeout(() => {
    if (inActive.get()) {
        startProcess();
    }
}, 500);
