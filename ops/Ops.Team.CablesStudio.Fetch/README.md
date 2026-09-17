# Generic Content Fetch Operator with User-Provided JavaScript

**Op Identifier**: `Ops.Team.CablesStudio.Fetch`  
**Category**: `gl` / `HTML`  
**Author**: `Antigravity` / Cables Studio Team  

A flexible Cables.gl operator that fetches a complete slide deck or HTML document from a URL, automatically resolves and offsets all relative asset paths (images, links, stylesheets, and CSS URLs) against a `Base URL`, and runs a user-provided JavaScript script directly from a multi-line code editor input to initialize and control the fetched presentation.

---

## Description

The `Ops.Team.CablesStudio.Fetch` operator bridges remote HTML slide decks (such as Reveal.js presentations stored on GitHub or uploaded as patch attachments) with Cables.gl:

1. **Fetches complete HTML documents** from any URL (or local patch attachment via `op.patch.getFilePath()`).
2. **Rewrites relative asset paths** (`src`, `href`, `srcset`, inline `style="url(...)"`, and `<style>` tags) against the document's `Base URL` so images and stylesheets load seamlessly.
3. **Executes user-provided JavaScript** via the **`Script`** string editor input (pre-populated with Reveal.js v5.1.0 CDN loading and deck initialization).
4. **Mounts the live DOM element to `Element` (`outElement`)**, enabling direct UI embedding or live WebGL texture rendering via **`Ops.Team.CablesStudio.HTMLInCanvas`**.

---

## Technical Architecture

```
 ┌────────────────────────────────────────────────────────┐
 │ 1. Input: URL / Patch Attachment                       │
 │    (e.g., GitHub-hosted Reveal.js slide deck HTML)     │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. Base URL & Asset Rewriter                           │
 │    (Rewrites relative src, href, srcset, and CSS URLs) │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. DOM Container Mounting                              │
 │    (cables-fetch-container with width/height/overflow) │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. User-Provided Script Execution                      │
 │    (Executes inScript with container, fetchUrl, op)    │
 └───────────────────────────┬────────────────────────────┘
                             │
                             │ Element (Object)
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. Ops.Team.CablesStudio.HTMLInCanvas ──► WebGL Texture│
 └────────────────────────────────────────────────────────┘
```

---

## User-Provided JavaScript Context

When the HTML document has been fetched, parsed, asset-rewritten, and appended to the container, the op executes the code in the **`Script`** editor port.

The user script runs with the following parameters:

| Variable | Type | Description |
| :--- | :--- | :--- |
| **`container`** | `HTMLElement` | The root DOM `<div>` element containing the parsed and mounted presentation markup. |
| **`fetchUrl`** | `String` | The fully resolved URL from which the content was fetched. |
| **`baseUrl`** | `String` | The computed or user-specified base directory URL. |
| **`op`** | `Object` | The Cables operator instance (`op.log()`, `op.logError()`, UI error notifications). |

### Storing a Teardown Hook
To ensure clean garbage collection when fetching a new presentation or deleting the op, your script can attach a cleanup function to the container:
```javascript
container._cleanupScript = () => {
    try {
        if (deck) deck.destroy();
    } catch (e) {}
};
```

---

## Default Script (Reveal.js Initializer)

By default, the **`Script`** editor port is pre-loaded with the following adapted script from `Ops.Team.CablesStudio.RevealJs`:

```javascript
// Reveal.js Support Script for Fetched Slide Decks
// Available context: container (DOM element), fetchUrl, baseUrl, op

const CORE_CSS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css";
const THEME_CSS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/theme/black.min.css";
const REVEAL_JS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js";

function loadStylesheet(id, url) {
    let link = document.getElementById(id);
    if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
    } else if (link.href !== url) {
        link.href = url;
    }
}

function loadScript(url, callback) {
    if (window.Reveal) {
        callback();
        return;
    }
    let script = document.querySelector(`script[src="${url}"]`);
    if (script) {
        if (script.dataset.loaded === "true") {
            callback();
        } else {
            script.addEventListener("load", callback);
        }
        return;
    }
    script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
        script.dataset.loaded = "true";
        callback();
    };
    script.onerror = () => {
        op.logError("[Script] Failed to load Reveal library:", url);
    };
    document.head.appendChild(script);
}

// Load core styles
loadStylesheet("reveal-core-css", CORE_CSS);
loadStylesheet("reveal-theme-default", THEME_CSS);

loadScript(REVEAL_JS, () => {
    let revealNode = container.querySelector(".reveal");
    if (!revealNode) {
        const slidesNode = container.querySelector(".slides");
        if (slidesNode) {
            revealNode = document.createElement("div");
            revealNode.className = "reveal";
            slidesNode.parentNode.insertBefore(revealNode, slidesNode);
            revealNode.appendChild(slidesNode);
        } else {
            const sections = container.querySelectorAll("section");
            if (sections.length > 0) {
                revealNode = document.createElement("div");
                revealNode.className = "reveal";
                const slidesDiv = document.createElement("div");
                slidesDiv.className = "slides";
                sections.forEach(sec => slidesDiv.appendChild(sec));
                revealNode.appendChild(slidesDiv);
                container.appendChild(revealNode);
            }
        }
    }

    if (!revealNode) {
        op.logWarn("[Script] No .reveal, .slides, or <section> elements found in fetched content.");
        return;
    }

    revealNode.style.width = "100%";
    revealNode.style.height = "100%";

    setTimeout(() => {
        try {
            if (typeof Reveal === "undefined") return;
            const deck = new Reveal(revealNode, {
                embedded: true,
                keyboard: true,
                respondToHashChanges: false,
                history: false,
                progress: true,
                controls: true
            });

            deck.initialize().then(() => {
                op.log("[Script] Reveal presentation initialized successfully.");
            }).catch(err => {
                op.logError("[Script] Deck initialization failed:", err);
            });

            container._cleanupScript = () => {
                try { deck.destroy(); } catch (e) {}
            };
        } catch (e) {
            op.logError("[Script] Exception during Reveal init:", e);
        }
    }, 50);
});
```

---

## Ports Reference

### Input Ports

| Group | Port Name | Type | Description |
| :--- | :--- | :--- | :--- |
| *(Default)* | **URL** | `String` | URL of the remote presentation or local attachment. |
| *(Default)* | **Base URL** | `String` | Base URL used to resolve relative asset paths. Defaults to directory of `URL`. |
| **Scripting** | **Script** | `String Editor` | Multi-line JavaScript code editor executed when content is loaded. |
| **Controls** | **Reload** | `Trigger Button` | Manually triggers a fresh fetch and re-runs the user script. |
| **Controls** | **Auto Fetch** | `Boolean` | Automatically re-fetches when `URL` or `Script` changes (default: `true`). |
| **Container Styling** | **Width** | `String` | CSS width applied to the container (default: `100%`). |
| **Container Styling** | **Height** | `String` | CSS height applied to the container (default: `100%`). |
| **Container Styling** | **Overflow** | `Select` | CSS overflow property (`hidden`, `visible`, `auto`, `scroll`). Default: `hidden`. |

---

### Output Ports

| Port Name | Type | Description |
| :--- | :--- | :--- |
| **Element** | `Object` (DOM Element) | Root container `<div>` containing the fetched and initialized presentation. |
| **HTML** | `String` | The processed HTML markup with resolved asset URLs. |
| **Loaded** | `Trigger` | Fires when the document is fetched, parsed, and script executed. |
| **Error** | `String` | Diagnostic error message if network fetch, parsing, or script execution fails. |

---

## Usage: Rendering to Texture via HTML-in-Canvas

```
[ Ops.Team.CablesStudio.Fetch ]
        │ (Element)
        ▼
[ Ops.Team.CablesStudio.HTMLInCanvas ]
        │ (Texture)
        ▼
[ Ops.Gl.Shader.BasicMaterial ] ───► [ Ops.Gl.Meshes.Cube / Plane ]
```

1. Add **`Ops.Team.CablesStudio.Fetch`** to your patch.
2. In **`URL`**, enter the URL of your complete Reveal.js slide deck (e.g. `https://raw.githubusercontent.com/username/repo/main/slides.html` or a local patch asset).
3. Connect **`Element`** of `Fetch` to **`Element`** of **`Ops.Team.CablesStudio.HTMLInCanvas`**.
4. Connect your render loop to **`Update`** on `HTMLInCanvas`.
5. Connect **`Texture`** out of `HTMLInCanvas` to any material in your WebGL 3D scene.
