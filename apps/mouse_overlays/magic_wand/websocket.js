/**
 * Magic Wand Overlay - WebSocket & Communication Bridge
 * Handles WebSocket connection, BroadcastChannel syncing, Soft Takeover, and remote routing.
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
        getClientId: function () { return typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'p5-magic-wand'; },
        getValue: function (key) {
            return (window.magicWandConfig && key in window.magicWandConfig) ? window.magicWandConfig[key] : undefined;
        }
    })
    : null;
window.softTakeoverFilter = softTakeoverFilter;

// BroadcastChannel support for both 'bc' and 'channel' parameters
var bcName = urlParams.get('bc') || urlParams.get('channel');
if (bcName) {
    const channelName = (bcName === 'true' || bcName === '1') ? 'magicwand-sync' : bcName;
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
    console.log("[Magic Wand] Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data.data || data);
        } catch (e) {
            console.warn("[Magic Wand] WebSocket message not JSON, parsing as text:", event.data);
        }
    };

    ws.onopen = () => {
        console.log("[Magic Wand] WebSocket connected!");
        const activeOriginId = typeof originId !== 'undefined' ? originId : 'p5-magic-wand';
        const activeClientId = typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'p5-magic-wand';
        ws.send(JSON.stringify({ type: 'ready', originId: activeOriginId, clientId: activeClientId }));
        if (typeof registerClient === 'function') {
            registerClient();
        }
    };

    ws.onclose = () => {
        console.log("[Magic Wand] WebSocket disconnected, reconnecting in 3 seconds...");
        setTimeout(startWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("[Magic Wand] WebSocket error:", err);
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
        case 'mouse_move':
            if (typeof window.mousePosX !== 'undefined') {
                if (data.normalized) {
                    window.mousePosX = Math.round(data.x * window.innerWidth);
                    window.mousePosY = Math.round(data.y * window.innerHeight);
                } else {
                    window.mousePosX = Math.round(data.x);
                    window.mousePosY = Math.round(data.y);
                }
            }
            break;

        case 'mouse_click':
            if (data.pressed && typeof mousePressed === 'function') {
                mousePressed(data.button);
            }
            break;

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

        case 'config':
            if (typeof applyParameterUpdates === 'function') {
                applyParameterUpdates(data);
            }
            break;
    }
}

function captureFrame() {
    sendPayload({ type: 'draw' });
}

function signalReady() {
    console.log("[Magic Wand] Sending ready signal...");
    sendPayload({ type: 'ready' });
}

