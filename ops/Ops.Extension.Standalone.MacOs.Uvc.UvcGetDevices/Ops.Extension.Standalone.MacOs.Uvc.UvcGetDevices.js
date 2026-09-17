/**
 * Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices
 * 
 * Queries available UVC video capture devices and webcams on macOS via direct memory access (N-API native addon).
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", false),
    inRefresh = op.inTriggerButton("Refresh Devices"),
    
    outDevices = op.outObject("Devices"),
    outDeviceNames = op.outObject("Device Names"),
    outTrigger = op.outTrigger("Trigger Out"),
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inActive, inRefresh]);
op.setPortGroup("Status", [outStatus, outRunning, outTrigger]);
op.setPortGroup("Devices", [outDevices, outDeviceNames]);

let addon = null;

function getAddonPath() {
    const relative = "ops/Ops.Extension.Standalone.MacOs.Uvc.UvcGetDevices/uvc_get_devices.node";
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
        op.logError("[MacOs.Uvc.UvcGetDevices] Native addon not found at: " + addonPath);
        return false;
    }

    try {
        addon = op.require(addonPath);
        return true;
    } catch (e) {
        outStatus.set("Load Error");
        op.logError("[MacOs.Uvc.UvcGetDevices] Failed to load native addon: " + e.message);
        return false;
    }
}

function queryDevices() {
    if (!initAddon()) return;

    try {
        const devs = addon.listDevices();
        const devList = Array.isArray(devs) ? devs : [];
        outDevices.set(devList);

        const names = devList.map((d) => d.name || `Device ${d.index}`);
        outDeviceNames.set(names);

        outRunning.set(true);
        outStatus.set(`Found ${devList.length} device(s)`);
        outTrigger.trigger();
    } catch (e) {
        outStatus.set("Query Error: " + e.message);
        op.logError("[MacOs.Uvc.UvcGetDevices] Error querying devices: " + e.message);
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        queryDevices();
    } else {
        outRunning.set(false);
        outStatus.set("Stopped");
    }
};

inRefresh.onTriggered = () => {
    queryDevices();
};

setTimeout(() => {
    if (inActive.get()) {
        queryDevices();
    }
}, 200);
