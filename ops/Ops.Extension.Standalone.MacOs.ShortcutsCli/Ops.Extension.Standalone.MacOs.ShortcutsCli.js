const
    inShortcutName = op.inString("Shortcut Name", ""),
    inPayload = op.inObject("Input Payload"),
    inExec = op.inTriggerButton("Execute"),
    outDone = op.outTrigger("Completed"),
    outStdout = op.outString("Stdout"),
    outStderr = op.outString("Stderr"),
    outJson = op.outObject("JSON Output"),
    outExitCode = op.outNumber("Exit Code", 0),
    outRunning = op.outBoolNum("Running", false),
    outError = op.outTrigger("Error");

let activeChild = null;
let isDeleted = false;

function getChildProcess()
{
    try
    {
        if (typeof op.require === "function")
        {
            return op.require("child_process");
        }
        return require("child_process");
    }
    catch (e)
    {
        op.logError("Could not load child_process module. Are you in Electron/Node?");
        return null;
    }
}

function parseJsonOutput(str)
{
    try
    {
        const trimmed = str.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("["))
        {
            return JSON.parse(trimmed);
        }
    }
    catch (e)
    {
        // Output is not valid JSON
    }
    return null;
}

function getDefaultCwd()
{
    const paths = op.patch && op.patch.config && op.patch.config.paths;
    return (paths && paths.patchPath) ? paths.patchPath : undefined;
}

inExec.onTriggered = () =>
{
    const shortcutName = (inShortcutName.get() || "").trim();
    if (!shortcutName)
    {
        op.logWarn("Shortcut Name is empty.");
        return;
    }

    if (activeChild)
    {
        op.logWarn("Shortcut is already running:", shortcutName);
        return;
    }

    const cp = getChildProcess();
    if (!cp) return;

    const payload = inPayload.get();
    const hasPayload = payload !== null && payload !== undefined;

    const args = ["run", shortcutName, "--output-path", "-"];
    if (hasPayload)
    {
        args.push("--input-path", "-");
    }

    const options = {};
    const cwd = getDefaultCwd();
    if (cwd) options.cwd = cwd;

    op.setUiAttrib({ extendTitle: "Running..." });
    outRunning.set(true);

    let stdoutStr = "";
    let stderrStr = "";
    let finished = false;

    const child = cp.spawn("shortcuts", args, options);
    activeChild = child;

    if (child.stdout)
    {
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => { stdoutStr += chunk; });
    }

    if (child.stderr)
    {
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => { stderrStr += chunk; });
    }

    if (child.stdin)
    {
        child.stdin.on("error", () => {});
        if (hasPayload)
        {
            const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
            child.stdin.write(serialized);
        }
        child.stdin.end();
    }

    function finalize(exitCode, errMsg)
    {
        if (finished || isDeleted) return;
        finished = true;
        activeChild = null;
        outRunning.set(false);

        if (errMsg && !stderrStr) stderrStr = errMsg;

        outStdout.set(stdoutStr);
        outStderr.set(stderrStr);
        outJson.set(parseJsonOutput(stdoutStr));
        outExitCode.set(exitCode);

        if (exitCode !== 0)
        {
            op.setUiAttrib({ extendTitle: "Error" });
            outError.trigger();
        }
        else
        {
            op.setUiAttrib({ extendTitle: "Success" });
        }
        outDone.trigger();
    }

    child.on("error", (err) =>
    {
        finalize(1, err && err.message ? err.message : String(err));
    });

    child.on("close", (code) =>
    {
        finalize(typeof code === "number" ? code : 1, null);
    });
};

op.onDelete = () =>
{
    isDeleted = true;
    if (activeChild)
    {
        try
        {
            activeChild.kill();
        }
        catch (e)
        {
            // Ignore errors killing exited process
        }
        activeChild = null;
    }
};

