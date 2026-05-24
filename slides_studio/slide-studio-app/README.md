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

Scene-specific layouts are defined using JSON stored in OBS Text Sources named `SceneConfig-{SceneName}` (or `sceneConfig-{SceneName}`).

### Schema Structure

```json
{
  "slideComponent": {
    "x": number,            // Horizontal offset (px from top-left)
    "y": number,            // Vertical offset (px from top-left)
    "scaleX": number,       // Horizontal scale multiplier (e.g. 1.0 = 100%, 0.5 = 50%)
    "scaleY": number,       // Vertical scale multiplier
    "width": number|string, // Optional: Custom explicit width (e.g. 960, "50%", "960px"). Defaults to "100%"
    "height": number|string,// Optional: Custom explicit height (e.g. 1080, "100%", "1080px"). Defaults to "100%"
    "style": {              // Optional: Custom CSS visual properties smoothly blended via GSAP
      "border": "string",
      "borderRadius": "string",
      "boxShadow": "string",
      "filter": "string",
      "opacity": "string"
    }
  },
  "cameraComponent": {
    "path": "string",       // Mask shape (e.g. "circle", "pulsating-circle", standard CSS clip-path or SVG path commands)
    "style": {              // Optional: Custom CSS properties (backgroundColor, filter, border, etc.)
      "backgroundColor": "string",
      "filter": "string"
    }
  },
  "moveTransition": {
    "sources": ["string"],  // Array of OBS source names to animate concurrently (e.g. ["Main Camera"])
    "duration": number,     // Transition duration in milliseconds (default: 500)
    "ease": "string",       // Easing curve: "linear", "ease-in", "ease-out" (recommended), "bounce"
    "steps": number,        // Number of interpolation steps for OBS transforms (default: 15)
    "delay": number         // Delay in milliseconds before starting transition (default: 0)
  }
}
```

### Complete Settings Reference

#### 1. Slide Component (`slideComponent`)
Manages the positioning, dimensions, and styling of the slide deck overlay iframe inside the full-screen (1920x1080) canvas. All spatial and visual properties undergo high-performance, 60fps interpolation via GSAP.

* **`x`** (Number): Absolute horizontal pixel offset from top-left corner. Default: `0`.
* **`y`** (Number): Absolute vertical pixel offset from top-left corner. Default: `0`.
* **`scaleX`** (Number): Horizontal scaling multiplier. Default: `1.0` (100% scale).
* **`scaleY`** (Number): Vertical scaling multiplier. Default: `1.0` (100% scale).
* **`width`** (Number | String): Dynamic spatial width override. Can be an integer pixel value (e.g., `960` maps to `"960px"`) or a CSS-valid string (e.g. `"50%"`). If omitted, defaults to `"100%"`.
* **`height`** (Number | String): Dynamic spatial height override. Can be an integer pixel value (e.g., `1080` maps to `"1080px"`) or a CSS-valid string. If omitted, defaults to `"100%"`.
* **`style`** (Object): Dynamic visual attributes. The system automatically merges incoming visual properties with standard defaults to guarantee perfectly smooth, flicker-free transitions. Supported parameters include:
  * **`borderRadius`** (String): Smoothly blends rounded corners (e.g., `"24px"`, `"50%"`). Defaults to `"0px"` when omitted or when transitioning back to unconfigured scenes.
  * **`boxShadow`** (String): Blends dropshadow elevations (e.g., `"0 20px 50px rgba(0,0,0,0.5)"`). Defaults to `"none"` when unconfigured.
  * **`border`** (String): Dynamic borders around the slide iframe (e.g., `"2px solid rgba(255,255,255,0.2)"`). Defaults to `"0px solid transparent"`.
  * **`opacity`** (String | Number): Blends transparency values (e.g., `"0.8"`). Defaults to `"1"`.
  * **`filter`** (String): Graphical filter effects (e.g., `"brightness(1.1) blur(0px)"`). Defaults to `"none"`.

> [!NOTE]
> If a scene has no configured JSON block or slideComponent settings, the engine automatically triggers a graceful fullscreen animation fallback (`x: 0, y: 0, scaleX: 1, scaleY: 1`, with visual styles smoothly transitioning back to their clean defaults).

#### 2. Camera Component (`cameraComponent`)
Configures the presenter's camera overlay masking shape and styling properties. The orchestrator synchronizes these values instantly via a low-latency `BroadcastChannel` (`cameraShapes_channel`).

* **`path`** (String): Defines the clipping mask shape path. It handles multiple formatting systems:
  * **Pre-defined Shape Classes**: `"circle"`, `"square"`, `"pulsating-circle"`, `"pulsating-square"` (sourced from `camera-shapes.css`).
  * **CSS Clip-Path Shapes**: Standard shape functions such as `"circle(50% at 50% 50%)"`, `"polygon(50% 0%, 0% 100%, 100% 100%)"` (triangle), or `"polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)"` (trapezoid).
  * **SVG Path Commands**: Standard SVG path data strings. Any string containing coordinate symbols but omitting CSS functional prefixes is automatically wrapped in `path("...")`.
  * **Reset Fallback**: `"none"` or empty string resets the clipping path, displaying the full rectangular camera view.
* **`style`** (Object): Arbitrary CSS attributes applied directly to the camera container. Highly used parameters:
  * **`filter`** (String): Graphic filters for color correction or shadows (e.g., `"contrast(1.1) brightness(1.1) drop-shadow(0 0 10px white)"`).
  * **`backgroundColor`** (String): Background fill color, particularly used when resetting clip-paths (e.g., `"white"`, `"transparent"`).

#### 3. Move Transition (`moveTransition`)
Orchestrates smooth movement transitions for OBS sources concurrently with scene changes. If a `slideComponent` change is triggered, the system automatically runs the layout animations alongside these OBS transitions.

* **`sources`** (Array of Strings): Identifies the exact list of OBS source names to animate (e.g., `["Main Camera"]`).
  > [!IMPORTANT]
  > The synchronization engine automatically excludes `"Slide_deck"` from OBS-side movement commands to ensure it remains a static full-screen canvas in OBS. All slide deck movements are instead animated client-side via high-performance GSAP inside the browser source overlay.
* **`duration`** (Number): Transition duration in milliseconds. Defaults to `500` if omitted.
* **`ease`** (String): Acceleration easing curve. Supported values:
  * `"ease-out"`: Fast beginning, smooth deceleration at destination. (Highly recommended for premium broadcast production).
  * `"ease-in"`: Slow start, rapid acceleration.
  * `"linear"`: Constant speed.
  * `"bounce"`: Bounces elastically on arrival at target coordinate bounds.
* **`steps`** (Number): The density of interpolation steps calculated during the movement loop. Defaults to `15` steps.
* **`delay`** (Number): Delay in milliseconds before starting the transition. Defaults to `0`.

---

### Production Example

**Scene Config JSON** (e.g. stored in `SceneConfig-Over The Shoulder`):
```json
{
  "slideComponent": {
    "x": 96,
    "y": 108,
    "scaleX": 0.4,
    "scaleY": 0.4,
    "width": "100%",
    "height": "100%",
    "style": {
      "borderRadius": "24px",
      "boxShadow": "0 20px 50px rgba(0,0,0,0.5)",
      "border": "2px solid rgba(255,255,255,0.2)"
    }
  },
  "cameraComponent": {
    "path": "pulsating-circle",
    "style": {
      "filter": "contrast(1.1) brightness(1.1) drop-shadow(0 0 10px rgba(255,255,255,0.3))"
    }
  },
  "moveTransition": {
    "sources": ["Main Camera"],
    "duration": 600,
    "ease": "ease-out",
    "steps": 18,
    "delay": 0
  }
}
```

---

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

### 🚀 Reload-Resilient Layout State
To prevent the slide deck overlay from resetting or snapping during OBS browser source updates, active scene positions and transitions are now cached in `sessionStorage` in the Slide View context.
- **Instant Restore**: Page reloads or browser source resets query the cache immediately during `DOMContentLoaded` and snap to the last known position with `duration: 0` before rendering, eliminating any layout snapping.
- **Zero Flickering**: The system survives active OBS scene updates and manual refreshes without flashing back to standard fullscreen coordinates.

### 🎥 Seamless Camera Transformation Glide
The presenter camera transformation system has been refactored for a premium, continuous on-air presence:
- **Continuous Visibility**: Removed legacy behaviors that hid or scaled the camera source to zero during transitions to cover coordinate jumps.
- **Pre-Snapped Transitions**: Camera sources are pre-snapped to their previous coordinates *before* the new scene activates. They glide concurrently and seamlessly from their exact starting points to their new destinations.
- **Concurrent Execution**: Slide navigation transitions and spatial layout animations trigger simultaneously, delivering synchronized animations across all layers.

### ⚡ Performance Tuning & Rendering Anti-Stuttering
Native CSS transitions have been removed from `iframe_positions.css` to prevent calculations from fighting with GSAP's 60fps high-frequency rendering loop. This guarantees stutter-free, hardware-accelerated fluid movements.

### 🍃 Transparent Slide Overlays
The Slide View now supports transparency injection. It automatically removes the default Reveal.js backgrounds, allowing you to layer slides directly over your camera in OBS. 
- Individual slide backgrounds (images/colors) are preserved.
- Enable by adding the Slide View as a Browser Source with "Shutdown source when not visible" disabled for best performance.

### 📋 Vanilla Teleprompter
The built-in teleprompter has been completely refactored to Vanilla JS for 2026 standards:
- **Zero Dependencies**: Removed jQuery and jQuery UI.
- **Auto-Scroll**: A new toggle allows the prompter to start scrolling automatically as soon as you switch slides.
- **Smooth Performance**: Uses `requestAnimationFrame` and native range inputs for ultra-smooth speed and font adjustments.
- **Remote Sync**: Fully synchronized with the Speaker View via WebSockets.

---
*Inspired by reveal.js, OBS, and the creative coding community.*
