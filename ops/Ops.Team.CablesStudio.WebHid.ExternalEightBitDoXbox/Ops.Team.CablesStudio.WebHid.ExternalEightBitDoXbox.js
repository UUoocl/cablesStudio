/**
 * Ops.Team.CablesStudio.WebHid.ExternalEightBitDoXbox
 * 
 * Interfacing with the 8BitDo Lite SE Xbox Controller using WebUSB inside a popup window.
 */

const
    inActive = op.inBool("Active", false),
    inOpenWindow = op.inTrigger("Open Popup"),
    inDeviceIndex = op.inInt("Device Index", 0),

    inRumbleLeft = op.inFloat("Rumble Left", 0.0),
    inRumbleRight = op.inFloat("Rumble Right", 0.0),
    inRumbleLeftTrigger = op.inFloat("Rumble Left Trigger", 0.0),
    inRumbleRightTrigger = op.inFloat("Rumble Right Trigger", 0.0),
    inTriggerRumble = op.inTrigger("Trigger Rumble"),
    inSendOnChange = op.inBool("Send Rumble on Change", false),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outWindowStatus = op.outString("Window Status", "Closed"),
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

op.setPortGroup("Controls", [inActive, inOpenWindow]);
op.setPortGroup("Settings", [inDeviceIndex]);
op.setPortGroup("Rumble", [
    inRumbleLeft,
    inRumbleRight,
    inRumbleLeftTrigger,
    inRumbleRightTrigger,
    inTriggerRumble,
    inSendOnChange
]);

let childWindow = null;
let windowPollInterval = null;

const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>8BitDo Lite SE Xbox Bridge</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #111; color: #eee; margin: 0; padding: 16px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 100vh; box-sizing: border-box; text-align: center;
        }
        h2 { margin-top: 0; font-size: 18px; color: #4af; }
        .status { margin: 12px 0; font-size: 14px; font-weight: bold; color: #aaa; }
        .info { font-size: 12px; color: #777; margin-bottom: 16px; max-width: 300px; line-height: 1.4; }
        button {
            background: #2563eb; color: white; border: none; padding: 10px 18px;
            font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer;
            transition: background 0.15s;
        }
        button:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <h2>8BitDo Lite SE Xbox Bridge</h2>
    <div class="info">This popup handles WebUSB permissions for the 8BitDo Lite SE Xbox Controller in Cables Studio. Keep open while using controller.</div>
    <div id="status" class="status">Initializing...</div>
    <button id="reqUsbBtn">Request 8BitDo Xbox Controller</button>

    <script>
        const USB_FILTERS = [
            { vendorId: 0x2dc8, productId: 0x2008 } // 8BitDo Lite SE for Xbox
        ];

        let activeUsbDevice = null;
        let usbInEndpoint = 1;
        let usbOutEndpoint = 1;
        let usbReadLoopActive = false;
        let rumbleSeq = 0;

        // Cached state so Guide button report (0x07) preserves current axes/buttons
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

        const statusEl = document.getElementById("status");
        const reqUsbBtn = document.getElementById("reqUsbBtn");

        function getBridge() {
            return window.opener && window.opener.eightBitDoOpBridge_${op.id};
        }

        function setStatus(text, color = "#aaa") {
            statusEl.innerText = text;
            statusEl.style.color = color;
            const bridge = getBridge();
            if (bridge) bridge.updateStatus(text);
        }

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

        function emitCurrentState() {
            const bridge = getBridge();
            if (!bridge) return;
            const { buttons, dpad, lt, rt, lx, ly, rx, ry } = currentState;
            const pressed = buildPressedArray(buttons, dpad);
            bridge.onState(buttons, dpad, lt, rt, lx, ly, rx, ry, pressed);
        }

        // =====================================================================
        // WebUSB Xbox GIP Protocol (8BitDo Lite SE Xbox VID: 0x2dc8, PID: 0x2008)
        // =====================================================================
        function processGipReport(dataView) {
            if (!dataView || dataView.byteLength < 5) return;
            const data = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
            const cmd = data[0];

            // Report 0x07: Guide / Xbox button event
            if (cmd === 0x07) {
                const down = data[4];
                const key = data.length >= 6 ? data[5] : 0;
                if (key === 0x5b || key === 0x01) {
                    currentState.buttons.xbox = (down === 0x01);
                    emitCurrentState();
                }
                return;
            }

            // Report 0x20: Standard GIP Controller Input Report
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
                const extra = data[18];
                currentState.buttons.xbox  = (extra & 0x01) !== 0;
                currentState.buttons.share = (extra & 0x02) !== 0;
            }

            // Triggers (10-bit unsigned: 0..1023)
            const ltRaw = data[6] | (data[7] << 8);
            const rtRaw = data[8] | (data[9] << 8);
            currentState.lt = Math.max(0.0, Math.min(1.0, ltRaw / 1023.0));
            currentState.rt = Math.max(0.0, Math.min(1.0, rtRaw / 1023.0));

            // Thumbsticks (16-bit signed little-endian: -32768..32767)
            const lsXRaw = dataView.getInt16(10, true);
            const lsYRaw = dataView.getInt16(12, true);
            const rsXRaw = dataView.getInt16(14, true);
            const rsYRaw = dataView.getInt16(16, true);

            currentState.lx = Math.max(-1.0, Math.min(1.0, lsXRaw / 32768.0));
            currentState.ly = Math.max(-1.0, Math.min(1.0, lsYRaw / 32768.0));
            currentState.rx = Math.max(-1.0, Math.min(1.0, rsXRaw / 32768.0));
            currentState.ry = Math.max(-1.0, Math.min(1.0, rsYRaw / 32768.0));

            emitCurrentState();
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
                    console.warn("[WebUSB 8BitDo] transferIn error:", err.message);
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

        async function sendUsbRumble(left, right, leftTrigger, rightTrigger) {
            if (!activeUsbDevice || !activeUsbDevice.opened || !usbOutEndpoint) return;
            const lVal  = Math.max(0, Math.min(255, Math.round(left * 255)));
            const rVal  = Math.max(0, Math.min(255, Math.round(right * 255)));
            const ltVal = Math.max(0, Math.min(255, Math.round(leftTrigger * 255)));
            const rtVal = Math.max(0, Math.min(255, Math.round(rightTrigger * 255)));

            rumbleSeq = (rumbleSeq + 1) & 0xff;
            const packet = new Uint8Array([
                0x09,       // CMD: Rumble
                0x00,       // Flags
                rumbleSeq,
                0x09,       // Payload Length
                0x00,       // Mode
                0x0F,       // Motor Mask: All 4 motors
                ltVal,
                rtVal,
                lVal,
                rVal,
                0xFF,       // Duration (continuous)
                0x00,       // Delay
                0x00        // Repeat
            ]);

            try {
                await activeUsbDevice.transferOut(usbOutEndpoint, packet);
            } catch (e) {
                console.warn("[WebUSB 8BitDo] Failed to write rumble packet:", e.message);
            }
        }

        async function openUsbController(dev) {
            setStatus("Connecting via WebUSB...", "#3b82f6");
            if (!dev.opened) {
                await dev.open();
            }

            // Unconfigured devices on macOS have configuration === null
            if (!dev.configuration) {
                await dev.selectConfiguration(1);
            }

            // Find interface 0 (or first interface with interrupt endpoints)
            let ifaceNumber = 0;
            let inEp = 1;
            let outEp = 1;

            if (dev.configuration && dev.configuration.interfaces && dev.configuration.interfaces.length > 0) {
                const iface = dev.configuration.interfaces[0];
                ifaceNumber = iface.interfaceNumber;
                const alt = iface.alternate || (iface.alternates && iface.alternates[0]);
                if (alt && alt.endpoints) {
                    for (const ep of alt.endpoints) {
                        if (ep.type === "interrupt" || ep.type === "bulk") {
                            if (ep.direction === "in" && inEp === 1) inEp = ep.endpointNumber;
                            else if (ep.direction === "out" && outEp === 1) outEp = ep.endpointNumber;
                        }
                    }
                }
            }

            await dev.claimInterface(ifaceNumber);

            activeUsbDevice = dev;
            usbInEndpoint = inEp;
            usbOutEndpoint = outEp;

            // Perform GIP initialization sequence
            await sendGipHandshake(dev, outEp);

            const modelName = dev.productName || "8BitDo Lite SE Xbox Controller";
            setStatus("Connected to " + modelName, "#22c55e");
            const bridge = getBridge();
            if (bridge) bridge.onConnect(modelName);

            runUsbReadLoop(dev, inEp);
        }

        async function disconnectDevice() {
            usbReadLoopActive = false;
            if (activeUsbDevice) {
                const dev = activeUsbDevice;
                activeUsbDevice = null;
                try {
                    if (dev.opened) {
                        try { await dev.releaseInterface(0); } catch (e) {}
                        await dev.close();
                    }
                } catch (e) {}
            }
            const bridge = getBridge();
            if (bridge) bridge.onDisconnect();
        }

        async function connectDevice(deviceIndex = 0) {
            await disconnectDevice();

            if (!navigator.usb) {
                setStatus("WebUSB Not Supported in this Browser", "#f43f5e");
                return;
            }

            try {
                const usbDevices = await navigator.usb.getDevices();
                const matching = usbDevices.filter((d) => d.vendorId === 0x2dc8 && d.productId === 0x2008);
                if (matching.length > 0) {
                    const dev = matching[deviceIndex] || matching[0];
                    await openUsbController(dev);
                    return;
                }
            } catch (e) {
                console.warn("[WebUSB 8BitDo] Failed opening USB device:", e);
                setStatus("USB Error: " + e.message, "#f43f5e");
                return;
            }

            setStatus("Click 'Request 8BitDo Xbox Controller' to pair", "#3b82f6");
        }

        reqUsbBtn.addEventListener("click", async () => {
            if (!navigator.usb) {
                setStatus("WebUSB Not Supported in this Browser", "#f43f5e");
                return;
            }
            try {
                const selected = await navigator.usb.requestDevice({ filters: USB_FILTERS });
                if (selected) {
                    await disconnectDevice();
                    await openUsbController(selected);
                }
            } catch (e) {
                if (e.name !== "NotFoundError") {
                    setStatus("USB Request Error: " + e.message, "#f43f5e");
                }
            }
        });

        window.remoteBridge = {
            connect: (idx) => connectDevice(idx),
            disconnect: () => disconnectDevice(),
            setRumble: (l, r, lt, rt) => sendUsbRumble(l, r, lt, rt)
        };

        if (navigator.usb) {
            navigator.usb.addEventListener("connect", () => connectDevice(0));
            navigator.usb.addEventListener("disconnect", (e) => {
                if (activeUsbDevice && e.device === activeUsbDevice) {
                    setStatus("Controller Disconnected", "#eab308");
                    disconnectDevice();
                }
            });
        }

        connectDevice(0);
    </script>
</body>
</html>`;

function writeRumble() {
    if (!childWindow || childWindow.closed || !childWindow.remoteBridge) return;
    if (!outIsConnected.get()) return;

    const left = parseFloat(inRumbleLeft.get()) || 0;
    const right = parseFloat(inRumbleRight.get()) || 0;
    const leftTrigger = parseFloat(inRumbleLeftTrigger.get()) || 0;
    const rightTrigger = parseFloat(inRumbleRightTrigger.get()) || 0;

    childWindow.remoteBridge.setRumble(left, right, leftTrigger, rightTrigger);
}

function handleRumbleChange() {
    if (inSendOnChange.get()) {
        writeRumble();
    }
}

function setupOpBridge() {
    window[`eightBitDoOpBridge_${op.id}`] = {
        updateStatus(text) { outStatus.set(text); },
        onConnect(name) {
            outIsConnected.set(true);
            outStatus.set("Connected to " + name);
        },
        onDisconnect() {
            outIsConnected.set(false);
            outStatus.set("Disconnected");
        },
        onState(b, d, lt, rt, lx, ly, rx, ry, pressed) {
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

            if (pressed) {
                outButtonsPressed.set(pressed);
            }

            outEvent.trigger();
        }
    };
}

function openPopupWindow() {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }
    setupOpBridge();
    const features = "width=380,height=340,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";
    childWindow = window.open("about:blank", `eightbitdo_external_${op.id}`, features);
    if (!childWindow) {
        outStatus.set("Popup Blocked");
        outWindowStatus.set("Blocked");
        return;
    }
    outWindowStatus.set("Open");
    const doc = childWindow.document;
    doc.open();
    doc.write(POPUP_HTML);
    doc.close();

    clearInterval(windowPollInterval);
    windowPollInterval = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(windowPollInterval);
            childWindow = null;
            outWindowStatus.set("Closed");
            outIsConnected.set(false);
            outStatus.set("Window Closed");
        }
    }, 1000);
}

inOpenWindow.onTriggered = openPopupWindow;

inActive.onChange = () => {
    if (inActive.get()) openPopupWindow();
    else if (childWindow && !childWindow.closed) childWindow.close();
};

inDeviceIndex.onChange = () => {
    if (childWindow && !childWindow.closed && childWindow.remoteBridge) {
        childWindow.remoteBridge.connect(inDeviceIndex.get());
    }
};

inTriggerRumble.onTriggered = writeRumble;
inRumbleLeft.onChange = handleRumbleChange;
inRumbleRight.onChange = handleRumbleChange;
inRumbleLeftTrigger.onChange = handleRumbleChange;
inRumbleRightTrigger.onChange = handleRumbleChange;

op.onDelete = () => {
    clearInterval(windowPollInterval);
    delete window[`eightBitDoOpBridge_${op.id}`];
    if (childWindow && !childWindow.closed) childWindow.close();
};
