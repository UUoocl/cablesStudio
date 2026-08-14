/**
 * Ops.Team.CablesStudio.WebHid.SoomfonController
 * 
 * Interfacing natively with Soomfon visual controllers using standard WebHID API.
 */

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    inRequestDevice = op.inTrigger("Request Device"),
    
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

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("Settings", [inDeviceIndex]);

let activeDevice = null;
let isConnected = false;
let knob0Val = 0;
let knob1Val = 0;
let knob2Val = 0;
let heartbeatInterval = null;

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

const SOOMFON_FILTERS = [
    { vendorId: 0x1500, productId: 0x3001, usagePage: 0xffa0 },
    { vendorId: 0x0300, productId: 0x3002, usagePage: 0xffa0 },
    { vendorId: 0x1500, usagePage: 0xffa0 },
    { vendorId: 0x0300, usagePage: 0xffa0 },
    { vendorId: 0x1500, productId: 0x3001 },
    { vendorId: 0x0300, productId: 0x3002 }
];

function checkWebHIDSupport() {
    if (!navigator.hid) {
        op.logError("[WebHid.SoomfonController] WebHID API is not supported in this environment.");
        outStatus.set("WebHID Not Supported");
        return false;
    }
    return true;
}

async function requestDevicePermission() {
    if (!checkWebHIDSupport()) return;
    try {
        const selected = await navigator.hid.requestDevice({ filters: SOOMFON_FILTERS });
        if (selected && selected.length > 0) {
            op.log(`[WebHid.SoomfonController] Device selected via picker: ${selected[0].productName}`);
            if (inActive.get()) {
                connectDevice();
            }
        }
    } catch (e) {
        op.logError("[WebHid.SoomfonController] Device request failed: " + e.message);
        outStatus.set("Permission Request Failed");
    }
}

inRequestDevice.onTriggered = () => {
    requestDevicePermission();
};

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

    // Keys 0 to 8 mapping
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
        outEventKeyIndex.set(keyIndex);
        outEventPressed.set(pressed);
        outKeyEvent.trigger();
        return;
    }

    // Knob turn mapping
    let knobIndex = -1;
    let direction = 0;
    if (action === 0x90) { knobIndex = 0; direction = -1; }
    else if (action === 0x91) { knobIndex = 0; direction = 1; }
    else if (action === 0x50) { knobIndex = 1; direction = -1; }
    else if (action === 0x51) { knobIndex = 1; direction = 1; }
    else if (action === 0x60) { knobIndex = 2; direction = -1; }
    else if (action === 0x61) { knobIndex = 2; direction = 1; }

    if (knobIndex !== -1) {
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
        return;
    }

    // Knob click mapping
    let clickKnob = -1;
    if (action === 0x33) clickKnob = 0;
    else if (action === 0x35) clickKnob = 1;
    else if (action === 0x34) clickKnob = 2;

    if (clickKnob !== -1) {
        outEventKnobClickIndex.set(clickKnob);
        outEventKnobClickPressed.set(pressed);
        outKnobClickEvent.trigger();
        return;
    }
}

async function sendPacket(cmdBytes) {
    if (!activeDevice || !activeDevice.opened) return;
    try {
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
        op.logWarn("[WebHid.SoomfonController] sendReport error: " + e.message);
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
    outIsConnected.set(false);
    outConnection.set(null);
    outDeviceInfo.set(null);
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

async function connectDevice() {
    await disconnectDevice();
    if (!inActive.get()) return;

    if (!checkWebHIDSupport()) return;

    try {
        const devices = await navigator.hid.getDevices();
        let soomfonDevices = devices.filter((d) => SOOMFON_FILTERS.some((f) => f.vendorId === d.vendorId));
        
        // Prioritize vendor collection 0xFFA0 if present
        const vendorPageDevices = soomfonDevices.filter((d) => d.collections && d.collections.some((c) => c.usagePage === 0xffa0));
        if (vendorPageDevices.length > 0) {
            soomfonDevices = vendorPageDevices;
        }
        const index = inDeviceIndex.get();

        if (soomfonDevices.length === 0) {
            outStatus.set("No devices found (Use Request Device)");
            return;
        }

        if (index < 0 || index >= soomfonDevices.length) {
            outStatus.set("Device index out of range");
            return;
        }

        let targetDev = soomfonDevices[index];

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
            op.logWarn("[WebHid.SoomfonController] Phase 1 wake warning: " + e.message);
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
        outIsConnected.set(true);
        const modelName = targetDev.productName || "Soomfon SE Controller";
        outStatus.set("Connected to " + modelName);

        const connectionObj = {
            key_width: 60,
            key_height: 60,
            cols: 3,
            rows: 2,
            async send(action, params) {
                if (!activeDevice || !isConnected) return;
                try {
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
                } catch (e) {
                    op.logError("[WebHid.SoomfonController] Send action error: " + e.message);
                }
            }
        };

        const metaObj = {
            name: modelName,
            vendorId: dev.vendorId,
            productId: dev.productId,
            keyCount: 6,
            cols: 3,
            rows: 2,
            iconSize: 60
        };

        outConnection.set(connectionObj);
        outDeviceInfo.set(metaObj);
        op.log(`[WebHid.SoomfonController] Successfully connected to ${modelName}`);
    } catch (e) {
        op.logError("[WebHid.SoomfonController] Connection failed: " + String(e));
        outStatus.set("Connection Failed");
        await disconnectDevice();
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        connectDevice();
    } else {
        disconnectDevice();
        outStatus.set("Stopped");
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get()) {
        connectDevice();
    }
};

if (navigator.hid) {
    navigator.hid.addEventListener("connect", (event) => {
        if (event.device && SOOMFON_FILTERS.some((f) => f.vendorId === event.device.vendorId && f.productId === event.device.productId) && inActive.get() && !isConnected) {
            connectDevice();
        }
    });

    navigator.hid.addEventListener("disconnect", (event) => {
        if (activeDevice && event.device === activeDevice) {
            disconnectDevice();
            outStatus.set("Disconnected");
        }
    });
}

op.onDelete = () => {
    disconnectDevice();
};
