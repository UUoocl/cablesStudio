const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    
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

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SoomfonController/soomfon_controller.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[SoomfonController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[SoomfonController] Failed to load native addon: " + e.message);
        return false;
    }
}

// Connection bridge object exposed to texture writers
const connection = {
    key_width: 60,
    key_height: 60,
    cols: 3,
    rows: 2,
    send(action, params) {
        if (!addon || !initialized) {
            op.logWarn("[SoomfonController] Addon is not active.");
            return;
        }
        try {
            if (action === "set_key_image") {
                if (typeof params.key === "number" && typeof params.image === "string") {
                    addon.setKeyImage(params.key, params.image);
                }
            } else if (action === "set_stretched_image") {
                if (typeof params.image === "string") {
                    addon.setStretchedImage(params.image);
                }
            }
        } catch (e) {
            op.logError("[SoomfonController] Native write failed: " + e.message);
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
            op.log(`[SoomfonController] Connected to ${msg.model}`);
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
            op.logError("[SoomfonController] Addon error: " + msg.message);
        } else if (msg.type === "disconnected") {
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Disconnected");
        }
    } catch (e) {
        op.logWarn("[SoomfonController] Error parsing event payload: " + e.message);
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        resetKnobValues();
        addon.start(0, handleAddonEvent); // Connect to device index 0
        initialized = true;
        outStatus.set("Connecting...");
        return true;
    } catch (e) {
        outStatus.set("Start Error");
        op.logError("[SoomfonController] Failed to start native controller: " + e.message);
        return false;
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
        outConnection.set(null);
        outDeviceInfo.set(null);
        outStatus.set("Stopped");
    }
};

op.onDelete = () => {
    if (addon) {
        try {
            addon.stop();
        } catch (e) {}
    }
};

// Auto start if active
if (inActive.get()) {
    ensureInitialized();
} else {
    outStatus.set("Stopped");
}
