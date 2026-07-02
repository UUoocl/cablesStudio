const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inLocale = op.inValueSelect("Language Locale", ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "ja-JP", "zh-CN", "pt-BR"], "en-US"),
    inAudioDevice = op.inValueSelect("Audio Input Device", ["Default System Microphone"]),
    inOutputMode = op.inValueSelect("Output Mode", ["Full Transcript", "New Words Only", "Chunk"], "Full Transcript"),
    inSilenceDuration = op.inValue("Silence Duration (s)", 1.5),
    inResetText = op.inTrigger("Reset Text"),
    
    outText = op.outString("Transcribed Text", ""),
    outTrigger = op.outTrigger("On Word Received"),
    outIsFinal = op.outBool("Is Final Segment", false),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let addon = null;
let initialized = false;
let audioDevicesList = [];
let lastEmittedText = "";

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/speech_to_text.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[SpeechToText] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[SpeechToText] Failed to load native addon: " + e.message);
        return false;
    }
}

function handleAddonEvent(event) {
    if (!event) return;

    if (event.type === "transcription") {
        const text = event.text || "";
        outIsFinal.set(!!event.isFinal);
        
        if (event.isFinal) {
            lastEmittedText = "";
        }
        
        const mode = inOutputMode.get();
        if (mode === "New Words Only") {
            const prevWords = lastEmittedText.trim().split(/\s+/).filter(Boolean);
            const currWords = text.trim().split(/\s+/).filter(Boolean);
            
            const isNewSentence = prevWords.length === 0 || 
                                 currWords.length === 0 || 
                                 currWords[0].toLowerCase() !== prevWords[0].toLowerCase();
            
            if (isNewSentence) {
                // Safeguard: A brand new spoken phrase segment never starts with a long block of words instantly.
                if (currWords.length <= 5) {
                    const delta = currWords.join(" ");
                    if (delta) {
                        outText.set(delta);
                        outTrigger.trigger();
                    }
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
            if (event.isFinal) {
                outText.set(text);
                outTrigger.trigger();
            }
        } else {
            outText.set(text);
            outTrigger.trigger();
        }
    } else if (event.type === "devices") {
        audioDevicesList = event.devices || [];
        const names = [];
        audioDevicesList.forEach(dev => {
            names.push(dev.name);
        });
        
        inAudioDevice.setUiAttribs({ "values": names });
    } else if (event.type === "status") {
        outStatus.set(event.status || "Stopped");
        if (event.status === "Running") {
            outRunning.set(true);
        } else if (event.status === "Stopped" || event.status.indexOf("Failed") !== -1) {
            outRunning.set(false);
        }
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        addon.initRecognizer(handleAddonEvent);
        initialized = true;
        return true;
    } catch (e) {
        op.logError("[SpeechToText] Failed to initialize native recognizer: " + e.message);
        return false;
    }
}

inActive.onChange = () => {
    if (!ensureInitialized()) return;

    if (inActive.get()) {
        const locale = inLocale.get() || "en-US";
        const selectedName = inAudioDevice.get();
        let selectedID = "Default";
        const found = audioDevicesList.find(d => d.name === selectedName);
        if (found) {
            selectedID = found.id;
        }
        const silenceDur = parseFloat(inSilenceDuration.get()) || 1.5;
        
        addon.start(locale, selectedID, silenceDur);
    } else {
        addon.stop();
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

inLocale.onChange = () => {
    if (!ensureInitialized()) return;
    if (inActive.get()) {
        addon.setLocale(inLocale.get() || "en-US");
    }
};

inAudioDevice.onChange = () => {
    if (!ensureInitialized()) return;
    if (inActive.get()) {
        const selectedName = inAudioDevice.get();
        let selectedID = "Default";
        const found = audioDevicesList.find(d => d.name === selectedName);
        if (found) {
            selectedID = found.id;
        }
        addon.setAudioDevice(selectedID);
    }
};

inSilenceDuration.onChange = () => {
    if (!ensureInitialized()) return;
    if (inActive.get()) {
        addon.setSilenceDuration(parseFloat(inSilenceDuration.get()) || 1.5);
    }
};

inResetText.onTriggered = () => {
    if (!ensureInitialized()) return;
    addon.reset();
    outText.set("");
    lastEmittedText = "";
};

op.onDelete = () => {
    if (addon) {
        try {
            addon.stop();
        } catch (e) {}
    }
};

// Initialize device listing dynamically on evaluation
ensureInitialized();
