/**
 * Ops.Team.CablesStudio.WebHid.StreamDeck
 * 
 * Interfacing natively with Elgato Stream Deck devices using WebHID API.
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
    outEventPressed = op.outBool("Event Pressed", false);

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("Settings", [inDeviceIndex]);

let activeDevice = null;
let isConnected = false;
let buttonStates = [];
let deviceInfo = null;

outConnection.set(null);
outDeviceInfo.set(null);

const STREAM_DECK_VID = 0x0fd9;

const DEVICE_SPECS = {
    0x0060: { name: "Stream Deck V1", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 8191, isVersionTwo: false },
    0x006d: { name: "Stream Deck V2", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true },
    0x0080: { name: "Stream Deck Mk2", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true },
    0x0063: { name: "Stream Deck Mini V1", iconSize: 80, keyCount: 6, cols: 3, rows: 2, pagePacketSize: 1024, isVersionTwo: false },
    0x0090: { name: "Stream Deck Mini V2", iconSize: 80, keyCount: 6, cols: 3, rows: 2, pagePacketSize: 1024, isVersionTwo: true },
    0x006c: { name: "Stream Deck XL V1", iconSize: 96, keyCount: 32, cols: 8, rows: 4, pagePacketSize: 1024, isVersionTwo: true },
    0x008f: { name: "Stream Deck XL Gen 2", iconSize: 96, keyCount: 32, cols: 8, rows: 4, pagePacketSize: 1024, isVersionTwo: true },
    0x0084: { name: "Stream Deck Plus", iconSize: 120, keyCount: 8, cols: 4, rows: 2, pagePacketSize: 1024, isVersionTwo: true }
};

function getDeviceInfo(productId) {
    if (DEVICE_SPECS[productId]) {
        return { productId, ...DEVICE_SPECS[productId] };
    }
    return { productId, name: "Unknown Stream Deck", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true };
}

function getDeviceKeyIndex(productId, userKeyIndex) {
    if (productId === 0x0060) { // V1 horizontal mirror
        const row = Math.floor(userKeyIndex / 5);
        const col = userKeyIndex % 5;
        return row * 5 + (4 - col);
    }
    return userKeyIndex;
}

function getUserKeyIndex(productId, deviceKeyIndex) {
    if (productId === 0x0060) { // V1 horizontal mirror
        const row = Math.floor(deviceKeyIndex / 5);
        const col = deviceKeyIndex % 5;
        return row * 5 + (4 - col);
    }
    return deviceKeyIndex;
}

function checkWebHIDSupport() {
    if (!navigator.hid) {
        op.logError("[WebHid.StreamDeck] WebHID API is not supported in this environment.");
        outStatus.set("WebHID Not Supported");
        return false;
    }
    return true;
}

async function requestDevicePermission() {
    if (!checkWebHIDSupport()) return;
    try {
        const filters = Object.keys(DEVICE_SPECS).map((pid) => ({
            vendorId: STREAM_DECK_VID,
            productId: parseInt(pid, 10)
        }));
        // Fallback filter for any Elgato HID device
        filters.push({ vendorId: STREAM_DECK_VID });

        const selectedDevices = await navigator.hid.requestDevice({ filters });
        if (selectedDevices && selectedDevices.length > 0) {
            op.log(`[WebHid.StreamDeck] Device selected via picker: ${selectedDevices[0].productName}`);
            if (inActive.get()) {
                connectDevice();
            }
        }
    } catch (e) {
        op.logError("[WebHid.StreamDeck] Device request canceled or failed: " + e.message);
        outStatus.set("Permission Request Failed");
    }
}

inRequestDevice.onTriggered = () => {
    requestDevicePermission();
};

function handleInputReport(event) {
    if (!activeDevice || !deviceInfo || deviceInfo.keyCount <= 0) return;

    const { reportId, data } = event;
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    const keyCount = deviceInfo.keyCount;
    // WebHID HIDInputReportEvent: when reportId is non-zero, data DataView starts AFTER the reportId byte.
    // On macOS native IOHIDManager, report contains reportId at byte 0.
    // In WebHID, event.reportId has the report ID, and event.data starts at byte 1 of raw report.
    const headerOffset = deviceInfo.isVersionTwo ? (reportId === 0 ? 4 : 3) : (reportId === 0 ? 1 : 0);

    if (bytes.length < headerOffset + keyCount) return;

    for (let i = 0; i < keyCount; i++) {
        const isPressed = bytes[headerOffset + i] === 1;
        const userKey = getUserKeyIndex(deviceInfo.productId, i);

        if (userKey >= 0 && userKey < buttonStates.length) {
            if (isPressed !== buttonStates[userKey]) {
                buttonStates[userKey] = isPressed;

                outEventKeyIndex.set(userKey);
                outEventPressed.set(isPressed);
                outKeyEvent.trigger();
            }
        }
    }
}

async function disconnectDevice() {
    if (activeDevice) {
        try {
            activeDevice.removeEventListener("inputreport", handleInputReport);
            if (activeDevice.opened) {
                await activeDevice.close();
            }
        } catch (e) {
            op.logWarn("[WebHid.StreamDeck] Error closing device: " + e.message);
        }
    }
    activeDevice = null;
    deviceInfo = null;
    isConnected = false;
    outIsConnected.set(false);
    outConnection.set(null);
    outDeviceInfo.set(null);
}

async function sendFeatureReport(reportId, reportData) {
    if (!activeDevice || !activeDevice.opened) return;
    try {
        const data = new Uint8Array(reportData);
        await activeDevice.sendFeatureReport(reportId, data);
    } catch (e) {
        op.logWarn(`[WebHid.StreamDeck] sendFeatureReport (0x${reportId.toString(16)}) warning: ${e.message}`);
    }
}

async function sendReport(reportId, reportData) {
    if (!activeDevice || !activeDevice.opened) return;
    try {
        const data = new Uint8Array(reportData);
        await activeDevice.sendReport(reportId, data);
    } catch (e) {
        op.logWarn(`[WebHid.StreamDeck] sendReport (0x${reportId.toString(16)}) warning: ${e.message}`);
    }
}

async function resetDevice() {
    if (!deviceInfo) return;
    try {
        if (deviceInfo.isVersionTwo) {
            const report = new Uint8Array(31);
            report[0] = 0x02;
            await sendFeatureReport(0x03, report);
        } else {
            const report = new Uint8Array(16);
            report[0] = 0x63;
            await sendFeatureReport(0x0b, report);
        }
    } catch (e) {
        op.logWarn(`[WebHid.StreamDeck] resetDevice warning: ${e.message}`);
    }
}

async function setBrightness(percent) {
    if (!deviceInfo) return;
    try {
        const brightness = Math.max(0, Math.min(100, Math.round(percent)));
        if (deviceInfo.isVersionTwo) {
            const report = new Uint8Array(31);
            report[0] = 0x08;
            report[1] = brightness;
            await sendFeatureReport(0x03, report);
        } else {
            const report = new Uint8Array(16);
            report[0] = 0x55;
            report[1] = 0xaa;
            report[2] = 0xd1;
            report[3] = 0x01;
            report[4] = brightness;
            await sendFeatureReport(0x05, report);
        }
    } catch (e) {
        op.logWarn(`[WebHid.StreamDeck] setBrightness warning: ${e.message}`);
    }
}

async function writeKeyImagePayload(userKeyIdx, imgBuffer, isJpeg) {
    if (!activeDevice || !deviceInfo) return;
    const devKeyIdx = getDeviceKeyIndex(deviceInfo.productId, userKeyIdx);

    if (isJpeg) {
        const packetSize = deviceInfo.pagePacketSize - 8; // 1016
        const totalBytes = imgBuffer.byteLength;
        const numChunks = Math.ceil(totalBytes / packetSize);

        for (let chunk = 0; chunk < numChunks; chunk++) {
            const offset = chunk * packetSize;
            const chunkData = new Uint8Array(imgBuffer, offset, Math.min(packetSize, totalBytes - offset));
            const isLast = chunk === numChunks - 1;

            const header = new Uint8Array([
                0x07,
                devKeyIdx,
                isLast ? 1 : 0,
                chunkData.byteLength & 0xff,
                (chunkData.byteLength >> 8) & 0xff,
                chunk & 0xff,
                (chunk >> 8) & 0xff
            ]);

            const packet = new Uint8Array(deviceInfo.pagePacketSize - 1); // WebHID report ID is passed separately as 1st parameter
            packet.set(header, 0);
            packet.set(chunkData, header.length);

            await sendReport(0x02, packet);
        }
    } else {
        if (deviceInfo.keyCount === 6) { // Mini V1
            const pageOnePacketSize = deviceInfo.pagePacketSize - 70; // 954
            const pageTwoPacketSize = deviceInfo.pagePacketSize - 16; // 1008
            const iconBytes = deviceInfo.iconSize * deviceInfo.iconSize * 3; // 19200

            const p1Header = new Uint8Array([
                0x01, 0x00, 0x00, 0x00, devKeyIdx + 1,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x42, 0x4d, 0x36, 0x4b, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00,
                0x28, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00,
                0x50, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x4b, 0x00, 0x00,
                0x13, 0x0b, 0x00, 0x00, 0x13, 0x0b, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);

            const p1Packet = new Uint8Array(deviceInfo.pagePacketSize - 1);
            p1Packet.set(p1Header, 0);
            p1Packet.set(new Uint8Array(imgBuffer, 0, pageOnePacketSize), p1Header.length);
            await sendReport(0x02, p1Packet);

            let count = 0;
            let i = pageOnePacketSize;
            while (i < iconBytes) {
                count++;
                const chunkLength = Math.min(pageTwoPacketSize, iconBytes - i);
                const p2Header = new Uint8Array([
                    0x01, count, 0x00, count === 19 ? 1 : 0, devKeyIdx + 1,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
                ]);
                const p2Packet = new Uint8Array(deviceInfo.pagePacketSize - 1);
                p2Packet.set(p2Header, 0);
                p2Packet.set(new Uint8Array(imgBuffer, i, chunkLength), p2Header.length);
                await sendReport(0x02, p2Packet);
                i += pageTwoPacketSize;
            }
        } else { // Stream Deck V1
            const p1Size = 7749;
            const p2Size = 7803;

            const p1Header = new Uint8Array([
                0x01, 0x01, 0x00, 0x00, devKeyIdx + 1,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x42, 0x4d, 0xf6, 0x3c, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00,
                0x28, 0x00, 0x00, 0x00, 0x48, 0x00, 0x00, 0x00,
                0x48, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
                0x00, 0x00, 0x00, 0x00, 0xc0, 0x3c, 0x00, 0x00,
                0xc4, 0x0e, 0x00, 0x00, 0xc4, 0x0e, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);
            const p1Packet = new Uint8Array(deviceInfo.pagePacketSize - 1);
            p1Packet.set(p1Header, 0);
            p1Packet.set(new Uint8Array(imgBuffer, 0, p1Size), p1Header.length);
            await sendReport(0x02, p1Packet);

            const p2Header = new Uint8Array([
                0x01, 0x02, 0x00, 0x01, devKeyIdx + 1,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);
            const p2Packet = new Uint8Array(deviceInfo.pagePacketSize - 1);
            p2Packet.set(p2Header, 0);
            p2Packet.set(new Uint8Array(imgBuffer, p1Size, p2Size), p2Header.length);
            await sendReport(0x02, p2Packet);
        }
    }
}

function processImageToFormat(base64Data, targetSize, isJpeg, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext("2d");

            if (isJpeg) {
                // V2 devices: standard orientation JPEG
                ctx.drawImage(img, 0, 0, targetSize, targetSize);
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Failed canvas blob creation"));
                    blob.arrayBuffer().then(resolve).catch(reject);
                }, "image/jpeg", quality);
            } else {
                // V1 devices: BGR format, rotated 180 degrees
                ctx.save();
                ctx.translate(targetSize / 2, targetSize / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(img, -targetSize / 2, -targetSize / 2, targetSize, targetSize);
                ctx.restore();

                const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
                const rgba = imgData.data;
                const bgr = new Uint8Array(targetSize * targetSize * 3);
                for (let i = 0; i < targetSize * targetSize; i++) {
                    bgr[i * 3 + 0] = rgba[i * 4 + 2]; // B
                    bgr[i * 3 + 1] = rgba[i * 4 + 1]; // G
                    bgr[i * 3 + 2] = rgba[i * 4 + 0]; // R
                }
                resolve(bgr.buffer);
            }
        };
        img.onerror = (err) => reject(err);
        img.src = base64Data.startsWith("data:") ? base64Data : "data:image/jpeg;base64," + base64Data;
    });
}

async function connectDevice() {
    await disconnectDevice();
    if (!inActive.get()) return;

    if (!checkWebHIDSupport()) return;

    try {
        const devices = await navigator.hid.getDevices();
        const streamDeckDevices = devices.filter((d) => d.vendorId === STREAM_DECK_VID);

        const index = inDeviceIndex.get();

        if (streamDeckDevices.length === 0) {
            outStatus.set("No devices found (Use Request Device)");
            return;
        }

        if (index < 0 || index >= streamDeckDevices.length) {
            outStatus.set("Device index out of range");
            return;
        }

        const dev = streamDeckDevices[index];
        outStatus.set("Connecting...");

        if (!dev.opened) {
            await dev.open();
        }

        activeDevice = dev;
        deviceInfo = getDeviceInfo(dev.productId);
        buttonStates = new Array(deviceInfo.keyCount).fill(false);

        activeDevice.addEventListener("inputreport", handleInputReport);

        await resetDevice();

        isConnected = true;
        outIsConnected.set(true);
        const modelName = dev.productName || deviceInfo.name;
        outStatus.set("Connected to " + modelName);

        const connectionObj = {
            key_width: deviceInfo.iconSize,
            key_height: deviceInfo.iconSize,
            cols: deviceInfo.cols,
            rows: deviceInfo.rows,
            async send(action, params) {
                if (!activeDevice || !isConnected || !deviceInfo) return;
                try {
                    if (action === "set_key_image") {
                        const imgBuf = await processImageToFormat(params.image, deviceInfo.iconSize, deviceInfo.isVersionTwo);
                        await writeKeyImagePayload(params.key, imgBuf, deviceInfo.isVersionTwo);
                    } else if (action === "set_stretched_image") {
                        // Stretched image handling
                        const gridW = deviceInfo.cols * deviceInfo.iconSize;
                        const gridH = deviceInfo.rows * deviceInfo.iconSize;

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

                        for (let r = 0; r < deviceInfo.rows; r++) {
                            for (let c = 0; c < deviceInfo.cols; c++) {
                                const keyIdx = r * deviceInfo.cols + c;
                                const srcCol = c;
                                const srcRow = deviceInfo.rows - 1 - r;

                                const subCanvas = document.createElement("canvas");
                                subCanvas.width = deviceInfo.iconSize;
                                subCanvas.height = deviceInfo.iconSize;
                                const subCtx = subCanvas.getContext("2d");

                                subCtx.save();
                                subCtx.translate(deviceInfo.iconSize, 0);
                                subCtx.scale(-1, 1);
                                subCtx.drawImage(
                                    gridCanvas,
                                    srcCol * deviceInfo.iconSize,
                                    srcRow * deviceInfo.iconSize,
                                    deviceInfo.iconSize,
                                    deviceInfo.iconSize,
                                    0,
                                    0,
                                    deviceInfo.iconSize,
                                    deviceInfo.iconSize
                                );
                                subCtx.restore();

                                const dataUrl = subCanvas.toDataURL("image/jpeg", 0.9);
                                const base64 = dataUrl.split(",")[1];
                                const imgBuf = await processImageToFormat(base64, deviceInfo.iconSize, deviceInfo.isVersionTwo);
                                await writeKeyImagePayload(keyIdx, imgBuf, deviceInfo.isVersionTwo);
                            }
                        }
                    } else if (action === "set_brightness") {
                        await setBrightness(params.brightness);
                    }
                } catch (e) {
                    op.logError("[WebHid.StreamDeck] Send action error: " + e.message);
                }
            }
        };

        const metaObj = {
            name: modelName,
            vendorId: dev.vendorId,
            productId: dev.productId,
            keyCount: deviceInfo.keyCount,
            cols: deviceInfo.cols,
            rows: deviceInfo.rows,
            iconSize: deviceInfo.iconSize
        };

        outConnection.set(connectionObj);
        outDeviceInfo.set(metaObj);
        op.log(`[WebHid.StreamDeck] Successfully claimed and connected to ${modelName}`);

    } catch (e) {
        op.logError("[WebHid.StreamDeck] Connection failed: " + String(e));
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
        if (event.device && event.device.vendorId === STREAM_DECK_VID && inActive.get() && !isConnected) {
            op.log("[WebHid.StreamDeck] Stream Deck attached, connecting...");
            connectDevice();
        }
    });

    navigator.hid.addEventListener("disconnect", (event) => {
        if (activeDevice && event.device === activeDevice) {
            op.log("[WebHid.StreamDeck] Active Stream Deck disconnected.");
            disconnectDevice();
            outStatus.set("Disconnected");
        }
    });
}

op.onDelete = () => {
    disconnectDevice();
};
