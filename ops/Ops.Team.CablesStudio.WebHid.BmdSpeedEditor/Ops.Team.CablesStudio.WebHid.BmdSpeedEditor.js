/**
 * Ops.Team.CablesStudio.WebHid.BmdSpeedEditor
 * 
 * Interfacing with DaVinci Resolve Speed Editor using standard WebHID API (with Challenge-Response Auth).
 */

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    inRequestDevice = op.inTrigger("Request Device"),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outIsConnected = op.outBool("Is Connected", false),
    outKeysPressed = op.outArray("Keys Pressed"),
    outKeyNames = op.outArray("Key Names"),
    outLastKey = op.outString("Last Key", ""),
    outLastKeyPressed = op.outBool("Last Key Pressed", false),
    outKeyEvent = op.outTrigger("Key Event"),
    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),
    outBatteryLevel = op.outNumber("Battery Level", 0),
    outCharging = op.outBool("Charging", false);

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("Settings", [inDeviceIndex]);

let activeDevice = null;
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

function handleInputReport(event) {
    if (!activeDevice) return;
    const { reportId, data } = event;
    const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    const rId = reportId > 0 ? reportId : report[0];
    const payload = (reportId === 0 && report[0] === rId) ? report.subarray(1) : report;

    // Report ID 4: Key report
    if (rId === 4) {
        const currentKeys = [];
        for (let idx = 0; idx < 6 && (idx * 2 + 1) < payload.length; idx++) {
            const key = payload[idx * 2] | (payload[idx * 2 + 1] << 8);
            if (key !== 0) currentKeys.push(key);
        }

        for (const k of currentKeys) {
            if (!prevKeys.includes(k)) {
                outLastKey.set(KEY_NAMES[k] || "KEY_" + k);
                outLastKeyPressed.set(true);
                outKeyEvent.trigger();
                outEvent.trigger();
            }
        }
        for (const k of prevKeys) {
            if (!currentKeys.includes(k)) {
                outLastKey.set(KEY_NAMES[k] || "KEY_" + k);
                outLastKeyPressed.set(false);
                outKeyEvent.trigger();
                outEvent.trigger();
            }
        }

        prevKeys = currentKeys;
        outKeysPressed.set(currentKeys);
        outKeyNames.set(currentKeys.map(k => KEY_NAMES[k] || "KEY_" + k));
        return;
    }

    // Report ID 3: Jog wheel report (5 bytes: mode byte + int32 value/delta)
    if (rId === 3 || report[0] === 3) {
        const jData = (rId === 3 && report[0] !== 3) ? report : report.subarray(1);
        if (jData.length >= 5) {
            const jogMode = jData[0];
            const rawJv = jData[1] | (jData[2] << 8) | (jData[3] << 16) | (jData[4] << 24);
            const jv = rawJv | 0;

            const isRelative = (jogMode === 0 || jogMode === 2);
            let delta = 0;
            if (isRelative) {
                delta = jv;
            } else {
                if (hasPrevJog) delta = jv - prevJog;
                prevJog = jv;
                hasPrevJog = true;
            }

            if (delta !== 0) {
                accumulatedJogValue += delta;
                outJogDelta.set(delta);
                outJogValue.set(accumulatedJogValue);
                outJogTurned.trigger();
                outEvent.trigger();
            }
            return;
        }
    }

    // Report ID 7: Battery status report
    if (rId === 7 && payload.length >= 2) {
        outBatteryLevel.set(payload[0]);
        outCharging.set(payload[1] !== 0);
        return;
    }
}

let authKeepaliveInterval = null;

function startAuthKeepalive() {
    stopAuthKeepalive();
    // Re-authenticate every 5 minutes (300,000 ms), matching C++ 500-second timer
    authKeepaliveInterval = setInterval(async () => {
        if (activeDevice && activeDevice.opened) {
            await authenticateDevice(activeDevice);
        }
    }, 300000);
}

function stopAuthKeepalive() {
    if (authKeepaliveInterval) {
        clearInterval(authKeepaliveInterval);
        authKeepaliveInterval = null;
    }
}

function isSpeedEditorControlInterface(d) {
    if (!d.collections || d.collections.length === 0) return true;
    const hasVendorPage = d.collections.some(c => c.usagePage >= 0xff00);
    if (hasVendorPage) return true;
    const isSystemKeyboard = d.collections.every(c => c.usagePage === 0x0001 || c.usagePage === 0x000c);
    return !isSystemKeyboard;
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

        const controlDevs = bmdDevices.filter(isSpeedEditorControlInterface);
        const candidates = controlDevs.length > 0 ? controlDevs : bmdDevices;

        outStatus.set("Connecting...");

        let activeDev = null;
        for (const dev of candidates) {
            try {
                if (!dev.opened) await dev.open();
                const ok = await authenticateDevice(dev);
                if (ok) {
                    activeDev = dev;
                    break;
                }
                await dev.close();
            } catch (openErr) {
                op.logWarn("[WebHid.BmdSpeedEditor] Could not open candidate interface: " + openErr.message);
                try { await dev.close(); } catch (_) {}
            }
        }

        if (!activeDev) {
            outStatus.set("Authentication Failed");
            await disconnectDevice();
            return;
        }

        activeDevice = activeDev;
        activeDevice.addEventListener("inputreport", handleInputReport);
        startAuthKeepalive();

        isConnected = true;
        outIsConnected.set(true);
        const modelName = activeDevice.productName || "DaVinci Resolve Speed Editor";
        outStatus.set("Connected to " + modelName);
    } catch (e) {
        outStatus.set("Connection Failed: " + e.message);
        await disconnectDevice();
    }
}

async function disconnectDevice() {
    stopAuthKeepalive();
    if (activeDevice) {
        try {
            activeDevice.removeEventListener("inputreport", handleInputReport);
            if (activeDevice.opened) {
                await activeDevice.close();
            }
        } catch (e) {}
    }
    activeDevice = null;
    isConnected = false;
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

inDeviceIndex.onChange = () => {
    if (inActive.get()) connectDevice();
};

op.onDelete = disconnectDevice;
