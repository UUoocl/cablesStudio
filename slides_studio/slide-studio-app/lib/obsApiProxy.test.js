import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock window and global objects for top-level code in obsApiProxy.js
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

// Mock socketcluster-client
vi.mock('./socketcluster-client.min.js', () => ({
    create: vi.fn(() => ({
        listener: vi.fn((name) => ({
            [Symbol.asyncIterator]: async function* () {
                if (name === 'connect') yield { id: 'test-id' };
                await new Promise(r => setTimeout(r, 10));
            }
        })),
        state: 'open',
        subscribe: vi.fn(() => ({
            [Symbol.asyncIterator]: async function* () {
                await new Promise(r => setTimeout(r, 10));
            }
        })),
        invoke: vi.fn().mockResolvedValue({}),
        transmitPublish: vi.fn(),
        disconnect: vi.fn()
    }))
}));

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

    it('should connect and set info', async () => {
        await proxy.connect();
        expect(proxy.connected).toBe(true);
        expect(proxy.socket.invoke).toHaveBeenCalledWith('setInfo', expect.any(Object));
    });

    it('should publish messages', async () => {
        const channel = 'test-channel';
        const eventName = 'test-event';
        const payload = { data: 'test' };
        
        await proxy.publish(channel, eventName, payload);
        
        expect(proxy.socket.transmitPublish).toHaveBeenCalledWith(channel, {
            eventName,
            msgParam: payload
        });
    });

    it('should broadcast slides command to custom_slidesCommands channel', async () => {
        const eventName = 'test-cmd';
        const payload = { cmd: 'do-something' };
        
        await proxy.broadcastSlidesCommand(eventName, payload);
        
        expect(proxy.socket.transmitPublish).toHaveBeenCalledWith('custom_slidesCommands', {
            eventName,
            msgParam: payload
        });
    });

    it('should handle OBS requests via invoke', async () => {
        proxy.socket.invoke.mockResolvedValue({ some: 'data' });
        
        const result = await proxy.call('GetVersion');
        
        expect(proxy.socket.invoke).toHaveBeenCalledWith('obsRequest', {
            requestType: 'GetVersion',
            requestData: undefined
        });
        expect(result).toEqual({ some: 'data' });
    });
});
