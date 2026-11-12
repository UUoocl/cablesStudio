/**
 * STG Stripes - WebSocket & Communication Bridge
 * Handles WebSocket connection, BroadcastChannel syncing, and remote message routing.
 */

// --- COMMUNICATION BRIDGE ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
var initialWidth = parseInt(urlParams.get('width')) || window.innerWidth;
var initialHeight = parseInt(urlParams.get('height')) || window.innerHeight;

window.urlParams = urlParams;
window.initialWidth = initialWidth;
window.initialHeight = initialHeight;

var pubChannel = null;
var subChannel = null;
var wsInstance = null;

var softTakeoverFilter = (typeof SoftTakeoverClient !== 'undefined')
    ? SoftTakeoverClient.createClientFilter({
        getClientId: function () { return typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-stripes'; },
        getValue: function (key) {
            return (window.stripesConfig && key in window.stripesConfig) ? window.stripesConfig[key] : undefined;
        }
    })
    : null;
window.softTakeoverFilter = softTakeoverFilter;

// BroadcastChannel support for both 'bc' and 'channel' parameters
var bcName = urlParams.get('bc') || urlParams.get('channel');
if (bcName) {
    const channelName = (bcName === 'true' || bcName === '1') ? 'stg-stripes-sync' : bcName;
    console.log("[STG Stripes] Starting BroadcastChannel:", channelName);
    pubChannel = new BroadcastChannel('pub-' + channelName);
    subChannel = new BroadcastChannel('sub-' + channelName);

    subChannel.onmessage = (event) => {
        if (!event.data) return;
        handleMessage(event.data);
    };
}

// WebSocket connection support (auto-connects if 'ws' flag is present)
if (urlParams.has('ws')) {
    startWebSocket();
}

function sendPayload(payload) {
    if (pubChannel) {
        pubChannel.postMessage(payload);
    }
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        if (payload.type === 'client:register' || payload.type === 'client:update') {
            wsInstance.send(JSON.stringify({
                channel: 'clientRegistry',
                data: payload
            }));
        }
        wsInstance.send(JSON.stringify(payload));
    }
}

function startWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let customHost = null;
    const wsParam = urlParams.get('ws');
    if (wsParam && wsParam !== 'true' && wsParam !== '1') {
        customHost = wsParam;
    }
    const wsHost = customHost || window.location.host || '127.0.0.1:8080';
    const wsUrl = `${wsProtocol}//${wsHost}`;
    console.log("[STG Stripes] Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data.data || data);
        } catch (e) {
            console.warn("[STG Stripes] WebSocket message not JSON, parsing as text:", event.data);
            if (typeof applyParameterUpdates === 'function') {
                applyParameterUpdates({ text: event.data });
            }
        }
    };

    ws.onopen = () => {
        console.log("[STG Stripes] WebSocket connected!");
        const activeOriginId = typeof originId !== 'undefined' ? originId : 'stg-stripes';
        const activeClientId = typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-stripes';
        ws.send(JSON.stringify({ type: 'ready', originId: activeOriginId, clientId: activeClientId }));
        if (typeof registerClient === 'function') {
            registerClient();
        }
    };

    ws.onclose = () => {
        console.log("[STG Stripes] WebSocket disconnected, reconnecting in 3 seconds...");
        setTimeout(startWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("[STG Stripes] WebSocket error:", err);
        ws.close();
    };
}

window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'resize') {
        if (typeof resizeCanvas === 'function') {
            resizeCanvas(event.data.w, event.data.h);
        }
    } else if (event.data.type === 'settings' && event.data.payload) {
        handleMessage(event.data.payload);
    } else if (event.data.type) {
        handleMessage(event.data);
    }
});

function handleMessage(data) {
    if (!data || typeof data !== 'object') return;

    // Prevent feedback loops from self-generated messages
    if (typeof originId !== 'undefined' && data.originId && data.originId === originId) {
        return;
    }

    // Ignore dashboard-only payloads & unlatch when MIDI traffic switches to another client
    if (softTakeoverFilter) {
        const verdict = softTakeoverFilter.observeMessage(data);
        if (verdict.ignore) return;
    }

    // Ignore messages explicitly targeted at another clientId
    if (typeof CLIENT_ID !== 'undefined' && data.clientId && data.clientId !== CLIENT_ID) {
        return;
    }

    switch (data.type) {
        case 'client:discover':
        case 'registry:request':
            if (typeof registerClient === 'function') {
                registerClient();
            }
            break;

        case 'client:update':
        case 'param:update':
            if (typeof applyParameterUpdates === 'function') {
                const rawParams = (data.parameters && typeof data.parameters === 'object')
                    ? data.parameters
                    : (typeof data.key === 'string' && data.value !== undefined)
                        ? { [data.key]: data.value }
                        : data;
                const filteredParams = softTakeoverFilter
                    ? softTakeoverFilter.filterParameters(rawParams, data)
                    : rawParams;
                if (filteredParams && Object.keys(filteredParams).length > 0) {
                    applyParameterUpdates(filteredParams);
                }
            }
            break;

        case 'settings':
            if (typeof applyParameterUpdates === 'function') {
                if (data.payload) {
                    applyParameterUpdates(data.payload);
                } else {
                    applyParameterUpdates(data);
                }
            }
            break;

        case 'config':
            if (typeof applyParameterUpdates === 'function') {
                applyParameterUpdates(data);
            }
            break;

        case 'mouse_move':
            if (data.interactiveWave || urlParams.has('interactiveMouse')) {
                const nx = data.normalized ? Number(data.x) : (Number(data.x) / (window.innerWidth || 1920));
                const ny = data.normalized ? Number(data.y) : (Number(data.y) / (window.innerHeight || 1080));
                if (!isNaN(nx) && !isNaN(ny)) {
                    yWave = nx * 200;
                    if (window.stripesConfig) {
                        window.stripesConfig.yWave = yWave;
                    }
                }
            }
            break;

        case 'keyboard_pressed': {
            const val = (data.combo !== undefined && data.combo !== null && data.combo !== '')
                ? data.combo
                : (data.key !== undefined && data.key !== null && data.key !== '')
                    ? data.key
                    : (data.value !== undefined && data.value !== null ? data.value : data.text);
            if (val !== undefined && val !== null) {
                inpText = String(val);
                if (window.stripesConfig) {
                    window.stripesConfig.text = inpText;
                }
                if (typeof millis === 'function') lastTextTime = millis();
                if (typeof isClearing !== 'undefined') isClearing = false;
                if (typeof notifyConfigChange === 'function') {
                    notifyConfigChange();
                }
            }
            break;
        }

        case 'keyboard':
            if (data.combo !== undefined && data.combo !== null && data.combo !== '') {
                inpText = String(data.combo);
                if (window.stripesConfig) {
                    window.stripesConfig.text = inpText;
                }
                if (typeof millis === 'function') lastTextTime = millis();
                if (typeof isClearing !== 'undefined') isClearing = false;
                if (typeof notifyConfigChange === 'function') {
                    notifyConfigChange();
                }
            } else if (data.key && typeof data.key === 'string') {
                if (data.key === 'Backspace') {
                    inpText = inpText.slice(0, -1);
                } else if (data.key.length === 1) {
                    inpText += data.key;
                } else {
                    inpText = data.key;
                }
                if (window.stripesConfig) {
                    window.stripesConfig.text = inpText;
                }
                if (typeof millis === 'function') lastTextTime = millis();
                if (typeof isClearing !== 'undefined') isClearing = false;
                if (typeof notifyConfigChange === 'function') {
                    notifyConfigChange();
                }
            }
            break;
    }
}

function captureFrame() {
    if (pubChannel) {
        pubChannel.postMessage({ type: 'draw' });
    }
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'draw' }));
    }
}

function signalReady() {
    console.log("[STG Stripes] Sending ready signal...");
    const payload = {
        type: 'ready',
        originId: typeof originId !== 'undefined' ? originId : 'stg-stripes',
        clientId: typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-stripes'
    };
    if (pubChannel) {
        pubChannel.postMessage(payload);
    }
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify(payload));
    }
}

