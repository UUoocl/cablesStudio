const spawn = op.require("child_process").spawn;
const path = op.require("path");
const process = op.require("process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inAutoRestart = op.inBool("Auto Restart", true),
    inDelay = op.inFloat("Startup Delay", 2.0),
    inScriptPath = op.inString("Script Path", ""),
    inPythonPath = op.inString("Python Path", "python3"),
    inArgs = op.inString("Arguments", ""),
    
    outRunning = op.outBool("Is Running", false),
    outStdout = op.outString("Stdout"),
    outStderr = op.outString("Stderr"),
    outExitCode = op.outNumber("Exit Code", -1);

op.pythonProcess = null;
op.startupTimeout = null;
op.restartTimeout = null;

inActive.onChange = () => {
    if (inActive.get()) {
        const delay = inDelay.get() * 1000;
        if (delay > 0) {
            op.log("Delaying startup by " + delay + "ms...");
            clearTimeout(op.startupTimeout);
            op.startupTimeout = setTimeout(startProcess, delay);
        } else {
            startProcess();
        }
    } else {
        stopProcess();
    }
};

op.onDelete = stopProcess;

function resolvePath(p) {
    if (path.isAbsolute(p)) return p;
    // Try to resolve relative to project path in standalone
    if (op.patch && op.patch.getProjectUrl) {
        const projectUrl = op.patch.getProjectUrl();
        if (projectUrl.startsWith("file://")) {
            const projectDir = path.dirname(projectUrl.replace("file://", ""));
            return path.join(projectDir, p);
        }
    }
    return p;
}

function startProcess() {
    if (op.pythonProcess) return;

    let script = inScriptPath.get();
    const python = inPythonPath.get();
    const argsStr = inArgs.get();
    
    if (!script || script === "") return;

    script = resolvePath(script);

    if (!fs.existsSync(script)) {
        op.logError("Script file not found: " + script);
        outStderr.set("Script file not found: " + script);
        inActive.set(false);
        return;
    }

    const args = argsStr ? argsStr.split(" ") : [];
    args.unshift(script);

    op.log("Launching Python:", python, args.join(" "));

    try {
        op.pythonProcess = spawn(python, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONUNBUFFERED: "1" }
        });

        outRunning.set(true);
        outExitCode.set(-1);

        op.pythonProcess.stdout.on('data', (data) => {
            outStdout.set(data.toString());
        });

        op.pythonProcess.stderr.on('data', (data) => {
            const str = data.toString();
            outStderr.set(str);
            op.logError("Python stderr: " + str);
        });

        op.pythonProcess.on('close', (code) => {
            op.log("Python process exited with code", code);
            outExitCode.set(code);
            outRunning.set(false);
            op.pythonProcess = null;

            // Handle Auto-Restart
            if (inActive.get() && inAutoRestart.get()) {
                op.log("Auto-restarting in 5 seconds...");
                clearTimeout(op.restartTimeout);
                op.restartTimeout = setTimeout(startProcess, 5000);
            } else {
                inActive.set(false);
            }
        });

        op.pythonProcess.on('error', (err) => {
            op.logError("Failed to start Python process: " + err.message);
            outStderr.set(err.message);
            stopProcess();
        });

    } catch (err) {
        op.logError("Error spawning Python process: " + err.message);
        outStderr.set(err.message);
        outRunning.set(false);
    }
}

function stopProcess() {
    clearTimeout(op.startupTimeout);
    clearTimeout(op.restartTimeout);
    if (op.pythonProcess) {
        op.log("Killing Python process...");
        op.pythonProcess.kill();
        op.pythonProcess = null;
    }
    outRunning.set(false);
}

// Check initial state
if (inActive.get()) {
    setTimeout(inActive.onChange, 100);
}
