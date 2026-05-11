import { create } from './slides-studio-client.js';

/**
 * ObsApiProxy (Native WebSocket Version)
 * Replaces REST endpoints with unified WebSocket calls for OBS commands and events.
 */
class ObsApiProxy {
    constructor() {
        this.connected = false;
        this.status = "disconnected";
        this.events = new Map();
        this.socket = null;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.socket && this.socket.socket && this.socket.socket.readyState === WebSocket.OPEN) {
            return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
        }
        
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            try {
                if (!this.socket) {
                    this.socket = create({
                        hostname: window.location.hostname,
                        port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
                        path: '/ws',
                        authToken: { name: 'Slide-Studio-App (OBS-Proxy)' }
                    });

                    this.socket.connect();
                    this.setupPersistentListeners();
                }

                // Wait for connection if not already open
                if (this.socket.socket.readyState !== WebSocket.OPEN) {
                    await new Promise((resolve, reject) => {
                        const onConnect = () => {
                            this.socket._removeListener('connect', onConnect);
                            resolve();
                        };
                        const onError = (err) => {
                            this.socket._removeListener('error', onError);
                            reject(err);
                        };
                        this.socket._addListener('connect', onConnect);
                        this.socket._addListener('error', onError);
                        
                        // Timeout
                        setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    });
                }

                this.connected = true;
                this.status = "connected";

                try {
                    const { connected } = await this.socket.invoke('isObsConnected');
                    if (connected) {
                        this.emit('ConnectionOpened');
                        this.emit('Identified', { negotiatedRpcVersion: 1, obsWebSocketVersion: '5.0.0' });
                    }
                } catch (e) { }

                return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
            } catch (e) {
                console.error("ObsApiProxy connection failed", e);
                throw e;
            } finally {
                this.connectionPromise = null;
            }
        })();

        return this.connectionPromise;
    }

    setupPersistentListeners() {
        if (!this.socket) return;

        (async () => {
            for await (let event of this.socket.listener('connect')) {
                this.connected = true;
                this.status = "connected";
                this.subscribeToChannels();
            }
        })();

        (async () => {
            for await (let event of this.socket.listener('disconnect')) {
                this.connected = false;
                this.status = "disconnected";
                this.emit('ConnectionClosed');
            }
        })();

        (async () => {
            for await (let event of this.socket.listener('error')) {
                console.error('ObsApiProxy: Socket Error:', event);
                this.emit('ConnectionError', event);
            }
        })();
    }

    async subscribeToChannels() {
        if (!this.socket) return;

        const appChannels = [
            'custom_slidesCommands',
            'obsEvents',
            'keyboardPress',
            'currentSlide_to_studio',
            'slides_navigation',
            'studio_to_currentSlide'
        ];

        appChannels.forEach(chanName => {
            (async () => {
                const channel = this.socket.subscribe(chanName);
                for await (let data of channel) {
                    console.log(`[ObsApiProxy] Message received on channel ${chanName}:`, data.eventName || data);
                    // Normalize events: custom_slidesCommands is emitted as 'slidesCommands' for legacy compat
                    if (chanName === 'custom_slidesCommands') {
                        this.emit('slidesCommands', { eventName: data.eventName, msgParam: data.msgParam });
                    } else if (chanName === 'obsEvents') {
                        this.emit(data.eventName, data.eventData);
                    } else {
                        // Generic emission for channels
                        this.emit(chanName, data);
                    }
                }
            })();
        });
    }

    async disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    async call(requestType, requestData) {
        if (!this.socket || this.socket.socket.readyState !== WebSocket.OPEN) {
            await this.connect();
        }
        try {
            const result = await this.socket.invoke('obsRequest', { requestType, requestData });
            return result;
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            // Silence GetInputSettings as it's often used for optional metadata
            if (requestType !== 'GetInputSettings') {
                console.error(`[ObsApiProxy] OBS Request '${requestType}' failed: ${errMsg}`, { requestData });
            }
            throw e;
        }
    }

    async callBatch(requests, options) {
        if (!this.socket || this.socket.socket.readyState !== WebSocket.OPEN) {
            await this.connect();
        }
        try {
            return await this.socket.invoke('obsRequest', { requests, options });
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
        if (this.socket && this.socket.socket.readyState === WebSocket.OPEN) {
            console.log(`[ObsApiProxy] Publishing to ${channel}:`, eventName);
            this.socket.publish(channel, { eventName, msgParam });
        }
    }

    async broadcastSlidesCommand(eventName, msgParam) {
        this.publish('custom_slidesCommands', eventName, msgParam);
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
