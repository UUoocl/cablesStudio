import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window and global objects
const mockWindow = {
    slideDeckId: 'test-deck',
    slidesArray: [
        { slideState: '0,0', scene: 'Scene 1', cameraShape: 'circle' },
        { slideState: '1,0', scene: 'Scene 2', cameraShape: 'square' }
    ],
    localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn()
    }
};
global.window = mockWindow;
global.localStorage = mockWindow.localStorage;
global.document = {
    querySelector: vi.fn().mockReturnValue({}),
    addEventListener: vi.fn()
};

// Mock Tabulator
const mockTable = {
    destroy: vi.fn(),
    on: vi.fn(),
    getData: vi.fn().mockReturnValue([]),
    deselectRow: vi.fn(),
    getSelectedRows: vi.fn().mockReturnValue([]),
    getRowFromPosition: vi.fn()
};
global.Tabulator = vi.fn().mockImplementation(function() { return mockTable; });

describe('setupTable', () => {
    let loadTable;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await import('./setupTable.js');
        loadTable = module.loadTable;
    });

    it('should initialize Tabulator with correct data and columns', () => {
        loadTable();

        expect(global.Tabulator).toHaveBeenCalled();
        const [selector, config] = vi.mocked(global.Tabulator).mock.calls[0];
        
        expect(selector).toBe('#slidesTable');
        expect(config.data).toEqual(mockWindow.slidesArray);
        
        const columns = config.columns;
        expect(columns.find(c => c.field === 'slideState')).toBeDefined();
        expect(columns.find(c => c.field === 'scene')).toBeDefined();
        expect(columns.find(c => c.field === 'cameraShape')).toBeDefined();
    });

    it('should load data from localStorage if available', () => {
        const savedData = [{ slideState: '0,0', scene: 'Saved Scene' }];
        mockWindow.localStorage.getItem.mockReturnValue(JSON.stringify(savedData));

        loadTable();

        expect(global.Tabulator).toHaveBeenCalled();
        const [, config] = vi.mocked(global.Tabulator).mock.calls[0];
        expect(config.data).toEqual(savedData);
    });
});
