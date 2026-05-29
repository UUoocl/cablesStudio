const { spawn } = op.require('child_process');

const
    inScriptLocation = op.inString("Script Location", `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.PythonGlobalKeyboardMonitor/python_script/keyboard_monitor_cables.py`),
    inActive = op.inBool("Active", false),
    outTrigger = op.outTrigger("Trigger"),
    outLastSingle = op.outString("Last Single Key", ""),
    outLastCombo = op.outString("Last Key Combination", "");

let childProc = null;

function stopProcess() {
    if (childProc) {
        childProc.kill();
        childProc = null;
    }
}

function startProcess() {
    stopProcess();
    const pythonExe = op.patch.pythonStandaloneExecutable || "/usr/bin/python3";
    const scriptPath = inScriptLocation.get();
    
    if (!scriptPath) return;

    try {
        childProc = spawn(pythonExe, [scriptPath]);
        
        childProc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);
                    if (msg.type === 'keyboardPress') {
                        outLastSingle.set(msg.data.key);
                        outLastCombo.set(msg.data.combo);
                        outTrigger.trigger();
                    }
                } catch (e) {}
            });
        });

        childProc.stderr.on('data', (data) => {
            console.log("Keyboard Monitor Error:", data.toString());
        });

        childProc.on('close', () => {
            childProc = null;
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
