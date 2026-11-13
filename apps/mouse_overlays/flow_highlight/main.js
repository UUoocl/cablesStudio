/**
 * Flow Highlight Overlay - Cables Engine Controller
 * Manages Cables.gl patch initialization, fluid simulation variables, and mouse tracking.
 */

var mousePosX = 0;
var mousePosY = 0;

function showError(initiator, ...args) {
    if (typeof CABLES !== 'undefined' && CABLES.logErrorConsole) {
        CABLES.logErrorConsole("[" + initiator + "]", ...args);
    } else {
        console.error("[" + initiator + "]", ...args);
    }
}

function patchInitialized(patch) {
}

function patchFinishedLoading(patch) {
    const varCanvasWidth = CABLES.patch.getVar("ColorWidth");
    const varCanvasHeight = CABLES.patch.getVar("ColorHeight");
    if (varCanvasWidth) varCanvasWidth.setValue(640);

    const monitorWidth = (Math.abs(displayXmin) + Math.abs(displayXmax));
    const monitorHeight = (Math.abs(displayYmin) + Math.abs(displayYmax));

    if (monitorWidth > 0 && varCanvasHeight) {
        const ratio = monitorHeight / monitorWidth;
        varCanvasHeight.setValue(640 * ratio);
    }

    const monitorsXmin = CABLES.patch.getVar("monitorsXmin");
    const monitorsXmax = CABLES.patch.getVar("monitorsXmax");
    const monitorsYmin = CABLES.patch.getVar("monitorsYmin");
    const monitorsYmax = CABLES.patch.getVar("monitorsYmax");
    if (monitorsXmin) monitorsXmin.setValue(displayXmin);
    if (monitorsXmax) monitorsXmax.setValue(displayXmax);
    if (monitorsYmin) monitorsYmin.setValue(displayYmin);
    if (monitorsYmax) monitorsYmax.setValue(displayYmax);

    // Apply preset from query param or initial config
    const params = (typeof urlParams !== 'undefined') ? urlParams : new URLSearchParams(window.location.search);
    const requestedPreset = params.get('preset') || params.get('p') || (window.flowHighlightConfig && window.flowHighlightConfig.preset);

    if (requestedPreset && typeof customPresets !== 'undefined') {
        const pLower = String(requestedPreset).toLowerCase();
        const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
        if (matchedKey && typeof applyCustomPreset === 'function') {
            applyCustomPreset(customPresets[matchedKey]);
            if (window.flowHighlightConfig) {
                window.flowHighlightConfig.preset = matchedKey;
            }
        }
    } else if (window.flowHighlightConfig) {
        applyParameterUpdates(window.flowHighlightConfig);
    }

    if (typeof signalReady === 'function') signalReady();
    if (typeof registerClient === 'function') registerClient();
}

function updateCablesBounds(minX, maxX, minY, maxY) {
    if (typeof CABLES !== 'undefined' && CABLES.patch) {
        const monitorsXmin = CABLES.patch.getVar("monitorsXmin");
        const monitorsXmax = CABLES.patch.getVar("monitorsXmax");
        const monitorsYmin = CABLES.patch.getVar("monitorsYmin");
        const monitorsYmax = CABLES.patch.getVar("monitorsYmax");
        if (monitorsXmin) monitorsXmin.setValue(minX);
        if (monitorsXmax) monitorsXmax.setValue(maxX);
        if (monitorsYmin) monitorsYmin.setValue(minY);
        if (monitorsYmax) monitorsYmax.setValue(maxY);

        const varCanvasHeight = CABLES.patch.getVar("ColorHeight");
        if (varCanvasHeight) {
            const monitorWidth = (Math.abs(minX) + Math.abs(maxX));
            const monitorHeight = (Math.abs(minY) + Math.abs(maxY));
            if (monitorWidth > 0) {
                const ratio = monitorHeight / monitorWidth;
                varCanvasHeight.setValue(640 * ratio);
            }
        }
    }
}

function updateMousePosition(x, y) {
    mousePosX = Math.round(x);
    mousePosY = Math.round(y);

    if (typeof CABLES !== 'undefined' && CABLES.patch) {
        const varMouseX = CABLES.patch.getVar("MouseInX");
        const varMouseY = CABLES.patch.getVar("MouseInY");
        if (varMouseX && varMouseY) {
            const currentValueX = varMouseX.getValue();
            const currentValueY = varMouseY.getValue();

            const varPreviousMouseX = CABLES.patch.getVar("prevMousePosX");
            const varPreviousMouseY = CABLES.patch.getVar("prevMousePosY");

            const varMouseMoving = CABLES.patch.getVar("MouseMoving");
            const varMouseDrag = CABLES.patch.getVar("MouseIsDragged");
            if (varMouseMoving) varMouseMoving.setValue(1);
            if (varMouseDrag) varMouseDrag.setValue(1);

            varMouseX.setValue(Number(mousePosX));
            varMouseY.setValue(Number(mousePosY));
            if (varPreviousMouseX) varPreviousMouseX.setValue(currentValueX);
            if (varPreviousMouseY) varPreviousMouseY.setValue(currentValueY);
            if (varMouseMoving) varMouseMoving.setValue(0);
            if (varMouseDrag) varMouseDrag.setValue(1);
        }
    }
}

function syncCablesFluidVariables(cfg) {
    if (typeof CABLES === 'undefined' || !CABLES.patch) return;

    if (typeof cfg.splatRadius === 'number') {
        const v = CABLES.patch.getVar("SplatRadius");
        if (v) v.setValue(cfg.splatRadius);
    }
    if (typeof cfg.splatForce === 'number') {
        const v = CABLES.patch.getVar("MouseSplatForce");
        if (v) v.setValue(cfg.splatForce);
    }
    if (typeof cfg.fluidVorticity === 'number') {
        const v = CABLES.patch.getVar("FluidVorticity");
        if (v) v.setValue(cfg.fluidVorticity);
    }
    if (typeof cfg.fluidPressure === 'number') {
        const v = CABLES.patch.getVar("FluidPressure");
        if (v) v.setValue(cfg.fluidPressure);
    }
    if (typeof cfg.colorDiffusion === 'number') {
        const v = CABLES.patch.getVar("FluidColorDiffusion");
        if (v) v.setValue(cfg.colorDiffusion);
    }
    if (typeof cfg.velocityDiffusion === 'number') {
        const v = CABLES.patch.getVar("FluidVelocityDiffusion");
        if (v) v.setValue(cfg.velocityDiffusion);
    }
}

function applyCustomPreset(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (!window.flowHighlightConfig) window.flowHighlightConfig = {};

    Object.assign(window.flowHighlightConfig, settings);
    syncCablesFluidVariables(window.flowHighlightConfig);
}

function applyParameterUpdates(params) {
    if (!params || typeof params !== 'object') return;
    if (!window.flowHighlightConfig) window.flowHighlightConfig = {};

    if (params.preset !== undefined && typeof customPresets !== 'undefined') {
        const pKey = String(params.preset).toLowerCase();
        const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pKey);
        if (matchedKey) {
            applyCustomPreset(customPresets[matchedKey]);
            window.flowHighlightConfig.preset = matchedKey;
        }
    }

    if (typeof params.splatRadius === 'number') window.flowHighlightConfig.splatRadius = params.splatRadius;
    if (typeof params.splatForce === 'number') window.flowHighlightConfig.splatForce = params.splatForce;
    if (typeof params.fluidVorticity === 'number') window.flowHighlightConfig.fluidVorticity = params.fluidVorticity;
    if (typeof params.fluidPressure === 'number') window.flowHighlightConfig.fluidPressure = params.fluidPressure;
    if (typeof params.colorDiffusion === 'number') window.flowHighlightConfig.colorDiffusion = params.colorDiffusion;
    if (typeof params.velocityDiffusion === 'number') window.flowHighlightConfig.velocityDiffusion = params.velocityDiffusion;
    if (params.splatColor !== undefined) window.flowHighlightConfig.splatColor = params.splatColor;

    syncCablesFluidVariables(window.flowHighlightConfig);
}

document.addEventListener("CABLES.jsLoaded", function (event) {
    CABLES.patch = new CABLES.Patch({
        patch: CABLES.exportedPatch,
        "prefixAssetPath": "",
        "assetPath": "../assets/",
        "jsPath": "../patches/",
        "glCanvasId": "glcanvas",
        "glCanvasResizeToWindow": true,
        "onError": showError,
        "onPatchLoaded": patchInitialized,
        "onFinishedLoading": patchFinishedLoading,
        "canvas": { "alpha": true, "premultipliedAlpha": true }
    });
});

const canvasEl = document.getElementById('glcanvas');
if (canvasEl) {
    canvasEl.addEventListener('touchmove', (e) => { e.preventDefault(); }, false);
}

