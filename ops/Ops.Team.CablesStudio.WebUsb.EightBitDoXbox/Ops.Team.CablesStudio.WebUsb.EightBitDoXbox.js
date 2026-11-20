/**
 * Ops.Team.CablesStudio.WebUsb.EightBitDoXbox
 * 
 * Interfacing with the 8BitDo Lite SE Xbox Controller using WebUSB and Native IOKit.
 */

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    inRequestDevice = op.inTrigger("Request Device"),

    inRumbleLeft = op.inFloat("Rumble Left", 0.0),
    inRumbleRight = op.inFloat("Rumble Right", 0.0),
    inTriggerRumble = op.inTrigger("Trigger Rumble"),
    inSendOnChange = op.inBool("Send Rumble on Change", false),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outIsConnected = op.outBoolNum("Is Connected", false),
    outButtonsPressed = op.outArray("Buttons Pressed"),

    outButtonA = op.outBoolNum("A", false),
    outButtonB = op.outBoolNum("B", false),
    outButtonX = op.outBoolNum("X", false),
    outButtonY = op.outBoolNum("Y", false),
    outButtonLB = op.outBoolNum("LB", false),
    outButtonRB = op.outBoolNum("RB", false),
    outButtonBack = op.outBoolNum("Back", false),
    outButtonStart = op.outBoolNum("Start", false),
    outButtonXbox = op.outBoolNum("Xbox", false),
    outButtonShare = op.outBoolNum("Share", false),
    outButtonLS = op.outBoolNum("LS", false),
    outButtonRS = op.outBoolNum("RS", false),

    outDpadUp = op.outBoolNum("Dpad Up", false),
    outDpadDown = op.outBoolNum("Dpad Down", false),
    outDpadLeft = op.outBoolNum("Dpad Left", false),
    outDpadRight = op.outBoolNum("Dpad Right", false),

    outLeftStickX = op.outNumber("Left Stick X", 0),
    outLeftStickY = op.outNumber("Left Stick Y", 0),
    outRightStickX = op.outNumber("Right Stick X", 0),
    outRightStickY = op.outNumber("Right Stick Y", 0),

    outLeftTrigger = op.outNumber("Left Trigger", 0),
    outRightTrigger = op.outNumber("Right Trigger", 0);

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("Settings", [inDeviceIndex]);
op.setPortGroup("Rumble", [
    inRumbleLeft,
    inRumbleRight,
    inTriggerRumble,
    inSendOnChange
]);

const USB_FILTERS = [
    { vendorId: 0x2dc8, productId: 0x2008 } // 8BitDo Lite SE for Xbox
];

let activeUsbDevice = null;
let usbInterfaceNumber = 0;
let usbInEndpoint = 1;
let usbOutEndpoint = 1;
let usbReadLoopActive = false;
let rumbleSeq = 0;
let connectGeneration = 0;
let pairingOverlay = null;
let suppressActiveChange = false;

let isConnected = false;

let currentState = {
    buttons: {
        a: false, b: false, x: false, y: false,
        lb: false, rb: false, back: false, start: false,
        xbox: false, share: false, ls: false, rs: false
    },
    dpad: { up: false, down: false, left: false, right: false },
    lt: 0, rt: 0,
    lx: 0, ly: 0, rx: 0, ry: 0
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPressedArray(b, d) {
    const pressed = [];
    if (b.start) pressed.push("Menu");
    if (b.back) pressed.push("View");
    if (b.a) pressed.push("A");
    if (b.b) pressed.push("B");
    if (b.x) pressed.push("X");
    if (b.y) pressed.push("Y");
    if (d.up) pressed.push("Dpad Up");
    if (d.down) pressed.push("Dpad Down");
    if (d.left) pressed.push("Dpad Left");
    if (d.right) pressed.push("Dpad Right");
    if (b.lb) pressed.push("LB");
    if (b.rb) pressed.push("RB");
    if (b.ls) pressed.push("LS Click");
    if (b.rs) pressed.push("RS Click");
    if (b.xbox) pressed.push("Guide");
    if (b.share) pressed.push("Share");
    return pressed;
}

function applyCurrentStateToPorts() {
    const { buttons: b, dpad: d, lt, rt, lx, ly, rx, ry } = currentState;

    outButtonA.set(b.a);
    outButtonB.set(b.b);
    outButtonX.set(b.x);
    outButtonY.set(b.y);
    outButtonLB.set(b.lb);
    outButtonRB.set(b.rb);
    outButtonBack.set(b.back);
    outButtonStart.set(b.start);
    outButtonXbox.set(b.xbox);
    outButtonShare.set(Boolean(b.share));
    outButtonLS.set(b.ls);
    outButtonRS.set(b.rs);

    outDpadUp.set(d.up);
    outDpadDown.set(d.down);
    outDpadLeft.set(d.left);
    outDpadRight.set(d.right);

    outLeftTrigger.set(lt);
    outRightTrigger.set(rt);

    outLeftStickX.set(lx);
    outLeftStickY.set(ly);
    outRightStickX.set(rx);
    outRightStickY.set(ry);

    outButtonsPressed.set(buildPressedArray(b, d));
    outEvent.trigger();
}

// =====================================================================
// WebUSB Xbox GIP Protocol (8BitDo Lite SE Xbox VID: 0x2dc8, PID: 0x2008)
// =====================================================================
function processGipReport(dataView) {
    if (!dataView || dataView.byteLength < 5) return;
    const data = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    const cmd = data[0];

    if (cmd === 0x07) {
        const down = data[4];
        const key = data.length >= 6 ? data[5] : 0;
        const isDown = down === 0x01;
        if (key === 0x5b) {
            currentState.buttons.xbox = isDown;
            applyCurrentStateToPorts();
        } else if (key === 0x01) {
            currentState.buttons.share = isDown;
            applyCurrentStateToPorts();
        }
        return;
    }

    if (cmd !== 0x20 || data.length < 18) return;

    const btnMask = data[4] | (data[5] << 8);
    currentState.buttons.start = (btnMask & 0x0004) !== 0; // Menu
    currentState.buttons.back  = (btnMask & 0x0008) !== 0; // View
    currentState.buttons.a     = (btnMask & 0x0010) !== 0;
    currentState.buttons.b     = (btnMask & 0x0020) !== 0;
    currentState.buttons.x     = (btnMask & 0x0040) !== 0;
    currentState.buttons.y     = (btnMask & 0x0080) !== 0;

    currentState.dpad.up       = (btnMask & 0x0100) !== 0;
    currentState.dpad.down     = (btnMask & 0x0200) !== 0;
    currentState.dpad.left     = (btnMask & 0x0400) !== 0;
    currentState.dpad.right    = (btnMask & 0x0800) !== 0;

    currentState.buttons.lb    = (btnMask & 0x1000) !== 0;
    currentState.buttons.rb    = (btnMask & 0x2000) !== 0;
    currentState.buttons.ls    = (btnMask & 0x4000) !== 0;
    currentState.buttons.rs    = (btnMask & 0x8000) !== 0;

    if (data.length >= 19) {
        currentState.buttons.share = (data[18] & 0x01) !== 0;
    }

    const ltRaw = data[6] | (data[7] << 8);
    const rtRaw = data[8] | (data[9] << 8);
    currentState.lt = Math.max(0.0, Math.min(1.0, ltRaw / 1023.0));
    currentState.rt = Math.max(0.0, Math.min(1.0, rtRaw / 1023.0));

    const lsXRaw = dataView.getInt16(10, true);
    const lsYRaw = dataView.getInt16(12, true);
    const rsXRaw = dataView.getInt16(14, true);
    const rsYRaw = dataView.getInt16(16, true);

    currentState.lx = Math.max(-1.0, Math.min(1.0, lsXRaw / 32768.0));
    currentState.ly = Math.max(-1.0, Math.min(1.0, lsYRaw / 32768.0));
    currentState.rx = Math.max(-1.0, Math.min(1.0, rsXRaw / 32768.0));
    currentState.ry = Math.max(-1.0, Math.min(1.0, rsYRaw / 32768.0));

    applyCurrentStateToPorts();
}

async function runUsbReadLoop(dev, inEp) {
    usbReadLoopActive = true;
    while (usbReadLoopActive && activeUsbDevice === dev && dev.opened) {
        try {
            const result = await dev.transferIn(inEp, 64);
            if (result && result.status === "ok" && result.data) {
                processGipReport(result.data);
            } else if (result && result.status === "stall") {
                try { await dev.clearHalt("in", inEp); } catch (e) {}
            }
        } catch (err) {
            if (!usbReadLoopActive || activeUsbDevice !== dev) break;
            await sleep(25);
        }
    }
}

async function sendGipHandshake(dev, outEp) {
    const pwrOn      = new Uint8Array([0x05, 0x20, 0x01, 0x01, 0x00]);
    const led        = new Uint8Array([0x0A, 0x20, 0x02, 0x03, 0x00, 0x01, 0x14]);
    const security   = new Uint8Array([0x06, 0x20, 0x03, 0x02, 0x01, 0x00]);
    const initRumble = new Uint8Array([0x09, 0x00, 0x04, 0x09, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0xEB]);

    try { await dev.transferOut(outEp, pwrOn); } catch (e) {}
    await sleep(50);
    try { await dev.transferOut(outEp, led); } catch (e) {}
    await sleep(50);
    try { await dev.transferOut(outEp, security); } catch (e) {}
    await sleep(50);
    try { await dev.transferOut(outEp, initRumble); } catch (e) {}
}

async function openUsbController(dev, generation) {
    outStatus.set("Connecting via WebUSB...");
    if (!dev.opened) {
        await dev.open();
    }
    if (generation !== connectGeneration) {
        try { if (dev.opened) await dev.close(); } catch (e) {}
        return;
    }

    if (!dev.configuration) {
        await dev.selectConfiguration(1);
    }
    if (generation !== connectGeneration) {
        try { if (dev.opened) await dev.close(); } catch (e) {}
        return;
    }

    let ifaceNumber = 0;
    let inEp = 1;
    let outEp = 1;

    if (dev.configuration && dev.configuration.interfaces && dev.configuration.interfaces.length > 0) {
        let selectedIface = dev.configuration.interfaces[0];
        for (const candidate of dev.configuration.interfaces) {
            const alt = candidate.alternate || (candidate.alternates && candidate.alternates[0]);
            if (alt && alt.endpoints && alt.endpoints.some((ep) => ep.type === "interrupt" || ep.type === "bulk")) {
                selectedIface = candidate;
                break;
            }
        }
        ifaceNumber = selectedIface.interfaceNumber;
        const alt = selectedIface.alternate || (selectedIface.alternates && selectedIface.alternates[0]);
        if (alt && alt.endpoints) {
            let foundIn = false;
            let foundOut = false;
            for (const ep of alt.endpoints) {
                if (ep.type === "interrupt" || ep.type === "bulk") {
                    if (ep.direction === "in" && !foundIn) {
                        inEp = ep.endpointNumber;
                        foundIn = true;
                    } else if (ep.direction === "out" && !foundOut) {
                        outEp = ep.endpointNumber;
                        foundOut = true;
                    }
                }
            }
        }
    }

    await dev.claimInterface(ifaceNumber);
    if (generation !== connectGeneration) {
        try {
            await dev.releaseInterface(ifaceNumber);
            if (dev.opened) await dev.close();
        } catch (e) {}
        return;
    }

    activeUsbDevice = dev;
    usbInterfaceNumber = ifaceNumber;
    usbInEndpoint = inEp;
    usbOutEndpoint = outEp;

    await sendGipHandshake(dev, outEp);
    if (generation !== connectGeneration) {
        await disconnectDevice();
        return;
    }

    isConnected = true;
    outIsConnected.set(true);
    const modelName = dev.productName || "8BitDo Lite SE Xbox Controller";
    outStatus.set("Connected to " + modelName);

    runUsbReadLoop(dev, inEp);
}

async function sendUsbRumble(left, right) {
    if (!activeUsbDevice || !activeUsbDevice.opened || !usbOutEndpoint) return;
    const lVal = Math.max(0, Math.min(255, Math.round(left * 255)));
    const rVal = Math.max(0, Math.min(255, Math.round(right * 255)));

    rumbleSeq = (rumbleSeq + 1) & 0xff;
    const packet = new Uint8Array([
        0x09,
        0x00,
        rumbleSeq,
        0x09,
        0x00,
        0x03, // Main left + right grip motors
        0x00,
        0x00,
        lVal,
        rVal,
        0xFF,
        0x00,
        0x00
    ]);

    try {
        await activeUsbDevice.transferOut(usbOutEndpoint, packet);
    } catch (e) {}
}

let path = null;
let fs = null;
try {
    path = op.require("path");
    fs = op.require("fs");
} catch (e) {}

let addon = null;
let initialized = false;

function initAddon() {
    if (addon) return true;
    if (!path || !fs) return false;

    const candidateRelPaths = [
        "ops/Ops.Extension.Standalone.MacOs.Hid.EightBitDoXboxLiteSe/8bitdo_xbox.node",
        "ops/Ops.Extension.Standalone.MacOs.Hid.EightBitDoXboxLiteSe/build/Release/8bitdo_xbox.node",
        "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox/8bitdo_xbox.node"
    ];

    for (const rel of candidateRelPaths) {
        let addonPath = rel;
        if (op.patch && typeof op.patch.filePath === "function") {
            addonPath = op.patch.filePath(rel);
        } else {
            const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
            addonPath = path.join(prefix, rel);
        }
        if (fs.existsSync(addonPath)) {
            try {
                addon = op.require(addonPath);
                return true;
            } catch (e) {}
        }
    }
    return false;
}

function handleAddonEvent(jsonStr) {
    if (!jsonStr) return;
    try {
        const event = JSON.parse(jsonStr);
        if (event.type === "info") {
            const connected = event.status === "connected";
            isConnected = connected;
            outIsConnected.set(connected);
            outStatus.set(connected ? "Connected (Native IOKit)" : "Searching...");
        } else if (event.type === "input") {
            outLeftStickX.set(event.ls ? event.ls[0] : 0);
            outLeftStickY.set(event.ls ? event.ls[1] : 0);
            outRightStickX.set(event.rs ? event.rs[0] : 0);
            outRightStickY.set(event.rs ? event.rs[1] : 0);
            outLeftTrigger.set(event.lt || 0);
            outRightTrigger.set(event.rt || 0);

            const pressed = event.buttons || [];
            outButtonsPressed.set(pressed);
            outButtonA.set(pressed.includes("A"));
            outButtonB.set(pressed.includes("B"));
            outButtonX.set(pressed.includes("X"));
            outButtonY.set(pressed.includes("Y"));
            outDpadUp.set(pressed.includes("Dpad Up"));
            outDpadDown.set(pressed.includes("Dpad Down"));
            outDpadLeft.set(pressed.includes("Dpad Left"));
            outDpadRight.set(pressed.includes("Dpad Right"));
            outButtonLB.set(pressed.includes("LB"));
            outButtonRB.set(pressed.includes("RB"));
            outButtonLS.set(pressed.includes("LS Click"));
            outButtonRS.set(pressed.includes("RS Click"));
            outButtonBack.set(pressed.includes("View") || pressed.includes("Back"));
            outButtonStart.set(pressed.includes("Menu") || pressed.includes("Start"));
            outButtonXbox.set(pressed.includes("Guide") || pressed.includes("Xbox"));
            outButtonShare.set(pressed.includes("Share"));

            outEvent.trigger();
        }
    } catch (e) {}
}

function writeRumble() {
    if (!outIsConnected.get()) return;
    const left = parseFloat(inRumbleLeft.get()) || 0;
    const right = parseFloat(inRumbleRight.get()) || 0;

    if (initialized && addon && typeof addon.setRumble === "function") {
        try {
            addon.setRumble(left, right, 0, 0);
            return;
        } catch (e) {}
    }

    if (activeUsbDevice) {
        sendUsbRumble(left, right);
    }
}

function handleRumbleChange() {
    if (inSendOnChange.get()) {
        writeRumble();
    }
}

function checkWebUSBSupport() {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
        op.logError("[WebUsb.EightBitDoXbox] WebUSB requires a secure context (HTTPS).");
        outStatus.set("Requires HTTPS / Secure Context");
        return false;
    }
    const policy = typeof document !== "undefined" ? (document.permissionsPolicy || document.featurePolicy) : null;
    if (policy && typeof policy.allowsFeature === "function" && !policy.allowsFeature("usb")) {
        op.logError("[WebUsb.EightBitDoXbox] WebUSB is blocked by iframe Permissions-Policy.");
        outStatus.set("USB Blocked by Permissions Policy");
        return false;
    }
    if (typeof navigator === "undefined" || !navigator.usb) {
        op.logError("[WebUsb.EightBitDoXbox] WebUSB API is not supported in this environment.");
        outStatus.set("WebUSB Not Supported");
        return false;
    }
    return true;
}

function removePairingOverlay() {
    if (pairingOverlay && pairingOverlay.parentNode) {
        pairingOverlay.parentNode.removeChild(pairingOverlay);
    }
    pairingOverlay = null;
}

async function executeDevicePicker() {
    try {
        const selected = await navigator.usb.requestDevice({ filters: USB_FILTERS });
        removePairingOverlay();

        if (selected) {
            op.log(`[WebUsb.EightBitDoXbox] Device selected via picker: ${selected.productName || "8BitDo Xbox Controller"}`);
            if (!inActive.get()) {
                suppressActiveChange = true;
                inActive.set(true);
                suppressActiveChange = false;
            }

            const generation = ++connectGeneration;
            await disconnectDevice();
            if (generation === connectGeneration) {
                await openUsbController(selected, generation);
            }
        }
    } catch (e) {
        if (e && (e.name === "SecurityError" || e.name === "NotAllowedError") && /gesture|activation/i.test(e.message || "")) {
            op.logWarn("[WebUsb.EightBitDoXbox] User gesture required inside iframe; showing in-canvas pairing prompt.");
            showPairingOverlay();
            return;
        }
        removePairingOverlay();
        if (e && e.name === "NotFoundError") {
            if (!isConnected) outStatus.set("Pairing Canceled");
        } else {
            op.logError("[WebUsb.EightBitDoXbox] USB request error: " + (e ? e.message : String(e)));
            outStatus.set("USB Permission Error: " + (e ? e.message : String(e)));
        }
    }
}

function showPairingOverlay() {
    removePairingOverlay();

    const container = (op.patch && op.patch.cgl && op.patch.cgl.canvas && op.patch.cgl.canvas.parentElement) ||
        (typeof document !== "undefined" ? document.body : null);
    if (!container) {
        outStatus.set("User Gesture Required");
        return;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = [
        "position: fixed",
        "top: 16px",
        "right: 16px",
        "z-index: 99999",
        "background: rgba(18, 18, 22, 0.94)",
        "color: #f3f4f6",
        "border: 1px solid rgba(255, 255, 255, 0.16)",
        "border-radius: 8px",
        "padding: 12px 14px",
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-size: 13px",
        "box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45)",
        "display: flex",
        "align-items: center",
        "gap: 10px"
    ].join(";");

    const label = document.createElement("span");
    label.textContent = "8BitDo Xbox pairing requires a click inside the patch:";

    const pairBtn = document.createElement("button");
    pairBtn.type = "button";
    pairBtn.textContent = "Pair 8BitDo Xbox";
    pairBtn.style.cssText = [
        "background: #2563eb",
        "color: #fff",
        "border: none",
        "border-radius: 5px",
        "padding: 6px 12px",
        "font-size: 12px",
        "font-weight: 600",
        "cursor: pointer"
    ].join(";");
    pairBtn.addEventListener("click", () => {
        executeDevicePicker();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = [
        "background: transparent",
        "color: #9ca3af",
        "border: 1px solid rgba(255, 255, 255, 0.2)",
        "border-radius: 5px",
        "padding: 6px 10px",
        "font-size: 12px",
        "cursor: pointer"
    ].join(";");
    cancelBtn.addEventListener("click", () => {
        removePairingOverlay();
        if (!isConnected) {
            outStatus.set("Pairing Canceled");
        }
    });

    overlay.appendChild(label);
    overlay.appendChild(pairBtn);
    overlay.appendChild(cancelBtn);
    container.appendChild(overlay);
    pairingOverlay = overlay;
    outStatus.set("Click 'Pair 8BitDo Xbox' in patch");
}

async function requestDevicePermission() {
    if (!checkWebUSBSupport()) return;

    // In embedded iframes (e.g. cables.gl editor), parameter-panel triggers lack transient
    // user activation inside the iframe; show an in-iframe button to capture a direct click.
    if (navigator.userActivation && !navigator.userActivation.isActive) {
        showPairingOverlay();
        return;
    }

    await executeDevicePicker();
}

async function connectDevice() {
    const generation = ++connectGeneration;
    await disconnectDevice();
    if (generation !== connectGeneration || !inActive.get()) return;

    if (initAddon()) {
        try {
            if (!initialized) {
                addon.start(handleAddonEvent);
                initialized = true;
            }
            const connected = addon.isConnected();
            outIsConnected.set(connected);
            outStatus.set(connected ? "Connected (Native IOKit)" : "Searching...");
            return;
        } catch (e) {}
    }

    if (!checkWebUSBSupport()) return;

    try {
        const usbDevices = await navigator.usb.getDevices();
        if (generation !== connectGeneration) return;

        const matching = usbDevices.filter((d) => d.vendorId === 0x2dc8 && d.productId === 0x2008);
        if (matching.length > 0) {
            const index = inDeviceIndex.get();
            if (index < 0 || index >= matching.length) {
                outStatus.set("Device index out of range");
                return;
            }
            await openUsbController(matching[index], generation);
            return;
        }
    } catch (e) {
        op.logError("[WebUsb.EightBitDoXbox] USB connection failed: " + String(e));
        outStatus.set("USB Error: " + (e ? e.message : String(e)));
        await disconnectDevice();
        return;
    }

    outStatus.set("No devices found (Use Request Device)");
}

async function disconnectDevice() {
    usbReadLoopActive = false;
    if (initialized && addon) {
        try {
            addon.stop();
            initialized = false;
        } catch (e) {}
    }
    if (activeUsbDevice) {
        const dev = activeUsbDevice;
        const iface = usbInterfaceNumber;
        activeUsbDevice = null;
        try {
            if (dev.opened) {
                try { await dev.releaseInterface(iface); } catch (e) {}
                await dev.close();
            }
        } catch (e) {}
    }
    isConnected = false;
    outIsConnected.set(false);
    outStatus.set("Stopped");
}

inRequestDevice.onTriggered = () => {
    requestDevicePermission();
};

inActive.onChange = () => {
    if (suppressActiveChange) return;
    if (inActive.get()) connectDevice();
    else {
        connectGeneration++;
        disconnectDevice();
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get()) connectDevice();
};

inTriggerRumble.onTriggered = writeRumble;
inRumbleLeft.onChange = handleRumbleChange;
inRumbleRight.onChange = handleRumbleChange;

function onUsbConnect(event) {
    if (event.device && event.device.vendorId === 0x2dc8 && event.device.productId === 0x2008 && inActive.get() && !isConnected) {
        op.log("[WebUsb.EightBitDoXbox] 8BitDo Xbox controller attached, connecting...");
        connectDevice();
    }
}

function onUsbDisconnect(event) {
    if (activeUsbDevice && event.device === activeUsbDevice) {
        op.log("[WebUsb.EightBitDoXbox] Active 8BitDo Xbox controller disconnected.");
        connectGeneration++;
        disconnectDevice();
        outStatus.set("Disconnected");
    }
}

if (typeof navigator !== "undefined" && navigator.usb) {
    navigator.usb.addEventListener("connect", onUsbConnect);
    navigator.usb.addEventListener("disconnect", onUsbDisconnect);
}

op.onDelete = () => {
    connectGeneration++;
    removePairingOverlay();
    if (typeof navigator !== "undefined" && navigator.usb) {
        navigator.usb.removeEventListener("connect", onUsbConnect);
        navigator.usb.removeEventListener("disconnect", onUsbDisconnect);
    }
    disconnectDevice();
};

if (inActive.get()) {
    connectDevice();
}
