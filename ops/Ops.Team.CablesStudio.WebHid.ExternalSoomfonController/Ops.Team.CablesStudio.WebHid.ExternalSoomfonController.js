/**
 * Ops.Team.CablesStudio.WebHid.ExternalSoomfonController
 * 
 * Interfacing with Soomfon visual controllers via WebHID inside an external popup window.
 * Bypasses iframe restrictions for WebHID permission dialogs.
 */

const
    inActive = op.inBool("Active", false),
    inOpenWindow = op.inTrigger("Open Popup"),
    inDeviceIndex = op.inInt("Device Index", 0),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outWindowStatus = op.outString("Window Status", "Closed"),
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

op.setPortGroup("Controls", [inActive, inOpenWindow]);
op.setPortGroup("Settings", [inDeviceIndex]);

let childWindow = null;
let windowPollInterval = null;
let isConnected = false;
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

const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Soomfon WebHID Helper</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #111;
            color: #eee;
            margin: 0;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
            text-align: center;
        }
        h2 { margin-top: 0; font-size: 18px; color: #4af; }
        .status { margin: 12px 0; font-size: 14px; font-weight: bold; color: #aaa; }
        .info { font-size: 12px; color: #777; margin-bottom: 16px; max-width: 280px; }
        button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 18px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover { background: #1d4ed8; }
        button:active { background: #1e40af; }
    </style>
</head>
<body>
    <h2>Soomfon WebHID Bridge</h2>
    <div class="info">This popup window handles WebHID API device permissions for Cables Studio. Keep open while using Soomfon.</div>
    <div id="status" class="status">Initializing...</div>
    <button id="reqBtn">Request Soomfon Device</button>

    <script>
        const SOOMFON_FILTERS = [
            { vendorId: 0x1500, productId: 0x3001, usagePage: 0xffa0 },
            { vendorId: 0x0300, productId: 0x3002, usagePage: 0xffa0 },
            { vendorId: 0x1500, usagePage: 0xffa0 },
            { vendorId: 0x0300, usagePage: 0xffa0 },
            { vendorId: 0x1500, productId: 0x3001 },
            { vendorId: 0x0300, productId: 0x3002 }
        ];

        let activeDevice = null;
        let isConnected = false;
        let heartbeatInterval = null;

        const statusEl = document.getElementById("status");
        const reqBtn = document.getElementById("reqBtn");

        function setStatus(text, color = "#aaa") {
            statusEl.innerText = text;
            statusEl.style.color = color;
            if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                window.opener.soomfonOpBridge_${op.id}.updateStatus(text);
            }
        }

        function handleInputReport(event) {
            if (!activeDevice) return;
            const { reportId, data } = event;
            const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

            // WebHID HIDInputReportEvent: when reportId is non-zero, data starts AFTER reportId byte.
            // In C++ IOHIDManager, raw report[9] was action and report[10] was state.
            // With reportId 0, offset = 9 / 10. With non-zero reportId, offset = 8 / 9.
            const actionIdx = reportId === 0 ? 9 : 8;
            const stateIdx = reportId === 0 ? 10 : 9;

            if (report.length <= Math.max(actionIdx, stateIdx)) return;

            const action = report[actionIdx];
            const state = report[stateIdx];
            const pressed = state !== 0;

            let keyIndex = -1;
            if (action === 0x01) keyIndex = 0;
            else if (action === 0x02) keyIndex = 1;
            else if (action === 0x03) keyIndex = 2;
            else if (action === 0x04) keyIndex = 3;
            else if (action === 0x05) keyIndex = 4;
            else if (action === 0x06) keyIndex = 5;
            else if (action === 0x25) keyIndex = 6;
            else if (action === 0x30) keyIndex = 7;
            else if (action === 0x31) keyIndex = 8;

            if (keyIndex !== -1) {
                if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                    window.opener.soomfonOpBridge_${op.id}.onKeyEvent(keyIndex, pressed);
                }
                return;
            }

            let knobIndex = -1;
            let direction = 0;
            if (action === 0x90) { knobIndex = 0; direction = -1; }
            else if (action === 0x91) { knobIndex = 0; direction = 1; }
            else if (action === 0x50) { knobIndex = 1; direction = -1; }
            else if (action === 0x51) { knobIndex = 1; direction = 1; }
            else if (action === 0x60) { knobIndex = 2; direction = -1; }
            else if (action === 0x61) { knobIndex = 2; direction = 1; }

            if (knobIndex !== -1) {
                if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                    window.opener.soomfonOpBridge_${op.id}.onKnobEvent(knobIndex, direction);
                }
                return;
            }

            let clickKnob = -1;
            if (action === 0x33) clickKnob = 0;
            else if (action === 0x35) clickKnob = 1;
            else if (action === 0x34) clickKnob = 2;

            if (clickKnob !== -1) {
                if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                    window.opener.soomfonOpBridge_${op.id}.onKnobClickEvent(clickKnob, pressed);
                }
                return;
            }
        }

        async function sendPacket(cmdBytes) {
            if (!activeDevice || !activeDevice.opened) return;
            try {
                // Determine reportId requirement for output reports
                let reportId = 0;
                let payloadLen = 1024;
                if (activeDevice.collections && activeDevice.collections.length > 0) {
                    const col = activeDevice.collections.find((c) => c.outputReports && c.outputReports.length > 0);
                    if (col && col.outputReports && col.outputReports.length > 0) {
                        const rep = col.outputReports[0];
                        if (rep.reportId !== undefined) {
                            reportId = rep.reportId;
                        }
                    }
                }

                // If reportId > 0, browser WebHID sendReport excludes reportId byte from payload Uint8Array
                payloadLen = reportId > 0 ? 1023 : 1024;
                const packet = new Uint8Array(payloadLen);
                packet[0] = 0x43; // C
                packet[1] = 0x52; // R
                packet[2] = 0x54; // T
                packet[3] = 0x00;
                packet[4] = 0x00;
                packet.set(cmdBytes.subarray(0, payloadLen - 5), 5);

                await activeDevice.sendReport(reportId, packet);
            } catch (e) {
                console.warn("[WebHid.ExternalSoomfonController] sendReport error:", e.message);
            }
        }

        async function sendInitSequence() {
            await sendPacket(new Uint8Array([0x44, 0x49, 0x53, 0x00, 0x00])); // DIS\x00\x00
            await sendPacket(new Uint8Array([0x4c, 0x49, 0x47, 0x00, 0x00, 80])); // LIG\x00\x00 percent
            await sendPacket(new Uint8Array([0x43, 0x4c, 0x45, 0x00, 0x00, 0x00, 0xff])); // CLE\x00\x00\x00\xFF
            await sendPacket(new Uint8Array([0x53, 0x54, 0x50])); // STP
        }

        function startHeartbeat() {
            stopHeartbeat();
            heartbeatInterval = setInterval(async () => {
                if (activeDevice && activeDevice.opened) {
                    await sendPacket(new Uint8Array([0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54]));
                }
            }, 10000);
        }

        function stopHeartbeat() {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
        }

        async function disconnectDevice() {
            stopHeartbeat();
            if (activeDevice) {
                try {
                    activeDevice.removeEventListener("inputreport", handleInputReport);
                    if (activeDevice.opened) {
                        await sendPacket(new Uint8Array([0x43, 0x4c, 0x45, 0x00, 0x00, 0x44, 0x43]));
                        await sendPacket(new Uint8Array([0x48, 0x41, 0x4e]));
                        await activeDevice.close();
                    }
                } catch (e) {}
            }
            activeDevice = null;
            isConnected = false;
            if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                window.opener.soomfonOpBridge_${op.id}.onDisconnect();
            }
        }

        function rotateAndEncodeJPEG(base64Data, targetW = 60, targetH = 60) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const rotW = targetH;
                    const rotH = targetW;
                    const canvas = document.createElement("canvas");
                    canvas.width = rotW;
                    canvas.height = rotH;
                    const ctx = canvas.getContext("2d");

                    ctx.save();
                    ctx.translate(rotW / 2, rotH / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
                    ctx.restore();

                    canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error("Failed creating rotated blob"));
                        blob.arrayBuffer().then(resolve).catch(reject);
                    }, "image/jpeg", 0.9);
                };
                img.onerror = (err) => reject(err);
                img.src = base64Data.startsWith("data:") ? base64Data : "data:image/jpeg;base64," + base64Data;
            });
        }

        async function uploadJPEGToKey(keyIndex, jpegBuffer) {
            if (!activeDevice || !activeDevice.opened) return;

            const bytes = new Uint8Array(jpegBuffer);
            const size = bytes.byteLength;
            const sizeHi = (size >> 8) & 0xff;
            const sizeLo = size & 0xff;
            const keyByte = (keyIndex + 1) & 0xff;

            await sendPacket(new Uint8Array([0x42, 0x41, 0x54, 0x00, 0x00, sizeHi, sizeLo, keyByte]));

            let reportId = 0;
            if (activeDevice.collections && activeDevice.collections.length > 0) {
                const col = activeDevice.collections.find((c) => c.outputReports && c.outputReports.length > 0);
                if (col && col.outputReports && col.outputReports.length > 0) {
                    if (col.outputReports[0].reportId !== undefined) reportId = col.outputReports[0].reportId;
                }
            }
            const chunkCapacity = reportId > 0 ? 1023 : 1024;

            let offset = 0;
            while (offset < size) {
                const chunkLen = Math.min(chunkCapacity, size - offset);
                const chunkPacket = new Uint8Array(chunkCapacity);
                chunkPacket.set(bytes.subarray(offset, offset + chunkLen), 0);
                await activeDevice.sendReport(reportId, chunkPacket);
                offset += chunkCapacity;
            }
            await sendPacket(new Uint8Array([0x53, 0x54, 0x50]));
        }

        async function connectDevice(deviceIndex = 0) {
            await disconnectDevice();
            if (!navigator.hid) {
                setStatus("WebHID Not Supported", "#f43f5e");
                return;
            }

            try {
                const devices = await navigator.hid.getDevices();
                let soomfonDevices = devices.filter((d) => SOOMFON_FILTERS.some((f) => f.vendorId === d.vendorId));
                
                // Prioritize vendor collection 0xFFA0 if present
                const vendorPageDevices = soomfonDevices.filter((d) => d.collections && d.collections.some((c) => c.usagePage === 0xffa0));
                if (vendorPageDevices.length > 0) {
                    soomfonDevices = vendorPageDevices;
                }

                if (soomfonDevices.length === 0) {
                    setStatus("No paired devices found", "#eab308");
                    return;
                }

                if (deviceIndex < 0 || deviceIndex >= soomfonDevices.length) {
                    setStatus("Device index out of range", "#eab308");
                    return;
                }

                let targetDev = soomfonDevices[deviceIndex];

                // Phase 1: Wake Up Device & Init Sequence
                try {
                    if (!targetDev.opened) {
                        await targetDev.open();
                    }
                    activeDevice = targetDev;
                    await sendInitSequence();
                    await targetDev.close();
                    activeDevice = null;
                } catch (e) {
                    console.warn("[WebHid.ExternalSoomfonController] Phase 1 wake warning:", e.message);
                }

                // 500ms delay between wake and operational connect
                await new Promise((res) => setTimeout(res, 500));

                // Phase 2: Operations Connection
                if (!targetDev.opened) {
                    await targetDev.open();
                }
                activeDevice = targetDev;
                activeDevice.addEventListener("inputreport", handleInputReport);

                await sendInitSequence();
                startHeartbeat();

                isConnected = true;
                const modelName = targetDev.productName || "Soomfon SE Controller";
                setStatus("Connected to " + modelName, "#22c55e");

                if (window.opener && window.opener.soomfonOpBridge_${op.id}) {
                    window.opener.soomfonOpBridge_${op.id}.onConnect({
                        name: modelName,
                        vendorId: targetDev.vendorId,
                        productId: targetDev.productId,
                        keyCount: 6,
                        cols: 3,
                        rows: 2,
                        iconSize: 60
                    });
                }
            } catch (e) {
                setStatus("Connection Failed: " + e.message, "#f43f5e");
                await disconnectDevice();
            }
        }

        async function requestDevicePermission() {
            if (!navigator.hid) {
                setStatus("WebHID Not Supported", "#f43f5e");
                return;
            }
            try {
                const selected = await navigator.hid.requestDevice({ filters: SOOMFON_FILTERS });
                if (selected && selected.length > 0) {
                    await connectDevice(0);
                }
            } catch (e) {
                setStatus("Request Canceled", "#eab308");
            }
        }

        reqBtn.addEventListener("click", () => {
            requestDevicePermission();
        });

        window.remoteBridge = {
            connect: (idx) => connectDevice(idx),
            disconnect: () => disconnectDevice(),
            sendAction: async (action, params) => {
                if (!activeDevice || !isConnected) return;
                if (action === "set_key_image") {
                    const jpegBuf = await rotateAndEncodeJPEG(params.image, 60, 60);
                    await uploadJPEGToKey(params.key, jpegBuf);
                } else if (action === "set_stretched_image") {
                    const gridW = 180;
                    const gridH = 120;
                    const img = new Image();
                    await new Promise((res, rej) => {
                        img.onload = res;
                        img.onerror = rej;
                        img.src = params.image.startsWith("data:") ? params.image : "data:image/jpeg;base64," + params.image;
                    });
                    const gridCanvas = document.createElement("canvas");
                    gridCanvas.width = gridW;
                    gridCanvas.height = gridH;
                    const gridCtx = gridCanvas.getContext("2d");
                    gridCtx.drawImage(img, 0, 0, gridW, gridH);

                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 3; c++) {
                            const keyIdx = r * 3 + c;
                            const srcRow = 1 - r;
                            const srcCol = c;

                            const subCanvas = document.createElement("canvas");
                            subCanvas.width = 60;
                            subCanvas.height = 60;
                            const subCtx = subCanvas.getContext("2d");

                            subCtx.save();
                            subCtx.translate(60, 0);
                            subCtx.scale(-1, 1);
                            subCtx.drawImage(gridCanvas, srcCol * 60, srcRow * 60, 60, 60, 0, 0, 60, 60);
                            subCtx.restore();

                            const dataUrl = subCanvas.toDataURL("image/jpeg", 0.9);
                            const base64 = dataUrl.split(",")[1];
                            const jpegBuf = await rotateAndEncodeJPEG(base64, 60, 60);
                            await uploadJPEGToKey(keyIdx, jpegBuf);
                        }
                    }
                }
            }
        };

        if (navigator.hid) {
            navigator.hid.addEventListener("connect", () => connectDevice(0));
            navigator.hid.addEventListener("disconnect", () => disconnectDevice());
        }

        connectDevice(0);
    </script>
</body>
</html>`;

function setupOpBridge() {
    window[`soomfonOpBridge_${op.id}`] = {
        updateStatus(text) {
            outStatus.set(text);
        },
        onConnect(meta) {
            isConnected = true;
            outIsConnected.set(true);
            outStatus.set("Connected to " + meta.name);
            outDeviceInfo.set(meta);

            const connectionObj = {
                key_width: 60,
                key_height: 60,
                cols: 3,
                rows: 2,
                send(action, params) {
                    if (childWindow && !childWindow.closed && childWindow.remoteBridge) {
                        childWindow.remoteBridge.sendAction(action, params);
                    }
                }
            };
            outConnection.set(connectionObj);
        },
        onDisconnect() {
            isConnected = false;
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Disconnected");
        },
        onKeyEvent(keyIndex, pressed) {
            outEventKeyIndex.set(keyIndex);
            outEventPressed.set(pressed);
            outKeyEvent.trigger();
        },
        onKnobEvent(knobIndex, direction) {
            outEventKnobIndex.set(knobIndex);
            outEventKnobDirection.set(direction);
            if (knobIndex === 0) {
                knob0Val += direction;
                outKnob0Value.set(knob0Val);
            } else if (knobIndex === 1) {
                knob1Val += direction;
                outKnob1Value.set(knob1Val);
            } else if (knobIndex === 2) {
                knob2Val += direction;
                outKnob2Value.set(knob2Val);
            }
            outKnobEvent.trigger();
        },
        onKnobClickEvent(knobIndex, pressed) {
            outEventKnobClickIndex.set(knobIndex);
            outEventKnobClickPressed.set(pressed);
            outKnobClickEvent.trigger();
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
    childWindow = window.open("about:blank", `soomfon_external_${op.id}`, features);

    if (!childWindow) {
        outStatus.set("Popup Blocked");
        outWindowStatus.set("Blocked");
        op.logError("[WebHid.ExternalSoomfonController] Popup window blocked by browser.");
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
            isConnected = false;
            outWindowStatus.set("Closed");
            outIsConnected.set(false);
            outConnection.set(null);
            outDeviceInfo.set(null);
            outStatus.set("Window Closed");
        }
    }, 1000);
}

inOpenWindow.onTriggered = () => {
    openPopupWindow();
};

inActive.onChange = () => {
    if (inActive.get()) {
        openPopupWindow();
    } else {
        if (childWindow && !childWindow.closed) {
            childWindow.close();
        }
    }
};

inDeviceIndex.onChange = () => {
    if (childWindow && !childWindow.closed && childWindow.remoteBridge) {
        childWindow.remoteBridge.connect(inDeviceIndex.get());
    }
};

op.onDelete = () => {
    clearInterval(windowPollInterval);
    delete window[`soomfonOpBridge_${op.id}`];
    if (childWindow && !childWindow.closed) {
        childWindow.close();
    }
};
