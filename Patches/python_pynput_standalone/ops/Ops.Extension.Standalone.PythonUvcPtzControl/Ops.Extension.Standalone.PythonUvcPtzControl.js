const { spawn } = op.require('child_process');

const
    inScriptLocation = op.inString("Script Location", "pythonScripts/uvc_util_bridge_cables.py"),
    inRefresh = op.inTriggerButton("Refresh Devices"),
    inActive = op.inBool("Active", true),
    inCameraTarget = op.inString("UVC Camera Target", "default"),
    inPollRate = op.inValue("Poll Rate Per Second", 30),
    inCommand = op.inString("Camera Control Command", "{}"),
    inTrigger = op.inTriggerButton("Trigger Update"),
    outTrigger = op.outTrigger("Trigger Out"),
    outResult = op.outObject("Result Object"),
    outPan = op.outNumber("Pan", 0),
    outTilt = op.outNumber("Tilt", 0),
    outZoom = op.outNumber("Zoom", 0);

inCameraTarget.setUiAttribs({ "display": "dropdown", "values": ["default"] });

let childProc = null;
let availableDevices = [];

function stopProcess() {
    if (childProc) {
        childProc.kill();
        childProc = null;
    }
}

function sendConfigure() {
    if (childProc && childProc.stdin) {
        const targetName = inCameraTarget.get();
        const dev = availableDevices.find(d => d.name === targetName);
        const idx = dev ? dev.index : 0;
        
        const configMsg = {
            action: "configure",
            devices: [
                {
                    name: targetName,
                    index: idx,
                    pollingEnabled: inActive.get(),
                    pollsPerSecond: inPollRate.get()
                }
            ]
        };
        childProc.stdin.write(JSON.stringify(configMsg) + "\n");
    }
}

inCameraTarget.onChange = sendConfigure;
inPollRate.onChange = sendConfigure;
inActive.onChange = sendConfigure;

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
                    
                    if (msg.type === "uvcResponse" && msg.action === "list_devices") {
                        if (Array.isArray(msg.data)) {
                            availableDevices = msg.data;
                            const names = msg.data.map(d => d.name);
                            if (names.length === 0) names.push("default");
                            inCameraTarget.setUiAttribs({ "values": names });
                            
                            // If the current target isn't in the list, set it to the first one
                            if (names.length > 0 && (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "default")) {
                                inCameraTarget.set(names[0]);
                            }
                            sendConfigure();
                        }
                    } else if (msg.type === "uvc_poll") {
                        outResult.set(msg.data);
                        if (Array.isArray(msg.data)) {
                            msg.data.forEach(ctrl => {
                                const name = (ctrl.name || "").toLowerCase();
                                
                                // UVC sometimes combines pan and tilt into one control
                                if (name.includes("pan") || name.includes("tilt")) {
                                    if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null) {
                                        if (ctrl['current-value'].pan !== undefined) outPan.set(ctrl['current-value'].pan);
                                        if (ctrl['current-value'].tilt !== undefined) outTilt.set(ctrl['current-value'].tilt);
                                    } else if (name === "pan") {
                                        outPan.set(ctrl['current-value']);
                                    } else if (name === "tilt") {
                                        outTilt.set(ctrl['current-value']);
                                    }
                                }
                                
                                // Zoom control
                                if (name.includes("zoom")) {
                                    if (typeof ctrl['current-value'] === 'number') {
                                        outZoom.set(ctrl['current-value']);
                                    } else if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null && ctrl['current-value'].zoom !== undefined) {
                                        outZoom.set(ctrl['current-value'].zoom);
                                    }
                                }
                            });
                        }
                        outTrigger.trigger();
                    } else {
                        outResult.set(msg);
                        outTrigger.trigger();
                    }
                } catch (e) {}
            });
        });

        childProc.stderr.on('data', (data) => {
            console.log("UVC Bridge Error:", data.toString());
        });

        childProc.on('close', () => {
            childProc = null;
        });
        
        // Fetch devices immediately
        setTimeout(() => {
            if (childProc && childProc.stdin) {
                childProc.stdin.write(JSON.stringify({ action: "list_devices" }) + "\n");
            }
        }, 1000);
        
    } catch (e) {
        op.logError("Failed to start python process:", e);
    }
}

inRefresh.onTriggered = () => {
    if (!childProc) {
        startProcess();
    } else if (childProc.stdin) {
        childProc.stdin.write(JSON.stringify({ action: "list_devices" }) + "\n");
    }
};

inTrigger.onTriggered = () => {
    if (!childProc) {
        startProcess();
    }
    
    if (childProc && childProc.stdin) {
        try {
            const cmd = JSON.parse(inCommand.get());
            cmd.device_name = inCameraTarget.get();
            childProc.stdin.write(JSON.stringify(cmd) + "\n");
        } catch (e) {
            console.error("Invalid JSON command", e);
        }
    }
};

op.onDelete = () => {
    stopProcess();
};

// Autostart to populate devices
setTimeout(startProcess, 500);
