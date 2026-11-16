/**
 * STG Field - WebSocket Communication Bridge
 * Handles WebSocket connection, Soft Takeover, and remote message routing.
 */

// --- COMMUNICATION BRIDGE ---
var urlParams = window.urlParams || new URLSearchParams(window.location.search);
var initialWidth = parseInt(urlParams.get('width')) || window.innerWidth;
var initialHeight = parseInt(urlParams.get('height')) || window.innerHeight;

window.urlParams = urlParams;
window.initialWidth = initialWidth;
window.initialHeight = initialHeight;

var wsInstance = null;

var softTakeoverFilter = (typeof SoftTakeoverClient !== 'undefined')
    ? SoftTakeoverClient.createClientFilter({
        getClientId: function () { return typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-field'; },
        getValue: function (key) {
            return (window.fieldConfig && key in window.fieldConfig) ? window.fieldConfig[key] : undefined;
        }
    })
    : null;
window.softTakeoverFilter = softTakeoverFilter;

// WebSocket connection (auto-connects by default unless explicitly disabled with ?ws=false)
var wsFlag = urlParams.get('ws');
if (wsFlag !== 'false' && wsFlag !== '0') {
    startWebSocket();
}

function sendPayload(payload) {
    if (!payload) return;
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
    console.log("[STG Field] Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data.data || data);
        } catch (e) {
            console.warn("[STG Field] WebSocket message not JSON, parsing as text:", event.data);
            if (typeof applyParameterUpdates === 'function') {
                applyParameterUpdates({ text: event.data });
            }
        }
    };

    ws.onopen = () => {
        console.log("[STG Field] WebSocket connected!");
        const activeOriginId = typeof originId !== 'undefined' ? originId : 'stg-field';
        const activeClientId = typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-field';
        ws.send(JSON.stringify({ type: 'ready', originId: activeOriginId, clientId: activeClientId }));
        if (typeof registerClient === 'function') {
            registerClient();
        }
    };

    ws.onclose = () => {
        console.log("[STG Field] WebSocket disconnected, reconnecting in 3 seconds...");
        setTimeout(startWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("[STG Field] WebSocket error:", err);
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

function applyIncomingText(val) {
    inpText = String(val);
    if (window.fieldConfig) {
        window.fieldConfig.text = inpText;
    }
    if (typeof millis === 'function') lastTextTime = millis();
    if (typeof isClearing !== 'undefined') isClearing = false;
    if (typeof restoreSlidersFromClear === 'function') restoreSlidersFromClear(false);
    if (typeof notifyConfigChange === 'function') {
        notifyConfigChange();
    }
}

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
            if (data.interactiveCamera || urlParams.has('interactiveMouse')) {
                const nx = data.normalized ? Number(data.x) : (Number(data.x) / (window.innerWidth || 1920));
                const ny = data.normalized ? Number(data.y) : (Number(data.y) / (window.innerHeight || 1080));
                if (!isNaN(nx) && !isNaN(ny)) {
                    yRotCamera = (nx - 0.5) * 120;
                    xRotCamera = (ny - 0.5) * -90;
                    if (window.fieldConfig) {
                        window.fieldConfig.yRotCamera = yRotCamera;
                        window.fieldConfig.xRotCamera = xRotCamera;
                    }
                }
            }
            break;

        case 'keyboard_pressed': {
            if (window.fieldConfig && window.fieldConfig.textInputMode === 'stt') {
                break;
            }
            const val = (data.combo !== undefined && data.combo !== null && data.combo !== '')
                ? data.combo
                : (data.key !== undefined && data.key !== null && data.key !== '')
                    ? data.key
                    : (data.value !== undefined && data.value !== null ? data.value : data.text);
            if (val !== undefined && val !== null) {
                applyIncomingText(val);
            }
            break;
        }

        case 'keyboard':
            if (window.fieldConfig && window.fieldConfig.textInputMode === 'stt') {
                break;
            }
            if (data.combo !== undefined && data.combo !== null && data.combo !== '') {
                applyIncomingText(data.combo);
            } else if (data.key && typeof data.key === 'string') {
                let nextText = inpText;
                if (data.key === 'Backspace') {
                    nextText = nextText.slice(0, -1);
                } else if (data.key.length === 1) {
                    nextText += data.key;
                } else {
                    nextText = data.key;
                }
                applyIncomingText(nextText);
            }
            break;

        case 'stt_result':
        case 'stt': {
            const mode = window.fieldConfig ? window.fieldConfig.textInputMode : 'keyboard';
            if (mode === 'keyboard') {
                break;
            }
            const firstResult = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null;
            const msgChannel = (data.device !== undefined && data.device !== null)
                ? String(data.device)
                : (data.channel !== undefined && data.channel !== null)
                    ? String(data.channel)
                    : (firstResult && firstResult.device !== undefined ? String(firstResult.device) : '');
            const targetChannel = window.fieldConfig ? String(window.fieldConfig.sttChannel || '').trim() : '';
            if (targetChannel && msgChannel && msgChannel.trim().toLowerCase() !== targetChannel.toLowerCase()) {
                break;
            }
            const transcript = (data.transcript !== undefined && data.transcript !== null)
                ? data.transcript
                : (data.text !== undefined && data.text !== null)
                    ? data.text
                    : (data.value !== undefined && data.value !== null)
                        ? data.value
                        : (firstResult && firstResult.transcript !== undefined ? firstResult.transcript : null);
            if (transcript !== undefined && transcript !== null) {
                applyIncomingText(transcript);
            }
            break;
        }
    }
}

function signalReady() {
    console.log("[STG Field] Sending ready signal...");
    const payload = {
        type: 'ready',
        originId: typeof originId !== 'undefined' ? originId : 'stg-field',
        clientId: typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : 'stg-field'
    };
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify(payload));
    }
}

