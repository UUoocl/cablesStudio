/**
 * Astro Bee Overlay - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables / SlidesStudio WebSocket Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'p5-astro-bee';
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
window.astroBeeConfig = {
    preset: initialPreset,
    zoom: 150,
    lerpSpeed: 0.05,
    floatScale: 1.0,
    rotationSpeed: 0.005,
    shininess: 20,
    lightIntensity: 100
};

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
    const cfg = window.astroBeeConfig || {};
    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'p5',
            appType: 'astro_bee',
            presetFile: 'apps/mouse_overlays/astro_bee/preset.js',
            name: CLIENT_ID !== defaultClientId ? `Astro Bee (${CLIENT_ID})` : 'Astro Bee',
            parameters: {
                preset: {
                    type: 'string',
                    value: String(cfg.preset || 'default'),
                    label: 'Preset',
                    group: 'Presets',
                    options: buildPresetOptions({
                        'Default': 'default',
                        'Close Up': 'close_up',
                        'Fast Follower': 'fast_follower',
                        'Zen': 'zen',
                        'Wide Orbit': 'wide_orbit',
                        'Mini': 'mini'
                    })
                },
                zoom: {
                    type: 'float',
                    value: Number(cfg.zoom !== undefined ? cfg.zoom : 150),
                    min: 30.0,
                    max: 350.0,
                    step: 5.0,
                    group: 'Transform'
                },
                lerpSpeed: {
                    type: 'float',
                    value: Number(cfg.lerpSpeed !== undefined ? cfg.lerpSpeed : 0.05),
                    min: 0.01,
                    max: 0.25,
                    step: 0.01,
                    group: 'Motion'
                },
                floatScale: {
                    type: 'float',
                    value: Number(cfg.floatScale !== undefined ? cfg.floatScale : 1.0),
                    min: 0.0,
                    max: 2.5,
                    step: 0.1,
                    group: 'Motion'
                },
                rotationSpeed: {
                    type: 'float',
                    value: Number(cfg.rotationSpeed !== undefined ? cfg.rotationSpeed : 0.005),
                    min: 0.001,
                    max: 0.03,
                    step: 0.001,
                    group: 'Motion'
                },
                shininess: {
                    type: 'float',
                    value: Number(cfg.shininess !== undefined ? cfg.shininess : 20),
                    min: 5.0,
                    max: 100.0,
                    step: 5.0,
                    group: 'Lighting'
                },
                lightIntensity: {
                    type: 'float',
                    value: Number(cfg.lightIntensity !== undefined ? cfg.lightIntensity : 100),
                    min: 20.0,
                    max: 255.0,
                    step: 5.0,
                    group: 'Lighting'
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
        buildPresetOptions
    };
}

