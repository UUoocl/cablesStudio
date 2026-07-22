// Ops.Team.CablesStudio.Strudel.IframeStrudel.js
// HTML-in-Canvas Wrapped Strudel REPL Operator for Cables.gl

const inShowUI = op.inBool("Show UI", true);
const inPlay = op.inBool("Play / Stop", true);
const inWidth = op.inFloat("Width", 800);
const inHeight = op.inFloat("Height", 500);
const inPosX = op.inFloat("Position X", 20.0);
const inPosY = op.inFloat("Position Y", 20.0);
const inOpacity = op.inFloat("Opacity", 1.0);
const defaultStrudelCss = `--background: #00ff0000 !important;\n--lineBackground: #22222200 !important;\n--foreground: #fff !important;\n--caret: #ffcc00 !important;\n--selection: rgba(128, 203, 196, 0.5) !important;\n--selectionMatch: #036dd626 !important;\n--lineHighlight: #00000050 !important;\n--gutterBackground: transparent !important;\n--gutterForeground: #8a919966 !important;`;
const inCssVars = op.inStringEditor("Strudel CSS Variables", defaultStrudelCss, "css");
const inCode = op.inStringEditor("Pattern Code", 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')\n.off(-1/8, set(speed("1.5").gain(.25)))\n\nn("<0 1 2 3 4>*8").scale(\'G4 minor\')\n.s("gm_lead_6_voice")', "js");
const inVolume = op.inFloat("Volume", 0.8);
const inFlipY = op.inBool("Flip Y", false);

// Output Ports
const outIsActive = op.outBoolNum("Is Active", false);
const outCanvas = op.outObject("Canvas Element");
const outElement = op.outObject("Container Element");
const outTexture = op.outTexture("Texture");
const outTextureUpdated = op.outTrigger("Texture Updated");
const outAudioNode = op.outObject("Audio Node");

let containerEl = null;
let htmlCanvas = null;
let editorWrapper = null;
let replElement = null;
let styleElement = null;
let cgl = op.patch.cgl;
let cglTex = null;
let currentBitmap = null;

let parentAudioContext = null;
let parentGainNode = null;

function cleanGPU() {
  if (cglTex) {
    try { cglTex.delete(); } catch (e) {}
    cglTex = null;
  }
}

function updateGpuTexture(bitmap) {
  if (!bitmap || !cgl) return;
  const gl = cgl.gl;
  if (!gl) return;

  const w = bitmap.width || Math.round(inWidth.get());
  const h = bitmap.height || Math.round(inHeight.get());
  if (w <= 0 || h <= 0) return;

  if (!cglTex) {
    cglTex = CGL.Texture.getEmptyTexture(cgl);
    cglTex.setSize(w, h);
    cglTex.filter = CGL.Texture.FILTER_LINEAR;
    cglTex.wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
  } else if (cglTex.width !== w || cglTex.height !== h) {
    cglTex.setSize(w, h);
  }

  cgl.pushStyle();
  gl.bindTexture(gl.TEXTURE_2D, cglTex.tex);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, inFlipY.get());
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    bitmap
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
  cgl.popStyle();

  outTexture.setRef(cglTex);
  outTextureUpdated.trigger();
}

if (cgl) {
  outTexture.setRef(CGL.Texture.getEmptyTexture(cgl));
}

function initAudio() {
  if (!parentAudioContext) {
    try {
      parentAudioContext = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (e) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) parentAudioContext = new AudioCtxClass();
    }
  }

  if (parentAudioContext) {
    if (!parentGainNode) {
      parentGainNode = parentAudioContext.createGain();
      parentGainNode.gain.setValueAtTime(inVolume.get(), parentAudioContext.currentTime);
    }
    outAudioNode.set(parentGainNode);
  }
}

function updateCssStyles() {
  if (!styleElement) return;
  const userCss = inCssVars.get() || defaultStrudelCss;
  styleElement.textContent = `
    #strudel-container-${op.id} {
      width: ${inWidth.get()}px;
      height: ${inHeight.get()}px;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      background: #181825;
      color: #cdd6f4;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      ${userCss}
    }
    #strudel-container-${op.id} strudel-editor {
      display: none !important;
    }
    #strudel-container-${op.id} .cm-editor {
      min-height: 100% !important;
      height: 100% !important;
      flex: 1 !important;
    }
    #strudel-container-${op.id} .cm-scroller {
      height: 100% !important;
    }
    #strudel-container-${op.id} canvas#test-canvas, 
    #strudel-container-${op.id} canvas[style*="fixed"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
}

function updateContainerPositionStyles() {
  if (!containerEl) return;
  const opacity = inOpacity.get();
  const w = inWidth.get();
  const h = inHeight.get();
  const posX = inPosX.get();
  const posY = inPosY.get();

  containerEl.style.width = w + "px";
  containerEl.style.height = h + "px";
  updateCssStyles();

  if (!inShowUI.get()) {
    containerEl.style.display = "flex";
    containerEl.style.position = "fixed";
    containerEl.style.top = "0px";
    containerEl.style.left = "0px";
    containerEl.style.right = "auto";
    containerEl.style.bottom = "auto";
    containerEl.style.opacity = "0.0001";
    containerEl.style.pointerEvents = "none";
    containerEl.style.zIndex = "-999999";
    containerEl.style.transform = "";
  } else {
    containerEl.style.display = "flex";
    containerEl.style.position = "fixed";
    containerEl.style.left = posX + "px";
    containerEl.style.top = posY + "px";
    containerEl.style.right = "auto";
    containerEl.style.bottom = "auto";
    containerEl.style.opacity = opacity;
    containerEl.style.pointerEvents = "auto";
    containerEl.style.zIndex = "9999";
    containerEl.style.transform = "";
  }
}

function ensureStrudelScriptsLoaded() {
  if (!document.getElementById("strudel-repl-bundle-script")) {
    const script = document.createElement("script");
    script.id = "strudel-repl-bundle-script";
    script.src = "https://unpkg.com/@strudel/repl@latest";
    script.type = "module";
    document.head.appendChild(script);
  }
}

function mountContainer() {
  if (containerEl) return;
  initAudio();

  styleElement = document.createElement("style");
  styleElement.id = "strudel-container-style-" + op.id;
  document.head.appendChild(styleElement);

  containerEl = document.createElement("div");
  containerEl.id = "strudel-container-" + op.id;
  containerEl.className = "strudel-container";

  // HTML-in-Canvas Feature: wrap editor DOM inside <canvas layoutsubtree>
  htmlCanvas = document.createElement("canvas");
  htmlCanvas.id = "strudel-html-canvas-" + op.id;
  htmlCanvas.setAttribute("layoutsubtree", "");
  htmlCanvas.style.width = "100%";
  htmlCanvas.style.height = "100%";
  htmlCanvas.style.display = "block";

  editorWrapper = document.createElement("div");
  editorWrapper.id = "strudel-editor-wrapper-" + op.id;
  editorWrapper.style.width = "100%";
  editorWrapper.style.height = "100%";
  editorWrapper.style.display = "flex";
  editorWrapper.style.flexDirection = "column";

  replElement = document.createElement("strudel-editor");
  replElement.id = "strudel-repl-" + op.id;
  const initialCode = inCode.get() || 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')';
  replElement.setAttribute("code", initialCode);

  editorWrapper.appendChild(replElement);
  htmlCanvas.appendChild(editorWrapper);
  containerEl.appendChild(htmlCanvas);
  document.body.appendChild(containerEl);

  outCanvas.set(htmlCanvas);
  outElement.set(containerEl);
  outIsActive.set(true);

  ensureStrudelScriptsLoaded();
  setupHtmlInCanvasPainter();
  updateContainerPositionStyles();
}

function setupHtmlInCanvasPainter() {
  if (!htmlCanvas || !htmlCanvas.getContext) return;
  const ctx = htmlCanvas.getContext("2d");
  if (ctx && typeof ctx.drawElementImage === "function") {
    htmlCanvas.onpaint = () => {
      try {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(300, Math.round(inWidth.get() * dpr));
        const h = Math.max(300, Math.round(inHeight.get() * dpr));
        if (htmlCanvas.width !== w || htmlCanvas.height !== h) {
          htmlCanvas.width = w;
          htmlCanvas.height = h;
        }
        if (typeof ctx.reset === "function") ctx.reset();
        const targetEl = editorWrapper || replElement;
        if (targetEl && targetEl.parentNode === htmlCanvas) {
          const transform = ctx.drawElementImage(targetEl, 0, 0);
          if (transform && targetEl) {
            targetEl.style.transform = transform.toString();
          }
        }
      } catch (e) {}
    };
  }
}

function unmountContainer() {
  cleanGPU();
  if (containerEl && containerEl.parentNode) {
    containerEl.parentNode.removeChild(containerEl);
  }
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
  containerEl = null;
  htmlCanvas = null;
  editorWrapper = null;
  replElement = null;
  styleElement = null;
  outCanvas.set(null);
  outElement.set(null);
  outIsActive.set(false);
}

function evaluatePattern() {
  if (replElement && replElement.editor) {
    if (replElement.editor.evaluate) {
      replElement.editor.evaluate();
    }
  }
}

function stopPattern() {
  if (replElement && replElement.editor) {
    if (replElement.editor.stop) {
      replElement.editor.stop();
    }
  }
}

let isCapturingFrame = false;
let offscreenCanvas = null;
let offscreenCtx = null;

function renderTextureFrame() {
  if (isCapturingFrame || !htmlCanvas) return;
  try {
    if (htmlCanvas.width > 0 && htmlCanvas.height > 0) {
      isCapturingFrame = true;
      if (typeof htmlCanvas.requestPaint === "function") {
        try { htmlCanvas.requestPaint(); } catch (e) {}
      }
      createImageBitmap(htmlCanvas).then(bitmap => {
        if (bitmap) {
          currentBitmap = bitmap;
          updateGpuTexture(currentBitmap);
        }
      }).catch(e => {
        rasterizeEditorFallback();
      }).finally(() => { isCapturingFrame = false; });
      return;
    }
    rasterizeEditorFallback();
  } catch (e) {
    isCapturingFrame = false;
  }
}

function rasterizeEditorFallback() {
  const targetEl = containerEl ? (containerEl.querySelector('.cm-editor') || containerEl) : null;
  if (!targetEl) return;
  const w = Math.round(inWidth.get() || 800);
  const h = Math.round(inHeight.get() || 500);
  if (!offscreenCanvas) offscreenCanvas = document.createElement("canvas");
  if (offscreenCanvas.width !== w || offscreenCanvas.height !== h) {
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    offscreenCtx = offscreenCanvas.getContext("2d");
  }
  
  const htmlString = targetEl.outerHTML;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="color:#cdd6f4;background:#181825;font-family:sans-serif;width:100%;height:100%;">${htmlString}</div>` +
    `</foreignObject></svg>`;
    
  const img = new Image();
  img.onload = () => {
    if (offscreenCtx) {
      offscreenCtx.clearRect(0, 0, w, h);
      offscreenCtx.drawImage(img, 0, 0);
      createImageBitmap(offscreenCanvas).then(bitmap => {
        if (bitmap) {
          currentBitmap = bitmap;
          updateGpuTexture(currentBitmap);
        }
      }).catch(e => {});
    }
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

inShowUI.onChange = () => updateContainerPositionStyles();
inWidth.onChange = () => updateContainerPositionStyles();
inHeight.onChange = () => updateContainerPositionStyles();
inPosX.onChange = () => updateContainerPositionStyles();
inPosY.onChange = () => updateContainerPositionStyles();
inOpacity.onChange = () => updateContainerPositionStyles();
inCssVars.onChange = () => updateCssStyles();

inPlay.onChange = () => {
  if (inPlay.get()) evaluatePattern();
  else stopPattern();
};

inCode.onChange = () => {
  if (replElement) {
    replElement.setAttribute("code", inCode.get());
    if (replElement.editor && typeof replElement.editor.setCode === "function") {
      replElement.editor.setCode(inCode.get());
    }
  }
};

inVolume.onChange = () => {
  if (parentGainNode && parentAudioContext) {
    parentGainNode.gain.linearRampToValueAtTime(inVolume.get(), parentAudioContext.currentTime + 0.05);
  }
};

mountContainer();

op.onAnimFrame = () => {
  renderTextureFrame();
};

op.onDelete = () => {
  unmountContainer();
  if (parentGainNode) try { parentGainNode.disconnect(); } catch (e) {}
};
