/**
 * Ops.Extension.Standalone.MacOs.Hid.EightBitDoXboxLiteSe
 * 
 * Native macOS IOKit HID driver interface for 8BitDo Lite SE & Xbox controllers.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    
    inRumbleLeft = op.inValue("Rumble Left", 0.0),
    inRumbleRight = op.inValue("Rumble Right", 0.0),
    inRumbleLeftTrigger = op.inValue("Rumble Left Trigger", 0.0),
    inRumbleRightTrigger = op.inValue("Rumble Right Trigger", 0.0),
    inTriggerRumble = op.inTrigger("Trigger Rumble"),
    inSendOnChange = op.inBool("Send Rumble on Change", false),
    
    outTrigger = op.outTrigger("On Event"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outButtonsPressed = op.outArray("Buttons Pressed"),
    
    outLSX = op.outNumber("LS X"),
    outLSY = op.outNumber("LS Y"),
    outRSX = op.outNumber("RS X"),
    outRSY = op.outNumber("RS Y"),
    outLT = op.outNumber("LT"),
    outRT = op.outNumber("RT"),
    
    outA = op.outBool("A", false),
    outB = op.outBool("B", false),
    outX = op.outBool("X", false),
    outY = op.outBool("Y", false),
    outDpadUp = op.outBool("DPad Up", false),
    outDpadDown = op.outBool("DPad Down", false),
    outDpadLeft = op.outBool("DPad Left", false),
    outDpadRight = op.outBool("DPad Right", false),
    outLB = op.outBool("LB", false),
    outRB = op.outBool("RB", false),
    outLSClick = op.outBool("LS Click", false),
    outRSClick = op.outBool("RS Click", false),
    outMenu = op.outBool("Menu", false),
    outView = op.outBool("View", false),
    outGuide = op.outBool("Guide", false),
    outShare = op.outBool("Share", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Rumble", [
    inRumbleLeft,
    inRumbleRight,
    inRumbleLeftTrigger,
    inRumbleRightTrigger,
    inTriggerRumble,
    inSendOnChange
]);
op.setPortGroup("Status", [outStatus, outIsConnected, outTrigger, outButtonsPressed]);
op.setPortGroup("Sticks & Triggers", [outLSX, outLSY, outRSX, outRSY, outLT, outRT]);
op.setPortGroup("Face Buttons", [outA, outB, outX, outY]);
op.setPortGroup("D-Pad", [outDpadUp, outDpadDown, outDpadLeft, outDpadRight]);
op.setPortGroup("Shoulders & Sticks", [outLB, outRB, outLSClick, outRSClick]);
op.setPortGroup("System Buttons", [outMenu, outView, outGuide, outShare]);

let addon = null;
let initialized = false;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.EightBitDoXboxLiteSe/8bitdo_xbox.node";
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
        op.logError("[MacOs.Hid.EightBitDoXboxLiteSe] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.EightBitDoXboxLiteSe] Failed to load native addon: " + e.message);
        return false;
    }
}

function handleAddonEvent(jsonStr) {
    if (!jsonStr) return;
    
    try {
        const event = JSON.parse(jsonStr);
        if (event.type === "info") {
            const isConnected = event.status === "connected";
            outIsConnected.set(isConnected);
            outStatus.set(event.status === "connected" ? "Connected" : "Searching...");
        } else if (event.type === "input") {
            outLSX.set(event.ls[0]);
            outLSY.set(event.ls[1]);
            outRSX.set(event.rs[0]);
            outRSY.set(event.rs[1]);
            outLT.set(event.lt);
            outRT.set(event.rt);
            
            const pressed = event.buttons || [];
            outButtonsPressed.set(pressed);
            
            outA.set(pressed.includes("A"));
            outB.set(pressed.includes("B"));
            outX.set(pressed.includes("X"));
            outY.set(pressed.includes("Y"));
            outDpadUp.set(pressed.includes("Dpad Up"));
            outDpadDown.set(pressed.includes("Dpad Down"));
            outDpadLeft.set(pressed.includes("Dpad Left"));
            outDpadRight.set(pressed.includes("Dpad Right"));
            outLB.set(pressed.includes("LB"));
            outRB.set(pressed.includes("RB"));
            outLSClick.set(pressed.includes("LS Click"));
            outRSClick.set(pressed.includes("RS Click"));
            outMenu.set(pressed.includes("Menu"));
            outView.set(pressed.includes("View"));
            outGuide.set(pressed.includes("Guide"));
            outShare.set(pressed.includes("Share"));
            
            outTrigger.trigger();
        }
    } catch (e) {
        op.logWarn("[MacOs.Hid.EightBitDoXboxLiteSe] Error parsing controller event payload: " + e.message);
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        addon.start(handleAddonEvent);
        initialized = true;
        
        const connected = addon.isConnected();
        outIsConnected.set(connected);
        outStatus.set(connected ? "Connected" : "Searching...");
        return true;
    } catch (e) {
        op.logError("[MacOs.Hid.EightBitDoXboxLiteSe] Failed to start native controller manager: " + e.message);
        return false;
    }
}

function writeRumble() {
    if (!addon) return;
    if (!outIsConnected.get()) return;
    
    const left = parseFloat(inRumbleLeft.get()) || 0;
    const right = parseFloat(inRumbleRight.get()) || 0;
    const leftTrigger = parseFloat(inRumbleLeftTrigger.get()) || 0;
    const rightTrigger = parseFloat(inRumbleRightTrigger.get()) || 0;
    
    try {
        addon.setRumble(left, right, leftTrigger, rightTrigger);
    } catch (e) {
        op.logWarn("[MacOs.Hid.EightBitDoXboxLiteSe] Failed to write rumble packet: " + e.message);
    }
}

function handleRumbleChange() {
    if (inSendOnChange.get()) {
        writeRumble();
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
        outIsConnected.set(false);
        outStatus.set("Stopped");
    }
};

inTriggerRumble.onTriggered = writeRumble;
inRumbleLeft.onChange = handleRumbleChange;
inRumbleRight.onChange = handleRumbleChange;
inRumbleLeftTrigger.onChange = handleRumbleChange;
inRumbleRightTrigger.onChange = handleRumbleChange;

op.onDelete = () => {
    if (addon) {
        try { addon.stop(); } catch (e) {}
    }
};
