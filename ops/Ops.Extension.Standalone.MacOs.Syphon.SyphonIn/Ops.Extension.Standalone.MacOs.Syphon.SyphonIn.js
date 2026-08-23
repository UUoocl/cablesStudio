/**
 * Ops.Extension.Standalone.MacOs.Syphon.SyphonIn
 * 
 * Auto-discovers and receives video streams from any active macOS Syphon server
 * (OBS, Resolume, MadMapper, TouchDesigner, Millumin, etc.) into a Cables WebGL texture
 * with zero-GC unified memory ingestion on Apple Silicon.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inRender = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inServer = op.inString("Server", ""),
    inRefresh = op.inTriggerButton("Refresh Servers"),
    inAutoConnect = op.inBool("Auto Connect", true),
    inSwapColor = op.inBool("Correct BGRA Colors", true),

    outTexture = op.outTexture("Texture"),
    outNewFrame = op.outTrigger("On Frame"),
    outServerList = op.outArray("Server List"),
    outWidth = op.outNumber("Width", 0),
    outHeight = op.outNumber("Height", 0),
    outFps = op.outNumber("FPS", 0),
    outStatus = op.outString("Status", "Initialized");

inServer.setUiAttribs({ "display": "dropdown", "values": ["No Active Servers"] });

op.setPortGroup("Controls", [inRender, inActive, inServer, inRefresh, inAutoConnect, inSwapColor]);
op.setPortGroup("Outputs", [outTexture, outNewFrame]);
op.setPortGroup("Telemetry", [outStatus, outWidth, outHeight, outFps, outServerList]);

let nativeModule = null;
let clientInstance = null;
let serverDiscoveryInterval = null;
let telemetryInterval = null;

let cglTex = null;
let sharedBuffer = null;
let lastWidth = 0;
let lastHeight = 0;
let knownServerTitles = [];

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

    return true;
}

function loadNativeAddon() {
    if (!checkIsMac()) {
        outStatus.set("macOS Only");
        return null;
    }

    try {
        const addonRelPath = "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonIn/build/Release/syphon_in_client.node";
        const candidatePaths = [];

        if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
            candidatePaths.push(path.join(op.patch.config.prefixAssetPath, addonRelPath));
        }

        if (typeof __dirname !== "undefined" && __dirname) {
            candidatePaths.push(path.join(__dirname, "build/Release/syphon_in_client.node"));
            candidatePaths.push(path.join(__dirname, "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonIn/build/Release/syphon_in_client.node"));
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
                op.log("[SyphonIn] Loaded native syphon_in_client module from: " + resolved);
                return nativeModule;
            }
        }

        op.logWarn("[SyphonIn] Native addon binary not found.");
        outStatus.set("Binary Not Found");
        return null;
    } catch (e) {
        op.logError("[SyphonIn] Error loading native addon: " + String(e));
        outStatus.set("Addon Load Error");
        return null;
    }
}

function refreshServers() {
    if (!clientInstance) return;

    try {
        const servers = clientInstance.getServers() || [];
        const titles = servers.map((s) => s.title || s.name || s.uuid);

        outServerList.set(titles);

        // Update dropdown if server list changed
        if (JSON.stringify(titles) !== JSON.stringify(knownServerTitles)) {
            knownServerTitles = titles;
            inServer.setUiAttribs({
                "values": titles.length > 0 ? titles : ["No Active Servers"]
            });

            // Auto-connect to first available server if none selected or auto-connect enabled
            if (inAutoConnect.get() && titles.length > 0) {
                const current = inServer.get();
                if (!current || !titles.includes(current)) {
                    inServer.set(titles[0]);
                }
            }
        }
    } catch (e) {}
}

function connectSelectedServer() {
    if (!clientInstance) return;

    const target = inServer.get();
    if (!target || target === "No Active Servers") {
        if (inAutoConnect.get()) {
            clientInstance.connect("first");
        }
        return;
    }

    try {
        const success = clientInstance.connect(target);
        if (success) {
            outStatus.set("Connected: " + target);
        } else {
            outStatus.set("Connecting...");
        }
    } catch (e) {
        op.logError("[SyphonIn] Error connecting to server: " + String(e));
        outStatus.set("Connection Error");
    }
}

function initTexture(width, height) {
    const cgl = op.patch && op.patch.cgl ? op.patch.cgl : null;
    const gl = cgl ? cgl.gl : null;
    if (!gl || !cgl) return;

    lastWidth = width;
    lastHeight = height;
    sharedBuffer = new Uint8Array(width * height * 4);

    if (!cglTex) {
        cglTex = new CGL.Texture(cgl, {
            "wrap": CGL.Texture.WRAP_CLAMP_TO_EDGE,
            "filter": CGL.Texture.FILTER_LINEAR,
            "unpackFlipY": false
        });
    }

    // Allocate initial WebGL texture storage
    cglTex.setSize(width, height);
    gl.bindTexture(gl.TEXTURE_2D, cglTex.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, sharedBuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);

    outTexture.set(cglTex);
}

function startClient() {
    if (!nativeModule) {
        nativeModule = loadNativeAddon();
    }
    if (!nativeModule) return;

    stopClient();

    try {
        clientInstance = new nativeModule.SyphonInClient();
        refreshServers();
        connectSelectedServer();

        if (!serverDiscoveryInterval) {
            serverDiscoveryInterval = setInterval(refreshServers, 1000);
        }
        if (!telemetryInterval) {
            telemetryInterval = setInterval(pollTelemetry, 500);
        }

        outStatus.set("Listening for Servers");
    } catch (e) {
        op.logError("[SyphonIn] Failed to initialize client: " + String(e));
        outStatus.set("Init Failed: " + e.message);
    }
}

function stopClient() {
    if (serverDiscoveryInterval) {
        clearInterval(serverDiscoveryInterval);
        serverDiscoveryInterval = null;
    }
    if (telemetryInterval) {
        clearInterval(telemetryInterval);
        telemetryInterval = null;
    }

    if (clientInstance) {
        try {
            clientInstance.disconnect();
        } catch (e) {}
        clientInstance = null;
    }

    if (cglTex) {
        try {
            cglTex.dispose();
        } catch (e) {}
        cglTex = null;
    }

    sharedBuffer = null;
    lastWidth = 0;
    lastHeight = 0;
    outTexture.set(null);
    outStatus.set("Stopped");
    outFps.set(0);
}

function pollTelemetry() {
    if (!clientInstance) return;

    try {
        const st = clientInstance.getStatus();
        if (st) {
            if (outWidth.get() !== st.width) outWidth.set(st.width || 0);
            if (outHeight.get() !== st.height) outHeight.set(st.height || 0);
            const roundedFps = Math.round((st.fps || 0) * 10) / 10;
            if (outFps.get() !== roundedFps) outFps.set(roundedFps);

            if (st.isConnected) {
                const sName = st.serverName || inServer.get() || "Connected";
                const msg = "Receiving: " + sName;
                if (outStatus.get() !== msg) outStatus.set(msg);
            }
        }
    } catch (e) {}
}

inActive.onChange = () => {
    if (inActive.get()) {
        startClient();
    } else {
        stopClient();
    }
};

inRefresh.onTriggered = () => {
    refreshServers();
};

inServer.onChange = () => {
    if (clientInstance && inActive.get()) {
        connectSelectedServer();
    }
};

function swapBgraInPlace(buffer, numPixels) {
    const u32 = new Uint32Array(buffer.buffer, buffer.byteOffset, numPixels);
    for (let i = 0; i < numPixels; i++) {
        const v = u32[i];
        u32[i] = (v & 0xFF00FF00) | ((v & 0x00FF0000) >> 16) | ((v & 0x000000FF) << 16);
    }
}

inRender.onTriggered = () => {
    if (!inActive.get() || !clientInstance) return;

    const cgl = op.patch && op.patch.cgl ? op.patch.cgl : null;
    const gl = cgl ? cgl.gl : null;
    if (!gl || !cgl) return;

    if (clientInstance.hasNewFrame()) {
        // Read into buffer (allocate initial buffer if not ready)
        if (!sharedBuffer) {
            initTexture(1920, 1080);
        }

        const swap = inSwapColor.get();
        const res = clientInstance.readFrame(sharedBuffer, swap);
        if (res && res.hasFrame) {
            const w = res.width;
            const h = res.height;

            if (w > 0 && h > 0) {
                if (!cglTex || lastWidth !== w || lastHeight !== h) {
                    initTexture(w, h);
                    clientInstance.readFrame(sharedBuffer, swap);
                }

                // If native addon didn't swizzle (e.g. cached older binary in memory) and swap is requested:
                if (swap && !res.isSwizzled) {
                    swapBgraInPlace(sharedBuffer, w * h);
                }

                // In-place fast texture upload with zero memory reallocation
                gl.bindTexture(gl.TEXTURE_2D, cglTex.tex);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, sharedBuffer);
                gl.bindTexture(gl.TEXTURE_2D, null);

                outTexture.set(cglTex);
                outNewFrame.trigger();
            }
        }
    }
};

op.onDelete = () => {
    stopClient();
};

// Initial startup
if (inActive.get()) {
    startClient();
}
