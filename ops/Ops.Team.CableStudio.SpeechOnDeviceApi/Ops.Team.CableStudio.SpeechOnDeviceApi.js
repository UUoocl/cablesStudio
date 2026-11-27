// Ops.Team.CableStudio.SpeechOnDeviceApi.js

// Define inputs
const inAudioIn = op.inObject("Audio In");
const inLanguage = op.inString("Language", "en-US");
const inContinuous = op.inBool("Continuous", true);
const inInterim = op.inBool("Interim Results", true);
const inPhrases = op.inArray("Phrases", null);
const inActive = op.inBool("Active", true);
const inStart = op.inTriggerButton("Start");

// Define outputs
const outText = op.outString("Text", "");
const outInterimText = op.outString("Interim Text", "");
const outConfidence = op.outNumber("Confidence", 0);
const outStatus = op.outString("Status", "Ready");
const outNewResult = op.outTrigger("New Result");
const outListening = op.outBool("Listening Status", false);
const outSupported = op.outBool("Supported", false);

// Port groupings
op.setPortGroup("Settings", [inAudioIn, inLanguage, inContinuous, inInterim, inPhrases, inActive]);
op.setPortGroup("Controls", [inStart]);

// Enforce Chrome's On-Device Speech API with local-only processing
const SpeechRecognition = typeof window !== "undefined" ? (window.webkitSpeechRecognition || window.SpeechRecognition) : null;
const SpeechGrammarList = typeof window !== "undefined" ? (window.webkitSpeechGrammarList || window.SpeechGrammarList) : null;

outSupported.set(!!SpeechRecognition && !!SpeechRecognition.available);

let recognition = null;
let isListening = false;
let restartTimeout = null;
let activeMicStream = null;
let ownsMicStream = false;
let sessionGeneration = 0;
let lastFatalError = null;
let permissionOverlay = null;

const FATAL_SPEECH_ERRORS = new Set([
    "not-allowed",
    "service-not-allowed",
    "language-not-supported",
    "audio-capture"
]);

function removePermissionOverlay() {
    if (permissionOverlay && permissionOverlay.parentNode) {
        permissionOverlay.parentNode.removeChild(permissionOverlay);
    }
    permissionOverlay = null;
}

function showPermissionOverlay(reason) {
    removePermissionOverlay();

    const container = (op.patch && op.patch.cgl && op.patch.cgl.canvas && op.patch.cgl.canvas.parentElement) ||
        (typeof document !== "undefined" ? document.body : null);
    if (!container) {
        outStatus.set("User Gesture Required for Microphone");
        return;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = [
        "position: fixed",
        "top: 16px",
        "right: 16px",
        "z-index: 99999",
        "background: rgba(18, 18, 22, 0.94)",
        "color: #f3f4f6",
        "border: 1px solid rgba(255, 255, 255, 0.16)",
        "border-radius: 8px",
        "padding: 12px 14px",
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-size: 13px",
        "box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45)",
        "display: flex",
        "align-items: center",
        "gap: 10px"
    ].join(";");

    const label = document.createElement("span");
    label.textContent = reason || "On-device speech requires microphone access inside the patch:";

    const enableBtn = document.createElement("button");
    enableBtn.type = "button";
    enableBtn.textContent = "Enable Microphone & Speech";
    enableBtn.style.cssText = [
        "background: #2563eb",
        "color: #fff",
        "border: none",
        "border-radius: 5px",
        "padding: 6px 12px",
        "font-size: 12px",
        "font-weight: 600",
        "cursor: pointer"
    ].join(";");
    enableBtn.addEventListener("click", () => {
        removePermissionOverlay();
        startListening({ fromUserGesture: true });
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = [
        "background: transparent",
        "color: #9ca3af",
        "border: 1px solid rgba(255, 255, 255, 0.2)",
        "border-radius: 5px",
        "padding: 6px 10px",
        "font-size: 12px",
        "cursor: pointer"
    ].join(";");
    cancelBtn.addEventListener("click", () => {
        removePermissionOverlay();
        if (!isListening) {
            outStatus.set("Microphone Permission Canceled");
        }
    });

    overlay.appendChild(label);
    overlay.appendChild(enableBtn);
    overlay.appendChild(cancelBtn);
    container.appendChild(overlay);
    permissionOverlay = overlay;
    outStatus.set("Click 'Enable Microphone & Speech' in patch");
}

function checkEnvironmentSupport() {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
        outStatus.set("Error: Microphone & Speech API require HTTPS.");
        outSupported.set(false);
        return false;
    }
    const policy = typeof document !== "undefined" ? (document.permissionsPolicy || document.featurePolicy) : null;
    if (policy && typeof policy.allowsFeature === "function") {
        try {
            if (!policy.allowsFeature("microphone")) {
                outStatus.set("Error: Microphone blocked by iframe Permissions-Policy.");
                return false;
            }
            if (typeof policy.features === "function" && policy.features().includes("on-device-speech-recognition") && !policy.allowsFeature("on-device-speech-recognition")) {
                outStatus.set("Error: On-device speech blocked by iframe Permissions-Policy.");
                outSupported.set(false);
                return false;
            }
        } catch (e) {}
    }
    if (!SpeechRecognition) {
        outStatus.set("Error: Chrome webkitSpeechRecognition API not supported.");
        outSupported.set(false);
        return false;
    }
    if (!SpeechRecognition.available) {
        outStatus.set("Error: Chrome On-Device Speech API is not available.");
        outSupported.set(false);
        return false;
    }
    outSupported.set(true);
    return true;
}

function releaseMicrophone() {
    if (activeMicStream && ownsMicStream) {
        try {
            activeMicStream.getTracks().forEach((track) => track.stop());
        } catch (e) {}
    }
    activeMicStream = null;
    ownsMicStream = false;
}

async function acquireMicrophone() {
    const audioIn = inAudioIn.get();
    if (audioIn) {
        const providedStream = (typeof MediaStream !== "undefined" && audioIn instanceof MediaStream)
            ? audioIn
            : (audioIn.mediaStream && typeof MediaStream !== "undefined" && audioIn.mediaStream instanceof MediaStream ? audioIn.mediaStream : null);
        if (providedStream) {
            releaseMicrophone();
            activeMicStream = providedStream;
            ownsMicStream = false;
            return true;
        }
    }

    if (activeMicStream && activeMicStream.getAudioTracks().some((t) => t.readyState === "live")) {
        return true;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        outStatus.set("Error: getUserMedia API not supported.");
        return false;
    }

    activeMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    ownsMicStream = true;
    return true;
}

function stopRecognitionInstance() {
    clearTimeout(restartTimeout);
    if (recognition) {
        try {
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.stop();
        } catch (e) {}
        recognition = null;
    }
}

function initRecognition() {
    stopRecognitionInstance();

    if (!checkEnvironmentSupport()) return;

    lastFatalError = null;
    recognition = new SpeechRecognition();
    recognition.continuous = inContinuous.get();
    recognition.interimResults = inInterim.get();
    recognition.lang = inLanguage.get() || "en-US";

    // Explicitly configure local processing with no cloud fallback
    recognition.processLocally = true;

    // Set grammar list if phrases are provided
    if (SpeechGrammarList) {
        const phrases = inPhrases.get();
        if (phrases && Array.isArray(phrases) && phrases.length > 0) {
            const speechRecognitionList = new SpeechGrammarList();
            const grammar = "#JSGF V1.0; grammar phrases; public <phrase> = " + phrases.join(" | ") + " ;";
            speechRecognitionList.addFromString(grammar, 1);
            recognition.grammars = speechRecognitionList;
        }
    }

    recognition.onstart = () => {
        lastFatalError = null;
        isListening = true;
        outListening.set(true);
        outStatus.set("Listening (On-Device)...");
    };

    recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
                finalTranscript += res[0].transcript;
                confidence = res[0].confidence;
            } else {
                interimTranscript += res[0].transcript;
            }
        }

        if (finalTranscript) {
            outText.set(finalTranscript);
            outConfidence.set(confidence);
            outNewResult.trigger();
        }

        if (inInterim.get()) {
            outInterimText.set(interimTranscript);
        }
    };

    recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (FATAL_SPEECH_ERRORS.has(event.error)) {
            lastFatalError = event.error;
        }
        outStatus.set("Error: " + event.error);
        if (event.error === "not-allowed") {
            showPermissionOverlay("Microphone permission required for on-device speech:");
        }
    };

    recognition.onend = () => {
        isListening = false;
        outListening.set(false);

        if (lastFatalError) {
            return;
        }

        if (inActive.get()) {
            outStatus.set("Restarting...");
            clearTimeout(restartTimeout);
            restartTimeout = setTimeout(() => {
                if (inActive.get() && recognition) {
                    try {
                        recognition.start();
                    } catch (e) {}
                }
            }, 400);
        } else {
            outStatus.set("Stopped");
        }
    };
}

async function startListening(options = {}) {
    const fromUserGesture = Boolean(options && options.fromUserGesture);
    const gen = ++sessionGeneration;

    stopRecognitionInstance();

    if (!inActive.get()) {
        outStatus.set("Stopped");
        return;
    }

    if (!checkEnvironmentSupport()) return;

    try {
        const hasMic = await acquireMicrophone();
        if (gen !== sessionGeneration || !inActive.get() || !hasMic) return;
    } catch (e) {
        if (gen !== sessionGeneration) return;
        const isGestureOrPerm = e && (e.name === "NotAllowedError" || e.name === "SecurityError" || e.name === "PermissionDeniedError");
        if (isGestureOrPerm && !fromUserGesture) {
            showPermissionOverlay("Click to grant microphone access for on-device speech:");
        } else {
            outStatus.set("Error: Microphone access denied (" + (e ? e.message : String(e)) + ")");
        }
        return;
    }

    initRecognition();
    if (!recognition || gen !== sessionGeneration) return;

    outStatus.set("Checking for on-device language support...");
    try {
        const result = await SpeechRecognition.available({ langs: [recognition.lang], processLocally: true });
        if (gen !== sessionGeneration || !inActive.get()) return;

        if (result === "available") {
            tryStart();
        } else if (result === "unavailable") {
            outStatus.set(`Language pack ${recognition.lang} not available locally.`);
        } else {
            if (!fromUserGesture && typeof navigator !== "undefined" && navigator.userActivation && !navigator.userActivation.isActive) {
                showPermissionOverlay(`Click to install local ${recognition.lang} speech pack:`);
                return;
            }
            outStatus.set("Language pack download required. Installing...");
            const success = await SpeechRecognition.install({ langs: [recognition.lang], processLocally: true });
            if (gen !== sessionGeneration || !inActive.get()) return;
            if (success) {
                tryStart();
            } else {
                outStatus.set("Download failed.");
            }
        }
    } catch (e) {
        if (gen !== sessionGeneration) return;
        outStatus.set("Error checking local availability: " + (e ? e.message : String(e)));
    }
}

function tryStart() {
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            outStatus.set("Start failed: " + e.message);
        }
    }
}

function stopListening() {
    sessionGeneration++;
    removePermissionOverlay();
    stopRecognitionInstance();
    releaseMicrophone();
    isListening = false;
    outListening.set(false);
    outStatus.set("Stopped");
}

inStart.onTriggered = () => {
    startListening({
        fromUserGesture: typeof navigator !== "undefined" && navigator.userActivation ? navigator.userActivation.isActive : false
    });
};

inActive.onChange = () => {
    if (inActive.get()) {
        startListening();
    } else {
        stopListening();
    }
};

inAudioIn.onChange = () => {
    if (inActive.get()) startListening();
};

inLanguage.onChange = () => {
    if (inActive.get()) startListening();
};

inContinuous.onChange = () => {
    if (inActive.get()) startListening();
};

inInterim.onChange = () => {
    if (inActive.get()) startListening();
};

inPhrases.onChange = () => {
    if (inActive.get()) startListening();
};

op.onDelete = () => {
    stopListening();
};

// Initial Setup on load
if (inActive.get()) {
    startListening();
} else {
    outStatus.set("Ready");
}
