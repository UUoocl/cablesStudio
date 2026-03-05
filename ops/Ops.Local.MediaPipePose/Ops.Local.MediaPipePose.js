/**
 * MediaPipe Pose Landmarker Operator
 */

const
    inTrigger = op.inTrigger("Render"),
    inActive = op.inBool("Active", true),
    inVideo = op.inObject("Video Element"),
    inServerUrl = op.inString("Server URL", "http://127.0.0.1:8000"),
    inModelUrl = op.inString("Model Path", "/mediapipe/models/pose_landmarker_heavy.task"),
    inDelegate = op.inDropDown("Delegate", ["GPU", "CPU"], "GPU"),
    inNumPoses = op.inInt("Num Poses", 1),
    inMinDetectionConfidence = op.inFloat("Min Detection Confidence", 0.5),
    inMinTrackingConfidence = op.inFloat("Min Tracking Confidence", 0.5),

    next = op.outTrigger("Next"),
    outLandmarks = op.outObject("Landmarks"),
    outWorldLandmarks = op.outObject("World Landmarks"),
    outFound = op.outBool("Found", false),
    outLoaded = op.outBool("Loaded", false),
    outError = op.outString("Error");

let poseLandmarker = null;
let FilesetResolver = null;
let PoseLandmarker = null;
let lastVideoTime = -1;
let vision = null;

op.onDelete = () => {
    if (poseLandmarker) {
        poseLandmarker.close();
    }
};

inActive.onChange = 
inServerUrl.onChange =
inModelUrl.onChange =
inDelegate.onChange =
inNumPoses.onChange =
inMinDetectionConfidence.onChange =
inMinTrackingConfidence.onChange = () => {
    if (inActive.get()) initPose();
    else {
        if (poseLandmarker) {
            poseLandmarker.close();
            poseLandmarker = null;
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
        if (!check.ok && check.status !== 404) throw new Error("Server returned status " + check.status);
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

async function initPose() {
    outLoaded.set(false);
    outError.set("");

    if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
    }

    if (!inActive.get()) return;

    try {
        if (!vision) {
            vision = await loadVisionLibrary();
        }

        FilesetResolver = vision.FilesetResolver;
        PoseLandmarker = vision.PoseLandmarker;

        const baseUrl = inServerUrl.get();
        const wasmPath = baseUrl + "/mediapipe/wasm/";
        const modelPath = baseUrl + inModelUrl.get();

        const fileset = await FilesetResolver.forVisionTasks(wasmPath);

        poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: inDelegate.get()
            },
            runningMode: "VIDEO",
            numPoses: inNumPoses.get(),
            minPoseDetectionConfidence: inMinDetectionConfidence.get(),
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: inMinTrackingConfidence.get()
        });

        outLoaded.set(true);
    } catch (e) {
        console.error("[MediaPipePose] Init error:", e);
        outError.set("Init error: " + (e.message || String(e)));
    }
}

inTrigger.onTriggered = () => {
    let found = false;
    if (inActive.get() && poseLandmarker && inVideo.get()) {
        const video = inVideo.get();
        
        if (video && video.readyState >= 2) {
            const currentTime = video.currentTime;
            
            if (lastVideoTime !== currentTime) {
                lastVideoTime = currentTime;
                try {
                    const result = poseLandmarker.detectForVideo(video, performance.now());
                    
                    if (result && result.landmarks && result.landmarks.length > 0) {
                        found = true;
                        outLandmarks.set(result.landmarks);
                        outWorldLandmarks.set(result.worldLandmarks);
                    } else {
                        outLandmarks.set(null);
                        outWorldLandmarks.set(null);
                    }
                } catch (e) {
                    // console.error("[MediaPipePose] Detection error:", e);
                }
            }
        }
    }
    
    outFound.set(found);
    next.trigger();
};

if (inActive.get()) setTimeout(initPose, 500);
