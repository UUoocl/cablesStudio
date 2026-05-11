/**
 * Parses the layout name from an OBS Scene name.
 * Matches existing Slides-Studio convention: "Scene Name slides LayoutName"
 * @param {string} sceneName The name of the OBS scene.
 * @return {?string} The extracted layout name, or null if not found.
 */
export function parseLayoutName(sceneName) {
    if (!sceneName || typeof sceneName !== 'string') return null;
    
    // Using a regex that handles "slides" followed by optional separator
    const parts = sceneName.split(/slides[ \-_]*/i);
    if (parts.length < 2) return null;
    
    // Take the part after the 'slides ' and clean up
    let layoutPart = parts[parts.length - 1].trim().split(" ")[0];
    
    // Remove leading/trailing dashes, underscores, or spaces
    layoutPart = layoutPart.replace(/^[ \-_]+|[ \-_]+$/g, '');
    
    return layoutPart || null;
}
