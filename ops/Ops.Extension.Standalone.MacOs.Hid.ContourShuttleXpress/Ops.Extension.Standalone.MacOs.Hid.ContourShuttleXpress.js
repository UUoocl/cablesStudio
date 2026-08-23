/**
 * Ops.Extension.Standalone.MacOs.Hid.ContourShuttleXpress
 * 
 * Native macOS IOKit HID driver interface for the Contour ShuttleXpress multimedia jog/shuttle controller.
 */

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

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Status", [outStatus, outRunning, outEvent]);
op.setPortGroup("Jog Wheel", [outJogValue, outJogDelta, outJogTurned]);
op.setPortGroup("Shuttle Ring", [outShuttleValue, outShuttleMoved]);
op.setPortGroup("Buttons", [outButtonIndex, outButtonPressed, outButtonEvent]);

let addon = null;
let initialized = false;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.ContourShuttleXpress/contour_shuttle_xpress.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(relative);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, relative);
}

function initAddon() {
    if (addon) return true;

    const addonPath = getAddonPath();
    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MacOs.Hid.ContourShuttleXpress] Native addon not found at: " + addonPath);
        return false;
    }

    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.ContourShuttleXpress] Failed to load native addon: " + e.message);
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
        op.logWarn("[MacOs.Hid.ContourShuttleXpress] Error parsing event payload: " + e.message);
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        addon.start(handleAddonEvent);
        initialized = true;
        
        const connected = addon.isConnected();
        outStatus.set(connected ? "Connected" : "Searching...");
        outRunning.set(true);
        return true;
    } catch (e) {
        op.logError("[MacOs.Hid.ContourShuttleXpress] Failed to start native controller: " + e.message);
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
        try { addon.stop(); } catch (e) {}
    }
};
