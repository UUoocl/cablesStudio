const
    inUrl = op.inString("URL", "ws://127.0.0.1:8080"),
    inProtocols = op.inString("Protocols", ""),
    inChannelName = op.inString("Broadcast Channel Name", "ws-external-client-bridge"),
    inActive = op.inBool("Active", true),
    inAutoOpen = op.inBool("Auto Open Popup", true),
    inAutoReconnect = op.inBool("Auto Reconnect", true),
    inReconnectInterval = op.inFloat("Reconnect Interval", 2),
    inOpen = op.inTriggerButton("Open Popup"),
    inClose = op.inTriggerButton("Close Popup"),
    inConnect = op.inTriggerButton("Connect"),
    inDisconnect = op.inTriggerButton("Disconnect"),

    // Diagnostics / Performance
    inEnablePopupLog = op.inBool("Enable Message Log", false),

    // Direct Send ports for convenience
    inSendChannel = op.inString("Send Channel", "message"),
    inSendData = op.inObject("Send Data", null),
    inSendText = op.inString("Send Text", ""),
    inSend = op.inTriggerButton("Send"),

    // Outputs
    outConnection = op.outObject("Client Connection"),
    outPopupOpen = op.outBoolNum("Popup Open", false),
    outConnected = op.outBoolNum("Connected", false),
    outConnecting = op.outBoolNum("Connecting", false),
    outOnConnected = op.outTrigger("On Connected"),
    outOnDisconnected = op.outTrigger("On Disconnected"),
    outOnMessage = op.outTrigger("On Message"),
    outData = op.outObject("Received Data"),
    outRaw = op.outString("Raw Message"),
    outStatus = op.outString("Status", "popup closed"),
    outError = op.outString("Error", "");

op.setPortGroup("Connection", [
    inUrl, inProtocols, inChannelName, inActive,
    inAutoOpen, inAutoReconnect, inReconnectInterval,
    inOpen, inClose, inConnect, inDisconnect
]);
op.setPortGroup("Diagnostics", [inEnablePopupLog]);
op.setPortGroup("Direct Send", [inSendChannel, inSendData, inSendText, inSend]);

outConnection.ignoreValueSerialize = true;

let bc = null;
let childWindow = null;
let pollInterval = null;

const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cables Standalone External WebSocket Client Bridge</title>
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
            --accent-indigo: #6366f1;
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
            padding: 14px;
            gap: 10px;
            overflow: hidden;
            user-select: none;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 10px 16px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
            filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
        }

        .title-text {
            font-size: 1.05rem;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .badge-tag {
            font-size: 0.65rem;
            background: linear-gradient(135deg, #6366f1, #38bdf8);
            color: #ffffff;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            text-transform: uppercase;
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
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--text-muted);
            transition: all 0.2s ease;
        }

        .status-badge.connected {
            background-color: rgba(16, 185, 129, 0.15);
            color: var(--accent-emerald);
            border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .status-badge.connected .status-dot {
            background-color: var(--accent-emerald);
            box-shadow: 0 0 10px var(--accent-emerald);
        }

        .status-badge.connecting {
            background-color: rgba(245, 158, 11, 0.15);
            color: var(--accent-amber);
            border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .status-badge.connecting .status-dot {
            background-color: var(--accent-amber);
            animation: pulse 1s infinite alternate;
        }

        .status-badge.disconnected {
            background-color: rgba(244, 63, 94, 0.15);
            color: var(--accent-rose);
            border: 1px solid rgba(244, 63, 94, 0.35);
        }
        .status-badge.disconnected .status-dot {
            background-color: var(--accent-rose);
        }

        @keyframes pulse {
            0% { opacity: 0.3; }
            100% { opacity: 1; }
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .stat-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .stat-label {
            font-size: 0.68rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .stat-value {
            font-size: 0.85rem;
            font-weight: 600;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .subs-bar {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            overflow-x: auto;
        }

        .subs-label {
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.68rem;
            flex-shrink: 0;
        }

        .subs-list {
            display: flex;
            gap: 6px;
            flex-wrap: nowrap;
        }

        .sub-pill {
            background-color: rgba(99, 102, 241, 0.2);
            color: var(--accent-cyan);
            border: 1px solid rgba(99, 102, 241, 0.4);
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 0.72rem;
            font-weight: 500;
            white-space: nowrap;
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
            padding: 6px 12px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
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
            padding: 10px 12px;
            overflow-y: auto;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.76rem;
            display: flex;
            flex-direction: column;
            gap: 4px;
            user-select: text;
        }

        .log-row {
            line-height: 1.4;
            word-break: break-all;
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }

        .log-time {
            color: #475569;
            flex-shrink: 0;
        }

        .log-tag {
            font-weight: 700;
            flex-shrink: 0;
            border-radius: 3px;
            padding: 0 5px;
            font-size: 0.68rem;
        }

        .tag-in { background-color: rgba(16, 185, 129, 0.2); color: var(--accent-emerald); }
        .tag-out { background-color: rgba(56, 189, 248, 0.2); color: var(--accent-cyan); }
        .tag-sub { background-color: rgba(168, 85, 247, 0.2); color: var(--accent-purple); }
        .tag-pub { background-color: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .tag-sys { background-color: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
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

        .channel-input {
            width: 140px;
            background-color: #050811;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: #ffffff;
            padding: 6px 10px;
            font-size: 0.8rem;
            outline: none;
            font-family: inherit;
        }
        .channel-input:focus {
            border-color: var(--accent-purple);
        }

        .test-input {
            flex-grow: 1;
            background-color: #050811;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: #ffffff;
            padding: 6px 10px;
            font-size: 0.8rem;
            outline: none;
            font-family: inherit;
        }
        .test-input:focus {
            border-color: var(--accent-cyan);
        }

        .footer {
            font-size: 0.7rem;
            color: #64748b;
            text-align: center;
            display: flex;
            justify-content: space-between;
            align-items: center;
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
            <div class="title-text">
                WebSocket Client Bridge
                <span class="badge-tag">Popup Bridge</span>
            </div>
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
            <div class="stat-label">Broadcast Channel</div>
            <div id="stat-channel" class="stat-value">-</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Received</div>
            <div id="stat-rx" class="stat-value">0 msgs</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Sent / Pub</div>
            <div id="stat-tx" class="stat-value">0 msgs</div>
        </div>
    </div>

    <div class="subs-bar">
        <span class="subs-label">Subscriptions:</span>
        <div id="subs-list" class="subs-list">
            <span style="color: #64748b; font-style: italic;">None</span>
        </div>
    </div>

    <div class="control-bar">
        <button id="btn-connect" class="btn-primary">Connect</button>
        <button id="btn-disconnect" class="btn-danger">Disconnect</button>
        <button id="btn-clear">Clear Log</button>
        <div style="flex-grow: 1;"></div>
        <label style="font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="chk-enable-log"> Log Messages
        </label>
        <label style="font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="chk-autoscroll" checked> Auto-scroll
        </label>
    </div>

    <div id="log" class="log-container">
        <div class="log-row">
            <span class="log-time">--:--:--</span>
            <span class="log-tag tag-sys">SYS</span>
            <span class="log-msg">External WebSocket Client popup initialized. Ready for connection.</span>
        </div>
    </div>

    <div class="test-bar">
        <input type="text" id="input-channel" class="channel-input" placeholder="Channel (e.g. message)" value="message">
        <input type="text" id="input-test" class="test-input" placeholder="Payload string or JSON to publish...">
        <button id="btn-send">Publish</button>
    </div>

    <div class="footer">
        <span>Maintains WebSocket connection from browser to Electron Standalone.</span>
        <span style="color: #475569;">Keep window open while working in Cables</span>
    </div>

    <script>
        // CHANNEL_NAME_PLACEHOLDER

        document.getElementById("stat-channel").innerText = CHANNEL_NAME;
        const bc = new BroadcastChannel(CHANNEL_NAME);

        let ws = null;
        let targetUrl = "";
        let targetProtocols = "";
        let autoReconnect = true;
        let reconnectInterval = 2000;
        let reconnectTimer = null;
        let rxCount = 0;
        let txCount = 0;
        let intentionalClose = false;
        let enableMessageLog = false;
        let updateStatsPending = false;
        const MAX_LOG_ROWS = 100;
        const activeSubscriptions = new Set();

        const logContainer = document.getElementById("log");
        const statusBadge = document.getElementById("status-badge");
        const statusText = document.getElementById("status-text");
        const statUrl = document.getElementById("stat-url");
        const statRx = document.getElementById("stat-rx");
        const statTx = document.getElementById("stat-tx");
        const subsListEl = document.getElementById("subs-list");
        const chkEnableLog = document.getElementById("chk-enable-log");
        const chkAutoscroll = document.getElementById("chk-autoscroll");
        const inputChannel = document.getElementById("input-channel");
        const inputTest = document.getElementById("input-test");

        function scheduleStatsUpdate() {
            if (!updateStatsPending) {
                updateStatsPending = true;
                requestAnimationFrame(() => {
                    statRx.innerText = rxCount + " msgs";
                    statTx.innerText = txCount + " msgs";
                    updateStatsPending = false;
                });
            }
        }

        function updateSubsUI() {
            if (activeSubscriptions.size === 0) {
                subsListEl.innerHTML = '<span style="color: #64748b; font-style: italic;">None</span>';
            } else {
                subsListEl.innerHTML = "";
                activeSubscriptions.forEach((ch) => {
                    const pill = document.createElement("span");
                    pill.className = "sub-pill";
                    pill.innerText = ch;
                    subsListEl.appendChild(pill);
                });
            }
        }

        function log(msg, tag = "SYS") {
            const isDataPacket = (tag === "IN" || tag === "OUT" || tag === "PUB");
            if (isDataPacket && !enableMessageLog) {
                return;
            }

            while (logContainer.children.length >= MAX_LOG_ROWS) {
                logContainer.removeChild(logContainer.firstChild);
            }

            const row = document.createElement("div");
            row.className = "log-row";

            const time = document.createElement("span");
            time.className = "log-time";
            time.innerText = new Date().toLocaleTimeString();

            const tagEl = document.createElement("span");
            let tagClass = "tag-sys";
            if (tag === "IN") tagClass = "tag-in";
            else if (tag === "OUT") tagClass = "tag-out";
            else if (tag === "SUB") tagClass = "tag-sub";
            else if (tag === "PUB") tagClass = "tag-pub";
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

                    // Resubscribe to all active subscriptions
                    activeSubscriptions.forEach((ch) => {
                        sendPayload({
                            "type": "subscribe",
                            "channel": ch
                        });
                        log("Auto resubscribed channel: " + ch, "SUB");
                    });

                    bc.postMessage({
                        type: "open",
                        url: targetUrl
                    });
                };

                ws.onmessage = (evt) => {
                    rxCount++;
                    scheduleStatsUpdate();

                    let rawData = evt.data;
                    let rawStr = rawData !== undefined ? String(rawData) : "";
                    let parsed = null;

                    if (typeof rawData === "string") {
                        try {
                            parsed = JSON.parse(rawData);
                        } catch (e) {}
                    }

                    log(rawStr, "IN");

                    bc.postMessage({
                        type: "message",
                        data: rawData,
                        raw: rawStr,
                        parsed: parsed,
                        timestamp: Date.now()
                    });
                };

                ws.onerror = (evt) => {
                    const errMsg = evt && evt.message ? evt.message : "WebSocket error";
                    log("WebSocket Error: " + errMsg, "ERR");
                    bc.postMessage({
                        type: "error",
                        error: errMsg
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

        function sendPayload(payload) {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                return false;
            }
            try {
                const str = typeof payload === "string" ? payload : JSON.stringify(payload);
                ws.send(str);
                txCount++;
                scheduleStatsUpdate();
                return true;
            } catch (err) {
                log("Send failed: " + err.message, "ERR");
                bc.postMessage({
                    type: "error",
                    error: err.message
                });
                return false;
            }
        }

        function handleSubscribe(channel) {
            if (!channel) return;
            activeSubscriptions.add(channel);
            updateSubsUI();
            if (ws && ws.readyState === WebSocket.OPEN) {
                sendPayload({
                    "type": "subscribe",
                    "channel": channel
                });
                log("Subscribed: " + channel, "SUB");
            }
        }

        function handleUnsubscribe(channel) {
            if (!channel) return;
            activeSubscriptions.delete(channel);
            updateSubsUI();
            if (ws && ws.readyState === WebSocket.OPEN) {
                sendPayload({
                    "type": "unsubscribe",
                    "channel": channel
                });
                log("Unsubscribed: " + channel, "SUB");
            }
        }

        // DOM Event Listeners
        document.getElementById("btn-connect").onclick = () => connect();
        document.getElementById("btn-disconnect").onclick = () => disconnect();
        document.getElementById("btn-clear").onclick = () => {
            logContainer.innerHTML = "";
            log("Log cleared.", "SYS");
        };

        chkEnableLog.onchange = () => {
            enableMessageLog = chkEnableLog.checked;
            bc.postMessage({
                type: "toggle_log",
                enabled: enableMessageLog
            });
        };

        function submitTestMessage() {
            const ch = inputChannel.value.trim() || "message";
            const val = inputTest.value.trim();
            if (!val) return;

            let parsed = null;
            try {
                parsed = JSON.parse(val);
            } catch (e) {}

            const payload = {
                "type": "publish",
                "channel": ch,
                "data": parsed !== null ? parsed : val
            };

            if (sendPayload(payload)) {
                log(payload, "PUB");
                inputTest.value = "";
            } else {
                log("Cannot publish: WebSocket not connected.", "ERR");
            }
        }

        document.getElementById("btn-send").onclick = submitTestMessage;
        inputTest.onkeydown = (e) => {
            if (e.key === "Enter") submitTestMessage();
        };

        window.addEventListener("beforeunload", () => {
            bc.postMessage({ type: "popup_closing" });
        });

        // BroadcastChannel Receiver
        bc.onmessage = (event) => {
            const msg = event.data;
            if (!msg) return;

            switch (msg.type) {
                case "connect":
                    if (msg.autoReconnect !== undefined) autoReconnect = msg.autoReconnect;
                    if (msg.reconnectInterval !== undefined) reconnectInterval = msg.reconnectInterval;
                    if (msg.enableMessageLog !== undefined) {
                        enableMessageLog = Boolean(msg.enableMessageLog);
                        chkEnableLog.checked = enableMessageLog;
                    }
                    if (Array.isArray(msg.subscriptions)) {
                        msg.subscriptions.forEach(s => activeSubscriptions.add(s));
                        updateSubsUI();
                    }
                    connect(msg.url, msg.protocols);
                    break;

                case "disconnect":
                    disconnect();
                    break;

                case "send":
                    if (msg.data !== undefined) {
                        if (sendPayload(msg.data)) {
                            log(msg.data, "OUT");
                        }
                    }
                    break;

                case "publish":
                    const pubPayload = Object.assign({
                        "type": "publish",
                        "channel": msg.channel || "message",
                        "data": msg.data
                    }, msg.opts || {});
                    if (sendPayload(pubPayload)) {
                        log(pubPayload, "PUB");
                    }
                    break;

                case "subscribe":
                    handleSubscribe(msg.channel);
                    break;

                case "unsubscribe":
                    handleUnsubscribe(msg.channel);
                    break;

                case "sync_subscriptions":
                    if (Array.isArray(msg.subscriptions)) {
                        activeSubscriptions.clear();
                        msg.subscriptions.forEach(s => activeSubscriptions.add(s));
                        updateSubsUI();
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            activeSubscriptions.forEach((ch) => {
                                sendPayload({
                                    "type": "subscribe",
                                    "channel": ch
                                });
                            });
                        }
                    }
                    break;

                case "config":
                    if (msg.autoReconnect !== undefined) autoReconnect = msg.autoReconnect;
                    if (msg.reconnectInterval !== undefined) reconnectInterval = msg.reconnectInterval;
                    if (msg.enableMessageLog !== undefined) {
                        enableMessageLog = Boolean(msg.enableMessageLog);
                        chkEnableLog.checked = enableMessageLog;
                    }
                    if (msg.url && msg.url !== targetUrl) {
                        targetUrl = msg.url;
                        statUrl.innerText = targetUrl;
                    }
                    if (msg.protocols !== undefined) targetProtocols = msg.protocols;
                    break;
            }
        };

        // Notify parent op that popup is ready
        bc.postMessage({ type: "ready" });
    </script>
</body>
</html>`;

class CablesExternalWebSocketClient {
    constructor() {
        this.listeners = new Map();
        this.subscriptions = new Set();
        this.isConnected = false;
        this.isConnecting = false;
    }

    on(event, fn) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(fn);
    }

    addListener(event, fn) {
        this.on(event, fn);
    }

    off(event, fn) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(fn);
        }
    }

    removeListener(event, fn) {
        this.off(event, fn);
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((fn) => {
                try {
                    fn(...args);
                } catch (e) {
                    op.logWarn("[ExternalWebSocketClient Listener Error]", e);
                }
            });
        }
    }

    subscribe(channel) {
        if (!channel || typeof channel !== "string") return;
        this.subscriptions.add(channel);
        if (bc) {
            bc.postMessage({
                "type": "subscribe",
                "channel": channel
            });
        }
    }

    unsubscribe(channel) {
        if (!channel) return;
        this.subscriptions.delete(channel);
        if (bc) {
            bc.postMessage({
                "type": "unsubscribe",
                "channel": channel
            });
        }
    }

    publish(channel, data, opts = {}) {
        if (!bc) return false;
        bc.postMessage({
            "type": "publish",
            "channel": channel || "message",
            "data": data,
            "opts": opts
        });
        return true;
    }

    send(data) {
        if (!bc) return false;
        bc.postMessage({
            "type": "send",
            "data": data
        });
        return true;
    }

    connect(url) {
        if (url) inUrl.set(url);
        if (!childWindow || childWindow.closed) {
            openPopup();
        } else {
            sendConfigToPopup(true);
        }
    }

    disconnect() {
        if (bc) {
            bc.postMessage({ "type": "disconnect" });
        }
    }

    destroy() {
        this.listeners.clear();
        this.subscriptions.clear();
    }
}

const clientInstance = new CablesExternalWebSocketClient();
outConnection.set(clientInstance);

function sendConfigToPopup(triggerConnect = false) {
    if (bc && childWindow && !childWindow.closed) {
        const url = inUrl.get();
        const protocols = inProtocols.get();
        const autoRec = inAutoReconnect.get();
        const interval = Math.max(0.5, inReconnectInterval.get()) * 1000;
        const enableLog = inEnablePopupLog.get();
        const subsArray = Array.from(clientInstance.subscriptions);

        if (triggerConnect) {
            bc.postMessage({
                "type": "connect",
                "url": url,
                "protocols": protocols,
                "autoReconnect": autoRec,
                "reconnectInterval": interval,
                "enableMessageLog": enableLog,
                "subscriptions": subsArray
            });
        } else {
            bc.postMessage({
                "type": "config",
                "url": url,
                "protocols": protocols,
                "autoReconnect": autoRec,
                "reconnectInterval": interval,
                "enableMessageLog": enableLog
            });
        }
    }
}

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
                sendConfigToPopup(inActive.get());
                break;

            case "toggle_log":
                if (msg.enabled !== undefined && inEnablePopupLog.get() !== msg.enabled) {
                    inEnablePopupLog.set(msg.enabled);
                }
                break;

            case "status":
                clientInstance.isConnected = Boolean(msg.connected);
                clientInstance.isConnecting = Boolean(msg.connecting);
                outConnected.set(clientInstance.isConnected);
                outConnecting.set(clientInstance.isConnecting);

                if (msg.connected) {
                    outStatus.set("connected");
                } else if (msg.connecting) {
                    outStatus.set("connecting");
                } else {
                    outStatus.set("disconnected");
                }

                if (msg.error) {
                    outError.set(msg.error);
                } else {
                    outError.set("");
                }
                break;

            case "open":
                clientInstance.isConnected = true;
                clientInstance.isConnecting = false;
                outConnected.set(true);
                outConnecting.set(false);
                outStatus.set("connected");
                outError.set("");
                clientInstance.emit("open");
                outOnConnected.trigger();
                break;

            case "close":
                clientInstance.isConnected = false;
                clientInstance.isConnecting = false;
                outConnected.set(false);
                outConnecting.set(false);
                outStatus.set("disconnected");
                clientInstance.emit("close");
                outOnDisconnected.trigger();
                break;

            case "message":
                const rawStr = msg.raw !== undefined ? String(msg.raw) : (msg.data !== undefined ? String(msg.data) : "");
                outRaw.set(rawStr);

                const parsed = msg.parsed !== undefined ? msg.parsed : null;
                outData.set(parsed !== null ? parsed : rawStr);

                if (parsed && typeof parsed === "object") {
                    if (parsed.type === "message" || parsed.channel) {
                        const channelName = parsed.channel || "message";
                        clientInstance.emit("message", parsed);
                        clientInstance.emit(`channel:${channelName}`, parsed.data, parsed.sender || "", parsed);
                    } else {
                        clientInstance.emit("message", parsed);
                    }
                } else {
                    clientInstance.emit("rawMessage", rawStr);
                }

                outOnMessage.trigger();
                break;

            case "error":
                outError.set(msg.error || "WebSocket Error");
                clientInstance.emit("error", msg.error);
                break;

            case "popup_closing":
                clientInstance.isConnected = false;
                clientInstance.isConnecting = false;
                outPopupOpen.set(false);
                outConnected.set(false);
                outConnecting.set(false);
                outStatus.set("popup closed");
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

function openPopup() {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    setupBroadcastChannel();

    const channelName = inChannelName.get() || "ws-external-client-bridge";
    const features = "width=680,height=640,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";

    childWindow = window.open("", `cables_ws_bridge_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup window was blocked by the browser. Please allow popups for cables.gl.");
        outPopupOpen.set(false);
        outStatus.set("popup blocked");
        return;
    }

    outPopupOpen.set(true);
    outStatus.set("popup open");

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
            clientInstance.isConnected = false;
            clientInstance.isConnecting = false;
            outStatus.set("popup closed");
            closeBroadcastChannel();
        }
    }, 500);
}

function closePopup() {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
    }
    clearInterval(pollInterval);
    outPopupOpen.set(false);
    outConnected.set(false);
    outConnecting.set(false);
    clientInstance.isConnected = false;
    clientInstance.isConnecting = false;
    outStatus.set("popup closed");
    closeBroadcastChannel();
}

inOpen.onTriggered = () => {
    openPopup();
};

inClose.onTriggered = () => {
    closePopup();
};

inConnect.onTriggered = () => {
    if (!childWindow || childWindow.closed) {
        openPopup();
    } else {
        sendConfigToPopup(true);
    }
};

inDisconnect.onTriggered = () => {
    if (clientInstance) {
        clientInstance.disconnect();
    }
};

inSend.onTriggered = () => {
    const channel = inSendChannel.get() || "message";
    const dataObj = inSendData.get();
    const dataText = inSendText.get();
    const payload = dataObj !== null && dataObj !== undefined ? dataObj : dataText;

    if (!payload && payload !== "") return;

    clientInstance.publish(channel, payload);
};

inUrl.onChange = () => sendConfigToPopup(false);
inProtocols.onChange = () => sendConfigToPopup(false);
inAutoReconnect.onChange = () => sendConfigToPopup(false);
inReconnectInterval.onChange = () => sendConfigToPopup(false);
inEnablePopupLog.onChange = () => sendConfigToPopup(false);

inChannelName.onChange = () => {
    setupBroadcastChannel();
};

inActive.onChange = () => {
    if (inActive.get()) {
        if (!childWindow || childWindow.closed) {
            if (inAutoOpen.get()) {
                openPopup();
            }
        } else {
            sendConfigToPopup(true);
        }
    } else {
        if (clientInstance) {
            clientInstance.disconnect();
        }
    }
};

op.onLoaded = () => {
    if (inActive.get() && inAutoOpen.get()) {
        openPopup();
    }
};

op.onDelete = () => {
    closePopup();
    if (clientInstance) {
        clientInstance.destroy();
    }
    outConnection.set(null);
};

// Initial auto-open check
if (inActive.get() && inAutoOpen.get()) {
    openPopup();
}

