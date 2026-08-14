/**
 * Ops.Team.CablesStudio.WebHid.ExternalContourShuttlePro
 * 
 * Interfacing with Contour ShuttlePro v2 visual controllers using WebHID inside a popup window.
 */

const
    inActive = op.inBool("Active", false),
    inOpenWindow = op.inTrigger("Open Popup"),
    inDeviceIndex = op.inInt("Device Index", 0),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outWindowStatus = op.outString("Window Status", "Closed"),
    outIsConnected = op.outBool("Is Connected", false),

    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),

    outShuttleValue = op.outNumber("Shuttle Value", 0),
    outShuttleMoved = op.outTrigger("Shuttle Moved"),

    outButtonIndex = op.outNumber("Button Index", -1),
    outButtonPressed = op.outBool("Button Pressed", false),
    outButtonEvent = op.outTrigger("Button Event");

op.setPortGroup("Controls", [inActive, inOpenWindow]);
op.setPortGroup("Settings", [inDeviceIndex]);

let childWindow = null;
let windowPollInterval = null;
let accumulatedJogValue = 0;

const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ShuttlePro WebHID Bridge</title>
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
    <h2>ShuttlePro WebHID Bridge</h2>
    <div class="info">This popup window handles WebHID API device permissions for Cables Studio. Keep open while using Contour ShuttlePro.</div>
    <div id="status" class="status">Initializing...</div>
    <button id="reqBtn">Request ShuttlePro</button>

    <script>
        const CONTOUR_PRO_FILTERS = [
            { vendorId: 0x0b33, productId: 0x0030 },
            { vendorId: 0x0b33, productId: 0x0010 }
        ];

        let activeDevice = null;
        let isConnected = false;
        let prevJog = -1;
        let hasPrevJog = false;
        let prevShuttle = -1;
        let hasPrevShuttle = false;
        let prevButtons = new Array(15).fill(false);

        const statusEl = document.getElementById("status");
        const reqBtn = document.getElementById("reqBtn");

        function setStatus(text, color = "#aaa") {
            statusEl.innerText = text;
            statusEl.style.color = color;
            if (window.opener && window.opener.shuttleProBridge_${op.id}) {
                window.opener.shuttleProBridge_${op.id}.updateStatus(text);
            }
        }

        function handleInputReport(event) {
            if (!activeDevice) return;
            const { data } = event;
            const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            if (report.length < 5) return;

            const shuttleVal = (report[0] << 24) >> 24;
            const jogVal = report[1];
            const bByte1 = report[3];
            const bByte2 = report[4];

            const bridge = window.opener && window.opener.shuttleProBridge_${op.id};
            if (!bridge) return;

            if (!hasPrevShuttle || shuttleVal !== prevShuttle) {
                bridge.onShuttle(shuttleVal);
                prevShuttle = shuttleVal;
                hasPrevShuttle = true;
            }

            if (hasPrevJog) {
                let diff = jogVal - prevJog;
                if (diff > 128) diff -= 256;
                else if (diff < -128) diff += 256;
                if (diff !== 0) bridge.onJog(diff);
            }
            prevJog = jogVal;
            hasPrevJog = true;

            for (let i = 0; i < 8; i++) {
                const pressed = ((bByte1 >> i) & 1) !== 0;
                if (pressed !== prevButtons[i]) {
                    prevButtons[i] = pressed;
                    bridge.onButton(i, pressed);
                }
            }
            for (let i = 0; i < 7; i++) {
                const pressed = ((bByte2 >> i) & 1) !== 0;
                const btnIdx = 8 + i;
                if (pressed !== prevButtons[btnIdx]) {
                    prevButtons[btnIdx] = pressed;
                    bridge.onButton(btnIdx, pressed);
                }
            }
        }

        async function disconnectDevice() {
            if (activeDevice) {
                try {
                    activeDevice.removeEventListener("inputreport", handleInputReport);
                    if (activeDevice.opened) await activeDevice.close();
                } catch (e) {}
            }
            activeDevice = null;
            isConnected = false;
            if (window.opener && window.opener.shuttleProBridge_${op.id}) {
                window.opener.shuttleProBridge_${op.id}.onDisconnect();
            }
        }

        async function connectDevice(deviceIndex = 0) {
            await disconnectDevice();
            if (!navigator.hid) { setStatus("WebHID Not Supported", "#f43f5e"); return; }
            try {
                const devices = await navigator.hid.getDevices();
                const shuttleDevices = devices.filter(d => d.vendorId === 0x0b33 && (d.productId === 0x0030 || d.productId === 0x0010));
                if (shuttleDevices.length === 0) { setStatus("No paired devices found", "#eab308"); return; }
                const dev = shuttleDevices[deviceIndex];
                setStatus("Connecting...", "#3b82f6");
                if (!dev.opened) await dev.open();
                activeDevice = dev;
                activeDevice.addEventListener("inputreport", handleInputReport);
                isConnected = true;
                const modelName = dev.productName || "ShuttlePRO";
                setStatus("Connected to " + modelName, "#22c55e");
                if (window.opener && window.opener.shuttleProBridge_${op.id}) {
                    window.opener.shuttleProBridge_${op.id}.onConnect(modelName);
                }
            } catch (e) {
                setStatus("Connection Failed: " + e.message, "#f43f5e");
                await disconnectDevice();
            }
        }

        reqBtn.addEventListener("click", async () => {
            if (!navigator.hid) return;
            try {
                const selected = await navigator.hid.requestDevice({ filters: CONTOUR_PRO_FILTERS });
                if (selected && selected.length > 0) connectDevice(0);
            } catch (e) {}
        });

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
    window[`shuttleProBridge_${op.id}`] = {
        updateStatus(text) { outStatus.set(text); },
        onConnect(name) {
            outIsConnected.set(true);
            outStatus.set("Connected to " + name);
        },
        onDisconnect() {
            outIsConnected.set(false);
            outStatus.set("Disconnected");
        },
        onShuttle(val) {
            outShuttleValue.set(val);
            outShuttleMoved.trigger();
            outEvent.trigger();
        },
        onJog(diff) {
            accumulatedJogValue += diff;
            outJogDelta.set(diff);
            outJogValue.set(accumulatedJogValue);
            outJogTurned.trigger();
            outEvent.trigger();
        },
        onButton(idx, pressed) {
            outButtonIndex.set(idx);
            outButtonPressed.set(pressed);
            outButtonEvent.trigger();
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
    childWindow = window.open("about:blank", `shuttlepro_external_${op.id}`, features);
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
    delete window[`shuttleProBridge_${op.id}`];
    if (childWindow && !childWindow.closed) childWindow.close();
};
