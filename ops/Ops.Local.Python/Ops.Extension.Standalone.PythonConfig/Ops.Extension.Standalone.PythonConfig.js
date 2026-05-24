const { exec } = op.require('child_process');
const fs = op.require('fs');

const
    //macOS default python: /usr/bin/python3
    //alternate path: /Library/Frameworks/Python.framework/Versions/3.12/bin/python3.12
    inLocation = op.inString("Python Install Location", "/usr/bin/python3"),
    inStart = op.inTriggerButton("Start Engine"),
    inStop = op.inTriggerButton("Stop Engine"),
    outStatus = op.outString("Status", "Stopped"),
    outFound = op.outBool("Found", false),
    outStarted = op.outTrigger("On Started"),
    outStopped = op.outTrigger("On Stopped");

let checkCount = 0;
op.patch.pythonStandaloneExecutable = inLocation.get();

function checkPython() {
    const currentCheckId = ++checkCount;
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
            if (currentCheckId !== checkCount) return;

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
        if (currentCheckId === checkCount) {
            outFound.set(false);
            outStatus.set("Path not found");
        }
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

op.onLoaded = () => {
    checkPython();
};

// Initial check
checkPython();

