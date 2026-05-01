const { exec } = op.require('child_process');
const fs = op.require('fs');

const
    inLocation = op.inString("Python Install Location", "/usr/bin/python3"),
    inStart = op.inTriggerButton("Start Engine"),
    inStop = op.inTriggerButton("Stop Engine"),
    outStatus = op.outString("Status", "Stopped"),
    outFound = op.outBool("Found", false),
    outStarted = op.outTrigger("On Started"),
    outStopped = op.outTrigger("On Stopped");

op.patch.pythonStandaloneExecutable = inLocation.get();

function checkPython() {
    const pyPath = inLocation.get();
    op.patch.pythonStandaloneExecutable = pyPath;
    
    if (!pyPath) {
        outFound.set(false);
        outStatus.set("No path specified");
        return;
    }

    // Check if the path exists on disk
    if (fs.existsSync(pyPath)) {
        // Double check by running --version
        exec(`"${pyPath}" --version`, (error, stdout, stderr) => {
            if (error) {
                outFound.set(false);
                outStatus.set("Executable invalid: " + error.message.split('\n')[0]);
            } else {
                outFound.set(true);
                const ver = (stdout || stderr || "Python").trim();
                outStatus.set(`Found: ${ver}`);
            }
        });
    } else {
        outFound.set(false);
        outStatus.set("Path not found");
    }
}

inLocation.onChange = checkPython;

inStart.onTriggered = () => {
    // Emit the On Started trigger
    outStarted.trigger();
};

inStop.onTriggered = () => {
    outStatus.set("Stopped");
    outStopped.trigger();
};

// Initial check
checkPython();
