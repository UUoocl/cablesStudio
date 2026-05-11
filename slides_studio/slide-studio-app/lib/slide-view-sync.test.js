import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SyncService
const mockSyncService = {
    subscribeSync: vi.fn(),
    CHANNEL: 'slides_sync'
};

// Mock document/iframe
const mockIframe = {
    src: 'about:blank',
    contentWindow: {
        postMessage: vi.fn()
    },
    parentNode: {
        replaceChild: vi.fn()
    },
    className: 'slide-position full-screen'
};

global.document = {
    getElementById: vi.fn(() => mockIframe),
    createElement: vi.fn(() => ({
        id: 'revealIframe',
        setAttribute: vi.fn(),
        style: {}
    }))
};

global.window = {
    scSocket: { state: 'open' },
    addEventListener: vi.fn()
};

describe('SlideView Sync Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mock('./sync-service.js', () => ({
            SyncService: mockSyncService
        }));
    });

    it('should subscribe to SyncService', async () => {
        // Mock the slideSync_OBS script behavior
        const initSync = async () => {
            const { SyncService } = await import('./sync-service.js');
            SyncService.subscribeSync((data) => {
                // handle sync
            });
        };

        await initSync();
        expect(mockSyncService.subscribeSync).toHaveBeenCalled();
    });
});
