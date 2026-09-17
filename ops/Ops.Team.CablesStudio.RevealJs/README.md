# Reveal.js Presentation Operator

**Op Identifier**: `Ops.Team.CablesStudio.RevealJs`  
**Category**: `gl` / `HTML`  
**Author**: `Antigravity` / Cables Studio Team  

A versatile Cables.gl operator that dynamically fetches, parses, and runs interactive **[Reveal.js](https://revealjs.com/)** slide presentations within Cables. It encapsulates the Reveal.js runtime in an embedded DOM container, rewrites relative asset URLs, provides interactive trigger and index-based navigation controls, and exposes presentation state back to the Cables patch.

---

## Description

The `Ops.Team.CablesStudio.RevealJs` operator bridges web-based slide presentations and the Cables WebGL / HTML runtime. By providing a URL to an HTML document or presentation endpoint, this operator:

* Automatically loads and manages Reveal.js v5.1.0 scripts and stylesheets.
* Parses and normalizes diverse HTML slide formats (full Reveal layouts, `.slides` containers, or bare `<section>` tags).
* Resolves relative media and link paths (`src`, `href`, `style="url(...)"`) based on the fetched source URL or a custom base URL.
* Mounts the presentation inside a responsive HTML container element outputted via the `Element` port.
* Exposes full bi-directional control: step through slides with trigger buttons, jump directly to arbitrary slide indices, select themes dynamically, and monitor the current active slide index and error states.

---

## Technical Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Cables Patch                   │
                    │  (Triggers, Slide Index, Theme, Fetch URL)   │
                    └───────┬───────────────────────────────▲──────┘
                            │                               │
                      Input Parameters               Current Slide /
                      & Navigation Triggers           Element / Error
                            │                               │
                            ▼                               │
┌───────────────────────────────────────────────────────────┴──────────────────────────────────────┐
│ Ops.Team.CablesStudio.RevealJs                                                                   │
│                                                                                                  │
│  1. Asset & Runtime Loader                                                                       │
│     ├── Async CDN Script Loader (Reveal.js v5.1.0 with singleton caching)                       │
│     ├── Global Core Stylesheet (`reveal.min.css`)                                                │
│     └── Dynamic Instance Theme Injector (`reveal-theme-css-<op.id>`)                             │
│                                                                                                  │
│  2. Pipeline & HTML Normalization                                                                │
│     ├── Fetch Slide HTML via `fetch(url)`                                                        │
│     ├── `DOMParser` parses text into a DOM tree                                                  │
│     ├── URL Rewriter: resolves relative `src`, `href`, and `background-image: url(...)` paths   │
│     └── Structure Fallback Resolver: `.reveal` ➔ `.slides` ➔ `<section>` collection              │
│                                                                                                  │
│  3. Embedded Reveal Deck Runtime                                                                 │
│     ├── Container: `.cables-reveal-container` (100% width/height, relative positioning)          │
│     ├── Instance: `new Reveal(revealNode, { embedded: true, keyboard: true, controls: true })`   │
│     ├── Event Bridge: `deck.on("slidechanged")` ➔ `outCurrentSlide`                              │
│     └── Lifecycle Management: `deck.destroy()`, style cleanup on `op.onDelete` or URL change     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Dynamic Script & Theme Asset Management
* **Script Deduplication**: Asynchronously injects `reveal.min.js` (v5.1.0) into `document.head` with custom loading state tracking (`dataset.loaded`) to prevent duplicate downloads and race conditions across multiple op instances.
* **Instance-Scoped Themes**: Injects theme CSS files (`reveal-theme-css-<op.id>`) dynamically into `document.head`. Changing the **Theme** dropdown triggers immediate stylesheet swapping and invokes `deck.layout()` without resetting slide state.
* **Supported Themes**: `black`, `white`, `league`, `beige`, `sky`, `night`, `serif`, `simple`, `solarized`, `blood`, `moon`.

### 2. HTML Fetching & Semantic Normalization
* **Fetch Pipeline**: Downloads remote presentations using the browser `fetch()` API, capturing network or HTTP status errors and routing them to `outError` and `op.setUiError`.
* **Flexible DOM Structure Resolution**:
  * **Full Document**: Finds and utilizes existing `.reveal > .slides` markup.
  * **Partial Container**: Wraps an isolated `.slides` element in a `.reveal` container.
  * **Section Fragments**: Automatically bundles a collection of `<section>` tags into a `.reveal > .slides` structure.
* **Asset Path Resolution**: Resolves relative asset URLs across all `src` tags (e.g., `<img>`, `<video>`), `href` tags (e.g., `<a>`), and inline CSS (`style="background-image: url(...)"`) using either the calculated directory of the `Fetch URL` or a custom `Base URL`.

### 3. Reveal Deck Lifecycle & Embedded Mode
* **Embedded Configuration**: Initializes Reveal with `embedded: true`, allowing it to live inside any DOM hierarchy or Cables HTML layer without capturing the entire window or modifying global browser URL hash history (`history: false`, `respondToHashChanges: false`).
* **Clean Destruction**: Whenever a new presentation is fetched or the operator is removed from the canvas (`op.onDelete`), active Reveal deck instances are safely destroyed via `deck.destroy()`, container contents are wiped, and instance-specific style nodes are pruned from the document head.

---

## Ports Reference

### Input Ports

| Group | Port Name | Type | Description |
| :--- | :--- | :--- | :--- |
| *(Default)* | **Fetch URL** | `String` | URL of the HTML presentation or slide fragment to load and render. |
| *(Default)* | **Base URL** | `String` | Optional base URL for resolving relative links/images. If empty, defaults to the directory path of `Fetch URL`. |
| **Settings** | **Theme** | `Select` | Reveal.js theme to apply (`black`, `white`, `league`, `beige`, `sky`, `night`, `serif`, `simple`, `solarized`, `blood`, `moon`). |
| **Navigation** | **Next Slide** | `Trigger Button` | Advances the presentation to the next slide (`deck.next()`). |
| **Navigation** | **Prev Slide** | `Trigger Button` | Moves the presentation to the previous slide (`deck.prev()`). |
| **Navigation** | **Slide Index** | `Integer` | Directly jumps to a specific horizontal slide index (`deck.slide(index)`). |

---

### Output Ports

| Port Name | Type | Description |
| :--- | :--- | :--- |
| **Element** | `Object` (DOM Element) | The `.cables-reveal-container` HTML `<div>` element containing the rendered Reveal.js deck. Connect to DOM/HTML layout ops. |
| **Current Slide** | `Integer` | Zero-indexed integer of the currently active horizontal slide. Updates on slide change. |
| **Error** | `String` | Error message string if network fetching, parsing, or initialization fails. |

---

## Usage & Quick Start

### 1. Basic Setup in Cables
1. Add **`Ops.Team.CablesStudio.RevealJs`** to your patch.
2. In the op parameters, enter the URL of your presentation in **Fetch URL** (e.g., `https://example.com/slides.html` or a local patch attachment URL).
3. Connect the **Element** output to an HTML container op (such as `Ops.Html.Element`, `Ops.Html.Div`, or custom overlay logic) or insert it into the DOM.
4. Select your desired visual style from the **Theme** dropdown.

---

### 2. Slide Navigation & Control
* **Trigger Buttons**: Connect trigger sources (e.g., MIDI buttons, keyboard hotkeys via `Ops.Ui.KeyTrigger`, UI buttons) to **Next Slide** and **Prev Slide**.
* **Index-Based Jumps**: Link an integer value or sequencer to **Slide Index** to drive automated presentations, timeline animations, or synchronized multi-screen setups.
* **State Feedback**: Read the **Current Slide** output to synchronize other visual or audio elements in your Cables patch (e.g., 3D background camera transitions, shaders, or audio stems) to specific slides.

---

### 3. Supported HTML Slide Formats

#### Option A: Full Reveal.js HTML Document
```html
<!DOCTYPE html>
<html>
  <head><title>My Presentation</title></head>
  <body>
    <div class="reveal">
      <div class="slides">
        <section><h1>Slide 1</h1><p>Introduction</p></section>
        <section><h2>Slide 2</h2><img src="assets/diagram.png" alt="Diagram"></section>
      </div>
    </div>
  </body>
</html>
```

#### Option B: Minimal `<section>` Snippets
```html
<section>
  <h2>Interactive Graphics with Cables</h2>
  <p>Embedded Reveal.js slide deck.</p>
</section>
<section>
  <h2>Real-Time Control</h2>
  <p>Driven by WebGL and Cables patch logic.</p>
</section>
```

---

## Troubleshooting & Best Practices

* **Cross-Origin (CORS) Issues**: Ensure remote servers hosting presentation HTML and assets include appropriate CORS headers (`Access-Control-Allow-Origin: *`).
* **Relative Media Paths**: If images or fonts fail to load when fetching from external servers or CDN endpoints, provide the root directory explicitly in the **Base URL** input.
* **Container Sizing**: The op sets the `.cables-reveal-container` to `width: 100%` and `height: 100%`. Ensure the parent element in your DOM layout has an explicit width and height.
