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

let addon = null;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/mouse_controller.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MouseController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outRunning.set(true);
        outStatus.set("Running");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MouseController] Failed to load native addon: " + e.message);
        return false;
    }
}

inEmit.onTriggered = () => {
    if (!inActive.get()) return;

    if (!initAddon()) return;

    const obj = inMouseObj.get();
    if (!obj) {
        op.logWarn("[MouseController] Cannot emit: Mouse Object is null.");
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
        // Asynchronous click event scheduling using setTimeout to avoid thread blocking/usleep in C++
        try {
            const downPayload = Object.assign({}, payload, { action: "down" });
            const resultDown = addon.emit(downPayload);
            
            setTimeout(() => {
                try {
                    const upPayload = Object.assign({}, payload, { action: "up" });
                    const resultUp = addon.emit(upPayload);
                    
                    // Final emitted output mirrors the full requested click action
                    const emitted = Object.assign({}, resultUp, { action: "click" });
                    outEmitted.set(emitted);
                    outTrigger.trigger();
                } catch (errUp) {
                    op.logError("[MouseController] Error during click up release: " + errUp.message);
                }
            }, 10);
            
        } catch (errDown) {
            op.logError("[MouseController] Error during click down press: " + errDown.message);
        }
    } else {
        // Synchronous emission for all other operations
        try {
            const result = addon.emit(payload);
            outEmitted.set(result || {});
            outTrigger.trigger();
        } catch (e) {
            op.logError("[MouseController] Error emitting event: " + e.message);
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

// Initialize status
if (inActive.get()) {
    if (initAddon()) {
        outRunning.set(true);
        outStatus.set("Running");
    }
} else {
    outStatus.set("Stopped");
}
