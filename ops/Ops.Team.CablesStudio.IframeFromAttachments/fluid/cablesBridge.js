window.LIVEMODE = false;
window.DATA = [];
window.SCENE_WIDTH = window.innerWidth || 800;
window.SCENE_HEIGHT = window.innerHeight || 600;

window.addEventListener("load", () => {
    // Listen to BroadcastChannel for landmarks data
    const channel = new BroadcastChannel("cables_iframe_channel");

    function handleDataChange(cablesData) {
        if (!cablesData) return;

        let rawLandmarks = null;
        if (cablesData.landmarks) {
            rawLandmarks = cablesData.landmarks;
        } else if (cablesData.poseLandmarks) {
            rawLandmarks = cablesData.poseLandmarks;
        } else if (cablesData.pose) {
            rawLandmarks = cablesData.pose;
        } else {
            rawLandmarks = cablesData;
        }

        // Normalize rawLandmarks into a 2D array of poses: [[{x, y, z}, ...]]
        let poses = null;
        if (Array.isArray(rawLandmarks) && rawLandmarks.length > 0) {
            if (Array.isArray(rawLandmarks[0])) {
                poses = rawLandmarks;
            } else if (typeof rawLandmarks[0] === 'object' && rawLandmarks[0] !== null) {
                poses = [rawLandmarks];
            }
        }

        if (poses) {
            window.LIVEMODE = true;
            window.DATA = poses;
        }
    }

    channel.onmessage = (e) => {
        if (e.data) {
            // 1. Direct-format: message payload is the landmarks array/object itself
            if (e.data.landmarks || e.data.poseLandmarks || e.data.pose || 
                (Array.isArray(e.data) && e.data.length > 0 && (e.data[0].x !== undefined || Array.isArray(e.data[0])))) {
                handleDataChange(e.data);
                return;
            }

            // 2. Standard Cables wrapper format (SET_VAR / SET_VARS)
            if (e.data.type === "SET_VAR" && e.data.key === "cablesData") {
                handleDataChange(e.data.value);
            } else if (e.data.type === "SET_VARS") {
                const vars = e.data.vars || {};
                if (vars.cablesData !== undefined) {
                    handleDataChange(vars.cablesData);
                }
                if (vars.width !== undefined) {
                    window.SCENE_WIDTH = vars.width;
                }
                if (vars.height !== undefined) {
                    window.SCENE_HEIGHT = vars.height;
                }
            }
        }
    };
});
