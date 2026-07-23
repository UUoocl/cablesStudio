// Cables.gl Custom OP: Unified Iframe Engine Bridge (with Attachment Dependency Resolution)

// ---------------------------------------------------------------------------
// GLOBAL FONT FACE INTERCEPTION (to support CSS Font Loading API in iframes)
// ---------------------------------------------------------------------------
window._cablesLoadedFonts = window._cablesLoadedFonts || [];
if (!window._cablesFontFacePatched) {
    window._cablesFontFacePatched = true;
    const OriginalFontFace = window.FontFace;
    if (typeof OriginalFontFace === "function") {
        window.FontFace = function(family, source, descriptors) {
            const fontFace = new OriginalFontFace(family, source, descriptors);
            window._cablesLoadedFonts.push({
                family: family,
                source: source,
                descriptors: descriptors
            });
            return fontFace;
        };
        window.FontFace.prototype = OriginalFontFace.prototype;
    }
}

const cgl = op.patch.cgl;
const gl = cgl.gl;

// ---------------------------------------------------------------------------
// INPUT PORTS
// ---------------------------------------------------------------------------
const inHtmlAttachment = op.inString("HTML Attachment", "index.html");
const inIframeId = op.inString("Iframe ID", "cables_iframe");
const inTargetScope = op.inString("Target Object Scope", "window"); // e.g., "window", "p5.instance"
const inChannelName = op.inString("Broadcast Channel", "cables_iframe_channel");

// UI and layout controls
const inShowUI = op.inBool("Show UI", false);
const inWidth = op.inFloat("Width", 800);
const inHeight = op.inFloat("Height", 600);
const inPosX = op.inFloat("Position X", 20.0);
const inPosY = op.inFloat("Position Y", 20.0);
const inPosZ = op.inFloat("Position Z", 9999.0);
const inOpacity = op.inFloat("Opacity", 1.0);
const inFlipY = op.inBool("Flip Y", false);

// ---------------------------------------------------------------------------
// OUTPUT PORTS
// ---------------------------------------------------------------------------
const outTex = op.outTexture("Texture Out");
const outTextureUpdated = op.outTrigger("Texture Updated");
const outAudio = op.outObject("Audio Node Out"); // Web Audio API AudioNode
const outElement = op.outObject("Iframe Element");
const outMsg = op.outObject("Message Out");
const outMsgReceived = op.outTrigger("Message Received");

// ---------------------------------------------------------------------------
// INTERNAL STATE
// ---------------------------------------------------------------------------
let iframeEl = null;
let blobUrl = null;
let cglTexture = null;
let broadcastChannel = null;
let audioSourceNode = null;
let checkAudioInterval = null;
let onParentFontsLoaded = null;

// Register listeners
inHtmlAttachment.onChange = updateIframe;
inChannelName.onChange = setupBroadcastChannel;
inIframeId.onChange = updateIframeId;

// UI Layout listeners
inShowUI.onChange = updateIframeLayout;
inWidth.onChange = () => {
    updateIframeLayout();
    op.setIframeVar("width", inWidth.get());
};
inHeight.onChange = () => {
    updateIframeLayout();
    op.setIframeVar("height", inHeight.get());
};
inPosX.onChange = updateIframeLayout;
inPosY.onChange = updateIframeLayout;
inPosZ.onChange = updateIframeLayout;
inOpacity.onChange = updateIframeLayout;

// Helper to resolve the root patch assets path as a fully qualified absolute URL
function getAssetsPath() {
    let dummyPath = op.patch.getFilePath("dummy.txt") || "";
    
    // Resolve directory portion by stripping filename and suffix parameters
    const lastSlash = dummyPath.lastIndexOf("/");
    let dir = lastSlash !== -1 ? dummyPath.substring(0, lastSlash + 1) : "";
    
    // Force absolute HTTP/HTTPS URL scheme to prevent browser SyntaxErrors in blob URL frames
    if (dir && dir.indexOf("http:") !== 0 && dir.indexOf("https:") !== 0) {
        if (dir.indexOf("/") === 0) {
            dir = window.location.origin + dir;
        } else {
            dir = window.location.origin + "/" + dir;
        }
    }
    return dir;
}

// ---------------------------------------------------------------------------
// 1. BROADCAST CHANNEL SETUP
// ---------------------------------------------------------------------------
function setupBroadcastChannel() {
    if (broadcastChannel) broadcastChannel.close();
    const channelName = inChannelName.get() || "cables_iframe_channel";
    broadcastChannel = new BroadcastChannel(channelName);

    broadcastChannel.onmessage = (e) => {
        if (e.data) {
            outMsg.set(e.data);
            outMsgReceived.trigger();

            // Synchronize variable states on successful sketch boot
            if (e.data.type === "SKETCH_LOADED") {
                op.setIframeVar("width", inWidth.get());
                op.setIframeVar("height", inHeight.get());
            }
        }
    };
}

// Helper to update a remote variable inside the iframe via BroadcastChannel
op.setIframeVar = function (key, value) {
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: "SET_VAR", key: key, value: value });
    }
};

// ---------------------------------------------------------------------------
// 2. ATTACHMENT FETCH & IFRAME LIFECYCLE
// ---------------------------------------------------------------------------
function updateIframe() {
    const fileName = inHtmlAttachment.get();
    if (!fileName) return;

    let htmlContent = null;
    const attachmentKey = fileName.replace(/\./g, "_");

    // Check if the HTML is embedded directly as an Op Attachment
    if (typeof attachments !== "undefined" && attachments && attachments[attachmentKey]) {
        htmlContent = attachments[attachmentKey];
    }

    if (htmlContent !== null) {
        // --- Strategy A: Load from Op Attachments (Synchronous & Offline-friendly) ---
        let modifiedHtml = htmlContent;

        // Auto-inline javascript attachments and rewrite let/const to var (order-independent attribute matching)
        const scriptRegex = /<script\b(?:[^>]*?\bsrc\s*=\s*["']([^"']+)["'])[^>]*>\s*<\/script>/gi;
        modifiedHtml = modifiedHtml.replace(scriptRegex, (match, src) => {
            const srcKey = src.replace(/\./g, "_");
            if (typeof attachments !== "undefined" && attachments && attachments[srcKey]) {
                let jsContent = attachments[srcKey];
                // Automatically convert top-level or general let/const declarations to var to expose them on window
                jsContent = jsContent.replace(/\b(let|const)\s+/g, "var ");
                return `<script>${jsContent}</script>`;
            }
            return match;
        });

        // Auto-inline CSS attachments (order-independent attribute matching)
        const cssRegex = /<link\b(?:[^>]*?\bhref\s*=\s*["']([^"']+)["'])[^>]*>/gi;
        modifiedHtml = modifiedHtml.replace(cssRegex, (match, href) => {
            const hrefKey = href.replace(/\./g, "_");
            if (typeof attachments !== "undefined" && attachments && attachments[hrefKey]) {
                return `<style>${attachments[hrefKey]}</style>`;
            }
            return match;
        });

        loadHtmlIntoIframe(modifiedHtml);
    } else {
        // --- Strategy B: Fallback to Patch Asset File (Asynchronous & Network-fetched) ---
        const htmlPath = op.patch.getFilePath(fileName);
        if (!htmlPath) {
            op.logError("Attachment not found in op.attachments or patch files: " + fileName);
            return;
        }

        fetch(htmlPath)
            .then((res) => res.text())
            .then((fetchedHtml) => {
                loadHtmlIntoIframe(fetchedHtml);
            })
            .catch((err) => {
                op.logError("Failed to fetch HTML patch asset:", err);
            });
    }
}

function loadHtmlIntoIframe(modifiedHtml) {
    if (blobUrl) URL.revokeObjectURL(blobUrl);

    // Unify assets resolution by prepending a fully qualified absolute URL base tag
    const assetsPath = getAssetsPath();
    const baseTag = assetsPath ? `<base href="${assetsPath}">` : "";
    let html = modifiedHtml;

    if (baseTag) {
        if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>\n  ${baseTag}`);
        } else {
            html = `${baseTag}\n${html}`;
        }
    }

    const blob = new Blob([html], { type: "text/html" });
    blobUrl = URL.createObjectURL(blob);

    if (!iframeEl) {
        iframeEl = document.createElement("iframe");
        iframeEl.style.border = "none";
        document.body.appendChild(iframeEl);
    }

    updateIframeLayout();
    updateIframeId();

    iframeEl.onload = () => {
        injectEngineBridge(iframeEl);
        setupAudioCapture(iframeEl);
        syncParentFontsToIframe(iframeEl);
    };

    iframeEl.src = blobUrl;
    outElement.set(iframeEl);
}

function updateIframeId() {
    if (iframeEl) {
        iframeEl.id = inIframeId.get() || "";
    }
}

function updateIframeLayout() {
    if (!iframeEl) return;

    const showUi = inShowUI.get();
    const w = inWidth.get();
    const h = inHeight.get();
    const posX = inPosX.get();
    const posY = inPosY.get();
    const posZ = Math.round(inPosZ.get());
    const opacity = inOpacity.get();

    if (!showUi) {
        // Run offscreen to prevent browser requestAnimationFrame throttling
        iframeEl.style.position = "fixed";
        iframeEl.style.left = "-9999px";
        iframeEl.style.top = "0px";
        iframeEl.style.width = w + "px";
        iframeEl.style.height = h + "px";
        iframeEl.style.opacity = "0.0001";
        iframeEl.style.pointerEvents = "none";
        iframeEl.style.zIndex = "-999999";
    } else {
        iframeEl.style.position = "fixed";
        iframeEl.style.left = posX + "px";
        iframeEl.style.top = posY + "px";
        iframeEl.style.width = w + "px";
        iframeEl.style.height = h + "px";
        iframeEl.style.opacity = opacity;
        iframeEl.style.pointerEvents = "auto";
        iframeEl.style.zIndex = posZ + "";
    }
}

// ---------------------------------------------------------------------------
// 3. INJECT SCRIPT: VARIABLE PROXY + AUDIO INTERCEPTION
// ---------------------------------------------------------------------------
function injectEngineBridge(iframe) {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) return;

    const channelName = inChannelName.get() || "cables_iframe_channel";
    const targetScope = inTargetScope.get() || "window";

    const scriptEl = doc.createElement("script");
    scriptEl.textContent = `
    (function() {
      // A. Force devicePixelRatio to 1 to match logical canvas size (disables High-DPI physical scaling)
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 1,
        configurable: true
      });

      const channel = new BroadcastChannel('${channelName}');

      // B. Variable Proxy Listener
      function initProxy() {
        channel.onmessage = (e) => {
          if (e.data?.type === 'SET_VAR' || e.data?.type === 'SET_VARS') {
            // Resolve nested namespaces dynamically
            let targetObj = window;
            const scopePath = '${targetScope}'.split('.');
            for (const part of scopePath) {
              if (part && targetObj) {
                targetObj = targetObj[part];
              }
            }
            if (targetObj) {
              var varsToSet = {};

              if (e.data.vars) {
                varsToSet = e.data.vars;
              } else if (e.data.key !== undefined) {
                varsToSet[e.data.key] = e.data.value;
              }

              for (var key in varsToSet) {
                if (varsToSet.hasOwnProperty(key)) {
                  targetObj[key] = varsToSet[key];
                }
              }
            }
          }
        };
      }
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initProxy);
      } else {
        initProxy();
      }

      // C. Universal Audio Context Capture and Routing
      const origConnect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function(destination, output, input) {
        if (destination && this.context && destination === this.context.destination) {
          const ctx = this.context;
          if (!ctx._cablesAudioSetup) {
            ctx._cablesAudioSetup = true;
            try {
              const streamDest = ctx.createMediaStreamDestination();
              
              // Cables gain node
              const cablesMasterGain = ctx.createGain();
              cablesMasterGain.connect(streamDest);
              
              // Muted local speakers gain node
              const speakerGain = ctx.createGain();
              speakerGain.gain.setValueAtTime(0.0, ctx.currentTime);
              speakerGain.connect(ctx.destination);

              ctx._cablesStreamDest = streamDest;
              ctx._cablesMasterGain = cablesMasterGain;
              ctx._cablesSpeakerGain = speakerGain;

              window._cablesAudioStream = streamDest.stream;
            } catch (e) {
              console.warn("Failed to intercept iframe audio context:", e);
            }
          }
          if (ctx._cablesMasterGain && ctx._cablesSpeakerGain) {
            origConnect.call(this, ctx._cablesMasterGain, output, input);
            return origConnect.call(this, ctx._cablesSpeakerGain, output, input);
          }
        }
        return origConnect.call(this, destination, output, input);
      };

      // D. Intercept WebGL context creation to force preserveDrawingBuffer: true
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attributes) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          attributes = attributes || {};
          attributes.preserveDrawingBuffer = true;
        }
        return origGetContext.call(this, type, attributes);
      };

    })();
  `;

    doc.head.insertBefore(scriptEl, doc.head.firstChild);
}

// ---------------------------------------------------------------------------
// 4. AUDIO CAPTURE & ROUTING
// ---------------------------------------------------------------------------
function setupAudioCapture(iframe) {
    if (checkAudioInterval) clearInterval(checkAudioInterval);

    // Retrieve the correct shared audio context used by standard Cables Web Audio ops
    let cablesAudioCtx = null;
    try {
        cablesAudioCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (err) {
        cablesAudioCtx = CGL.AUDIO?.ctx || cgl.getAudioContext?.() || new (window.AudioContext || window.webkitAudioContext)();
    }

    checkAudioInterval = setInterval(() => {
        const win = iframe.contentWindow;
        if (!win) return;

        if (win._cablesAudioStream) {
            clearInterval(checkAudioInterval);
            checkAudioInterval = null;

            try {
                if (audioSourceNode) audioSourceNode.disconnect();
                audioSourceNode = cablesAudioCtx.createMediaStreamSource(win._cablesAudioStream);
                outAudio.set(audioSourceNode);
            } catch (err) {
                console.warn("Audio capture error:", err);
            }
        }
    }, 100);

    // Auto-resume AudioContext on click/interaction if suspended
    const resumeAudio = () => {
        const win = iframe.contentWindow;
        if (win && win._cablesAudioContexts) {
            win._cablesAudioContexts.forEach(ctx => {
                if (ctx.state === "suspended") ctx.resume();
            });
        }
        window.removeEventListener("click", resumeAudio);
    };
    window.addEventListener("click", resumeAudio);
}

// ---------------------------------------------------------------------------
// 5. FONT SHARING AND SYNCHRONIZATION
// ---------------------------------------------------------------------------
function copyFontFaceStyles(iframe) {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return;

    let cssRulesText = "";
    // Collect all @font-face rules declared in parent stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
        try {
            const sheet = document.styleSheets[i];
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) continue;
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule.type === CSSRule.FONT_FACE_RULE || rule.cssText.indexOf("@font-face") === 0) {
                    cssRulesText += rule.cssText + "\n";
                }
            }
        } catch (e) {
            // Silently ignore security errors from cross-origin CDN stylesheets
        }
    }

    if (cssRulesText) {
        let styleEl = iframeDoc.getElementById("cables-injected-fonts");
        if (!styleEl) {
            styleEl = iframeDoc.createElement("style");
            styleEl.id = "cables-injected-fonts";
            iframeDoc.head.appendChild(styleEl);
        }
        styleEl.textContent = cssRulesText;
    }
}

function syncParentFontsToIframe(iframe) {
    if (!iframe) return;
    const iframeDoc = iframe.contentDocument;
    const iframeWin = iframe.contentWindow;
    if (!iframeDoc || !iframeWin) return;

    // 1. Copy font-face styles to trigger loading inside the same-origin iframe
    copyFontFaceStyles(iframe);

    // 2. Recreate dynamically loaded JS FontFaces from parent registry inside the iframe
    if (window._cablesLoadedFonts && window._cablesLoadedFonts.length > 0 && iframeDoc.fonts) {
        window._cablesLoadedFonts.forEach(fontDef => {
            let alreadyExists = false;
            iframeDoc.fonts.forEach(f => {
                if (f.family === fontDef.family) {
                    alreadyExists = true;
                }
            });

            if (!alreadyExists && typeof iframeWin.FontFace === "function") {
                try {
                    let resolvedSource = fontDef.source;
                    if (typeof resolvedSource === "string") {
                        // Resolve relative/root-relative URLs inside url() to fully qualified absolute URLs using parent page URL
                        resolvedSource = resolvedSource.replace(/url\(['"]?([^'")]+)['"]?\)/gi, (match, url) => {
                            try {
                                const absoluteUrl = new URL(url, window.location.href).href;
                                return `url("${absoluteUrl}")`;
                            } catch (e) {
                                return match;
                            }
                        });
                    }

                    const fontFace = new iframeWin.FontFace(fontDef.family, resolvedSource, fontDef.descriptors);
                    iframeDoc.fonts.add(fontFace);
                    fontFace.load().then(() => {
                        if (typeof iframeWin.onMessageChange === "function") {
                            iframeWin.onMessageChange();
                        }
                        if (typeof iframeWin.redraw === "function") {
                            iframeWin.redraw();
                        }
                    }).catch(e => {
                        console.warn("Failed to load copied font inside iframe:", fontDef.family, e);
                    });
                } catch (e) {
                    console.warn("Failed to recreate font inside iframe:", fontDef.family, e);
                }
            }
        });
    }

    // 3. Wait for parent fonts to load, then wait for iframe's FontFaceSet to complete
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
        document.fonts.ready.then(() => {
            if (iframeDoc.fonts && typeof iframeDoc.fonts.ready?.then === "function") {
                iframeDoc.fonts.ready.then(() => {
                    const win = iframe.contentWindow;
                    if (win) {
                        if (typeof win.onMessageChange === "function") {
                            win.onMessageChange();
                        }
                        if (typeof win.redraw === "function") {
                            win.redraw();
                        }
                    }
                }).catch(() => {});
            }
        }).catch(() => {});
    }
}

// ---------------------------------------------------------------------------
// 6. DRAW LOOP & CLEANUP
// ---------------------------------------------------------------------------
function updateTextureFromIframe() {
    if (!iframeEl) return;

    try {
        const doc = iframeEl.contentDocument;
        if (!doc) return;

        // Directly query the canvas from the same-origin iframe content document
        const canvas = doc.querySelector("canvas");
        if (!canvas) return;

        const w = canvas.width;
        const h = canvas.height;
        if (w <= 0 || h <= 0) return;

        // Lazily initialize unique texture instance when canvas size is known and WebGL is active
        if (!cglTexture) {
            cglTexture = new CGL.Texture(cgl, { "name": "iframe_texture" });
            cglTexture.filter = CGL.Texture.FILTER_LINEAR;
            cglTexture.wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
            outTex.set(cglTexture);
        }

        if (cglTexture.width !== w || cglTexture.height !== h) {
            cglTexture.setSize(w, h);
        }

        gl.bindTexture(gl.TEXTURE_2D, cglTexture.tex);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, inFlipY.get());
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        // Direct upload of the same-origin HTML Canvas Element
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            canvas
        );

        gl.bindTexture(gl.TEXTURE_2D, null);

        outTex.setRef(cglTexture);
        outTextureUpdated.trigger();
    } catch (e) {
        // Silently catch layout readback exceptions during fast load transitions
    }
}

op.onAnimFrame = () => {
    // 1. Force a redraw of the Cables render loop if needed
    if (iframeEl && op.patch && typeof op.patch.renderOneFrame === "function") {
        op.patch.renderOneFrame();
    }

    // 2. Perform the canvas texture upload on every animation frame
    updateTextureFromIframe();
};

op.onDelete = () => {
    if (checkAudioInterval) clearInterval(checkAudioInterval);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    if (iframeEl) iframeEl.remove();
    if (broadcastChannel) broadcastChannel.close();
    if (audioSourceNode) audioSourceNode.disconnect();
    if (cglTexture) {
        try { cglTexture.delete(); } catch (e) {}
    }
    if (onParentFontsLoaded && document.fonts && typeof document.fonts.removeEventListener === "function") {
        try {
            document.fonts.removeEventListener("loadingdone", onParentFontsLoaded);
        } catch (e) {}
    }
};

// Bind dynamic parent font loaded listener
onParentFontsLoaded = () => {
    if (iframeEl) {
        syncParentFontsToIframe(iframeEl);
    }
};
if (document.fonts && typeof document.fonts.addEventListener === "function") {
    try {
        document.fonts.addEventListener("loadingdone", onParentFontsLoaded);
    } catch (e) {}
}

setupBroadcastChannel();
// Bootstrapping the initial call to create the iframe
setTimeout(updateIframe, 0);