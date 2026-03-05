/**
 * MediaPipe Face Landmarker Operator
 */

const
    inTrigger = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inVideo = op.inObject("Video Element"),
    inServerUrl = op.inString("Server URL", "http://127.0.0.1:8000"),
    inModelUrl = op.inString("Model Path", "/mediapipe/models/face_landmarker.task"),
    inDelegate = op.inDropDown("Delegate", ["GPU", "CPU"], "GPU"),
    inNumFaces = op.inInt("Num Faces", 1),
    inOutputBlendshapes = op.inBool("Output Blendshapes", false),
    inOutputMatrix = op.inBool("Output Matrix", false),
    inMinDetectionConfidence = op.inFloat("Min Detection Confidence", 0.5),
    inMinTrackingConfidence = op.inFloat("Min Tracking Confidence", 0.5),

    next = op.outTrigger("Next"),
    outLandmarks = op.outObject("Landmarks"),
    outBlendshapes = op.outObject("Blendshapes"),
    outMatrices = op.outObject("Transformation Matrices"),
    outFound = op.outBool("Found", false),
    outLoaded = op.outBool("Loaded", false),
    outError = op.outString("Error");

let faceLandmarker = null;
let FilesetResolver = null;
let FaceLandmarker = null;
let lastVideoTime = -1;
let vision = null;

op.onDelete = () => {
    if (faceLandmarker) {
        faceLandmarker.close();
    }
};

inActive.onChange = 
inServerUrl.onChange =
inModelUrl.onChange =
inDelegate.onChange =
inNumFaces.onChange =
inOutputBlendshapes.onChange =
inOutputMatrix.onChange =
inMinDetectionConfidence.onChange =
inMinTrackingConfidence.onChange = () => {
    if (inActive.get()) initFace();
    else {
        if (faceLandmarker) {
            faceLandmarker.close();
            faceLandmarker = null;
        }
        outLoaded.set(false);
    }
};

async function loadVisionLibrary() {
    if (vision) return vision;
    const baseUrl = inServerUrl.get();
    const libUrl = baseUrl + "/mediapipe/vision_bundle.mjs";
    try {
        const check = await fetch(baseUrl + "/socketcluster.js", { method: 'HEAD' });
        if (!check.ok && check.status !== 404) throw new Error("Server status " + check.status);
    } catch (e) {
        throw new Error("SocketCluster server unreachable at " + baseUrl);
    }
    try {
        const module = await import(libUrl);
        vision = module;
        return vision;
    } catch (e) {
        throw new Error("Failed to fetch MediaPipe library from " + libUrl);
    }
}

async function initFace() {
    outLoaded.set(false);
    outError.set("");
    if (faceLandmarker) {
        faceLandmarker.close();
        faceLandmarker = null;
    }
    if (!inActive.get()) return;
    try {
        if (!vision) vision = await loadVisionLibrary();
        FilesetResolver = vision.FilesetResolver;
        FaceLandmarker = vision.FaceLandmarker;

        const baseUrl = inServerUrl.get();
        const wasmPath = baseUrl + "/mediapipe/wasm/";
        const modelPath = baseUrl + inModelUrl.get();
        const fileset = await FilesetResolver.forVisionTasks(wasmPath);

        faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: inDelegate.get()
            },
            runningMode: "VIDEO",
            numFaces: inNumFaces.get(),
            outputFaceBlendshapes: inOutputBlendshapes.get(),
            outputFacialTransformationMatrixes: inOutputMatrix.get(),
            minFaceDetectionConfidence: inMinDetectionConfidence.get(),
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: inMinTrackingConfidence.get()
        });
        outLoaded.set(true);
    } catch (e) {
        console.error("[MediaPipeFace] Init error:", e);
        outError.set("Init error: " + (e.message || String(e)));
    }
}

inTrigger.onTriggered = () => {
    let found = false;
    if (inActive.get() && faceLandmarker && inVideo.get()) {
        const video = inVideo.get();
        if (video && video.readyState >= 2) {
            const currentTime = video.currentTime;
            if (lastVideoTime !== currentTime) {
                lastVideoTime = currentTime;
                try {
                    const result = faceLandmarker.detectForVideo(video, performance.now());
                    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
                        found = true;
                        outLandmarks.set(result.faceLandmarks);
                        if (inOutputBlendshapes.get()) outBlendshapes.set(result.faceBlendshapes);
                        if (inOutputMatrix.get()) outMatrices.set(result.facialTransformationMatrixes);
                    } else {
                        outLandmarks.set(null);
                        outBlendshapes.set(null);
                        outMatrices.set(null);
                    }
                } catch (e) {}
            }
        }
    }
    outFound.set(found);
    next.trigger();
};

if (inActive.get()) setTimeout(initFace, 500);
