/**
 * Ops.Extension.Standalone.MacOs.Hid.KeyboardMonitor
 * 
 * Global macOS keyboard event listener using CoreGraphics event taps.
 */
const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),

    outPress = op.outTrigger("On Press"),
    outRelease = op.outTrigger("On Release"),
    outCombo = op.outString("Combo", ""),
    outKey = op.outString("Key", ""),
    outModifiers = op.outString("Modifiers", ""),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Status", [outStatus, outRunning, outPress, outRelease]);
op.setPortGroup("Key Details", [outCombo, outKey, outModifiers]);

let addon = null;
let active = false;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.KeyboardMonitor/keyboard_monitor.node";
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
        op.logError("[MacOs.Hid.KeyboardMonitor] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.KeyboardMonitor] Failed to load native addon: " + e.message);
        return false;
    }
}

function start() {
    if (active) stop();
    if (!inActive.get()) return;
    if (!initAddon()) return;

    outStatus.set("Starting...");
    
    try {
        const success = addon.start((event) => {
            handleEvent(event);
        });
        
        if (success) {
            active = true;
            outRunning.set(true);
            outStatus.set("Running");
        } else {
            outRunning.set(false);
            outStatus.set("Failed (Accessibility?)");
        }
    } catch (e) {
        op.logError("[MacOs.Hid.KeyboardMonitor] Failed to start native monitor: " + e.message);
        outRunning.set(false);
        outStatus.set("Error: " + e.message);
    }
}

function stop() {
    if (!active) return;
    active = false;
    outRunning.set(false);
    outStatus.set("Stopping...");
    
    if (addon) {
        try {
            addon.stop();
            outStatus.set("Stopped");
        } catch (e) {
            op.logError("[MacOs.Hid.KeyboardMonitor] Error during stop: " + e.message);
            outStatus.set("Error stopping");
        }
    } else {
        outStatus.set("Stopped");
    }
}

function handleEvent(msg) {
    if (!msg || !msg.event) return;

    outCombo.set("");
    outKey.set("");
    outModifiers.set("");

    outCombo.set(msg.combo || "");
    outKey.set(msg.key || "");
    outModifiers.set(msg.modifiers || "");

    if (msg.event === "press") {
        outPress.trigger();
    } else if (msg.event === "release") {
        outRelease.trigger();
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        start();
    } else {
        stop();
    }
};

op.onDelete = () => {
    stop();
};

if (inActive.get()) {
    start();
}
