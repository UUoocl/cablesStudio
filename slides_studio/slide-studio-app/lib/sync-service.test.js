import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SocketCluster
const mockSocket = {
    transmitPublish: vi.fn(),
    subscribe: vi.fn(),
    state: 'open'
};

global.window = {
    scSocket: mockSocket,
    location: { origin: 'http://localhost' }
};

describe('SyncService', () => {
    let SyncService;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Dynamic import to ensure we can mock the socket before it's used
        const module = await import('./sync-service.js');
        SyncService = module.SyncService;
    });

    it('should define the slides_sync channel', () => {
        expect(SyncService.CHANNEL).toBe('slides_sync');
    });

    it('should wait for scSocket if not present before publishing', async () => {
        delete global.window.scSocket;
        const state = { url: 'deck.html' };

        // Start publishing (async)
        const publishPromise = SyncService.publishSync(state);

        // Simulate scSocket appearing after a delay
        setTimeout(() => {
            global.window.scSocket = mockSocket;
        }, 50);

        await publishPromise;
        expect(mockSocket.transmitPublish).toHaveBeenCalledWith('slides_sync', {
            eventName: 'sync-state',
            msgParam: state
        });
    });

    it('should wait for scSocket to be open before publishing', async () => {
        mockSocket.state = 'closed';
        mockSocket.listener = vi.fn().mockReturnValue({
            once: vi.fn().mockResolvedValue({ status: 'connected' })
        });

        const publishPromise = SyncService.publishSync({ url: 'test.html' });

        // Simulate connection opening
        setTimeout(() => {
            mockSocket.state = 'open';
        }, 50);

        await publishPromise;
        expect(mockSocket.listener).toHaveBeenCalledWith('connect');
    });

    it('should publish deck state', async () => {
        const state = { url: 'deck.html', indexh: 1, indexv: 2 };
        mockSocket.state = 'open';
        await SyncService.publishSync(state);
        expect(mockSocket.transmitPublish).toHaveBeenCalledWith('slides_sync', {
            eventName: 'sync-state',
            msgParam: state
        });
    });

    it('should subscribe to sync events', async () => {
        const callback = vi.fn();
        const mockChannel = {
            [Symbol.asyncIterator]: async function* () {
                yield { eventName: 'sync-state', msgParam: { url: 'test.html' } };
            }
        };
        mockSocket.subscribe.mockReturnValue(mockChannel);

        SyncService.subscribeSync(callback);

        expect(mockSocket.subscribe).toHaveBeenCalledWith('slides_sync');
        
        // Wait for the async iterator to process
        await new Promise(r => setTimeout(r, 50));
        expect(callback).toHaveBeenCalledWith({ url: 'test.html' });
    });
});
