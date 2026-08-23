/**
 * Ops.Extension.Standalone.MacOs.Hid.SoomfonController
 * 
 * Interfacing natively with Soomfon Stream Controller / Visual Macro Keypad devices
 * using compiled macOS IOKit HID driver.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false),

    outKnobEvent = op.outTrigger("Knob Event"),
    outEventKnobIndex = op.outNumber("Event Knob Index", 0),
    outEventKnobDirection = op.outNumber("Event Knob Direction", 0),
    outKnob0Value = op.outNumber("Knob 0 Value", 0),
    outKnob1Value = op.outNumber("Knob 1 Value", 0),
    outKnob2Value = op.outNumber("Knob 2 Value", 0),

    outKnobClickEvent = op.outTrigger("Knob Click Event"),
    outEventKnobClickIndex = op.outNumber("Event Knob Click Index", 0),
    outEventKnobClickPressed = op.outBool("Event Knob Click Pressed", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Settings", [inDeviceIndex]);
op.setPortGroup("State", [outConnection, outIsConnected, outStatus, outDeviceInfo]);
op.setPortGroup("Key Events", [outKeyEvent, outEventKeyIndex, outEventPressed]);
op.setPortGroup("Knob Events", [outKnobEvent, outEventKnobIndex, outEventKnobDirection, outKnob0Value, outKnob1Value, outKnob2Value]);
op.setPortGroup("Knob Click Events", [outKnobClickEvent, outEventKnobClickIndex, outEventKnobClickPressed]);

let addon = null;
let initialized = false;

let knob0Val = 0;
let knob1Val = 0;
let knob2Val = 0;

outConnection.set(null);
outDeviceInfo.set(null);
resetKnobValues();

function resetKnobValues() {
    knob0Val = 0;
    knob1Val = 0;
    knob2Val = 0;
    outKnob0Value.set(0);
    outKnob1Value.set(0);
    outKnob2Value.set(0);
}

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Hid.SoomfonController/soomfon_controller.node";
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
        op.logError("[MacOs.Hid.SoomfonController] Native addon binary not found at: " + addonPath);
        return false;
    }

    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.SoomfonController] Failed to load native addon: " + e.message);
        return false;
    }
}

// Connection bridge object exposed to texture writers
const connection = {
    key_width: 60,
    key_height: 60,
    cols: 3,
    rows: 2,
    iconSize: 60,
    keyCount: 6,

    send(action, params) {
        if (!addon || !initialized) return;
        try {
            if (action === "set_key_image") {
                if (typeof params.key === "number" && typeof params.image === "string") {
                    addon.setKeyImage(params.key, params.image);
                }
            } else if (action === "set_stretched_image") {
                if (typeof params.image === "string") {
                    addon.setStretchedImage(params.image);
                }
            } else if (action === "set_brightness") {
                if (typeof params.brightness === "number") {
                    addon.setBrightness(params.brightness);
                }
            }
        } catch (e) {
            op.logError("[MacOs.Hid.SoomfonController] Native write failed: " + e.message);
        }
    },

    async fillKeyImage(keyIndex, canvasOrSource, quality = 0.85) {
        if (!addon || !initialized) return;
        let base64 = "";
        if (typeof canvasOrSource === "string") {
            base64 = canvasOrSource.includes(",") ? canvasOrSource.split(",")[1] : canvasOrSource;
        } else if (canvasOrSource && typeof canvasOrSource.toDataURL === "function") {
            const dataUrl = canvasOrSource.toDataURL("image/jpeg", quality);
            base64 = dataUrl.split(",")[1];
        }
        if (base64) {
            addon.setKeyImage(keyIndex, base64);
        }
    },

    async fillStretchedImage(canvasOrSource, quality = 0.85) {
        if (!addon || !initialized) return;
        let base64 = "";
        if (typeof canvasOrSource === "string") {
            base64 = canvasOrSource.includes(",") ? canvasOrSource.split(",")[1] : canvasOrSource;
        } else if (canvasOrSource && typeof canvasOrSource.toDataURL === "function") {
            const dataUrl = canvasOrSource.toDataURL("image/jpeg", quality);
            base64 = dataUrl.split(",")[1];
        }
        if (base64) {
            addon.setStretchedImage(base64);
        }
    },

    setBrightness(percent) {
        if (addon && initialized) {
            addon.setBrightness(percent);
        }
    }
};

function handleAddonEvent(jsonStr) {
    if (!jsonStr) return;
    
    try {
        const msg = JSON.parse(jsonStr);

        if (msg.type === "connected") {
            outIsConnected.set(true);
            outDeviceInfo.set(msg);
            outConnection.set(connection);
            outStatus.set("Connected");
            op.log(`[MacOs.Hid.SoomfonController] Connected to ${msg.model}`);
        } else if (msg.type === "key_event") {
            outEventKeyIndex.set(msg.key);
            outEventPressed.set(msg.pressed);
            outKeyEvent.trigger();
        } else if (msg.type === "knob_turn") {
            outEventKnobIndex.set(msg.knob);
            outEventKnobDirection.set(msg.direction);
            if (msg.knob === 0) {
                knob0Val += msg.direction;
                outKnob0Value.set(knob0Val);
            } else if (msg.knob === 1) {
                knob1Val += msg.direction;
                outKnob1Value.set(knob1Val);
            } else if (msg.knob === 2) {
                knob2Val += msg.direction;
                outKnob2Value.set(knob2Val);
            }
            outKnobEvent.trigger();
        } else if (msg.type === "knob_click") {
            outEventKnobClickIndex.set(msg.knob);
            outEventKnobClickPressed.set(msg.pressed);
            outKnobClickEvent.trigger();
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            outIsConnected.set(false);
            outConnection.set(null);
            op.logError("[MacOs.Hid.SoomfonController] Addon error: " + msg.message);
        } else if (msg.type === "disconnected") {
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Disconnected");
        }
    } catch (e) {
        op.logWarn("[MacOs.Hid.SoomfonController] Error parsing event payload: " + e.message);
    }
}

function startController() {
    if (initialized) stopController();
    if (!initAddon()) return;

    outStatus.set("Connecting...");
    try {
        const devIdx = inDeviceIndex.get();
        addon.start(devIdx, (eventJson) => {
            handleAddonEvent(eventJson);
        });
        initialized = true;
    } catch (e) {
        outStatus.set("Init Failed");
        op.logError("[MacOs.Hid.SoomfonController] start() error: " + e.message);
        stopController();
    }
}

function stopController() {
    if (addon && initialized) {
        try {
            addon.stop();
        } catch (e) {
            op.logWarn("[MacOs.Hid.SoomfonController] stop() error: " + e.message);
        }
    }
    initialized = false;
    outIsConnected.set(false);
    outConnection.set(null);
    outDeviceInfo.set(null);
    outStatus.set("Stopped");
    resetKnobValues();
}

inActive.onChange = () => {
    if (inActive.get()) {
        startController();
    } else {
        stopController();
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get()) {
        startController();
    }
};

op.onDelete = () => {
    stopController();
};
