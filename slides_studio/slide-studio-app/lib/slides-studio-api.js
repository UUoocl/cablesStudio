/**
 * SlidesStudioClient (API Version)
 * Replaces WebSocket connection with stable HTTP API calls.
 */
class SlidesStudioClient {
    constructor(options = {}) {
        this.hostname = options.hostname || window.location.hostname;
        this.port = options.port || window.location.port;
        this.baseUrl = `http://${this.hostname}:${this.port}`;
        this.listeners = new Map();
        
        console.log(`[SlidesStudioClient] Initialized (API Version) at ${this.baseUrl}`);

        // Setup SSE Listener for real-time push events (OSC, triggers, etc.)
        this.eventSource = new EventSource(`${this.baseUrl}/api/events`);
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`[SlidesStudioClient] SSE Event received on channel ${data.channel}:`, data.payload);
                this.emit(data.channel, data.payload);
            } catch (e) {
                // Ignore heartbeats and malformed data
            }
        };

        this.eventSource.onerror = (err) => {
            console.warn("[SlidesStudioClient] SSE Connection error. Browser will auto-reconnect.");
        };
    }

    emit(channel, data) {
        if (this.listeners.has(channel)) {
            this.listeners.get(channel).forEach(cb => cb(data));
        }
    }

    /**
     * Send a command to Cables via HTTP POST
     */
    async invoke(type, data = {}) {
        const url = `${this.baseUrl}/api/slides/command`;
        console.log(`[SlidesStudioClient] Invoking ${type}:`, data);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, ...data })
            });
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error(`[SlidesStudioClient] Command failed: ${type}`, err);
            throw err;
        }
    }

    /**
     * Legacy stubs to maintain compatibility with existing scripts
     */
    connect() { console.log("[SlidesStudioClient] API Mode: No connection needed."); }
    disconnect() { }
    publish(channel, data) { return this.invoke('publish', { channel, data }); }
    subscribe(channel) { console.warn("[SlidesStudioClient] Subscribe not supported in API mode. Use OBS events."); }
    
    _addListener(event, cb) { 
        if (event === 'connect') {
            setTimeout(cb, 100); 
            return;
        }
        
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(cb);
    }

    _removeListener(event, cb) {
        if (this.listeners.has(event)) {
            const list = this.listeners.get(event);
            const idx = list.indexOf(cb);
            if (idx > -1) list.splice(idx, 1);
        }
    }

    /**
     * Async iterator for events (matches old client API)
     */
    async *listener(channel) {
        while (true) {
            yield await new Promise(resolve => {
                const cb = (data) => {
                    this._removeListener(channel, cb);
                    resolve(data);
                };
                this._addListener(channel, cb);
            });
        }
    }
}

export function create(options) {
    return new SlidesStudioClient(options);
}
