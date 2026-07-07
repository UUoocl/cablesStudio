// Ops.Team.CablesStudio.DesktopCaptureAudioVideo.js

// Define inputs
const inUpdate = op.inTrigger("Update");
const inStart = op.inTriggerButton("Start Capture");
const inStop = op.inTriggerButton("Stop Capture");
const inCaptureType = op.inValueSelect("Capture Type", ["Audio & Video", "Video Only", "Audio Only"], "Audio & Video");
const inDisplaySurface = op.inValueSelect("Display Surface", ["Any", "Monitor", "Window", "Browser Tab"], "Any");
const inWidth = op.inInt("Width", 1280);
const inHeight = op.inInt("Height", 720);
const inFPS = op.inInt("FPS", 30);
const inVolume = op.inFloat("Volume", 1.0);
const inFlipY = op.inBool("Flip Y", true);
const inFlipX = op.inBool("Flip X", false);

// Define outputs
const outNext = op.outTrigger("Next");
const outTexture = op.outTexture("Texture");
const outAudioNode = op.outObject("Audio Node");
const outIsCapturing = op.outBoolNum("Is Capturing", false);
const outTextureUpdated = op.outTrigger("Texture Updated");
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Controls", [inStart, inStop]);
op.setPortGroup("Settings", [inCaptureType, inDisplaySurface]);
op.setPortGroup("Resolution", [inWidth, inHeight, inFPS]);
op.setPortGroup("Audio", [inVolume]);
op.setPortGroup("Texture", [inFlipY, inFlipX]);

const cgl = op.patch.cgl;
let tex = null;
const emptyTexture = CGL.Texture.getEmptyTexture(cgl);
outTexture.setRef(emptyTexture);

let stream = null;
let audioCtx = null;
let mediaStreamSource = null;
let gainNode = null;
let isCapturing = false;

// Detached offscreen video element for video decoding/playback
const videoElement = document.createElement("video");
videoElement.autoplay = true;
videoElement.playsInline = true;
videoElement.muted = true;

// Offscreen 2D canvas for handling Flip X mirroring
let offscreenCanvas = null;
let offscreenCtx = null;

// Event handlers
inStart.onTriggered = startCapture;
inStop.onTriggered = stopCapture;

// Iframe sandbox warning
if (window.self !== window.top) {
    op.setUiError("iframe_permission", "Screen capture is blocked inside the editor iframe by browser security policies. To use screen capture, open this patch in a standalone tab/window.", 1);
}

inVolume.onChange = () => {
    if (gainNode && gainNode.gain) {
        const time = audioCtx ? audioCtx.currentTime : 0;
        gainNode.gain.setValueAtTime(inVolume.get(), time);
    }
};

op.onDelete = () => {
    stopCapture();
    if (tex) {
        tex.delete();
        tex = null;
    }
    videoElement.remove();
};

inUpdate.onTriggered = () => {
    outNext.trigger();

    if (!isCapturing) return;

    const capType = inCaptureType.get();
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

        // Retrieve video frame source, horizontal mirror if Flip X is checked
        const source = getFrameSource();

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

function getFrameSource() {
    if (!inFlipX.get()) {
        return videoElement;
    }

    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;

    if (w <= 0 || h <= 0) return videoElement;

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
    offscreenCtx.drawImage(videoElement, 0, 0, w, h);
    
    offscreenCtx.restore();

    return offscreenCanvas;
}

function startCapture() {
    stopCapture();
    outError.set("");

    let mediaDevices = navigator.mediaDevices;
    try {
        if (window.parent && window.parent !== window && window.parent.navigator && window.parent.navigator.mediaDevices) {
            const parentDevices = window.parent.navigator.mediaDevices;
            if (parentDevices && parentDevices.getDisplayMedia) {
                mediaDevices = parentDevices;
                op.log("[DesktopCapture] Attempting to use parent window's mediaDevices to bypass iframe permissions policy.");
            }
        }
    } catch (e) {
        // Disallowed by CORS / cross-origin security - stick to current frame mediaDevices
    }

    if (!mediaDevices || !mediaDevices.getDisplayMedia) {
        const errMsg = "getDisplayMedia API is not supported in this context (e.g. requires HTTPS or appropriate Permissions Policy).";
        op.logError("[DesktopCapture]", errMsg);
        outError.set(errMsg);
        return;
    }

    const capType = inCaptureType.get();
    const wantVideo = capType === "Audio & Video" || capType === "Video Only";
    const wantAudio = capType === "Audio & Video" || capType === "Audio Only";

    // getDisplayMedia constraints
    const constraints = {
        video: wantVideo ? {
            width: { ideal: inWidth.get() },
            height: { ideal: inHeight.get() },
            frameRate: { ideal: inFPS.get() }
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

    // Apply Display Surface Hint
    const surf = inDisplaySurface.get();
    if (surf !== "Any" && constraints.video && typeof constraints.video === "object") {
        if (surf === "Monitor") constraints.video.displaySurface = "monitor";
        else if (surf === "Window") constraints.video.displaySurface = "window";
        else if (surf === "Browser Tab") constraints.video.displaySurface = "browser";
    }

    op.log("[DesktopCapture] Requesting display capture stream with constraints:", JSON.stringify(constraints));

    mediaDevices.getDisplayMedia(constraints)
        .then((s) => {
            stream = s;
            isCapturing = true;
            outIsCapturing.set(true);
            op.setUiError("capture_error", null);

            // Bind ended listener (e.g. user clicked browser stop sharing button)
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    op.log("[DesktopCapture] Capture track ended natively by browser UI.");
                    stopCapture();
                };
            });

            if (wantVideo) {
                videoElement.srcObject = stream;
                videoElement.play().catch((err) => {
                    op.logWarn("[DesktopCapture] Offscreen video playback failed:", err.message);
                });
            } else {
                // Audio Only mode: stop and discard the minimal video track immediately to save energy
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    videoTracks[0].stop();
                }
            }

            if (wantAudio) {
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
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
                                op.logWarn("[DesktopCapture] AudioContext resume failed:", err.message);
                            });
                        }

                        mediaStreamSource = audioCtx.createMediaStreamSource(stream);
                        gainNode = audioCtx.createGain();
                        gainNode.gain.setValueAtTime(inVolume.get(), audioCtx.currentTime);

                        mediaStreamSource.connect(gainNode);
                        outAudioNode.set(gainNode);
                        op.log("[DesktopCapture] Audio node connected successfully.");
                    } else {
                        outError.set("Web Audio API not supported/available.");
                    }
                } else {
                    op.logWarn("[DesktopCapture] Requested audio but no audio track was included by the browser screen sharing picker.");
                }
            }
        })
        .catch((err) => {
            op.logError("[DesktopCapture] Capture initialization failed:", err);
            let errMsg = err.message || String(err);
            if (errMsg.includes("Permissions policy") || errMsg.includes("permissions policy") || errMsg.includes("disallowed by permissions policy")) {
                errMsg = "Permissions Policy error: Screen capture is blocked. The iframe must have allow=\"display-capture\" set, or run the app in the parent window directly.";
            }
            outError.set(errMsg);
            op.setUiError("capture_error", errMsg, 2);
            stopCapture();
        });
}

function stopCapture() {
    isCapturing = false;
    outIsCapturing.set(false);
    outAudioNode.set(null);
    outTexture.setRef(emptyTexture);
    op.setUiError("capture_error", null);

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (mediaStreamSource) {
        try { mediaStreamSource.disconnect(); } catch (e) {}
        mediaStreamSource = null;
    }

    if (gainNode) {
        try { gainNode.disconnect(); } catch (e) {}
        gainNode = null;
    }

    videoElement.pause();
    videoElement.srcObject = null;

    offscreenCanvas = null;
    offscreenCtx = null;
}
