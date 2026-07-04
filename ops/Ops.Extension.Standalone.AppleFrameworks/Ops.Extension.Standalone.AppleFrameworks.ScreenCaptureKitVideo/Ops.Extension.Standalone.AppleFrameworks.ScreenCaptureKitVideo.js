/**
 * Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo
 * 
 * High-performance macOS screen/window capture using ScreenCaptureKit N-API binary.
 */
const fs = op.require("fs");
const path = op.require("path");

const
    inRender = op.inTrigger("Render"),
    inActive = op.inBool("Active", false),
    inType = op.inString("Capture Type", "Screen Capture"),
    inSource = op.inString("Source", "None"),
    inWidth = op.inInt("Output Width", 1280),
    inHeight = op.inInt("Output Height", 720),
    inRefresh = op.inTriggerButton("Refresh"),
    
    outTex = op.outTexture("Texture"),
    outNext = op.outTrigger("Next"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outStatus = op.outString("Status", "Stopped");

op.setPortGroup("Controls", [inRender, inActive, inRefresh]);
op.setPortGroup("Source Settings", [inType, inSource]);
op.setPortGroup("Resolution Settings", [inWidth, inHeight]);

inType.setUiAttribs({ "display": "dropdown", "values": ["Screen Capture", "Window Capture"] });
inSource.setUiAttribs({ "display": "dropdown", "values": ["None"] });

let addon = null;
let texture = null;
let isCapturing = false;

// Shareable source mapping lists
let screens = [];
let windows = [];
let sourceNames = [];
let sourceMap = {}; // mapping of dropdown index or label to target item
function getAddonPath() {
    const dir = (typeof __dirname !== "undefined") ? __dirname : ".";
    const localPath = path.join(dir, "screen_capture.node");
    if (fs.existsSync(localPath)) return localPath;

    let addonPath = "ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo/screen_capture.node";
    if (op.patch && typeof op.patch.filePath === "function") {
        addonPath = op.patch.filePath(addonPath);
    }
    return addonPath;
}

function initAddon() {
    if (addon) return true;
    
    const resolvedPath = getAddonPath();
    if (!fs.existsSync(resolvedPath)) {
        op.logError("[ScreenCaptureKitVideo] Native addon binary not found at: " + resolvedPath);
        outStatus.set("Binary Not Found");
        return false;
    }
    
    try {
        addon = op.require(resolvedPath);
        return true;
    } catch (e) {
        op.logError("[ScreenCaptureKitVideo] Failed to load native addon: " + String(e));
        outStatus.set("Initialization Error");
        return false;
    }
}

function refreshSources() {
    if (!initAddon()) return;
    
    outStatus.set("Querying shareable content...");
    
    addon.getShareableContent((err, content) => {
        if (err || !content) {
            op.logError("[ScreenCaptureKitVideo] Failed to query shareable content: " + String(err));
            outStatus.set("Query Failed");
            return;
        }
        
        screens = content.displays || [];
        windows = content.windows || [];
        
        sourceNames = ["None"];
        sourceMap = {};
        
        const type = inType.get();
        if (type === "Screen Capture") {
            screens.forEach((scr, idx) => {
                const label = `${scr.name} (${scr.width}x${scr.height})`;
                sourceNames.push(label);
                sourceMap[label] = { type: "screen", id: scr.id };
            });
        } else {
            windows.forEach((win, idx) => {
                const label = `${win.appName} - ${win.title.substring(0, 40)} (${win.id})`;
                sourceNames.push(label);
                sourceMap[label] = { type: "window", id: win.id };
            });
        }
        
        inSource.setUiAttribs({ "values": sourceNames });
        outStatus.set(isCapturing ? "Capturing" : "Sources Updated");
    });
}

function stopCapture() {
    if (addon && isCapturing) {
        try {
            addon.stopCapture();
        } catch (e) {
            op.logWarn("[ScreenCaptureKitVideo] Error stopping capture: " + e);
        }
    }
    isCapturing = false;
    outStatus.set("Stopped");
}

function startCapture() {
    stopCapture();
    
    if (!inActive.get()) return;
    if (!initAddon()) return;
    
    const sourceLabel = inSource.get();
    if (sourceLabel === "None" || !sourceMap[sourceLabel]) {
        outStatus.set("Select a valid source");
        return;
    }
    
    const target = sourceMap[sourceLabel];
    const width = Math.max(16, Math.min(4096, inWidth.get()));
    const height = Math.max(16, Math.min(4096, inHeight.get()));
    
    outStatus.set("Starting stream...");
    
    try {
        addon.startCapture({
            type: target.type,
            id: target.id,
            width: width,
            height: height
        }, () => {
            // New frame notification callback. We pull the frame inside Render trigger.
        });
        
        isCapturing = true;
        outStatus.set("Capturing");
    } catch (e) {
        op.logError("[ScreenCaptureKitVideo] Failed to start capture: " + e);
        outStatus.set("Capture Start Failed");
        stopCapture();
    }
}

inRender.onTriggered = () => {
    outNext.trigger();
    
    if (!isCapturing || !addon) return;
    
    try {
        const frame = addon.getLatestFrame();
        if (!frame || !frame.buffer) return;
        
        const w = frame.width;
        const h = frame.height;
        
        if (w <= 0 || h <= 0) return;
        
        // Initialize or update texture
        if (!texture || texture.width !== w || texture.height !== h) {
            if (texture) texture.dispose();
            
            texture = new CGL.Texture(op.patch.cgl, {
                width: w,
                height: h,
                filter: CGL.Texture.FILTER_LINEAR,
            });
            outTex.set(texture);
        }
        
        outWidth.set(w);
        outHeight.set(h);
        
        // Upload pixels to the texture
        const gl = op.patch.cgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture.tex);
        
        const data = frame.buffer instanceof Uint8Array ? frame.buffer : new Uint8Array(frame.buffer);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            w,
            h,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            data
        );
        
    } catch (e) {
        op.logError("[ScreenCaptureKitVideo] Frame upload failed: " + e);
    }
};

inActive.onChange = () => {
    if (inActive.get()) {
        startCapture();
    } else {
        stopCapture();
    }
};

inType.onChange = () => {
    refreshSources();
    stopCapture();
    inSource.set("None");
};

inSource.onChange = () => {
    if (inActive.get()) {
        startCapture();
    }
};

inWidth.onChange = () => {
    if (inActive.get()) {
        startCapture();
    }
};

inHeight.onChange = () => {
    if (inActive.get()) {
        startCapture();
    }
};

inRefresh.onTriggered = () => {
    refreshSources();
};

op.onDelete = () => {
    stopCapture();
    if (texture) {
        texture.dispose();
        texture = null;
    }
};

// Initial query on startup
setTimeout(() => {
    refreshSources();
}, 500);
