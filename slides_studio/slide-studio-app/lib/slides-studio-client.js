/**
 * Slides Studio WebSocket Client
 * Replaces WebSocket-client with a native WebSocket implementation.
 */

export function create(options) {
    const { hostname, port, path, authToken } = options;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${hostname || window.location.hostname}:${port || window.location.port}${path || '/websocket/'}`;
    
    return new SlidesStudioClient(wsUrl, authToken);
}

class SlidesStudioClient {
    constructor(url, authToken) {
        this.url = url;
        this.authToken = authToken;
        this.socket = null;
        this.listeners = new Map();
        this.channels = new Map();
        this.pendingCalls = new Map();
        this.reconnectTimeout = 1000;
        this.maxReconnectTimeout = 30000;
        this.shouldReconnect = true;
        this.id = Math.random().toString(36).substring(2, 15);
        
        this.connect();
    }

    get state() {
        if (!this.socket) return 'closed';
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'open';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'closed';
            default: return 'closed';
        }
    }

    connect() {
        console.log(`[SlidesStudioClient] (v1.0.6-SHORTCUTS) Connecting to ${this.url}...`);
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
            console.log('[SlidesStudioClient] Connected.');
            this.reconnectTimeout = 1000;
            
            // Send identification
            if (this.authToken) {
                this.call('setInfo', this.authToken).catch(err => {
                    console.error('[SlidesStudioClient] Failed to send setInfo:', err);
                });
            } else {
                this.call('setInfo', { name: 'Unknown-Web-Client' }).catch(() => {});
            }
            
            this.emit('connect', { id: this.id });
            
            // Re-subscribe to active channels
            for (const channelName of this.channels.keys()) {
                this._send({ type: 'subscribe', channel: channelName });
            }
        };

        this.socket.onclose = (event) => {
            console.warn(`[SlidesStudioClient] Disconnected. Code: ${event.code}, Reason: ${event.reason || 'none'}, WasClean: ${event.wasClean}`);
            this.emit('disconnect', { code: event.code, reason: event.reason, wasClean: event.wasClean });
            
            if (this.shouldReconnect) {
                setTimeout(() => {
                    this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, this.maxReconnectTimeout);
                    this.connect();
                }, this.reconnectTimeout);
            }
        };

        this.socket.onerror = (error) => {
            console.error('[SlidesStudioClient] WebSocket Error:', error);
            this.emit('error', error);
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this._handleMessage(message);
            } catch (err) {
                console.error('[SlidesStudioClient] Error parsing message:', err);
            }
        };
    }

    _handleMessage(message) {
        switch (message.type) {
            case 'event':
                this._handleEvent(message.channel, message.data);
                break;
            case 'response':
                this._handleResponse(message.id, message.data, message.error);
                break;
            default:
                console.warn('[SlidesStudioClient] Unknown message type:', message.type);
        }
    }

    _handleEvent(channelName, data) {
        // Emit to client listeners (e.g. socket.on('channelName', ...))
        this.emit(channelName, data);

        const channel = this.channels.get(channelName);
        if (channel) {
            channel._trigger(data);
        }
    }

    _handleResponse(id, data, error) {
        const promise = this.pendingCalls.get(id);
        if (promise) {
            if (error) promise.reject(new Error(error));
            else promise.resolve(data);
            this.pendingCalls.delete(id);
        }
    }

    _send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('[SlidesStudioClient] Cannot send message, socket not open:', data);
        }
    }

    // SC-like API
    listener(eventName) {
        return {
            [Symbol.asyncIterator]: () => {
                let resolver = null;
                const queue = [];
                
                const handler = (data) => {
                    if (resolver) {
                        resolver({ value: data, done: false });
                        resolver = null;
                    } else {
                        queue.push(data);
                    }
                };
                
                this._addListener(eventName, handler);
                
                return {
                    next: () => {
                        if (queue.length > 0) {
                            return Promise.resolve({ value: queue.shift(), done: false });
                        }
                        return new Promise(resolve => {
                            resolver = resolve;
                        });
                    },
                    return: () => {
                        this._removeListener(eventName, handler);
                        return Promise.resolve({ done: true });
                    }
                };
            }
        };
    }

    _addListener(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    _removeListener(event, handler) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) handlers.splice(index, 1);
        }
    }

    on(event, handler) {
        this._addListener(event, handler);
        return this;
    }

    off(event, handler) {
        this._removeListener(event, handler);
        return this;
    }

    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(h => h(data));
        }
    }

    subscribe(channelName) {
        if (this.channels.has(channelName)) {
            return this.channels.get(channelName);
        }
        
        const channel = new Channel(channelName, this);
        this.channels.set(channelName, channel);
        
        // Only send if open; otherwise onopen will handle it for all channels in this.channels
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this._send({ type: 'subscribe', channel: channelName });
        }
        
        return channel;
    }

    unsubscribe(channelName) {
        if (this.channels.has(channelName)) {
            this.channels.delete(channelName);
            this._send({ type: 'unsubscribe', channel: channelName });
        }
    }

    // SC-like invoke
    invoke(method, data) {
        return this.call(method, data);
    }

    call(method, data) {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(2, 15);
            this.pendingCalls.set(id, { resolve, reject });
            this._send({ type: 'call', id, method, data });
            
            // Timeout after 30s
            setTimeout(() => {
                if (this.pendingCalls.has(id)) {
                    reject(new Error(`Call to ${method} timed out`));
                    this.pendingCalls.delete(id);
                }
            }, 30000);
        });
    }

    publish(channel, data) {
        this._send({ type: 'publish', channel, data });
    }

    // Aliases for compatibility
    invokePublish(channel, data) {
        this.publish(channel, data);
        return Promise.resolve();
    }

    transmitPublish(channel, data) {
        this.publish(channel, data);
    }

    // SC procedure support (not fully implemented as we don't handle incoming calls yet)
    procedure(name) {
        console.warn('[SlidesStudioClient] procedure() is not fully implemented on client yet');
        return {
            [Symbol.asyncIterator]: () => ({
                next: () => new Promise(() => {}), // Never resolves
            })
        };
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.socket) this.socket.close();
    }

    async getShortcuts() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const url = `${protocol}//${host}/api/shortcuts/list`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch shortcuts');
            }
            return await response.json();
        } catch (err) {
            console.error('[SlidesStudioClient] getShortcuts error:', err);
            throw err;
        }
    }

    async runShortcut(name, data = {}) {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const url = `${protocol}//${host}/api/shortcuts/run`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortcut: name, data })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to run shortcut');
            }
            
            return await response.json();
        } catch (err) {
            console.error('[SlidesStudioClient] runShortcut error:', err);
            throw err;
        }
    }
}

class Channel {
    constructor(name, client) {
        this.name = name;
        this.client = client;
        this.handlers = [];
    }

    _trigger(data) {
        this.handlers.forEach(h => h(data));
    }

    on(event, handler) {
        // For channels, SC usually uses .on('message', ...)
        this.handlers.push(handler);
        return this;
    }

    off(event, handler) {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) this.handlers.splice(index, 1);
        return this;
    }

    [Symbol.asyncIterator]() {
        let resolver = null;
        const queue = [];
        
        const handler = (data) => {
            if (resolver) {
                resolver({ value: data, done: false });
                resolver = null;
            } else {
                queue.push(data);
            }
        };
        
        this.handlers.push(handler);
        
        return {
            next: () => {
                if (queue.length > 0) {
                    return Promise.resolve({ value: queue.shift(), done: false });
                }
                return new Promise(resolve => {
                    resolver = resolve;
                });
            },
            return: () => {
                const index = this.handlers.indexOf(handler);
                if (index !== -1) this.handlers.splice(index, 1);
                return Promise.resolve({ done: true });
            }
        };
    }
}
