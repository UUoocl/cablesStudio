const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const OPS_DIR = path.join(ROOT_DIR, 'ops');
const LIBS_DIR = path.join(ROOT_DIR, 'libs', 'mediapipe');
const MODELS_DIR = path.join(ROOT_DIR, 'models');

function encodeBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
}

const sharedAssets = {
    MP_VISION_BUNDLE_B64: encodeBase64(path.join(LIBS_DIR, 'vision_bundle.js')),
    MP_WASM_JS_B64: encodeBase64(path.join(LIBS_DIR, 'wasm', 'vision_wasm_internal.js')),
    MP_WASM_BINARY_B64: encodeBase64(path.join(LIBS_DIR, 'wasm', 'vision_wasm_internal.wasm'))
};

const tasks = {
    'Pose': {
        name: 'PoseLandmarker',
        modelFile: 'pose_landmarker_lite.task',
        resultProperty: 'landmarks',
        keypointNames: ["nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index"],
        optionsBuilder: (params) => `({
            numPoses: ${params.num},
            minPoseDetectionConfidence: ${params.minConf},
            minPosePresenceConfidence: ${params.minPresence},
            minTrackingConfidence: ${params.minTracking},
        })`
    },
    'Face': {
        name: 'FaceLandmarker',
        modelFile: 'face_landmarker.task',
        resultProperty: 'faceLandmarks',
        keypointNames: [],
        optionsBuilder: (params) => `({
            numFaces: ${params.num},
            minFaceDetectionConfidence: ${params.minConf},
            minFacePresenceConfidence: ${params.minPresence},
            minTrackingConfidence: ${params.minTracking},
            outputFaceBlendshapes: true,
        })`
    },
    'Hand': {
        name: 'HandLandmarker',
        modelFile: 'hand_landmarker.task',
        resultProperty: 'landmarks',
        keypointNames: ["wrist", "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip", "index_finger_mcp", "index_finger_pip", "index_finger_dip", "index_finger_tip", "middle_finger_mcp", "middle_finger_pip", "middle_finger_dip", "middle_finger_tip", "ring_finger_mcp", "ring_finger_pip", "ring_finger_dip", "ring_finger_tip", "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"],
        optionsBuilder: (params) => `({
            numHands: ${params.num},
            minHandDetectionConfidence: ${params.minConf},
            minHandPresenceConfidence: ${params.minPresence},
            minTrackingConfidence: ${params.minTracking},
        })`
    }
};

const opName = 'Ops.User.MediaPipe.VisionBundle';
const opDir = path.join(OPS_DIR, opName);
if (!fs.existsSync(opDir)) fs.mkdirSync(opDir, { recursive: true });

const modelAssets = {};
for (const key in tasks) {
    modelAssets[key] = encodeBase64(path.join(MODELS_DIR, tasks[key].modelFile));
}

const opCode = `{
// BUNDLED MEDIAPIPE VISION OPERATOR (Pose, Hand, Face)

const MP_VISION_BUNDLE_B64 = "${sharedAssets.MP_VISION_BUNDLE_B64}";
const MP_WASM_JS_B64 = "${sharedAssets.MP_WASM_JS_B64}";
const MP_WASM_BINARY_B64 = "${sharedAssets.MP_WASM_BINARY_B64}";

const MODELS_B64 = {
    ${Object.entries(modelAssets).map(([k, v]) => `"${k}": "${v}"`).join(',\n    ')}
};

const TASK_CONFIGS = {
    ${Object.entries(tasks).map(([k, v]) => `
    "${k}": {
        name: "${v.name}",
        resultProperty: "${v.resultProperty}",
        keypointNames: ${JSON.stringify(v.keypointNames)},
        getOptions: (params) => ${v.optionsBuilder({ num: 'params.num', minConf: 'params.minConf', minPresence: 'params.minPresence', minTracking: 'params.minTracking' })}
    }`).join(',')}
};

const inTrigger = op.inTrigger("Execute");
const inTex = op.inTexture("Texture");
const inTask = op.inDropDown("Task", ["Pose", "Hand", "Face"], "Pose");
const inNum = op.inInt("Max Detections", 1);
inNum.setUiAttribs({ "min": 1, "max": 10 });
const inMinConf = op.inFloatSlider("Min Confidence", 0.5);
const inMinPresence = op.inFloatSlider("Min Presence", 0.5);
const inMinTracking = op.inFloatSlider("Min Tracking", 0.5);

const inFormat = op.inDropDown("Output Format", ["MediaPipe", "ML5"], "MediaPipe");
const inFailSafe = op.inBool("Fail-Safe Polling", true);
const inInterval = op.inFloat("Interval (ms)", 100);

const outLandmarks = op.outArray("Landmarks");
const outFound = op.outNumber("Found");
const outResult = op.outObject("Result");
const outNext = op.outTrigger("Next");

inTrigger.setUiAttribs({ "isButton": true });

let landmarker = null;
let isInitializing = false;
let vision = null;
let lastProcessTime = 0;
let intervalId = null;

function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function updateInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        if (!inFailSafe.get()) return;
        const now = performance.now();
        if (now - lastProcessTime >= inInterval.get() && landmarker && inTex.get()) {
            processDetection("FailSafe");
        }
    }, 10);
}

inInterval.onChange = updateInterval;
updateInterval();

inTask.onChange = () => {
    if (landmarker) {
        landmarker.close();
        landmarker = null;
    }
    initMP();
};

const reactivePorts = [inNum, inMinConf, inMinPresence, inMinTracking];
reactivePorts.forEach(p => {
    p.onChange = () => {
        if (landmarker) {
            const config = TASK_CONFIGS[inTask.get()];
            landmarker.setOptions(config.getOptions({
                num: inNum.get(),
                minConf: inMinConf.get(),
                minPresence: inMinPresence.get(),
                minTracking: inMinTracking.get()
            }));
        }
    };
});

setTimeout(() => {
    initMP();
}, 500);

async function initMP() {
    if (isInitializing || landmarker) return;
    isInitializing = true;
    
    const taskKey = inTask.get();
    const config = TASK_CONFIGS[taskKey];
    
    try {
        // Global SDK/WASM Cache
        if (!window.__MP_VISION_SDK__) {
            const visionBlob = new Blob([base64ToUint8Array(MP_VISION_BUNDLE_B64)], { type: 'text/javascript' });
            const visionUrl = URL.createObjectURL(visionBlob);
            window.__MP_VISION_SDK__ = await import(visionUrl);
        }
        vision = window.__MP_VISION_SDK__;

        if (!window.__MP_WASM_JS_URL__) {
            const wasmJsBlob = new Blob([base64ToUint8Array(MP_WASM_JS_B64)], { type: 'text/javascript' });
            window.__MP_WASM_JS_URL__ = URL.createObjectURL(wasmJsBlob);
        }
        
        if (!window.__MP_WASM_BINARY_URL__) {
            const wasmBinaryBlob = new Blob([base64ToUint8Array(MP_WASM_BINARY_B64)], { type: 'application/wasm' });
            window.__MP_WASM_BINARY_URL__ = URL.createObjectURL(wasmBinaryBlob);
        }

        // Global Model Cache
        window.__MP_MODELS__ = window.__MP_MODELS__ || {};
        if (!window.__MP_MODELS__[taskKey]) {
            window.__MP_MODELS__[taskKey] = base64ToUint8Array(MODELS_B64[taskKey]);
        }
        const modelBuffer = window.__MP_MODELS__[taskKey];

        const filesetResolver = {
            wasmLoaderPath: window.__MP_WASM_JS_URL__,
            wasmBinaryPath: window.__MP_WASM_BINARY_URL__
        };

        const options = config.getOptions({
            num: inNum.get(),
            minConf: inMinConf.get(),
            minPresence: inMinPresence.get(),
            minTracking: inMinTracking.get()
        });

        landmarker = await vision[config.name].createFromOptions(filesetResolver, {
            baseOptions: { 
                modelAssetBuffer: modelBuffer, 
                delegate: "GPU" 
            },
            runningMode: "VIDEO",
            ...options
        });

    } catch (e) {
        console.error("VisionBundle Init error:", e);
    } finally {
        isInitializing = false;
    }
}

inTrigger.onTrigger = () => { processDetection("Trigger"); };

async function processDetection(source) {
    const now = performance.now();
    lastProcessTime = now;
    if (!landmarker) { outNext.trigger(); return; }
    const tex = inTex.get();
    if (!tex || !tex.tex) { outFound.set(0); outNext.trigger(); return; }

    const taskKey = inTask.get();
    const config = TASK_CONFIGS[taskKey];

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

        const result = landmarker.detectForVideo(op.canvas, performance.now());
        const data = result[config.resultProperty];
        
        if (result && data && data.length > 0) {
            let outputFormat = inFormat.get();
            if (outputFormat === "ML5") {
                const ml5Array = data.map((lms) => {
                    const keypoints = lms.map((pt, idx) => ({
                        x: pt.x * width,
                        y: pt.y * height,
                        z: pt.z,
                        score: pt.visibility || 1,
                        name: config.keypointNames[idx] || "unknown"
                    }));
                    return { keypoints, confidence: 1.0 };
                });
                outLandmarks.setRef(ml5Array);
            } else {
                outLandmarks.setRef(data);
            }
            outFound.set(data.length);
        } else { 
            outFound.set(0); 
            outLandmarks.setRef([]); 
        }
        outResult.set(result || { [config.resultProperty]: [] });
    } catch (e) { 
        console.error("VisionBundle Detection error:", e); 
    }
    outNext.trigger();
}

op.onDelete = () => { 
    if (landmarker) { 
        landmarker.close(); 
        landmarker = null; 
    } 
    if (intervalId) clearInterval(intervalId);
};

}
`;

fs.writeFileSync(path.join(opDir, opName + '.js'), opCode);
fs.writeFileSync(path.join(opDir, opName + '.json'), JSON.stringify({
    "authorName": "jonwood",
    "id": Math.random().toString(36).substring(7),
    "created": Date.now(),
    "layout": { "portsIn": [], "portsOut": [] }
}, null, 4));

console.log("Bundled operator generated successfully: " + opName);
