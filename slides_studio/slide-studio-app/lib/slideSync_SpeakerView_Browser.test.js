import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock window and global objects
const mockWindow = {
    location: {
        hostname: 'localhost',
        port: '8080',
        protocol: 'http:',
        origin: 'http://localhost:8080'
    },
    addEventListener: vi.fn(),
    currentSlide: {
        contentWindow: {
            postMessage: vi.fn()
        }
    }
};
global.window = mockWindow;

vi.stubGlobal('window', mockWindow);

// Mock scSocket
const mockChannel = {
    [Symbol.asyncIterator]: async function* () {
        yield { eventName: 'slide-changed', msgParam: { slideState: '1,2,3' } };
        yield { eventName: 'overview-toggled', msgParam: { overview: true } };
    }
};

mockWindow.scSocket = {
    subscribe: vi.fn(() => mockChannel),
    state: 'open'
};

describe('slideSync_SpeakerView_Browser', () => {
    beforeAll(async () => {
        await import('./slideSync_SpeakerView_Browser.js');
        // Give the IIFE some time to process
        await new Promise(r => setTimeout(r, 50));
    });

    it('should subscribe to studio_to_viewer channel', () => {
        expect(mockWindow.scSocket.subscribe).toHaveBeenCalledWith('studio_to_viewer');
    });

    it('should send postMessage to currentSlide on slide-changed', () => {
        expect(mockWindow.currentSlide.contentWindow.postMessage).toHaveBeenCalledWith(
            JSON.stringify({ method: 'slide', args: [1, 2, 3] }),
            "*"
        );
        expect(mockWindow.currentSlide.contentWindow.postMessage).toHaveBeenCalledWith(
            JSON.stringify({ method: 'getSlideNotes' }),
            "*"
        );
    });

    it('should send postMessage to currentSlide on overview-toggled', () => {
        expect(mockWindow.currentSlide.contentWindow.postMessage).toHaveBeenCalledWith(
            JSON.stringify({ method: 'toggleOverview', args: [true] }),
            "*"
        );
    });
});
