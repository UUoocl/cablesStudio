const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outRunning = op.outBool("Running", false),

    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),

    outShuttleValue = op.outNumber("Shuttle Value", 0),
    outShuttleMoved = op.outTrigger("Shuttle Moved"),

    outButtonIndex = op.outNumber("Button Index", -1),
    outButtonPressed = op.outBool("Button Pressed", false),
    outButtonEvent = op.outTrigger("Button Event");

let addon = null;
let initialized = false;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro/contour_shuttle_pro.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[ContourShuttlePro] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[ContourShuttlePro] Failed to load native addon: " + e.message);
        return false;
    }
}

function handleAddonEvent(jsonStr) {
    if (!jsonStr) return;
    
    try {
        const msg = JSON.parse(jsonStr);
        if (msg.type === "info") {
            if (msg.status === "connected") {
                outStatus.set(`Connected: ${msg.device}`);
            } else if (msg.status === "searching") {
                outStatus.set("Searching...");
            }
        } else if (msg.type === "shuttle") {
            outShuttleValue.set(msg.value);
            outShuttleMoved.trigger();
            outEvent.trigger();
        } else if (msg.type === "jog") {
            outJogDelta.set(msg.delta);
            outJogValue.set(msg.value);
            outJogTurned.trigger();
            outEvent.trigger();
        } else if (msg.type === "button") {
            outButtonIndex.set(msg.index);
            outButtonPressed.set(msg.pressed);
            outButtonEvent.trigger();
            outEvent.trigger();
        }
    } catch (e) {
        op.logWarn("[ContourShuttlePro] Error parsing event payload: " + e.message);
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        addon.start(handleAddonEvent);
        initialized = true;
        
        // Sync connection state
        const connected = addon.isConnected();
        outStatus.set(connected ? "Connected" : "Searching...");
        outRunning.set(true);
        return true;
    } catch (e) {
        op.logError("[ContourShuttlePro] Failed to start native controller: " + e.message);
        return false;
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        ensureInitialized();
    } else {
        if (addon) {
            try { addon.stop(); } catch (e) {}
            initialized = false;
        }
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

op.onDelete = () => {
    if (addon) {
        try {
            addon.stop();
        } catch (e) {}
    }
};

// Auto start if active
if (inActive.get()) {
    ensureInitialized();
} else {
    outStatus.set("Stopped");
}
