const { spawn } = op.require('child_process');

const
    inScriptLocation = op.inString("Script Location", `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonMouseController/python_script/mouse_controller_cables.py`),
    inActive = op.inBool("Active", false),
    inTrigger = op.inTriggerButton("Trigger"),
    inPosition = op.inArray("Mouse Position"),
    inClick = op.inInt("Button Click", 0),
    inScroll = op.inArray("Scroll"),
    outStatus = op.outString("Status", "Inactive"),
    outSuccess = op.outTrigger("On Success"),
    outError = op.outTrigger("On Error"),
    outErrorMessage = op.outString("Error Message", "");

let childProc = null;

function stopProcess() {
    if (childProc) {
        childProc.kill();
        childProc = null;
    }
    outStatus.set("Inactive");
}

function sendCommand(cmd) {
    if (childProc && childProc.stdin) {
        try {
            childProc.stdin.write(JSON.stringify(cmd) + "\n");
        } catch (e) {
            console.error("Failed to send command to Mouse Controller:", e);
        }
    }
}

inTrigger.onTriggered = () => {
    if (!childProc && inActive.get()) {
        startProcess();
    }

    if (childProc) {
        // Send position if valid
        const pos = inPosition.get();
        if (pos && Array.isArray(pos) && pos.length >= 2) {
            sendCommand({
                action: "move",
                position: [pos[0], pos[1]]
            });
        }

        // Send click if valid
        const btn = inClick.get();
        if (btn > 0 && btn <= 32) {
            sendCommand({
                action: "click",
                button: btn
            });
        }

        // Send scroll if valid
        const scroll = inScroll.get();
        if (scroll && Array.isArray(scroll) && scroll.length >= 2) {
            sendCommand({
                action: "scroll",
                scroll: [scroll[0], scroll[1]]
            });
        }
    }
};

function startProcess() {
    stopProcess();
    const pythonExe = op.patch.pythonStandaloneExecutable || "/usr/bin/python3";
    const scriptPath = inScriptLocation.get();
    
    if (!scriptPath) return;

    try {
        childProc = spawn(pythonExe, [scriptPath]);
        outStatus.set("Starting");
        
        childProc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);
                    if (msg.type === "info") {
                        outStatus.set("Running: " + msg.message);
                    } else if (msg.type === "success") {
                        outSuccess.trigger();
                    } else if (msg.type === "error") {
                        outErrorMessage.set(msg.message || "Unknown error");
                        outError.trigger();
                    }
                } catch (e) {
                    // Ignore parse errors from partial lines
                }
            });
        });

        childProc.stderr.on('data', (data) => {
            console.log("Mouse Controller Error:", data.toString());
            outErrorMessage.set(data.toString());
            outError.trigger();
        });

        childProc.on('close', () => {
            childProc = null;
            outStatus.set("Stopped");
        });
    } catch (e) {
        op.logError("Failed to start python process:", e);
        outStatus.set("Error: " + e.message);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startProcess();
    } else {
        stopProcess();
    }
};

// Ensure process is killed on parent exit
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
