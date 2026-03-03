const exec = op.require("child_process").exec;
const path = op.require("path");
const process = op.require("process");

const 
    inAppName = op.inString("App Name", "OBS"),
    inAppPath = op.inString("App Path", ""),
    inCollection = op.inString("Collection", "Untitled"),
    inDebugPort = op.inString("Debug Port", "9222"),
    inWssPort = op.inString("WSS Port", "4455"),
    inWssPass = op.inString("WSS Password", ""),
    inLaunch = op.inTriggerButton("Launch OBS"),
    
    outSuccess = op.outBoolNum("Success"),
    outError = op.outString("Error");

inLaunch.onTriggered = () => {
    let commandString = "";
    const isMac = process.platform === "darwin";
    const isWin = process.platform === "win32";

    const appName = inAppName.get();
    const appPath = inAppPath.get();
    const collection = inCollection.get();
    const debugPort = inDebugPort.get();
    const wssPort = inWssPort.get();
    const wssPass = inWssPass.get();

    if (isMac) {
        commandString = `open -n -a "${appName}"`;
        commandString += ` --args --collection "${collection}"`;
        commandString += ` --remote-debugging-port=${debugPort}`;
        commandString += ` --remote-allow-origins=http://127.0.0.1:${debugPort}`;
        commandString += ` --websocket_port "${wssPort}"`;
        commandString += ` --websocket_password "${wssPass}"`;
        commandString += ` --multi`;
    } else if (isWin) {
        const obsFull = path.join(appPath, appName);
        const obsDir = path.dirname(obsFull);
        
        // On Windows we usually need to run from the directory to find DLLs
        commandString = `cd /d "${obsDir}" && "${appName}"`;
        commandString += ` --collection "${collection}"`;
        commandString += ` --remote-debugging-port=${debugPort}`;
        commandString += ` --remote-allow-origins=http://127.0.0.1:${debugPort}`;
        commandString += ` --websocket_port "${wssPort}"`;
        commandString += ` --websocket_password "${wssPass}"`;
        commandString += ` --multi`;
    } else {
        outError.set("Unsupported platform: " + process.platform);
        outSuccess.set(false);
        return;
    }

    op.log("Launching OBS with command: " + commandString);

    exec(commandString, (error, stdout, stderr) => {
        if (error) {
            op.logError("OBS Launch Error: ", error);
            outError.set(error.message);
            outSuccess.set(false);
            return;
        }
        outError.set("");
        outSuccess.set(true);
    });
};
