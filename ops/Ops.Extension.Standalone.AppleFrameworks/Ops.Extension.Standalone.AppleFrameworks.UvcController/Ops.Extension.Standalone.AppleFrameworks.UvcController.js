const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inCameraTarget = op.inValueSelect("UVC Camera Target", ["No Cameras Discovered"]),
    inPollRate = op.inValue("Poll Rate Per Second", 1),
    inCommand = op.inString("Camera Control Command", ""),
    inTrigger = op.inTrigger("Trigger Update"),
    
    outTrigger = op.outTrigger("Trigger Out"),
    outResult = op.outObject("Result Object"),
    outProperties = op.outObject("Properties Object"),
    outPan = op.outNumber("Pan"),
    outTilt = op.outNumber("Tilt"),
    outZoom = op.outNumber("Zoom"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let addon = null;
let initialized = false;
let availableDevices = [];
let pollingTimer = null;
let activeDeviceIndex = -1;

function initAddon() {
    if (addon) return true;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/uvc_controller.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    } else {
        const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
        addonPath = path.join(prefix, addonPath);
    }

    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[UvcController] Native addon not found at: " + addonPath);
        return false;
    }
    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[UvcController] Failed to load native addon: " + e.message);
        return false;
    }
}

function ensureInitialized() {
    if (initialized) return true;
    if (!initAddon()) return false;
    
    try {
        discoverDevices();
        initialized = true;
        return true;
    } catch (e) {
        op.logError("[UvcController] Initialization error: " + e.message);
        return false;
    }
}

function discoverDevices() {
    if (!addon) return;
    try {
        const list = addon.listDevices() || [];
        availableDevices = list;
        const names = list.map(d => d.name);
        
        if (names.length === 0) {
            inCameraTarget.setUiAttribs({ "values": ["No Cameras Discovered"] });
            inCameraTarget.set("No Cameras Discovered");
        } else {
            inCameraTarget.setUiAttribs({ "values": names });
            if (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "No Cameras Discovered") {
                inCameraTarget.set(names[0]);
            }
        }
    } catch (e) {
        op.logError("[UvcController] Failed to scan UVC devices: " + e.message);
    }
}

function executePoll() {
    if (!addon || activeDeviceIndex === -1) return;
    
    try {
        const data = addon.getControls() || [];
        outResult.set(data);
        
        const props = {};
        data.forEach(ctrl => {
            const name = ctrl.name || "";
            if (name) {
                props[name] = ctrl['current-value'];
            }
            
            const nameLower = name.toLowerCase();
            if (nameLower.includes("pan") || nameLower.includes("tilt")) {
                if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null) {
                    if (ctrl['current-value'].pan !== undefined) outPan.set(ctrl['current-value'].pan);
                    if (ctrl['current-value'].tilt !== undefined) outTilt.set(ctrl['current-value'].tilt);
                } else if (nameLower === "pan") {
                    outPan.set(ctrl['current-value']);
                } else if (nameLower === "tilt") {
                    outTilt.set(ctrl['current-value']);
                }
            }
            
            if (nameLower.includes("zoom")) {
                if (typeof ctrl['current-value'] === 'number') {
                    outZoom.set(ctrl['current-value']);
                } else if (typeof ctrl['current-value'] === 'object' && ctrl['current-value'] !== null && ctrl['current-value'].zoom !== undefined) {
                    outZoom.set(ctrl['current-value'].zoom);
                }
            }
        });
        
        outProperties.set(props);
        outTrigger.trigger();
    } catch (e) {
        op.logWarn("[UvcController] Polling error: " + e.message);
    }
}

function startPolling() {
    stopPolling();
    
    const rate = parseFloat(inPollRate.get()) || 1;
    if (rate <= 0) return;
    
    const intervalMs = Math.max(33, Math.round(1000 / rate));
    pollingTimer = setInterval(executePoll, intervalMs);
}

function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

function configureConnection() {
    if (!ensureInitialized()) return;
    
    if (!inActive.get()) {
        stopPolling();
        if (activeDeviceIndex !== -1) {
            addon.closeDevice();
            activeDeviceIndex = -1;
        }
        outRunning.set(false);
        outStatus.set("Stopped");
        return;
    }
    
    const selectedName = inCameraTarget.get();
    const found = availableDevices.find(d => d.name === selectedName);
    
    if (!found) {
        stopPolling();
        outRunning.set(false);
        outStatus.set("Target Not Found");
        return;
    }
    
    const targetIndex = found.index;
    if (activeDeviceIndex !== targetIndex) {
        if (activeDeviceIndex !== -1) {
            addon.closeDevice();
        }
        const opened = addon.openDevice(targetIndex);
        if (opened) {
            activeDeviceIndex = targetIndex;
            outRunning.set(true);
            outStatus.set("Connected to " + selectedName);
        } else {
            activeDeviceIndex = -1;
            outRunning.set(false);
            outStatus.set("Connection Failed");
            stopPolling();
            return;
        }
    }
    
    startPolling();
}

inActive.onChange = configureConnection;
inCameraTarget.onChange = configureConnection;
inPollRate.onChange = () => {
    if (inActive.get()) {
        startPolling();
    }
};

inTrigger.onTriggered = () => {
    if (!ensureInitialized() || activeDeviceIndex === -1) {
        op.logWarn("[UvcController] Cannot send command: Device not connected.");
        return;
    }
    
    try {
        const cmd = JSON.parse(inCommand.get());
        if (!cmd || !cmd.action) {
            op.logWarn("[UvcController] Invalid command format (must specify action).");
            return;
        }
        
        const action = cmd.action;
        if (action === "get_controls") {
            const data = addon.getControls();
            outResult.set(data);
            outTrigger.trigger();
        } else if (action === "get_value") {
            const control = cmd.control;
            if (!control) {
                op.logWarn("[UvcController] Missing 'control' parameter for get_value command.");
                return;
            }
            const val = addon.getValue(control);
            outResult.set({ "control": control, "value": val });
            outTrigger.trigger();
        } else if (action === "set_value") {
            const control = cmd.control;
            const val = cmd.value;
            if (!control || val === undefined) {
                op.logWarn("[UvcController] Missing 'control' or 'value' parameter for set_value command.");
                return;
            }
            const success = addon.setValue(control, val);
            outResult.set({ "control": control, "status": success ? "success" : "error" });
            outTrigger.trigger();
            
            // Instantly poll after writing to update pins immediately
            executePoll();
        } else {
            op.logWarn("[UvcController] Unsupported command action: " + action);
        }
    } catch (e) {
        op.logWarn("[UvcController] Failed to execute JSON command: " + e.message);
    }
};

op.onDelete = () => {
    stopPolling();
    if (addon && activeDeviceIndex !== -1) {
        try {
            addon.closeDevice();
        } catch (e) {}
    }
};

// Initialize
setTimeout(() => {
    ensureInitialized();
    configureConnection();
}, 100);
