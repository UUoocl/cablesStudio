const
    inTrigger = op.inTrigger("Execute"),
    inTex = op.inTexture("Texture"),
    inModel = op.inDropDown("Model", ["pose_landmarker_lite.task", "pose_landmarker_full.task"], "pose_landmarker_lite.task"),
    inBaseUrl = op.inString("Base URL", "esm://"),
    inNumPoses = op.inInt("Num Poses", 1),
    inMinConf = op.inFloatSlider("Min Confidence", 0.5),
    inFormat = op.inDropDown("Output Format", ["MediaPipe", "ML5"], "MediaPipe"),
    inFailSafe = op.inBool("Fail-Safe Polling", true),
    inInterval = op.inFloat("Interval (ms)", 100),
    
    outLandmarks = op.outArray("Landmarks"),
    outFound = op.outNumber("Found"),
    outResult = op.outObject("Result"),
    outNext = op.outTrigger("Next");

inTrigger.setUiAttribs({ "isButton": true });

let poseLandmarker = null;
let isInitializing = false;
let vision = null;
let lastProcessTime = 0;

const keypointNames = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner', 'right_eye', 'right_eye_outer', 
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right', 'left_shoulder', 'right_shoulder', 'left_elbow', 
    'right_elbow', 'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index', 'right_index', 
    'left_thumb', 'right_thumb', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 
    'right_ankle', 'left_heel', 'right_heel', 'left_foot_index', 'right_foot_index'
];

let intervalId = null;

function updateInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        if (!inFailSafe.get()) return;
        const now = performance.now();
        if (now - lastProcessTime >= inInterval.get() && poseLandmarker && inTex.get()) {
            processPose("FailSafe");
        }
    }, 10); // Check frequently, but respect the user interval
}

inInterval.onChange = updateInterval;
updateInterval();

inBaseUrl.onChange = () => {
    if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
    }
    initMP();
};

setTimeout(() => {
    initMP();
}, 500);

async function initMP() {
    if (isInitializing || poseLandmarker) return;
    isInitializing = true;
    try {
        const baseUrl = inBaseUrl.get();
        const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        const visionModuleUrl = base + "libs/mediapipe/vision_bundle.js";
        const wasmUrl = base + "libs/mediapipe/wasm/";
        const modelUrl = base + "models/pose_landmarker_lite.task";
        
        console.log("LocalMP PoseLandmarker: Loading from", base);
        
        if (!vision) vision = await import(visionModuleUrl);
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(wasmUrl);
        poseLandmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },
            runningMode: "VIDEO"
        });
        console.log("LocalMP PoseLandmarker: ENGINE READY");
    } catch (e) {
        console.error("LocalMP PoseLandmarker: Init error:", e);
    } finally {
        isInitializing = false;
    }
}

inTrigger.onTrigger = () => { processPose("Trigger"); };

async function processPose(source) {
    const now = performance.now();
    lastProcessTime = now;
    if (!poseLandmarker) { outNext.trigger(); return; }
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

        const result = poseLandmarker.detectForVideo(op.canvas, performance.now());
        
        if (result && result.landmarks && result.landmarks.length > 0) {
            console.log("LocalMP PoseLandmarker: Found", result.landmarks.length, "poses");
            let outputFormat = inFormat.get();
            if (outputFormat === "ML5") {
                const ml5Array = result.landmarks.map((lms) => {
                    const keypoints = lms.map((pt, idx) => ({
                        x: pt.x * width,
                        y: pt.y * height,
                        z: pt.z,
                        score: pt.visibility || 1,
                        name: keypointNames[idx] || "unknown"
                    }));
                    return { keypoints, confidence: 1.0 };
                });
                outLandmarks.setRef(ml5Array);
            } else {
                outLandmarks.setRef(result.landmarks);
            }
            outFound.set(result.landmarks.length);
        } else { outFound.set(0); outLandmarks.setRef([]); }
        outResult.set(result || { "landmarks": [] });
    } catch (e) { console.error("LocalMP PoseLandmarker: Detection error:", e); }
    outNext.trigger();
}

op.onDelete = () => { if (poseLandmarker) { poseLandmarker.close(); poseLandmarker = null; } };
