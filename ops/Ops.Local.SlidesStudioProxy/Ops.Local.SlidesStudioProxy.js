/**
 * Ops.Local.SlidesStudioProxy
 * Proxy bridge for Slides Studio, handling OBS requests and WebSocket broadcasting via Fastify.
 */

const
    inServer = op.inObject("Server Instance"),
    inHttpTrigger = op.inTrigger("On HTTP Request"),
    inHttpData = op.inObject("HTTP Request Data"),
    inObs = op.inObject("OBS Connection"),

    outErrorTrigger = op.outTrigger("On Proxy Error"),
    outError = op.outString("Error Message"),

    outSseTrigger = op.outTrigger("Broadcast SSE"),
    outSseEventName = op.outString("SSE Event Name"),
    outSseData = op.outObject("SSE Data");

// Logic to handle incoming API commands from Slides Studio
inHttpTrigger.onTriggered = () => {
    const request = inHttpData.get();
    if (!request || !request.body) return;

    const data = request.body;
    const obs = inObs.get();
    
    // --- SSE BROADCAST ECHO ---
    // Return the message to the server for broadcasting to ALL connected SSE clients
    // (This ensures real-time sync across all iframes and remote viewers)
    outSseEventName.set("message");
    outSseData.set(data);
    outSseTrigger.trigger();

    if (!obs || typeof obs.call !== 'function') {
        if (!op.state.obsWarned) {
            op.logWarn("[SlidesStudioProxy] OBS not connected or invalid, cannot process OBS-specific parts of command.");
            op.state.obsWarned = true;
        }
        return;
    }
    op.state.obsWarned = false;

    // 1. Process "publish" commands (the primary messaging path)
    if (data.type === 'publish') {
        const { channel, data: payload } = data;

        // --- AUTOMATIC SCENE SWITCHING ---
        // If the speaker view navigates and a scene is mapped, switch OBS immediately
        if (channel === 'slides_navigation' && payload && payload.eventName === 'slide-changed') {
            const targetScene = payload.scene;
            if (targetScene && targetScene !== "None") {
                op.log("[SlidesStudioProxy] Auto-switching OBS scene to:", targetScene);
                obs.call('SetCurrentProgramScene', { sceneName: targetScene }).catch(err => {
                    op.logWarn(`[SlidesStudioProxy] Failed to switch scene to ${targetScene}:`, err);
                });
            }
        }



        // --- OBS BROWSER SOURCE BROADCAST ---
        // Bridge all published events to OBS natively via BroadcastCustomEvent
        // This allows OBS filters and browser sources to react to slide state
        obs.call('BroadcastCustomEvent', {
            eventData: {
                type: 'slidesCommand',
                channel: channel,
                ...payload
            }
        }).catch(err => {
            op.logError("[SlidesStudioProxy] Failed to broadcast to OBS:", err);
        });
    }

    // 2. Process other specific commands if needed (e.g. mapping-updated)
    if (data.type === 'mapping-updated') {
        op.log("[SlidesStudioProxy] Mapping updated in Speaker View, persisting to OBS...");
        // Mapping is already saved to _Slide_Scene_Map by studio.html, 
        // but we could perform extra Cables-side side effects here.
    }
};
