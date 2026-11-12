/**
 * Ops.Extension.Standalone.ClientRegistry
 *
 * Manages dynamic registration of visualization clients (`client:register`),
 * maintains live parameter state across registered manifests, and synchronizes
 * state with Tweakpane Dashboard controllers (`registry:sync`, `client:update`).
 */

const
    inProcess = op.inTrigger("Process Message"),
    inMessageData = op.inObject("WS Message Data"),
    inServer = op.inObject("Server Instance"),
    inDiscover = op.inTriggerButton("Discover Clients"),
    inClear = op.inTriggerButton("Clear Registry"),

    outOnRegister = op.outTrigger("On Client Registered"),
    outOnParamUpdate = op.outTrigger("On Parameter Update"),
    outSendTrigger = op.outTrigger("Send WS Trigger"),
    outWsData = op.outObject("WS Out Data"),
    outClients = op.outObject("Registered Clients", {}),
    outClientIds = op.outArray("Client IDs", []),
    outClientCount = op.outNumber("Client Count", 0),
    outLastClientId = op.outString("Last Client ID", ""),
    outLastUpdate = op.outObject("Last Parameter Update", null);

op.setPortGroup("WebSocket Input", [inProcess, inMessageData, inServer]);
op.setPortGroup("Actions", [inDiscover, inClear]);
op.setPortGroup("Events & Outbound", [outOnRegister, outOnParamUpdate, outSendTrigger, outWsData]);
op.setPortGroup("Registry State", [outClients, outClientIds, outClientCount, outLastClientId, outLastUpdate]);

const registry = new Map(); // clientId -> { manifest, originId, registeredAt, updatedAt }
const socketToClientId = new Map(); // ws -> Set<clientId>

let attachedServer = null;
let attachedWss = null;
let wssConnectionListener = null;
const attachedSockets = new WeakSet();
let lastProcessedPayload = null;

function cloneJson(obj)
{
    try
    {
        return JSON.parse(JSON.stringify(obj));
    }
    catch (e)
    {
        return obj;
    }
}

function getRegistrySnapshot()
{
    const snapshot = {};
    registry.forEach((entry, clientId) =>
    {
        snapshot[clientId] = cloneJson(entry.manifest);
    });
    return snapshot;
}

function updateRegistryOutputs()
{
    const snapshot = getRegistrySnapshot();
    const ids = Array.from(registry.keys());
    outClients.set(snapshot);
    outClientIds.set(ids);
    outClientCount.set(ids.length);
}

function dispatchWsPayload(payload, excludeSocket = null)
{
    outWsData.set(payload);
    outSendTrigger.trigger();

    const srv = inServer.get();
    if (srv && typeof srv.broadcastExcept === "function")
    {
        srv.broadcastExcept({
            "channel": "clientRegistry",
            "data": payload
        }, excludeSocket);
    }
}

function unwrapMessage(raw)
{
    if (!raw) return null;
    let msg = raw;
    if (typeof msg === "string")
    {
        try
        {
            msg = JSON.parse(msg);
        }
        catch (e)
        {
            return null;
        }
    }
    if (msg && typeof msg === "object" && msg.data && typeof msg.data === "object" && !msg.type)
    {
        return msg.data;
    }
    return msg;
}

function handleClientRegister(msg, senderWs = null)
{
    const manifest = msg.manifest;
    if (!manifest || typeof manifest !== "object" || !manifest.clientId)
    {
        op.logWarn("[ClientRegistry] Invalid client:register manifest:", msg);
        return;
    }

    const clientId = String(manifest.clientId);
    const existing = registry.get(clientId);

    const normalizedManifest = {
        "clientId": clientId,
        "clientType": manifest.clientType || "custom",
        "name": manifest.name || clientId,
        "parameters": cloneJson(manifest.parameters || {}),
        "subscriptions": Object.assign(
            { "mouse": false, "keyboard": false, "stateUpdates": true },
            manifest.subscriptions || {}
        )
    };

    // Preserve any existing live parameter values if re-registering without explicit reset
    if (existing && existing.manifest && existing.manifest.parameters && msg.preserveState)
    {
        Object.keys(existing.manifest.parameters).forEach((key) =>
        {
            if (normalizedManifest.parameters[key] && existing.manifest.parameters[key].value !== undefined)
            {
                normalizedManifest.parameters[key].value = existing.manifest.parameters[key].value;
            }
        });
    }

    registry.set(clientId, {
        "manifest": normalizedManifest,
        "originId": msg.originId || null,
        "registeredAt": existing ? existing.registeredAt : Date.now(),
        "updatedAt": Date.now()
    });

    if (senderWs)
    {
        if (!socketToClientId.has(senderWs))
        {
            socketToClientId.set(senderWs, new Set());
        }
        socketToClientId.get(senderWs).add(clientId);
    }

    outLastClientId.set(clientId);
    updateRegistryOutputs();
    outOnRegister.trigger();

    // Broadcast updated registry state to all connected dashboards
    dispatchWsPayload({
        "type": "registry:sync",
        "originId": "server-registry",
        "clients": getRegistrySnapshot()
    }, null);
}

function handleClientUnregister(msg)
{
    const clientId = msg.clientId || (msg.manifest && msg.manifest.clientId);
    if (!clientId || !registry.has(clientId)) return;

    registry.delete(clientId);
    updateRegistryOutputs();

    dispatchWsPayload({
        "type": "registry:sync",
        "originId": "server-registry",
        "clients": getRegistrySnapshot()
    }, null);
}

function handleClientUpdate(msg, senderWs = null)
{
    const clientId = msg.clientId;
    const updates = {};

    if (msg.parameters && typeof msg.parameters === "object")
    {
        Object.assign(updates, msg.parameters);
    }
    if (typeof msg.key === "string" && msg.value !== undefined)
    {
        updates[msg.key] = msg.value;
    }

    if (clientId && registry.has(clientId))
    {
        const entry = registry.get(clientId);
        const paramDefs = entry.manifest.parameters || {};
        Object.keys(updates).forEach((k) =>
        {
            if (paramDefs[k] && typeof paramDefs[k] === "object")
            {
                paramDefs[k].value = updates[k];
            }
            else
            {
                paramDefs[k] = { "type": typeof updates[k], "value": updates[k], "group": "General" };
            }
        });
        entry.updatedAt = Date.now();
        updateRegistryOutputs();
    }

    const updateRecord = {
        "type": "client:update",
        "originId": msg.originId || null,
        "clientId": clientId || null,
        "key": msg.key || null,
        "value": msg.value !== undefined ? msg.value : null,
        "parameters": updates,
        "timestamp": Date.now()
    };

    if (clientId) outLastClientId.set(clientId);
    outLastUpdate.set(updateRecord);
    outOnParamUpdate.trigger();

    // Forward parameter update to all clients except the originating socket
    dispatchWsPayload(updateRecord, senderWs);
}

function processIncomingMessage(rawMsg, senderWs = null)
{
    const msg = unwrapMessage(rawMsg);
    if (!msg || typeof msg !== "object" || !msg.type) return;

    // Deduplicate if both Server Instance listener and Process Message trigger are wired
    if (lastProcessedPayload === msg) return;
    lastProcessedPayload = msg;
    setTimeout(() =>
    {
        if (lastProcessedPayload === msg) lastProcessedPayload = null;
    }, 0);

    switch (msg.type)
    {
    case "client:register":
        handleClientRegister(msg, senderWs);
        break;

    case "client:unregister":
        handleClientUnregister(msg);
        break;

    case "client:update":
    case "param:update":
        if (msg.target === "dashboard")
        {
            dispatchWsPayload(msg, senderWs);
        }
        else
        {
            handleClientUpdate(msg, senderWs);
        }
        break;

    case "dashboard:update":
    case "midi:update":
    case "client:select":
    case "pane:select":
    case "tab:select":
    case "activePane":
        dispatchWsPayload(msg, senderWs);
        break;

    case "registry:request":
        dispatchWsPayload({
            "type": "registry:sync",
            "originId": "server-registry",
            "clients": getRegistrySnapshot()
        }, null);
        dispatchWsPayload({
            "type": "client:discover",
            "originId": "server-registry"
        }, senderWs);
        break;
    }
}

function attachToSocket(ws)
{
    if (!ws || attachedSockets.has(ws)) return;
    attachedSockets.add(ws);

    ws.on("message", (raw) =>
    {
        let parsed = raw;
        try
        {
            if (Buffer.isBuffer(raw)) raw = raw.toString();
            parsed = JSON.parse(raw);
        }
        catch (e)
        {
            return;
        }
        processIncomingMessage(parsed, ws);
    });

    ws.on("close", () =>
    {
        if (socketToClientId.has(ws))
        {
            socketToClientId.delete(ws);
        }
    });
}

function detachServer()
{
    if (attachedWss && wssConnectionListener)
    {
        try
        {
            attachedWss.off("connection", wssConnectionListener);
        }
        catch (e) {}
    }
    attachedServer = null;
    attachedWss = null;
    wssConnectionListener = null;
}

function setupServerBinding()
{
    detachServer();
    const srv = inServer.get();
    if (!srv || !srv.wss) return;

    attachedServer = srv;
    attachedWss = srv.wss;

    wssConnectionListener = (ws) =>
    {
        attachToSocket(ws);
    };

    attachedWss.on("connection", wssConnectionListener);

    if (srv.wsClients && typeof srv.wsClients.forEach === "function")
    {
        srv.wsClients.forEach((ws) =>
        {
            attachToSocket(ws);
        });
    }
}

inServer.onChange = setupServerBinding;

inProcess.onTriggered = () =>
{
    const raw = inMessageData.get();
    if (!raw) return;
    processIncomingMessage(raw, null);
};

inDiscover.onTriggered = () =>
{
    dispatchWsPayload({
        "type": "client:discover",
        "originId": "server-registry"
    }, null);
};

inClear.onTriggered = () =>
{
    registry.clear();
    socketToClientId.clear();
    outLastClientId.set("");
    outLastUpdate.set(null);
    updateRegistryOutputs();

    dispatchWsPayload({
        "type": "registry:sync",
        "originId": "server-registry",
        "clients": {}
    }, null);
};

op.onDelete = () =>
{
    detachServer();
};

updateRegistryOutputs();

