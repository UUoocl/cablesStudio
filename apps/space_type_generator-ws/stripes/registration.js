/**
 * STG Stripes - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables WebSocket Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'stg-stripes';
var customClientId = urlParams.get('clientID') || urlParams.get('clientId') || urlParams.get('clientid');
var CLIENT_ID = (customClientId && customClientId.trim()) ? customClientId.trim() : defaultClientId;
var originId = `${CLIENT_ID}-${Math.random().toString(36).substring(2, 9)}`;

window.CLIENT_ID = CLIENT_ID;
window.originId = originId;

// Determine initial preset from query parameter if provided
var initialPresetParam = urlParams.get('preset') || urlParams.get('p');
var initialPreset = "marquee";
if (initialPresetParam && typeof customPresets !== 'undefined') {
    const pLower = initialPresetParam.toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey) {
        initialPreset = matchedKey;
    }
}

// Central configuration synced with Dashboard / Cables
window.stripesConfig = {
    text: "SPACE TYPE GENERATOR _V.STRIPES",
    preset: initialPreset,
    hideNoText: false,

    ribbonCount: 9,
    ribbonSpaceX: -17,
    ribbonSpaceY: -35,
    ribbonSize: 35,
    ribbonOffset: 0.2,

    yWave: 95,
    speed: 0.01,
    offset: 0.26,
    slope: 1,

    typeX: 20,
    typeY: 40,
    typeStroke: 2,
    tracking: 10,

    bkgdColor: "#ffffff00",
    color1: "#ff0000",
    color2: "#0000ff",
    color3: "#ffff00",
    color4: "#ffffff",
    color5: "#000000",
    color6: "#760089",
    inpNumber: 3,

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
    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'p5',
            appType: 'stripes',
            presetFile: 'apps/space_type_generator-ws/stripes/preset.js',
            name: CLIENT_ID !== defaultClientId ? `STG Stripes (${CLIENT_ID})` : 'STG Stripes',
            parameters: {
                text: {
                    type: 'string',
                    value: String(window.stripesConfig.text),
                    label: 'Text',
                    group: 'Content'
                },
                preset: {
                    type: 'string',
                    value: String(window.stripesConfig.preset),
                    label: 'Preset',
                    group: 'Content',
                    options: buildPresetOptions({
                        'Marquee': 'marquee',
                        'Subway': 'subway',
                        'Simple Wave': 'simplewave',
                        'Old Sea': 'oldsea',
                        'Color Sea': 'colorsea',
                        'Wow': 'wow',
                        'Stacks': 'stacks',
                        'Not So Weird': 'notsoweird',
                        'Racer': 'racer',
                        'Simple Wave 2': 'simplewave2',
                        'Pride': 'pride',
                        'Reset': 'reset'
                    })
                },
                hideNoText: {
                    type: 'boolean',
                    value: Boolean(window.stripesConfig.hideNoText),
                    label: 'Hide When Empty',
                    group: 'Content'
                },

                ribbonCount: {
                    type: 'int',
                    value: Math.round(Number(window.stripesConfig.ribbonCount)),
                    min: 1,
                    max: 50,
                    step: 1,
                    label: 'Ribbon Count',
                    group: 'Ribbons'
                },
                ribbonSpaceX: {
                    type: 'float',
                    value: Number(window.stripesConfig.ribbonSpaceX),
                    min: -100,
                    max: 100,
                    step: 1,
                    label: 'Ribbon Space X',
                    group: 'Ribbons'
                },
                ribbonSpaceY: {
                    type: 'float',
                    value: Number(window.stripesConfig.ribbonSpaceY),
                    min: -100,
                    max: 100,
                    step: 1,
                    label: 'Ribbon Space Y',
                    group: 'Ribbons'
                },
                ribbonSize: {
                    type: 'float',
                    value: Number(window.stripesConfig.ribbonSize),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Ribbon Size',
                    group: 'Ribbons'
                },
                ribbonOffset: {
                    type: 'float',
                    value: Number(window.stripesConfig.ribbonOffset),
                    min: 0,
                    max: 5,
                    step: 0.01,
                    label: 'Ribbon Offset',
                    group: 'Ribbons'
                },

                yWave: {
                    type: 'float',
                    value: Number(window.stripesConfig.yWave),
                    min: 0,
                    max: 300,
                    step: 1,
                    label: 'Wave Amplitude',
                    group: 'Wave'
                },
                speed: {
                    type: 'float',
                    value: Number(window.stripesConfig.speed),
                    min: -0.1,
                    max: 0.1,
                    step: 0.001,
                    label: 'Wave Speed',
                    group: 'Wave'
                },
                offset: {
                    type: 'float',
                    value: Number(window.stripesConfig.offset),
                    min: 0,
                    max: 6.28,
                    step: 0.01,
                    label: 'Wave Phase / Offset',
                    group: 'Wave'
                },
                slope: {
                    type: 'float',
                    value: Number(window.stripesConfig.slope),
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    label: 'Wave Slope',
                    group: 'Wave'
                },

                typeX: {
                    type: 'float',
                    value: Number(window.stripesConfig.typeX),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Width',
                    group: 'Typography'
                },
                typeY: {
                    type: 'float',
                    value: Number(window.stripesConfig.typeY),
                    min: 1,
                    max: 100,
                    step: 1,
                    label: 'Type Height',
                    group: 'Typography'
                },
                typeStroke: {
                    type: 'float',
                    value: Number(window.stripesConfig.typeStroke),
                    min: 0.5,
                    max: 10,
                    step: 0.1,
                    label: 'Type Stroke',
                    group: 'Typography'
                },
                tracking: {
                    type: 'float',
                    value: Number(window.stripesConfig.tracking),
                    min: -50,
                    max: 100,
                    step: 1,
                    label: 'Letter Tracking',
                    group: 'Typography'
                },

                bkgdColor: {
                    type: 'color',
                    view: 'color',
                    color: { alpha: true },
                    alpha: true,
                    value: window.stripesConfig.bkgdColor,
                    label: 'Background Color',
                    group: 'Colors'
                },
                color1: {
                    type: 'color',
                    value: window.stripesConfig.color1,
                    label: 'Color 1 (Main)',
                    group: 'Colors'
                },
                color2: {
                    type: 'color',
                    value: window.stripesConfig.color2,
                    label: 'Color 2',
                    group: 'Colors'
                },
                color3: {
                    type: 'color',
                    value: window.stripesConfig.color3,
                    label: 'Color 3',
                    group: 'Colors'
                },
                color4: {
                    type: 'color',
                    value: window.stripesConfig.color4,
                    label: 'Color 4',
                    group: 'Colors'
                },
                color5: {
                    type: 'color',
                    value: window.stripesConfig.color5,
                    label: 'Color 5',
                    group: 'Colors'
                },
                color6: {
                    type: 'color',
                    value: window.stripesConfig.color6,
                    label: 'Color 6',
                    group: 'Colors'
                },
                inpNumber: {
                    type: 'int',
                    value: window.stripesConfig.inpNumber,
                    label: 'Color Count',
                    group: 'Colors',
                    options: {
                        '1 Color': 1,
                        '2 Colors': 2,
                        '3 Colors': 3,
                        '4 Colors': 4,
                        '5 Colors': 5,
                        '6 Colors': 6
                    }
                },

                clearTextDelay: {
                    type: 'float',
                    value: Number(window.stripesConfig.clearTextDelay),
                    min: 0,
                    max: 10000,
                    step: 100,
                    label: 'Clear Delay (ms)',
                    group: 'Text Clear'
                },
                clearMethod: {
                    type: 'string',
                    value: window.stripesConfig.clearMethod,
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
                    value: Number(window.stripesConfig.seqInterval),
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
    if (typeof inpText !== 'undefined') window.stripesConfig.text = inpText;
    if (typeof hideNoText !== 'undefined') window.stripesConfig.hideNoText = hideNoText;
    if (typeof clearTextDelay !== 'undefined') window.stripesConfig.clearTextDelay = clearTextDelay;
    if (typeof clearMethod !== 'undefined') window.stripesConfig.clearMethod = clearMethod;
    if (typeof seqInterval !== 'undefined') window.stripesConfig.seqInterval = seqInterval;

    if (typeof ribbonCount !== 'undefined') window.stripesConfig.ribbonCount = ribbonCount;
    if (typeof ribbonSpaceX !== 'undefined') window.stripesConfig.ribbonSpaceX = ribbonSpaceX;
    if (typeof ribbonSpaceY !== 'undefined') window.stripesConfig.ribbonSpaceY = ribbonSpaceY;
    if (typeof ribbonSize !== 'undefined') window.stripesConfig.ribbonSize = ribbonSize;
    if (typeof ribbonOffset !== 'undefined') window.stripesConfig.ribbonOffset = ribbonOffset;

    if (typeof yWave !== 'undefined') window.stripesConfig.yWave = yWave;
    if (typeof speed !== 'undefined') window.stripesConfig.speed = speed;
    if (typeof offset !== 'undefined') window.stripesConfig.offset = offset;
    if (typeof slope !== 'undefined') window.stripesConfig.slope = slope;

    if (typeof typeX !== 'undefined') window.stripesConfig.typeX = typeX;
    if (typeof typeY !== 'undefined') window.stripesConfig.typeY = typeY;
    if (typeof typeStroke !== 'undefined') window.stripesConfig.typeStroke = typeStroke;
    if (typeof tracking !== 'undefined') window.stripesConfig.tracking = tracking;

    if (typeof bkgdColor !== 'undefined' && bkgdColor) window.stripesConfig.bkgdColor = rgbToHex(bkgdColor);
    if (typeof inp1 !== 'undefined' && inp1) window.stripesConfig.color1 = rgbToHex(inp1);
    if (typeof inp2 !== 'undefined' && inp2) window.stripesConfig.color2 = rgbToHex(inp2);
    if (typeof inp3 !== 'undefined' && inp3) window.stripesConfig.color3 = rgbToHex(inp3);
    if (typeof inp4 !== 'undefined' && inp4) window.stripesConfig.color4 = rgbToHex(inp4);
    if (typeof inp5 !== 'undefined' && inp5) window.stripesConfig.color5 = rgbToHex(inp5);
    if (typeof inp6 !== 'undefined' && inp6) window.stripesConfig.color6 = rgbToHex(inp6);
    if (typeof inpNumber !== 'undefined') window.stripesConfig.inpNumber = inpNumber;
}

function notifyConfigChange() {
    const payload = {
        type: 'client:update',
        originId: originId,
        clientId: CLIENT_ID,
        parameters: { ...window.stripesConfig }
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
        window.stripesConfig.preset = p;
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
        window.stripesConfig.text = inpText;
        if (typeof millis === 'function') lastTextTime = millis();
        if (typeof isClearing !== 'undefined') isClearing = false;
    }
    if (params.hideNoText !== undefined) {
        hideNoText = Boolean(params.hideNoText) || params.hideNoText === 'true';
        window.stripesConfig.hideNoText = hideNoText;
    }
    if (params.clearTextDelay !== undefined) {
        clearTextDelay = Number(params.clearTextDelay);
        window.stripesConfig.clearTextDelay = clearTextDelay;
    }
    if (params.clearMethod !== undefined) {
        clearMethod = String(params.clearMethod);
        window.stripesConfig.clearMethod = clearMethod;
    }
    if (params.seqInterval !== undefined) {
        seqInterval = Number(params.seqInterval);
        window.stripesConfig.seqInterval = seqInterval;
    }

    if (params.ribbonCount !== undefined) {
        ribbonCount = Math.max(1, Math.round(Number(params.ribbonCount)));
        window.stripesConfig.ribbonCount = ribbonCount;
    }
    if (params.ribbonSpaceX !== undefined) {
        ribbonSpaceX = Number(params.ribbonSpaceX);
        window.stripesConfig.ribbonSpaceX = ribbonSpaceX;
    }
    if (params.ribbonSpaceY !== undefined) {
        ribbonSpaceY = Number(params.ribbonSpaceY);
        window.stripesConfig.ribbonSpaceY = ribbonSpaceY;
    }
    if (params.ribbonSize !== undefined) {
        ribbonSize = Number(params.ribbonSize);
        window.stripesConfig.ribbonSize = ribbonSize;
    }
    if (params.ribbonOffset !== undefined) {
        ribbonOffset = Number(params.ribbonOffset);
        window.stripesConfig.ribbonOffset = ribbonOffset;
    }

    if (params.yWave !== undefined) {
        yWave = Number(params.yWave);
        window.stripesConfig.yWave = yWave;
    }
    if (params.speed !== undefined) {
        speed = Number(params.speed);
        window.stripesConfig.speed = speed;
    }
    if (params.offset !== undefined) {
        offset = Number(params.offset);
        window.stripesConfig.offset = offset;
    }
    if (params.slope !== undefined) {
        slope = Number(params.slope);
        window.stripesConfig.slope = slope;
    }

    if (params.typeX !== undefined) {
        typeX = Number(params.typeX);
        window.stripesConfig.typeX = typeX;
    }
    if (params.typeY !== undefined) {
        typeY = Number(params.typeY);
        window.stripesConfig.typeY = typeY;
    }
    if (params.typeStroke !== undefined) {
        typeStroke = Number(params.typeStroke);
        window.stripesConfig.typeStroke = typeStroke;
    }
    if (params.tracking !== undefined) {
        tracking = Number(params.tracking);
        window.stripesConfig.tracking = tracking;
    }

    if (params.bkgdColor !== undefined) {
        const c = parseColor(params.bkgdColor);
        if (c && typeof color === 'function') bkgdColor = color(c);
        window.stripesConfig.bkgdColor = c || params.bkgdColor;
    }
    if (params.color1 !== undefined) {
        const c = parseColor(params.color1);
        if (c && typeof color === 'function') inp1 = color(c);
        window.stripesConfig.color1 = c || params.color1;
    }
    if (params.color2 !== undefined) {
        const c = parseColor(params.color2);
        if (c && typeof color === 'function') inp2 = color(c);
        window.stripesConfig.color2 = c || params.color2;
    }
    if (params.color3 !== undefined) {
        const c = parseColor(params.color3);
        if (c && typeof color === 'function') inp3 = color(c);
        window.stripesConfig.color3 = c || params.color3;
    }
    if (params.color4 !== undefined) {
        const c = parseColor(params.color4);
        if (c && typeof color === 'function') inp4 = color(c);
        window.stripesConfig.color4 = c || params.color4;
    }
    if (params.color5 !== undefined) {
        const c = parseColor(params.color5);
        if (c && typeof color === 'function') inp5 = color(c);
        window.stripesConfig.color5 = c || params.color5;
    }
    if (params.color6 !== undefined) {
        const c = parseColor(params.color6);
        if (c && typeof color === 'function') inp6 = color(c);
        window.stripesConfig.color6 = c || params.color6;
    }
    if (params.inpNumber !== undefined) {
        inpNumber = Math.max(1, Math.min(6, Math.round(Number(params.inpNumber))));
        window.stripesConfig.inpNumber = inpNumber;
    }
}

