/**
 * Ops.Extension.Standalone.MacOs.Hid.MouseController
 * 
 * Native macOS mouse cursor and button event generator using CoreGraphics.
 */
const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inEmit = op.inTrigger("Emit"),
    inMouseObj = op.inObject("Mouse Object"),
    
    outEmitted = op.outObject("Emitted Mouse"),
    outTrigger = op.outTrigger("On Emitted"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inEmit, inMouseObj]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger, outEmitted]);

let addon = null;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.MouseController/mouse_controller.node";
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
        op.logError("[MacOs.Hid.MouseController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.MouseController] Failed to load native addon: " + e.message);
        return false;
    }
}

inEmit.onTriggered = () => {
    if (!inActive.get()) return;
    if (!initAddon()) return;

    const obj = inMouseObj.get();
    if (!obj) {
        op.logWarn("[MacOs.Hid.MouseController] Cannot emit: Mouse Object is null.");
        return;
    }

    const payload = {};
    if (obj.x !== undefined && obj.x !== null) payload.x = Number(obj.x);
    if (obj.y !== undefined && obj.y !== null) payload.y = Number(obj.y);
    if (obj.button !== undefined && obj.button !== null) payload.button = String(obj.button).toLowerCase();
    if (obj.action !== undefined && obj.action !== null) payload.action = String(obj.action).toLowerCase();
    if (obj.scrollX !== undefined && obj.scrollX !== null) payload.scrollX = Number(obj.scrollX);
    if (obj.scrollY !== undefined && obj.scrollY !== null) payload.scrollY = Number(obj.scrollY);

    if (payload.action === "click") {
        try {
            const downPayload = Object.assign({}, payload, { action: "down" });
            addon.emit(downPayload);
            
            setTimeout(() => {
                try {
                    const upPayload = Object.assign({}, payload, { action: "up" });
                    const resultUp = addon.emit(upPayload);
                    
                    const emitted = Object.assign({}, resultUp, { action: "click" });
                    outEmitted.set(emitted);
                    outTrigger.trigger();
                } catch (errUp) {
                    op.logError("[MacOs.Hid.MouseController] Error during click up release: " + errUp.message);
                }
            }, 10);
            
        } catch (errDown) {
            op.logError("[MacOs.Hid.MouseController] Error during click down press: " + errDown.message);
        }
    } else {
        try {
            const result = addon.emit(payload);
            outEmitted.set(result || {});
            outTrigger.trigger();
        } catch (e) {
            op.logError("[MacOs.Hid.MouseController] Error emitting event: " + e.message);
            outStatus.set("Error: " + e.message);
        }
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
