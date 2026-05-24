import { create } from './slides-studio-client.js';

/**
 * Shared WebSocket Connection Helper for Slide Studio App
 */
window.scSocket = create({
    hostname: window.location.hostname,
    port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
    path: '/websocket/',
    authToken: { name: 'Slide-Studio-App' }
});

(async () => {
    for await (let event of window.scSocket.listener('error')) {
        console.error('WebSocket Error:', event);
    }
})();

(async () => {
    for await (let event of window.scSocket.listener('connect')) {
        // Connection established
    }
})();
