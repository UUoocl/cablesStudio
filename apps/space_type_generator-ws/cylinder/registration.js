/**
 * STG Cylinder - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables WebSocket Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'stg-cylinder';
var customClientId = urlParams.get('clientID') || urlParams.get('clientId') || urlParams.get('clientid');
var CLIENT_ID = (customClientId && customClientId.trim()) ? customClientId.trim() : defaultClientId;
var originId = `${CLIENT_ID}-${Math.random().toString(36).substring(2, 9)}`;

window.CLIENT_ID = CLIENT_ID;
window.originId = originId;

// Determine initial preset from query parameter if provided
var initialPresetParam = urlParams.get('preset') || urlParams.get('p');
var initialPreset = "simple";
if (initialPresetParam && typeof customPresets !== 'undefined') {
    const pLower = initialPresetParam.toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey) {
        initialPreset = matchedKey;
    }
}

// Central configuration synced with Dashboard / Cables
window.cylinderConfig = {
    text: "SPACE-TYPE-GENERATOR",
    preset: initialPreset,
    hideNoText: false,

    radius: 250,
    stackNum: 1,
    stackHeightAdjust: 0,
    rRotate: -5,
    rOffset: 0,

    rWaveCount: 2,
    rWaveSpeed: 0,
    rWave: 0,
    rZaxis: 0,
    rLong: 0,

    typeX: 20,
    typeY: 40,
    typeStroke: 2,
    strecherX: 0,
    strecherY: 0,
    xRotTweak: 0,
    yRotTweak: 0,
    zRotTweak: 0,

    xRotCamera: 15,
    yRotCamera: 0,
    zRotCamera: 0,
    zoomCamera: 0,

    bkgdColor: "#ffffff00",
    color1: "#000000",
    color2: "#ff8c00",
    color3: "#ffef00",
    color4: "#00811f",
    color5: "#0044ff",
    color6: "#760089",
    inpNumber: 1,

    clearTextDelay: 0,
    clearMethod: "all at once",
    seqInterval: 100
};

function rgbToHex(rgb) {
    if (!rgb) return '#ffffff';
    if (typeof rgb === 'string') {
        if (rgb.startsWith('#')) return rgb;
        return rgb;
    }
    if (rgb && Array.isArray(rgb.levels)) {
        rgb = rgb.levels;
    }
    if (Array.isArray(rgb) && rgb.length >= 3) {
        const hasAlpha = rgb.length >= 4 && rgb[3] !== undefined;
        const sliceCount = (hasAlpha && rgb[3] !== 255 && rgb[3] !== 1) ? 4 : 3;
        return '#' + rgb.slice(0, sliceCount).map(v => {
            const clamped = Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
            return clamped.toString(16).padStart(2, '0');
        }).join('');
    }
    if (typeof rgb === 'object' && typeof rgb.r === 'number') {
        const arr = [rgb.r, rgb.g, rgb.b];
        if (typeof rgb.a === 'number' && rgb.a < 255) arr.push(rgb.a <= 1 ? Math.round(rgb.a * 255) : rgb.a);
        return rgbToHex(arr);
    }
    return String(rgb);
}

function parseColor(val) {
    if (val === undefined || val === null) return null;
    if (typeof val === 'number') {
        const hex = (val >>> 0).toString(16).padStart(val > 0xffffff ? 8 : 6, '0');
        return '#' + hex;
    }
    if (typeof val === 'string') {
        const clean = val.trim();
        if (clean.toLowerCase() === 'transparent') {
            return '#00000000';
        }
        if (clean.startsWith('#') || clean.startsWith('rgb') || clean.startsWith('hsl')) {
            return clean;
        }
        return '#' + clean;
    }
    if (Array.isArray(val) && val.length >= 3) {
        return rgbToHex(val);
    }
    if (typeof val === 'object' && typeof val.r === 'number') {
        return rgbToHex([val.r, val.g, val.b, val.a]);
    }
    return String(val);
}

function getRegistrationPayload() {
    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'p5',
            name: CLIENT_ID !== defaultClientId ? `STG Cylinder (${CLIENT_ID})` : 'STG Cylinder',
            parameters: {
                text: {
                    type: 'string',
                    value: String(window.cylinderConfig.text),
                    label: 'Text',
                    group: 'Content'
                },
                preset: {
                    type: 'string',
                    value: String(window.cylinderConfig.preset),
                    label: 'Preset',
                    group: 'Content',
                    options: {
                        'Simple': 'simple',
                        'Jellyfish': 'jellyfish',
                        'Crown': 'crown',
                        'Complex': 'complex',
                        'Weave': 'weave',
                        'Zebra': 'zebra',
                        'Hoops': 'hoops',
                        'Pride': 'pride',
                        'Reset': 'reset'
                    }
                },
                hideNoText: {
                    type: 'boolean',
                    value: Boolean(window.cylinderConfig.hideNoText),
                    label: 'Hide When Empty',
                    group: 'Content'
                },

                radius: {
                    type: 'float',
                    value: Number(window.cylinderConfig.radius),
                    min: 10,
                    max: 1000,
                    step: 1,
                    label: 'Radius',
                    group: 'Cylinder'
                },
                stackNum: {
                    type: 'int',
                    value: Math.round(Number(window.cylinderConfig.stackNum)),
                    min: 1,
                    max: 30,
                    step: 1,
                    label: 'Stack Count',
                    group: 'Cylinder'
                },
                stackHeightAdjust: {
                    type: 'float',
                    value: Number(window.cylinderConfig.stackHeightAdjust),
                    min: -100,
                    max: 100,
                    step: 1,
                    label: 'Stack Spacing',
                    group: 'Cylinder'
                },
                rRotate: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rRotate),
                    min: -100,
                    max: 100,
                    step: 0.5,
                    label: 'Rotation Speed',
                    group: 'Cylinder'
                },
                rOffset: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rOffset),
                    min: 0,
                    max: 1.57,
                    step: 0.01,
                    label: 'Ring Offset',
                    group: 'Cylinder'
                },

                rWaveCount: {
                    type: 'int',
                    value: Math.round(Number(window.cylinderConfig.rWaveCount)),
                    min: 0,
                    max: 10,
                    step: 1,
                    label: 'Wave Count',
                    group: 'Wave & Depth'
                },
                rWaveSpeed: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rWaveSpeed),
                    min: 0,
                    max: 100,
                    step: 1,
                    label: 'Wave Speed',
                    group: 'Wave & Depth'
                },
                rWave: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rWave),
                    min: 0,
                    max: 200,
                    step: 1,
                    label: 'Wave Latitude',
                    group: 'Wave & Depth'
                },
                rZaxis: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rZaxis),
                    min: 0,
                    max: 100,
                    step: 1,
                    label: 'Ripple / Z-Axis',
                    group: 'Wave & Depth'
                },
                rLong: {
                    type: 'float',
                    value: Number(window.cylinderConfig.rLong),
                    min: 0,
                    max: 100,
                    step: 1,
                    label: 'Depth / Longitude',
                    group: 'Wave & Depth'
                },

                typeX: {
                    type: 'float',
                    value: Number(window.cylinderConfig.typeX),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Width',
                    group: 'Typography'
                },
                typeY: {
                    type: 'float',
                    value: Number(window.cylinderConfig.typeY),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Height',
                    group: 'Typography'
                },
                typeStroke: {
                    type: 'float',
                    value: Number(window.cylinderConfig.typeStroke),
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    label: 'Type Stroke',
                    group: 'Typography'
                },
                strecherX: {
                    type: 'float',
                    value: Number(window.cylinderConfig.strecherX),
                    min: -50,
                    max: 80,
                    step: 1,
                    label: 'Stretch X',
                    group: 'Typography'
                },
                strecherY: {
                    type: 'float',
                    value: Number(window.cylinderConfig.strecherY),
                    min: -50,
                    max: 100,
                    step: 1,
                    label: 'Stretch Y',
                    group: 'Typography'
                },
                xRotTweak: {
                    type: 'float',
                    value: Number(window.cylinderConfig.xRotTweak),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'X-Tilt Tweak',
                    group: 'Typography'
                },
                yRotTweak: {
                    type: 'float',
                    value: Number(window.cylinderConfig.yRotTweak),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Y-Tilt Tweak',
                    group: 'Typography'
                },
                zRotTweak: {
                    type: 'float',
                    value: Number(window.cylinderConfig.zRotTweak),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Z-Tilt Tweak',
                    group: 'Typography'
                },

                xRotCamera: {
                    type: 'float',
                    value: Number(window.cylinderConfig.xRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Camera Pitch (X)',
                    group: 'Camera'
                },
                yRotCamera: {
                    type: 'float',
                    value: Number(window.cylinderConfig.yRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Camera Yaw (Y)',
                    group: 'Camera'
                },
                zRotCamera: {
                    type: 'float',
                    value: Number(window.cylinderConfig.zRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Camera Roll (Z)',
                    group: 'Camera'
                },
                zoomCamera: {
                    type: 'float',
                    value: Number(window.cylinderConfig.zoomCamera),
                    min: -1000,
                    max: 1000,
                    step: 10,
                    label: 'Camera Zoom',
                    group: 'Camera'
                },

                bkgdColor: {
                    type: 'color',
                    view: 'color',
                    color: { alpha: true },
                    alpha: true,
                    value: window.cylinderConfig.bkgdColor,
                    label: 'Background Color',
                    group: 'Colors'
                },
                color1: {
                    type: 'color',
                    value: window.cylinderConfig.color1,
                    label: 'Color 1 (Main)',
                    group: 'Colors'
                },
                color2: {
                    type: 'color',
                    value: window.cylinderConfig.color2,
                    label: 'Color 2',
                    group: 'Colors'
                },
                color3: {
                    type: 'color',
                    value: window.cylinderConfig.color3,
                    label: 'Color 3',
                    group: 'Colors'
                },
                color4: {
                    type: 'color',
                    value: window.cylinderConfig.color4,
                    label: 'Color 4',
                    group: 'Colors'
                },
                color5: {
                    type: 'color',
                    value: window.cylinderConfig.color5,
                    label: 'Color 5',
                    group: 'Colors'
                },
                color6: {
                    type: 'color',
                    value: window.cylinderConfig.color6,
                    label: 'Color 6',
                    group: 'Colors'
                },
                inpNumber: {
                    type: 'int',
                    value: window.cylinderConfig.inpNumber,
                    label: 'Color Mode',
                    group: 'Colors',
                    options: {
                        'Single Color': 1,
                        'Multi-Color (6 Slots)': 6
                    }
                },

                clearTextDelay: {
                    type: 'float',
                    value: Number(window.cylinderConfig.clearTextDelay),
                    min: 0,
                    max: 10000,
                    step: 100,
                    label: 'Clear Delay (ms)',
                    group: 'Text Clear'
                },
                clearMethod: {
                    type: 'string',
                    value: window.cylinderConfig.clearMethod,
                    label: 'Clear Method',
                    group: 'Text Clear',
                    options: {
                        'All at once': 'all at once',
                        'Sequential': 'sequential',
                        'Reverse Sequential': 'reverseSeq'
                    }
                },
                seqInterval: {
                    type: 'float',
                    value: Number(window.cylinderConfig.seqInterval),
                    min: 10,
                    max: 1000,
                    step: 10,
                    label: 'Sequence Interval (ms)',
                    group: 'Text Clear'
                }
            },
            subscriptions: {
                mouse: true,
                keyboard: true,
                stateUpdates: true
            }
        }
    };
}

function registerClient() {
    const payload = getRegistrationPayload();
    if (typeof sendPayload === 'function') {
        sendPayload(payload);
    }
}

function syncConfigFromSketch() {
    if (typeof inpText !== 'undefined') window.cylinderConfig.text = inpText;
    if (typeof hideNoText !== 'undefined') window.cylinderConfig.hideNoText = hideNoText;
    if (typeof clearTextDelay !== 'undefined') window.cylinderConfig.clearTextDelay = clearTextDelay;
    if (typeof clearMethod !== 'undefined') window.cylinderConfig.clearMethod = clearMethod;
    if (typeof seqInterval !== 'undefined') window.cylinderConfig.seqInterval = seqInterval;

    if (typeof radius !== 'undefined') window.cylinderConfig.radius = radius;
    if (typeof stackNum !== 'undefined') window.cylinderConfig.stackNum = stackNum;
    if (typeof stackHeightAdjust !== 'undefined') window.cylinderConfig.stackHeightAdjust = stackHeightAdjust;
    if (typeof rRotate !== 'undefined') window.cylinderConfig.rRotate = rRotate;
    if (typeof rOffset !== 'undefined') window.cylinderConfig.rOffset = rOffset;

    if (typeof rWaveCount !== 'undefined') window.cylinderConfig.rWaveCount = rWaveCount;
    if (typeof rWaveSpeed !== 'undefined') window.cylinderConfig.rWaveSpeed = rWaveSpeed;
    if (typeof rWave !== 'undefined') window.cylinderConfig.rWave = rWave;
    if (typeof rZaxis !== 'undefined') window.cylinderConfig.rZaxis = rZaxis;
    if (typeof rLong !== 'undefined') window.cylinderConfig.rLong = rLong;

    if (typeof strecherXsize !== 'undefined') window.cylinderConfig.strecherX = strecherXsize;
    if (typeof strecherYsize !== 'undefined') window.cylinderConfig.strecherY = strecherYsize;
    if (typeof typeX !== 'undefined') window.cylinderConfig.typeX = typeX;
    if (typeof typeY !== 'undefined') window.cylinderConfig.typeY = typeY;
    if (typeof typeStroke !== 'undefined') window.cylinderConfig.typeStroke = typeStroke;
    if (typeof xRotTweak !== 'undefined') window.cylinderConfig.xRotTweak = xRotTweak;
    if (typeof yRotTweak !== 'undefined') window.cylinderConfig.yRotTweak = yRotTweak;
    if (typeof zRotTweak !== 'undefined') window.cylinderConfig.zRotTweak = zRotTweak;

    if (typeof xRotCamera !== 'undefined') window.cylinderConfig.xRotCamera = xRotCamera;
    if (typeof yRotCamera !== 'undefined') window.cylinderConfig.yRotCamera = yRotCamera;
    if (typeof zRotCamera !== 'undefined') window.cylinderConfig.zRotCamera = zRotCamera;
    if (typeof zoomCamera !== 'undefined') window.cylinderConfig.zoomCamera = zoomCamera;

    if (typeof bkgdColor !== 'undefined' && bkgdColor) window.cylinderConfig.bkgdColor = rgbToHex(bkgdColor);
    if (typeof inp1 !== 'undefined' && inp1) window.cylinderConfig.color1 = rgbToHex(inp1);
    if (typeof inp2 !== 'undefined' && inp2) window.cylinderConfig.color2 = rgbToHex(inp2);
    if (typeof inp3 !== 'undefined' && inp3) window.cylinderConfig.color3 = rgbToHex(inp3);
    if (typeof inp4 !== 'undefined' && inp4) window.cylinderConfig.color4 = rgbToHex(inp4);
    if (typeof inp5 !== 'undefined' && inp5) window.cylinderConfig.color5 = rgbToHex(inp5);
    if (typeof inp6 !== 'undefined' && inp6) window.cylinderConfig.color6 = rgbToHex(inp6);
    if (typeof inpNumber !== 'undefined') window.cylinderConfig.inpNumber = inpNumber;
}

function notifyConfigChange() {
    const payload = {
        type: 'client:update',
        originId: originId,
        clientId: CLIENT_ID,
        parameters: { ...window.cylinderConfig }
    };
    if (typeof sendPayload === 'function') {
        sendPayload(payload);
    }
}

function applyParameterUpdates(params) {
    if (!params || typeof params !== 'object') return;

    // Preset selection
    if (params.preset !== undefined) {
        const p = String(params.preset).toLowerCase();
        window.cylinderConfig.preset = p;
        if (typeof customPresets !== 'undefined') {
            const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === p);
            if (matchedKey && typeof applyCustomPreset === 'function') {
                applyCustomPreset(customPresets[matchedKey]);
                syncConfigFromSketch();
                notifyConfigChange();
            } else if (p === 'reset' && typeof reSetting === 'function') {
                reSetting();
                syncConfigFromSketch();
                notifyConfigChange();
            }
        }
    }

    if (params.text !== undefined || params.string !== undefined) {
        inpText = params.text !== undefined ? String(params.text) : String(params.string);
        window.cylinderConfig.text = inpText;
        if (typeof millis === 'function') lastTextTime = millis();
        if (typeof isClearing !== 'undefined') isClearing = false;
    }
    if (params.hideNoText !== undefined) {
        hideNoText = Boolean(params.hideNoText) || params.hideNoText === 'true';
        window.cylinderConfig.hideNoText = hideNoText;
    }
    if (params.clearTextDelay !== undefined) {
        clearTextDelay = Number(params.clearTextDelay);
        window.cylinderConfig.clearTextDelay = clearTextDelay;
    }
    if (params.clearMethod !== undefined) {
        clearMethod = String(params.clearMethod);
        window.cylinderConfig.clearMethod = clearMethod;
    }
    if (params.seqInterval !== undefined) {
        seqInterval = Number(params.seqInterval);
        window.cylinderConfig.seqInterval = seqInterval;
    }

    if (params.radius !== undefined) {
        radius = Number(params.radius);
        window.cylinderConfig.radius = radius;
    }
    if (params.stackNum !== undefined) {
        stackNum = Math.max(1, Math.round(Number(params.stackNum)));
        window.cylinderConfig.stackNum = stackNum;
    }
    if (params.stackHeightAdjust !== undefined) {
        stackHeightAdjust = Number(params.stackHeightAdjust);
        window.cylinderConfig.stackHeightAdjust = stackHeightAdjust;
    }
    if (params.rRotate !== undefined) {
        rRotate = Number(params.rRotate);
        window.cylinderConfig.rRotate = rRotate;
    }
    if (params.rOffset !== undefined) {
        rOffset = Number(params.rOffset);
        window.cylinderConfig.rOffset = rOffset;
    }

    if (params.rWaveCount !== undefined) {
        rWaveCount = Math.max(0, Math.round(Number(params.rWaveCount)));
        window.cylinderConfig.rWaveCount = rWaveCount;
    }
    if (params.rWaveSpeed !== undefined) {
        rWaveSpeed = Number(params.rWaveSpeed);
        window.cylinderConfig.rWaveSpeed = rWaveSpeed;
    }
    if (params.rWave !== undefined) {
        rWave = Number(params.rWave);
        window.cylinderConfig.rWave = rWave;
    }
    if (params.rZaxis !== undefined) {
        rZaxis = Number(params.rZaxis);
        window.cylinderConfig.rZaxis = rZaxis;
    }
    if (params.rLong !== undefined) {
        rLong = Number(params.rLong);
        window.cylinderConfig.rLong = rLong;
    }

    if (params.strecherX !== undefined) {
        strecherXsize = Number(params.strecherX);
        window.cylinderConfig.strecherX = strecherXsize;
    }
    if (params.strecherY !== undefined) {
        strecherYsize = Number(params.strecherY);
        window.cylinderConfig.strecherY = strecherYsize;
    }
    if (params.typeX !== undefined) {
        typeX = Number(params.typeX);
        window.cylinderConfig.typeX = typeX;
    }
    if (params.typeY !== undefined) {
        typeY = Number(params.typeY);
        window.cylinderConfig.typeY = typeY;
    }
    if (params.typeStroke !== undefined) {
        typeStroke = Number(params.typeStroke);
        window.cylinderConfig.typeStroke = typeStroke;
    }
    if (params.xRotTweak !== undefined) {
        xRotTweak = Number(params.xRotTweak);
        window.cylinderConfig.xRotTweak = xRotTweak;
    }
    if (params.yRotTweak !== undefined) {
        yRotTweak = Number(params.yRotTweak);
        window.cylinderConfig.yRotTweak = yRotTweak;
    }
    if (params.zRotTweak !== undefined) {
        zRotTweak = Number(params.zRotTweak);
        window.cylinderConfig.zRotTweak = zRotTweak;
    }

    if (params.xRotCamera !== undefined) {
        xRotCamera = Number(params.xRotCamera);
        window.cylinderConfig.xRotCamera = xRotCamera;
    }
    if (params.yRotCamera !== undefined) {
        yRotCamera = Number(params.yRotCamera);
        window.cylinderConfig.yRotCamera = yRotCamera;
    }
    if (params.zRotCamera !== undefined) {
        zRotCamera = Number(params.zRotCamera);
        window.cylinderConfig.zRotCamera = zRotCamera;
    }
    if (params.zoomCamera !== undefined) {
        zoomCamera = Number(params.zoomCamera);
        window.cylinderConfig.zoomCamera = zoomCamera;
    }

    if (params.bkgdColor !== undefined) {
        const c = parseColor(params.bkgdColor);
        if (c && typeof color === 'function') bkgdColor = color(c);
        window.cylinderConfig.bkgdColor = c || params.bkgdColor;
    }
    if (params.color1 !== undefined) {
        const c = parseColor(params.color1);
        if (c && typeof color === 'function') inp1 = color(c);
        window.cylinderConfig.color1 = c || params.color1;
    }
    if (params.color2 !== undefined) {
        const c = parseColor(params.color2);
        if (c && typeof color === 'function') inp2 = color(c);
        window.cylinderConfig.color2 = c || params.color2;
    }
    if (params.color3 !== undefined) {
        const c = parseColor(params.color3);
        if (c && typeof color === 'function') inp3 = color(c);
        window.cylinderConfig.color3 = c || params.color3;
    }
    if (params.color4 !== undefined) {
        const c = parseColor(params.color4);
        if (c && typeof color === 'function') inp4 = color(c);
        window.cylinderConfig.color4 = c || params.color4;
    }
    if (params.color5 !== undefined) {
        const c = parseColor(params.color5);
        if (c && typeof color === 'function') inp5 = color(c);
        window.cylinderConfig.color5 = c || params.color5;
    }
    if (params.color6 !== undefined) {
        const c = parseColor(params.color6);
        if (c && typeof color === 'function') inp6 = color(c);
        window.cylinderConfig.color6 = c || params.color6;
    }
    if (params.inpNumber !== undefined) {
        inpNumber = Number(params.inpNumber) === 6 ? 6 : 1;
        window.cylinderConfig.inpNumber = inpNumber;
    }
}
