/**
 * Ops.Extension.Standalone.MacOs.Hid.StreamDeck
 * 
 * Native macOS IOHIDManager driver for Elgato Stream Deck devices in Cables.
 * Zero main.js configuration required. Direct OS-level USB hardware communication.
 */

const
    inActive = op.inBool("Active", true),
    inDeviceIndex = op.inInt("Device Index", 0),
    inBrightness = op.inFloat("Brightness", 80),
    inClearKeys = op.inTriggerButton("Clear All Keys"),

    outConnection = op.outObject("Connection", null),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info", null),

    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false),

    outDialEvent = op.outTrigger("Dial Event"),
    outDialIndex = op.outNumber("Dial Index", 0),
    outDialValue = op.outNumber("Dial Value", 0),
    outDialPressed = op.outBool("Dial Pressed", false),

    outTouchpadEvent = op.outTrigger("Touchpad Event"),
    outTouchpadData = op.outObject("Touchpad Data", null);

op.setPortGroup("Controls", [inActive, inBrightness, inClearKeys]);
op.setPortGroup("Settings", [inDeviceIndex]);
op.setPortGroup("Outputs", [outConnection, outIsConnected, outStatus, outDeviceInfo]);
op.setPortGroup("Key Events", [outKeyEvent, outEventKeyIndex, outEventPressed]);
op.setPortGroup("Dial & Touchpad (Plus)", [outDialEvent, outDialIndex, outDialValue, outDialPressed, outTouchpadEvent, outTouchpadData]);

const DEVICE_SPECS = {
    0x0060: { name: "Stream Deck V1", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 8191, isVersionTwo: false, imageFormat: "bmp" },
    0x006d: { name: "Stream Deck V2", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" },
    0x0080: { name: "Stream Deck MK.2", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" },
    0x0063: { name: "Stream Deck Mini V1", iconSize: 80, keyCount: 6, cols: 3, rows: 2, pagePacketSize: 1024, isVersionTwo: false, imageFormat: "bmp" },
    0x0090: { name: "Stream Deck Mini V2", iconSize: 80, keyCount: 6, cols: 3, rows: 2, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" },
    0x006c: { name: "Stream Deck XL V1", iconSize: 96, keyCount: 32, cols: 8, rows: 4, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" },
    0x008f: { name: "Stream Deck XL Gen 2", iconSize: 96, keyCount: 32, cols: 8, rows: 4, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" },
    0x0084: { name: "Stream Deck Plus", iconSize: 120, keyCount: 8, cols: 4, rows: 2, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg", hasDials: true, hasLcdStrip: true },
    0x0086: { name: "Stream Deck Pedal", iconSize: 0, keyCount: 3, cols: 3, rows: 1, pagePacketSize: 1024, isVersionTwo: true, isPedal: true }
};

let nativeModule = null;
let nativeDriverInstance = null;
let activeDeviceInfo = null;
let isConnected = false;
let buttonStates = [];
let connectionApi = null;
let isConnecting = false;

function loadNativeAddon() {
    if (nativeModule) return nativeModule;

    try {
        const path = op.require("path");
        const fs = op.require("fs");
        const addonRelPath = "ops/Ops.Extension.Standalone.MacOs.Hid.StreamDeck/build/Release/streamdeck_hid.node";
        const candidatePaths = [];

        if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
            candidatePaths.push(path.join(op.patch.config.prefixAssetPath, addonRelPath));
        }
        if (typeof __dirname !== "undefined" && __dirname) {
            candidatePaths.push(path.join(__dirname, "build/Release/streamdeck_hid.node"));
            candidatePaths.push(path.join(__dirname, "ops/Ops.Extension.Standalone.MacOs.Hid.StreamDeck/build/Release/streamdeck_hid.node"));
        }
        if (typeof process !== "undefined" && typeof process.cwd === "function") {
            candidatePaths.push(path.join(process.cwd(), addonRelPath));
        }
        candidatePaths.push(path.resolve(addonRelPath));

        for (let candidate of candidatePaths) {
            if (!candidate) continue;
            let resolved = candidate;
            if (op.patch && typeof op.patch.filePath === "function") {
                resolved = op.patch.filePath(candidate);
            }
            if (fs.existsSync(resolved)) {
                nativeModule = op.require(resolved);
                op.log("[MacOs.Hid.StreamDeck] Loaded native IOHIDManager driver from: " + resolved);
                return nativeModule;
            }
        }
    } catch (e) {
        op.logWarn("[MacOs.Hid.StreamDeck] Native addon load error: " + e.message);
    }
    return null;
}

function getDeviceInfo(productId) {
    if (DEVICE_SPECS[productId]) {
        return { productId, ...DEVICE_SPECS[productId] };
    }
    return { productId, name: "Stream Deck (Generic)", iconSize: 72, keyCount: 15, cols: 5, rows: 3, pagePacketSize: 1024, isVersionTwo: true, imageFormat: "jpeg" };
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

// ---------------------------------------------------------------------------
// Protocol / Hardware Commands
// ---------------------------------------------------------------------------

function setDeviceBrightness(driver, info, percent) {
    if (!driver) return;

    const val = Math.max(0, Math.min(100, Math.round(percent)));

    if (info.isVersionTwo) {
        const report = new Uint8Array([0x08, val]);
        driver.sendFeatureReport(0x03, report);
    } else {
        const report = new Uint8Array([
            0x55, 0xaa, 0xd1, 0x01, val, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        driver.sendFeatureReport(0x05, report);
    }
}

function resetDevice(driver, info) {
    if (!driver) return;

    if (info.isVersionTwo) {
        const report = new Uint8Array([0x02]);
        driver.sendFeatureReport(0x03, report);
    } else {
        const report = new Uint8Array([
            0x0b, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        driver.sendFeatureReport(0x0b, report);
    }
}

async function sendImagePayload(driver, info, keyIndex, imageBuffer) {
    if (!driver || !imageBuffer) return;

    let raw = imageBuffer;
    if (raw instanceof Promise) {
        raw = await raw;
    }

    let uint8 = null;
    if (raw instanceof Uint8Array) {
        uint8 = raw;
    } else if (raw instanceof ArrayBuffer) {
        uint8 = new Uint8Array(raw);
    } else if (raw && raw.buffer instanceof ArrayBuffer) {
        uint8 = new Uint8Array(raw.buffer, raw.byteOffset || 0, raw.byteLength);
    }

    if (!uint8 || uint8.byteLength === 0) {
        op.logWarn("[MacOs.Hid.StreamDeck] Invalid or empty image buffer");
        return;
    }

    const deviceKey = getDeviceKeyIndex(info.productId, keyIndex);
    const totalLength = uint8.byteLength;
    const isV2 = info.isVersionTwo !== false;

    if (isV2) {
        // Gen 2 JPEG packet structure: 1024 bytes
        // Header: [0x02, 0x07, key, isLast, chunkLenLo, chunkLenHi, pageLo, pageHi]
        const headerSize = 8;
        const packetSize = info.pagePacketSize || 1024;
        const maxPayload = packetSize - headerSize; // 1016 bytes
        let offset = 0;
        let pageNumber = 0;

        while (offset < totalLength) {
            const chunkLength = Math.min(maxPayload, totalLength - offset);
            const isLast = (offset + chunkLength >= totalLength) ? 1 : 0;

            const packet = new Uint8Array(packetSize);
            packet[0] = 0x02; // Report ID: 0x02
            packet[1] = 0x07; // Command: Set Key Image
            packet[2] = deviceKey;
            packet[3] = isLast;
            packet[4] = chunkLength & 0xff;
            packet[5] = (chunkLength >> 8) & 0xff;
            packet[6] = pageNumber & 0xff;
            packet[7] = (pageNumber >> 8) & 0xff;

            packet.set(uint8.subarray(offset, offset + chunkLength), headerSize);

            driver.sendReport(0x02, packet);

            offset += chunkLength;
            pageNumber++;
        }
    } else {
        // Gen 1 BMP packet structure: 8191 / 1024 bytes
        const headerSize = 16;
        const packetSize = (info.productId === 0x0060) ? 8191 : 1024;
        const maxPayload = packetSize - headerSize;
        let offset = 0;
        let pageNumber = 0;

        while (offset < totalLength) {
            const chunkLength = Math.min(maxPayload, totalLength - offset);
            const isLast = (offset + chunkLength >= totalLength) ? 1 : 0;

            const packet = new Uint8Array(packetSize);
            packet[0] = 0x02;
            packet[1] = 0x01;
            packet[2] = pageNumber;
            packet[3] = 0x00;
            packet[4] = 0x00;
            packet[5] = isLast;
            packet[6] = deviceKey + 1;
            packet[7] = 0x00;

            packet.set(uint8.subarray(offset, offset + chunkLength), headerSize);

            driver.sendReport(0x02, packet);

            offset += chunkLength;
            pageNumber++;
        }
    }
}

// ---------------------------------------------------------------------------
// Image Generation Helpers (BMP & JPEG)
// ---------------------------------------------------------------------------

function createBmpBuffer(width, height, r, g, b) {
    const padding = (4 - ((width * 3) % 4)) % 4;
    const rowSize = width * 3 + padding;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    view.setUint16(0, 0x4D42, false); // "BM"
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true);
    view.setUint32(10, 54, true);

    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true);
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    const bytes = new Uint8Array(buffer);
    let offset = 54;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            bytes[offset++] = b;
            bytes[offset++] = g;
            bytes[offset++] = r;
        }
        for (let p = 0; p < padding; p++) {
            bytes[offset++] = 0;
        }
    }

    return buffer;
}

async function renderCanvasToJpeg(canvasOrSource, width, height, quality = 0.92) {
    let canvas = null;

    if (canvasOrSource instanceof HTMLCanvasElement && canvasOrSource.width === width && canvasOrSource.height === height) {
        canvas = canvasOrSource;
    } else if (typeof OffscreenCanvas !== "undefined" && canvasOrSource instanceof OffscreenCanvas && canvasOrSource.width === width && canvasOrSource.height === height) {
        canvas = canvasOrSource;
    } else {
        if (typeof OffscreenCanvas !== "undefined") {
            canvas = new OffscreenCanvas(width, height);
        } else if (typeof document !== "undefined") {
            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
        }

        if (!canvas) return null;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        if (canvasOrSource instanceof HTMLCanvasElement || canvasOrSource instanceof OffscreenCanvas || (typeof ImageBitmap !== "undefined" && canvasOrSource instanceof ImageBitmap)) {
            ctx.drawImage(canvasOrSource, 0, 0, width, height);
        }
    }

    const q = Math.max(0.1, Math.min(1.0, quality || 0.92));

    if (canvas.convertToBlob) {
        const blob = await canvas.convertToBlob({ "type": "image/jpeg", "quality": q });
        return await blob.arrayBuffer();
    }

    if (canvas.toBlob) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", q));
        if (blob) {
            return await blob.arrayBuffer();
        }
    }

    if (canvas.toDataURL) {
        const dataUrl = canvas.toDataURL("image/jpeg", q);
        const base64 = dataUrl.split(",")[1];
        if (base64) {
            const binaryStr = atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            return bytes.buffer;
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Input Event Handling
// ---------------------------------------------------------------------------

function handleInputReport(evt) {
    if (!nativeDriverInstance || !activeDeviceInfo || !evt) return;

    const reportId = evt.reportId;
    const bytes = new Uint8Array(evt.data);

    // Stream Deck Plus Dials & Touchscreen events
    if (activeDeviceInfo.hasDials && (reportId === 0x03 || (reportId === 0x00 && bytes[0] === 0x03))) {
        const offset = (reportId === 0x03) ? 0 : 1;
        const subCmd = bytes[offset];

        if (subCmd === 0x01) {
            const dialIndex = bytes[offset + 1];
            const dialValue = bytes[offset + 2] === 0x01 ? 1 : -1;
            const isPressed = bytes[offset + 3] === 1;

            outDialIndex.set(dialIndex);
            outDialValue.set(dialValue);
            outDialPressed.set(isPressed);
            outDialEvent.trigger();

            if (connectionApi) connectionApi.emit("dial", { dialIndex, dialValue, isPressed });
            return;
        } else if (subCmd === 0x02) {
            const touchX = (bytes[offset + 2] | (bytes[offset + 3] << 8));
            const touchY = (bytes[offset + 4] | (bytes[offset + 5] << 8));
            const touchType = bytes[offset + 1];

            const tData = { touchX, touchY, touchType };
            outTouchpadData.set(tData);
            outTouchpadEvent.trigger();

            if (connectionApi) connectionApi.emit("touchpad", tData);
            return;
        }
    }

    // Standard Key Press / Release Reports
    const keyCount = activeDeviceInfo.keyCount || 15;
    const headerOffset = activeDeviceInfo.isVersionTwo ? 4 : 1;

    if (bytes.length < headerOffset + keyCount) return;

    for (let i = 0; i < keyCount; i++) {
        const isPressed = bytes[headerOffset + i] === 1;
        const userKey = getUserKeyIndex(activeDeviceInfo.productId, i);

        if (userKey >= 0 && userKey < buttonStates.length) {
            if (isPressed !== buttonStates[userKey]) {
                buttonStates[userKey] = isPressed;

                outEventKeyIndex.set(userKey);
                outEventPressed.set(isPressed);
                outKeyEvent.trigger();

                if (connectionApi) {
                    connectionApi.emit("key", { keyIndex: userKey, pressed: isPressed });
                }
            }
        }
    }
}

function createConnectionApi(driver, info) {
    const listeners = {};

    const api = {
        driver,
        info,
        key_width: info.iconSize || 72,
        key_height: info.iconSize || 72,
        cols: info.cols || 5,
        rows: info.rows || 3,
        get keyCount() { return info.keyCount || 0; },
        get iconSize() { return info.iconSize || 72; },
        get isConnected() { return isConnected; },

        on(event, cb) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        },

        off(event, cb) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter((fn) => fn !== cb);
        },

        emit(event, data) {
            if (listeners[event]) {
                listeners[event].forEach((cb) => {
                    try { cb(data); } catch (e) { op.logError(e); }
                });
            }
        },

        send(action, params) {
            if (!driver || !isConnected) return;
            try {
                if (action === "set_key_image") {
                    let buf;
                    if (typeof Buffer !== "undefined" && typeof params.image === "string") {
                        buf = Buffer.from(params.image, "base64");
                    } else if (typeof atob === "function" && typeof params.image === "string") {
                        const bin = atob(params.image);
                        buf = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
                    } else {
                        buf = params.image;
                    }
                    sendImagePayload(driver, info, params.key, buf);
                } else if (action === "set_stretched_image") {
                    let imgSource = params.image;
                    if (typeof imgSource === "string") {
                        const img = new Image();
                        img.onload = () => {
                            this.fillStretchedImage(img, params.quality || 0.88);
                        };
                        img.src = imgSource.startsWith("data:") ? imgSource : "data:image/jpeg;base64," + imgSource;
                    } else {
                        this.fillStretchedImage(imgSource, params.quality || 0.88);
                    }
                } else if (action === "set_brightness") {
                    setDeviceBrightness(driver, info, params.brightness);
                }
            } catch (e) {
                op.logError("[MacOs.Hid.StreamDeck] Send error: " + e.message);
            }
        },

        async setBrightness(percent) {
            setDeviceBrightness(driver, info, percent);
        },

        async fillKeyColor(keyIndex, r, g, b) {
            if (info.imageFormat === "bmp") {
                const bmp = createBmpBuffer(info.iconSize, info.iconSize, r, g, b);
                await sendImagePayload(driver, info, keyIndex, bmp);
            } else {
                const c = (typeof OffscreenCanvas !== "undefined") ? new OffscreenCanvas(info.iconSize, info.iconSize) : document.createElement("canvas");
                c.width = info.iconSize;
                c.height = info.iconSize;
                const ctx = c.getContext("2d");
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(0, 0, info.iconSize, info.iconSize);
                const jpeg = await renderCanvasToJpeg(c, info.iconSize, info.iconSize);
                if (jpeg) await sendImagePayload(driver, info, keyIndex, jpeg);
            }
        },

        async fillKeyImage(keyIndex, canvasOrSource, quality = 0.92) {
            if (info.imageFormat === "bmp") {
                const bmp = createBmpBuffer(info.iconSize, info.iconSize, 0, 0, 0);
                await sendImagePayload(driver, info, keyIndex, bmp);
            } else {
                const jpeg = await renderCanvasToJpeg(canvasOrSource, info.iconSize, info.iconSize, quality);
                if (jpeg) await sendImagePayload(driver, info, keyIndex, jpeg);
            }
        },

        async fillStretchedImage(canvasOrSource, quality = 0.92) {
            const cols = info.cols || 5;
            const rows = info.rows || 3;
            const kw = info.iconSize || 72;
            const kh = info.iconSize || 72;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const keyIndex = row * cols + col;
                    const tileCanvas = (typeof OffscreenCanvas !== "undefined") ? new OffscreenCanvas(kw, kh) : document.createElement("canvas");
                    tileCanvas.width = kw;
                    tileCanvas.height = kh;
                    const ctx = tileCanvas.getContext("2d");
                    ctx.drawImage(canvasOrSource, col * kw, row * kh, kw, kh, 0, 0, kw, kh);

                    if (info.imageFormat === "bmp") {
                        const bmp = createBmpBuffer(kw, kh, 0, 0, 0);
                        await sendImagePayload(driver, info, keyIndex, bmp);
                    } else {
                        const jpeg = await renderCanvasToJpeg(tileCanvas, kw, kh, quality);
                        if (jpeg) await sendImagePayload(driver, info, keyIndex, jpeg);
                    }
                }
            }
        },

        async clearKey(keyIndex) {
            await this.fillKeyColor(keyIndex, 0, 0, 0);
        },

        async clearAllKeys() {
            for (let i = 0; i < (info.keyCount || 0); i++) {
                await this.clearKey(i);
            }
        },

        async reset() {
            resetDevice(driver, info);
        }
    };

    return api;
}

async function connectDevice() {
    if (isConnecting || isConnected) return;

    isConnecting = true;
    outStatus.set("Searching for Devices...");

    const nModule = loadNativeAddon();
    if (!nModule || !nModule.StreamDeckHID) {
        outStatus.set("Native IOHID Driver Not Loaded");
        isConnecting = false;
        return;
    }

    try {
        if (!nativeDriverInstance) {
            nativeDriverInstance = new nModule.StreamDeckHID();
        }

        const devices = nativeDriverInstance.getDevices() || [];
        if (devices.length === 0) {
            outStatus.set("No Stream Deck Connected");
            outIsConnected.set(false);
            isConnecting = false;
            return;
        }

        const targetIdx = Math.max(0, Math.min(inDeviceIndex.get(), devices.length - 1));
        const targetDev = devices[targetIdx];

        const opened = await nativeDriverInstance.open(targetIdx);
        if (!opened) {
            outStatus.set("Failed to Open Device (" + targetDev.productName + ")");
            outIsConnected.set(false);
            isConnecting = false;
            return;
        }

        activeDeviceInfo = getDeviceInfo(targetDev.productId);
        buttonStates = new Array(activeDeviceInfo.keyCount || 15).fill(false);

        nativeDriverInstance.setInputReportCallback((evt) => {
            handleInputReport(evt);
        });

        connectionApi = createConnectionApi(nativeDriverInstance, activeDeviceInfo);
        outConnection.set(connectionApi);
        outDeviceInfo.set(activeDeviceInfo);
        isConnected = true;
        outIsConnected.set(true);

        const statusMsg = `Connected: ${activeDeviceInfo.name} (${targetDev.productName || "Elgato"})`;
        outStatus.set(statusMsg);
        op.log("[MacOs.Hid.StreamDeck] " + statusMsg);

        setDeviceBrightness(nativeDriverInstance, activeDeviceInfo, inBrightness.get());
    } catch (err) {
        op.logError("[MacOs.Hid.StreamDeck] Connection error: " + err.message);
        outStatus.set("Error: " + err.message);
        disconnectDevice();
    } finally {
        isConnecting = false;
    }
}

function disconnectDevice() {
    if (nativeDriverInstance) {
        try {
            nativeDriverInstance.close();
        } catch (e) {}
        nativeDriverInstance = null;
    }

    activeDeviceInfo = null;
    isConnected = false;
    connectionApi = null;
    buttonStates = [];

    outConnection.set(null);
    outDeviceInfo.set(null);
    outIsConnected.set(false);
    outStatus.set("Disconnected");
}

// ---------------------------------------------------------------------------
// Port Listeners
// ---------------------------------------------------------------------------

inActive.onChange = () => {
    if (inActive.get()) {
        connectDevice();
    } else {
        disconnectDevice();
    }
};

inDeviceIndex.onChange = () => {
    if (inActive.get()) {
        disconnectDevice();
        connectDevice();
    }
};

inBrightness.onChange = () => {
    if (nativeDriverInstance && activeDeviceInfo) {
        setDeviceBrightness(nativeDriverInstance, activeDeviceInfo, inBrightness.get());
    }
};

inClearKeys.onTriggered = () => {
    if (connectionApi) {
        connectionApi.clearAllKeys();
    }
};

op.onDelete = () => {
    disconnectDevice();
};

// Initial startup (non-blocking)
if (inActive.get()) {
    setTimeout(() => {
        if (inActive.get() && !isConnected) {
            connectDevice();
        }
    }, 150);
}
