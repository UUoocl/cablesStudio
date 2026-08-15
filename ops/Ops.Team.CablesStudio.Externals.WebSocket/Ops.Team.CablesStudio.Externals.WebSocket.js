const
    inUrl = op.inString("WebSocket URL", "ws://127.0.0.1:8080"),
    inProtocols = op.inString("Protocols", ""),
    inChannelName = op.inString("Broadcast Channel Name", "ws-external-bridge"),
    inAutoConnect = op.inBool("Auto Connect", false),
    inAutoReconnect = op.inBool("Auto Reconnect", true),
    inReconnectInterval = op.inInt("Reconnect Interval (ms)", 3000),
    inOpen = op.inTriggerButton("Open Popup"),
    inClose = op.inTriggerButton("Close Popup"),
    inConnect = op.inTriggerButton("Connect"),
    inDisconnect = op.inTriggerButton("Disconnect"),

    inSend = op.inTriggerButton("Send"),
    inMsgData = op.inObject("Message Data", null),
    inMsgString = op.inString("Message Text", ""),
    inFormat = op.inSwitch("Format", ["Auto", "Text / String", "JSON / Object"], "Auto"),

    outPopupOpen = op.outBoolNum("Popup Open", false),
    outConnected = op.outBoolNum("Connected", false),
    outConnecting = op.outBoolNum("Connecting", false),
    outOnMessage = op.outTrigger("On Message Received"),
    outReceivedText = op.outString("Received Text", ""),
    outReceivedJson = op.outObject("Received JSON", null),
    outOnOpen = op.outTrigger("On Open"),
    outOnClose = op.outTrigger("On Close"),
    outOnError = op.outTrigger("On Error"),
    outCloseCode = op.outNumber("Close Code", 0),
    outCloseReason = op.outString("Close Reason", ""),
    outError = op.outString("Error", "");

op.setPortGroup("Connection", [
    inUrl, inProtocols, inChannelName,
    inAutoConnect, inAutoReconnect, inReconnectInterval,
    inOpen, inClose, inConnect, inDisconnect
]);
op.setPortGroup("Send Message", [inSend, inMsgData, inMsgString, inFormat]);

let bc = null;
let childWindow = null;
let pollInterval = null;

const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket External Bridge</title>
    <style>
        :root {
            --bg-primary: #090d16;
            --bg-card: #111827;
            --bg-card-header: #1e293b;
            --border-color: #1f293d;
            --text-primary: #f1f5f9;
            --text-muted: #94a3b8;
            --accent-cyan: #38bdf8;
            --accent-emerald: #10b981;
            --accent-amber: #f59e0b;
            --accent-rose: #f43f5e;
            --accent-purple: #a855f7;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 16px;
            gap: 12px;
            overflow: hidden;
            user-select: none;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 12px 16px;
            border-radius: 10px;
        }

        .title-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .title-icon {
            width: 22px;
            height: 22px;
            color: var(--accent-cyan);
        }

        .title-text {
            font-size: 1.05rem;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #ffffff;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: #1e293b;
            color: var(--text-muted);
            transition: all 0.2s ease;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: var(--text-muted);
            transition: all 0.2s ease;
        }

        .status-badge.connected {
            background-color: rgba(16, 185, 129, 0.15);
            color: var(--accent-emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge.connected .status-dot {
            background-color: var(--accent-emerald);
            box-shadow: 0 0 8px var(--accent-emerald);
        }

        .status-badge.connecting {
            background-color: rgba(245, 158, 11, 0.15);
            color: var(--accent-amber);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .status-badge.connecting .status-dot {
            background-color: var(--accent-amber);
            animation: pulse 1s infinite alternate;
        }

        .status-badge.disconnected {
            background-color: rgba(244, 63, 94, 0.15);
            color: var(--accent-rose);
            border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .status-badge.disconnected .status-dot {
            background-color: var(--accent-rose);
        }

        @keyframes pulse {
            0% { opacity: 0.4; }
            100% { opacity: 1; }
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .stat-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .stat-value {
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .control-bar {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        button {
            background-color: #1e293b;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 0.8125rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease;
        }

        button:hover {
            background-color: #273549;
            border-color: #3b4d66;
        }

        button.btn-primary {
            background-color: #0284c7;
            border-color: #38bdf8;
            color: #ffffff;
        }
        button.btn-primary:hover {
            background-color: #0369a1;
        }

        button.btn-danger {
            background-color: #be123c;
            border-color: #f43f5e;
            color: #ffffff;
        }
        button.btn-danger:hover {
            background-color: #9f1239;
        }

        .log-container {
            flex-grow: 1;
            background-color: #050811;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 12px;
            overflow-y: auto;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.775rem;
            display: flex;
            flex-direction: column;
            gap: 5px;
            user-select: text;
        }

        .log-row {
            line-height: 1.45;
            word-break: break-all;
            display: flex;
            gap: 8px;
        }

        .log-time {
            color: #475569;
            flex-shrink: 0;
        }

        .log-tag {
            font-weight: 700;
            flex-shrink: 0;
            border-radius: 3px;
            padding: 0 4px;
            font-size: 0.7rem;
        }

        .tag-in { background-color: rgba(16, 185, 129, 0.2); color: var(--accent-emerald); }
        .tag-out { background-color: rgba(56, 189, 248, 0.2); color: var(--accent-cyan); }
        .tag-sys { background-color: rgba(168, 85, 247, 0.2); color: var(--accent-purple); }
        .tag-err { background-color: rgba(244, 63, 94, 0.2); color: var(--accent-rose); }
        .tag-warn { background-color: rgba(245, 158, 11, 0.2); color: var(--accent-amber); }

        .log-msg {
            color: #cbd5e1;
        }

        .test-bar {
            display: flex;
            gap: 8px;
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px;
        }

        .test-input {
            flex-grow: 1;
            background-color: #050811;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: #ffffff;
            padding: 6px 10px;
            font-size: 0.8125rem;
            outline: none;
            font-family: inherit;
        }
        .test-input:focus {
            border-color: var(--accent-cyan);
        }

        .footer {
            font-size: 0.725rem;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title-group">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11a9 9 0 0 1 9 9"></path>
                <path d="M4 4a16 16 0 0 1 16 16"></path>
                <circle cx="5" cy="19" r="1"></circle>
            </svg>
            <div class="title-text">WebSocket Popup Bridge</div>
        </div>
        <div id="status-badge" class="status-badge disconnected">
            <div class="status-dot"></div>
            <span id="status-text">Disconnected</span>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Target URL</div>
            <div id="stat-url" class="stat-value">-</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Channel</div>
            <div id="stat-channel" class="stat-value">-</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Received</div>
            <div id="stat-rx" class="stat-value">0 msgs</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Sent</div>
            <div id="stat-tx" class="stat-value">0 msgs</div>
        </div>
    </div>

    <div class="control-bar">
        <button id="btn-connect" class="btn-primary">Connect</button>
        <button id="btn-disconnect" class="btn-danger">Disconnect</button>
        <button id="btn-clear">Clear Log</button>
        <div style="flex-grow: 1;"></div>
        <label style="font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="chk-autoscroll" checked> Auto-scroll
        </label>
    </div>

    <div id="log" class="log-container">
        <div class="log-row">
            <span class="log-time">--:--:--</span>
            <span class="log-tag tag-sys">SYS</span>
            <span class="log-msg">Popup bridge initialized. Ready for connections.</span>
        </div>
    </div>

    <div class="test-bar">
        <input type="text" id="input-test" class="test-input" placeholder="Type a test message or JSON to send...">
        <button id="btn-send">Send</button>
    </div>

    <div class="footer">
        Do not close this window. It maintains the WebSocket connection and relays data to cables.gl.
    </div>

    <script>
        // CHANNEL_NAME_PLACEHOLDER

        document.getElementById("stat-channel").innerText = CHANNEL_NAME;
        const bc = new BroadcastChannel(CHANNEL_NAME);

        let ws = null;
        let targetUrl = "";
        let targetProtocols = "";
        let autoReconnect = true;
        let reconnectInterval = 3000;
        let reconnectTimer = null;
        let rxCount = 0;
        let txCount = 0;
        let intentionalClose = false;

        const logContainer = document.getElementById("log");
        const statusBadge = document.getElementById("status-badge");
        const statusText = document.getElementById("status-text");
        const statUrl = document.getElementById("stat-url");
        const statRx = document.getElementById("stat-rx");
        const statTx = document.getElementById("stat-tx");
        const chkAutoscroll = document.getElementById("chk-autoscroll");
        const inputTest = document.getElementById("input-test");

        function log(msg, tag = "SYS") {
            const row = document.createElement("div");
            row.className = "log-row";

            const time = document.createElement("span");
            time.className = "log-time";
            time.innerText = new Date().toLocaleTimeString();

            const tagEl = document.createElement("span");
            let tagClass = "tag-sys";
            if (tag === "IN") tagClass = "tag-in";
            else if (tag === "OUT") tagClass = "tag-out";
            else if (tag === "ERR") tagClass = "tag-err";
            else if (tag === "WARN") tagClass = "tag-warn";
            tagEl.className = "log-tag " + tagClass;
            tagEl.innerText = tag;

            const msgEl = document.createElement("span");
            msgEl.className = "log-msg";
            msgEl.innerText = typeof msg === "object" ? JSON.stringify(msg) : msg;

            row.appendChild(time);
            row.appendChild(tagEl);
            row.appendChild(msgEl);
            logContainer.appendChild(row);

            if (chkAutoscroll.checked) {
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }

        function setStatus(state, extra = "") {
            statusBadge.className = "status-badge " + state;
            statusText.innerText = state.charAt(0).toUpperCase() + state.slice(1);

            bc.postMessage({
                type: "status",
                connected: state === "connected",
                connecting: state === "connecting",
                readyState: ws ? ws.readyState : 3,
                error: extra
            });
        }

        function connect(url, protocols) {
            clearTimeout(reconnectTimer);
            intentionalClose = false;

            if (url) targetUrl = url;
            if (protocols !== undefined) targetProtocols = protocols;

            if (!targetUrl) {
                log("No WebSocket URL provided.", "ERR");
                return;
            }

            statUrl.innerText = targetUrl;

            if (ws) {
                try {
                    ws.onopen = null;
                    ws.onmessage = null;
                    ws.onerror = null;
                    ws.onclose = null;
                    ws.close();
                } catch(e) {}
                ws = null;
            }

            log("Connecting to " + targetUrl + (targetProtocols ? " [protocols: " + targetProtocols + "]" : "") + "...", "SYS");
            setStatus("connecting");

            try {
                if (targetProtocols && targetProtocols.trim().length > 0) {
                    const protos = targetProtocols.split(",").map(p => p.trim()).filter(Boolean);
                    ws = new WebSocket(targetUrl, protos.length === 1 ? protos[0] : protos);
                } else {
                    ws = new WebSocket(targetUrl);
                }

                ws.onopen = () => {
                    log("Connected to " + targetUrl, "SYS");
                    setStatus("connected");
                    bc.postMessage({
                        type: "open",
                        url: targetUrl
                    });
                };

                ws.onmessage = (evt) => {
                    rxCount++;
                    statRx.innerText = rxCount + " msgs";

                    let data = evt.data;
                    let isJson = false;
                    let parsed = null;

                    if (typeof data === "string") {
                        try {
                            parsed = JSON.parse(data);
                            isJson = true;
                        } catch (e) {}
                    }

                    log(data, "IN");

                    bc.postMessage({
                        type: "message",
                        data: data,
                        isJson: isJson,
                        parsed: parsed,
                        timestamp: Date.now()
                    });
                };

                ws.onerror = (evt) => {
                    log("WebSocket Error: " + (evt.message || "Connection error"), "ERR");
                    bc.postMessage({
                        type: "error",
                        error: evt.message || "WebSocket connection error"
                    });
                };

                ws.onclose = (evt) => {
                    log("Connection closed (Code: " + evt.code + ", Reason: " + (evt.reason || "None") + ")", "WARN");
                    setStatus("disconnected", evt.reason || "Closed");

                    bc.postMessage({
                        type: "close",
                        code: evt.code,
                        reason: evt.reason,
                        wasClean: evt.wasClean
                    });

                    if (!intentionalClose && autoReconnect) {
                        log("Reconnecting in " + (reconnectInterval / 1000) + "s...", "SYS");
                        reconnectTimer = setTimeout(() => {
                            connect();
                        }, reconnectInterval);
                    }
                };

            } catch (err) {
                log("Failed to create WebSocket: " + err.message, "ERR");
                setStatus("disconnected", err.message);
                bc.postMessage({
                    type: "error",
                    error: err.message
                });
            }
        }

        function disconnect() {
            clearTimeout(reconnectTimer);
            intentionalClose = true;
            if (ws) {
                log("Disconnecting...", "SYS");
                ws.close();
                ws = null;
            }
            setStatus("disconnected");
        }

        function send(data, format = "Auto") {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log("Cannot send: WebSocket is not connected.", "ERR");
                bc.postMessage({
                    type: "error",
                    error: "WebSocket is not connected."
                });
                return;
            }

            let payload = data;
            if (format === "JSON / Object" || (format === "Auto" && typeof data === "object" && data !== null)) {
                try {
                    payload = typeof data === "string" ? data : JSON.stringify(data);
                } catch(e) {
                    log("Failed to stringify JSON payload: " + e.message, "ERR");
                    return;
                }
            } else if (typeof data === "object" && data !== null) {
                payload = JSON.stringify(data);
            }

            try {
                ws.send(payload);
                txCount++;
                statTx.innerText = txCount + " msgs";
                log(payload, "OUT");
            } catch (err) {
                log("Send failed: " + err.message, "ERR");
                bc.postMessage({
                    type: "error",
                    error: err.message
                });
            }
        }

        // DOM Event Listeners
        document.getElementById("btn-connect").onclick = () => connect();
        document.getElementById("btn-disconnect").onclick = () => disconnect();
        document.getElementById("btn-clear").onclick = () => {
            logContainer.innerHTML = "";
            log("Log cleared.", "SYS");
        };

        function submitTestMessage() {
            const val = inputTest.value.trim();
            if (!val) return;
            send(val, "Auto");
            inputTest.value = "";
        }

        document.getElementById("btn-send").onclick = submitTestMessage;
        inputTest.onkeydown = (e) => {
            if (e.key === "Enter") submitTestMessage();
        };

        // BroadcastChannel Receiver
        bc.onmessage = (event) => {
            const msg = event.data;
            if (!msg) return;

            switch (msg.type) {
                case "connect":
                    if (msg.autoReconnect !== undefined) autoReconnect = msg.autoReconnect;
                    if (msg.reconnectInterval !== undefined) reconnectInterval = msg.reconnectInterval;
                    connect(msg.url, msg.protocols);
                    break;

                case "disconnect":
                    disconnect();
                    break;

                case "send":
                    send(msg.data, msg.format);
                    break;

                case "config":
                    if (msg.autoReconnect !== undefined) autoReconnect = msg.autoReconnect;
                    if (msg.reconnectInterval !== undefined) reconnectInterval = msg.reconnectInterval;
                    if (msg.url && msg.url !== targetUrl) {
                        targetUrl = msg.url;
                        statUrl.innerText = targetUrl;
                    }
                    if (msg.protocols !== undefined) targetProtocols = msg.protocols;
                    break;
            }
        };

        // Let parent op know popup is ready
        bc.postMessage({ type: "ready" });
    </script>
</body>
</html>`;

function setupBroadcastChannel() {
    closeBroadcastChannel();

    const channelName = inChannelName.get();
    if (!channelName) return;

    bc = new BroadcastChannel(channelName);
    bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        switch (msg.type) {
            case "ready":
                sendConfig(true);
                break;

            case "status":
                outConnected.set(msg.connected);
                outConnecting.set(msg.connecting);
                if (msg.error) {
                    outError.set(msg.error);
                } else {
                    outError.set("");
                }
                break;

            case "open":
                outConnected.set(true);
                outConnecting.set(false);
                outError.set("");
                outOnOpen.trigger();
                break;

            case "close":
                outConnected.set(false);
                outConnecting.set(false);
                outCloseCode.set(msg.code || 0);
                outCloseReason.set(msg.reason || "");
                outOnClose.trigger();
                break;

            case "message":
                outReceivedText.set(msg.data !== undefined ? String(msg.data) : "");
                outReceivedJson.set(msg.parsed !== undefined ? msg.parsed : null);
                outOnMessage.trigger();
                break;

            case "error":
                outError.set(msg.error || "Unknown WebSocket error");
                outOnError.trigger();
                break;
        }
    };
}

function closeBroadcastChannel() {
    if (bc) {
        bc.close();
        bc = null;
    }
}

function sendConfig(triggerConnect = false) {
    if (bc && childWindow && !childWindow.closed) {
        const url = inUrl.get();
        const protocols = inProtocols.get();
        const autoRec = inAutoReconnect.get();
        const interval = inReconnectInterval.get();

        if (triggerConnect) {
            bc.postMessage({
                type: "connect",
                url: url,
                protocols: protocols,
                autoReconnect: autoRec,
                reconnectInterval: interval
            });
        } else {
            bc.postMessage({
                type: "config",
                url: url,
                protocols: protocols,
                autoReconnect: autoRec,
                reconnectInterval: interval
            });
        }
    }
}

inUrl.onChange = () => sendConfig(false);
inProtocols.onChange = () => sendConfig(false);
inAutoReconnect.onChange = () => sendConfig(false);
inReconnectInterval.onChange = () => sendConfig(false);

inChannelName.onChange = () => {
    setupBroadcastChannel();
};

inOpen.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    setupBroadcastChannel();

    const channelName = inChannelName.get() || "ws-external-bridge";
    const features = "width=640,height=600,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";

    childWindow = window.open("", `ws_bridge_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup window blocked. Please allow popups for this site.");
        outPopupOpen.set(false);
        return;
    }

    outPopupOpen.set(true);

    const doc = childWindow.document;
    doc.open();

    const customizedTemplate = templateHtml
        .replace('// CHANNEL_NAME_PLACEHOLDER', `const CHANNEL_NAME = "${channelName}";`);

    doc.write(customizedTemplate);
    doc.close();

    clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(pollInterval);
            childWindow = null;
            outPopupOpen.set(false);
            outConnected.set(false);
            outConnecting.set(false);
            closeBroadcastChannel();
        }
    }, 500);
};

inClose.onTriggered = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
    }
    outPopupOpen.set(false);
    outConnected.set(false);
    outConnecting.set(false);
    closeBroadcastChannel();
};

inConnect.onTriggered = () => {
    if (!childWindow || childWindow.closed) {
        inOpen.onTriggered();
    } else {
        sendConfig(true);
    }
};

inDisconnect.onTriggered = () => {
    if (bc && childWindow && !childWindow.closed) {
        bc.postMessage({ type: "disconnect" });
    }
};

inSend.onTriggered = () => {
    if (!bc || !childWindow || childWindow.closed) {
        outError.set("Popup window is not open.");
        return;
    }

    const fmt = inFormat.get();
    let dataToSend = null;

    if (fmt === "Text / String") {
        dataToSend = inMsgString.get();
    } else if (fmt === "JSON / Object") {
        dataToSend = inMsgData.get();
    } else {
        // Auto mode
        const obj = inMsgData.get();
        const str = inMsgString.get();
        if (obj !== null && obj !== undefined) {
            dataToSend = obj;
        } else {
            dataToSend = str;
        }
    }

    bc.postMessage({
        type: "send",
        data: dataToSend,
        format: fmt
    });
};

op.onLoaded = () => {
    if (inAutoConnect.get()) {
        inOpen.onTriggered();
    }
};

op.onDelete = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
    }
    clearInterval(pollInterval);
    closeBroadcastChannel();
};
