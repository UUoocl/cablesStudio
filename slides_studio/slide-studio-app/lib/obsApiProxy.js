/**
 * ObsApiProxy (Direct OBS WebSocket v5 Version)
 * Wraps OBSWebSocket from obs-ws.min.js to connect directly to the OBS WebSocket server.
 */
class ObsApiProxy {
    constructor() {
        this.connected = false;
        this.status = "disconnected";
        this.events = new Map();
        this.obs = null;
        this.connectionPromise = null;
        
        // Manual connection credentials cache
        this.manualHost = null;
        this.manualPort = null;
        this.manualPassword = null;
    }

    async connect() {
        if (this.obs && this.obs.identified) {
            return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
        }
        
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            try {
                // Fetch credentials or load from manual localStorage values
                let host = this.manualHost || localStorage.getItem("obs_manual_host") || "localhost";
                let port = this.manualPort || localStorage.getItem("obs_manual_port");
                let password = this.manualPassword || localStorage.getItem("obs_manual_password");

                if (!port) {
                    try {
                        const res = await fetch('/api/obs/credentials');
                        if (res.ok) {
                            const creds = await res.json();
                            if (creds && creds.port) {
                                port = creds.port;
                                password = creds.password || "";
                            }
                        }
                    } catch (e) {
                        console.warn("[ObsApiProxy] Failed to fetch credentials from /api/obs/credentials:", e);
                    }
                }

                // Apply defaults if still not found
                if (!port) port = "4455";
                if (!password) password = "";

                console.log(`[ObsApiProxy] OBS WebSocket Credentials Received: Host=${host}, Port=${port}, Password=${password ? "********" : "(empty)"}`);

                if (this.obs) {
                    await this.disconnect();
                }

                console.log(`[ObsApiProxy] Instantiating OBSWebSocket for ws://${host}:${port}...`);
                this.obs = new OBSWebSocket();
                
                // Bind lifecycle event listeners
                this.obs.on("ConnectionOpened", () => {
                    console.log("[ObsApiProxy] ConnectionOpened");
                    this.emit("ConnectionOpened");
                });

                this.obs.on("Identified", (data) => {
                    console.log("[ObsApiProxy] Identified:", data);
                    this.connected = true;
                    this.status = "connected";
                    this.emit("Identified", data);
                });

                this.obs.on("ConnectionClosed", (err) => {
                    console.log("[ObsApiProxy] ConnectionClosed:", err);
                    this.connected = false;
                    this.status = "disconnected";
                    this.emit("ConnectionClosed", err);
                });

                this.obs.on("ConnectionError", (err) => {
                    console.error("[ObsApiProxy] ConnectionError:", err);
                    this.emit("ConnectionError", err);
                });

                // Proxy native OBS events out to any general listeners
                const originalEmit = this.obs.emit;
                this.obs.emit = (event, data) => {
                    if (event !== "ConnectionOpened" && event !== "Hello" && event !== "Identified" && event !== "ConnectionClosed" && event !== "ConnectionError") {
                        this.emit(event, data);
                    }
                    return originalEmit.call(this.obs, event, data);
                };

                const url = `ws://${host}:${port}`;
                await this.obs.connect(url, password);
                
                return { obsWebSocketVersion: '5.0.0', negotiatedRpcVersion: 1 };
            } catch (e) {
                console.error("[ObsApiProxy] Direct connection to OBS failed:", e);
                this.connected = false;
                this.status = "disconnected";
                this.emit("ConnectionClosed", e);
                throw e;
            } finally {
                this.connectionPromise = null;
            }
        })();

        return this.connectionPromise;
    }

    async connectManual(host, port, password) {
        this.manualHost = host;
        this.manualPort = port;
        this.manualPassword = password;
        
        localStorage.setItem("obs_manual_host", host);
        localStorage.setItem("obs_manual_port", port);
        localStorage.setItem("obs_manual_password", password);
        
        if (this.obs) {
            await this.disconnect();
        }
        return this.connect();
    }

    async disconnect() {
        if (this.obs) {
            try {
                await this.obs.disconnect();
            } catch (e) {}
            this.obs = null;
        }
        this.connected = false;
        this.status = "disconnected";
    }

    async call(requestType, requestData) {
        if (!this.obs || !this.obs.identified) {
            await this.connect();
        }
        try {
            return await this.obs.call(requestType, requestData);
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            if (requestType !== 'GetInputSettings') {
                console.error(`[ObsApiProxy] OBS Request '${requestType}' failed: ${errMsg}`, { requestData });
            }
            throw e;
        }
    }

    async callBatch(requests, options) {
        if (!this.obs || !this.obs.identified) {
            await this.connect();
        }
        try {
            return await this.obs.callBatch(requests, options);
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
        if (this.obs && this.obs.identified) {
            console.log(`[ObsApiProxy] Publishing to OBS browser vendor via CallVendorRequest: ${channel}/${eventName}`);
            try {
                await this.call('CallVendorRequest', {
                    vendorName: 'obs-browser',
                    requestType: 'emit_event',
                    requestData: {
                        event_name: 'slidesCommand',
                        event_data: { channel, eventName, msgParam }
                    }
                });
            } catch (err) {
                console.error("[ObsApiProxy] Direct OBS Broadcast failed:", err);
            }
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
