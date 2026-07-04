/**
 * Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap
 * 
 * High-performance macOS screen/window audio loopback capture using CoreAudio process taps N-API.
 */
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", false),
    inType = op.inString("Capture Type", "System Audio Capture"),
    inSource = op.inString("Source", "None"),
    inVolume = op.inFloat("Volume", 1.0),
    inRefresh = op.inTriggerButton("Refresh"),
    
    outAudioNode = op.outObject("Audio Node"),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inRefresh]);
op.setPortGroup("Source Settings", [inType, inSource]);
op.setPortGroup("Settings", [inVolume]);

inType.setUiAttribs({ "display": "dropdown", "values": ["System Audio Capture", "Window Audio Capture"] });
inSource.setUiAttribs({ "display": "dropdown", "values": ["None"] });

let addon = null;
let isCapturing = false;

// Audio context nodes
let audioCtx = null;
let scriptNode = null;
let gainNode = null;

// Shareable source mapping lists
let windows = [];
let sourceNames = [];
let sourceMap = {};
function getAddonPath() {
    const dir = (typeof __dirname !== "undefined") ? __dirname : ".";
    const localPath = path.join(dir, "coreaudio_tap.node");
    if (fs.existsSync(localPath)) return localPath;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap/coreaudio_tap.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    }
    return addonPath;
}

function initAddon() {
    if (addon) return true;
    
    const resolvedPath = getAddonPath();
    if (!fs.existsSync(resolvedPath)) {
        op.logError("[CoreAudioTap] Native addon binary not found at: " + resolvedPath);
        outStatus.set("Binary Not Found");
        return false;
    }
    
    try {
        addon = op.require(resolvedPath);
        return true;
    } catch (e) {
        op.logError("[CoreAudioTap] Failed to load native addon: " + String(e));
        outStatus.set("Initialization Error");
        return false;
    }
}

function refreshSources() {
    if (!initAddon()) return;
    
    const type = inType.get();
    if (type === "System Audio Capture") {
        sourceNames = ["Default System Output"];
        sourceMap = { "Default System Output": { type: "system", pid: 0 } };
        inSource.setUiAttribs({ "values": sourceNames });
        inSource.set("Default System Output");
        outStatus.set(isCapturing ? "Capturing" : "Sources Updated");
        return;
    }
    
    outStatus.set("Querying active windows...");
    
    addon.getShareableContent((err, content) => {
        if (err || !content) {
            op.logError("[CoreAudioTap] Failed to query windows list: " + String(err));
            outStatus.set("Query Failed");
            return;
        }
        
        windows = content.windows || [];
        
        sourceNames = ["None"];
        sourceMap = {};
        
        windows.forEach((win) => {
            const label = `${win.appName} - ${win.title.substring(0, 40)} (PID: ${win.pid})`;
            sourceNames.push(label);
            sourceMap[label] = { type: "window", pid: win.pid };
        });
        
        inSource.setUiAttribs({ "values": sourceNames });
        outStatus.set(isCapturing ? "Capturing" : "Sources Updated");
    });
}

function cleanupAudioNodes() {
    outAudioNode.set(null);
    
    if (scriptNode) {
        scriptNode.onaudioprocess = null;
        try { scriptNode.disconnect(); } catch (e) {}
        scriptNode = null;
    }
    
    if (gainNode) {
        try { gainNode.disconnect(); } catch (e) {}
        gainNode = null;
    }
    
    audioCtx = null;
}

function stopCapture() {
    cleanupAudioNodes();
    
    if (addon && isCapturing) {
        try {
            addon.stopCapture();
        } catch (e) {
            op.logWarn("[CoreAudioTap] Error stopping capture: " + e);
        }
    }
    isCapturing = false;
    outStatus.set("Stopped");
}

function startCapture() {
    stopCapture();
    
    if (!inActive.get()) return;
    if (!initAddon()) return;
    
    const sourceLabel = inSource.get();
    if (sourceLabel === "None" || !sourceMap[sourceLabel]) {
        outStatus.set("Select a valid source");
        return;
    }
    
    const target = sourceMap[sourceLabel];
    outStatus.set("Starting CoreAudio tap...");
    
    try {
        addon.startCapture({
            type: target.type,
            pid: target.pid
        });
        
        isCapturing = true;
        outStatus.set("Capturing");
        
        // Setup Web Audio graph routing
        setupAudioContext();
        
    } catch (e) {
        op.logError("[CoreAudioTap] Failed to start capture: " + e);
        outStatus.set("Capture Start Failed");
        stopCapture();
    }
}

function setupAudioContext() {
    if (CABLES.WEBAUDIO) {
        audioCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } else {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            if (!window.audioContext) window.audioContext = new AudioContext();
            audioCtx = window.audioContext;
        }
    }
    
    if (!audioCtx) {
        op.logError("[CoreAudioTap] AudioContext is not available");
        outStatus.set("Audio Context Error");
        return;
    }
    
    if (audioCtx.state === "suspended") {
        audioCtx.resume().catch((re) => {
            op.error("[CoreAudioTap] Failed to resume AudioContext:", re);
        });
    }
    
    // Create ScriptProcessorNode (stereo output, 0 inputs)
    scriptNode = audioCtx.createScriptProcessor(2048, 0, 2);
    scriptNode.onaudioprocess = (audioProcessingEvent) => {
        if (!addon || !isCapturing) return;
        
        let outputBuffer = audioProcessingEvent.outputBuffer;
        let leftChannel = outputBuffer.getChannelData(0);
        let rightChannel = outputBuffer.getChannelData(1);
        
        const len = outputBuffer.length;
        const samples = addon.getLatestAudioSamples(len);
        
        if (samples && samples.left && samples.left.length > 0) {
            const count = samples.left.length;
            leftChannel.set(samples.left);
            rightChannel.set(samples.right);
            
            // Pad remainder with zeros if circular buffer ran short
            if (count < len) {
                leftChannel.fill(0, count);
                rightChannel.fill(0, count);
            }
        } else {
            leftChannel.fill(0);
            rightChannel.fill(0);
        }
    };
    
    // Create gain control node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = inVolume.get();
    
    scriptNode.connect(gainNode);
    outAudioNode.set(gainNode);
}

inActive.onChange = () => {
    if (inActive.get()) {
        startCapture();
    } else {
        stopCapture();
    }
};

inType.onChange = () => {
    refreshSources();
    stopCapture();
    inSource.set("None");
};

inSource.onChange = () => {
    if (inActive.get()) {
        startCapture();
    }
};

inVolume.onChange = () => {
    if (gainNode && gainNode.gain) {
        gainNode.gain.value = inVolume.get();
    }
};

inRefresh.onTriggered = () => {
    refreshSources();
};

op.onDelete = () => {
    stopCapture();
};

// Initial query on startup
setTimeout(() => {
    refreshSources();
}, 500);
