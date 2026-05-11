import { describe, it, expect } from 'vitest';
import { parseLayoutName } from './layout-utils';

describe('Layout Utils - parseLayoutName', () => {
    it('should parse layout from standard pattern', () => {
        expect(parseLayoutName('Slides-SideBySide')).toBe('SideBySide');
        expect(parseLayoutName('slides_RightPanel')).toBe('RightPanel');
        expect(parseLayoutName('Slides-Left-Aligned')).toBe('Left-Aligned');
        expect(parseLayoutName('Scene 2 slides SideBySide')).toBe('SideBySide');
    });

    it('should handle different cases for "slides"', () => {
        expect(parseLayoutName('SLIDES-Full')).toBe('Full');
        expect(parseLayoutName('sLiDeS_Overlay')).toBe('Overlay');
    });

    it('should return null if "slides" is not in the scene name', () => {
        expect(parseLayoutName('MainScene')).toBe(null);
        expect(parseLayoutName('Camera_Only')).toBe(null);
    });

    it('should handle empty or whitespace layout names', () => {
        expect(parseLayoutName('Slides-')).toBe(null);
        expect(parseLayoutName('Slides ')).toBe(null);
    });

    it('should handle multiple "slides" in name', () => {
        expect(parseLayoutName('Project-Slides-SubSlides-LayoutA')).toBe('LayoutA');
    });

    it('should handle null or non-string inputs', () => {
        expect(parseLayoutName(null)).toBe(null);
        expect(parseLayoutName(undefined)).toBe(null);
        expect(parseLayoutName(123)).toBe(null);
    });
});
