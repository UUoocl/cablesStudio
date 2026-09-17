// Ops.Extension.Standalone.Electron.WebView.js

const
    inRender = op.inTrigger("Render"),
    inSend = op.inTriggerButton("Send"),
    inMessage = op.inObject("Message In"),
    inUrl = op.inString("URL", "https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub"),
    inPreload = op.inString("Preload File", "slides_preload.js"),
    inShowElement = op.inBool("Show Element", false),
    inActive = op.inBool("Active", true),
    inWidth = op.inInt("Texture Width", 1920),
    inHeight = op.inInt("Texture Height", 1080),
    inFlipY = op.inBool("Flip Y", true),

    outNext = op.outTrigger("Next"),
    outTexture = op.outTexture("Texture"),
    outOnMessage = op.outTrigger("On Message"),
    outMessage = op.outObject("Message Out"),
    outIsLoaded = op.outBoolNum("Is Loaded", false),
    outCurrentSlide = op.outNumber("Current Slide", 1),
    outWidth = op.outNumber("Width", 1920),
    outHeight = op.outNumber("Height", 1080),
    outError = op.outString("Error", "");

op.setPortGroup("Messaging", [inSend, inMessage]);
op.setPortGroup("Configuration", [inUrl, inPreload]);
op.setPortGroup("Display", [inShowElement]);
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
let messageChannel = null;
let initTimeout = null;

function sanitizeUrl(rawUrl)
{
    if (!rawUrl || typeof rawUrl !== "string") return "";
    let str = rawUrl.trim();
    if (!str) return "";

    if (str.startsWith("ttps://")) str = "h" + str;
    else if (str.startsWith("ttp://")) str = "h" + str;
    else if (str.startsWith("//")) str = "https:" + str;
    else if (!str.startsWith("http://") && !str.startsWith("https://") && !str.startsWith("file://") && !str.startsWith("about:") && !str.startsWith("data:"))
    {
        str = "https://" + str;
    }

    return str;
}

function formatUrl(rawUrl)
{
    const sanitized = sanitizeUrl(rawUrl);
    if (!sanitized) return "";
    let formatted = sanitized;
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
    const rawPath = (inPreload.get() || "slides_preload.js").trim();
    if (!rawPath) return "";

    try
    {
        const url = op.require("url") || (typeof require !== "undefined" ? require("url") : null);
        const path = op.require("path") || (typeof require !== "undefined" ? require("path") : null);
        const fs = op.require("fs") || (typeof require !== "undefined" ? require("fs") : null);
        const pathToFileURL = url ? url.pathToFileURL : null;

        const cleanPath = rawPath.replace(/^file:\/\//, "");
        const opName = op.objName || "Ops.Extension.Standalone.Electron.WebView";

        // Cables paths from patch config
        const paths = (op.patch && op.patch.config && op.patch.config.paths) || {};
        const patchPath = paths.patchPath || (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";

        if (path && patchPath)
        {
            const opsDir = path.join(patchPath, "ops");
            const candidates = [
                path.join(opsDir, opName, cleanPath),
                path.join(opsDir, cleanPath),
                path.join(opsDir, "Ops.Extension.Standalone.Electron.WebView", cleanPath)
            ];

            let targetFile = null;
            if (fs)
            {
                for (let i = 0; i < candidates.length; i++)
                {
                    if (fs.existsSync(candidates[i]))
                    {
                        targetFile = candidates[i];
                        break;
                    }
                }
            }
            else
            {
                targetFile = candidates[0];
            }

            if (targetFile)
            {
                targetFile = path.resolve(targetFile);
                if (pathToFileURL)
                {
                    return pathToFileURL(targetFile).href;
                }
                return "file://" + targetFile;
            }
        }
    }
    catch (e)
    {
        op.logWarn("[WebView] getPreloadPath error:", e);
    }
    return "";
}

function sendPreloadMessage(type, payload)
{
    if (messageChannel && messageChannel.port1)
    {
        try
        {
            if (typeof payload === "object" && payload !== null)
            {
                messageChannel.port1.postMessage(Object.assign({ "type": type }, payload));
            }
            else
            {
                messageChannel.port1.postMessage({ "type": type, "payload": payload, "color": payload });
            }
        }
        catch (e) {}
    }
    if (webviewEl && typeof webviewEl.send === "function")
    {
        try { webviewEl.send(type, payload); } catch (e) {}
    }
}

function navigate(direction)
{
    if (!webviewEl) return;
    const midX = Math.floor((inWidth.get() || 1920) / 2);
    const midY = Math.floor((inHeight.get() || 1080) / 2);
    const isNext = (direction === "next");

    if (isNext)
    {
        currentSlideNumber++;
        outCurrentSlide.set(currentSlideNumber);
        sendPreloadMessage("next-slide", { "direction": "next", "slide": currentSlideNumber });
    }
    else
    {
        currentSlideNumber = Math.max(1, currentSlideNumber - 1);
        outCurrentSlide.set(currentSlideNumber);
        sendPreloadMessage("previous-slide", { "direction": "prev", "slide": currentSlideNumber });
    }

    if (typeof webviewEl.sendInputEvent === "function")
    {
        try
        {
            webviewEl.sendInputEvent({
                "type": "mouseWheel",
                "x": midX,
                "y": midY,
                "deltaX": 0,
                "deltaY": isNext ? -120 : 120,
                "canScroll": true
            });
        }
        catch (e) {}
    }
}

function handleOutboundMessage(msg)
{
    if (!msg) return;
    if (typeof msg === "string")
    {
        msg = { "type": msg };
    }

    const type = msg.type || msg.action || msg.cmd || "";

    if (type === "next-slide" || type === "next")
    {
        navigate("next");
    }
    else if (type === "previous-slide" || type === "prev")
    {
        navigate("prev");
    }
    else if (type === "set-remove-color" || type === "remove-bg-color")
    {
        const color = msg.color || msg.payload || (typeof msg === "string" ? msg : "#abcdef");
        sendPreloadMessage("set-remove-color", color);
    }
    else if (type === "set-slide" && typeof msg.slide === "number")
    {
        currentSlideNumber = Math.max(1, msg.slide);
        outCurrentSlide.set(currentSlideNumber);
        sendPreloadMessage("set-slide", { "slide": currentSlideNumber });
    }
    else if ((type === "load-url" || type === "set-url" || type === "navigate") && (msg.url || msg.payload))
    {
        const u = msg.url || msg.payload;
        if (typeof u === "string" && u.trim())
        {
            inUrl.set(u.trim());
        }
    }
    else if (type === "request-frame")
    {
        sendPreloadMessage("request-frame");
    }
    else
    {
        sendPreloadMessage(type || "custom-message", msg);
    }
}

function handleInboundMessage(data)
{
    if (!data) return;

    if (typeof data.slide === "number" || typeof data.currentSlide === "number")
    {
        const s = data.slide || data.currentSlide;
        currentSlideNumber = s;
        outCurrentSlide.set(currentSlideNumber);
    }

    outMessage.setValue(data);
    outOnMessage.trigger();
}

function handleImageBitmapFrame(bitmap, w, h)
{
    if (!bitmap) return;
    if (!inActive.get())
    {
        if (typeof bitmap.close === "function") bitmap.close();
        return;
    }

    w = w || bitmap.width || inWidth.get() || 1920;
    h = h || bitmap.height || inHeight.get() || 1080;
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
        const gl = cgl.gl;
        if (!gl || gl.isContextLost())
        {
            if (typeof bitmap.close === "function") bitmap.close();
            return;
        }

        gl.bindTexture(gl.TEXTURE_2D, texture.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        // Zero-copy direct GPU upload of ImageBitmap into WebGL Texture
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            bitmap
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
        op.logWarn("[WebView] WebGL ImageBitmap upload error:", err);
    }
    finally
    {
        if (typeof bitmap.close === "function")
        {
            bitmap.close();
        }
    }
}

function handleHtmlInCanvasFrame(data)
{
    if (!data || !data.buffer) return;
    if (!inActive.get()) return;

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
        if (!gl || gl.isContextLost()) return;

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
        op.logWarn("[WebView] WebGL texture upload error:", err);
    }
}

function setupMessagePort()
{
    if (!webviewEl) return;
    if (messageChannel) return;

    try
    {
        messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) =>
        {
            const data = event.data;
            if (!data) return;
            if (data.type === "html-in-canvas-bitmap" && data.bitmap)
            {
                handleImageBitmapFrame(data.bitmap, data.width, data.height);
            }
            else if (data.type === "html-in-canvas-frame" && data.buffer)
            {
                handleHtmlInCanvasFrame(data);
            }
            else
            {
                handleInboundMessage(data);
            }
        };

        const portToSend = messageChannel.port2;

        const sendPort = () =>
        {
            try
            {
                if (webviewEl && typeof webviewEl.postMessage === "function")
                {
                    webviewEl.postMessage({ "type": "cables-init-port" }, "*", [portToSend]);
                    return true;
                }
                else if (webviewEl && webviewEl.contentWindow && typeof webviewEl.contentWindow.postMessage === "function")
                {
                    webviewEl.contentWindow.postMessage({ "type": "cables-init-port" }, "*", [portToSend]);
                    return true;
                }
            }
            catch (e) {}
            return false;
        };

        if (!sendPort())
        {
            setTimeout(sendPort, 80);
            setTimeout(sendPort, 300);
        }
    }
    catch (e)
    {
        op.logWarn("[WebView] MessagePort initialization error:", e);
    }
}

function createWebviewElement()
{
    // In Electron, the editor UI runs inside an iframe. The top-level window document has the webview tag registered.
    if (typeof window !== "undefined" && window.parent && window.parent !== window && window.parent.document && typeof window.parent.document.createElement === "function")
    {
        try
        {
            return window.parent.document.createElement("webview");
        }
        catch (e) {}
    }
    if (typeof document !== "undefined" && typeof document.createElement === "function")
    {
        return document.createElement("webview");
    }
    return null;
}

function updateWebviewVisibility()
{
    if (!webviewEl) return;
    const show = !!inShowElement.get();
    const w = inWidth.get() || 1920;
    const h = inHeight.get() || 1080;

    webviewEl.style.position = "fixed";
    webviewEl.style.width = w + "px";
    webviewEl.style.height = h + "px";
    webviewEl.style.display = "flex";
    webviewEl.style.opacity = "1";

    if (show)
    {
        webviewEl.style.left = "40px";
        webviewEl.style.top = "40px";
        webviewEl.style.zIndex = "2147483647";
        webviewEl.style.pointerEvents = "auto";
        webviewEl.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.85)";
        webviewEl.style.border = "2px solid #00E5FF";
        webviewEl.style.borderRadius = "8px";
    }
    else
    {
        webviewEl.style.left = "0px";
        webviewEl.style.top = "0px";
        webviewEl.style.zIndex = "-999999";
        webviewEl.style.pointerEvents = "none";
        webviewEl.style.boxShadow = "none";
        webviewEl.style.border = "none";
        webviewEl.style.borderRadius = "0px";
    }
}

function initWebview()
{
    if (typeof document === "undefined" || !document.body)
    {
        requestInitWebview();
        return;
    }

    destroyWebview();

    const w = inWidth.get() || 1920;
    const h = inHeight.get() || 1080;
    const rawUrl = inUrl.get() || "";
    const url = formatUrl(rawUrl);
    const preloadUrl = getPreloadPath();

    op.log("[WebView] Initializing HTML-in-Canvas webview. URL: " + url + (preloadUrl ? (" | Preload: " + preloadUrl) : ""));

    webviewEl = createWebviewElement();
    if (!webviewEl)
    {
        const err = "Webview element could not be created in this environment.";
        op.logWarn("[WebView]", err);
        outError.set(err);
        return;
    }
    webviewEl.id = "cables_webview_offscreen_" + op.id;

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
    webviewEl.style.background = "transparent";
    updateWebviewVisibility();

    const targetDoc = webviewEl.ownerDocument || document;
    if (targetDoc && targetDoc.body)
    {
        targetDoc.body.appendChild(webviewEl);
    }
    else
    {
        document.body.appendChild(webviewEl);
    }
    webviewEl.src = url;

    webviewEl.addEventListener("dom-ready", () =>
    {
        op.log("[WebView] Webview DOM ready.");
        isDomReady = true;
        outIsLoaded.set(true);
        outError.set("");
        setupMessagePort();
    });

    webviewEl.addEventListener("did-finish-load", () =>
    {
        op.log("[WebView] Webview finished load.");
        setupMessagePort();
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
            op.log("[WebView] Preload script ready in guest view.");
            setupMessagePort();
        }
        else if (event.channel === "preload-message")
        {
            const data = event.args ? event.args[0] : null;
            if (data)
            {
                handleInboundMessage(data);
            }
        }
    });

    webviewEl.addEventListener("console-message", (e) =>
    {
        op.log("[WebView Guest] " + e.message);
    });

    webviewEl.addEventListener("did-fail-load", (e) =>
    {
        if (e.errorCode !== -3)
        {
            const err = "Webview failed to load: " + (e.errorDescription || e.errorCode);
            op.logWarn("[WebView]", err);
            outError.set(err);
        }
    });
}

function destroyWebview()
{
    isDomReady = false;
    outIsLoaded.set(false);

    if (messageChannel)
    {
        try { messageChannel.port1.postMessage({ "type": "stop" }); } catch (e) {}
        try { messageChannel.port1.close(); } catch (e) {}
        try { messageChannel.port2.close(); } catch (e) {}
        messageChannel = null;
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

function requestInitWebview()
{
    if (initTimeout) clearTimeout(initTimeout);
    initTimeout = setTimeout(() =>
    {
        initTimeout = null;
        if (inActive.get())
        {
            initWebview();
        }
    }, 50);
}

inSend.onTriggered = () =>
{
    const msg = inMessage.get();
    if (msg)
    {
        handleOutboundMessage(msg);
    }
};

inRender.onTriggered = () =>
{
    outNext.trigger();
    if (!inActive.get())
    {
        outTexture.setValue(emptyTexture);
        outTexture.setRef(emptyTexture);
        return;
    }
    if (messageChannel && messageChannel.port1)
    {
        try { messageChannel.port1.postMessage({ "type": "request-frame" }); } catch (e) {}
    }
    if (webviewEl && typeof webviewEl.send === "function")
    {
        try { webviewEl.send("request-frame"); } catch (e) {}
    }
    if (texture)
    {
        outTexture.setValue(texture);
        outTexture.setRef(texture);
    }
    else
    {
        outTexture.setValue(emptyTexture);
        outTexture.setRef(emptyTexture);
    }
};

inPreload.onChange = requestInitWebview;
inShowElement.onChange = updateWebviewVisibility;

inUrl.onChange = () =>
{
    if (webviewEl)
    {
        const u = formatUrl(inUrl.get() || "");
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
        if (!webviewEl) requestInitWebview();
    }
    else
    {
        destroyWebview();
        if (texture)
        {
            texture.dispose();
            texture = null;
        }
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
    requestInitWebview();
}
