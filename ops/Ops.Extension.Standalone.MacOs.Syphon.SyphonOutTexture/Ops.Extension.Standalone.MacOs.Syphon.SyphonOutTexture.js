/**
 * Ops.Extension.Standalone.MacOs.Syphon.SyphonOutTexture
 * 
 * Publishes any intermediate WebGL texture from a Cables patch to a macOS Syphon server.
 * Uses an asynchronous WebGL2 Pixel Buffer Object (PBO) double-buffering pipeline
 * and native Apple Metal IOSurface sharing with ZERO render-thread stalls on Apple Silicon.
 */

const path = op.require("path");
const fs = op.require("fs");

const
    inRender = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    inActive = op.inBool("Active", true),
    inServerName = op.inString("Server Name", "Cables Texture Output"),

    outPublishing = op.outBool("Is Publishing", false),
    outStatus = op.outString("Status", "Initialized"),
    outWidth = op.outNumber("Width", 0),
    outHeight = op.outNumber("Height", 0),
    outFps = op.outNumber("FPS", 0),
    outHasClients = op.outBool("Has Clients", false),
    outSurfaceId = op.outNumber("IOSurface ID", 0);

op.setPortGroup("Controls", [inRender, inTexture, inActive]);
op.setPortGroup("Configuration", [inServerName]);
op.setPortGroup("Telemetry", [outPublishing, outStatus, outWidth, outHeight, outFps, outHasClients, outSurfaceId]);

let nativeModule = null;
let serverInstance = null;
let statusInterval = null;

let pbos = [];
let currentPboIndex = 0;
let sharedBuffer = null;
let lastWidth = 0;
let lastHeight = 0;
let fbo = null;

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
        const addonRelPath = "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonOutTexture/build/Release/syphon_texture_server.node";
        const candidatePaths = [];

        if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
            candidatePaths.push(path.join(op.patch.config.prefixAssetPath, addonRelPath));
        }

        if (typeof __dirname !== "undefined" && __dirname) {
            candidatePaths.push(path.join(__dirname, "build/Release/syphon_texture_server.node"));
            candidatePaths.push(path.join(__dirname, "ops/Ops.Extension.Standalone.MacOs.Syphon.SyphonOutTexture/build/Release/syphon_texture_server.node"));
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
                op.log("[SyphonOutTexture] Loaded native syphon_texture_server module from: " + resolved);
                return nativeModule;
            }
        }

        op.logWarn("[SyphonOutTexture] Native addon binary not found.");
        outStatus.set("Binary Not Found");
        return null;
    } catch (e) {
        op.logError("[SyphonOutTexture] Error loading native addon: " + String(e));
        outStatus.set("Addon Load Error");
        return null;
    }
}

function cleanupGlResources() {
    const cgl = op.patch && op.patch.cgl ? op.patch.cgl : null;
    const gl = cgl ? cgl.gl : null;

    if (gl) {
        if (pbos.length > 0) {
            try {
                pbos.forEach((pbo) => gl.deleteBuffer(pbo));
            } catch (e) {}
            pbos = [];
        }
        if (fbo) {
            try {
                gl.deleteFramebuffer(fbo);
            } catch (e) {}
            fbo = null;
        }
    }
    sharedBuffer = null;
    lastWidth = 0;
    lastHeight = 0;
    currentPboIndex = 0;
}

function initGlResources(width, height) {
    const cgl = op.patch && op.patch.cgl ? op.patch.cgl : null;
    const gl = cgl ? cgl.gl : null;
    if (!gl) return;

    cleanupGlResources();

    try {
        lastWidth = width;
        lastHeight = height;
        sharedBuffer = new Uint8Array(width * height * 4);

        if (!fbo) {
            fbo = gl.createFramebuffer();
        }

        // Initialize WebGL2 double-buffered PBOs for non-blocking DMA reads
        if (gl.PIXEL_PACK_BUFFER) {
            const pbo0 = gl.createBuffer();
            const pbo1 = gl.createBuffer();

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo0);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo1);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

            pbos = [pbo0, pbo1];
            currentPboIndex = 0;
        }

        if (serverInstance) {
            serverInstance.updateSize(width, height);
        }
    } catch (e) {
        op.logError("[SyphonOutTexture] Failed to initialize WebGL PBO resources: " + String(e));
    }
}

function startServer() {
    if (!nativeModule) {
        nativeModule = loadNativeAddon();
    }
    if (!nativeModule) return;

    stopServer();

    try {
        serverInstance = new nativeModule.SyphonTextureServer();
        const name = inServerName.get() || "Cables Texture Output";
        const w = lastWidth || 1920;
        const h = lastHeight || 1080;
        const success = serverInstance.startServer(name, w, h);

        if (success) {
            outPublishing.set(true);
            outStatus.set("Running");

            if (!statusInterval) {
                statusInterval = setInterval(pollStatus, 500);
            }
        } else {
            outStatus.set("Start Failed");
        }
    } catch (e) {
        op.logError("[SyphonOutTexture] Exception starting server: " + String(e));
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
            if (outHasClients.get() !== Boolean(st.hasClients)) outHasClients.set(Boolean(st.hasClients));
            if (outSurfaceId.get() !== st.surfaceId) outSurfaceId.set(st.surfaceId || 0);

            if (st.isRunning) {
                const msg = st.hasClients ? "Publishing (Active Client)" : "Broadcasting (Waiting for Client)";
                if (outStatus.get() !== msg) outStatus.set(msg);
                if (!outPublishing.get()) outPublishing.set(true);
            }
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

inServerName.onChange = () => {
    if (serverInstance) {
        serverInstance.setServerName(inServerName.get() || "Cables Texture Output");
    }
};

inRender.onTriggered = () => {
    if (!inActive.get()) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    const w = tex.width;
    const h = tex.height;
    if (w <= 0 || h <= 0) return;

    if (!serverInstance) {
        startServer();
    }

    if (!serverInstance) return;

    const cgl = op.patch && op.patch.cgl ? op.patch.cgl : null;
    const gl = cgl ? cgl.gl : null;
    if (!gl) return;

    // Handle resolution changes dynamically
    if (lastWidth !== w || lastHeight !== h || !sharedBuffer) {
        initGlResources(w, h);
    }

    if (!sharedBuffer || !fbo) return;

    // Attach intermediate texture to dedicated FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

    if (pbos.length === 2) {
        const readPbo = pbos[currentPboIndex];
        const writePbo = pbos[1 - currentPboIndex];

        // 1. Asynchronously read completed pixels from previous frame (zero stall DMA)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, readPbo);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, sharedBuffer);

        // 2. Trigger asynchronous background pack for current frame into write PBO
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, writePbo);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, 0);

        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        // Swap PBO ring index
        currentPboIndex = 1 - currentPboIndex;

        // 3. Publish to native Syphon Metal Server with zero thread stall
        serverInstance.writeAndPublish(sharedBuffer);
    } else {
        // Fallback synchronous read if WebGL2 PBO is not supported
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, sharedBuffer);
        serverInstance.writeAndPublish(sharedBuffer);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

op.onDelete = () => {
    stopServer();
    cleanupGlResources();
};

// Initial startup
if (inActive.get()) {
    startServer();
}
