/**
 * Ops.Extension.Standalone.MacOs.Hid.BmdSpeedEditor
 * 
 * Native macOS IOKit HID driver interface for the Blackmagic Design DaVinci Resolve Speed Editor.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inLedsObj = op.inObject("LEDs State"),
    inButtonLeds = op.inInt("Button LEDs", 0),
    inJogLeds = op.inInt("Jog LEDs", 0),
    inJogMode = op.inInt("Jog Mode", 0),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outRunning = op.outBoolNum("Running", false),
    outLedsState = op.outObject("LEDs State Out"),
    outKeysPressed = op.outArray("Keys Pressed"),
    outKeyNames = op.outArray("Key Names"),
    outLastKey = op.outString("Last Key", ""),
    outLastKeyPressed = op.outBoolNum("Last Key Pressed", false),
    outKeyEvent = op.outTrigger("Key Event"),
    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),
    outBatteryLevel = op.outNumber("Battery Level", 0),
    outCharging = op.outBoolNum("Charging", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("LEDs & Modes", [inLedsObj, inButtonLeds, inJogLeds, inJogMode, outLedsState]);
op.setPortGroup("Status", [outStatus, outRunning, outEvent]);
op.setPortGroup("Keys", [outKeyEvent, outLastKey, outLastKeyPressed, outKeysPressed, outKeyNames]);
op.setPortGroup("Jog Wheel", [outJogTurned, outJogValue, outJogDelta]);
op.setPortGroup("Battery", [outBatteryLevel, outCharging]);

let addon = null;
let initialized = false;

const keyNames = {
    0x01: "SMART_INSERT",
    0x02: "APPEND",
    0x03: "RIPPLE_OVERWRITE",
    0x04: "CLOSE_UP",
    0x05: "PLACE_ON_TOP",
    0x06: "SOURCE_OVERWRITE",
    0x07: "IN",
    0x08: "OUT",
    0x09: "TRIM_IN",
    0x0a: "TRIM_OUT",
    0x0b: "ROLL",
    0x0c: "SLIP_SOURCE",
    0x0d: "SLIP_DEST",
    0x0e: "TRANS_DUR",
    0x0f: "CUT",
    0x10: "DIS",
    0x11: "SMOOTH_CUT",
    0x1a: "SOURCE",
    0x1b: "TIMELINE",
    0x1c: "SHTL",
    0x1d: "JOG",
    0x1e: "SCRL",
    0x1f: "SYNC_BIN",
    0x22: "TRANS",
    0x25: "VIDEO_ONLY",
    0x26: "AUDIO_ONLY",
    0x2b: "RIPPLE_DELETE",
    0x2c: "AUDIO_LEVEL",
    0x2d: "FULL_VIEW",
    0x2e: "SNAP",
    0x2f: "SPLIT",
    0x30: "LIVE_OVERWRITE",
    0x31: "ESC",
    0x33: "CAM1",
    0x34: "CAM2",
    0x35: "CAM3",
    0x36: "CAM4",
    0x37: "CAM5",
    0x38: "CAM6",
    0x39: "CAM7",
    0x3a: "CAM8",
    0x3b: "CAM9",
    0x3c: "STOP_PLAY"
};

const LED_MAP = {
    "CLOSE_UP": 1 << 0,
    "CUT": 1 << 1,
    "DIS": 1 << 2,
    "SMOOTH_CUT": 1 << 3,
    "TRANS": 1 << 4,
    "SNAP": 1 << 5,
    "CAM7": 1 << 6,
    "CAM8": 1 << 7,
    "CAM9": 1 << 8,
    "LIVE_OVERWRITE": 1 << 9,
    "CAM4": 1 << 10,
    "CAM5": 1 << 11,
    "CAM6": 1 << 12,
    "VIDEO_ONLY": 1 << 13,
    "CAM1": 1 << 14,
    "CAM2": 1 << 15,
    "CAM3": 1 << 16,
    "AUDIO_ONLY": 1 << 17
};

const JOG_LED_MAP = {
    "JOG": 1 << 0,
    "SHTL": 1 << 1,
    "SCRL": 1 << 2
};

function getAddonPath() {
    const addonRelPath = "ops/Ops.Extension.Standalone.MacOs.Hid.BmdSpeedEditor/bmd_speed_editor.node";
    const buildRelPath = "ops/Ops.Extension.Standalone.MacOs.Hid.BmdSpeedEditor/build/Release/bmd_speed_editor.node";
    const candidatePaths = [
        addonRelPath,
        buildRelPath
    ];

    if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
        candidatePaths.push(path.join(op.patch.config.prefixAssetPath, addonRelPath));
        candidatePaths.push(path.join(op.patch.config.prefixAssetPath, buildRelPath));
    }
    if (typeof __dirname !== "undefined" && __dirname) {
        candidatePaths.push(path.join(__dirname, "bmd_speed_editor.node"));
        candidatePaths.push(path.join(__dirname, "build/Release/bmd_speed_editor.node"));
        candidatePaths.push(path.join(__dirname, addonRelPath));
    }
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
        candidatePaths.push(path.join(process.cwd(), addonRelPath));
        candidatePaths.push(path.join(process.cwd(), buildRelPath));
    }
    candidatePaths.push(path.resolve(addonRelPath));

    for (let candidate of candidatePaths) {
        if (!candidate) continue;
        let resolved = candidate;
        if (op.patch && typeof op.patch.filePath === "function") {
            resolved = op.patch.filePath(candidate);
        }
        if (fs.existsSync(resolved)) {
            return resolved;
        }
    }

    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(addonRelPath);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, addonRelPath);
}

function initAddon() {
    if (addon) return true;

    const addonPath = getAddonPath();
    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MacOs.Hid.BmdSpeedEditor] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Hid.BmdSpeedEditor] Failed to load native addon: " + e.message);
        return false;
    }
}

function handleAddonEvent(jsonStr) {
    if (!jsonStr) return;
    
    try {
        const msg = JSON.parse(jsonStr);
        if (msg.type === "info") {
            if (msg.status === "connected") {
                outStatus.set(`Connected: ${msg.device}`);
                syncControls();
            } else if (msg.status === "searching") {
                outStatus.set("Searching...");
            }
        } else if (msg.type === "error") {
            outStatus.set("Error: " + msg.message);
            op.logError("[MacOs.Hid.BmdSpeedEditor] Native error: " + msg.message);
        } else if (msg.type === "jog") {
            outJogDelta.set(msg.delta);
            outJogValue.set(msg.value);
            outJogTurned.trigger();
            outEvent.trigger();
        } else if (msg.type === "keys") {
            const rawKeys = msg.codes || msg.keys || [];
            outKeysPressed.set(rawKeys);
            
            const names = rawKeys.map((k) => keyNames[k] || `KEY_0x${k.toString(16)}`);
            outKeyNames.set(names);
            outEvent.trigger();
        } else if (msg.type === "key_event") {
            const code = (msg.code !== undefined) ? msg.code : msg.changedKey;
            if (code !== undefined) {
                outLastKey.set(keyNames[code] || "KEY_0x" + code.toString(16));
                outLastKeyPressed.set(msg.pressed);
                outKeyEvent.trigger();
                outEvent.trigger();
            }
        } else if (msg.type === "battery") {
            outBatteryLevel.set(msg.level);
            outCharging.set(msg.charging);
            outEvent.trigger();
        }
    } catch (e) {
        op.logWarn("[MacOs.Hid.BmdSpeedEditor] Error parsing event payload: " + e.message);
    }
}

function buildLedsStateObject(buttonMask, jogMask) {
    const state = {};
    for (const [name, bit] of Object.entries(LED_MAP)) {
        state[name] = Boolean(buttonMask & bit);
    }
    for (const [name, bit] of Object.entries(JOG_LED_MAP)) {
        state[name] = Boolean(jogMask & bit);
    }
    return state;
}

function resolveLedMasks() {
    let buttonMask = Number(inButtonLeds.get()) || 0;
    let jogMask = Number(inJogLeds.get()) || 0;

    const obj = inLedsObj.get();
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === "string") {
                const key = item.trim().toUpperCase();
                if (LED_MAP[key] !== undefined) buttonMask |= LED_MAP[key];
                if (JOG_LED_MAP[key] !== undefined) jogMask |= JOG_LED_MAP[key];
            }
        }
    } else if (obj && typeof obj === "object") {
        for (const [rawKey, v] of Object.entries(obj)) {
            const k = rawKey.trim().toUpperCase();
            const isOn = Boolean(v);
            if (LED_MAP[k] !== undefined) {
                if (isOn) buttonMask |= LED_MAP[k];
                else buttonMask &= ~LED_MAP[k];
            }
            if (JOG_LED_MAP[k] !== undefined) {
                if (isOn) jogMask |= JOG_LED_MAP[k];
                else jogMask &= ~JOG_LED_MAP[k];
            }
        }
    }

    return { buttonMask, jogMask };
}

function syncControls() {
    const { buttonMask, jogMask } = resolveLedMasks();
    outLedsState.set(buildLedsStateObject(buttonMask, jogMask));

    if (!addon || !initialized) return;

    try {
        addon.setLeds(buttonMask);
        addon.setJogLeds(jogMask);
        addon.setJogMode(inJogMode.get());
    } catch (e) {
        op.logWarn("[MacOs.Hid.BmdSpeedEditor] Failed updating LEDs / Jog Mode: " + e.message);
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        addon.start(handleAddonEvent);
        initialized = true;
        
        const connected = addon.isConnected();
        outStatus.set(connected ? "Connected" : "Searching...");
        outRunning.set(true);
        if (connected) syncControls();
        return true;
    } catch (e) {
        op.logError("[MacOs.Hid.BmdSpeedEditor] Failed to start native controller: " + e.message);
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
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

inButtonLeds.onChange = syncControls;
inJogLeds.onChange = syncControls;
inJogMode.onChange = syncControls;
inLedsObj.onChange = syncControls;

op.onDelete = () => {
    if (addon) {
        try { addon.stop(); } catch (e) {}
        initialized = false;
    }
};

// Initialize LEDs State Out immediately with default (all false) or current input state
syncControls();

// Initial startup if Active is already true when patch loads
if (inActive.get()) {
    setTimeout(() => {
        if (inActive.get() && !initialized) {
            ensureInitialized();
        }
    }, 150);
}
