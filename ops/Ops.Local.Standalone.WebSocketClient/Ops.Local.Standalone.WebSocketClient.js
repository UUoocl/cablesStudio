function getWebSocketClass()
{
    if (typeof window !== "undefined" && window.WebSocket) return window.WebSocket;
    if (typeof WebSocket !== "undefined") return WebSocket;
    try
    {
        if (typeof op !== "undefined" && op.require)
        {
            const wsMod = op.require("ws");
            return wsMod.WebSocket || wsMod;
        }
    }
    catch (e) {}
    try
    {
        if (typeof window !== "undefined" && window.nodeRequire)
        {
            const wsMod = window.nodeRequire("ws");
            return wsMod.WebSocket || wsMod;
        }
    }
    catch (e) {}
    try
    {
        if (typeof require !== "undefined")
        {
            const wsMod = require("ws");
            return wsMod.WebSocket || wsMod;
        }
    }
    catch (e) {}
    return null;
}

const
    inUrl = op.inString("URL", "ws://localhost:8080"),
    inActive = op.inBool("Active", true),
    inAutoReconnect = op.inBool("Auto Reconnect", true),
    inReconnectInterval = op.inFloat("Reconnect Interval", 2),
    inConnect = op.inTriggerButton("Connect"),
    inDisconnect = op.inTriggerButton("Disconnect"),

    outConnection = op.outObject("Client Connection"),
    outConnected = op.outBoolNum("Connected", false),
    outOnConnected = op.outTrigger("On Connected"),
    outOnDisconnected = op.outTrigger("On Disconnected"),
    outOnMessage = op.outTrigger("On Message"),
    outData = op.outObject("Received Data"),
    outRaw = op.outString("Raw Message"),
    outStatus = op.outString("Status", "disconnected"),
    outError = op.outString("Error");

outConnection.ignoreValueSerialize = true;

class CablesWebSocketClient
{
    constructor()
    {
        this.ws = null;
        this.listeners = new Map();
        this.subscriptions = new Set();
        this.isConnected = false;
        this.manualClose = false;
        this.reconnectTimer = null;
    }

    on(event, fn)
    {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(fn);
    }

    off(event, fn)
    {
        if (this.listeners.has(event))
        {
            this.listeners.get(event).delete(fn);
        }
    }

    emit(event, ...args)
    {
        if (this.listeners.has(event))
        {
            this.listeners.get(event).forEach((fn) =>
            {
                try { fn(...args); } catch (e) { op.logWarn("[WebSocketClient Listener Error]", e); }
            });
        }
    }

    subscribe(channel)
    {
        if (!channel || typeof channel !== "string") return;
        this.subscriptions.add(channel);
        if (this.isConnected && this.ws)
        {
            this.send({
                "type": "subscribe",
                "channel": channel
            });
        }
    }

    unsubscribe(channel)
    {
        if (!channel) return;
        this.subscriptions.delete(channel);
        if (this.isConnected && this.ws)
        {
            this.send({
                "type": "unsubscribe",
                "channel": channel
            });
        }
    }

    publish(channel, data, opts = {})
    {
        if (!this.isConnected || !this.ws) return false;

        const payload = Object.assign({
            "type": "publish",
            "channel": channel || "message",
            "data": data
        }, opts);

        return this.send(payload);
    }

    send(data)
    {
        if (!this.ws || this.ws.readyState !== 1) return false;
        try
        {
            const str = typeof data === "string" ? data : JSON.stringify(data);
            this.ws.send(str);
            return true;
        }
        catch (err)
        {
            op.logWarn("[WebSocketClient Send Error]", err);
            return false;
        }
    }

    connect(url)
    {
        this.disconnect();
        this.manualClose = false;

        if (!url)
        {
            outStatus.set("error");
            outError.set("Invalid or empty URL");
            return;
        }

        const WSClass = getWebSocketClass();
        if (!WSClass)
        {
            outStatus.set("error");
            outError.set("WebSocket environment not supported");
            return;
        }

        try
        {
            outStatus.set("connecting");
            outError.set("");
            this.ws = new WSClass(url);

            this.ws.onopen = () =>
            {
                this.isConnected = true;
                outConnected.set(true);
                outStatus.set("connected");
                outError.set("");

                // Resubscribe to all active subscriptions
                this.subscriptions.forEach((ch) =>
                {
                    this.send({
                        "type": "subscribe",
                        "channel": ch
                    });
                });

                this.emit("open");
                outOnConnected.trigger();
            };

            this.ws.onmessage = (event) =>
            {
                const rawStr = event.data !== undefined ? String(event.data) : "";
                outRaw.set(rawStr);

                let parsed = null;
                try
                {
                    parsed = JSON.parse(rawStr);
                }
                catch (e) {}

                outData.set(parsed !== null ? parsed : rawStr);

                if (parsed && typeof parsed === "object")
                {
                    if (parsed.type === "message" || parsed.channel)
                    {
                        const channelName = parsed.channel || "message";
                        this.emit("message", parsed);
                        this.emit(`channel:${channelName}`, parsed.data, parsed.sender || "", parsed);
                    }
                    else
                    {
                        this.emit("message", parsed);
                    }
                }
                else
                {
                    this.emit("rawMessage", rawStr);
                }

                outOnMessage.trigger();
            };

            this.ws.onclose = (event) =>
            {
                const wasConnected = this.isConnected;
                this.isConnected = false;
                outConnected.set(false);
                outStatus.set("disconnected");

                if (wasConnected)
                {
                    this.emit("close");
                    outOnDisconnected.trigger();
                }

                if (!this.manualClose && inAutoReconnect.get() && inActive.get())
                {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (err) =>
            {
                const errMsg = err && err.message ? err.message : "WebSocket connection error";
                outError.set(errMsg);
                outStatus.set("error");
                this.emit("error", err);
            };
        }
        catch (e)
        {
            outStatus.set("error");
            outError.set(e.message || String(e));
            outConnected.set(false);
            if (inAutoReconnect.get() && inActive.get())
            {
                this.scheduleReconnect();
            }
        }
    }

    scheduleReconnect()
    {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        const intervalMs = Math.max(0.5, inReconnectInterval.get()) * 1000;
        this.reconnectTimer = setTimeout(() =>
        {
            if (inActive.get() && !this.isConnected && !this.manualClose)
            {
                this.connect(inUrl.get());
            }
        }, intervalMs);
    }

    disconnect()
    {
        this.manualClose = true;
        if (this.reconnectTimer)
        {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws)
        {
            try
            {
                this.ws.close();
            }
            catch (e) {}
            this.ws = null;
        }
        this.isConnected = false;
        outConnected.set(false);
        outStatus.set("disconnected");
    }

    destroy()
    {
        this.disconnect();
        this.listeners.clear();
        this.subscriptions.clear();
    }
}

let clientInstance = new CablesWebSocketClient();
outConnection.set(clientInstance);

function updateConnection()
{
    if (inActive.get())
    {
        clientInstance.connect(inUrl.get());
    }
    else
    {
        clientInstance.disconnect();
    }
}

inUrl.onChange = updateConnection;
inActive.onChange = updateConnection;

inConnect.onTriggered = () =>
{
    if (clientInstance) clientInstance.connect(inUrl.get());
};

inDisconnect.onTriggered = () =>
{
    if (clientInstance) clientInstance.disconnect();
};

op.onDelete = () =>
{
    if (clientInstance)
    {
        clientInstance.destroy();
        clientInstance = null;
    }
    outConnection.set(null);
};

// Initial connection
updateConnection();
