import { create } from './slides-studio-client.js';

/**
 * Shared WebSocket Connection Helper for Slide Studio App (Native WebSockets)
 */
window.ssSocket = create({
    hostname: window.location.hostname,
    port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
    path: '/websocket/',
    authToken: { name: 'Slide-Studio-App' }
});

(async () => {
    for await (let event of window.ssSocket.listener('error')) {
        console.error('[SlidesStudioConnection] WebSocket Error:', event);
    }
})();

(async () => {
    for await (let event of window.ssSocket.listener('connect')) {
        console.log('[SlidesStudioConnection] Connected.');
    }
})();
