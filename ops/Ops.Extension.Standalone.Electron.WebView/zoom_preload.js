// zoom_preload.js - Zoom Web Client Video Canvas Preload
// Automatically discovers and streams Zoom's native WebCodecs video canvas via dedicated GPU mailbox snapshotting,
// with live document fallback during pre-meeting/connecting states.

(function() {
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
    let stateMutationObs = null;
    let chatMutationObs = null;
    let stateCheckInterval = null;
    let observedChatContainer = null;
    let rafId = null;

    let cachedTargetCanvas = null;

    let ipcRenderer = null;
    try {
        const electron = require("electron");
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {}

    let broadcastChannel = null;
    try {
        broadcastChannel = new BroadcastChannel("cables-webview");
        broadcastChannel.onmessage = (event) => {
            if (event && event.data) {
                handleHostCommand(event.data);
            }
        };
    } catch (e) {}

    let zoomBroadcastChannel = null;
    try {
        zoomBroadcastChannel = new BroadcastChannel("zoom-sync");
        zoomBroadcastChannel.onmessage = (event) => {
            if (event && event.data) {
                handleHostCommand(event.data);
            }
        };
    } catch (e) {}

    // Trusted types policy if required by browser security
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScriptURL: string => string,
                createScript: string => string
            });
        } catch (e) {}
    }

    // Meeting State Tracking
    const lastState = {
        muted: null,
        videoOff: null,
        activeSpeaker: null,
        participantsCount: null,
        lastChatSender: null,
        lastChatMessage: null,
        connectionStatus: "connecting"
    };

    function sendToHost(payload) {
        if (!payload) return;

        if (hostPort) {
            try {
                hostPort.postMessage(payload);
            } catch (e) {}
        }

        if (ipcRenderer) {
            try {
                ipcRenderer.sendToHost("preload-message", payload);
            } catch (e) {}
        }

        if (broadcastChannel) {
            try { broadcastChannel.postMessage(payload); } catch (e) {}
        }
        if (zoomBroadcastChannel) {
            try { zoomBroadcastChannel.postMessage(payload); } catch (e) {}
        }

        if (window.opener && typeof window.opener.postMessage === "function") {
            try {
                window.opener.postMessage({
                    type: "zoomSync",
                    payload: payload
                }, "*");
            } catch (e) {}
        }
    }

    // Resolve Zoom Document context (top-level document or embedded iframe)
    function getZoomDocument() {
        try {
            const iframe = document.getElementById("webclient") ||
                           document.querySelector(".pwa-webclient__iframe") ||
                           document.querySelector("iframe#webclient") ||
                           document.querySelector("iframe");
            if (iframe && (iframe.contentDocument || iframe.contentWindow)) {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && (doc.body || doc.documentElement)) return doc;
            }
        } catch (e) {}
        return document;
    }

    // Deep Shadow DOM, Iframe, and Slot search helper
    function findInShadows(root, selector, all = false) {
        if (!root) return all ? [] : null;
        const results = [];

        function searchContainer(container) {
            if (!container) return;

            if (typeof container.querySelectorAll === "function") {
                try {
                    const matched = container.querySelectorAll(selector);
                    for (let i = 0; i < matched.length; i++) {
                        results.push(matched[i]);
                        if (!all) return;
                    }
                } catch (e) {}
            }

            let allElements = [];
            try {
                allElements = container.querySelectorAll ? container.querySelectorAll("*") : [];
            } catch (e) {}

            for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i];

                if (el.shadowRoot) {
                    searchContainer(el.shadowRoot);
                    if (!all && results.length > 0) return;
                }

                if (el.tagName === "SLOT" && typeof el.assignedElements === "function") {
                    try {
                        const assigned = el.assignedElements({ flatten: true });
                        for (let j = 0; j < assigned.length; j++) {
                            const aEl = assigned[j];
                            if (aEl.matches && aEl.matches(selector)) {
                                results.push(aEl);
                                if (!all) return;
                            }
                            searchContainer(aEl);
                            if (!all && results.length > 0) return;
                        }
                    } catch (e) {}
                }

                if (el.tagName === "IFRAME") {
                    try {
                        const iframeDoc = el.contentDocument || (el.contentWindow && el.contentWindow.document);
                        if (iframeDoc) {
                            searchContainer(iframeDoc);
                            if (!all && results.length > 0) return;
                        }
                    } catch (e) {}
                }
            }
        }

        searchContainer(root);
        return all ? results : (results[0] || null);
    }

    // Find native video canvas in Zoom Shadow DOM
    function resolveTargetCanvas() {
        if (cachedTargetCanvas && cachedTargetCanvas.isConnected && cachedTargetCanvas.width > 0 && cachedTargetCanvas.height > 0) {
            return cachedTargetCanvas;
        }

        const doc = getZoomDocument();

        // Search specifically for Zoom video player canvas in shadow roots and iframe
        const specificCanvas = findInShadows(doc, 'canvas[id*="video-player-canvas"], canvas[id*="video-player"], canvas[id*="canvas"]');
        if (specificCanvas && specificCanvas !== canvasEl && specificCanvas.width > 0 && specificCanvas.height > 0) {
            cachedTargetCanvas = specificCanvas;
            return specificCanvas;
        }

        // Generic canvas search in shadow roots
        const allCanvases = findInShadows(doc, "canvas", true);
        for (let i = 0; i < allCanvases.length; i++) {
            const c = allCanvases[i];
            if (c !== canvasEl && c.width > 10 && c.height > 10) {
                cachedTargetCanvas = c;
                return c;
            }
        }

        return null;
    }

    // Scrape and publish meeting state changes
    function checkMeetingState() {
        const doc = getZoomDocument();
        if (!doc) return;

        const state = {};

        // 1. Microphone Mute Status
        const micBtn = findInShadows(doc, 'button[aria-label*="microphone" i], button[aria-label*="mic" i], button[aria-label*="Mute" i], button[aria-label*="Unmute" i], [data-tooltiptype*="mic" i]');
        if (micBtn) {
            const label = (micBtn.getAttribute("aria-label") || micBtn.innerText || "").toLowerCase();
            state.muted = label.indexOf("unmute") !== -1 || label.indexOf("start audio") !== -1;
        } else {
            state.muted = null;
        }

        // 2. Video Camera Status
        const videoBtn = findInShadows(doc, 'button[aria-label*="video" i], button[aria-label*="camera" i], button[aria-label*="Video" i]');
        if (videoBtn) {
            const label = (videoBtn.getAttribute("aria-label") || videoBtn.innerText || "").toLowerCase();
            state.videoOff = label.indexOf("start") !== -1 || label.indexOf("turn on") !== -1;
        } else {
            state.videoOff = null;
        }

        // 3. Participants Count
        const partEl = findInShadows(doc, "#participant > div > button > div > span > span, #participant > div > button > div > span, .footer-button__participants-badge, .footer-button__number-counter");
        if (partEl) {
            const num = parseInt(partEl.textContent.trim(), 10);
            if (!isNaN(num)) {
                state.participantsCount = num;
            }
        } else {
            const partBtn = findInShadows(doc, 'button[aria-label*="participants" i], button[aria-label*="Participants" i]');
            if (partBtn) {
                const label = partBtn.getAttribute("aria-label") || "";
                const countMatch = label.match(/\d+/);
                if (countMatch) {
                    state.participantsCount = parseInt(countMatch[0], 10);
                } else {
                    const badge = partBtn.querySelector(".badge, .number, span");
                    if (badge) {
                        const num = parseInt(badge.textContent.trim(), 10);
                        if (!isNaN(num)) state.participantsCount = num;
                    }
                }
            }
        }

        // 4. Active Speaker
        const activeSpeakerEl = findInShadows(doc, '.active-speaker, [class*="active-speaker"], [class*="speaker-active"], .speaker-bar__name, .name-tag, .gallery-video-container__video-frame--active');
        if (activeSpeakerEl) {
            const nameEl = activeSpeakerEl.querySelector ? activeSpeakerEl.querySelector('.video-avatar__avatar-footer span, [class*="name"]') : null;
            state.activeSpeaker = (nameEl || activeSpeakerEl).textContent.trim();
        } else {
            const speakerThumbnail = findInShadows(doc, '.speaker-highlight, [class*="speaker-highlight"], [style*="border-color: rgb(45, 140, 255)"]');
            if (speakerThumbnail) {
                state.activeSpeaker = speakerThumbnail.textContent.trim();
            }
        }

        // Check for state diffs and dispatch updates
        const changes = {};
        let hasChanges = false;

        ["muted", "videoOff", "activeSpeaker", "participantsCount"].forEach((key) => {
            if (state[key] !== lastState[key] && state[key] !== undefined) {
                lastState[key] = state[key];
                changes[key] = state[key];
                hasChanges = true;
            }
        });

        if (hasChanges) {
            sendToHost({
                type: "stateUpdate",
                data: changes,
                muted: lastState.muted,
                videoOff: lastState.videoOff,
                activeSpeaker: lastState.activeSpeaker,
                participantsCount: lastState.participantsCount
            });
        }

        checkChatObserver();
    }

    // Observe Chat messages via MutationObserver
    function checkChatObserver() {
        const doc = getZoomDocument();
        if (!doc) return;

        const chatContainer = findInShadows(doc, '.chat-list, [class*="chat-list"], [class*="chat-messages"], .chat-box__chat-list, #chat-list');

        if (chatContainer && chatContainer !== observedChatContainer) {
            if (chatMutationObs) {
                try { chatMutationObs.disconnect(); } catch (e) {}
            }
            observedChatContainer = chatContainer;

            chatMutationObs = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                            const node = mutation.addedNodes[i];
                            if (node && node.nodeType === 1) {
                                const senderEl = node.querySelector ? node.querySelector('.chat-message-item__sender, [class*="sender"], [class*="name"], .chat-item__sender') : null;
                                const textEl = node.querySelector ? node.querySelector('.chat-message-item__text, [class*="text"], [class*="message"], .chat-item__chat-message') : null;

                                if (textEl) {
                                    const sender = senderEl ? senderEl.textContent.trim() : "System";
                                    const text = textEl.textContent.trim();

                                    if (lastState.lastChatMessage !== text || lastState.lastChatSender !== sender) {
                                        lastState.lastChatMessage = text;
                                        lastState.lastChatSender = sender;

                                        sendToHost({
                                            type: "chatMessage",
                                            data: {
                                                sender: sender,
                                                message: text,
                                                timestamp: Date.now()
                                            },
                                            sender: sender,
                                            message: text
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            });

            chatMutationObs.observe(chatContainer, { childList: true, subtree: true });
        } else if (!chatContainer && observedChatContainer) {
            observedChatContainer = null;
            if (chatMutationObs) {
                try { chatMutationObs.disconnect(); } catch (e) {}
                chatMutationObs = null;
            }
        }
    }

    function initDOMObserver() {
        if (stateMutationObs) return;
        try {
            const doc = getZoomDocument();
            const root = (doc && (doc.body || doc.documentElement)) || document.body;
            if (root) {
                stateMutationObs = new MutationObserver(() => {
                    checkMeetingState();
                });
                stateMutationObs.observe(root, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ["aria-label", "class", "style"]
                });
            }
        } catch (e) {}
    }

    // Inbound host command handler
    function handleHostCommand(msg) {
        if (!msg) return;
        const type = msg.type || msg.action || msg.cmd || "";
        const doc = getZoomDocument();

        if (type === "toggle-mic" || type === "mute" || type === "unmute") {
            const micBtn = doc ? findInShadows(doc, 'button[aria-label*="microphone" i], button[aria-label*="mic" i], button[aria-label*="Mute" i], button[aria-label*="Unmute" i]') : null;
            if (micBtn) {
                const label = (micBtn.getAttribute("aria-label") || micBtn.innerText || "").toLowerCase();
                const isCurrentlyMuted = label.indexOf("unmute") !== -1 || label.indexOf("start audio") !== -1;
                if (type === "toggle-mic" || (type === "mute" && !isCurrentlyMuted) || (type === "unmute" && isCurrentlyMuted)) {
                    micBtn.click();
                    setTimeout(checkMeetingState, 200);
                }
            }
        } else if (type === "toggle-video" || type === "start-video" || type === "stop-video") {
            const videoBtn = doc ? findInShadows(doc, 'button[aria-label*="video" i], button[aria-label*="camera" i], button[aria-label*="Video" i]') : null;
            if (videoBtn) {
                const label = (videoBtn.getAttribute("aria-label") || videoBtn.innerText || "").toLowerCase();
                const isCurrentlyOff = label.indexOf("start") !== -1 || label.indexOf("turn on") !== -1;
                if (type === "toggle-video" || (type === "start-video" && isCurrentlyOff) || (type === "stop-video" && !isCurrentlyOff)) {
                    videoBtn.click();
                    setTimeout(checkMeetingState, 200);
                }
            }
        } else if (type === "request-frame") {
            renderAndSendFrame();
        } else if ((type === "load-url" || type === "set-url" || type === "navigate") && (msg.url || msg.payload)) {
            const targetUrl = msg.url || msg.payload;
            if (typeof targetUrl === "string" && targetUrl.trim()) {
                window.location.href = targetUrl.trim();
            }
        } else if (type === "get-state") {
            checkMeetingState();
            sendToHost({
                type: "stateUpdate",
                data: lastState,
                muted: lastState.muted,
                videoOff: lastState.videoOff,
                activeSpeaker: lastState.activeSpeaker,
                participantsCount: lastState.participantsCount
            });
        }
    }

    function cleanupAll() {
        isTransferring = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (stateCheckInterval) {
            clearInterval(stateCheckInterval);
            stateCheckInterval = null;
        }
        if (stateMutationObs) {
            stateMutationObs.disconnect();
            stateMutationObs = null;
        }
        if (chatMutationObs) {
            chatMutationObs.disconnect();
            chatMutationObs = null;
        }
        observedChatContainer = null;
        cachedTargetCanvas = null;
        sendToHost({ type: "connectionStatus", data: "disconnected" });
    }

    window.addEventListener("beforeunload", cleanupAll);
    window.addEventListener("pagehide", cleanupAll);

    // ==========================================
    // GPU HTML-in-Canvas Compositing Pipeline
    // ==========================================
    function createQuadProgram(gl) {
        const vsSrc = `
            attribute vec2 aPos;
            varying vec2 vUv;
            void main() {
                vUv = 0.5 * (aPos + 1.0);
                gl_Position = vec4(aPos, 0.0, 1.0);
            }
        `;
        const fsSrc = `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D uTex;
            void main() {
                gl_FragColor = texture2D(uTex, vUv);
            }
        `;

        function compileShader(src, type) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        const vs = compileShader(vsSrc, gl.VERTEX_SHADER);
        const fs = compileShader(fsSrc, gl.FRAGMENT_SHADER);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             3, -1,
            -1,  3
        ]), gl.STATIC_DRAW);

        return {
            program: prog,
            buffer: buf,
            aPos: gl.getAttribLocation(prog, "aPos"),
            uTex: gl.getUniformLocation(prog, "uTex")
        };
    }

    function initHTMLInCanvas(doc) {
        doc = doc || getZoomDocument() || document;
        if (canvasEl && canvasEl.ownerDocument === doc && glCtx && glTex) return;

        try {
            if (canvasEl && canvasEl.parentNode) {
                canvasEl.parentNode.removeChild(canvasEl);
            }

            canvasEl = doc.createElement("canvas");
            canvasEl.id = "cables_zoom_canvas_renderer";
            canvasEl.width = 1920;
            canvasEl.height = 1080;
            canvasEl.setAttribute("layoutsubtree", "");
            canvasEl.style.position = "fixed";
            canvasEl.style.left = "0px";
            canvasEl.style.top = "0px";
            canvasEl.style.width = "100vw";
            canvasEl.style.height = "100vh";
            canvasEl.style.pointerEvents = "none";
            canvasEl.style.zIndex = "-999999";
            canvasEl.style.opacity = "0";

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

            (doc.body || doc.documentElement).appendChild(canvasEl);
        } catch (e) {
            console.error("[Zoom Preload] initHTMLInCanvas error:", e);
        }
    }

    function sendFallbackFrame(sourceEl, w, h) {
        if (!isTransferring) return;
        try {
            w = w || (sourceEl && sourceEl.width) || window.innerWidth || 1920;
            h = h || (sourceEl && sourceEl.height) || window.innerHeight || 1080;

            const byteLen = w * h * 4;
            if (!pixelBuffer || pixelBuffer.length !== byteLen) {
                pixelBuffer = new Uint8Array(byteLen);
            }

            if (sourceEl && sourceEl.tagName === "CANVAS" && sourceEl !== canvasEl) {
                const sCtx = sourceEl.getContext("2d");
                if (sCtx) {
                    const imgData = sCtx.getImageData(0, 0, w, h);
                    pixelBuffer = new Uint8Array(imgData.data.buffer);
                }
            } else if (glCtx && glFbo) {
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
    }

    // Capture Zoom video canvas with dedicated GPU mailbox snapshotting, with live fallback
    function renderAndSendFrame() {
        if (!isTransferring || isCapturing) return;

        const targetCanvas = resolveTargetCanvas();

        // 1. Zoom WebCodecs Video Canvas Path
        if (targetCanvas && targetCanvas.tagName === "CANVAS" && targetCanvas !== canvasEl) {
            const w = targetCanvas.width || 1920;
            const h = targetCanvas.height || 1080;

            if (w > 0 && h > 0) {
                const targetDoc = targetCanvas.ownerDocument || getZoomDocument() || document;
                initHTMLInCanvas(targetDoc);

                if (glCtx && glTex && quadProgInfo) {
                    isCapturing = true;

                    try {
                        if (canvasEl.width !== w || canvasEl.height !== h) {
                            canvasEl.width = w;
                            canvasEl.height = h;
                            glCtx.viewport(0, 0, w, h);
                        }

                        // Snapshot source video canvas into our stable WebGL texture on the GPU
                        glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                        glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, targetCanvas);

                        // Render quad directly to canvasEl drawing buffer
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

                        // Generate ImageBitmap backed by our own persistent canvas mailbox
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
                                        sendFallbackFrame(canvasEl, w, h);
                                        if (typeof bitmap.close === "function") bitmap.close();
                                    }
                                })
                                .catch(() => {
                                    isCapturing = false;
                                    sendFallbackFrame(targetCanvas, w, h);
                                });
                            return;
                        }
                    } catch (err) {
                        isCapturing = false;
                    }
                }

                // Direct createImageBitmap fallback if WebGL quad snapshot was unavailable
                if (typeof createImageBitmap === "function") {
                    isCapturing = true;
                    createImageBitmap(targetCanvas)
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
                                sendFallbackFrame(targetCanvas, w, h);
                                if (typeof bitmap.close === "function") bitmap.close();
                            }
                        })
                        .catch(() => {
                            isCapturing = false;
                            sendFallbackFrame(targetCanvas, w, h);
                        });
                    return;
                }

                sendFallbackFrame(targetCanvas, w, h);
                isCapturing = false;
                return;
            }
        }

        // 2. Live Document Fallback: Rasterize document body so texture is active during connect/waiting state
        const doc = getZoomDocument();
        const fallbackEl = (doc && (doc.body || doc.documentElement)) || document.body;
        if (!fallbackEl) return;

        initHTMLInCanvas(doc);
        if (!glCtx || !glTex) return;

        const w = window.innerWidth || 1920;
        const h = window.innerHeight || 1080;

        if (canvasEl.width !== w || canvasEl.height !== h) {
            canvasEl.width = w;
            canvasEl.height = h;
            glCtx.viewport(0, 0, w, h);
            glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
            glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, w, h, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, null);
        }

        isCapturing = true;

        try {
            if (isSupported) {
                glCtx.bindTexture(glCtx.TEXTURE_2D, glTex);
                const internalFormat = glCtx.RGBA8 || glCtx.RGBA;
                glCtx.texElementImage2D(glCtx.TEXTURE_2D, internalFormat, fallbackEl);

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
                                sendFallbackFrame(canvasEl, w, h);
                                if (typeof bitmap.close === "function") bitmap.close();
                            }
                        })
                        .catch(() => {
                            isCapturing = false;
                            sendFallbackFrame(canvasEl, w, h);
                        });
                    return;
                }
            }

            sendFallbackFrame(canvasEl, w, h);
            isCapturing = false;
        } catch (err) {
            isCapturing = false;
        }
    }

    function startFrameLoop() {
        if (isTransferring) return;
        isTransferring = true;

        let lastTime = 0;
        const targetInterval = 1000 / 30; // 30 FPS

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
                } else {
                    handleHostCommand(data);
                }
            };
            isTransferring = true;
            sendToHost({ type: "connectionStatus", data: "connected" });
            checkMeetingState();
            renderAndSendFrame();
        }
    });

    function initAll() {
        initHTMLInCanvas(getZoomDocument());
        initDOMObserver();
        checkMeetingState();
        startFrameLoop();

        if (!stateCheckInterval) {
            stateCheckInterval = setInterval(checkMeetingState, 500);
        }

        sendToHost({ type: "connectionStatus", data: "connected" });
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }

    window.addEventListener("load", () => {
        initAll();
        setTimeout(checkMeetingState, 1000);
        setTimeout(checkMeetingState, 3000);
    });

    if (ipcRenderer) {
        ipcRenderer.sendToHost("preload-ready");
    }

    window.__cablesZoomPreload = {
        checkMeetingState: checkMeetingState,
        handleHostCommand: handleHostCommand,
        renderAndSendFrame: renderAndSendFrame,
        findInShadows: findInShadows,
        resolveTargetCanvas: resolveTargetCanvas,
        cleanupAll: cleanupAll
    };
})();
