const url = op.require("url");
const wsModule = op.require("ws");
const WebSocket = wsModule.WebSocket || wsModule;
const WebSocketServer = wsModule.WebSocketServer || wsModule.Server || wsModule;

const
    inServer = op.inObject("Server Instance"),
    inChannel = op.inString("Channel", ""),
    inData = op.inObject("Message Data"),
    inPublish = op.inTriggerButton("Publish"),
    inResponseData = op.inObject("Response Data"),
    inSendResponse = op.inTriggerButton("Send Response"),

    outMessageReceived = op.outTrigger("On Message Received"),
    outReceivedChannel = op.outString("Received Channel"),
    outReceivedData = op.outObject("Received Data"),
    outActiveClients = op.outNumber("Active Clients", 0),
    outOnRequest = op.outTrigger("On Request"),
    outRequestData = op.outObject("Request Data");

const pendingCalls = new Map(); // requestId -> ws client

let server = null;
let wss = null;
let currentOnUpgrade = null;
let wsConnectionHandler = null;
const clients = new Set();
const subscriptions = new Map(); // channelName -> Set of ws clients

inServer.onChange = () => {
    cleanup();
    setup();
};

op.onDelete = () => {
    cleanup();
};

inPublish.onTriggered = () => {
    const channel = inChannel.get();
    const data = inData.get();
    if (!channel) return;

    broadcastToChannel(channel, data, null);
};

function setup() {
    server = inServer.get();
    if (!server) return;

    try {
        let isShared = false;
        if (server.wss) {
            wss = server.wss;
            isShared = true;
            op.log("[WsPubSub] Sharing WebSocket Server instance from HTTP Server");
        } else {
            wss = new WebSocketServer({ noServer: true });
            currentOnUpgrade = (request, socket, head) => {
                const pathname = url.parse(request.url).pathname;
                if (pathname === '/websocket' || pathname === '/websocket/') {
                    wss.handleUpgrade(request, socket, head, (wsConnection) => {
                        wss.emit('connection', wsConnection, request);
                    });
                }
            };
            server.on('upgrade', currentOnUpgrade);
            op.log("[WsPubSub] Created custom standalone WebSocket Server");
        }

        wsConnectionHandler = (ws) => {
            if (clients.has(ws)) return; // Prevent double registration

            clients.add(ws);
            ws.clientId = "client_" + Math.random().toString(36).substring(2, 9);
            ws.connectedAt = Date.now();
            ws.subscribedChannels = new Set();
            updateClientsCount();

            broadcastSystemEvent("client_connect", {
                clientId: ws.clientId,
                connectedAt: ws.connectedAt
            });

            ws.on('message', (rawMsg) => {
                let msg = null;
                try {
                    if (Buffer.isBuffer(rawMsg)) {
                        rawMsg = rawMsg.toString();
                    }
                    msg = JSON.parse(rawMsg);
                } catch (e) {
                    op.logWarn("[WsPubSub] Failed to parse message as JSON:", rawMsg);
                    return;
                }

                if (!msg || typeof msg !== 'object') return;

                const { type, channel, data, id, method } = msg;

                // Handle Subscriptions & Calls
                if (type === 'subscribe') {
                    if (channel) {
                        ws.subscribedChannels.add(channel);
                        if (!subscriptions.has(channel)) {
                            subscriptions.set(channel, new Set());
                        }
                        subscriptions.get(channel).add(ws);
                        op.log("[WsPubSub] Client subscribed to channel:", channel);

                        broadcastSystemEvent("subscribe", {
                            clientId: ws.clientId,
                            channel: channel
                        });
                    }
                    return;
                }

                if (type === 'unsubscribe') {
                    if (channel) {
                        ws.subscribedChannels.delete(channel);
                        if (subscriptions.has(channel)) {
                            subscriptions.get(channel).delete(ws);
                            if (subscriptions.get(channel).size === 0) {
                                subscriptions.delete(channel);
                            }
                        }
                        op.log("[WsPubSub] Client unsubscribed from channel:", channel);

                        broadcastSystemEvent("unsubscribe", {
                            clientId: ws.clientId,
                            channel: channel
                        });
                    }
                    return;
                }

                if (type === 'call') {
                    handleClientCall(ws, id, method, data);
                    return;
                }

                // If it has channel, treat as a publish event (optimized for HttpFileServer flat protocol)
                if (channel) {
                    const payloadData = data !== undefined ? data : msg.data;

                    // Forward message to all other subscribers of the channel
                    broadcastToChannel(channel, payloadData, ws);

                    // Output to Cables
                    outReceivedChannel.set(channel);
                    outReceivedData.set(payloadData);
                    outMessageReceived.trigger();

                    // Also route obsRequests channel publishes to Request/Response in patch
                    if (channel === 'obsRequests' && payloadData) {
                        const reqEnvelope = {
                            requestId: "channel_" + Math.random().toString(36).substring(2, 9),
                            requestType: payloadData.requestType || "RequestBatch",
                            requestData: payloadData.requestData || payloadData.requests || payloadData
                        };
                        outRequestData.set(reqEnvelope);
                        outOnRequest.trigger();
                    }
                }
            });

            ws.on('close', () => {
                removeClient(ws);
            });

            ws.on('error', (err) => {
                op.logWarn("[WsPubSub] Client error:", err);
                removeClient(ws);
            });
        };

        wss.on('connection', wsConnectionHandler);

        // Retroactively capture and register any clients already connected to the HttpFileServer
        if (isShared && server.wsClients && server.wsClients.size > 0) {
            server.wsClients.forEach(ws => {
                wsConnectionHandler(ws);
            });
        }

    } catch (err) {
        op.logError("[WsPubSub] Error setting up WebSocket Server:", err);
    }
}

function broadcastSystemEvent(eventType, eventData) {
    const data = {
        event: eventType,
        timestamp: Date.now(),
        data: eventData
    };
    broadcastToChannel("$system", data, null);
}

function broadcastToChannel(channel, data, excludeWs) {
    const subscribers = new Set();
    
    // Add subscribers of the specific channel
    const directSubs = subscriptions.get(channel);
    if (directSubs) {
        directSubs.forEach(ws => subscribers.add(ws));
    }
    
    // Also include any wildcard subscribers listening to ALL channels
    const wildcardSubs = subscriptions.get("*");
    if (wildcardSubs) {
        wildcardSubs.forEach(ws => subscribers.add(ws));
    }

    if (subscribers.size === 0) return;

    const payload = JSON.stringify({
        type: 'event',
        channel: channel,
        data: data
    });

    const openState = WebSocket.OPEN !== undefined ? WebSocket.OPEN : 1;
    subscribers.forEach(ws => {
        if (ws !== excludeWs && ws.readyState === openState) {
            try {
                ws.send(payload);
            } catch (e) {
                op.logWarn("[WsPubSub] Failed to send broadcast message:", e);
            }
        }
    });
}

inSendResponse.onTriggered = () => {
    const envelope = inResponseData.get();
    if (!envelope || typeof envelope !== 'object') return;

    const { requestId, requestStatus, responseData } = envelope;
    if (!requestId) return;

    const ws = pendingCalls.get(requestId);
    if (ws) {
        const openState = WebSocket.OPEN !== undefined ? WebSocket.OPEN : 1;
        if (ws.readyState === openState) {
            try {
                const response = {
                    type: 'response',
                    id: requestId,
                    data: responseData,
                    error: (requestStatus && !requestStatus.result) ? (requestStatus.comment || 'Request failed') : undefined
                };
                ws.send(JSON.stringify(response));
            } catch (e) {
                op.logWarn("[WsPubSub] Failed to send delegated OBS response to client:", e);
            }
        }
        pendingCalls.delete(requestId);
    }
};

function handleClientCall(ws, id, method, data) {
    const openState = WebSocket.OPEN !== undefined ? WebSocket.OPEN : 1;
    if (ws.readyState !== openState) return;

    if (method === 'setInfo') {
        ws.send(JSON.stringify({
            type: 'response',
            id: id,
            data: { status: 'success' }
        }));
        return;
    }

    if (method === 'getSystemState') {
        const clientList = Array.from(clients).map(c => ({
            clientId: c.clientId,
            connectedAt: c.connectedAt,
            subscribedChannels: Array.from(c.subscribedChannels || [])
        }));
        
        const channelList = Array.from(subscriptions.keys()).map(channel => ({
            channel: channel,
            subscriberCount: subscriptions.get(channel).size
        }));

        ws.send(JSON.stringify({
            type: 'response',
            id: id,
            data: {
                clients: clientList,
                channels: channelList
            }
        }));
        return;
    }


    if (method === 'obsRequest') {
        if (data && (data.requestType || data.requests)) {
            // Standardize request structure for ObsRequest operator in Cables patch
            const reqEnvelope = {
                requestId: id,
                requestType: data.requestType || "RequestBatch",
                requestData: data.requestData || data.requests || data
            };
            
            // Store client connection to respond later
            pendingCalls.set(id, ws);

            // Output to Cables
            outRequestData.set(reqEnvelope);
            outOnRequest.trigger();
        } else {
            ws.send(JSON.stringify({
                type: 'response',
                id: id,
                error: 'Invalid obsRequest payload: missing requestType or requests'
            }));
        }
        return;
    }

    ws.send(JSON.stringify({
        type: 'response',
        id: id,
        error: `Unknown method: ${method}`
    }));
}

function removeClient(ws) {
    clients.delete(ws);
    if (ws.subscribedChannels) {
        ws.subscribedChannels.forEach(channel => {
            if (subscriptions.has(channel)) {
                subscriptions.get(channel).delete(ws);
                if (subscriptions.get(channel).size === 0) {
                    subscriptions.delete(channel);
                }
            }
        });
    }
    updateClientsCount();
    broadcastSystemEvent("client_disconnect", {
        clientId: ws.clientId
    });
}

function updateClientsCount() {
    outActiveClients.set(clients.size);
}

function cleanup() {
    if (server && currentOnUpgrade) {
        try {
            server.off('upgrade', currentOnUpgrade);
        } catch(e) {}
        currentOnUpgrade = null;
    }

    if (wss && wsConnectionHandler) {
        try {
            wss.off('connection', wsConnectionHandler);
        } catch(e) {}
    }

    // Only close if we created it (not shared with HttpFileServer)
    if (wss && (!server || wss !== server.wss)) {
        try {
            wss.close();
        } catch(e) {}
    }

    wss = null;
    wsConnectionHandler = null;

    clients.clear();
    subscriptions.clear();
    updateClientsCount();
}
