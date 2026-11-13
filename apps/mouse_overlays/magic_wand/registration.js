/**
 * Magic Wand Overlay - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables WebSocket / BroadcastChannel Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'p5-magic-wand';
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

// Initial configuration synced with Dashboard / Cables
window.magicWandConfig = {
    preset: initialPreset,
    colorMove: [255, 255, 0],
    colorMB1: [255, 0, 255],
    colorMB2: [129, 210, 235],
    colorMB3: [255, 215, 0],
    colorMB4: [0, 255, 128],
    colorMB5: [255, 102, 0],
    colorMB6: [180, 100, 255],
    starSize: 10,
    starDecay: 5,
    maxStars: 50,
    disperseSpeed: 5
};

function rgbToHex(rgb) {
    if (typeof rgb === 'string') {
        if (rgb.startsWith('#')) return rgb;
        return rgb;
    }
    if (rgb && Array.isArray(rgb.levels)) {
        rgb = rgb.levels;
    }
    if (Array.isArray(rgb) && rgb.length >= 3) {
        return '#' + rgb.slice(0, 3).map(v => {
            const clamped = Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
            return clamped.toString(16).padStart(2, '0');
        }).join('');
    }
    if (rgb && typeof rgb === 'object' && typeof rgb.r === 'number') {
        return rgbToHex([rgb.r, rgb.g, rgb.b]);
    }
    return '#ffff00';
}

function parseColorToRgb(val) {
    if (Array.isArray(val) && val.length >= 3) {
        return [Number(val[0]) || 0, Number(val[1]) || 0, Number(val[2]) || 0];
    }
    if (typeof val === 'string') {
        const clean = val.trim().replace(/^#/, '');
        if (clean.length === 3) {
            return [
                parseInt(clean[0] + clean[0], 16),
                parseInt(clean[1] + clean[1], 16),
                parseInt(clean[2] + clean[2], 16)
            ];
        }
        if (clean.length >= 6) {
            return [
                parseInt(clean.substring(0, 2), 16),
                parseInt(clean.substring(2, 4), 16),
                parseInt(clean.substring(4, 6), 16)
            ];
        }
    }
    if (val && typeof val === 'object' && typeof val.r === 'number') {
        return [Math.round(val.r), Math.round(val.g), Math.round(val.b)];
    }
    return null;
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
            appType: 'magic_wand',
            presetFile: 'apps/mouse_overlays/magic_wand/preset.js',
            name: CLIENT_ID !== defaultClientId ? `Magic Wand (${CLIENT_ID})` : 'Magic Wand',
            parameters: {
                preset: {
                    type: 'string',
                    value: String(window.magicWandConfig.preset || 'default'),
                    label: 'Preset',
                    group: 'Presets',
                    options: buildPresetOptions({
                        'Default': 'default',
                        'Sparkle': 'sparkle',
                        'Fire': 'fire',
                        'Neon': 'neon',
                        'Galaxy': 'galaxy',
                        'Pastel': 'pastel'
                    })
                },
                starSize: {
                    type: 'float',
                    value: Number(window.magicWandConfig.starSize),
                    min: 1.0,
                    max: 50.0,
                    step: 0.5,
                    group: 'Rendering'
                },
                starDecay: {
                    type: 'float',
                    value: Number(window.magicWandConfig.starDecay),
                    min: 0.5,
                    max: 25.0,
                    step: 0.5,
                    group: 'Rendering'
                },
                maxStars: {
                    type: 'int',
                    value: Number(window.magicWandConfig.maxStars),
                    min: 5,
                    max: 300,
                    step: 1,
                    group: 'Rendering'
                },
                disperseSpeed: {
                    type: 'float',
                    value: Number(window.magicWandConfig.disperseSpeed),
                    min: 0.5,
                    max: 25.0,
                    step: 0.5,
                    group: 'Rendering'
                },
                colorMove: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMove),
                    group: 'Colors'
                },
                colorMB1: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB1),
                    group: 'Colors'
                },
                colorMB2: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB2),
                    group: 'Colors'
                },
                colorMB3: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB3),
                    group: 'Colors'
                },
                colorMB4: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB4),
                    group: 'Colors'
                },
                colorMB5: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB5),
                    group: 'Colors'
                },
                colorMB6: {
                    type: 'color',
                    value: rgbToHex(window.magicWandConfig.colorMB6),
                    group: 'Colors'
                }
            },
            subscriptions: {
                mouse: true,
                keyboard: false,
                stateUpdates: true
            }
        }
    };
}

function registerClient() {
    const payload = getRegistrationPayload();
    if (typeof sendPayload === 'function') {
        sendPayload(payload);
    } else {
        if (typeof pubChannel !== 'undefined' && pubChannel) {
            pubChannel.postMessage(payload);
        }
        if (typeof wsInstance !== 'undefined' && wsInstance && wsInstance.readyState === WebSocket.OPEN) {
            wsInstance.send(JSON.stringify({
                channel: 'clientRegistry',
                data: payload
            }));
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRegistrationPayload,
        registerClient,
        rgbToHex,
        parseColorToRgb,
        buildPresetOptions
    };
}

