// Ops.Team.CablesStudio.ExternalDesktopCapture.js

// Define inputs
const inUpdate = op.inTrigger("Update");
const inOpenChild = op.inTriggerButton("Open Child");
const inCloseChild = op.inTriggerButton("Close Child");
const inStart = op.inTriggerButton("Start Capture");
const inStop = op.inTriggerButton("Stop Capture");
const inChannelName = op.inString("Broadcast Channel Name", "desktop-capture-sync");

const inCaptureType = op.inValueSelect("Capture Type index", ["Audio & Video", "Video Only", "Audio Only"], "Audio & Video");
const inDisplaySurface = op.inValueSelect("Display Surface index", ["Any", "Monitor", "Window", "Browser Tab"], "Any");
const inWidth = op.inInt("Width", 1280);
const inHeight = op.inInt("Height", 720);
const inFPS = op.inInt("FPS", 30);
const inVolume = op.inFloat("Volume", 1.0);
const inFlipY = op.inBool("Flip Y", true);
const inFlipX = op.inBool("Flip X", false);
const inShowChildPreview = op.inBool("Show Child Preview", true);

// Define outputs
const outNext = op.outTrigger("Next");
const outTexture = op.outTexture("Texture");
const outAudioNode = op.outObject("Audio Node");
const outIsCapturing = op.outBoolNum("Is Capturing", false);
const outTextureUpdated = op.outTrigger("Texture Updated");
const outError = op.outString("Error", "");
const outWindowStatus = op.outString("Window Status", "closed");
const outWebRTCStatus = op.outString("WebRTC Status", "disconnected");

// Port groupings
op.setPortGroup("Controls", [inOpenChild, inCloseChild, inStart, inStop, inChannelName]);
op.setPortGroup("Settings", [inCaptureType, inDisplaySurface, inShowChildPreview]);
op.setPortGroup("Resolution", [inWidth, inHeight, inFPS]);
op.setPortGroup("Audio", [inVolume]);
op.setPortGroup("Texture", [inFlipY, inFlipX]);

const cgl = op.patch.cgl;
let tex = null;
const emptyTexture = CGL.Texture.getEmptyTexture(cgl);
outTexture.setRef(emptyTexture);

let bcParent = null;
let childWindow = null;
let windowPollInterval = null;
let isCapturing = false;

// Parent video element for decoding the child stream locally
const videoElement = document.createElement("video");
videoElement.autoplay = true;
videoElement.playsInline = true;
videoElement.muted = true;
videoElement.style.position = "absolute";
videoElement.style.width = "16px";
videoElement.style.height = "16px";
videoElement.style.left = "-100px";
videoElement.style.top = "-100px";
videoElement.style.pointerEvents = "none";
videoElement.style.opacity = "0.01";
videoElement.style.overflow = "hidden";
if (!videoElement.parentNode) {
    document.body.appendChild(videoElement);
}

// Web Audio resources
let audioCtx = null;
let mediaStreamSource = null;
let gainNode = null;

// Offscreen 2D canvas for handling Flip X mirroring
let offscreenCanvas = null;
let offscreenCtx = null;

// Embedded runner window HTML template
const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ExternalDesktopCapture Runner</title>
    <style>
        body {
            background: #0f172a;
            color: #38bdf8;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }
        .container {
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #334155;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            font-size: 22px;
            margin-top: 0;
            color: #22d3ee;
        }
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
            text-align: left;
        }
        .status-item {
            background: #0f172a;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #334155;
        }
        .status-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .status-value {
            font-size: 15px;
            color: #f8fafc;
            font-weight: 600;
        }
        .btn {
            background: #06b6d4;
            color: #0f172a;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 700;
            font-size: 15px;
            transition: background 0.2s, transform 0.1s;
            margin: 5px;
        }
        .btn:hover {
            background: #0891b2;
        }
        .btn:active {
            transform: scale(0.98);
        }
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        .btn-danger:hover {
            background: #dc2626;
        }
        video {
            width: 100%;
            max-height: 180px;
            border-radius: 6px;
            border: 1px solid #334155;
            background: #020617;
            margin-top: 15px;
            display: none;
        }
        .pulse {
            width: 12px;
            height: 12px;
            background: #22d3ee;
            border-radius: 50%;
            display: inline-block;
            margin-bottom: 10px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="status-pulse" class="pulse" style="display:none;"></div>
        <h1 id="title">Desktop Capture Runner</h1>
        
        <div class="status-grid">
            <div class="status-item">
                <div class="status-label">Screen Capture</div>
                <div id="capture-status" class="status-value">Inactive</div>
            </div>
            <div class="status-item">
                <div class="status-label">Sharing Pipeline</div>
                <div id="sharing-status" class="status-value">Disconnected</div>
            </div>
        </div>
        
        <button id="capture-btn" class="btn">Start Capture</button>
        <button id="stop-btn" class="btn btn-danger" style="display:none;">Stop Capture</button>

        <video id="runner-preview" autoplay playsinline muted></video>
    </div>

    <script>
        var bcChild = null;
        var captureStream = null;
        
        // BroadcastChannel name placeholder - replaced by parent on open
        var channelName = "desktop-capture-sync";

        // Settings written dynamically by opener
        window.captureConstraints = {
            captureType: "Audio & Video",
            displaySurface: "Any",
            width: 1280,
            height: 720,
            fps: 30,
            showChildPreview: true
        };

        function initChannel() {
            if (bcChild) bcChild.close();
            bcChild = new BroadcastChannel(channelName);
        }

        function updateStatus(capText, sharingText, isCapturing) {
            if (capText !== null) document.getElementById('capture-status').textContent = capText;
            if (sharingText !== null) document.getElementById('sharing-status').textContent = sharingText;
            
            if (isCapturing !== null) {
                document.getElementById('status-pulse').style.display = isCapturing ? 'inline-block' : 'none';
                document.getElementById('capture-btn').style.display = isCapturing ? 'none' : 'inline-block';
                document.getElementById('stop-btn').style.display = isCapturing ? 'inline-block' : 'none';
                
                var video = document.getElementById('runner-preview');
                var wantPreview = window.captureConstraints.showChildPreview;
                if (isCapturing && wantPreview) {
                    video.style.display = 'block';
                    if (!video.srcObject) video.srcObject = captureStream;
                } else {
                    video.style.display = 'none';
                    video.srcObject = null;
                }
            }
        }

        async function startScreenCapture() {
            try {
                updateStatus("Requesting permission...", "Disconnected", false);
                
                var capType = window.captureConstraints.captureType;
                var wantVideo = capType === "Audio & Video" || capType === "Video Only";
                var wantAudio = capType === "Audio & Video" || capType === "Audio Only";

                var constraints = {
                    video: wantVideo ? {
                        width: { ideal: window.captureConstraints.width },
                        height: { ideal: window.captureConstraints.height },
                        frameRate: { ideal: window.captureConstraints.fps }
                    } : {
                        width: { ideal: 1 },
                        height: { ideal: 1 },
                        frameRate: { ideal: 1 }
                    },
                    audio: wantAudio ? {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } : false
                };

                var surf = window.captureConstraints.displaySurface;
                if (surf !== "Any" && constraints.video) {
                    if (surf === "Monitor") constraints.video.displaySurface = "monitor";
                    else if (surf === "Window") constraints.video.displaySurface = "window";
                    else if (surf === "Browser Tab") constraints.video.displaySurface = "browser";
                }

                captureStream = await navigator.mediaDevices.getDisplayMedia(constraints);
                
                var track = captureStream.getVideoTracks()[0];
                var settings = track ? track.getSettings() : null;
                var resStr = settings ? (settings.width + "x" + settings.height + " @ " + Math.round(settings.frameRate || 30) + "fps") : "Active";

                // Expose the stream globally on the child window context
                window.captureStream = captureStream;

                updateStatus("Capturing (" + resStr + ")", "Direct GPU Sharing (Active)", true);
                
                sendMsg({ type: 'status', value: 'capturing' });

                captureStream.getTracks().forEach(function(track) {
                    track.onended = function() {
                        stopScreenCapture();
                    };
                });

            } catch(e) {
                updateStatus("Error: " + e.message, "Disconnected", false);
                sendMsg({ type: 'error', value: e.message });
            }
        }

        function stopScreenCapture() {
            if (captureStream) {
                captureStream.getTracks().forEach(function(track) {
                    track.stop();
                });
                captureStream = null;
            }
            window.captureStream = null;
            updateStatus("Stopped", "Disconnected", false);
            sendMsg({ type: 'status', value: 'stopped' });
        }

        function sendMsg(msg) {
            if (bcChild) {
                bcChild.postMessage(msg);
            }
        }

        // Expose updateStatus so opener can trigger changes dynamically
        window.updateStatus = updateStatus;

        document.getElementById('capture-btn').onclick = startScreenCapture;
        document.getElementById('stop-btn').onclick = stopScreenCapture;
        
        // Auto-init BroadcastChannel
        initChannel();
    </script>
</body>
</html>`;

function getCaptureTypeString() {
    const val = inCaptureType.get();
    if (val === 0 || val === "Audio & Video") return "Audio & Video";
    if (val === 1 || val === "Video Only") return "Video Only";
    if (val === 2 || val === "Audio Only") return "Audio Only";
    return "Audio & Video";
}

function getDisplaySurfaceString() {
    const val = inDisplaySurface.get();
    if (val === 0 || val === "Any") return "Any";
    if (val === 1 || val === "Monitor") return "Monitor";
    if (val === 2 || val === "Window") return "Window";
    if (val === 3 || val === "Browser Tab") return "Browser Tab";
    return "Any";
}

function cleanGPU() {
    isCapturing = false;
    outIsCapturing.set(false);
    outTexture.setRef(emptyTexture);
    outAudioNode.set(null);
    outWebRTCStatus.set("disconnected");

    if (mediaStreamSource) {
        try { mediaStreamSource.disconnect(); } catch(e) {}
        mediaStreamSource = null;
    }
    if (gainNode) {
        try { gainNode.disconnect(); } catch(e) {}
        gainNode = null;
    }
    videoElement.pause();
    videoElement.srcObject = null;
}

function initBroadcastChannel() {
    if (bcParent) {
        bcParent.close();
    }

    const channelName = inChannelName.get() || "desktop-capture-sync";
    bcParent = new BroadcastChannel(channelName);
    
    bcParent.onmessage = async (event) => {
        const data = event.data;
        
        if (data.type === 'status') {
            if (data.value === 'capturing') {
                isCapturing = true;
                outIsCapturing.set(true);
                outWebRTCStatus.set("Direct GPU Sharing (Active)");
                
                // Set up local video playback for WebGL upload
                if (childWindow && !childWindow.closed && childWindow.captureStream) {
                    videoElement.srcObject = childWindow.captureStream;
                    videoElement.play().catch((err) => {
                        if (err.name !== "AbortError") {
                            op.logWarn("[ExternalDesktopCapture] Playback failed:", err.message);
                        }
                    });
                }

                // Initialize audio directly if audio tracks exist
                setupParentAudio();
            } else if (data.value === 'stopped') {
                cleanGPU();
            }
        } else if (data.type === 'error') {
            outError.set(data.value);
            cleanGPU();
        }
    };
}

function setupParentAudio() {
    if (!childWindow || childWindow.closed || !childWindow.captureStream) return;

    const stream = childWindow.captureStream;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    if (CABLES.WEBAUDIO) {
        audioCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } else {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            if (!window.audioContext) window.audioContext = new AudioContextClass();
            audioCtx = window.audioContext;
        }
    }

    if (audioCtx) {
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch((err) => {
                op.logWarn("[ExternalDesktopCapture] AudioContext resume failed:", err.message);
            });
        }
        
        mediaStreamSource = audioCtx.createMediaStreamSource(stream);
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(inVolume.get(), audioCtx.currentTime);

        mediaStreamSource.connect(gainNode);
        outAudioNode.set(gainNode);
    }
}

function getFrameSource(video) {
    if (!inFlipX.get()) {
        return video;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (w <= 0 || h <= 0) return video;

    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement("canvas");
        offscreenCtx = offscreenCanvas.getContext("2d");
    }

    if (offscreenCanvas.width !== w || offscreenCanvas.height !== h) {
        offscreenCanvas.width = w;
        offscreenCanvas.height = h;
    }

    offscreenCtx.clearRect(0, 0, w, h);
    offscreenCtx.save();
    
    // Mirror horizontally
    offscreenCtx.translate(w, 0);
    offscreenCtx.scale(-1, 1);
    offscreenCtx.drawImage(video, 0, 0, w, h);
    offscreenCtx.restore();

    return offscreenCanvas;
}

inOpenChild.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const name = "Desktop Capture Runner";
    const features = "width=600,height=500,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";

    childWindow = window.open("", `desktop_capture_runner_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup window blocked. Please enable popups.");
        outWindowStatus.set("closed");
        return;
    }

    outWindowStatus.set("open");

    const doc = childWindow.document;
    doc.open();
    
    // Dynamically inject the BroadcastChannel name into the runner's script context
    const customizedTemplate = templateHtml
        .replace('var channelName = "desktop-capture-sync";', `var channelName = "${inChannelName.get() || "desktop-capture-sync"}";`);
        
    doc.write(customizedTemplate);
    doc.close();

    // Populate constraints on the child window context
    childWindow.captureConstraints = {
        captureType: getCaptureTypeString(),
        displaySurface: getDisplaySurfaceString(),
        width: inWidth.get(),
        height: inHeight.get(),
        fps: inFPS.get(),
        showChildPreview: inShowChildPreview.get()
    };

    clearInterval(windowPollInterval);
    windowPollInterval = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(windowPollInterval);
            outWindowStatus.set("closed");
            childWindow = null;
            cleanGPU();
        }
    }, 500);
};

inCloseChild.onTriggered = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
        outWindowStatus.set("closed");
        cleanGPU();
    }
};

inStart.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        // Send fresh settings and start capture
        childWindow.captureConstraints = {
            captureType: getCaptureTypeString(),
            displaySurface: getDisplaySurfaceString(),
            width: inWidth.get(),
            height: inHeight.get(),
            fps: inFPS.get(),
            showChildPreview: inShowChildPreview.get()
        };
        try {
            childWindow.startScreenCapture();
        } catch(e) {
            outError.set("Failed to initiate capture in child: " + e.message);
        }
    } else {
        outError.set("Child window is closed. Open it first.");
    }
};

inStop.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        try {
            childWindow.stopScreenCapture();
        } catch(e) {}
    }
    cleanGPU();
};

inUpdate.onTriggered = () => {
    outNext.trigger();

    if (!isCapturing) return;

    const capType = getCaptureTypeString();
    const wantVideo = capType === "Audio & Video" || capType === "Video Only";

    if (wantVideo && videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        const w = videoElement.videoWidth;
        const h = videoElement.videoHeight;

        if (w <= 0 || h <= 0) return;

        if (!tex) {
            tex = new CGL.Texture(cgl, {
                filter: CGL.Texture.FILTER_LINEAR,
                wrap: CGL.Texture.WRAP_CLAMP_TO_EDGE
            });
        }

        if (tex.width !== w || tex.height !== h) {
            tex.setSize(w, h);
        }

        const source = getFrameSource(videoElement);

        const gl = cgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, tex.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, inFlipY.get());
        
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        );

        if (inFlipY.get()) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        outTexture.setRef(tex);
        outTextureUpdated.trigger();
    }
};

inVolume.onChange = () => {
    if (gainNode && gainNode.gain) {
        const time = audioCtx ? audioCtx.currentTime : 0;
        gainNode.gain.setValueAtTime(inVolume.get(), time);
    }
};

inShowChildPreview.onChange = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.captureConstraints.showChildPreview = inShowChildPreview.get();
        if (childWindow.updateStatus && childWindow.captureStream) {
            // Re-apply preview visibility immediately
            childWindow.updateStatus(null, null, true);
        }
    }
};

inChannelName.onChange = () => {
    initBroadcastChannel();
};

op.onDelete = () => {
    clearInterval(windowPollInterval);
    cleanGPU();
    if (bcParent) {
        try { bcParent.close(); } catch(e) {}
    }
    if (childWindow) {
        try { childWindow.close(); } catch(e) {}
    }
    if (tex) {
        tex.delete();
        tex = null;
    }
    videoElement.remove();
};

// Auto-start BroadcastChannel listener on op load
initBroadcastChannel();
