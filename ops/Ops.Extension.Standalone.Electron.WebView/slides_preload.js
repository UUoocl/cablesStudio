// slides_preload.js - HTML-in-Canvas Zero-Copy ImageBitmap GPU Preload for WebViewGoogleSlides

(function() {
    let targetBgColorToRemove = "#abcdef";
    let canvasEl = null;
    let glCtx = null;
    let glTex = null;
    let glFbo = null;
    let quadProgInfo = null;
    let isSupported = false;
    let isTransferring = false;
    let isCapturing = false;
    let pixelBuffer = null;
    let hostPort = null;
    let mutationObs = null;
    let rafId = null;
    let burstTimeout = null;
    let burstInterval = null;

    let ipcRenderer = null;
    try {
        const electron = require("electron");
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {}

    let broadcastChannel = null;
    try {
        broadcastChannel = new BroadcastChannel("cables-webview");
        broadcastChannel.onmessage = (event) => {
            const msg = event.data;
            if (!msg) return;
            if (msg.type === "next-slide" || msg === "next-slide" || msg.type === "next" || msg === "next") {
                scrollSim(120);
            } else if (msg.type === "previous-slide" || msg === "previous-slide" || msg.type === "prev" || msg === "prev") {
                scrollSim(-120);
            } else if (msg.type === "set-remove-color" || msg.type === "remove-bg-color") {
                targetBgColorToRemove = msg.color || msg.payload || (typeof msg === "string" ? msg : "#abcdef");
                removeBgColor(targetBgColorToRemove);
            } else if ((msg.type === "load-url" || msg.type === "set-url" || msg.type === "navigate") && (msg.url || msg.payload)) {
                const targetUrl = msg.url || msg.payload;
                if (typeof targetUrl === "string" && targetUrl.trim()) {
                    window.location.href = targetUrl.trim();
                }
            } else if (msg.type === "request-frame") {
                renderAndSendFrame();
            }
        };
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

    function cleanupAll() {
        isTransferring = false;
        isCapturing = true;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (burstInterval) {
            clearInterval(burstInterval);
            burstInterval = null;
        }
        if (burstTimeout) {
            clearTimeout(burstTimeout);
            burstTimeout = null;
        }
        if (mutationObs) {
            mutationObs.disconnect();
            mutationObs = null;
        }
    }

    window.addEventListener("beforeunload", cleanupAll);
    window.addEventListener("pagehide", cleanupAll);

    function scrollSim(deltaY) {
        if (!isTransferring) return;
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
            triggerBurstRender(600);
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
                }
            }
        } catch (e) {}
    }

    function removeBgColor(colorHex) {
        setupTransparentStyles();
        deleteBG(colorHex);
        triggerBurstRender(400);
    }

    function createQuadProgram(gl) {
        try {
            const vsSource = `
                attribute vec2 aPos;
                varying vec2 vUv;
                void main() {
                    vUv = aPos * 0.5 + 0.5;
                    gl_Position = vec4(aPos, 0.0, 1.0);
                }
            `;
            const fsSource = `
                precision mediump float;
                uniform sampler2D uTex;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(uTex, vUv);
                }
            `;
            const compile = (type, src) => {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return s;
            };
            const prog = gl.createProgram();
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
            gl.linkProgram(prog);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                 3, -1,
                -1,  3
            ]), gl.STATIC_DRAW);

            return {
                program: prog,
                buffer: buffer,
                aPos: gl.getAttribLocation(prog, "aPos"),
                uTex: gl.getUniformLocation(prog, "uTex")
            };
        } catch (e) {
            console.error("[Preload] createQuadProgram error:", e);
            return null;
        }
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

            const glOpts = {
                preserveDrawingBuffer: true,
                alpha: true,
                premultipliedAlpha: false
            };

            glCtx = canvasEl.getContext("webgl2", glOpts) || canvasEl.getContext("webgl", glOpts);
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

                quadProgInfo = createQuadProgram(glCtx);
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

    function sendFallbackFrame(w, h) {
        if (!isTransferring) return;
        try {
            const byteLen = w * h * 4;
            if (!pixelBuffer || pixelBuffer.length !== byteLen) {
                pixelBuffer = new Uint8Array(byteLen);
            }

            if (glCtx && glFbo) {
                glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, glFbo);
                glCtx.readPixels(0, 0, w, h, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixelBuffer);
            }

            if (hostPort) {
                hostPort.postMessage({
                    type: "html-in-canvas-frame",
                    width: w,
                    height: h,
                    buffer: pixelBuffer.buffer
                }, [pixelBuffer.buffer]);
                pixelBuffer = null;
            } else if (ipcRenderer) {
                ipcRenderer.sendToHost("html-in-canvas-frame", {
                    width: w,
                    height: h,
                    buffer: pixelBuffer
                });
            }
        } catch (e) {}
        isCapturing = false;
    }

    function renderAndSendFrame() {
        if (!isTransferring || isCapturing) return;

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
                // 1. Rasterize DOM element to WebGL texture via Blink HTML-in-Canvas API
                glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                const internalFormat = glCtx.RGBA8 || glCtx.RGBA;
                glCtx.texElementImage2D(glCtx.TEXTURE_2D, internalFormat, target);

                // 2. Render glTex directly into the canvas drawing buffer on GPU
                if (quadProgInfo) {
                    glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, null);
                    glCtx.viewport(0, 0, w, h);
                    glCtx.useProgram(quadProgInfo.program);
                    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, quadProgInfo.buffer);
                    glCtx.enableVertexAttribArray(quadProgInfo.aPos);
                    glCtx.vertexAttribPointer(quadProgInfo.aPos, 2, glCtx.FLOAT, false, 0, 0);
                    glCtx.activeTexture(glCtx.TEXTURE0);
                    glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                    glCtx.uniform1i(quadProgInfo.uTex, 0);
                    glCtx.drawArrays(glCtx.TRIANGLES, 0, 3);
                }

                // 3. Zero-Copy ImageBitmap Generation directly from GPU compositor
                if (typeof createImageBitmap === "function") {
                    createImageBitmap(canvasEl)
                        .then((bitmap) => {
                            isCapturing = false;
                            if (!isTransferring) {
                                if (typeof bitmap.close === "function") bitmap.close();
                                return;
                            }
                            if (hostPort) {
                                hostPort.postMessage({
                                    type: "html-in-canvas-bitmap",
                                    width: bitmap.width || w,
                                    height: bitmap.height || h,
                                    bitmap: bitmap
                                }, [bitmap]);
                            } else {
                                sendFallbackFrame(w, h);
                                if (typeof bitmap.close === "function") bitmap.close();
                            }
                        })
                        .catch(() => {
                            isCapturing = false;
                            sendFallbackFrame(w, h);
                        });
                    return;
                }
            }

            // Fallback readback if createImageBitmap or HTML-in-Canvas not supported
            sendFallbackFrame(w, h);
        } catch (err) {
            isCapturing = false;
        }
    }

    function triggerBurstRender(durationMs) {
        if (!isTransferring) return;
        if (burstInterval) clearInterval(burstInterval);
        if (burstTimeout) clearTimeout(burstTimeout);

        burstInterval = setInterval(() => {
            renderAndSendFrame();
        }, 1000 / 60);

        burstTimeout = setTimeout(() => {
            if (burstInterval) {
                clearInterval(burstInterval);
                burstInterval = null;
            }
            renderAndSendFrame();
        }, durationMs || 600);
    }

    function initMutationObserver() {
        if (mutationObs) return;
        try {
            const target = document.querySelector('.punch-viewer-content') ||
                           document.querySelector('.punch-viewer-container') ||
                           document.body;
            if (target) {
                mutationObs = new MutationObserver(() => {
                    if (!isTransferring) return;
                    deleteBG();
                    renderAndSendFrame();
                });
                mutationObs.observe(target, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ["style", "class", "fill", "transform"]
                });
            }
        } catch (e) {}
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

            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);
    }

    // Zero-copy MessagePort receiver from host Cables op
    window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "cables-init-port" && event.ports && event.ports[0]) {
            hostPort = event.ports[0];
            hostPort.onmessage = (portEvent) => {
                const data = portEvent.data;
                if (!data) return;
                if (data.type === "stop") {
                    cleanupAll();
                } else if (data.type === "request-frame") {
                    renderAndSendFrame();
                } else if (data.type === "next-slide" || data.type === "next") {
                    scrollSim(120);
                    if (hostPort) {
                        try { hostPort.postMessage({ "type": "slide-navigated", "direction": "next" }); } catch (e) {}
                    }
                } else if (data.type === "previous-slide" || data.type === "prev") {
                    scrollSim(-120);
                    if (hostPort) {
                        try { hostPort.postMessage({ "type": "slide-navigated", "direction": "prev" }); } catch (e) {}
                    }
                } else if (data.type === "set-remove-color" || data.type === "remove-bg-color") {
                    targetBgColorToRemove = data.color || data.payload || "#abcdef";
                    removeBgColor(targetBgColorToRemove);
                    if (hostPort) {
                        try { hostPort.postMessage({ "type": "color-removed", "color": targetBgColorToRemove }); } catch (e) {}
                    }
                } else if ((data.type === "load-url" || data.type === "set-url" || data.type === "navigate") && (data.url || data.payload)) {
                    const u = data.url || data.payload;
                    if (typeof u === "string" && u.trim()) {
                        window.location.href = u.trim();
                    }
                } else {
                    // Custom message handling: dispatch custom DOM event
                    try {
                        const customEv = new CustomEvent("cables-guest-message", { "detail": data, "bubbles": true });
                        document.dispatchEvent(customEv);
                    } catch (e) {}
                }
            };
            console.log("[HTML-in-Canvas] Zero-copy MessagePort established with host Cables op.");
            isTransferring = true;
            renderAndSendFrame();
        }
    });

    window.addEventListener("DOMContentLoaded", () => {
        setupTransparentStyles();
        deleteBG();
        initHTMLInCanvas();
        mountTargetInSubtree();
        initMutationObserver();
        startFrameLoop();

        setTimeout(() => {
            setupTransparentStyles();
            deleteBG();
            mountTargetInSubtree();
            initMutationObserver();
            renderAndSendFrame();
        }, 300);
    });

    window.addEventListener("load", () => {
        setupTransparentStyles();
        deleteBG();
        initHTMLInCanvas();
        mountTargetInSubtree();
        initMutationObserver();
        startFrameLoop();
        renderAndSendFrame();
    });

    if (ipcRenderer) {
        ipcRenderer.on("next-slide", () => { scrollSim(120); });
        ipcRenderer.on("previous-slide", () => { scrollSim(-120); });
        ipcRenderer.on("set-remove-color", (_event, color) => {
            targetBgColorToRemove = color || "#abcdef";
            removeBgColor(targetBgColorToRemove);
        });
        ipcRenderer.on("request-frame", () => {
            renderAndSendFrame();
        });
        ipcRenderer.sendToHost("preload-ready");
    }

    window.__cablesPreload = {
        setupTransparentStyles: setupTransparentStyles,
        deleteBG: deleteBG,
        removeBgColor: removeBgColor,
        scrollSim: scrollSim,
        renderAndSendFrame: renderAndSendFrame,
        initHTMLInCanvas: initHTMLInCanvas,
        cleanupAll: cleanupAll
    };
})();
