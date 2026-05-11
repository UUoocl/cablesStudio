import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SyncService
const mockSyncService = {
    publishSync: vi.fn(),
    CHANNEL: 'slides_sync'
};

// Mock obsWss
const mockObsWss = {
    publish: vi.fn(),
};

global.window = {
    scSocket: { state: 'open' },
    obsWss: mockObsWss,
    location: { origin: 'http://localhost' },
    addEventListener: vi.fn(),
};

describe('SpeakerView Studio Sync Integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mock('./sync-service.js', () => ({
            SyncService: mockSyncService
        }));
    });

    it('should publish to slides_sync when broadcastSlidesCommand is called with slide-changed', async () => {
        // Mock the studio script behavior
        const broadcastSlidesCommand = async function(eventName, msgParam, origin = 'studio') {
            const { SyncService } = await import('./sync-service.js');
            if (eventName === 'slide-changed') {
                SyncService.publishSync({ 
                    slideState: msgParam.slideState,
                    indexh: msgParam.indexh,
                    indexv: msgParam.indexv
                });
            }
            await window.obsWss.publish('slides_broadcast', eventName, msgParam);
        };

        const state = { slideState: '1,2', indexh: 1, indexv: 2 };
        await broadcastSlidesCommand('slide-changed', state);

        expect(mockSyncService.publishSync).toHaveBeenCalledWith({
            slideState: '1,2',
            indexh: 1,
            indexv: 2
        });
        expect(mockObsWss.publish).toHaveBeenCalledWith('slides_broadcast', 'slide-changed', state);
    });
});
