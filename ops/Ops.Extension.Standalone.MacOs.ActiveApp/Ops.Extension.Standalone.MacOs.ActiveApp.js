/**
 * Ops.Extension.Standalone.MacOs.ActiveApp
 * 
 * Monitors the frontmost active application and window title on macOS using a native Node addon (N-API).
 */

const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", true),
    inInterval = op.inValueInt("Interval (ms)", 500),
    
    outAppName = op.outString("Application Name", ""),
    outBundleId = op.outString("Bundle Identifier", ""),
    outPid = op.outNumber("Process ID", 0),
    outWindowTitle = op.outString("Window Title", ""),
    outChanged = op.outTrigger("On Changed"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inInterval]);
op.setPortGroup("Status", [outStatus, outRunning, outChanged]);
op.setPortGroup("Application Details", [outAppName, outBundleId, outPid, outWindowTitle]);

inInterval.setUiAttribs({
    "min": 100,
    "max": 10000,
    "step": 50
});

let addon = null;
let intervalId = null;
let lastPID = 0;
let lastTitle = "";

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.ActiveApp/active_app.node";
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
        op.logError("[MacOs.ActiveApp] Native addon binary not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        outStatus.set("Addon Loaded");
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.ActiveApp] Failed to load native addon: " + e.message);
        return false;
    }
}

function startPolling() {
    stopPolling();
    if (!inActive.get()) return;
    if (!initAddon()) return;
    
    outRunning.set(true);
    outStatus.set("Polling");
    
    const intervalVal = parseInt(inInterval.get()) || 500;
    intervalId = setInterval(checkActiveApp, intervalVal);
    checkActiveApp();
}

function stopPolling() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    outRunning.set(false);
    outStatus.set(addon ? "Stopped" : "Not Compiled");
}

function checkActiveApp() {
    if (!addon) return;
    try {
        const info = addon.getActiveApp();
        if (!info) return;
        
        const pid = info.pid || 0;
        const windowTitle = info.windowTitle || "";
        
        if (pid !== lastPID || windowTitle !== lastTitle) {
            lastPID = pid;
            lastTitle = windowTitle;
            
            outAppName.set(info.name || "");
            outBundleId.set(info.bundleId || "");
            outPid.set(pid);
            outWindowTitle.set(windowTitle);
            outChanged.trigger();
        }
    } catch (e) {
        op.logError("[MacOs.ActiveApp] Error polling active app: " + e.message);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        startPolling();
    } else {
        stopPolling();
    }
};

inInterval.onChange = () => {
    if (inActive.get()) {
        startPolling();
    }
};

op.onDelete = () => {
    stopPolling();
};

if (inActive.get()) {
    startPolling();
}
