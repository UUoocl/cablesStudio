/**
 * Ops.Extension.Standalone.MacOs.Hid.MouseMonitor
 * 
 * Global macOS mouse cursor position, click, and scroll wheel listener using CoreGraphics event taps.
 */
const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inPps = op.inInt("PPS Limit", 20),

    outTriggerMove = op.outTrigger("On Move"),
    outTriggerClick = op.outTrigger("On Click"),
    outTriggerScroll = op.outTrigger("On Scroll"),
    outPosX = op.outNumber("Pos X", 0),
    outPosY = op.outNumber("Pos Y", 0),
    outButton = op.outNumber("Button", 0),
    outIsDown = op.outBool("Button Is Down", false),
    outIsUp = op.outBool("Button Is Up", false),
    outScrollDeltaX = op.outNumber("Scroll Delta X", 0),
    outScrollDeltaY = op.outNumber("Scroll Delta Y", 0),

    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inPps]);
op.setPortGroup("Status", [outStatus, outRunning, outTriggerMove, outTriggerClick, outTriggerScroll]);
op.setPortGroup("Coordinates & State", [outPosX, outPosY, outButton, outIsDown, outIsUp, outScrollDeltaX, outScrollDeltaY]);

let addon = null;
let active = false;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.MouseMonitor/mouse_monitor.node";
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
        op.logError("[MacOs.Hid.MouseMonitor] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.MouseMonitor] Failed to load native addon: " + e.message);
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
        op.logError("[MacOs.Hid.MouseMonitor] Failed to start native monitor: " + e.message);
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
            op.logError("[MacOs.Hid.MouseMonitor] Error during stop: " + e.message);
            outStatus.set("Error stopping");
        }
    } else {
        outStatus.set("Stopped");
    }
}

function handleEvent(event) {
    if (!event || !event.type) return;
    
    const msg = event;

    if (msg.type === "mousePosition") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        outTriggerMove.trigger();
    } else if (msg.type === "mouseClick") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        const buttonNum = msg.data.button ? parseInt(msg.data.button.substring(2), 10) : 0;
        outButton.set(buttonNum);
        outIsDown.set(msg.data.pressed);
        outIsUp.set(!msg.data.pressed);
        outTriggerClick.trigger();
    } else if (msg.type === "mouseScroll") {
        outPosX.set(msg.data.x);
        outPosY.set(msg.data.y);
        outScrollDeltaX.set(msg.data.dx);
        outScrollDeltaY.set(msg.data.dy);
        outTriggerScroll.trigger();
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

if (inActive.get()) {
    start();
}
