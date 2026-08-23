// Ops.Extension.Standalone.Google.WebViewGoogleSlides.js

const
    inRender = op.inTrigger("Render"),
    inUrl = op.inString("Presentation URL", "https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub"),
    inBgColorToRemove = op.inString("Background Color to Remove", "#abcdef"),
    inTriggerRemoveBg = op.inTriggerButton("Remove Background Color"),
    inNext = op.inTriggerButton("Next Slide"),
    inPrev = op.inTriggerButton("Previous Slide"),
    inActive = op.inBool("Active", true),
    inWidth = op.inInt("Texture Width", 1920),
    inHeight = op.inInt("Texture Height", 1080),
    inFlipY = op.inBool("Flip Y", true),

    outNext = op.outTrigger("Next"),
    outTexture = op.outTexture("Texture"),
    outIsLoaded = op.outBoolNum("Is Loaded", false),
    outCurrentSlide = op.outNumber("Current Slide", 1),
    outWidth = op.outNumber("Width", 1920),
    outHeight = op.outNumber("Height", 1080),
    outError = op.outString("Error", "");

op.setPortGroup("Presentation", [inUrl, inBgColorToRemove, inTriggerRemoveBg]);
op.setPortGroup("Controls", [inNext, inPrev]);
op.setPortGroup("Capture Settings", [inActive, inFlipY]);
op.setPortGroup("Resolution", [inWidth, inHeight]);

const cgl = op.patch.cgl;
let texture = null;
const emptyTexture = CGL.Texture.getEmptyTexture(cgl);
outTexture.setValue(emptyTexture);
outTexture.setRef(emptyTexture);

let webviewEl = null;
let currentSlideNumber = 1;
let isDomReady = false;

function formatGoogleSlidesUrl(rawUrl)
{
    if (!rawUrl || typeof rawUrl !== "string") return "";
    let formatted = rawUrl.trim();
    try
    {
        if (formatted.startsWith("http://") || formatted.startsWith("https://"))
        {
            const u = new URL(formatted);
            if (u.hostname.indexOf("google.com") !== -1 && u.pathname.indexOf("/presentation/") !== -1)
            {
                if (u.pathname.endsWith("/embed") || u.pathname.endsWith("/pubembed"))
                {
                    u.pathname = u.pathname.replace(/\/(pubembed|embed)$/i, "/pub");
                }
                return u.href;
            }
        }
    }
    catch (e) {}
    return formatted;
}

function getPreloadPath()
{
    try
    {
        const path = op.require("path") || (typeof require !== "undefined" ? require("path") : null);
        const fs = op.require("fs") || (typeof require !== "undefined" ? require("fs") : null);
        const nodeUrl = op.require("url") || (typeof require !== "undefined" ? require("url") : null);

        let targetFile = "/Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Google.WebViewGoogleSlides/slides_preload.js";

        if (typeof __dirname !== "undefined" && path)
        {
            const dPath = path.join(__dirname, "slides_preload.js");
            if (fs && fs.existsSync(dPath))
            {
                targetFile = dPath;
            }
        }

        if (fs && fs.existsSync(targetFile))
        {
            if (nodeUrl && typeof nodeUrl.pathToFileURL === "function")
            {
                return nodeUrl.pathToFileURL(targetFile).href;
            }
            return "file://" + targetFile;
        }
    }
    catch (e)
    {
        op.logWarn("[WebViewGoogleSlides] getPreloadPath error:", e);
    }
    return "";
}

function removeBgColor()
{
    if (!webviewEl) return;
    const c = (inBgColorToRemove.get() || "#abcdef").trim();

    if (typeof webviewEl.insertCSS === "function")
    {
        try
        {
            webviewEl.insertCSS(`
                html, body,
                .punch-viewer-content,
                .punch-viewer-container,
                .punch-viewer-page-wrapper-container,
                .punch-viewer-page-wrapper,
                .punch-viewer-svgpage-svgcontainer,
                .punch-viewer-svgpage,
                .punch-full-window-overlay,
                .sketchyViewerContainer,
                .sketchyViewerContent,
                .sketchyViewerBody,
                .appsSketchyViewerSvgPageComponentEl,
                :fullscreen, :fullscreen::backdrop {
                    background: transparent !important;
                    background-color: transparent !important;
                    background-color: rgba(0, 0, 0, 0) !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .punch-viewer-navbar,
                .punch-viewer-navbar-container,
                .punch-viewer-nav-fade,
                .punch-viewer-nav,
                .punch-viewer-action-bar,
                .punch-viewer-action-bar-container {
                    display: none !important;
                    height: 0 !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }
            `);
        }
        catch (e) {}
    }

    if (typeof webviewEl.send === "function")
    {
        try { webviewEl.send("set-remove-color", c); } catch (e) {}
    }
}

function handleHtmlInCanvasFrame(data)
{
    if (!data || !data.buffer) return;

    const w = data.width || inWidth.get() || 1920;
    const h = data.height || inHeight.get() || 1080;
    const flipY = inFlipY.get();

    if (!texture || texture.width !== w || texture.height !== h)
    {
        if (texture) texture.dispose();
        texture = new CGL.Texture(cgl, {
            "width": w,
            "height": h,
            "filter": CGL.Texture.FILTER_LINEAR,
            "wrap": CGL.Texture.WRAP_CLAMP_TO_EDGE
        });
    }

    try
    {
        let raw = data.buffer;
        let pixels = null;

        if (raw instanceof Uint8Array)
        {
            pixels = raw;
        }
        else if (raw.buffer && raw.byteLength)
        {
            pixels = new Uint8Array(raw.buffer, raw.byteOffset || 0, raw.byteLength);
        }
        else if (raw.type === "Buffer" && Array.isArray(raw.data))
        {
            pixels = new Uint8Array(raw.data);
        }
        else if (Array.isArray(raw))
        {
            pixels = new Uint8Array(raw);
        }

        if (!pixels || pixels.length < w * h * 4) return;

        const gl = cgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            w,
            h,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels
        );

        if (flipY)
        {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        outTexture.setValue(texture);
        outTexture.setRef(texture);
        outWidth.set(w);
        outHeight.set(h);
        outError.set("");
    }
    catch (err)
    {
        op.logWarn("[WebViewGoogleSlides] WebGL texture upload error:", err);
    }
}

function initWebview()
{
    if (typeof document === "undefined" || !document.body)
    {
        setTimeout(initWebview, 50);
        return;
    }

    destroyWebview();

    const w = inWidth.get() || 1920;
    const h = inHeight.get() || 1080;
    const rawUrl = inUrl.get() || "";
    const url = formatGoogleSlidesUrl(rawUrl);
    const preloadUrl = getPreloadPath();

    op.log("[WebViewGoogleSlides] Initializing HTML-in-Canvas webview. URL: " + url);

    webviewEl = document.createElement("webview");
    webviewEl.id = "cables_webviewgoogleslides_offscreen_" + op.id;

    if (preloadUrl)
    {
        webviewEl.setAttribute("preload", preloadUrl);
    }
    webviewEl.setAttribute("webpreferences", "contextIsolation=no");
    webviewEl.setAttribute("allowpopups", "");

    webviewEl.style.position = "fixed";
    webviewEl.style.left = "0px";
    webviewEl.style.top = "0px";
    webviewEl.style.width = w + "px";
    webviewEl.style.height = h + "px";
    webviewEl.style.opacity = "1";
    webviewEl.style.pointerEvents = "none";
    webviewEl.style.zIndex = "-999999";
    webviewEl.style.background = "transparent";

    document.body.appendChild(webviewEl);
    webviewEl.src = url;

    webviewEl.addEventListener("dom-ready", () =>
    {
        op.log("[WebViewGoogleSlides] Webview DOM ready.");
        isDomReady = true;
        outIsLoaded.set(true);
        outError.set("");
        removeBgColor();
    });

    webviewEl.addEventListener("did-finish-load", () =>
    {
        op.log("[WebViewGoogleSlides] Webview finished load.");
        removeBgColor();
    });

    webviewEl.addEventListener("ipc-message", (event) =>
    {
        if (event.channel === "html-in-canvas-frame")
        {
            const data = event.args ? event.args[0] : null;
            if (data)
            {
                handleHtmlInCanvasFrame(data);
            }
        }
        else if (event.channel === "preload-ready")
        {
            op.log("[WebViewGoogleSlides] HTML-in-Canvas preload script ready in guest view.");
            removeBgColor();
        }
    });

    webviewEl.addEventListener("console-message", (e) =>
    {
        op.log("[WebViewGoogleSlides Guest] " + e.message);
    });

    webviewEl.addEventListener("did-fail-load", (e) =>
    {
        if (e.errorCode !== -3)
        {
            const err = "Webview failed to load: " + (e.errorDescription || e.errorCode);
            op.logWarn("[WebViewGoogleSlides]", err);
            outError.set(err);
        }
    });
}

function destroyWebview()
{
    isDomReady = false;
    outIsLoaded.set(false);

    if (webviewEl)
    {
        try
        {
            if (webviewEl.parentNode)
            {
                webviewEl.parentNode.removeChild(webviewEl);
            }
        }
        catch (e) {}
        webviewEl = null;
    }
}

function navigate(direction)
{
    if (!webviewEl) return;
    const midX = Math.floor((inWidth.get() || 1920) / 2);
    const midY = Math.floor((inHeight.get() || 1080) / 2);

    if (direction === "next")
    {
        currentSlideNumber++;
        outCurrentSlide.set(currentSlideNumber);

        if (typeof webviewEl.sendInputEvent === "function")
        {
            try
            {
                webviewEl.sendInputEvent({
                    "type": "mouseWheel",
                    "x": midX,
                    "y": midY,
                    "deltaX": 0,
                    "deltaY": -120,
                    "canScroll": true
                });
            }
            catch (e) {}
        }

        if (typeof webviewEl.send === "function")
        {
            try { webviewEl.send("next-slide"); } catch (e) {}
        }

        removeBgColor();
    }
    else if (direction === "prev")
    {
        currentSlideNumber = Math.max(1, currentSlideNumber - 1);
        outCurrentSlide.set(currentSlideNumber);

        if (typeof webviewEl.sendInputEvent === "function")
        {
            try
            {
                webviewEl.sendInputEvent({
                    "type": "mouseWheel",
                    "x": midX,
                    "y": midY,
                    "deltaX": 0,
                    "deltaY": 120,
                    "canScroll": true
                });
            }
            catch (e) {}
        }

        if (typeof webviewEl.send === "function")
        {
            try { webviewEl.send("previous-slide"); } catch (e) {}
        }

        removeBgColor();
    }
}

inRender.onTriggered = () =>
{
    outNext.trigger();
    if (webviewEl && typeof webviewEl.send === "function")
    {
        try { webviewEl.send("request-frame"); } catch (e) {}
    }
    if (texture)
    {
        outTexture.setValue(texture);
        outTexture.setRef(texture);
    }
};

inNext.onTriggered = () => { navigate("next"); };
inPrev.onTriggered = () => { navigate("prev"); };

inTriggerRemoveBg.onTriggered = removeBgColor;
inBgColorToRemove.onChange = removeBgColor;

inUrl.onChange = () =>
{
    if (webviewEl)
    {
        const u = formatGoogleSlidesUrl(inUrl.get() || "");
        if (webviewEl.src !== u)
        {
            webviewEl.src = u;
        }
    }
};

inWidth.onChange = () =>
{
    const w = inWidth.get() || 1920;
    outWidth.set(w);
    if (webviewEl) webviewEl.style.width = w + "px";
};

inHeight.onChange = () =>
{
    const h = inHeight.get() || 1080;
    outHeight.set(h);
    if (webviewEl) webviewEl.style.height = h + "px";
};

inActive.onChange = () =>
{
    if (inActive.get())
    {
        if (!webviewEl) initWebview();
    }
    else
    {
        destroyWebview();
        outTexture.setValue(emptyTexture);
        outTexture.setRef(emptyTexture);
    }
};

op.onDelete = () =>
{
    destroyWebview();
    if (texture)
    {
        texture.dispose();
        texture = null;
    }
};

// Immediate initialization
outCurrentSlide.set(currentSlideNumber);
outWidth.set(inWidth.get() || 1920);
outHeight.set(inHeight.get() || 1080);

if (inActive.get())
{
    setTimeout(initWebview, 50);
}
