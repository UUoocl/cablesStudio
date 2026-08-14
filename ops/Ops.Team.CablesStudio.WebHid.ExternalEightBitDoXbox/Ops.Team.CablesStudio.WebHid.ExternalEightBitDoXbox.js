/**
 * Ops.Team.CablesStudio.WebHid.ExternalEightBitDoXbox
 * 
 * Interfacing with 8BitDo Micro / Xbox Gamepad Controllers using WebHID inside a popup window.
 */

const
    inActive = op.inBool("Active", false),
    inOpenWindow = op.inTrigger("Open Popup"),
    inDeviceIndex = op.inInt("Device Index", 0),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outWindowStatus = op.outString("Window Status", "Closed"),
    outIsConnected = op.outBool("Is Connected", false),

    outButtonA = op.outBool("A", false),
    outButtonB = op.outBool("B", false),
    outButtonX = op.outBool("X", false),
    outButtonY = op.outBool("Y", false),
    outButtonLB = op.outBool("LB", false),
    outButtonRB = op.outBool("RB", false),
    outButtonBack = op.outBool("Back", false),
    outButtonStart = op.outBool("Start", false),
    outButtonXbox = op.outBool("Xbox", false),
    outButtonLS = op.outBool("LS", false),
    outButtonRS = op.outBool("RS", false),

    outDpadUp = op.outBool("Dpad Up", false),
    outDpadDown = op.outBool("Dpad Down", false),
    outDpadLeft = op.outBool("Dpad Left", false),
    outDpadRight = op.outBool("Dpad Right", false),

    outLeftStickX = op.outNumber("Left Stick X", 0),
    outLeftStickY = op.outNumber("Left Stick Y", 0),
    outRightStickX = op.outNumber("Right Stick X", 0),
    outRightStickY = op.outNumber("Right Stick Y", 0),

    outLeftTrigger = op.outNumber("Left Trigger", 0),
    outRightTrigger = op.outNumber("Right Trigger", 0);

op.setPortGroup("Controls", [inActive, inOpenWindow]);
op.setPortGroup("Settings", [inDeviceIndex]);

let childWindow = null;
let windowPollInterval = null;

const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>8BitDo / Xbox WebHID Bridge</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #111; color: #eee; margin: 0; padding: 16px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 100vh; box-sizing: border-box; text-align: center;
        }
        h2 { margin-top: 0; font-size: 18px; color: #4af; }
        .status { margin: 12px 0; font-size: 14px; font-weight: bold; color: #aaa; }
        .info { font-size: 12px; color: #777; margin-bottom: 16px; max-width: 280px; }
        button {
            background: #2563eb; color: white; border: none; padding: 10px 18px;
            font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer;
        }
        button:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <h2>8BitDo / Xbox WebHID Bridge</h2>
    <div class="info">This popup window handles WebHID API device permissions for Cables Studio. Keep open while using Gamepad.</div>
    <div id="status" class="status">Initializing...</div>
    <button id="reqBtn">Request Gamepad</button>

    <script>
        const EIGHTBITDO_FILTERS = [];

        let activeDevice = null;
        let isConnected = false;

        const statusEl = document.getElementById("status");
        const reqBtn = document.getElementById("reqBtn");

        function setStatus(text, color = "#aaa") {
            statusEl.innerText = text;
            statusEl.style.color = color;
            if (window.opener && window.opener.eightBitDoOpBridge_${op.id}) {
                window.opener.eightBitDoOpBridge_${op.id}.updateStatus(text);
            }
        }

        function handleInputReport(event) {
            if (!activeDevice) return;
            const { data } = event;
            const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            if (report.length < 3) return;

            let offset = 0;
            if (report.length >= 8 && (report[0] === 0x20 || report[0] === 0x01 || report[0] === 0x30)) {
                offset = 1;
            }

            const b1 = report[offset] || 0;
            const b2 = report[offset + 1] || 0;

            const bridge = window.opener && window.opener.eightBitDoOpBridge_${op.id};

            const buttons = {
                a: (b1 & 0x01) !== 0,
                b: (b1 & 0x02) !== 0,
                x: (b1 & 0x04) !== 0,
                y: (b1 & 0x08) !== 0,
                lb: (b1 & 0x10) !== 0,
                rb: (b1 & 0x20) !== 0,
                back: (b1 & 0x40) !== 0,
                start: (b1 & 0x80) !== 0,
                xbox: (b2 & 0x01) !== 0,
                ls: (b2 & 0x02) !== 0,
                rs: (b2 & 0x04) !== 0
            };

            const dpadByte = report.length > offset + 2 ? (report[offset + 2] & 0x0f) : 0x0f;
            const dpad = {
                up: dpadByte === 0 || dpadByte === 1 || dpadByte === 7 || dpadByte === 8,
                right: dpadByte === 1 || dpadByte === 2 || dpadByte === 3,
                down: dpadByte === 3 || dpadByte === 4 || dpadByte === 5,
                left: dpadByte === 5 || dpadByte === 6 || dpadByte === 7
            };

            let lt = 0, rt = 0;
            if (report.length >= offset + 5) {
                lt = Math.max(0, Math.min(1.0, report[offset + 3] / 255.0));
                rt = Math.max(0, Math.min(1.0, report[offset + 4] / 255.0));
            }
            if (report.length >= offset + 7 && report[offset + 4] > 255) {
                lt = Math.max(0, Math.min(1.0, (report[offset + 3] | (report[offset + 4] << 8)) / 1023.0));
                rt = Math.max(0, Math.min(1.0, (report[offset + 5] | (report[offset + 6] << 8)) / 1023.0));
            }

            let lx = 0, ly = 0, rx = 0, ry = 0;
            if (report.length >= offset + 8) {
                lx = (report[offset + 4] - 128) / 128.0;
                ly = (report[offset + 5] - 128) / 128.0;
                rx = (report[offset + 6] - 128) / 128.0;
                ry = (report[offset + 7] - 128) / 128.0;
            }
            if (report.length >= offset + 14) {
                lx = ((report[offset + 7] | (report[offset + 8] << 8)) - 32768) / 32768.0;
                ly = ((report[offset + 9] | (report[offset + 10] << 8)) - 32768) / 32768.0;
                rx = ((report[offset + 11] | (report[offset + 12] << 8)) - 32768) / 32768.0;
                ry = ((report[offset + 13] | (report[offset + 14] << 8)) - 32768) / 32768.0;
            }

            lx = Math.max(-1.0, Math.min(1.0, lx));
            ly = Math.max(-1.0, Math.min(1.0, ly));
            rx = Math.max(-1.0, Math.min(1.0, rx));
            ry = Math.max(-1.0, Math.min(1.0, ry));

            if (bridge) {
                bridge.onState(buttons, dpad, lt, rt, lx, ly, rx, ry);
            }
        }

        let pollInterval = null;

        function pollWebGamepad() {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let gp = null;
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    gp = gamepads[i];
                    break;
                }
            }

            if (gp) {
                if (!isConnected) {
                    isConnected = true;
                    const name = gp.id || "Gamepad Controller";
                    setStatus("Connected to " + name, "#22c55e");
                    if (window.opener && window.opener.eightBitDoOpBridge_${op.id}) {
                        window.opener.eightBitDoOpBridge_${op.id}.onConnect(name);
                    }
                }

                const b = gp.buttons;
                const buttons = {
                    a: b[0] ? b[0].pressed : false,
                    b: b[1] ? b[1].pressed : false,
                    x: b[2] ? b[2].pressed : false,
                    y: b[3] ? b[3].pressed : false,
                    lb: b[4] ? b[4].pressed : false,
                    rb: b[5] ? b[5].pressed : false,
                    back: b[8] ? b[8].pressed : false,
                    start: b[9] ? b[9].pressed : false,
                    ls: b[10] ? b[10].pressed : false,
                    rs: b[11] ? b[11].pressed : false,
                    xbox: b[16] ? b[16].pressed : false
                };

                const dpad = {
                    up: b[12] ? b[12].pressed : false,
                    down: b[13] ? b[13].pressed : false,
                    left: b[14] ? b[14].pressed : false,
                    right: b[15] ? b[15].pressed : false
                };

                const lt = b[6] ? (b[6].value !== undefined ? b[6].value : (b[6].pressed ? 1 : 0)) : 0;
                const rt = b[7] ? (b[7].value !== undefined ? b[7].value : (b[7].pressed ? 1 : 0)) : 0;

                const lx = gp.axes[0] || 0;
                const ly = gp.axes[1] || 0;
                const rx = gp.axes[2] || 0;
                const ry = gp.axes[3] || 0;

                const bridge = window.opener && window.opener.eightBitDoOpBridge_${op.id};
                if (bridge) {
                    bridge.onState(buttons, dpad, lt, rt, lx, ly, rx, ry);
                }
            }
        }

        function startGamepadPolling() {
            if (!pollInterval) {
                pollInterval = setInterval(pollWebGamepad, 16);
            }
        }

        async function disconnectDevice() {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            if (activeDevice) {
                try {
                    activeDevice.removeEventListener("inputreport", handleInputReport);
                    if (activeDevice.opened) await activeDevice.close();
                } catch (e) {}
            }
            activeDevice = null;
            isConnected = false;
            if (window.opener && window.opener.eightBitDoOpBridge_${op.id}) {
                window.opener.eightBitDoOpBridge_${op.id}.onDisconnect();
            }
        }

        async function connectDevice(deviceIndex = 0) {
            await disconnectDevice();
            startGamepadPolling();

            if (navigator.hid) {
                try {
                    const devices = await navigator.hid.getDevices();
                    if (devices.length > 0) {
                        const dev = devices[deviceIndex] || devices[0];
                        if (!dev.opened) await dev.open();
                        activeDevice = dev;
                        activeDevice.addEventListener("inputreport", handleInputReport);
                        isConnected = true;
                        const modelName = dev.productName || "Gamepad Controller";
                        setStatus("Connected to " + modelName, "#22c55e");
                        if (window.opener && window.opener.eightBitDoOpBridge_${op.id}) {
                            window.opener.eightBitDoOpBridge_${op.id}.onConnect(modelName);
                        }
                        return;
                    }
                } catch (e) {}
            }

            setStatus("Listening for Gamepad (Press any button)...", "#3b82f6");
        }

        window.addEventListener("gamepadconnected", (e) => {
            setStatus("Connected to " + e.gamepad.id, "#22c55e");
            startGamepadPolling();
        });

        window.addEventListener("gamepaddisconnected", () => {
            setStatus("Gamepad Disconnected", "#eab308");
        });

        reqBtn.addEventListener("click", async () => {
            startGamepadPolling();
            if (navigator.hid) {
                try {
                    const selected = await navigator.hid.requestDevice({ filters: [] });
                    if (selected && selected.length > 0) connectDevice(0);
                } catch (e) {}
            }
        });

        window.remoteBridge = { connect: (idx) => connectDevice(idx), disconnect: () => disconnectDevice() };
        connectDevice(0);

        window.remoteBridge = { connect: (idx) => connectDevice(idx), disconnect: () => disconnectDevice() };
        if (navigator.hid) {
            navigator.hid.addEventListener("connect", () => connectDevice(0));
            navigator.hid.addEventListener("disconnect", () => disconnectDevice());
        }
        connectDevice(0);
    </script>
</body>
</html>`;

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
        onState(b, d, lt, rt, lx, ly, rx, ry) {
            outButtonA.set(b.a);
            outButtonB.set(b.b);
            outButtonX.set(b.x);
            outButtonY.set(b.y);
            outButtonLB.set(b.lb);
            outButtonRB.set(b.rb);
            outButtonBack.set(b.back);
            outButtonStart.set(b.start);
            outButtonXbox.set(b.xbox);
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

op.onDelete = () => {
    clearInterval(windowPollInterval);
    delete window[`eightBitDoOpBridge_${op.id}`];
    if (childWindow && !childWindow.closed) childWindow.close();
};
