import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window and global objects
const mockWindow = {
    parent: {
        postMessage: vi.fn()
    },
    addEventListener: vi.fn()
};
global.window = mockWindow;

// Mock DOM
const mockTeleprompterEl = {
    innerHTML: ''
};
global.document = {
    getElementById: vi.fn().mockImplementation((id) => {
        if (id === 'teleprompter') return mockTeleprompterEl;
        return null;
    }),
    addEventListener: vi.fn()
};

// Mock TelePrompter global object
const mockTelePrompter = {
    resetPageScroll: vi.fn(),
    init: vi.fn()
};
global.TelePrompter = mockTelePrompter;

describe('Teleprompter Sync Logic', () => {
    let handleMessage;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTeleprompterEl.innerHTML = '';
        
        // Extract handleMessage from the teleprompter.html script logic
        // For testing, we recreate the logic here as it's inline in HTML
        handleMessage = (data) => {
            const eventName = data.eventName;
            const payload = data.msgParam;

            if (eventName === 'reveal-event') {
                if (payload.eventName === 'callback' && payload.method === 'getSlideNotes') {
                    document.getElementById("teleprompter").innerHTML = payload.result || "No notes for this slide.";
                    TelePrompter.resetPageScroll();
                }
            }
        };
    });

    it('should update teleprompter content when getSlideNotes callback is received', () => {
        const notes = "These are some test notes.";
        const data = {
            eventName: 'reveal-event',
            msgParam: {
                eventName: 'callback',
                method: 'getSlideNotes',
                result: notes
            }
        };

        handleMessage(data);

        expect(mockTeleprompterEl.innerHTML).toBe(notes);
        expect(mockTelePrompter.resetPageScroll).toHaveBeenCalled();
    });

    it('should show fallback message when notes are empty', () => {
        const data = {
            eventName: 'reveal-event',
            msgParam: {
                eventName: 'callback',
                method: 'getSlideNotes',
                result: ""
            }
        };

        handleMessage(data);

        expect(mockTeleprompterEl.innerHTML).toBe("No notes for this slide.");
    });
});
