const { spawn } = op.require('child_process');

const
    inScriptLocation = op.inString("Script Location", "pythonScripts/mouse_monitor_cables.py"),
    inActive = op.inBool("Active", false),
    outUpdate = op.outTrigger("On Update"),
    outClick = op.outString("Click", ""),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outScrollDelta = op.outNumber("Scroll Delta", 0);

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
        childProc = spawn(pythonExe, [scriptPath, "1", "1", "1", "20"]);
        
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
                        // Output the button and its state (e.g., "MB1 down", "MB2 up")
                        outClick.set(`${msg.data.button} ${msg.data.pressed ? 'down' : 'up'}`);
                        updated = true;
                    } else if (msg.type === 'mouseScroll') {
                        outScrollDelta.set(msg.data.dy);
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

op.onDelete = () => {
    stopProcess();
};
