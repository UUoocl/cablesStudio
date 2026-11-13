/**
 * Flow Highlight Overlay - WebSocket & Communication Bridge
 * Handles WebSocket connection, BroadcastChannel desktop bounds, Soft Takeover, and remote routing.
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
var socket = null;

// Desktop bounds for coordinate remapping
var displayXmin = 0, displayXmax = 1920;
var displayYmin = 0, displayYmax = 1080;
const desktopBoundsChannel = new BroadcastChannel('desktop_bounds');

function remap(n, start1, stop1, start2, stop2) {
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

desktopBoundsChannel.onmessage = (event) => {
    if (event.data && typeof event.data.minX !== 'undefined') {
        updateLocalBounds(event.data);
    }
};

function updateLocalBounds(bounds) {
    displayXmin = bounds.minX;
    displayXmax = bounds.maxX;
    displayYmin = bounds.minY;
    displayYmax = bounds.maxY;

    if (typeof updateCablesBounds === 'function') {
        updateCablesBounds(displayXmin, displayXmax, displayYmin, displayYmax);
    }
}

var softTakeoverFilter = (typeof SoftTakeoverClient !== 'undefined')
    ? SoftTakeoverClient.createClientFilter({
        getClientId: function () { return typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'cables-flow-highlight'; },
        getValue: function (key) {
            return (window.flowHighlightConfig && key in window.flowHighlightConfig) ? window.flowHighlightConfig[key] : undefined;
        }
    })
    : null;
window.softTakeoverFilter = softTakeoverFilter;

// BroadcastChannel support for both 'bc' and 'channel' parameters
var bcName = urlParams.get('bc') || urlParams.get('channel');
if (bcName) {
    const channelName = (bcName === 'true' || bcName === '1') ? 'flowhighlight-sync' : bcName;
    pubChannel = new BroadcastChannel('pub-' + channelName);
    subChannel = new BroadcastChannel('sub-' + channelName);

    subChannel.onmessage = (event) => {
        if (!event.data) return;
        handleMessage(event.data);
    };
}

// WebSocket connection support (auto-connects if 'ws' flag is present or slidesStudioClient is available)
if (urlParams.has('ws')) {
    startWebSocket();
} else if (typeof window.slidesStudioClient !== 'undefined') {
    initSlidesStudioSocket();
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
    console.log("[Flow Highlight] Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data.data || data);
        } catch (e) {
            console.warn("[Flow Highlight] WebSocket message not JSON, parsing as text:", event.data);
        }
    };

    ws.onopen = () => {
        console.log("[Flow Highlight] WebSocket connected!");
        const activeOriginId = typeof originId !== 'undefined' ? originId : 'cables-flow-highlight';
        const activeClientId = typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'cables-flow-highlight';
        ws.send(JSON.stringify({ type: 'ready', originId: activeOriginId, clientId: activeClientId }));
        if (typeof registerClient === 'function') {
            registerClient();
        }
    };

    ws.onclose = () => {
        console.log("[Flow Highlight] WebSocket disconnected, reconnecting in 3 seconds...");
        setTimeout(startWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("[Flow Highlight] WebSocket error:", err);
        ws.close();
    };
}

async function initSlidesStudioSocket() {
    if (!window.slidesStudioClient) return;

    socket = window.slidesStudioClient.create({
        hostname: window.location.hostname,
        port: window.location.port,
        path: '/websocket/',
        authToken: { name: 'Cables-Flow-Highlight' }
    });

    socket.on('error', (err) => {
        console.error('[Flow Highlight] SlidesStudio WebSocket error:', err);
    });

    socket.on('connect', () => {
        console.log('[Flow Highlight] Connected to SlidesStudio WebSocket');
        try {
            socket.invoke('setInfo', { name: 'Cables Flow Highlight' });
        } catch (e) {}

        desktopBoundsChannel.postMessage('request_bounds');
        setTimeout(() => {
            if (displayXmax === 1920 && displayYmax === 1080) {
                fetchDesktopBounds();
            }
        }, 500);
        if (typeof registerClient === 'function') registerClient();
    });

    // Subscribe to mouse position updates
    const posChannel = socket.subscribe('mousePosition');
    posChannel.on('message', (data) => {
        if (typeof updateMousePosition === 'function') {
            updateMousePosition(data.x, data.y);
        }
    });
}

async function fetchDesktopBounds() {
    if (!socket) return;
    try {
        const data = await socket.invoke('obsRequest', {
            requestType: 'GetMonitorList'
        });
        const monitors = data.monitors || [];
        if (monitors.length > 0) {
            const bounds = {
                minX: Math.min(...monitors.map(m => m.monitorPositionX)),
                maxX: Math.max(...monitors.map(m => m.monitorPositionX + m.monitorWidth)),
                minY: Math.min(...monitors.map(m => m.monitorPositionY)),
                maxY: Math.max(...monitors.map(m => m.monitorPositionY + m.monitorHeight))
            };
            updateLocalBounds(bounds);
        }
    } catch (e) {
        console.error("[Flow Highlight] Failed to fetch desktop bounds:", e);
    }
}

window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'settings' && event.data.payload) {
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
        case 'mousePosition':
            if (typeof updateMousePosition === 'function') {
                if (data.normalized) {
                    const absX = Math.round(data.x * window.innerWidth);
                    const absY = Math.round(data.y * window.innerHeight);
                    updateMousePosition(absX, absY);
                } else {
                    updateMousePosition(data.x, data.y);
                }
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
    console.log("[Flow Highlight] Sending ready signal...");
    sendPayload({ type: 'ready' });
}

