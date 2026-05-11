import { describe, it, expect } from 'vitest';

// Function to test (updated version from slides_studio_slide_view.html)
function parseSlidePosition(msgParam) {
    let slidePosClass = (msgParam && msgParam.slidePosition) ? msgParam.slidePosition : null;
    if (!slidePosClass && msgParam && msgParam.scene) {
        const sceneName = msgParam.scene;
        const lowerScene = sceneName.toLowerCase();
        if (lowerScene.includes("slides ")) {
            // Extract everything after "slides " and trim it
            const parts = sceneName.split(/slides /i);
            if (parts.length > 1) {
                slidePosClass = parts[1].trim().split(" ")[0]; // Get the first word after "slides "
            }
        }
    }
    return slidePosClass;
}

describe('SlideView CSS Parsing Robustness', () => {
    it('should use slidePosition if provided', () => {
        const msg = { slidePosition: 'over-the-shoulder' };
        expect(parseSlidePosition(msg)).toBe('over-the-shoulder');
    });

    it('should extract position from scene name with "slides " prefix (case insensitive)', () => {
        const msg = { scene: 'Scene Slides full-screen' };
        expect(parseSlidePosition(msg)).toBe('full-screen');
    });

    it('should handle scene name without "Scene " prefix', () => {
        const msg = { scene: 'slides side-by-side' };
        expect(parseSlidePosition(msg)).toBe('side-by-side');
    });

    it('should handle trailing content after class name', () => {
        const msg = { scene: 'Scene slides over-the-shoulder (Overlay)' };
        expect(parseSlidePosition(msg)).toBe('over-the-shoulder');
    });

    it('should handle multiple spaces', () => {
        const msg = { scene: 'Scene   slides   full-screen' };
        expect(parseSlidePosition(msg)).toBe('full-screen');
    });

    it('should return null if no position or slides scene', () => {
        const msg = { scene: 'Just a Scene' };
        expect(parseSlidePosition(msg)).toBe(null);
    });

    it('should handle missing msgParam', () => {
        expect(parseSlidePosition(null)).toBe(null);
    });
});
