/**
 * Ops.Extension.Standalone.SwiftSidecars.SyphonOut
 * Publishes a Cables WebGL texture as a macOS Syphon server
 * utilizing a high-performance native Swift-backed sidecar process and GPU-shared IOSurface.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");
const path = op.require("path");

const
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    serverName = op.inString("Server Name", "Cables_Output"),
    
    outRunning = op.outBool("Running", false),
    outStatus = op.outString("Status", "Stopped");

let wss = null;
let cp = null;
let currentWs = null;
let lastWidth = 0;
let lastHeight = 0;
let lastServerName = "";

// Native Node-API IOSurface Addon
let iosurfaceShared = null;
let sharedSurface = null;
let sharedBuffer = null;

// WebGL2 Pixel Buffer Objects (PBOs) for asynchronous readback
let pbos = [];
let currentPboIndex = 0;

try {
    const addonPath = path.join(
        op.patch.config.prefixAssetPath,
        "ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonOut/build/Release/iosurface_shared.node"
    );
    const resolvedPath = op.patch && typeof op.patch.filePath === "function" ? op.patch.filePath(addonPath) : addonPath;
    if (fs.existsSync(resolvedPath)) {
        iosurfaceShared = op.require(resolvedPath);
        op.log("[SyphonOut] Loaded native iosurface_shared addon.");
    } else {
        op.logWarn("[SyphonOut] Native addon not compiled yet at: " + resolvedPath);
    }
} catch (e) {
    op.logError("[SyphonOut] Error requiring native addon: " + String(e));
}

function updateSharedSurface(width, height) {
    const gl = op.patch.cgl.gl;
    if (sharedSurface) {
        sharedSurface = null; // Let GC release previous IOSurface Ref
        sharedBuffer = null;
    }
    
    if (pbos.length > 0) {
        try {
            pbos.forEach(pbo => gl.deleteBuffer(pbo));
        } catch (e) {}
        pbos = [];
    }
    
    if (!iosurfaceShared) {
        op.logWarn("[SyphonOut] Cannot allocate IOSurface: native addon not loaded.");
        return;
    }

    try {
        op.log("[SyphonOut] Allocating shared IOSurface: " + width + "x" + height);
        sharedSurface = new iosurfaceShared.IOSurfaceWrap(width, height);
        sharedBuffer = new Uint8Array(width * height * 4);
        
        // Allocate WebGL2 PBOs for double-buffered asynchronous reads
        if (gl.PIXEL_PACK_BUFFER) {
            pbos.push(gl.createBuffer());
            pbos.push(gl.createBuffer());
            
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbos[0]);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);
            
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbos[1]);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);
            
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        }
        currentPboIndex = 0;
    } catch (e) {
        op.logError("[SyphonOut] Failed to create shared IOSurface: " + String(e));
    }
}

function killProcess() {
    if (cp) {
        op.log("[SyphonOut] Terminating native Swift Syphon process...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
    outRunning.set(false);
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SyphonOut] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
    outStatus.set("Stopped");
    
    if (sharedSurface) {
        sharedSurface = null;
        sharedBuffer = null;
    }
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SyphonOut] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SyphonOut] Swift sidecar connected!");
            currentWs = ws;

            ws.on("close", () => {
                op.log("[SyphonOut] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
            });

            ws.on("error", (err) => {
                op.logError("[SyphonOut] Sidecar connection error: " + err.message);
            });

            sendServerNameConfig();
        });

    } catch (e) {
        op.logError("[SyphonOut] Failed to start private server: " + String(e));
        outStatus.set("Server Setup Failed");
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonOut/swift_bin/SwiftSyphonOut`;
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SyphonOut] Swift binary not found at: " + binaryPath);
        outStatus.set("Binary Not Found");
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SyphonOut] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SyphonOut] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));
    outStatus.set("Launching...");

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        outRunning.set(true);
        outStatus.set("Running");

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SyphonOut Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SyphonOut Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SyphonOut] Process error: " + err.message);
            outStatus.set("Error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SyphonOut] Process exited with code " + code + ", signal " + signal);
            outStatus.set(code === 0 ? "Exited Cleanly" : "Exited (Code: " + code + ")");
            cp = null;
            outRunning.set(false);
        });

    } catch (e) {
        op.logError("[SyphonOut] Failed to spawn: " + String(e));
        outStatus.set("Spawn Failed");
        stopServerAndProcess();
    }
}

function sendServerNameConfig() {
    if (!currentWs) return;
    const name = serverName.get() || "Cables_Output";
    try {
        currentWs.send(JSON.stringify({
            type: "serverName",
            name: name
        }));
        lastServerName = name;
        
        // If we have an active IOSurface, notify Swift sidecar of its ID
        if (sharedSurface) {
            currentWs.send(JSON.stringify({
                type: "surface",
                id: sharedSurface.id,
                width: lastWidth,
                height: lastHeight
            }));
        }
    } catch (e) {
        op.logWarn("[SyphonOut] Failed to send configurations: " + String(e));
    }
}

render.onTriggered = () => {
    const tex = inTexture.get();
    if (!tex || !tex.tex) return;

    if (!wss && !cp) {
        // Try hot-loading native addon if not loaded yet
        if (!iosurfaceShared) {
            try {
                const addonPath = path.join(
                    op.patch.config.prefixAssetPath,
                    "ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.SyphonOut/build/Release/iosurface_shared.node"
                );
                const resolvedPath = op.patch && typeof op.patch.filePath === "function" ? op.patch.filePath(addonPath) : addonPath;
                if (fs.existsSync(resolvedPath)) {
                    iosurfaceShared = op.require(resolvedPath);
                }
            } catch(e) {}
        }
        startServerAndProcess();
        return;
    }

    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        const name = serverName.get() || "Cables_Output";
        if (name !== lastServerName) {
            sendServerNameConfig();
        }

        const width = tex.width;
        const height = tex.height;

        if (!sharedSurface || lastWidth !== width || lastHeight !== height) {
            updateSharedSurface(width, height);
            lastWidth = width;
            lastHeight = height;
            
            // Send new surface details to Swift sidecar
            if (sharedSurface) {
                currentWs.send(JSON.stringify({
                    type: "surface",
                    id: sharedSurface.id,
                    width: width,
                    height: height
                }));
            }
        }

        if (sharedSurface && sharedBuffer) {
            const gl = op.patch.cgl.gl;

            // Attach texture to a temporary FBO to perform gl.readPixels
            if (!op._fbo) op._fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, op._fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

            if (pbos.length === 2) {
                const nextPbo = pbos[currentPboIndex];
                const writePbo = pbos[1 - currentPboIndex];

                // 1. Read pixels from the previous frame's completed PBO
                gl.bindBuffer(gl.PIXEL_PACK_BUFFER, nextPbo);
                gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, sharedBuffer);

                // 2. Trigger asynchronous read for the current frame into the write PBO
                gl.bindBuffer(gl.PIXEL_PACK_BUFFER, writePbo);
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);

                gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

                // 3. Swap PBOs for next frame
                currentPboIndex = 1 - currentPboIndex;

                // 4. Pass the read pixel data to native C++ to copy to the IOSurface
                sharedSurface.write(sharedBuffer);
            } else {
                // Fallback for WebGL1 (synchronous blocking read)
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, sharedBuffer);
                sharedSurface.write(sharedBuffer);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // Trigger Swift sidecar update by sending a frame notification
            try {
                currentWs.send(JSON.stringify({
                    type: "frame"
                }));
            } catch (e) {
                op.logWarn("[SyphonOut] Failed to send frame notification: " + String(e));
            }
        }
    }
};

serverName.onChange = () => {
    if (currentWs) {
        sendServerNameConfig();
    }
};

op.onDelete = () => {
    stopServerAndProcess();
    const gl = op.patch.cgl.gl;
    if (pbos.length > 0) {
        try {
            pbos.forEach(pbo => gl.deleteBuffer(pbo));
        } catch (e) {}
        pbos = [];
    }
    if (op._fbo) {
        try {
            gl.deleteFramebuffer(op._fbo);
        } catch (e) {}
        op._fbo = null;
    }
};
