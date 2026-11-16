/**
 * STG Field - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables WebSocket Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'stg-field';
var customClientId = urlParams.get('clientID') || urlParams.get('clientId') || urlParams.get('clientid');
var CLIENT_ID = (customClientId && customClientId.trim()) ? customClientId.trim() : defaultClientId;
var originId = `${CLIENT_ID}-${Math.random().toString(36).substring(2, 9)}`;

window.CLIENT_ID = CLIENT_ID;
window.originId = originId;

// Determine initial preset from query parameter if provided
var initialPresetParam = urlParams.get('preset') || urlParams.get('p');
var initialPreset = "default";
if (initialPresetParam && typeof customPresets !== 'undefined') {
    const pLower = initialPresetParam.toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey) {
        initialPreset = matchedKey;
    }
}

// Determine initial text input mode and STT channel from query parameters
var initialTextInputParam = (urlParams.get('textInput') || urlParams.get('input') || 'keyboard').trim().toLowerCase();
var initialTextInputMode = (initialTextInputParam === 'stt' || initialTextInputParam === 'both') ? initialTextInputParam : 'keyboard';
var initialSttChannel = (urlParams.get('channel') || urlParams.get('sttChannel') || '').trim();

// Central configuration synced with Dashboard / Cables
window.fieldConfig = {
    text: "EVERYTHING IS STRANGE. THINGS ARE HUGE AND VERY SMALL.",
    preset: initialPreset,
    fullText: true,
    hideNoText: false,
    textInputMode: initialTextInputMode,
    sttChannel: initialSttChannel,

    column: 33,
    row: 7,
    tracking: 5,
    lineSpace: 5,

    typeX: 20,
    typeY: 40,
    typeStroke: 2,

    speed: -2,
    xOffset: 3.1,
    yOffset: 3.1,
    zWave: 0,
    zWaveChecked: false,
    xWave: 0,
    xWaveChecked: false,
    yWave: 0,
    yWaveChecked: false,
    yWavezRot: 0,
    yWavexStr: 0,
    xStrechWave: 0,
    xStrechWaveChecked: false,
    yStrechWave: 0,
    yStrechWaveChecked: false,

    xRotCamera: 0,
    yRotCamera: 0,
    zRotCamera: 0,
    zoomCamera: 0,

    bkgdColor: "#ffffff00",
    color1: "#000000",
    color2: "#ff0000",
    color3: "#0000ff",
    color4: "#ffff00",
    color5: "#ffffff",
    color6: "#760089",
    inpNumber: 1,

    clearTextDelay: 0,
    clearMethod: "all at once",
    seqInterval: 100,
    animateSlidersToZero: false
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

function buildPresetOptions(baseOptions) {
    const opts = Object.assign({}, baseOptions);
    if (typeof customPresets !== 'undefined' && customPresets && typeof customPresets === 'object') {
        const existingValues = new Set(Object.values(opts).map(v => String(v).toLowerCase()));
        Object.keys(customPresets).forEach((key) => {
            if (!existingValues.has(key.toLowerCase())) {
                opts[key] = key;
            }
        });
    }
    if ('Reset' in opts) {
        const resetVal = opts['Reset'];
        delete opts['Reset'];
        opts['Reset'] = resetVal;
    } else {
        opts['Reset'] = 'reset';
    }
    return opts;
}

function getRegistrationPayload() {
    const cfg = window.fieldConfig;
    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'p5',
            appType: 'field',
            presetFile: 'apps/space_type_generator-ws/field/preset.js',
            name: CLIENT_ID !== defaultClientId ? `STG Field (${CLIENT_ID})` : 'STG Field',
            parameters: {
                text: {
                    type: 'string',
                    value: String(cfg.text),
                    label: 'Text',
                    group: 'Content'
                },
                textInputMode: {
                    type: 'string',
                    value: String(cfg.textInputMode),
                    label: 'Text Input',
                    group: 'Content',
                    options: {
                        'Keyboard': 'keyboard',
                        'Speech-to-Text (STT)': 'stt',
                        'Both (Keyboard + STT)': 'both'
                    }
                },
                sttChannel: {
                    type: 'string',
                    value: String(cfg.sttChannel || ''),
                    label: 'STT Channel',
                    group: 'Content'
                },
                preset: {
                    type: 'string',
                    value: String(cfg.preset),
                    label: 'Preset',
                    group: 'Content',
                    options: buildPresetOptions({
                        'Default': 'default',
                        'Stacks': 'stacks',
                        'Bricks': 'bricks',
                        'Simple Z': 'simplez',
                        'Complex Z': 'complexz',
                        'Zebra': 'zebra',
                        'Harlequin': 'harlequin',
                        'Pride': 'pride',
                        'Reset': 'reset'
                    })
                },
                fullText: {
                    type: 'boolean',
                    value: Boolean(cfg.fullText),
                    label: 'Fill Grid',
                    group: 'Content'
                },
                hideNoText: {
                    type: 'boolean',
                    value: Boolean(cfg.hideNoText),
                    label: 'Hide Empty',
                    group: 'Content'
                },
                column: {
                    type: 'int',
                    value: Number(cfg.column),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Columns',
                    group: 'Grid'
                },
                row: {
                    type: 'int',
                    value: Number(cfg.row),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Rows',
                    group: 'Grid'
                },
                tracking: {
                    type: 'float',
                    value: Number(cfg.tracking),
                    min: -10,
                    max: 100,
                    step: 1,
                    label: 'Tracking',
                    group: 'Grid'
                },
                lineSpace: {
                    type: 'float',
                    value: Number(cfg.lineSpace),
                    min: -10,
                    max: 100,
                    step: 0.5,
                    label: 'Line Space',
                    group: 'Grid'
                },
                typeX: {
                    type: 'float',
                    value: Number(cfg.typeX),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Width',
                    group: 'Typography'
                },
                typeY: {
                    type: 'float',
                    value: Number(cfg.typeY),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Height',
                    group: 'Typography'
                },
                typeStroke: {
                    type: 'float',
                    value: Number(cfg.typeStroke),
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    label: 'Stroke Weight',
                    group: 'Typography'
                },
                speed: {
                    type: 'float',
                    value: Number(cfg.speed),
                    min: -10,
                    max: 10,
                    step: 0.5,
                    label: 'Speed',
                    group: 'Wave'
                },
                xOffset: {
                    type: 'float',
                    value: Number(cfg.xOffset),
                    min: 0.1,
                    max: 60,
                    step: 0.1,
                    label: 'X Offset',
                    group: 'Wave'
                },
                yOffset: {
                    type: 'float',
                    value: Number(cfg.yOffset),
                    min: 0.1,
                    max: 60,
                    step: 0.1,
                    label: 'Y Offset',
                    group: 'Wave'
                },
                zWave: {
                    type: 'float',
                    value: Number(cfg.zWave),
                    min: 0,
                    max: 200,
                    step: 1,
                    label: 'Z Wave',
                    group: 'Wave'
                },
                zWaveChecked: {
                    type: 'boolean',
                    value: Boolean(cfg.zWaveChecked),
                    label: 'Z Phase Offset',
                    group: 'Wave'
                },
                xWave: {
                    type: 'float',
                    value: Number(cfg.xWave),
                    min: 0,
                    max: 200,
                    step: 1,
                    label: 'X Wave',
                    group: 'Wave'
                },
                xWaveChecked: {
                    type: 'boolean',
                    value: Boolean(cfg.xWaveChecked),
                    label: 'X Phase Offset',
                    group: 'Wave'
                },
                yWave: {
                    type: 'float',
                    value: Number(cfg.yWave),
                    min: 0,
                    max: 200,
                    step: 1,
                    label: 'Y Wave',
                    group: 'Wave'
                },
                yWaveChecked: {
                    type: 'boolean',
                    value: Boolean(cfg.yWaveChecked),
                    label: 'Y Phase Offset',
                    group: 'Wave'
                },
                yWavezRot: {
                    type: 'float',
                    value: Number(cfg.yWavezRot),
                    min: 0,
                    max: 60,
                    step: 1,
                    label: 'Z Smooth Rot',
                    group: 'Wave'
                },
                yWavexStr: {
                    type: 'float',
                    value: Number(cfg.yWavexStr),
                    min: 0,
                    max: 60,
                    step: 1,
                    label: 'X Wave Stretch',
                    group: 'Wave'
                },
                xStrechWave: {
                    type: 'float',
                    value: Number(cfg.xStrechWave),
                    min: 0,
                    max: 100,
                    step: 1,
                    label: 'X Stretch Wave',
                    group: 'Wave'
                },
                xStrechWaveChecked: {
                    type: 'boolean',
                    value: Boolean(cfg.xStrechWaveChecked),
                    label: 'X Stretch Offset',
                    group: 'Wave'
                },
                yStrechWave: {
                    type: 'float',
                    value: Number(cfg.yStrechWave),
                    min: 0,
                    max: 100,
                    step: 1,
                    label: 'Y Stretch Wave',
                    group: 'Wave'
                },
                yStrechWaveChecked: {
                    type: 'boolean',
                    value: Boolean(cfg.yStrechWaveChecked),
                    label: 'Y Stretch Offset',
                    group: 'Wave'
                },
                xRotCamera: {
                    type: 'float',
                    value: Number(cfg.xRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Cam Rot X',
                    group: 'Camera'
                },
                yRotCamera: {
                    type: 'float',
                    value: Number(cfg.yRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Cam Rot Y',
                    group: 'Camera'
                },
                zRotCamera: {
                    type: 'float',
                    value: Number(cfg.zRotCamera),
                    min: -180,
                    max: 180,
                    step: 1,
                    label: 'Cam Rot Z',
                    group: 'Camera'
                },
                zoomCamera: {
                    type: 'float',
                    value: Number(cfg.zoomCamera),
                    min: -500,
                    max: 500,
                    step: 5,
                    label: 'Cam Zoom',
                    group: 'Camera'
                },
                bkgdColor: {
                    type: 'color',
                    value: String(cfg.bkgdColor),
                    label: 'Background',
                    group: 'Colors'
                },
                color1: {
                    type: 'color',
                    value: String(cfg.color1),
                    label: 'Color 1',
                    group: 'Colors'
                },
                color2: {
                    type: 'color',
                    value: String(cfg.color2),
                    label: 'Color 2',
                    group: 'Colors'
                },
                color3: {
                    type: 'color',
                    value: String(cfg.color3),
                    label: 'Color 3',
                    group: 'Colors'
                },
                color4: {
                    type: 'color',
                    value: String(cfg.color4),
                    label: 'Color 4',
                    group: 'Colors'
                },
                color5: {
                    type: 'color',
                    value: String(cfg.color5),
                    label: 'Color 5',
                    group: 'Colors'
                },
                color6: {
                    type: 'color',
                    value: String(cfg.color6),
                    label: 'Color 6',
                    group: 'Colors'
                },
                inpNumber: {
                    type: 'int',
                    value: Number(cfg.inpNumber),
                    min: 1,
                    max: 6,
                    step: 1,
                    label: 'Color Count',
                    group: 'Colors'
                },
                clearTextDelay: {
                    type: 'int',
                    value: Number(cfg.clearTextDelay),
                    min: 0,
                    max: 60000,
                    step: 250,
                    label: 'Clear Delay (ms)',
                    group: 'Text Clear'
                },
                clearMethod: {
                    type: 'string',
                    value: String(cfg.clearMethod),
                    label: 'Clear Method',
                    group: 'Text Clear',
                    options: {
                        'All At Once': 'all at once',
                        'Sequential': 'sequential',
                        'Reverse Seq': 'reverseSeq'
                    }
                },
                seqInterval: {
                    type: 'int',
                    value: Number(cfg.seqInterval),
                    min: 10,
                    max: 2000,
                    step: 10,
                    label: 'Seq Interval (ms)',
                    group: 'Text Clear'
                },
                animateSlidersToZero: {
                    type: 'boolean',
                    value: Boolean(cfg.animateSlidersToZero),
                    label: 'Animate Sliders to 0',
                    group: 'Text Clear'
                }
            },
            subscriptions: {
                mouse: true,
                keyboard: cfg.textInputMode !== 'stt',
                stt: cfg.textInputMode !== 'keyboard',
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
    const cfg = window.fieldConfig;
    if (typeof inpText !== 'undefined') cfg.text = inpText;
    if (typeof fullText !== 'undefined') cfg.fullText = fullText;
    if (typeof hideNoText !== 'undefined') cfg.hideNoText = hideNoText;
    if (typeof clearTextDelay !== 'undefined') cfg.clearTextDelay = clearTextDelay;
    if (typeof clearMethod !== 'undefined') cfg.clearMethod = clearMethod;
    if (typeof seqInterval !== 'undefined') cfg.seqInterval = seqInterval;
    if (typeof animateSlidersToZero !== 'undefined') cfg.animateSlidersToZero = animateSlidersToZero;

    if (typeof column !== 'undefined') cfg.column = column;
    if (typeof row !== 'undefined') cfg.row = row;
    if (typeof tracking !== 'undefined') cfg.tracking = tracking;
    if (typeof lineSpace !== 'undefined') cfg.lineSpace = lineSpace;

    if (typeof typeX !== 'undefined') cfg.typeX = typeX;
    if (typeof typeY !== 'undefined') cfg.typeY = typeY;
    if (typeof typeStroke !== 'undefined') cfg.typeStroke = typeStroke;

    if (typeof speed !== 'undefined') cfg.speed = speed;
    if (typeof xOffset !== 'undefined') cfg.xOffset = xOffset;
    if (typeof yOffset !== 'undefined') cfg.yOffset = yOffset;
    if (typeof zWave !== 'undefined') cfg.zWave = zWave;
    if (typeof zWaveChecked !== 'undefined') cfg.zWaveChecked = Boolean(zWaveChecked);
    if (typeof xWave !== 'undefined') cfg.xWave = xWave;
    if (typeof xWaveChecked !== 'undefined') cfg.xWaveChecked = Boolean(xWaveChecked);
    if (typeof yWave !== 'undefined') cfg.yWave = yWave;
    if (typeof yWaveChecked !== 'undefined') cfg.yWaveChecked = Boolean(yWaveChecked);
    if (typeof yWavezRot !== 'undefined') cfg.yWavezRot = yWavezRot;
    if (typeof yWavexStr !== 'undefined') cfg.yWavexStr = yWavexStr;
    if (typeof xStrechWave !== 'undefined') cfg.xStrechWave = xStrechWave;
    if (typeof xStrechWaveChecked !== 'undefined') cfg.xStrechWaveChecked = Boolean(xStrechWaveChecked);
    if (typeof yStrechWave !== 'undefined') cfg.yStrechWave = yStrechWave;
    if (typeof yStrechWaveChecked !== 'undefined') cfg.yStrechWaveChecked = Boolean(yStrechWaveChecked);

    if (typeof xRotCamera !== 'undefined') cfg.xRotCamera = xRotCamera;
    if (typeof yRotCamera !== 'undefined') cfg.yRotCamera = yRotCamera;
    if (typeof zRotCamera !== 'undefined') cfg.zRotCamera = zRotCamera;
    if (typeof zoomCamera !== 'undefined') cfg.zoomCamera = zoomCamera;

    if (typeof bkgdColor !== 'undefined' && bkgdColor) cfg.bkgdColor = rgbToHex(bkgdColor);
    if (typeof inp1 !== 'undefined' && inp1) cfg.color1 = rgbToHex(inp1);
    if (typeof inp2 !== 'undefined' && inp2) cfg.color2 = rgbToHex(inp2);
    if (typeof inp3 !== 'undefined' && inp3) cfg.color3 = rgbToHex(inp3);
    if (typeof inp4 !== 'undefined' && inp4) cfg.color4 = rgbToHex(inp4);
    if (typeof inp5 !== 'undefined' && inp5) cfg.color5 = rgbToHex(inp5);
    if (typeof inp6 !== 'undefined' && inp6) cfg.color6 = rgbToHex(inp6);
    if (typeof inpNumber !== 'undefined') cfg.inpNumber = inpNumber;
}

function notifyConfigChange() {
    const payload = {
        type: 'client:update',
        originId: originId,
        clientId: CLIENT_ID,
        parameters: { ...window.fieldConfig }
    };
    if (typeof sendPayload === 'function') {
        sendPayload(payload);
    }
}

function applyParameterUpdates(params) {
    if (!params || typeof params !== 'object') return;
    const cfg = window.fieldConfig;

    // Preset selection
    if (params.preset !== undefined) {
        const p = String(params.preset).toLowerCase();
        cfg.preset = p;
        if (typeof customPresets !== 'undefined') {
            const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === p);
            if (matchedKey && typeof applyCustomPreset === 'function') {
                applyCustomPreset(customPresets[matchedKey]);
            }
        }
        if (p === 'reset' && typeof reSetting === 'function') {
            reSetting();
            syncConfigFromSketch();
        }
    }

    // Text Content
    const newText = params.text !== undefined ? params.text : params.inpText;
    if (newText !== undefined) {
        if (typeof inpText !== 'undefined') inpText = String(newText);
        cfg.text = String(newText);
        if (typeof millis === 'function' && typeof lastTextTime !== 'undefined') {
            lastTextTime = millis();
            isClearing = false;
        }
        if (typeof restoreSlidersFromClear === 'function') restoreSlidersFromClear();
    }

    if (params.fullText !== undefined) {
        const val = Boolean(params.fullText);
        if (typeof fullText !== 'undefined') fullText = val;
        cfg.fullText = val;
    }

    if (params.hideNoText !== undefined) {
        const val = Boolean(params.hideNoText);
        if (typeof hideNoText !== 'undefined') hideNoText = val;
        cfg.hideNoText = val;
    }

    if (params.textInputMode !== undefined) {
        const mode = String(params.textInputMode).trim().toLowerCase();
        cfg.textInputMode = (mode === 'stt' || mode === 'both') ? mode : 'keyboard';
    }
    if (params.sttChannel !== undefined) {
        cfg.sttChannel = String(params.sttChannel).trim();
    }

    // Grid
    if (params.column !== undefined && !isNaN(Number(params.column))) {
        const v = Math.max(1, Math.round(Number(params.column)));
        if (typeof column !== 'undefined') column = v;
        cfg.column = v;
    }
    if (params.row !== undefined && !isNaN(Number(params.row))) {
        const v = Math.max(1, Math.round(Number(params.row)));
        if (typeof row !== 'undefined') row = v;
        cfg.row = v;
    }
    if (params.tracking !== undefined && !isNaN(Number(params.tracking))) {
        const v = Number(params.tracking);
        if (typeof tracking !== 'undefined') tracking = v;
        cfg.tracking = v;
    }
    if (params.lineSpace !== undefined && !isNaN(Number(params.lineSpace))) {
        const v = Number(params.lineSpace);
        if (typeof lineSpace !== 'undefined') lineSpace = v;
        cfg.lineSpace = v;
    }

    // Typography
    if (params.typeX !== undefined && !isNaN(Number(params.typeX))) {
        const v = Number(params.typeX);
        if (typeof typeX !== 'undefined') typeX = v;
        cfg.typeX = v;
    }
    if (params.typeY !== undefined && !isNaN(Number(params.typeY))) {
        const v = Number(params.typeY);
        if (typeof typeY !== 'undefined') typeY = v;
        cfg.typeY = v;
    }
    if (params.typeStroke !== undefined && !isNaN(Number(params.typeStroke))) {
        const v = Number(params.typeStroke);
        if (typeof typeStroke !== 'undefined') typeStroke = v;
        cfg.typeStroke = v;
    }

    // Wave
    if (params.speed !== undefined && !isNaN(Number(params.speed))) {
        const v = Number(params.speed);
        if (typeof speed !== 'undefined') speed = v;
        cfg.speed = v;
    }
    if (params.xOffset !== undefined && !isNaN(Number(params.xOffset))) {
        const v = Number(params.xOffset);
        if (typeof xOffset !== 'undefined') xOffset = v;
        cfg.xOffset = v;
    }
    if (params.yOffset !== undefined && !isNaN(Number(params.yOffset))) {
        const v = Number(params.yOffset);
        if (typeof yOffset !== 'undefined') yOffset = v;
        cfg.yOffset = v;
    }
    if (params.zWave !== undefined && !isNaN(Number(params.zWave))) {
        const v = Number(params.zWave);
        if (typeof zWave !== 'undefined') zWave = v;
        cfg.zWave = v;
    }
    if (params.zWaveChecked !== undefined) {
        const b = Boolean(params.zWaveChecked);
        if (typeof zWaveChecked !== 'undefined') zWaveChecked = b ? Math.PI : 0;
        cfg.zWaveChecked = b;
    }
    if (params.xWave !== undefined && !isNaN(Number(params.xWave))) {
        const v = Number(params.xWave);
        if (typeof xWave !== 'undefined') xWave = v;
        cfg.xWave = v;
    }
    if (params.xWaveChecked !== undefined) {
        const b = Boolean(params.xWaveChecked);
        if (typeof xWaveChecked !== 'undefined') xWaveChecked = b ? Math.PI : 0;
        cfg.xWaveChecked = b;
    }
    if (params.yWave !== undefined && !isNaN(Number(params.yWave))) {
        const v = Number(params.yWave);
        if (typeof yWave !== 'undefined') yWave = v;
        cfg.yWave = v;
    }
    if (params.yWaveChecked !== undefined) {
        const b = Boolean(params.yWaveChecked);
        if (typeof yWaveChecked !== 'undefined') yWaveChecked = b ? Math.PI : 0;
        cfg.yWaveChecked = b;
    }
    if (params.yWavezRot !== undefined && !isNaN(Number(params.yWavezRot))) {
        const v = Number(params.yWavezRot);
        if (typeof yWavezRot !== 'undefined') yWavezRot = v;
        cfg.yWavezRot = v;
    }
    if (params.yWavexStr !== undefined && !isNaN(Number(params.yWavexStr))) {
        const v = Number(params.yWavexStr);
        if (typeof yWavexStr !== 'undefined') yWavexStr = v;
        cfg.yWavexStr = v;
    }
    if (params.xStrechWave !== undefined && !isNaN(Number(params.xStrechWave))) {
        const v = Number(params.xStrechWave);
        if (typeof xStrechWave !== 'undefined') xStrechWave = v;
        cfg.xStrechWave = v;
    }
    if (params.xStrechWaveChecked !== undefined) {
        const b = Boolean(params.xStrechWaveChecked);
        if (typeof xStrechWaveChecked !== 'undefined') xStrechWaveChecked = b ? Math.PI / 2 : 0;
        cfg.xStrechWaveChecked = b;
    }
    if (params.yStrechWave !== undefined && !isNaN(Number(params.yStrechWave))) {
        const v = Number(params.yStrechWave);
        if (typeof yStrechWave !== 'undefined') yStrechWave = v;
        cfg.yStrechWave = v;
    }
    if (params.yStrechWaveChecked !== undefined) {
        const b = Boolean(params.yStrechWaveChecked);
        if (typeof yStrechWaveChecked !== 'undefined') yStrechWaveChecked = b ? Math.PI / 2 : 0;
        cfg.yStrechWaveChecked = b;
    }

    // Camera
    if (params.xRotCamera !== undefined && !isNaN(Number(params.xRotCamera))) {
        const v = Number(params.xRotCamera);
        if (typeof xRotCamera !== 'undefined') xRotCamera = v;
        cfg.xRotCamera = v;
    }
    if (params.yRotCamera !== undefined && !isNaN(Number(params.yRotCamera))) {
        const v = Number(params.yRotCamera);
        if (typeof yRotCamera !== 'undefined') yRotCamera = v;
        cfg.yRotCamera = v;
    }
    if (params.zRotCamera !== undefined && !isNaN(Number(params.zRotCamera))) {
        const v = Number(params.zRotCamera);
        if (typeof zRotCamera !== 'undefined') zRotCamera = v;
        cfg.zRotCamera = v;
    }
    if (params.zoomCamera !== undefined && !isNaN(Number(params.zoomCamera))) {
        const v = Number(params.zoomCamera);
        if (typeof zoomCamera !== 'undefined') zoomCamera = v;
        cfg.zoomCamera = v;
    }

    // Colors
    if (params.bkgdColor !== undefined) {
        const colStr = parseColor(params.bkgdColor);
        if (colStr) {
            cfg.bkgdColor = colStr;
            if (typeof color === 'function') bkgdColor = color(colStr);
        }
    }
    const colorMap = [
        ['color1', 'inp1'],
        ['color2', 'inp2'],
        ['color3', 'inp3'],
        ['color4', 'inp4'],
        ['color5', 'inp5'],
        ['color6', 'inp6']
    ];
    colorMap.forEach(([paramKey, globalVar]) => {
        if (params[paramKey] !== undefined) {
            const colStr = parseColor(params[paramKey]);
            if (colStr) {
                cfg[paramKey] = colStr;
                if (typeof color === 'function') {
                    window[globalVar] = color(colStr);
                }
            }
        }
    });

    if (params.inpNumber !== undefined && !isNaN(Number(params.inpNumber))) {
        const v = Math.max(1, Math.min(6, Math.round(Number(params.inpNumber))));
        if (typeof inpNumber !== 'undefined') inpNumber = v;
        cfg.inpNumber = v;
    }

    // Text Clear
    if (params.clearTextDelay !== undefined && !isNaN(Number(params.clearTextDelay))) {
        const v = Math.max(0, Number(params.clearTextDelay));
        if (typeof clearTextDelay !== 'undefined') clearTextDelay = v;
        cfg.clearTextDelay = v;
        if (v <= 0) {
            if (typeof isClearing !== 'undefined') isClearing = false;
            if (typeof restoreSlidersFromClear === 'function') restoreSlidersFromClear();
        }
    }
    if (params.clearMethod !== undefined) {
        const m = String(params.clearMethod);
        if (typeof clearMethod !== 'undefined') clearMethod = m;
        cfg.clearMethod = m;
        if (m === 'all at once' && typeof restoreSlidersFromClear === 'function') {
            restoreSlidersFromClear();
        }
    }
    if (params.seqInterval !== undefined && !isNaN(Number(params.seqInterval))) {
        const v = Math.max(10, Number(params.seqInterval));
        if (typeof seqInterval !== 'undefined') seqInterval = v;
        cfg.seqInterval = v;
    }
    if (params.animateSlidersToZero !== undefined) {
        const val = Boolean(params.animateSlidersToZero) && params.animateSlidersToZero !== 'false';
        if (typeof animateSlidersToZero !== 'undefined') animateSlidersToZero = val;
        cfg.animateSlidersToZero = val;
        if (!val && typeof restoreSlidersFromClear === 'function') {
            restoreSlidersFromClear();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRegistrationPayload,
        registerClient,
        syncConfigFromSketch,
        applyParameterUpdates,
        rgbToHex,
        parseColor,
        buildPresetOptions
    };
}

