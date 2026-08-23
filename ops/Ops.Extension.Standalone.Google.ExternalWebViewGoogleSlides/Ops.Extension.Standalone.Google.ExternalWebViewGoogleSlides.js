// Ops.Extension.Standalone.Google.ExternalWebViewGoogleSlides.js

const
    inUrl = op.inString("Presentation URL", "https://docs.google.com/presentation/d/e/2PACX-1vRVpsaZJbgTiremeDpWaIW3M2gt0rmSj4bf_ymuH5panELG2cZcL1dwwaKhA6jNjIMozaUBBx1sZ5gQ/pub"),
    inBgColorToRemove = op.inString("Background Color to Remove", "#abcdef"),
    inTriggerRemoveBg = op.inTriggerButton("Remove Background Color"),
    inOpen = op.inTriggerButton("Open Window"),
    inClose = op.inTriggerButton("Close Window"),
    inNext = op.inTriggerButton("Next Slide"),
    inPrev = op.inTriggerButton("Previous Slide"),
    inChannelName = op.inString("Broadcast Channel Name", ""),
    inTitle = op.inString("Window Title", "External WebView Google Slides"),
    inTransparent = op.inBool("Transparent Window", true),
    inFrameless = op.inBool("Frameless Window", true),
    inAutoOpen = op.inBool("Auto Open", false),
    inWinWidth = op.inInt("Window Width", 1920),
    inWinHeight = op.inInt("Window Height", 1080),
    inWinX = op.inInt("Window X", 0),
    inWinY = op.inInt("Window Y", 0),

    outWinOpened = op.outTrigger("On Window Opened"),
    outWinClosed = op.outTrigger("On Window Closed"),
    outOnNext = op.outTrigger("On Next Received"),
    outOnPrev = op.outTrigger("On Previous Received"),
    outIsOpen = op.outBoolNum("Is Window Open", false),
    outCurrentSlide = op.outNumber("Current Slide", 1),
    outChannel = op.outString("Broadcast Channel", ""),
    outCurrentUrl = op.outString("Current URL", ""),
    outError = op.outString("Error", "");

op.setPortGroup("Presentation", [inUrl, inBgColorToRemove, inTriggerRemoveBg]);
op.setPortGroup("Window", [inOpen, inClose, inAutoOpen, inTitle, inTransparent, inFrameless, inWinWidth, inWinHeight, inWinX, inWinY]);
op.setPortGroup("Controls", [inNext, inPrev, inChannelName]);

let popupWin = null;
let broadcastChannel = null;
let windowCheckTimer = null;
let currentBlobUrl = null;
let currentSlideNumber = 1;

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

        let targetFile = "/Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Google.ExternalWebViewGoogleSlides/slides_preload.js";

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
        op.logWarn("[ExternalWebViewGoogleSlides] getPreloadPath error:", e);
    }
    return "";
}

function getActiveChannelName()
{
    const custom = (inChannelName.get() || "").trim();
    if (custom) return custom;
    return "cables_externalwebviewslides_" + op.id;
}

function initBroadcastChannel()
{
    const chName = getActiveChannelName();
    outChannel.set(chName);

    if (broadcastChannel && broadcastChannel.name === chName)
    {
        return;
    }

    if (broadcastChannel)
    {
        try { broadcastChannel.close(); } catch (e) {}
        broadcastChannel = null;
    }

    if (typeof BroadcastChannel !== "undefined")
    {
        broadcastChannel = new BroadcastChannel(chName);
        broadcastChannel.onmessage = (event) =>
        {
            const data = event.data;
            if (!data || typeof data !== "object") return;

            if (data.type === "READY")
            {
                sendToChannel({
                    "type": "SET_SLIDE",
                    "slide": currentSlideNumber
                });
                sendToChannel({
                    "type": "SET_URL",
                    "url": formatGoogleSlidesUrl(inUrl.get())
                });
                sendToChannel({
                    "type": "SET_REMOVE_COLOR",
                    "color": inBgColorToRemove.get() || "#abcdef"
                });
            }
            else if (data.type === "NEXT_RECEIVED")
            {
                if (typeof data.slide === "number")
                {
                    currentSlideNumber = data.slide;
                    outCurrentSlide.set(currentSlideNumber);
                }
                outOnNext.trigger();
            }
            else if (data.type === "PREV_RECEIVED")
            {
                if (typeof data.slide === "number")
                {
                    currentSlideNumber = data.slide;
                    outCurrentSlide.set(currentSlideNumber);
                }
                outOnPrev.trigger();
            }
            else if (data.type === "SLIDE_CHANGED")
            {
                if (typeof data.slide === "number")
                {
                    currentSlideNumber = data.slide;
                    outCurrentSlide.set(currentSlideNumber);
                }
            }
            else if (data.type === "CLOSED")
            {
                handleWindowClosed();
            }
        };
    }
}

function sendToChannel(payload)
{
    initBroadcastChannel();
    if (broadcastChannel)
    {
        try
        {
            broadcastChannel.postMessage(payload);
        }
        catch (e)
        {
            op.logWarn("[ExternalWebViewGoogleSlides] BroadcastChannel postMessage error:", e);
        }
    }
}

function generateWindowHtml(title, isTransparent, channelName, presentationUrl, preloadUrl, removeColor)
{
    const preloadAttribute = preloadUrl ? `preload="${preloadUrl}"` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title || "External WebView Google Slides"}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        html, body {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background: transparent !important;
            background-color: transparent !important;
            background-color: rgba(0, 0, 0, 0) !important;
            overflow: hidden;
            user-select: none;
        }

        /* Clean full-bleed Electron Webview */
        #slideWebview {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border: none;
            display: flex;
            background: transparent !important;
            background-color: transparent !important;
            background-color: rgba(0, 0, 0, 0) !important;
            z-index: 1;
        }
    </style>
</head>
<body>
    <webview id="slideWebview"
             src="${presentationUrl || ""}"
             ${preloadAttribute}
             webpreferences="contextIsolation=no"
             allowpopups>
    </webview>

    <script>
        (function() {
            var channelName = "${channelName}";
            var channel = new BroadcastChannel(channelName);
            var webview = document.getElementById("slideWebview");
            var currentSlide = 1;
            var targetRemoveColor = "${removeColor || "#abcdef"}";

            function removeBgColor(colorHex) {
                var c = colorHex || targetRemoveColor || "#abcdef";

                if (webview && typeof webview.insertCSS === "function") {
                    try {
                        webview.insertCSS(\`
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
                        \`);
                    } catch (e) {}
                }

                if (webview && typeof webview.send === "function") {
                    try { webview.send("set-remove-color", c); } catch (e) {}
                }
                if (webview && typeof webview.executeJavaScript === "function") {
                    try {
                        var cleanHex = c.trim().toLowerCase();
                        if (!cleanHex.startsWith("#")) cleanHex = "#" + cleanHex;
                        var noHash = cleanHex.replace("#", "");
                        webview.executeJavaScript(\`
                            (function() {
                                if (window.__cablesPreload) {
                                    window.__cablesPreload.setupTransparentStyles();
                                    window.__cablesPreload.setRemoveColor("\${c}");
                                }
                                var selectors = ['path[fill="\${cleanHex}" i]', 'rect[fill="\${cleanHex}" i]', 'path[fill*="\${noHash}" i]', 'rect[fill*="\${noHash}" i]'].join(",");
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
                        \`);
                    } catch (e) {}
                }
            }

            window.removeBgColor = removeBgColor;

            function navigate(direction, source) {
                var midX = Math.floor(window.innerWidth / 2) || 960;
                var midY = Math.floor(window.innerHeight / 2) || 540;

                if (direction === "next") {
                    currentSlide++;

                    // 1. Electron Native Mouse Wheel Scroll Down
                    if (webview && typeof webview.sendInputEvent === "function") {
                        try {
                            webview.sendInputEvent({
                                type: "mouseWheel",
                                x: midX,
                                y: midY,
                                deltaX: 0,
                                deltaY: -120, // Negative deltaY = scroll down in Chromium
                                canScroll: true
                            });
                        } catch(e) {}
                    }

                    // 2. Preload Script IPC Trigger
                    if (webview && typeof webview.send === "function") {
                        try { webview.send("next-slide"); } catch(e) {}
                    }

                    // 3. Guest DOM WheelEvent Simulation
                    if (webview && typeof webview.executeJavaScript === "function") {
                        try {
                            webview.executeJavaScript(\`
                                if (window.__cablesPreload && typeof window.__cablesPreload.scrollSim === 'function') {
                                    window.__cablesPreload.scrollSim(120);
                                } else {
                                    var ev = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
                                    var target = document.querySelector('.punch-viewer-content') || document.body;
                                    if (target) target.dispatchEvent(ev);
                                    document.dispatchEvent(ev);
                                }
                            \`);
                        } catch(e) {}
                    }

                    removeBgColor();
                    channel.postMessage({
                        type: "NEXT_RECEIVED",
                        slide: currentSlide,
                        source: source || "cables",
                        timestamp: Date.now()
                    });
                } else if (direction === "prev") {
                    currentSlide = Math.max(1, currentSlide - 1);

                    // 1. Electron Native Mouse Wheel Scroll Up
                    if (webview && typeof webview.sendInputEvent === "function") {
                        try {
                            webview.sendInputEvent({
                                type: "mouseWheel",
                                x: midX,
                                y: midY,
                                deltaX: 0,
                                deltaY: 120, // Positive deltaY = scroll up in Chromium
                                canScroll: true
                            });
                        } catch(e) {}
                    }

                    // 2. Preload Script IPC Trigger
                    if (webview && typeof webview.send === "function") {
                        try { webview.send("previous-slide"); } catch(e) {}
                    }

                    // 3. Guest DOM WheelEvent Simulation
                    if (webview && typeof webview.executeJavaScript === "function") {
                        try {
                            webview.executeJavaScript(\`
                                if (window.__cablesPreload && typeof window.__cablesPreload.scrollSim === 'function') {
                                    window.__cablesPreload.scrollSim(-120);
                                } else {
                                    var ev = new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true });
                                    var target = document.querySelector('.punch-viewer-content') || document.body;
                                    if (target) target.dispatchEvent(ev);
                                    document.dispatchEvent(ev);
                                }
                            \`);
                        } catch(e) {}
                    }

                    removeBgColor();
                    channel.postMessage({
                        type: "PREV_RECEIVED",
                        slide: currentSlide,
                        source: source || "cables",
                        timestamp: Date.now()
                    });
                }
            }

            if (webview) {
                webview.addEventListener("dom-ready", function() {
                    removeBgColor();
                });
                webview.addEventListener("did-finish-load", function() {
                    removeBgColor();
                });
                webview.addEventListener("ipc-message", function(event) {
                    if (event.channel === "preload-ready") {
                        removeBgColor();
                    }
                });
            }

            channel.onmessage = function(event) {
                var data = event.data;
                if (!data || typeof data !== "object") return;

                if (data.type === "NEXT" || data.type === "NEXT_SLIDE") {
                    navigate("next", data.source || "cables");
                } else if (data.type === "PREV" || data.type === "PREV_SLIDE") {
                    navigate("prev", data.source || "cables");
                } else if (data.type === "SET_REMOVE_COLOR") {
                    targetRemoveColor = data.color || "#abcdef";
                    removeBgColor(targetRemoveColor);
                } else if (data.type === "SET_SLIDE") {
                    if (typeof data.slide === "number") {
                        currentSlide = data.slide;
                    }
                } else if (data.type === "SET_URL") {
                    if (data.url && webview && webview.src !== data.url) {
                        webview.src = data.url;
                    }
                } else if (data.type === "CLOSE") {
                    window.close();
                }
            };

            window.addEventListener("keydown", function(e) {
                if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.keyCode === 39 || e.keyCode === 34 || e.keyCode === 32) {
                    e.preventDefault();
                    navigate("next", "keyboard");
                } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.keyCode === 37 || e.keyCode === 33) {
                    e.preventDefault();
                    navigate("prev", "keyboard");
                }
            });

            var bgInterval = setInterval(function() {
                removeBgColor();
            }, 300);

            window.addEventListener("beforeunload", function() {
                if (bgInterval) clearInterval(bgInterval);
                channel.postMessage({ type: "CLOSED" });
            });

            channel.postMessage({ type: "READY", timestamp: Date.now() });
        })();
    </script>
</body>
</html>`;
}

function handleWindowClosed()
{
    if (windowCheckTimer)
    {
        clearInterval(windowCheckTimer);
        windowCheckTimer = null;
    }
    popupWin = null;
    outIsOpen.set(false);
    outWinClosed.trigger();
}

function openWindow()
{
    if (typeof window === "undefined") return;

    if (typeof gui !== "undefined" && gui.userSettings && typeof gui.userSettings.set === "function")
    {
        gui.userSettings.set("transparentpopout", true);
    }

    initBroadcastChannel();

    const rawUrl = inUrl.get() || "";
    const presentationUrl = formatGoogleSlidesUrl(rawUrl);
    outCurrentUrl.set(presentationUrl);

    if (popupWin && !popupWin.closed)
    {
        popupWin.focus();
        sendToChannel({
            "type": "SET_URL",
            "url": presentationUrl
        });
        sendToChannel({
            "type": "SET_REMOVE_COLOR",
            "color": inBgColorToRemove.get() || "#abcdef"
        });
        return;
    }

    const w = inWinWidth.get() || 1920;
    const h = inWinHeight.get() || 1080;
    const x = inWinX.get() ?? 0;
    const y = inWinY.get() ?? 0;
    const isTransparent = inTransparent.get();
    const isFrameless = inFrameless.get();
    const title = inTitle.get() || "External WebView Google Slides";
    const chName = getActiveChannelName();
    const preloadUrl = getPreloadPath();
    const removeColor = inBgColorToRemove.get() || "#abcdef";

    const htmlContent = generateWindowHtml(title, isTransparent, chName, presentationUrl, preloadUrl, removeColor);

    if (currentBlobUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function")
    {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
    }

    let targetHref = "about:blank";
    if (typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function")
    {
        const blob = new Blob([htmlContent], { "type": "text/html;charset=utf-8" });
        currentBlobUrl = URL.createObjectURL(blob);
        targetHref = currentBlobUrl;
    }
    else
    {
        targetHref = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    }

    let windowFeatures = `width=${w},height=${h},left=${x},top=${y},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no,popup=true`;
    let windowName = "cables_externalwebviewslides_win_" + op.id;

    if (isTransparent || isFrameless)
    {
        windowName = "view#transparent#externalwebviewslides_" + op.id;
        windowFeatures += ",transparent=yes,frame=no,hasShadow=no";
    }

    popupWin = window.open(targetHref, windowName, windowFeatures);

    if (popupWin)
    {
        outIsOpen.set(true);
        outWinOpened.trigger();
        outError.set("");

        if (windowCheckTimer) clearInterval(windowCheckTimer);
        windowCheckTimer = setInterval(() =>
        {
            if (popupWin && popupWin.closed)
            {
                handleWindowClosed();
            }
        }, 300);
    }
    else
    {
        const err = "Pop-up window was blocked by the browser. Please allow pop-ups for Cables.";
        op.logError("[ExternalWebViewGoogleSlides]", err);
        outError.set(err);
    }
}

function closeWindow()
{
    sendToChannel({ "type": "CLOSE" });
    if (popupWin && !popupWin.closed)
    {
        try
        {
            popupWin.close();
        }
        catch (e) {}
    }
    handleWindowClosed();
}

function resizeWindow()
{
    if (popupWin && !popupWin.closed)
    {
        try
        {
            popupWin.resizeTo(inWinWidth.get() || 1920, inWinHeight.get() || 1080);
        }
        catch (e) {}
    }
}

function moveWindow()
{
    if (popupWin && !popupWin.closed)
    {
        try
        {
            popupWin.moveTo(inWinX.get() ?? 0, inWinY.get() ?? 0);
        }
        catch (e) {}
    }
}

inOpen.onTriggered = openWindow;
inClose.onTriggered = closeWindow;

inTriggerRemoveBg.onTriggered = () =>
{
    sendToChannel({
        "type": "SET_REMOVE_COLOR",
        "color": inBgColorToRemove.get() || "#abcdef"
    });
};

inBgColorToRemove.onChange = () =>
{
    sendToChannel({
        "type": "SET_REMOVE_COLOR",
        "color": inBgColorToRemove.get() || "#abcdef"
    });
};

inUrl.onChange = () =>
{
    const rawUrl = inUrl.get() || "";
    const presentationUrl = formatGoogleSlidesUrl(rawUrl);
    outCurrentUrl.set(presentationUrl);
    sendToChannel({
        "type": "SET_URL",
        "url": presentationUrl
    });
};

inNext.onTriggered = () =>
{
    sendToChannel({
        "type": "NEXT",
        "source": "cables",
        "timestamp": Date.now()
    });
};

inPrev.onTriggered = () =>
{
    sendToChannel({
        "type": "PREV",
        "source": "cables",
        "timestamp": Date.now()
    });
};

inChannelName.onChange = () =>
{
    initBroadcastChannel();
};

inWinWidth.onChange = resizeWindow;
inWinHeight.onChange = resizeWindow;
inWinX.onChange = moveWindow;
inWinY.onChange = moveWindow;

op.onDelete = () =>
{
    closeWindow();
    if (broadcastChannel)
    {
        try { broadcastChannel.close(); } catch (e) {}
        broadcastChannel = null;
    }
    if (currentBlobUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function")
    {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
    }
};

op.init = () =>
{
    initBroadcastChannel();
    outCurrentSlide.set(currentSlideNumber);
    outCurrentUrl.set(formatGoogleSlidesUrl(inUrl.get() || ""));
    if (inAutoOpen.get())
    {
        setTimeout(openWindow, 200);
    }
};
