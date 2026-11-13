/**
 * Flow Highlight Overlay - Client Registration & Configuration Manifest
 * Compatible with settings_dashboard.html and Cables Fluid Simulation Bridge
 */

// --- CLIENT IDENTITY & CONFIGURATION ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
window.urlParams = urlParams;

var defaultClientId = 'cables-flow-highlight';
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
window.flowHighlightConfig = {
    preset: initialPreset,
    splatRadius: 0.005,
    splatForce: 6000,
    fluidVorticity: 30,
    fluidPressure: 0.8,
    colorDiffusion: 0.98,
    velocityDiffusion: 0.98,
    splatColor: '#00f0ff'
};

function rgbToHex(rgb) {
    if (!rgb) return '#00f0ff';
    if (typeof rgb === 'string') {
        if (rgb.startsWith('#')) return rgb;
        return rgb;
    }
    if (Array.isArray(rgb) && rgb.length >= 3) {
        return '#' + rgb.slice(0, 3).map(v => {
            const clamped = Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
            return clamped.toString(16).padStart(2, '0');
        }).join('');
    }
    return '#00f0ff';
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
    const cfg = window.flowHighlightConfig || {};
    return {
        type: 'client:register',
        originId: originId,
        manifest: {
            clientId: CLIENT_ID,
            clientType: 'cables',
            appType: 'flow_highlight',
            presetFile: 'apps/mouse_overlays/flow_highlight/preset.js',
            name: CLIENT_ID !== defaultClientId ? `Flow Highlight (${CLIENT_ID})` : 'Flow Highlight',
            parameters: {
                preset: {
                    type: 'string',
                    value: String(cfg.preset || 'default'),
                    label: 'Preset',
                    group: 'Presets',
                    options: buildPresetOptions({
                        'Default': 'default',
                        'Neon Flow': 'neon_flow',
                        'High Viscosity': 'high_viscosity',
                        'Rapid Dissolve': 'rapid_dissolve',
                        'Intense Splat': 'intense_splat'
                    })
                },
                splatRadius: {
                    type: 'float',
                    value: Number(cfg.splatRadius !== undefined ? cfg.splatRadius : 0.005),
                    min: 0.001,
                    max: 0.05,
                    step: 0.001,
                    group: 'Splat'
                },
                splatForce: {
                    type: 'float',
                    value: Number(cfg.splatForce !== undefined ? cfg.splatForce : 6000),
                    min: 500.0,
                    max: 12000.0,
                    step: 250.0,
                    group: 'Splat'
                },
                fluidVorticity: {
                    type: 'float',
                    value: Number(cfg.fluidVorticity !== undefined ? cfg.fluidVorticity : 30),
                    min: 0.0,
                    max: 60.0,
                    step: 1.0,
                    group: 'Fluid Dynamics'
                },
                fluidPressure: {
                    type: 'float',
                    value: Number(cfg.fluidPressure !== undefined ? cfg.fluidPressure : 0.8),
                    min: 0.1,
                    max: 1.0,
                    step: 0.05,
                    group: 'Fluid Dynamics'
                },
                colorDiffusion: {
                    type: 'float',
                    value: Number(cfg.colorDiffusion !== undefined ? cfg.colorDiffusion : 0.98),
                    min: 0.85,
                    max: 1.0,
                    step: 0.005,
                    group: 'Diffusion'
                },
                velocityDiffusion: {
                    type: 'float',
                    value: Number(cfg.velocityDiffusion !== undefined ? cfg.velocityDiffusion : 0.98),
                    min: 0.85,
                    max: 1.0,
                    step: 0.005,
                    group: 'Diffusion'
                },
                splatColor: {
                    type: 'color',
                    value: rgbToHex(cfg.splatColor || '#00f0ff'),
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

