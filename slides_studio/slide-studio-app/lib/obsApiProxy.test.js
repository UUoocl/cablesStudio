import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock window, global, fetch, and EventSource objects
const mockWindow = {
    location: {
        hostname: 'localhost',
        port: '8080',
        protocol: 'http:',
        origin: 'http://localhost:8080'
    },
    addEventListener: vi.fn(),
};
global.window = mockWindow;
global.location = mockWindow.location;

vi.stubGlobal('window', mockWindow);
vi.stubGlobal('location', mockWindow.location);

// Mock global fetch and EventSource
const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
});
vi.stubGlobal('fetch', mockFetch);

class MockEventSource {
    constructor(url) {
        this.url = url;
    }
    close() {}
}
vi.stubGlobal('EventSource', MockEventSource);

describe('ObsApiProxy', () => {
    let proxy;

    beforeAll(async () => {
        await import('./obsApiProxy.js');
    });

    beforeEach(() => {
        vi.clearAllMocks();
        proxy = window.obsWss;
    });

    it('should initialize and be available globally', () => {
        expect(proxy).toBeDefined();
        expect(window.obsWss).toBe(proxy);
    });

    it('should connect and set status', async () => {
        const openedSpy = vi.fn();
        const identifiedSpy = vi.fn();
        
        proxy.on('ConnectionOpened', openedSpy);
        proxy.on('Identified', identifiedSpy);

        await proxy.connect({ disableSse: true });
        
        expect(proxy.connected).toBe(true);
        expect(proxy.status).toBe('connected');
        expect(openedSpy).toHaveBeenCalled();
        expect(identifiedSpy).toHaveBeenCalledWith({
            negotiatedRpcVersion: 1,
            obsWebSocketVersion: '5.0.0'
        });
    });

    it('should publish messages via fetch API POST', async () => {
        const channel = 'test-channel';
        const eventName = 'test-event';
        const payload = { data: 'test' };
        
        await proxy.publish(channel, eventName, payload);
        
        expect(mockFetch).toHaveBeenCalledWith('/api/obs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'publish',
                channel,
                data: {
                    eventName,
                    msgParam: payload
                }
            })
        });
    });

    it('should broadcast slides command to custom_slidesCommands channel', async () => {
        const eventName = 'test-cmd';
        const payload = { cmd: 'do-something' };
        
        await proxy.broadcastSlidesCommand(eventName, payload);
        
        expect(mockFetch).toHaveBeenCalledWith('/api/obs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'publish',
                channel: 'custom_slidesCommands',
                data: {
                    eventName,
                    msgParam: payload
                }
            })
        });
    });

    it('should handle OBS requests via direct fetch API POST', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ some: 'data' })
        });
        
        const result = await proxy.call('GetVersion');
        
        expect(mockFetch).toHaveBeenCalledWith('/api/obs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'obsRequest',
                requestType: 'GetVersion',
                requestData: undefined
            })
        });
        expect(result).toEqual({ some: 'data' });
    });
});
