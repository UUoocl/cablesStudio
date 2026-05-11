/**
 * Ops.Local.SlidesStudioProxy
 * Proxy bridge for Slides Studio, handling OBS requests and WebSocket broadcasting via Fastify.
 */

const
    inServer = op.inObject("Server Instance"),
    inHttpTrigger = op.inTrigger("On HTTP Request"),
    inHttpData = op.inObject("HTTP Request Data"),
    inObs = op.inObject("OBS Connection"),
    inObsEventTrigger = op.inTrigger("On OBS Event"),
    inObsEventType = op.inString("OBS Event Type"),
    inObsEventData = op.inObject("OBS Event Data"),

    outErrorTrigger = op.outTrigger("On Proxy Error"),
    outError = op.outString("Error Message");

// Track active subscriptions per client socket
const subscriptions = new Map(); // socket -> Set of channels

inHttpTrigger.onTriggered = () => {
    const data = inHttpData.get();
    if (!data) return;

    const obs = inObs.get();
    if (!obs) {
        op.logWarn("[SlidesStudioProxy] OBS not connected, cannot bridge API command.");
        return;
    }

    // Bridge API command to OBS via BroadcastCustomEvent
    // This allows OBS Browser Sources to receive the update natively
    op.log("[SlidesStudioProxy] Bridging API command to OBS:", data.type || "unknown");
    
    obs.call('BroadcastCustomEvent', {
        eventData: {
            type: 'slidesCommand',
            ...data
        }
    }).catch(err => {
        op.logError("[SlidesStudioProxy] Failed to broadcast to OBS:", err);
    });
};

inObsEventTrigger.onTriggered = () => {
    // Currently, browser sources in OBS receive events directly from OBS.
    // If needed, we can re-add logic here to bridge OBS events back to API clients
    // (though API clients would need to poll /api/state).
};

