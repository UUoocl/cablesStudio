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

let addon = null;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/keyboard_controller.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[KeyboardController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[KeyboardController] Failed to load native addon: " + e.message);
        return false;
    }
}

inEmit.onTriggered = () => {
    if (!inActive.get()) return;

    if (!initAddon()) return;

    const obj = inKeystrokeObj.get();
    if (!obj) {
        op.logWarn("[KeyboardController] Cannot emit: Keystroke Object is null.");
        return;
    }

    const key = obj.key || obj.Key || "";
    if (!key || String(key).trim() === "") {
        op.logWarn("[KeyboardController] Cannot emit: 'key' property is empty or missing in Keystroke Object.");
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
        op.logError("[KeyboardController] Error emitting keystroke: " + e.message);
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

// Initialize status
if (inActive.get()) {
    if (initAddon()) {
        outRunning.set(true);
        outStatus.set("Running");
    }
} else {
    outStatus.set("Stopped");
}
