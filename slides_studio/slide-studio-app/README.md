# Slides Studio App v2.0

## Description
Slides Studio is a specialized presentation environment built on top of the **Reveal.js** framework. It bridges the gap between digital slide decks and live broadcasting by enabling seamless control of **Open Broadcaster Software (OBS)** directly from the presentation interface.

The application consists of three primary components:
1. **Speaker View (`index.html`)**: The main control center for the presenter. It handles slide indexing, navigation, and orchestrates the synchronization across all views.
2. **Studio View (`studio.html`)**: A data-driven dashboard that displays the compiled slide index and allows real-time triggering of OBS scenes and sources.
3. **Slide View (`slide_view/`)**: Broadcast-ready overlays designed to be used as OBS Browser Sources. Includes built-in support for **Transparent Overlays** and dynamic CSS transforms.
4. **Teleprompter (`teleprompter.html`)**: A dependency-free, vanilla JS prompter that syncs with your slide notes and supports auto-scrolling.

---

## OBS Configuration Guide

To get the most out of Slides Studio, configure your OBS Scene Collection with the following components and production scenes.

### Core Component URLs
Use these URLs in your OBS Browser Sources. Ensure the height and width are set to **1920x1080**.

- **Slide Component**: `http://127.0.0.1:57000/slide-studio-app/slide_view/slides_studio_slide_view.html`
- **Camera Component**: `http://127.0.0.1:57000/slide-studio-app/slide_view/camera_shape.html`

### Recommended Production Scenes

| Scene Name | Purpose | Layout Configuration (JSON) |
| :--- | :--- | :--- |
| **Slide Full Screen** | Standard presentation view. | `{"slideComponent": {"x": 0, "y": 0, "scaleX": 1, "scaleY": 1}}` |
| **Slide Left Half** | Side-by-side view. | `{"slideComponent": {"x": 0, "y": 0, "scaleX": 0.5, "scaleY": 1}}` |
| **Over The Shoulder** | Picture-in-picture view. | `{"slideComponent": {"x": 96, "y": 108, "scaleX": 0.4, "scaleY": 0.4}, "cameraComponent": {"path": "circle(50%)"}}` |

### Setup Steps
1. **Add the Slide View**: In every scene, add a Browser Source pointing to the **Slide Component URL**.
2. **Add the Camera Mask**: In scenes where you want a dynamic camera, add a Browser Source pointing to the **Camera Component URL**.
3. **Configure SceneConfig**: For each scene in OBS, create a **Text Source (GDI+ or FreeType2)** named `SceneConfig-{SceneName}` (e.g., `SceneConfig-Over The Shoulder`).
4. **Save Layout Data**: Paste your JSON configuration (position, scale, and mask path) into the text source. Slides Studio will automatically apply these settings as you navigate.

---

## Architecture: The Synchronization Engine

### Centralized Indexing (`index.html`)
The main interface (`index.html`) acts as the logic hub. It traverses the Reveal.js structure via a hidden iframe to compile a `slidesArray`. This array contains the mapping of slide states to OBS scene names.

### Scene Choreography Engine
- **Scene Switching**: When you navigate to a slide with a defined scene, `index.html` triggers the scene change in OBS.
- **Dynamic Fetching**: Upon switching, the app fetches the `SceneConfig` from the scene-specific text source.
- **CHOREOGRAPHY_UPDATE**: A broadcast event containing the component positions, scales, and SVG mask paths is sent to all overlays.
- **Direct Transforms**: The Slide View applies absolute pixel coordinates and scaling, removing the need for static CSS classes.
- **BroadcastChannel**: Used for ultra-low latency updates between the Slide View and the Camera component for mask path synchronization.

### Data Persistence (Sidecar Model)
Slides Studio uses a **Sidecar Persistence** model. When you configure slide-to-scene mappings in the Speaker View:
- Data is saved to a `[deck-name].obs-map.json` file in the same folder as your presentation.
- The app automatically creates this file on initial load.
- No database or external configuration is required; your settings travel with your deck.

---

## SceneConfig Schema

Scene-specific layouts are defined using JSON stored in OBS Text Sources named `SceneConfig-{SceneName}`.

### Schema Structure
```json
{
  "slideComponent": {
    "x": number,          // Horizontal offset (px)
    "y": number,          // Vertical offset (px)
    "scaleX": number,     // Horizontal scale (1.0 = 100%)
    "scaleY": number,     // Vertical scale
    "style": object       // Optional: Arbitrary CSS properties (filter, border, etc.)
  },
  "cameraComponent": {
    "path": string,       // SVG path, CSS shape (circle, polygon), or legacy class
    "style": object       // Optional: Arbitrary CSS properties
  }
}
```

### Production Example
**Scene: "Over The Shoulder"**
```json
{
  "slideComponent": {
    "x": 96,
    "y": 108,
    "scaleX": 0.4,
    "scaleY": 0.4,
    "style": {
      "borderRadius": "24px",
      "boxShadow": "0 20px 50px rgba(0,0,0,0.5)",
      "border": "2px solid rgba(255,255,255,0.2)"
    }
  },
  "cameraComponent": {
    "path": "circle(50% at 50% 50%)",
    "style": {
      "filter": "contrast(1.1) brightness(1.1)"
    }
  }
}
```

## Legacy CSS Migration

If you are migrating from `iframe_positions.css`, use the following pixel-perfect mappings for a **1920x1080** canvas:

| Legacy Class | New Configuration (JSON) |
| :--- | :--- |
| `.full-screen` | `{"x": 0, "y": 0, "scaleX": 1, "scaleY": 1}` |
| `.side-by-side` | `{"x": 0, "y": 0, "scaleX": 0.5, "scaleY": 1}` |
| `.over-the-shoulder` | `{"x": 96, "y": 108, "scaleX": 0.4, "scaleY": 0.4}` |

### Note on Coordinate System
- **X/Y**: Absolute pixel offsets from the top-left corner.
- **Scale**: Replaces CSS `width`/`height` percentages (e.g., `0.5` = `50%`).
- **Transforms**: Legacy rotation or skewing should now be placed inside the `style` object.

---

## Recent Production Improvements

### Transparent Slide Overlays
The Slide View now supports transparency injection. It automatically removes the default Reveal.js backgrounds, allowing you to layer slides directly over your camera in OBS. 
- Individual slide backgrounds (images/colors) are preserved.
- Enable by adding the Slide View as a Browser Source with "Shutdown source when not visible" disabled for best performance.

### Vanilla Teleprompter
The built-in teleprompter has been completely refactored to Vanilla JS for 2026 standards:
- **Zero Dependencies**: Removed jQuery and jQuery UI.
- **Auto-Scroll**: A new toggle allows the prompter to start scrolling automatically as soon as you switch slides.
- **Smooth Performance**: Uses `requestAnimationFrame` and native range inputs for ultra-smooth speed and font adjustments.
- **Remote Sync**: Fully synchronized with the Speaker View via WebSockets.

---
*Inspired by reveal.js, OBS, and the creative coding community.*
