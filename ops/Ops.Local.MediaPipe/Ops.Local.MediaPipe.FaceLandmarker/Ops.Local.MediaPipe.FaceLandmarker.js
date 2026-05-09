const
    inTrigger = op.inTrigger("Execute"),
    inTex = op.inTexture("Texture"),
    inModel = op.inDropDown("Model", ["face_landmarker.task"], "face_landmarker.task"),
    inVisionUrl = op.inString("Vision Module URL", "http://127.0.0.1:8080/libs/mediapipe/vision_bundle.js"),
    inWasmUrl = op.inString("Vision WASM URL", "http://127.0.0.1:8080/libs/mediapipe/wasm/"),
    inModelUrl = op.inString("Model URL", "http://127.0.0.1:8080/models/face_landmarker.task"),
    inNumFaces = op.inInt("Num Faces", 1),
    inMinConf = op.inFloatSlider("Min Confidence", 0.5),
    inFormat = op.inDropDown("Output Format", ["MediaPipe", "ML5"], "MediaPipe"),
    inFailSafe = op.inBool("Fail-Safe Polling", true),
    inInterval = op.inFloat("Interval (ms)", 100),
    
    outLandmarks = op.outArray("Landmarks"),
    outFound = op.outNumber("Found"),
    outResult = op.outObject("Result"),
    outNext = op.outTrigger("Next"),
    inReload = op.inTriggerButton("Reload");


inTrigger.setUiAttribs({ "isButton": true });

let faceLandmarker = null;
let isInitializing = false;
let vision = null;
let lastProcessTime = 0;

let intervalId = null;

function updateInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        if (!inFailSafe.get()) return;
        const now = performance.now();
        if (now - lastProcessTime >= inInterval.get() && faceLandmarker && inTex.get()) {
            processFace("FailSafe");
        }
    }, 10);
}

inInterval.onChange = updateInterval;
updateInterval();

const updateMP = () => {
    if (faceLandmarker) {
        faceLandmarker.close();
        faceLandmarker = null;
    }
    initMP();
};

inReload.onTriggered = updateMP;
inVisionUrl.onChange = updateMP;
inWasmUrl.onChange = updateMP;
inModelUrl.onChange = updateMP;

setTimeout(() => {
    initMP();
}, 500);

async function initMP() {
    if (isInitializing || faceLandmarker) return;
    isInitializing = true;
    try {
        const visionModuleUrl = inVisionUrl.get();
        const wasmUrl = inWasmUrl.get();
        const modelUrl = inModelUrl.get();
        
        try {
            const resp = await fetch(visionModuleUrl);
            if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
        } catch (fetchErr) {
            throw fetchErr;
        }

        if (!vision) {
            try {
                vision = await import(visionModuleUrl);
            } catch (importErr) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = visionModuleUrl;
                    script.onload = () => {
                        if (window.vision) vision = window.vision;
                        else if (window.FilesetResolver) {
                            vision = {
                                FilesetResolver: window.FilesetResolver,
                                PoseLandmarker: window.PoseLandmarker,
                                HandLandmarker: window.HandLandmarker,
                                FaceLandmarker: window.FaceLandmarker
                            };
                        }
                        resolve();
                    };
                    script.onerror = (e) => reject(new Error("Script tag load FAILED"));
                    document.head.appendChild(script);
                });
            }
        }

        if (!vision || !vision.FilesetResolver) {
            throw new Error("MediaPipe Vision library not found after loading.");
        }

        const filesetResolver = await vision.FilesetResolver.forVisionTasks(wasmUrl);
        faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: inNumFaces.get(),
            minFaceDetectionConfidence: inMinConf.get(),
            minFacePresenceConfidence: inMinConf.get(),
            minTrackingConfidence: inMinConf.get(),
            outputFaceBlendshapes: false
        });
    } catch (e) {
    } finally {
        isInitializing = false;
    }
}

inTrigger.onTrigger = () => { processFace("Trigger"); };

async function processFace(source) {
    const now = performance.now();
    lastProcessTime = now;
    if (!faceLandmarker) { outNext.trigger(); return; }
    const tex = inTex.get();
    if (!tex || !tex.tex) { outFound.set(0); outNext.trigger(); return; }

    try {
        const gl = op.patch.cgl.gl;
        const width = tex.width;
        const height = tex.height;
        if (!op.fb) op.fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, op.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);
        const pixelCount = width * height * 4;
        if (!op.pixels || op.pixels.length !== pixelCount) {
            op.pixels = new Uint8Array(pixelCount);
            op.pixelsClamped = new Uint8ClampedArray(op.pixels.buffer);
        }
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, op.pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (!op.canvas) {
            op.canvas = document.createElement("canvas");
            op.ctx = op.canvas.getContext("2d");
        }
        if (op.canvas.width !== width || op.canvas.height !== height) {
            op.canvas.width = width;
            op.canvas.height = height;
            op.imageData = null;
        }

        if (!op.imageData) op.imageData = new ImageData(op.pixelsClamped, width, height);
        
        // Flip Y-axis (WebGL is bottom-up, Canvas is top-down)
        if (!op.tempCanvas) {
            op.tempCanvas = document.createElement("canvas");
            op.tempCtx = op.tempCanvas.getContext("2d");
        }
        if (op.tempCanvas.width !== width || op.tempCanvas.height !== height) {
            op.tempCanvas.width = width;
            op.tempCanvas.height = height;
        }
        op.tempCtx.putImageData(op.imageData, 0, 0);
        
        op.ctx.save();
        op.ctx.clearRect(0, 0, width, height);
        op.ctx.scale(1, -1);
        op.ctx.drawImage(op.tempCanvas, 0, -height);
        op.ctx.restore();

        const result = faceLandmarker.detectForVideo(op.canvas, performance.now());
        
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            let outputFormat = inFormat.get();
            if (outputFormat === "ML5") {
                const ml5Array = result.faceLandmarks.map((lms) => {
                    const keypoints = lms.map((pt, idx) => ({
                        x: pt.x * width,
                        y: pt.y * height,
                        z: pt.z,
                        name: "point_" + idx
                    }));
                    return { keypoints, confidence: 1.0 };
                });
                outLandmarks.setRef(ml5Array);
            } else {
                outLandmarks.setRef(result.faceLandmarks);
            }
            outFound.set(result.faceLandmarks.length);
        } else { outFound.set(0); outLandmarks.setRef([]); }
        outResult.set(result || { "faceLandmarks": [] });
    } catch (e) { }
    outNext.trigger();
}

op.onDelete = () => { if (faceLandmarker) { faceLandmarker.close(); faceLandmarker = null; } };
