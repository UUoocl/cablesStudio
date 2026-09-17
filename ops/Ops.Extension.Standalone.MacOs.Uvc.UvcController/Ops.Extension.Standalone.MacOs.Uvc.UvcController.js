/**
 * Ops.Extension.Standalone.MacOs.Uvc.UvcController
 * 
 * Controls UVC PTZ cameras (pan, tilt, zoom, focus, exposure, white balance) on macOS via direct memory access (N-API native addon).
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", true),
    inCameraTarget = op.inString("UVC Camera Target", "default"),
    inPollRate = op.inValue("Poll Rate Per Second", 30),
    inNormalize = op.inBool("Normalize", false),
    inCommand = op.inString("Camera Control Command", "{}"),
    inTrigger = op.inTriggerButton("Trigger Update"),
    
    outTrigger = op.outTrigger("Trigger Out"),
    outResult = op.outObject("Result Object"),
    outProperties = op.outObject("Properties Object"),
    outPan = op.outNumber("Pan", 0),
    outTilt = op.outNumber("Tilt", 0),
    outZoom = op.outNumber("Zoom", 0),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inCameraTarget, inPollRate, inNormalize, inCommand, inTrigger]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger]);
op.setPortGroup("Telemetry", [outPan, outTilt, outZoom, outProperties, outResult]);

inCameraTarget.setUiAttribs({ "display": "dropdown", "values": ["default"] });

let addon = null;
let availableDevices = [];
let isDeviceOpen = false;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Uvc.UvcController/uvc_controller.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        return op.patch.filePath(relative);
    }
    const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
    return path.join(prefix, relative);
}

function initAddon() {
    if (addon) return true;

    const addonPath = getAddonPath();
    if (!fs.existsSync(addonPath)) {
        outStatus.set("Not Compiled");
        op.logError("[MacOs.Uvc.UvcController] Native addon not found at: " + addonPath);
        return false;
    }

    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Uvc.UvcController] Failed to load native addon: " + e.message);
        return false;
    }
}

function refreshDevices() {
    if (!initAddon()) return;

    try {
        const devices = addon.listDevices();
        availableDevices = Array.isArray(devices) ? devices : [];
        const names = availableDevices.map((d) => d.name || `Device ${d.index}`);
        if (names.length === 0) names.push("default");
        
        inCameraTarget.setUiAttribs({ "values": names });
        if (names.length > 0 && (!names.includes(inCameraTarget.get()) || inCameraTarget.get() === "default")) {
            inCameraTarget.set(names[0]);
        }
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Error querying devices: " + e.message);
    }
}

function stopController() {
    if (addon) {
        try {
            addon.stopPolling();
            addon.closeDevice();
        } catch (e) {}
    }
    isDeviceOpen = false;
    outRunning.set(false);
    outStatus.set("Stopped");
}

function startController() {
    if (!initAddon()) return;

    refreshDevices();

    const targetName = inCameraTarget.get();
    const dev = availableDevices.find((d) => d.name === targetName);
    const target = dev ? dev.index : (targetName === "default" ? 0 : targetName);

    try {
        const opened = addon.openDevice(target);
        if (!opened) {
            outStatus.set("Device Open Failed");
            outRunning.set(false);
            return;
        }

        isDeviceOpen = true;
        outRunning.set(true);
        outStatus.set(`Connected: ${targetName}`);

        const pollRate = Math.max(1, Math.min(120, inPollRate.get() || 30));
        const intervalMs = Math.round(1000 / pollRate);
        const normalize = inNormalize.get();

        addon.startPolling(handleTelemetryPayload, intervalMs, normalize);

    } catch (e) {
        outStatus.set("Error: " + e.message);
        outRunning.set(false);
        op.logError("[MacOs.Uvc.UvcController] Failed to start: " + e.message);
    }
}

function handleTelemetryPayload(jsonStr) {
    if (!jsonStr) return;

    try {
        const payload = JSON.parse(jsonStr);
        if (payload.type === "telemetry") {
            if (payload.properties) {
                outProperties.set(payload.properties);
            }
            if (payload.hasPan) {
                outPan.set(payload.pan);
            }
            if (payload.hasTilt) {
                outTilt.set(payload.tilt);
            }
            if (payload.hasZoom) {
                outZoom.set(payload.zoom);
            }
            outTrigger.trigger();
        }
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Error parsing telemetry payload: " + e.message);
    }
}

function applyConfiguration() {
    if (!inActive.get()) {
        stopController();
        return;
    }
    
    // Restart with updated device / polling settings
    startController();
}

inCameraTarget.onChange = () => {
    if (inActive.get()) applyConfiguration();
};

inPollRate.onChange = () => {
    if (inActive.get()) applyConfiguration();
};

inNormalize.onChange = () => {
    if (inActive.get()) applyConfiguration();
};

inActive.onChange = () => {
    if (inActive.get()) {
        startController();
    } else {
        stopController();
    }
};

inTrigger.onTriggered = () => {
    if (!initAddon()) return;
    if (!isDeviceOpen) {
        startController();
    }

    try {
        const cmdStr = inCommand.get();
        const resStr = addon.executeCommand(cmdStr);
        const resObj = JSON.parse(resStr);
        outResult.set(resObj);
        outTrigger.trigger();
    } catch (e) {
        op.logWarn("[MacOs.Uvc.UvcController] Invalid JSON command: " + e.message);
    }
};

op.onDelete = () => {
    stopController();
};

setTimeout(() => {
    if (inActive.get()) {
        startController();
    } else {
        refreshDevices();
    }
}, 200);
