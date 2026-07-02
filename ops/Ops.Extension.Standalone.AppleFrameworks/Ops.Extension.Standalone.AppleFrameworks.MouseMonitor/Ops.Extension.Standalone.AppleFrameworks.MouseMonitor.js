const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inPps = op.inInt("PPS Limit", 20),

    outUpdate = op.outTrigger("On Update"),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outClick = op.outString("Click", ""),
    outScrollDeltaX = op.outNumber("Scroll Delta X", 0),
    outScrollDeltaY = op.outNumber("Scroll Delta Y", 0),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let addon = null;
let active = false;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/mouse_monitor.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MouseMonitor] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MouseMonitor] Failed to load native addon: " + e.message);
        return false;
    }
}

function start() {
    if (active) stop();
    if (!inActive.get()) return;

    if (!initAddon()) return;

    const pps = inPps.get() || 20;
    outStatus.set("Starting...");
    
    try {
        const success = addon.start((event) => {
            // Callback from native C++ background thread
            handleEvent(event);
        }, pps);
        
        if (success) {
            active = true;
            outRunning.set(true);
            outStatus.set("Running");
        } else {
            outRunning.set(false);
            outStatus.set("Failed (Accessibility?)");
        }
    } catch (e) {
        op.logError("[MouseMonitor] Failed to start native monitor: " + e.message);
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
            op.logError("[MouseMonitor] Error during stop: " + e.message);
            outStatus.set("Error stopping");
        }
    } else {
        outStatus.set("Stopped");
    }
}

function handleEvent(event) {
    if (!event || !event.type) return;
    
    let updated = false;
    const msg = event; // Event matches { type: "...", data: { ... } }

    if (msg.type === "mousePosition") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        updated = true;
    } else if (msg.type === "mouseClick") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        outClick.set(`${msg.data.button} ${msg.data.pressed ? "down" : "up"}`);
        updated = true;
    } else if (msg.type === "mouseScroll") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        outScrollDeltaX.set(msg.data.dx);
        outScrollDeltaY.set(msg.data.dy);
        updated = true;
    }

    if (updated) {
        outUpdate.trigger();
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        start();
    } else {
        stop();
    }
};

inPps.onChange = () => {
    if (inActive.get() && active) {
        start();
    }
};

op.onDelete = () => {
    stop();
};

// Initialize status
outStatus.set("Stopped");
