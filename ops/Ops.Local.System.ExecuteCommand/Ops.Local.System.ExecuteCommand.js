const
    inCmd = op.inString("Command", ""),
    inArgs = op.inString("Arguments", ""),
    inCwd = op.inString("Working Directory", ""),
    inExec = op.inTriggerButton("Execute"),
    outStdout = op.outString("Stdout"),
    outStderr = op.outString("Stderr"),
    outJson = op.outObject("JSON Output"),
    outExitCode = op.outNumber("Exit Code"),
    outDone = op.outTrigger("Completed"),
    outError = op.outTrigger("Error");

inExec.onTriggered = () => {
    const cmd = inCmd.get();
    if (!cmd) return;

    let cp = null;
    try {
        if (typeof op.require === "function") {
            cp = op.require("child_process");
        } else {
            cp = require("child_process");
        }
    } catch (e) {
        op.logError("Could not load child_process module. Are you in Electron/Node?");
        return;
    }

    if (!cp) return;

    const options = {};
    const cwd = inCwd.get();
    if (cwd) options.cwd = cwd;

    let fullCmd = cmd;
    const args = inArgs.get();
    if (args) {
        fullCmd += " " + args;
    }

    op.setUiAttrib({ extendTitle: "Running..." });

    cp.exec(fullCmd, options, (error, stdout, stderr) => {
        const outStr = stdout || "";
        outStdout.set(outStr);
        outStderr.set(stderr || "");

        // Try to parse JSON automatically
        try {
            const trimmed = outStr.trim();
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                outJson.set(JSON.parse(trimmed));
            } else {
                outJson.set(null);
            }
        } catch (e) {
            outJson.set(null);
        }

        if (error) {
            outExitCode.set(error.code || 1);
            op.setUiAttrib({ extendTitle: "Error" });
            outError.trigger();
        } else {
            outExitCode.set(0);
            op.setUiAttrib({ extendTitle: "Success" });
        }
        outDone.trigger();
    });
};