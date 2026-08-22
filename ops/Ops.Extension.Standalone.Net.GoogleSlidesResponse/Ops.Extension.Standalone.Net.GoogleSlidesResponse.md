# Google Slides Transparent Response Operator

`Ops.Extension.Standalone.Net.GoogleSlidesResponse`

## Overview

The **Google Slides Transparent Response** operator is a dedicated standalone Cables GL operator that serves published Google Slides presentations with background elements removed for transparent live video overlays (e.g. in OBS Browser Sources, Cables GL canvas layers, or web iframes).

It connects seamlessly to an upstream **`Ops.Extension.Standalone.HttpFileServer`** instance, listening for incoming HTTP requests matching a configured API route (such as `/api/slides`).

---

## How to Set Up in Google Slides

1. In Google Slides, select your slide deck.
2. In the menu bar, click: **Slide → Change background**.
3. Set the **Color** to `#abcdef` (custom hex color `abcdef`). Apply to all slides.
4. Publish your presentation:
   - Click **File → Share → Publish to web**.
   - Select **Link**, configure your auto-advance settings if desired, and click **Publish**.
   - Copy the published URL (e.g., `https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub`).

---

### Operator Inputs & Outputs

#### Inputs
| `HttpFileServer` Output | `GoogleSlidesResponse` Input | Description |
| :--- | :--- | :--- |
| **On HTTP Request** | **Trigger** | Signals incoming request |
| **HTTP Request Data** | **Request Data** | Passes request URL, path, and query |
| **HTTP Response Data** | **Response** | Passes `ServerResponse` handle to write response |

#### Outputs
| `GoogleSlidesResponse` Output | Type | Description |
| :--- | :--- | :--- |
| **On Success** | `Trigger` | Fired when slides are transformed and served |
| **On Error** | `Trigger` | Fired when an error occurs |
| **Element** | `Object (HTMLElement)` | The `<iframe>` DOM element rendering the transparent slides directly in the patch |
| **Transformed HTML** | `String` | Raw transformed HTML markup string with transparent CSS & scripts injected |
| **Last Slide URL** | `String` | Last loaded presentation URL |
| **Error** | `String` | Error message string if a request failed |

---

## API Usage

### Endpoint
```http
GET http://127.0.0.1:8080/api/slides?url=<PUBLISHED_SLIDES_URL>
```

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` / `slidesUrl` | `string` | *(Required)* | URL of published Google Slide (or local file path). |
| `bg` | `string` | `#abcdef` | Target background hex color to remove. |
| `hideNavbar` | `boolean` | `false` | `1` or `true` to hide the punch-viewer navbar controls. |

### Example Request (OBS Browser Source / Iframe)
```html
<iframe src="http://127.0.0.1:8080/api/slides?url=https%3A%2F%2Fdocs.google.com%2Fpresentation%2Fd%2Fe%2F2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ%2Fpub&hideNavbar=1" width="1920" height="1080" allowtransparency="true"></iframe>
```

---

## Example Client Application

An interactive testing & preview client is provided in [`example_slides_client.html`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Net.GoogleSlidesResponse/example_slides_client.html):

- **Live Presentation Deck Preloaded**: `https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub`
- **Background Simulator**: Test transparency against animated gradients, checkerboards, chroma green, or live webcam video.
- **OBS URL Generator**: One-click copy for OBS Browser Source setups.

---

## Features & Transformations

- **Base Tag Injection**: Automatically adds `<base href="https://docs.google.com/">` so Google scripts, Web Workers, and fonts load correctly.
- **CSS Transparency Injections**: Overrides container backgrounds (`.sketchyViewerContainer`, `.punch-viewer-page-wrapper`, `body`) and hides `#abcdef` / `#ffffff` background paths.
- **Dynamic MutationObserver**: Injects a client script to continuously watch the DOM and remove background paths dynamically as presenters change slides.
- **CORS & Framing Enabled**: Strips restrictive framing meta tags and returns `Access-Control-Allow-Origin: *` headers.
- **Built-in Image Proxy & CORP Bypass**: Automatically routes slide images and textures through `/api/slides/image` to bypass Cross-Origin-Resource-Policy (`ERR_BLOCKED_BY_RESPONSE.NotSameSite`) restrictions.
- **Local File Support**: Accepts local file paths (e.g. `reference/googleslideDevTools/slides.html`) for offline presentations and testing.
