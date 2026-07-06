/**
 * Ops.Extension.Standalone.SwiftSidecars.SpeechToText
 * Transcribes microphone audio input to text in real-time using native Apple Speech frameworks.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inRequestPermission = op.inTriggerButton("Request OS Permissions"),
    inLocale = op.inString("Language Locale", "en-US"),
    inAudioDevice = op.inString("Audio Input Device", "Default System Microphone"),
    inOutputMode = op.inString("Output Mode", "Full Transcript"),
    inSilenceDuration = op.inValueSlider("Silence Duration (s)", 1.5),
    inReset = op.inTriggerButton("Reset Text"),
    
    outText = op.outString("Transcribed Text", ""),
    outTrigger = op.outTrigger("On Word Received"),
    outIsFinal = op.outBool("Is Final Segment", false),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

inOutputMode.setUiAttribs({
    "display": "dropdown",
    "values": ["Full Transcript", "New Words Only", "Chunk"]
});

inSilenceDuration.setUiAttribs({
    "min": 0.1,
    "max": 10.0,
    "step": 0.1
});

inLocale.setUiAttribs({
    "display": "dropdown",
    "values": [
        "en-US",
        "es-ES",
        "fr-FR",
        "de-DE",
        "it-IT",
        "ja-JP",
        "zh-CN",
        "pt-BR"
    ]
});

inAudioDevice.setUiAttribs({
    "display": "dropdown",
    "values": ["Default System Microphone"]
});

let wss = null;
let cp = null;
let currentWs = null;
let audioDevicesList = [{ name: "Default System Microphone", id: "Default" }];
let lastEmittedText = "";

function killProcess() {
    if (cp) {
        op.log("[CablesSpeechToText] Terminating native Swift speech daemon...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[CablesSpeechToText] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outStatus.set("Stopped");
}

function startServerAndProcess() {
    stopServerAndProcess();
    if (!inActive.get()) return;

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[CablesSpeechToText] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[CablesSpeechToText] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message) => {
                handleTextMessage(message.toString());
            });

            ws.on("close", () => {
                op.log("[CablesSpeechToText] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[CablesSpeechToText] Sidecar connection error: " + err.message);
            });

            // 1. Configure the active locale
            sendLocaleConfig();

            // 2. Configure the active audio input device
            sendAudioDeviceConfig();

            // 2.5 Configure the silence duration
            sendSilenceDurationConfig();
            
            // 3. Begin listening
            sendStartCommand();
        });

    } catch (e) {
        op.logError("[CablesSpeechToText] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SpeechToText/swift_bin/CablesSpeechToText`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[CablesSpeechToText] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[CablesSpeechToText] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[CablesSpeechToText] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
    outStatus.set("Launching...");

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        outRunning.set(true);
        outStatus.set("Listening Microphone...");

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[CablesSpeechToText Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[CablesSpeechToText Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[CablesSpeechToText] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[CablesSpeechToText] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[CablesSpeechToText] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function handleTextMessage(str) {
    try {
        const payload = JSON.parse(str);
        if (payload.type === "transcription") {
            const text = payload.text || "";
            outIsFinal.set(!!payload.isFinal);
            
            const mode = inOutputMode.get();
            if (mode === "New Words Only") {
                const prevWords = lastEmittedText.trim().split(/\s+/).filter(Boolean);
                const currWords = text.trim().split(/\s+/).filter(Boolean);
                
                const isNewSentence = prevWords.length === 0 || 
                                     currWords.length === 0 || 
                                     currWords[0].toLowerCase() !== prevWords[0].toLowerCase();
                
                if (isNewSentence) {
                    // Safeguard: A brand new spoken phrase segment never starts with a long block of words instantly.
                    // If the block is longer than 5 words, it is likely a late flush from a previous session before reset, so we discard it.
                    if (currWords.length <= 5) {
                        const delta = currWords.join(" ");
                        if (delta) {
                            outText.set(delta);
                            outTrigger.trigger();
                        }
                    } else {
                        op.log("[CablesSpeechToText] Safeguard triggered: Discarded likely late-arriving pre-reset transcript block of " + currWords.length + " words.");
                    }
                } else if (currWords.length > prevWords.length) {
                    const deltaWords = currWords.slice(prevWords.length);
                    const delta = deltaWords.join(" ");
                    if (delta) {
                        outText.set(delta);
                        outTrigger.trigger();
                    }
                }
                lastEmittedText = text;
            } else if (mode === "Chunk") {
                if (payload.isFinal) {
                    outText.set(text);
                    outTrigger.trigger();
                }
            } else {
                outText.set(text);
                outTrigger.trigger();
            }
        } else if (payload.type === "devices") {
            audioDevicesList = payload.devices || [];
            
            const names = [];
            audioDevicesList.forEach(dev => {
                names.push(dev.name);
            });
            
            const currentSelected = inAudioDevice.get();
            inAudioDevice.setUiAttribs({ "values": names });
            if (names.indexOf(currentSelected) === -1) {
                // If previous selected device is gone, keep value or fallback
            }
        }
    } catch (e) {
        op.logWarn("[CablesSpeechToText] Error parsing socket payload: " + String(e));
    }
}

function sendLocaleConfig() {
    if (!currentWs) return;
    const locale = inLocale.get() || "en-US";
    try {
        currentWs.send(JSON.stringify({
            type: "locale",
            value: locale
        }));
    } catch (e) {
        op.logWarn("[CablesSpeechToText] Failed to send locale: " + String(e));
    }
}

// Configure the active audio input device
function sendAudioDeviceConfig() {
    if (!currentWs) return;
    
    const selectedName = inAudioDevice.get();
    let selectedID = "Default";
    
    const match = audioDevicesList.find(d => d.name === selectedName);
    if (match) {
        selectedID = match.id;
    }
    
    try {
        currentWs.send(JSON.stringify({
            type: "audioDevice",
            value: selectedID
        }));
        op.log(`[CablesSpeechToText] Active audio input set to: ${selectedName} (ID: ${selectedID})`);
    } catch (e) {
        op.logWarn("[CablesSpeechToText] Failed to send audio device config: " + String(e));
    }
}

function sendSilenceDurationConfig() {
    if (!currentWs) return;
    const duration = parseFloat(inSilenceDuration.get()) || 1.5;
    try {
        currentWs.send(JSON.stringify({
            type: "silenceDuration",
            value: duration
        }));
    } catch (e) {
        op.logWarn("[CablesSpeechToText] Failed to send silence duration: " + String(e));
    }
}

function sendStartCommand() {
    if (!currentWs) return;
    try {
        currentWs.send(JSON.stringify({ type: "start" }));
    } catch (e) {}
}

function sendStopCommand() {
    if (!currentWs) return;
    try {
        currentWs.send(JSON.stringify({ type: "stop" }));
    } catch (e) {}
}

function sendResetCommand() {
    if (!currentWs) return;
    try {
        currentWs.send(JSON.stringify({ type: "reset" }));
    } catch (e) {}
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServerAndProcess();
    } else {
        sendStopCommand();
        setTimeout(stopServerAndProcess, 100);
    }
};

inLocale.onChange = sendLocaleConfig;
inAudioDevice.onChange = sendAudioDeviceConfig;
inSilenceDuration.onChange = sendSilenceDurationConfig;

inReset.onTriggered = () => {
    outText.set("");
    outIsFinal.set(false);
    lastEmittedText = "";
    sendResetCommand();
};

inRequestPermission.onTriggered = () => {
    op.log("[CablesSpeechToText] Requesting macOS Microphone and Speech Recognition permissions...");
    
    // Request Microphone Access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                op.log("[CablesSpeechToText] Microphone permission allowed.");
                stream.getTracks().forEach(track => track.stop());
            })
            .catch((err) => {
                op.logWarn("[CablesSpeechToText] Microphone permission request: " + err.message);
            });
    }

    // Request Speech Recognition Access
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
        try {
            const rec = new SpeechRec();
            rec.continuous = false;
            rec.interimResults = false;
            rec.onstart = () => {
                op.log("[CablesSpeechToText] Speech Recognition API started successfully.");
                rec.stop();
            };
            rec.onerror = (e) => {
                op.logWarn("[CablesSpeechToText] Speech Recognition request status: " + e.error);
            };
            rec.start();
        } catch (e) {
            op.logWarn("[CablesSpeechToText] Speech Recognition request failed: " + e.message);
        }
    } else {
        op.logWarn("[CablesSpeechToText] webkitSpeechRecognition API is not available.");
    }
};

op.onDelete = () => {
    sendStopCommand();
    stopServerAndProcess();
};
