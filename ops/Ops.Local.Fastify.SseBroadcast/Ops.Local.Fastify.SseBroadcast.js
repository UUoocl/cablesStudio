const
    inServer = op.inObject("Server Instance"),
    inChannel = op.inString("Channel", "slidesCommand"),
    inData = op.inObject("Data"),
    inTrigger = op.inTrigger("Broadcast");

inTrigger.onTriggered = () => {
    const app = inServer.get();
    if (!app || !app.broadcastSse) {
        op.logWarn("[SseBroadcast] No SSE Server found on this Fastify instance.");
        return;
    }

    const payload = {
        channel: inChannel.get(),
        payload: inData.get() || {}
    };

    app.broadcastSse(payload);
};
