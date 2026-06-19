/**
 * Ops.Extension.Standalone.Python8BitDoXbox
 *
 * Interfaces with the 8BitDo Lite SE Xbox Controller (VID: 0x2dc8, PID: 0x2008)
 * using a background Python daemon process communicating via stdin/stdout.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inRumbleLeft = op.inFloat("Rumble Left", 0),
    inRumbleRight = op.inFloat("Rumble Right", 0),
    inRumbleLeftTrigger = op.inFloat("Rumble Left Trigger", 0),
    inRumbleRightTrigger = op.inFloat("Rumble Right Trigger", 0),
    inTriggerRumble = op.inTriggerButton("Trigger Rumble"),
    inSendOnChange = op.inBool("Send Rumble on Change", true),

    outEvent = op.outTrigger("On Event"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outButtonsPressed = op.outObject("Buttons Pressed"),
    outLSX = op.outNumber("LS X", 0),
    outLSY = op.outNumber("LS Y", 0),
    outRSX = op.outNumber("RS X", 0),
    outRSY = op.outNumber("RS Y", 0),
    outLT = op.outNumber("LT", 0),
    outRT = op.outNumber("RT", 0),
    outA = op.outBool("A", false),
    outB = op.outBool("B", false),
    outX = op.outBool("X", false),
    outY = op.outBool("Y", false),
    outDPadUp = op.outBool("DPad Up", false),
    outDPadDown = op.outBool("DPad Down", false),
    outDPadLeft = op.outBool("DPad Left", false),
    outDPadRight = op.outBool("DPad Right", false),
    outLB = op.outBool("LB", false),
    outRB = op.outBool("RB", false),
    outLSClick = op.outBool("LS Click", false),
    outRSClick = op.outBool("RS Click", false),
    outMenu = op.outBool("Menu", false),
    outView = op.outBool("View", false),
    outGuide = op.outBool("Guide", false),
    outShare = op.outBool("Share", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Rumble", [inRumbleLeft, inRumbleRight, inRumbleLeftTrigger, inRumbleRightTrigger, inTriggerRumble, inSendOnChange]);

let childProc = null;

outIsConnected.set(false);
outStatus.set("Stopped");
outButtonsPressed.set([]);

function stopProcess() {
    if (childProc) {
        op.log("[Python8BitDoXbox] Stopping background Python process...");
        try {
            if (childProc.stdin && childProc.stdin.writable) {
                childProc.stdin.write(JSON.stringify({ "action": "close" }) + "\n");
            }
        } catch (e) {}

        const targetProc = childProc;
        childProc = null;

        setTimeout(() => {
            try {
                targetProc.kill("SIGKILL");
            } catch (e) {}
        }, 500);
    }
    outIsConnected.set(false);
    outStatus.set("Stopped");
    resetOutputs();
}

function resetOutputs() {
    outButtonsPressed.set([]);
    outLSX.set(0);
    outLSY.set(0);
    outRSX.set(0);
    outRSY.set(0);
    outLT.set(0);
    outRT.set(0);
    outA.set(false);
    outB.set(false);
    outX.set(false);
    outY.set(false);
    outDPadUp.set(false);
    outDPadDown.set(false);
    outDPadLeft.set(false);
    outDPadRight.set(false);
    outLB.set(false);
    outRB.set(false);
    outLSClick.set(false);
    outRSClick.set(false);
    outMenu.set(false);
    outView.set(false);
    outGuide.set(false);
    outShare.set(false);
}

function startProcess() {
    stopProcess();
    if (!inActive.get()) return;

    const pythonExe = op.patch.pythonStandaloneExecutable || "python3";
    let scriptPath = `${op.patch.config.prefixAssetPath}ops/Ops.Local.Python/Ops.Extension.Standalone.Python8BitDoXbox/python_script/xbox_bridge.py`;

    if (op.patch && typeof op.patch.filePath === "function") {
        scriptPath = op.patch.filePath(scriptPath);
    }

    if (!fs.existsSync(scriptPath)) {
        op.logError("[Python8BitDoXbox] Python bridge script not found at: " + scriptPath);
        outStatus.set("Bridge Script Not Found");
        return;
    }

    op.log("[Python8BitDoXbox] Spawning Python process: " + pythonExe + " " + scriptPath);
    outStatus.set("Initializing...");

    try {
        childProc = spawn(pythonExe, [scriptPath]);

        childProc.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");
            lines.forEach((line) => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);

                    if (msg.type === "info") {
                        if (msg.status === "started") {
                            outStatus.set("Searching for controller...");
                        }
                    } else if (msg.type === "connected") {
                        outIsConnected.set(true);
                        outStatus.set("Connected: " + msg.device);
                        op.log(`[Python8BitDoXbox] Connected to ${msg.device}`);
                    } else if (msg.type === "disconnected") {
                        outIsConnected.set(false);
                        outStatus.set("Disconnected");
                        resetOutputs();
                    } else if (msg.type === "error") {
                        outStatus.set("Error: " + msg.message);
                        op.logError("[Python8BitDoXbox] Sidecar error: " + msg.message);
                        outIsConnected.set(false);
                    } else if (msg.type === "input") {
                        // Update Analog Inputs
                        outLSX.set(msg.ls[0]);
                        outLSY.set(msg.ls[1]);
                        outRSX.set(msg.rs[0]);
                        outRSY.set(msg.rs[1]);
                        outLT.set(msg.lt);
                        outRT.set(msg.rt);

                        // Update Button states
                        const btns = msg.buttons || [];
                        outButtonsPressed.set(btns);

                        outA.set(btns.includes("A"));
                        outB.set(btns.includes("B"));
                        outX.set(btns.includes("X"));
                        outY.set(btns.includes("Y"));
                        outDPadUp.set(btns.includes("Dpad Up"));
                        outDPadDown.set(btns.includes("Dpad Down"));
                        outDPadLeft.set(btns.includes("Dpad Left"));
                        outDPadRight.set(btns.includes("Dpad Right"));
                        outLB.set(btns.includes("LB"));
                        outRB.set(btns.includes("RB"));
                        outLSClick.set(btns.includes("LS Click"));
                        outRSClick.set(btns.includes("RS Click"));
                        outMenu.set(btns.includes("Menu"));
                        outView.set(btns.includes("View"));
                        outGuide.set(btns.includes("Guide"));
                        outShare.set(btns.includes("Share"));

                        outEvent.trigger();
                    }
                } catch (e) {
                    op.logWarn("[Python8BitDoXbox] Error parsing stdout line: " + e + " | Line: " + line);
                }
            });
        });

        childProc.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) {
                op.log("[Python8BitDoXbox Sidecar Debug] " + str);
            }
        });

        childProc.on("close", (code) => {
            op.log(`[Python8BitDoXbox] Sidecar process exited with code ${code}`);
            childProc = null;
            outIsConnected.set(false);
            if (outStatus.get() === "Initializing..." || outStatus.get() === "Connected" || outStatus.get() === "Searching for controller...") {
                outStatus.set("Process Exited (Code: " + code + ")");
            }
            resetOutputs();
        });

    } catch (e) {
        op.logError("[Python8BitDoXbox] Failed to start Python process: " + String(e));
        outStatus.set("Spawn Failed");
    }
}

function sendRumble() {
    if (childProc && childProc.stdin && childProc.stdin.writable) {
        try {
            const payload = {
                action: "rumble",
                left: Math.max(0, Math.min(1.0, inRumbleLeft.get())),
                right: Math.max(0, Math.min(1.0, inRumbleRight.get())),
                left_trigger: Math.max(0, Math.min(1.0, inRumbleLeftTrigger.get())),
                right_trigger: Math.max(0, Math.min(1.0, inRumbleRightTrigger.get()))
            };
            childProc.stdin.write(JSON.stringify(payload) + "\n");
        } catch (e) {
            op.logError("[Python8BitDoXbox] Failed writing rumble command to process stdin: " + e);
        }
    }
}

inTriggerRumble.onTriggered = sendRumble;

function handleRumbleChange() {
    if (inSendOnChange.get()) {
        sendRumble();
    }
}

inRumbleLeft.onChange = handleRumbleChange;
inRumbleRight.onChange = handleRumbleChange;
inRumbleLeftTrigger.onChange = handleRumbleChange;
inRumbleRightTrigger.onChange = handleRumbleChange;

inActive.onChange = () => {
    if (inActive.get()) {
        startProcess();
    } else {
        stopProcess();
    }
};

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
