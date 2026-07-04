/**
 * Ops.Extension.Standalone.AppleFrameworks.StreamDeck
 * 
 * Interfacing natively with Elgato Stream Deck devices using compiled macOS N-API addon.
 */
const fs = op.require("fs");
const path = op.require("path");

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    
    outConnection = op.outObject("Connection"),
    outIsConnected = op.outBool("Is Connected", false),
    outStatus = op.outString("Status", "Stopped"),
    outDeviceInfo = op.outObject("Device Info"),
    
    outKeyEvent = op.outTrigger("Key Event"),
    outEventKeyIndex = op.outNumber("Event Key Index", 0),
    outEventPressed = op.outBool("Event Pressed", false);

op.setPortGroup("Controls", [inActive]);
op.setPortGroup("Settings", [inDeviceIndex]);

let addon = null;
let isConnected = false;

outConnection.set(null);
outDeviceInfo.set(null);

function getAddonPath() {
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    let addonPath = prefix + "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.StreamDeck/stream_deck.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    }
    return addonPath;
}

function initAddon() {
    if (addon) return true;
    
    const resolvedPath = getAddonPath();
    if (!fs.existsSync(resolvedPath)) {
        op.logError("[AppleFrameworks.StreamDeck] Native addon binary not found at: " + resolvedPath);
        outStatus.set("Binary Not Found");
        return false;
    }
    
    try {
        addon = op.require(resolvedPath);
        addon.init();
        return true;
    } catch (e) {
        op.logError("[AppleFrameworks.StreamDeck] Failed to load or initialize native addon: " + String(e));
        outStatus.set("Initialization Error");
        return false;
    }
}

function disconnectDevice() {
    if (addon && isConnected) {
        try {
            addon.disconnect();
        } catch (e) {
            op.logWarn("[AppleFrameworks.StreamDeck] Error disconnecting: " + e);
        }
    }
    isConnected = false;
    outIsConnected.set(false);
    outConnection.set(null);
    outDeviceInfo.set(null);
}

function connectDevice() {
    disconnectDevice();
    if (!inActive.get()) return;
    
    if (!initAddon()) return;
    
    try {
        const devices = addon.enumerateDevices();
        const index = inDeviceIndex.get();
        
        if (devices.length === 0) {
            outStatus.set("No devices found");
            return;
        }
        
        if (index < 0 || index >= devices.length) {
            outStatus.set("Device index out of range");
            return;
        }
        
        const deviceMeta = devices[index];
        outStatus.set("Connecting...");
        
        const info = addon.connect(index, (event) => {
            outEventKeyIndex.set(event.key);
            outEventPressed.set(event.pressed);
            outKeyEvent.trigger();
        });
        
        isConnected = true;
        outIsConnected.set(true);
        outStatus.set("Connected to " + info.model);
        
        // Expose connection bridge object
        const connectionObj = {
            key_width: info.keyWidth || 72,
            key_height: info.keyHeight || 72,
            cols: info.cols || 5,
            rows: info.rows || 3,
            send(action, params) {
                if (!addon || !isConnected) return;
                try {
                    if (action === "set_key_image") {
                        const buf = Buffer.from(params.image, "base64");
                        addon.setKeyImage(params.key, buf);
                    } else if (action === "set_stretched_image") {
                        const buf = Buffer.from(params.image, "base64");
                        addon.setStretchedImage(buf);
                    } else if (action === "set_brightness") {
                        addon.setBrightness(params.brightness);
                    }
                } catch (e) {
                    op.logError("[AppleFrameworks.StreamDeck] Send action error: " + e);
                }
            }
        };
        
        outConnection.set(connectionObj);
        outDeviceInfo.set(deviceMeta);
        op.log(`[AppleFrameworks.StreamDeck] Successfully claimed and connected to ${info.model}`);
        
    } catch (e) {
        op.logError("[AppleFrameworks.StreamDeck] Connection failed: " + String(e));
        outStatus.set("Connection Failed");
        disconnectDevice();
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

op.onDelete = () => {
    disconnectDevice();
};
