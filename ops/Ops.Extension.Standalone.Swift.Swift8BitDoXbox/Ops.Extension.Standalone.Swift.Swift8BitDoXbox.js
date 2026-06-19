/**
 * Ops.Extension.Standalone.Swift.Swift8BitDoXbox
 *
 * Interfaces natively with 8BitDo Lite SE Xbox Controller (VID: 0x2dc8, PID: 0x2008)
 * using a compiled macOS Swift binary communicating via WebSockets.
 */
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const WebSocket = op.require("ws");

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

let wss = null;
let currentWs = null;
let cp = null;

outIsConnected.set(false);
outStatus.set("Stopped");
outButtonsPressed.set([]);

function killProcess() {
    if (cp) {
        op.log("[Swift8BitDoXbox] Terminating background Swift process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outIsConnected.set(false);
}

function launchProcess(port) {
    killProcess();
    if (!inActive.get()) return;

    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.Swift8BitDoXbox/swift_bin/Swift8BitDoXbox`;

    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[Swift8BitDoXbox] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[Swift8BitDoXbox] Warning setting execute permissions: " + String(e));
    }

    const args = ["--port", String(port)];
    op.log("[Swift8BitDoXbox] Spawning sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[Swift8BitDoXbox Output] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[Swift8BitDoXbox Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[Swift8BitDoXbox] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("close", (code) => {
            op.log(`[Swift8BitDoXbox] Sidecar exited with code ${code}`);
            cp = null;
            outIsConnected.set(false);
            if (outStatus.get() === "Connected" || outStatus.get() === "Listening..." || outStatus.get() === "Searching for controller...") {
                outStatus.set(`Exited (Code ${code})`);
            }
            resetOutputs();
        });

    } catch (e) {
        op.logError("[Swift8BitDoXbox] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[Swift8BitDoXbox] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
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

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });

        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[Swift8BitDoXbox] Private WebSocket Server listening on port " + port);
            outStatus.set("Searching for controller...");
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[Swift8BitDoXbox] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                let text = "";
                if (!isBinary && typeof message === "string") {
                    text = message;
                } else {
                    text = message.toString();
                }
                handleTextMessage(text);
            });

            ws.on("close", () => {
                op.log("[Swift8BitDoXbox] Swift sidecar disconnected.");
                if (currentWs === ws) {
                    currentWs = null;
                    outStatus.set("Disconnected");
                    outIsConnected.set(false);
                    resetOutputs();
                }
            });

            ws.on("error", (err) => {
                op.logError("[Swift8BitDoXbox] Sidecar connection error: " + err.message);
                outStatus.set("Connection Error");
            });
        });

    } catch (e) {
        op.logError("[Swift8BitDoXbox] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function handleTextMessage(str) {
    if (!str) return;
    try {
        const msg = JSON.parse(str);

        if (msg.type === "info") {
            if (msg.status === "connected") {
                outIsConnected.set(true);
                outStatus.set("Connected: " + msg.device);
            } else if (msg.status === "searching") {
                outIsConnected.set(false);
                outStatus.set("Searching...");
                resetOutputs();
            }
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            op.logError("[Swift8BitDoXbox] Sidecar error: " + msg.message);
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
        op.logWarn("[Swift8BitDoXbox] Error parsing message: " + e + " | Message: " + str);
    }
}

function sendRumble() {
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        try {
            const payload = {
                type: "rumble",
                left: Math.max(0, Math.min(1.0, inRumbleLeft.get())),
                right: Math.max(0, Math.min(1.0, inRumbleRight.get())),
                left_trigger: Math.max(0, Math.min(1.0, inRumbleLeftTrigger.get())),
                right_trigger: Math.max(0, Math.min(1.0, inRumbleRightTrigger.get()))
            };
            currentWs.send(JSON.stringify(payload));
        } catch (e) {
            op.logError("[Swift8BitDoXbox] Failed sending rumble: " + e);
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
        startServerAndProcess();
    } else {
        stopServerAndProcess();
    }
};

const handleProcessExit = () => {
    stopServerAndProcess();
};

const hasProcess = typeof process !== "undefined";
if (hasProcess) {
    process.on("exit", handleProcessExit);
    process.on("SIGINT", handleProcessExit);
    process.on("SIGTERM", handleProcessExit);
}

op.onDelete = () => {
    stopServerAndProcess();
    if (hasProcess) {
        try {
            process.off("exit", handleProcessExit);
            process.off("SIGINT", handleProcessExit);
            process.off("SIGTERM", handleProcessExit);
        } catch (e) {}
    }
};
