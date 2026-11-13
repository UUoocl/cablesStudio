/**
 * Trassel Overlay - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables WebSocket / BroadcastChannel Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'js-trassel';
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
window.trasselConfig = {
    preset: initialPreset,
    mode: 'brush',
    scrollMultiplier: 5
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
    const activeMode = (window.trasselConfig && window.trasselConfig.mode) || 'brush';
    const activeMult = (window.trasselConfig && typeof window.trasselConfig.scrollMultiplier === 'number')
        ? window.trasselConfig.scrollMultiplier
        : (typeof scrollMultiplier !== 'undefined' ? scrollMultiplier : 5);

    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'canvas2d',
            appType: 'trassel',
            presetFile: 'apps/mouse_overlays/trassel/preset.js',
            name: CLIENT_ID !== defaultClientId ? `Trassel (${CLIENT_ID})` : 'Trassel',
            parameters: {
                preset: {
                    type: 'string',
                    value: String(window.trasselConfig.preset || 'default'),
                    label: 'Preset',
                    group: 'Presets',
                    options: buildPresetOptions({
                        'Default': 'default',
                        'Brush': 'brush',
                        'Line': 'line',
                        'Dash': 'dash',
                        'Worm': 'worm',
                        'Turbo Brush': 'turbo_brush',
                        'Slow Line': 'slow_line'
                    })
                },
                mode: {
                    type: 'string',
                    value: activeMode,
                    options: {
                        Brush: 'brush',
                        Line: 'line',
                        Dash: 'dash',
                        Worm: 'worm'
                    },
                    group: 'Rendering'
                },
                scrollMultiplier: {
                    type: 'float',
                    value: activeMult,
                    min: 1.0,
                    max: 20.0,
                    step: 0.5,
                    group: 'Scroll'
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
        buildPresetOptions
    };
}

