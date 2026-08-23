/**
 * Ops.Extension.Standalone.MacOs.Syphon.SyphonOutPatchCanvas
 * 
 * Taps into Electron's macOS native view layer from the main/renderer bridge.
 * Extracts Chromium's composite CALayer backed by an Apple IOSurface with ZERO CPU copies,
 * binds it directly into Metal, and publishes it via the Syphon framework on Apple Silicon.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inActive = op.inBool("Active", true),
    inRender = op.inTrigger("Render"),
    inContinuous = op.inBool("Continuous DisplayLink", true),
    inServerName = op.inString("Server Name", "Cables Patch Canvas"),
    inCropToCanvas = op.inBool("Crop To Patch Canvas", true),
    inCustomCrop = op.inBool("Custom Crop", false),
    inCropX = op.inFloat("Crop X", 0),
    inCropY = op.inFloat("Crop Y", 0),
    inCropW = op.inFloat("Crop Width", 1920),
    inCropH = op.inFloat("Crop Height", 1080),

    outPublishing = op.outBool("Is Publishing", false),
    outStatus = op.outString("Status", "Initialized"),
    outWidth = op.outNumber("Surface Width", 0),
    outHeight = op.outNumber("Surface Height", 0),
    outFps = op.outNumber("FPS", 0),
    outSurfaceId = op.outNumber("IOSurface ID", 0),
    outHasClients = op.outBool("Has Clients", false);

op.setPortGroup("Controls", [inActive, inRender, inContinuous]);
op.setPortGroup("Syphon Configuration", [inServerName, inCropToCanvas, inCustomCrop]);
op.setPortGroup("Custom Crop Bounds", [inCropX, inCropY, inCropW, inCropH]);
op.setPortGroup("Telemetry", [outPublishing, outStatus, outWidth, outHeight, outFps, outSurfaceId, outHasClients]);

let nativeModule = null;
let serverInstance = null;
let cachedWindowHandle = null;
let statusInterval = null;

function checkIsMac() {
    try {
        const os = op.require("os");
        if (os && typeof os.platform === "function") {
            return os.platform() === "darwin";
        }
    } catch (e) {}

    if (typeof process !== "undefined" && process.platform) {
        return process.platform === "darwin";
    }

    if (typeof navigator !== "undefined") {
        return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
    }

    return true; // Default to true in standalone macOS environment
}

function loadNativeAddon() {
    if (!checkIsMac()) {
        outStatus.set("macOS Only");
        return null;
    }

    try {
        const addonRelPath = "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonOutPatchCanvas/build/Release/syphon_patch_canvas.node";
        
        const candidatePaths = [];

        if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
            candidatePaths.push(path.join(op.patch.config.prefixAssetPath, addonRelPath));
        }

        if (typeof __dirname !== "undefined" && __dirname) {
            candidatePaths.push(path.join(__dirname, "build/Release/syphon_patch_canvas.node"));
            candidatePaths.push(path.join(__dirname, "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonOutPatchCanvas/build/Release/syphon_patch_canvas.node"));
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
                op.log("[SyphonOutPatchCanvas] Loaded native syphon_patch_canvas module from: " + resolved);
                return nativeModule;
            }
        }

        op.logWarn("[SyphonOutPatchCanvas] Native addon binary not found. Checked: " + candidatePaths.join(", "));
        outStatus.set("Binary Not Found");
        return null;
    } catch (e) {
        op.logError("[SyphonOutPatchCanvas] Error loading native addon: " + String(e));
        outStatus.set("Addon Load Error");
        return null;
    }
}

function getNativeWindowHandle() {
    try {
        const electron = op.require("electron");
        if (!electron) return null;

        // Try BrowserWindow.getFocusedWindow()
        if (electron.BrowserWindow) {
            const win = (electron.BrowserWindow.getFocusedWindow && electron.BrowserWindow.getFocusedWindow()) ||
                        (electron.BrowserWindow.getAllWindows && electron.BrowserWindow.getAllWindows()[0]);
            if (win && typeof win.getNativeWindowHandle === "function") {
                return win.getNativeWindowHandle();
            }
        }

        // Try electron.remote
        if (electron.remote && electron.remote.getCurrentWindow) {
            const win = electron.remote.getCurrentWindow();
            if (win && typeof win.getNativeWindowHandle === "function") {
                return win.getNativeWindowHandle();
            }
        }
    } catch (e) {}

    return null;
}

function updateCropRegion() {
    if (!serverInstance) return;

    if (inCustomCrop.get()) {
        const x = inCropX.get() || 0;
        const y = inCropY.get() || 0;
        const w = inCropW.get() || 1920;
        const h = inCropH.get() || 1080;
        serverInstance.setCropRegion(x, y, w, h, true);
        return;
    }

    if (inCropToCanvas.get()) {
        const canvas = (op.patch && op.patch.cgl ? op.patch.cgl.canvas : null) || document.querySelector("canvas");
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Convert to physical backing store pixels in top-down screen coordinates
            const x = Math.max(0, Math.round(rect.left * dpr));
            const y = Math.max(0, Math.round(rect.top * dpr));
            const w = Math.round(rect.width * dpr);
            const h = Math.round(rect.height * dpr);

            if (w > 0 && h > 0) {
                if (inCropX.get() !== x) inCropX.set(x);
                if (inCropY.get() !== y) inCropY.set(y);
                if (inCropW.get() !== w) inCropW.set(w);
                if (inCropH.get() !== h) inCropH.set(h);
                serverInstance.setCropRegion(x, y, w, h, true);
                return;
            }
        }
    }

    // Full window mode
    serverInstance.setCropRegion(0, 0, 0, 0, false);
}

function startServer() {
    if (!nativeModule) {
        nativeModule = loadNativeAddon();
    }
    if (!nativeModule) return;

    stopServer();

    try {
        serverInstance = new nativeModule.SyphonPatchCanvasServer();
        cachedWindowHandle = getNativeWindowHandle();

        const name = inServerName.get() || "Cables Patch Canvas";
        const success = serverInstance.startServer(name, cachedWindowHandle);

        if (success) {
            updateCropRegion();

            if (inContinuous.get()) {
                serverInstance.startContinuousCapture();
            }

            outPublishing.set(true);
            outStatus.set("Running");

            if (!statusInterval) {
                statusInterval = setInterval(pollStatus, 500);
            }
        } else {
            outStatus.set("Start Failed");
        }
    } catch (e) {
        op.logError("[SyphonOutPatchCanvas] Exception starting server: " + String(e));
        outStatus.set("Error: " + e.message);
    }
}

function stopServer() {
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }

    if (serverInstance) {
        try {
            serverInstance.stopContinuousCapture();
            serverInstance.stopServer();
        } catch (e) {}
        serverInstance = null;
    }

    outPublishing.set(false);
    outStatus.set("Stopped");
    outFps.set(0);
    outHasClients.set(false);
}

function pollStatus() {
    if (!serverInstance) return;

    try {
        const st = serverInstance.getStatus();
        if (st) {
            if (outWidth.get() !== st.width) outWidth.set(st.width || 0);
            if (outHeight.get() !== st.height) outHeight.set(st.height || 0);
            const roundedFps = Math.round((st.fps || 0) * 10) / 10;
            if (outFps.get() !== roundedFps) outFps.set(roundedFps);
            if (outSurfaceId.get() !== st.surfaceId) outSurfaceId.set(st.surfaceId || 0);
            if (outHasClients.get() !== Boolean(st.hasClients)) outHasClients.set(Boolean(st.hasClients));

            if (st.isRunning) {
                const statusMsg = st.hasClients ? "Publishing (Active Client)" : "Broadcasting (Waiting for Client)";
                if (outStatus.get() !== statusMsg) outStatus.set(statusMsg);
                if (!outPublishing.get()) outPublishing.set(true);
            }
        }

        // Dynamically update canvas crop rect in case editor layout or canvas resized
        if (inCropToCanvas.get() && !inCustomCrop.get()) {
            updateCropRegion();
        }
    } catch (e) {}
}

inActive.onChange = () => {
    if (inActive.get()) {
        startServer();
    } else {
        stopServer();
    }
};

inContinuous.onChange = () => {
    if (!serverInstance) return;
    if (inContinuous.get()) {
        serverInstance.startContinuousCapture();
    } else {
        serverInstance.stopContinuousCapture();
    }
};

inServerName.onChange = () => {
    if (serverInstance) {
        serverInstance.setServerName(inServerName.get() || "Cables Patch Canvas");
    }
};

inCropToCanvas.onChange = updateCropRegion;
inCustomCrop.onChange = updateCropRegion;
inCropX.onChange = updateCropRegion;
inCropY.onChange = updateCropRegion;
inCropW.onChange = updateCropRegion;
inCropH.onChange = updateCropRegion;

inRender.onTriggered = () => {
    if (!serverInstance || !inActive.get()) return;

    // In triggered mode (non-continuous), publish on demand
    if (!inContinuous.get()) {
        if (!cachedWindowHandle) cachedWindowHandle = getNativeWindowHandle();
        serverInstance.publishFrame(cachedWindowHandle);
    }
};

op.onDelete = () => {
    stopServer();
};

// Start if active
if (inActive.get()) {
    startServer();
}
