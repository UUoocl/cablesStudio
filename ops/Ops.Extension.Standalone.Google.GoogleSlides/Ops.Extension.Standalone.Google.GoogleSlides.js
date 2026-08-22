// Ops.Extension.Standalone.Google.GoogleSlides.js

const
    inRender = op.inTrigger("Render"),
    inUrl = op.inString("Presentation URL", "https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub"),
    inBgColorToRemove = op.inString("Background Color to Remove", "#abcdef"),
    inTriggerRemoveBg = op.inTriggerButton("Remove Background Color"),
    inNext = op.inTriggerButton("Next Slide"),
    inPrev = op.inTriggerButton("Previous Slide"),
    inActive = op.inBool("Active", true),
    inContinuous = op.inBool("Continuous Capture", true),
    inFps = op.inInt("Capture FPS", 30),
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
op.setPortGroup("Capture Settings", [inActive, inContinuous, inFps, inFlipY]);
op.setPortGroup("Resolution", [inWidth, inHeight]);

const cgl = op.patch.cgl;
let texture = null;
const emptyTexture = CGL.Texture.getEmptyTexture(cgl);
outTexture.setValue(emptyTexture);
outTexture.setRef(emptyTexture);

let webviewEl = null;
let isCapturing = false;
let captureTimer = null;
let lastCaptureTime = 0;
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

        let targetFile = "/Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Google.GoogleSlides/slides_preload.js";

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
        op.logWarn("[GoogleSlides] getPreloadPath error:", e);
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

    if (typeof webviewEl.executeJavaScript === "function")
    {
        try
        {
            const cleanHex = c.toLowerCase().startsWith("#") ? c.toLowerCase() : "#" + c.toLowerCase();
            const noHash = cleanHex.replace("#", "");
            webviewEl.executeJavaScript(`
                (function() {
                    if (window.__cablesPreload) {
                        window.__cablesPreload.setupTransparentStyles();
                        window.__cablesPreload.setRemoveColor("${c}");
                    }
                    var selectors = ['path[fill="${cleanHex}" i]', 'rect[fill="${cleanHex}" i]', 'path[fill*="${noHash}" i]', 'rect[fill*="${noHash}" i]'].join(",");
                    var elems = document.querySelectorAll(selectors);
                    for (var i = 0; i < elems.length; i++) {
                        var el = elems[i];
                        if (el.previousElementSibling && (el.previousElementSibling.tagName === 'path' || el.previousElementSibling.tagName === 'rect')) {
                            el.previousElementSibling.style.display = 'none';
                        }
                        el.style.display = 'none';
                    }

                    var darks = document.querySelectorAll('rect[fill="#000000" i], rect[fill="#000" i], rect[fill="black" i], rect[fill="#111111" i], rect[fill="#222222" i]');
                    for (var j = 0; j < darks.length; j++) {
                        var dEl = darks[j];
                        var w = dEl.getAttribute("width") || "";
                        var h = dEl.getAttribute("height") || "";
                        if (w === "100%" || w === "960" || w === "1920" || (parseFloat(w) > 500 && parseFloat(h) > 300)) {
                            dEl.style.display = "none";
                        }
                    }
                })();
            `);
        }
        catch (e) {}
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

    op.log("[GoogleSlides] Initializing webview in editor. Target URL: " + url);

    webviewEl = document.createElement("webview");
    webviewEl.id = "cables_googleslides_offscreen_" + op.id;

    if (preloadUrl)
    {
        webviewEl.setAttribute("preload", preloadUrl);
    }
    webviewEl.setAttribute("webpreferences", "contextIsolation=no");
    webviewEl.setAttribute("allowpopups", "");

    // Position behind Cables canvas with full opacity so Chromium paints 60fps frames continuously
    webviewEl.style.position = "fixed";
    webviewEl.style.left = "0px";
    webviewEl.style.top = "0px";
    webviewEl.style.width = w + "px";
    webviewEl.style.height = h + "px";
    webviewEl.style.opacity = "1";
    webviewEl.style.pointerEvents = "none";
    webviewEl.style.zIndex = "-999999";
    webviewEl.style.background = "transparent";

    // Append to DOM before setting src
    document.body.appendChild(webviewEl);
    webviewEl.src = url;

    webviewEl.addEventListener("dom-ready", () =>
    {
        op.log("[GoogleSlides] Webview DOM ready.");
        isDomReady = true;
        outIsLoaded.set(true);
        outError.set("");
        removeBgColor();
        captureFrame();
    });

    webviewEl.addEventListener("did-finish-load", () =>
    {
        op.log("[GoogleSlides] Webview finished load.");
        removeBgColor();
        captureFrame();
    });

    webviewEl.addEventListener("ipc-message", (event) =>
    {
        if (event.channel === "preload-ready")
        {
            op.log("[GoogleSlides] Preload script ready in guest view.");
            removeBgColor();
            captureFrame();
        }
    });

    webviewEl.addEventListener("console-message", (e) =>
    {
        op.log("[GoogleSlides Guest] " + e.message);
    });

    webviewEl.addEventListener("did-fail-load", (e) =>
    {
        if (e.errorCode !== -3)
        {
            const err = "Webview failed to load: " + (e.errorDescription || e.errorCode);
            op.logWarn("[GoogleSlides]", err);
            outError.set(err);
        }
    });
}

function destroyWebview()
{
    isDomReady = false;
    outIsLoaded.set(false);

    if (captureTimer)
    {
        clearTimeout(captureTimer);
        captureTimer = null;
    }

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

function updateTextureFromImage(nativeImage)
{
    if (!nativeImage || nativeImage.isEmpty()) return;

    const w = inWidth.get() || 1920;
    const h = inHeight.get() || 1080;
    const flipY = inFlipY.get();

    if (w <= 0 || h <= 0) return;

    if (!texture)
    {
        texture = new CGL.Texture(cgl, {
            "width": w,
            "height": h,
            "filter": CGL.Texture.FILTER_LINEAR,
            "wrap": CGL.Texture.WRAP_CLAMP_TO_EDGE
        });
    }

    if (texture.width !== w || texture.height !== h)
    {
        texture.setSize(w, h);
    }

    outWidth.set(w);
    outHeight.set(h);

    try
    {
        const size = nativeImage.getSize();
        const imgW = size.width || w;
        const imgH = size.height || h;
        const bitmapBuf = nativeImage.toBitmap();

        if (bitmapBuf && bitmapBuf.length > 0)
        {
            const gl = cgl.gl;
            gl.bindTexture(gl.TEXTURE_2D, texture.tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

            // Convert BGRA (Electron NativeImage bitmap format) to RGBA in Uint8Array
            const pixels = new Uint8Array(bitmapBuf.buffer, bitmapBuf.byteOffset, bitmapBuf.byteLength);
            for (let i = 0; i < pixels.length; i += 4)
            {
                const b = pixels[i];
                pixels[i] = pixels[i + 2];
                pixels[i + 2] = b;
            }

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                imgW,
                imgH,
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
            outError.set("");
        }
    }
    catch (err)
    {
        op.logWarn("[GoogleSlides] updateTextureFromImage error:", err);
    }
}

function captureFrame()
{
    if (!inActive.get() || !webviewEl || isCapturing) return;

    if (typeof webviewEl.capturePage !== "function")
    {
        return;
    }

    isCapturing = true;

    webviewEl.capturePage()
        .then((image) =>
        {
            isCapturing = false;
            if (image && !image.isEmpty())
            {
                updateTextureFromImage(image);
            }
            lastCaptureTime = performance.now();
            scheduleCapture();
        })
        .catch((err) =>
        {
            isCapturing = false;
            scheduleCapture();
        });
}

function scheduleCapture()
{
    if (!inActive.get() || !inContinuous.get()) return;

    if (captureTimer)
    {
        clearTimeout(captureTimer);
        captureTimer = null;
    }

    const targetFps = Math.max(1, Math.min(60, inFps.get() || 30));
    const targetInterval = 1000 / targetFps;
    const elapsed = performance.now() - lastCaptureTime;
    const delay = Math.max(0, targetInterval - elapsed);

    captureTimer = setTimeout(() =>
    {
        captureFrame();
    }, delay);
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

        // 1. Electron Native Mouse Wheel Scroll Down
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

        // 2. Preload IPC
        if (typeof webviewEl.send === "function")
        {
            try { webviewEl.send("next-slide"); } catch (e) {}
        }

        // 3. Guest DOM WheelEvent
        if (typeof webviewEl.executeJavaScript === "function")
        {
            try
            {
                webviewEl.executeJavaScript(`
                    if (window.__cablesPreload && typeof window.__cablesPreload.scrollSim === 'function') {
                        window.__cablesPreload.scrollSim(120);
                    } else {
                        var ev = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
                        var target = document.querySelector('.punch-viewer-content') || document.body;
                        if (target) target.dispatchEvent(ev);
                        document.dispatchEvent(ev);
                    }
                `);
            }
            catch (e) {}
        }

        removeBgColor();
        setTimeout(captureFrame, 80);
    }
    else if (direction === "prev")
    {
        currentSlideNumber = Math.max(1, currentSlideNumber - 1);
        outCurrentSlide.set(currentSlideNumber);

        // 1. Electron Native Mouse Wheel Scroll Up
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

        // 2. Preload IPC
        if (typeof webviewEl.send === "function")
        {
            try { webviewEl.send("previous-slide"); } catch (e) {}
        }

        // 3. Guest DOM WheelEvent
        if (typeof webviewEl.executeJavaScript === "function")
        {
            try
            {
                webviewEl.executeJavaScript(`
                    if (window.__cablesPreload && typeof window.__cablesPreload.scrollSim === 'function') {
                        window.__cablesPreload.scrollSim(-120);
                    } else {
                        var ev = new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true });
                        var target = document.querySelector('.punch-viewer-content') || document.body;
                        if (target) target.dispatchEvent(ev);
                        document.dispatchEvent(ev);
                    }
                `);
            }
            catch (e) {}
        }

        removeBgColor();
        setTimeout(captureFrame, 80);
    }
}

inRender.onTriggered = () =>
{
    outNext.trigger();
    if (texture)
    {
        outTexture.setValue(texture);
        outTexture.setRef(texture);
    }
    if (!inContinuous.get())
    {
        captureFrame();
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
    if (webviewEl)
    {
        webviewEl.style.width = w + "px";
    }
};

inHeight.onChange = () =>
{
    const h = inHeight.get() || 1080;
    outHeight.set(h);
    if (webviewEl)
    {
        webviewEl.style.height = h + "px";
    }
};

inActive.onChange = () =>
{
    if (inActive.get())
    {
        if (!webviewEl)
        {
            initWebview();
        }
        scheduleCapture();
    }
    else
    {
        destroyWebview();
        outTexture.setValue(emptyTexture);
        outTexture.setRef(emptyTexture);
    }
};

inContinuous.onChange = () =>
{
    if (inContinuous.get())
    {
        scheduleCapture();
    }
};

inFps.onChange = () =>
{
    if (inContinuous.get())
    {
        scheduleCapture();
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
