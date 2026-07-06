/**
 * Ops.Extension.Standalone.AppleFrameworks.ActiveApp
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

inInterval.setUiAttribs({
    "min": 100,
    "max": 10000,
    "step": 50
});

let addon = null;
let intervalId = null;
let lastPID = 0;
let lastTitle = "";

// Load the compiled N-API native addon
try {
    const addonPath = path.join(
        op.patch.config.prefixAssetPath,
        "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ActiveApp/build/Release/active_app.node"
    );
    const resolvedPath = op.patch && typeof op.patch.filePath === "function" ? op.patch.filePath(addonPath) : addonPath;
    if (fs.existsSync(resolvedPath)) {
        addon = op.require(resolvedPath);
        outStatus.set("Addon Loaded");
    } else {
        outStatus.set("Addon Not Compiled");
    }
} catch (e) {
    op.logError("[ActiveApp] Error loading native addon: " + String(e));
    outStatus.set("Load Error");
}

function startPolling() {
    stopPolling();
    if (!inActive.get() || !addon) return;
    
    outRunning.set(true);
    outStatus.set("Polling");
    
    const intervalVal = parseInt(inInterval.get()) || 500;
    intervalId = setInterval(checkActiveApp, intervalVal);
}

function stopPolling() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    outRunning.set(false);
    if (addon) {
        outStatus.set("Addon Loaded");
    } else {
        outStatus.set("Addon Not Compiled");
    }
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
        op.logError("[ActiveApp] Error polling active app: " + String(e));
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

// Try loading or reloading the addon context
if (inActive.get()) {
    startPolling();
}
