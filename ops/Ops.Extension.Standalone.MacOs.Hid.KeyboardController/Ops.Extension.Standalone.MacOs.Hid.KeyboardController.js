/**
 * Ops.Extension.Standalone.MacOs.Hid.KeyboardController
 * 
 * Native macOS CoreGraphics keyboard event generator.
 */
const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inEmit = op.inTrigger("Emit"),
    inKeystrokeObj = op.inObject("Keystroke Object"),
    
    outCombo = op.outString("Emitted Keystroke", ""),
    outTrigger = op.outTrigger("On Emitted"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inEmit, inKeystrokeObj]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger, outCombo]);

let addon = null;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.KeyboardController/keyboard_controller.node";
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
        op.logError("[MacOs.Hid.KeyboardController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.KeyboardController] Failed to load native addon: " + e.message);
        return false;
    }
}

inEmit.onTriggered = () => {
    if (!inActive.get()) return;
    if (!initAddon()) return;

    const obj = inKeystrokeObj.get();
    if (!obj) {
        op.logWarn("[MacOs.Hid.KeyboardController] Cannot emit: Keystroke Object is null.");
        return;
    }

    const key = obj.key || obj.Key || "";
    if (!key || String(key).trim() === "") {
        op.logWarn("[MacOs.Hid.KeyboardController] Cannot emit: 'key' property is empty or missing.");
        return;
    }

    let modifiers = obj.modifier || obj.modifiers || obj.Modifier || obj.Modifiers || "";
    if (typeof modifiers === "string" && modifiers.toLowerCase() === "none") {
        modifiers = "";
    }

    try {
        const result = addon.emit({
            key: String(key),
            modifiers: String(modifiers)
        });
        
        if (result && result.combo !== undefined) {
            outCombo.set(result.combo);
            outTrigger.trigger();
        }
    } catch (e) {
        op.logError("[MacOs.Hid.KeyboardController] Error emitting keystroke: " + e.message);
        outStatus.set("Error: " + e.message);
    }
};

inActive.onChange = () => {
    if (inActive.get()) {
        if (initAddon()) {
            outRunning.set(true);
            outStatus.set("Running");
        }
    } else {
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

if (inActive.get()) {
    if (initAddon()) {
        outRunning.set(true);
        outStatus.set("Running");
    }
}
