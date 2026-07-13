const { spawn } = op.require('child_process');

const
    inScriptLocation = op.inString("Script Location", `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonGlobalMouseMonitor/python_script/mouse_monitor_cables.py`),
    inActive = op.inBool("Active", false),
    outUpdate = op.outTrigger("On Update"),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outButton = op.outNumber("Button", 0),
    outIsDown = op.outBool("Button Is Down", false),
    outIsUp = op.outBool("Button Is Up", false),
    outScrollDeltaX = op.outNumber("Scroll Delta X", 0),
    outScrollDeltaY = op.outNumber("Scroll Delta Y", 0),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let childProc = null;

function stopProcess() {
    if (childProc) {
        childProc.kill();
        childProc = null;
    }
    outRunning.set(false);
    outStatus.set("Stopped");
}

function startProcess() {
    stopProcess();
    const pythonExe = op.patch.pythonStandaloneExecutable || "/usr/bin/python3";
    const scriptPath = inScriptLocation.get();
    
    if (!scriptPath) return;

    try {
        childProc = spawn(pythonExe, [scriptPath, "1", "1", "1", "20"]);
        outRunning.set(true);
        outStatus.set("Running");
        
        childProc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            let updated = false;
            
            lines.forEach(line => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);
                    if (msg.type === 'mousePosition') {
                        outPosX.set(msg.data.x);
                        outPosY.set(msg.data.y);
                        updated = true;
                    } else if (msg.type === 'mouseClick') {
                        outPosX.set(msg.data.x);
                        outPosY.set(msg.data.y);
                        const buttonNum = msg.data.button ? parseInt(msg.data.button.substring(2), 10) : 0;
                        outButton.set(buttonNum);
                        outIsDown.set(msg.data.pressed);
                        outIsUp.set(!msg.data.pressed);
                        updated = true;
                    } else if (msg.type === 'mouseScroll') {
                        outScrollDeltaX.set(msg.data.dx || 0);
                        outScrollDeltaY.set(msg.data.dy || 0);
                        outPosX.set(msg.data.x);
                        outPosY.set(msg.data.y);
                        updated = true;
                    }
                } catch (e) {
                    // Ignore parse errors from partial lines
                }
            });
            
            if (updated) {
                outUpdate.trigger();
            }
        });

        childProc.stderr.on('data', (data) => {
            console.log("Mouse Monitor Error:", data.toString());
        });

        childProc.on('close', () => {
            childProc = null;
            outRunning.set(false);
            outStatus.set("Stopped");
        });
    } catch (e) {
        op.logError("Failed to start python process:", e);
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

outButton.set(0);
outIsDown.set(false);
outIsUp.set(false);
outScrollDeltaX.set(0);
outScrollDeltaY.set(0);
outRunning.set(false);
outStatus.set("Stopped");
