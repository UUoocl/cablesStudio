/**
 * Ops.Team.CablesStudio.WebHid.BmdSpeedEditor
 * 
 * Interfacing with DaVinci Resolve Speed Editor using standard WebHID API (with Challenge-Response Auth).
 */

const
    inActive = op.inBool("Active", false),
    inRequestDevice = op.inTrigger("Request Device"),
    inLedsObj = op.inObject("LEDs State"),
    inButtonLeds = op.inInt("Button LEDs", 0),
    inJogLeds = op.inInt("Jog LEDs", 0),
    inJogMode = op.inInt("Jog Mode", 0),
    inDeviceIndex = op.inInt("Device Index", 0),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outIsConnected = op.outBoolNum("Is Connected", false),
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

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("LEDs & Modes", [inLedsObj, inButtonLeds, inJogLeds, inJogMode, outLedsState]);
op.setPortGroup("Settings", [inDeviceIndex]);
op.setPortGroup("Status", [outStatus, outIsConnected, outEvent]);
op.setPortGroup("Keys", [outKeyEvent, outLastKey, outLastKeyPressed, outKeysPressed, outKeyNames]);
op.setPortGroup("Jog Wheel", [outJogTurned, outJogValue, outJogDelta]);
op.setPortGroup("Battery", [outBatteryLevel, outCharging]);

let activeDevices = [];
let isConnected = false;
let accumulatedJogValue = 0;
let prevJog = -1;
let hasPrevJog = false;
let prevKeys = [];

const KEY_NAMES = {
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

const LED_ALIASES = {
    "SMTH_CUT": LED_MAP.SMOOTH_CUT,
    "LIVE_OWR": LED_MAP.LIVE_OVERWRITE
};

const JOG_LED_MAP = {
    "JOG": 1 << 0,
    "SHTL": 1 << 1,
    "SCRL": 1 << 2
};

const BMD_FILTERS = [
    { vendorId: 0x1edb, productId: 0xda0e },
    { vendorId: 0x1ebd, productId: 0xa15d },
    { vendorId: 0x1edb },
    { vendorId: 0x1ebd }
];

// Speed Editor Challenge Auth Algorithm
function rol8(v) {
    return (v << 56n) | (v >> 8n);
}

function rol8n(v, n) {
    let val = BigInt(v);
    for (let i = 0; i < n; i++) {
        val = rol8(val);
    }
    return val & 0xffffffffffffffffn;
}

function bmdKbdAuth(challengeBigInt) {
    const authEvenTbl = [
        0x3ae1206f97c10bc8n,
        0x2a9ab32bebf244c6n,
        0x20a6f8b8df9adf0an,
        0xaf80ece52cfc1719n,
        0xec2ee2f7414fd151n,
        0xb055adfd73344a15n,
        0xa63d2e3059001187n,
        0x751bf623f42e0dden
    ];
    const authOddTbl = [
        0x3e22b34f502e7fden,
        0x24656b981875ab1cn,
        0xa17f3456df7bf8c3n,
        0x6df72e1941aef698n,
        0x72226f011e66ab94n,
        0x3831a3c606296b42n,
        0xfd7ff81881332c89n,
        0x61a3f6474ff236c6n
    ];
    const mask = 0xa79a63f585d37bf0n;

    let challenge = BigInt(challengeBigInt) & 0xffffffffffffffffn;
    let n = Number(challenge & 7n);
    let v = rol8n(challenge, n);

    let k;
    if ((v & 1n) === BigInt((0x78 >> n) & 1)) {
        k = authEvenTbl[n];
    } else {
        v = (v ^ rol8(v)) & 0xffffffffffffffffn;
        k = authOddTbl[n];
    }

    return (v ^ (rol8(v) & mask) ^ k) & 0xffffffffffffffffn;
}

async function authenticateDevice(dev) {
    try {
        // Step 1: Send reset report 6
        await dev.sendFeatureReport(6, new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

        // Step 2: Read challenge report 6
        let challengeVal = 0n;
        try {
            const challengeData = await dev.receiveFeatureReport(6);
            const challengeArr = new Uint8Array(challengeData.buffer, challengeData.byteOffset, challengeData.byteLength);

            if (challengeArr.length >= 8) {
                const offset = (challengeArr[0] === 6 && challengeArr.length >= 10) ? 1 : 0;
                for (let i = 0; i < 8; i++) {
                    challengeVal |= (BigInt(challengeArr[offset + 1 + i] || 0) << BigInt(i * 8));
                }
            }
        } catch (readErr) {
            op.logWarn("[WebHid.BmdSpeedEditor] Non-fatal challenge read warning: " + readErr.message);
        }

        // Step 3: Send host challenge
        await dev.sendFeatureReport(6, new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

        // Step 4: Read response report (non-fatal)
        try { await dev.receiveFeatureReport(6); } catch (_) {}

        // Step 5: Send response
        const responseVal = bmdKbdAuth(challengeVal);
        const responseReport = new Uint8Array(9);
        responseReport[0] = 0x03;
        for (let i = 0; i < 8; i++) {
            responseReport[1 + i] = Number((responseVal >> BigInt(i * 8)) & 0xffn);
        }
        await dev.sendFeatureReport(6, responseReport);

        // Step 6: Read status report (non-fatal)
        try { await dev.receiveFeatureReport(6); } catch (_) {}

        return true;
    } catch (e) {
        op.logWarn("[WebHid.BmdSpeedEditor] Auth error on interface: " + e.message);
        return false;
    }
}

async function setLeds(bitfield) {
    const report = new Uint8Array([
        bitfield & 0xff,
        (bitfield >> 8) & 0xff,
        (bitfield >> 16) & 0xff,
        (bitfield >> 24) & 0xff
    ]);
    for (const dev of activeDevices) {
        if (!dev.opened) continue;
        try {
            await dev.sendReport(2, report);
        } catch (e) {}
    }
}

async function setJogLeds(bitfield) {
    const report = new Uint8Array([bitfield & 0xff]);
    for (const dev of activeDevices) {
        if (!dev.opened) continue;
        try {
            await dev.sendReport(4, report);
        } catch (e) {}
    }
}

async function setJogMode(mode) {
    const report = new Uint8Array([mode & 0xff, 0, 0, 0, 0, 0xff]);
    for (const dev of activeDevices) {
        if (!dev.opened) continue;
        try {
            await dev.sendReport(3, report);
        } catch (e) {}
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
                const btnBit = LED_MAP[key] !== undefined ? LED_MAP[key] : LED_ALIASES[key];
                if (btnBit !== undefined) buttonMask |= btnBit;
                if (JOG_LED_MAP[key] !== undefined) jogMask |= JOG_LED_MAP[key];
            }
        }
    } else if (obj && typeof obj === "object") {
        for (const [rawKey, v] of Object.entries(obj)) {
            const k = rawKey.trim().toUpperCase();
            const isOn = Boolean(v);
            const btnBit = LED_MAP[k] !== undefined ? LED_MAP[k] : LED_ALIASES[k];
            if (btnBit !== undefined) {
                if (isOn) buttonMask |= btnBit;
                else buttonMask &= ~btnBit;
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

    if (!isConnected || activeDevices.length === 0) return;

    try {
        setLeds(buttonMask);
        setJogLeds(jogMask);
        setJogMode(inJogMode.get());
    } catch (e) {
        op.logWarn("[WebHid.BmdSpeedEditor] Failed updating LEDs / Jog Mode: " + e.message);
    }
}

function handleInputReport(event) {
    if (activeDevices.length === 0) return;
    const { reportId, data } = event;
    const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    const rId = reportId > 0 ? reportId : (report.length > 0 ? report[0] : 0);
    const payload = (reportId === 0 && report.length > 0 && report[0] === rId) ? report.subarray(1) : report;

    // Report ID 4: Key report
    if (rId === 4) {
        const currentKeys = [];
        for (let idx = 0; idx < 6 && (idx * 2 + 1) < payload.length; idx++) {
            const key = payload[idx * 2] | (payload[idx * 2 + 1] << 8);
            if (key !== 0) currentKeys.push(key);
        }

        for (const k of currentKeys) {
            if (!prevKeys.includes(k)) {
                outLastKey.set(KEY_NAMES[k] || "KEY_0x" + k.toString(16));
                outLastKeyPressed.set(true);
                outKeyEvent.trigger();
                outEvent.trigger();
            }
        }
        for (const k of prevKeys) {
            if (!currentKeys.includes(k)) {
                outLastKey.set(KEY_NAMES[k] || "KEY_0x" + k.toString(16));
                outLastKeyPressed.set(false);
                outKeyEvent.trigger();
                outEvent.trigger();
            }
        }

        prevKeys = currentKeys;
        outKeysPressed.set(currentKeys);
        outKeyNames.set(currentKeys.map(k => KEY_NAMES[k] || "KEY_0x" + k.toString(16)));
        outEvent.trigger();
        return;
    }

    // Report ID 3: Jog wheel report (5 bytes: mode byte + int32 value/delta)
    if (rId === 3) {
        if (payload.length >= 5) {
            const jogMode = payload[0];
            const rawJv = payload[1] | (payload[2] << 8) | (payload[3] << 16) | (payload[4] << 24);
            const jv = rawJv | 0;

            const isRelative = (jogMode === 0 || jogMode === 2);
            let delta = 0;
            let finalValue = 0;
            if (isRelative) {
                delta = jv;
                accumulatedJogValue += delta;
                finalValue = accumulatedJogValue;
            } else {
                if (hasPrevJog) delta = jv - prevJog;
                prevJog = jv;
                hasPrevJog = true;
                finalValue = jv;
            }

            outJogDelta.set(delta);
            outJogValue.set(finalValue);
            outJogTurned.trigger();
            outEvent.trigger();
            return;
        }
    }

    // Report ID 7: Battery status report
    if (rId === 7 && payload.length >= 2) {
        const charging = payload[0] !== 0;
        const level = payload[1];
        outBatteryLevel.set(level);
        outCharging.set(charging);
        outEvent.trigger();
        return;
    }
}

let authKeepaliveInterval = null;

function startAuthKeepalive() {
    stopAuthKeepalive();
    authKeepaliveInterval = setInterval(async () => {
        for (const dev of activeDevices) {
            if (dev && dev.opened) {
                await authenticateDevice(dev);
            }
        }
    }, 300000);
}

function stopAuthKeepalive() {
    if (authKeepaliveInterval) {
        clearInterval(authKeepaliveInterval);
        authKeepaliveInterval = null;
    }
}

async function connectDevice() {
    await disconnectDevice();
    if (!inActive.get()) return;

    if (!navigator.hid) {
        outStatus.set("WebHID Not Supported");
        return;
    }

    try {
        const devices = await navigator.hid.getDevices();
        const bmdDevices = devices.filter(d => d.vendorId === 0x1edb || d.vendorId === 0x1ebd);

        if (bmdDevices.length === 0) {
            outStatus.set("No devices found (Use Request Device)");
            return;
        }

        outStatus.set("Connecting...");

        const openedDevs = [];
        for (const dev of bmdDevices) {
            try {
                if (!dev.opened) await dev.open();
                await authenticateDevice(dev);
                dev.addEventListener("inputreport", handleInputReport);
                openedDevs.push(dev);
            } catch (openErr) {
                op.logWarn("[WebHid.BmdSpeedEditor] Could not open interface: " + openErr.message);
            }
        }

        if (openedDevs.length === 0) {
            outStatus.set("Connection Failed: could not open interfaces");
            await disconnectDevice();
            return;
        }

        activeDevices = openedDevs;
        startAuthKeepalive();

        isConnected = true;
        outIsConnected.set(true);
        const modelName = activeDevices[0].productName || "DaVinci Resolve Speed Editor";
        outStatus.set("Connected to " + modelName);
        syncControls();
    } catch (e) {
        outStatus.set("Connection Failed: " + e.message);
        await disconnectDevice();
    }
}

async function disconnectDevice() {
    stopAuthKeepalive();
    for (const dev of activeDevices) {
        try {
            dev.removeEventListener("inputreport", handleInputReport);
            if (dev.opened) {
                await dev.close();
            }
        } catch (e) {}
    }
    activeDevices = [];
    isConnected = false;
    prevJog = -1;
    hasPrevJog = false;
    accumulatedJogValue = 0;
    prevKeys = [];
    outIsConnected.set(false);
    outStatus.set("Stopped");
}

inRequestDevice.onTriggered = async () => {
    if (!navigator.hid) return;
    try {
        const selected = await navigator.hid.requestDevice({ filters: BMD_FILTERS });
        if (selected && selected.length > 0) {
            if (inActive.get()) connectDevice();
        }
    } catch (e) {
        outStatus.set("Permission Request Failed");
    }
};

inActive.onChange = () => {
    if (inActive.get()) connectDevice();
    else disconnectDevice();
};

inButtonLeds.onChange = syncControls;
inJogLeds.onChange = syncControls;
inJogMode.onChange = syncControls;
inLedsObj.onChange = syncControls;

inDeviceIndex.onChange = () => {
    if (inActive.get()) connectDevice();
};

op.onDelete = disconnectDevice;

// Initialize LEDs State Out immediately with default (all false) or current input state
syncControls();
