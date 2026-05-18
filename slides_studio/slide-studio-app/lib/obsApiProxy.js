/**
 * ObsApiProxy (HTTP/SSE Version)
 * Unified HTTP API calls and EventSource SSE listeners.
 * Does not connect to OBS WebSocket directly.
 */
class ObsApiProxy {
    constructor() {
        this.connected = false;
        this.status = "disconnected";
        this.events = new Map();
        this.eventSource = null;
    }

    async connect(options = {}) {
        if (this.connected) {
            return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
        }

        // HTTP/SSE is connectionless for API requests
        this.connected = true;
        this.status = "connected";

        if (!options.disableSse && !this.eventSource) {
            const protocol = window.location.protocol;
            const host = window.location.host;
            const sseUrl = `${protocol}//${host}/sse`;
            
            console.log(`[ObsApiProxy] Connecting EventSource to ${sseUrl}...`);
            this.eventSource = new EventSource(sseUrl);
            
            this.eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    const channel = parsed.channel || parsed.type || parsed.eventName;
                    const data = parsed.payload || parsed.data || parsed;
                    
                    if (!channel) return;
                    
                    // Normalize events for legacy compatibility
                    if (channel === 'custom_slidesCommands') {
                        this.emit('slidesCommands', { eventName: data.eventName, msgParam: data.msgParam });
                    } else if (channel === 'obsEvents') {
                        this.emit(data.eventName, data.eventData);
                    } else {
                        this.emit(channel, data);
                    }
                } catch (e) {
                    // Ignore heartbeats and parsing errors
                }
            };

            this.eventSource.onerror = (err) => {
                console.warn("[ObsApiProxy] SSE Connection lost. Auto-reconnecting...");
            };
        }

        // Emit legacy events for compatibility
        this.emit('ConnectionOpened');
        this.emit('Identified', { negotiatedRpcVersion: 1, obsWebSocketVersion: '5.0.0' });

        return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
    }

    async disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.connected = false;
        this.status = "disconnected";
        this.emit('ConnectionClosed');
    }

    async call(requestType, requestData) {
        return new Promise((resolve, reject) => {
            const requestId = "req_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
            const eventName = requestType + "Response";
            
            const handler = (data) => {
                const envelope = data.responseData !== undefined ? data : { responseData: data, requestId: data.requestId, requestStatus: data.requestStatus };
                if (envelope.requestId === requestId || !envelope.requestId) {
                    this.off(eventName, handler);
                    if (envelope.requestStatus && !envelope.requestStatus.result) {
                        reject(new Error(envelope.requestStatus.comment || "OBS Request Failed"));
                    } else {
                        resolve(envelope.responseData);
                    }
                }
            };
            this.on(eventName, handler);

            fetch('/api/obs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'obsRequest',
                    requestType,
                    requestId,
                    requestData
                })
            }).catch(e => {
                this.off(eventName, handler);
                reject(e);
            });
            
            // Timeout if SSE never arrives
            setTimeout(() => {
                this.off(eventName, handler);
                reject(new Error(`OBS Request Timeout: ${requestType}`));
            }, 10000);
        });
    }

    async callBatch(requests, options) {
        try {
            const response = await fetch('/api/obs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'obsRequest',
                    requests,
                    options
                })
            });
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error("[ObsApiProxy] OBS Batch Request failed:", e);
            throw e;
        }
    }

    async refreshOBSbrowsers() {
        try {
            const response = await this.call("GetInputList", { inputKind: "browser_source" });
            const batch = response.inputs.map(input => ({
                requestType: "PressInputPropertiesButton",
                requestData: {
                    inputUuid: input.inputUuid,
                    propertyName: "refreshnocache"
                }
            }));
            if (batch.length > 0) await this.callBatch(batch);
        } catch (err) {
            console.error("[ObsApiProxy] Failed to refresh OBS browsers:", err);
        }
    }
    
    async publish(channel, eventName, msgParam) {
        try {
            console.log(`[ObsApiProxy] Publishing to ${channel} via API:`, eventName);
            const response = await fetch('/api/obs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'publish',
                    channel,
                    data: { eventName, msgParam }
                })
            });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        } catch (e) {
            console.error(`[ObsApiProxy] Publish failed to ${channel}:`, e);
        }
    }

    async broadcastSlidesCommand(eventName, msgParam) {
        await this.publish('custom_slidesCommands', eventName, msgParam);
    }

    on(event, callback) {
        if (!this.events.has(event)) this.events.set(event, []);
        this.events.get(event).push(callback);
    }
    
    off(event, callback) {
        if (!this.events.has(event)) return;
        const listeners = this.events.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(cb => cb(data));
        }
    }
}

// Global replacement
window.obsWss = new ObsApiProxy;
window.broadcastSlidesCommand = (event, msg) => window.obsWss.broadcastSlidesCommand(event, msg);
window.refreshOBSbrowsers = () => window.obsWss.refreshOBSbrowsers();
