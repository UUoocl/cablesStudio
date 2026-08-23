// slides_preload.js - HTML-in-Canvas GPU Rasterizer Preload for WebViewGoogleSlides

(function() {
    let targetBgColorToRemove = "#abcdef";
    let canvasEl = null;
    let glCtx = null;
    let glTex = null;
    let glFbo = null;
    let isSupported = false;
    let isTransferring = false;
    let isCapturing = false;
    let pixelBuffer = null;

    let ipcRenderer = null;
    try {
        const electron = require("electron");
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {}

    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScriptURL: string => string,
                createScript: string => string
            });
        } catch (e) {}
    }

    function scrollSim(deltaY) {
        try {
            const target = document.querySelector('.punch-viewer-content') ||
                           document.querySelector('.punch-viewer-page-wrapper-container') ||
                           document.querySelector('.punch-viewer-page-wrapper') ||
                           document.body ||
                           document.documentElement;

            const x = Math.floor(window.innerWidth / 2);
            const y = Math.floor(window.innerHeight / 2);

            const ev = new WheelEvent('wheel', {
                deltaX: 0,
                deltaY: deltaY,
                deltaZ: 0,
                deltaMode: 0,
                clientX: x,
                clientY: y,
                screenX: x,
                screenY: y,
                bubbles: true,
                cancelable: true
            });

            if (target) {
                target.dispatchEvent(ev);
            }
            document.dispatchEvent(ev);
            window.dispatchEvent(ev);

            deleteBG();
            renderAndSendFrame();
        } catch (e) {
            console.error("[Preload] scrollSim error:", e);
        }
    }

    function setupTransparentStyles() {
        try {
            let style = document.getElementById("cables_transparent_bg_style");
            if (!style) {
                style = document.createElement("style");
                style.id = "cables_transparent_bg_style";
                (document.head || document.documentElement || document.body).appendChild(style);
            }

            style.innerHTML = `
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

                /* Hide bottom control bar so slide fills 100% height */
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
                    pointer-events: none !important;
                }
            `;

            if (document.body) {
                document.body.style.backgroundColor = "transparent";
            }
        } catch (e) {}
    }

    function deleteBG(colorHex) {
        const hex = (colorHex || targetBgColorToRemove || "#abcdef").trim().toLowerCase();

        if (hex) {
            const cleanHex = hex.startsWith("#") ? hex : "#" + hex;
            const noHashHex = cleanHex.replace("#", "");

            const selectors = [
                `path[fill="${cleanHex}" i]`,
                `rect[fill="${cleanHex}" i]`,
                `path[fill*="${noHashHex}" i]`,
                `rect[fill*="${noHashHex}" i]`
            ].join(",");

            try {
                const elems = document.querySelectorAll(selectors);
                for (let i = 0; i < elems.length; i++) {
                    const el = elems[i];
                    if (el.previousElementSibling && (el.previousElementSibling.tagName === "path" || el.previousElementSibling.tagName === "rect")) {
                        el.previousElementSibling.style.display = "none";
                    }
                    el.style.display = "none";
                    el.setAttribute("fill", "none");
                }
            } catch (e) {}
        }

        try {
            const darkBackdrops = document.querySelectorAll('rect[fill="#000000" i], rect[fill="#000" i], rect[fill="black" i], rect[fill="#111111" i], rect[fill="#222222" i]');
            for (let i = 0; i < darkBackdrops.length; i++) {
                const el = darkBackdrops[i];
                const w = el.getAttribute("width") || "";
                const h = el.getAttribute("height") || "";
                if (w === "100%" || w === "960" || w === "1920" || (parseFloat(w) > 500 && parseFloat(h) > 300)) {
                    el.style.display = "none";
                    el.setAttribute("fill", "none");
                }
            }
        } catch (e) {}
    }

    function initHTMLInCanvas() {
        if (canvasEl) return;

        try {
            canvasEl = document.createElement("canvas");
            canvasEl.id = "cables_html_in_canvas";
            canvasEl.width = 1920;
            canvasEl.height = 1080;
            canvasEl.setAttribute("layoutsubtree", "");

            canvasEl.style.position = "fixed";
            canvasEl.style.left = "0px";
            canvasEl.style.top = "0px";
            canvasEl.style.width = "100vw";
            canvasEl.style.height = "100vh";
            canvasEl.style.pointerEvents = "none";
            canvasEl.style.opacity = "1";
            canvasEl.style.zIndex = "1";

            glCtx = canvasEl.getContext("webgl2") || canvasEl.getContext("webgl");
            if (glCtx) {
                isSupported = ('requestPaint' in HTMLCanvasElement.prototype) && (typeof glCtx.texElementImage2D === 'function');
                glTex = glCtx.createTexture();
                glFbo = glCtx.createFramebuffer();

                glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
                glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
                glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
                glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);

                glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, glFbo);
                glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, glTex, 0);
            }

            (document.body || document.documentElement).appendChild(canvasEl);
            console.log("[HTML-in-Canvas] Injected HTML-in-Canvas layoutsubtree element. Supported:", isSupported);
        } catch (e) {
            console.error("[HTML-in-Canvas] Initialization error:", e);
        }
    }

    function mountTargetInSubtree() {
        if (!canvasEl) return null;
        const target = document.querySelector('.punch-viewer-content') ||
                       document.querySelector('.punch-viewer-container') ||
                       document.querySelector('.punch-viewer-page-wrapper-container') ||
                       document.querySelector('.punch-viewer-page-wrapper');

        if (target && target.parentNode !== canvasEl && target !== canvasEl) {
            try {
                canvasEl.appendChild(target);
            } catch (e) {}
        }
        return target || document.body;
    }

    function renderAndSendFrame() {
        if (!ipcRenderer || isCapturing) return;

        const w = window.innerWidth || 1920;
        const h = window.innerHeight || 1080;

        if (canvasEl && (canvasEl.width !== w || canvasEl.height !== h)) {
            canvasEl.width = w;
            canvasEl.height = h;
            if (glCtx) {
                glCtx.viewport(0, 0, w, h);
            }
        }

        const target = mountTargetInSubtree();
        if (!target) return;

        isCapturing = true;

        try {
            if (isSupported && glCtx && glTex) {
                // Rasterize DOM element directly to WebGL texture via Blink HTML-in-Canvas API
                glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                const internalFormat = glCtx.RGBA8 || glCtx.RGBA;
                glCtx.texElementImage2D(glCtx.TEXTURE_2D, internalFormat, target);

                const byteLen = w * h * 4;
                if (!pixelBuffer || pixelBuffer.length !== byteLen) {
                    pixelBuffer = new Uint8Array(byteLen);
                }

                glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, glFbo);
                glCtx.readPixels(0, 0, w, h, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixelBuffer);

                // Send rasterized WebGL buffer directly to parent Cables op
                ipcRenderer.sendToHost("html-in-canvas-frame", {
                    width: w,
                    height: h,
                    buffer: pixelBuffer
                });

                isCapturing = false;
            } else {
                isCapturing = false;
            }
        } catch (err) {
            isCapturing = false;
        }
    }

    function startFrameLoop() {
        if (isTransferring) return;
        isTransferring = true;

        let lastTime = 0;
        const targetInterval = 1000 / 60; // 60 FPS

        function loop(timestamp) {
            if (!isTransferring) return;

            if (timestamp - lastTime >= targetInterval) {
                lastTime = timestamp;
                renderAndSendFrame();
            }

            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    window.addEventListener("DOMContentLoaded", () => {
        setupTransparentStyles();
        deleteBG();
        initHTMLInCanvas();
        mountTargetInSubtree();
        startFrameLoop();

        setInterval(() => {
            setupTransparentStyles();
            deleteBG();
            mountTargetInSubtree();
        }, 300);
    });

    window.addEventListener("load", () => {
        setupTransparentStyles();
        deleteBG();
        initHTMLInCanvas();
        mountTargetInSubtree();
        startFrameLoop();
        renderAndSendFrame();
    });

    if (ipcRenderer) {
        ipcRenderer.on("next-slide", () => { scrollSim(120); });
        ipcRenderer.on("previous-slide", () => { scrollSim(-120); });
        ipcRenderer.on("set-remove-color", (_event, color) => {
            targetBgColorToRemove = color || "#abcdef";
            deleteBG(targetBgColorToRemove);
            renderAndSendFrame();
        });
        ipcRenderer.on("request-frame", () => {
            renderAndSendFrame();
        });
        ipcRenderer.sendToHost("preload-ready");
    }

    window.__cablesPreload = {
        setupTransparentStyles: setupTransparentStyles,
        deleteBG: deleteBG,
        scrollSim: scrollSim,
        renderAndSendFrame: renderAndSendFrame,
        initHTMLInCanvas: initHTMLInCanvas
    };
})();
