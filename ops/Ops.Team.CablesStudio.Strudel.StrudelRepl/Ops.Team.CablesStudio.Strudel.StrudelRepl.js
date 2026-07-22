// Ops.Team.CablesStudio.Strudel.StrudelRepl.js
// HTML Wrapped Strudel REPL Operator for Cables.gl

const inShowUI = op.inBool("Show UI", true);
const inPlay = op.inBool("Play / Stop", true);
const inWidth = op.inFloat("Width", 800);
const inHeight = op.inFloat("Height", 500);
const inPosX = op.inFloat("Position X", 20.0);
const inPosY = op.inFloat("Position Y", 20.0);
const inOpacity = op.inFloat("Opacity", 1.0);
const defaultStrudelCss = `--background: #181825 !important;\n--lineBackground: #22222200 !important;\n--foreground: #cdd6f4 !important;\n--caret: #ffcc00 !important;\n--selection: rgba(128, 203, 196, 0.5) !important;\n--selectionMatch: #036dd626 !important;\n--lineHighlight: #00000050 !important;\n--gutterBackground: transparent !important;\n--gutterForeground: #8a919966 !important;`;
const inCssVars = op.inStringEditor("Strudel CSS Variables", defaultStrudelCss, "css");
const inCode = op.inStringEditor("Pattern Code", 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')\n.off(-1/8, set(speed("1.5").gain(.25)))\n\nn("<0 1 2 3 4>*8").scale(\'G4 minor\')\n.s("gm_lead_6_voice")', "js");
const inVolume = op.inFloat("Volume", 0.8);
const inPopupAudio = op.inBool("Popup Sound Output", false);

// Output Ports
const outElement = op.outObject("Element");
const outAudioNode = op.outObject("Audio Node");

op.setPortGroup("Controls", [inShowUI, inPlay]);
op.setPortGroup("Layout", [inWidth, inHeight, inPosX, inPosY, inOpacity]);
op.setPortGroup("Settings", [inCssVars, inCode]);
op.setPortGroup("Audio", [inVolume, inPopupAudio]);

let containerEl = null;
let replElement = null;
let styleElement = null;
let opGainNode = null;
let mediaSource = null;
let isAudioRouted = false;

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
      display: block !important;
      width: 100% !important;
      height: 100% !important;
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
    containerEl.style.display = "none";
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
  }
}

function ensureStrudelScriptsLoaded() {
  if (!document.getElementById("strudel-repl-bundle-script")) {
    // Intercept AudioContext BEFORE Strudel script runs
    interceptAudioContext();

    const script = document.createElement("script");
    script.id = "strudel-repl-bundle-script";
    script.src = "https://unpkg.com/@strudel/repl@latest";
    script.type = "module";
    document.head.appendChild(script);
  }
}

function initOpAudio() {
  if (!opGainNode) {
    let cablesCtx = null;
    try {
      cablesCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (e) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) cablesCtx = new AudioCtxClass();
    }
    
    if (cablesCtx) {
      opGainNode = cablesCtx.createGain();
      opGainNode.gain.setValueAtTime(inVolume.get(), cablesCtx.currentTime);
      outAudioNode.set(opGainNode);
    }
  }
}

function ensureAudioNodePatch() {
  if (!AudioNode.prototype._strudelPatched) {
    AudioNode.prototype._strudelPatched = true;
    const origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, output, input) {
      if (this.context && this.context.destinationNode) {
        if (destination === this.context.destination) {
          return origConnect.call(this, this.context.destinationNode, output, input);
        }
      }
      return origConnect.call(this, destination, output, input);
    };
  }
}

function setupStreamForContext(ctx) {
  if (!ctx || ctx._strudelStreamSetup) return;
  ctx._strudelStreamSetup = true;

  try {
    const streamDest = ctx.createMediaStreamDestination();
    const speakerGain = ctx.createGain();
    
    speakerGain.gain.setValueAtTime(
      inPopupAudio.get() ? 1.0 : 0.0,
      ctx.currentTime
    );
    speakerGain.connect(ctx.destination);

    const strudelMasterGain = ctx.createGain();
    strudelMasterGain.connect(speakerGain);
    strudelMasterGain.connect(streamDest);

    ctx.destinationNode = strudelMasterGain;
    
    if (!window._strudelDestinations) window._strudelDestinations = new Map();
    window._strudelDestinations.set(ctx, streamDest);
    
    if (!window._strudelSpeakerGains) window._strudelSpeakerGains = new Map();
    window._strudelSpeakerGains.set(ctx, speakerGain);
    
    setTimeout(() => {
      setupAudioRouting(ctx);
    }, 0);
  } catch (e) {
    op.log("Error setting up Strudel AudioContext stream:", e);
  }
}

function interceptAudioContext() {
  ensureAudioNodePatch();
  
  const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext && !window.AudioContext._strudelPatched) {
    window.AudioContext = function(...args) {
      const ctx = new OrigAudioContext(...args);
      setupStreamForContext(ctx);
      return ctx;
    };
    window.AudioContext.prototype = OrigAudioContext.prototype;
    window.AudioContext._strudelPatched = true;
    if (window.webkitAudioContext) window.webkitAudioContext = window.AudioContext;
  }
}

function setupAudioRouting(strudelCtx) {
  if (isAudioRouted || !strudelCtx) return;
  
  let streamDest = null;
  if (window._strudelDestinations) {
    streamDest = window._strudelDestinations.get(strudelCtx);
  }
  
  if (streamDest) {
    initOpAudio();
    
    let cablesCtx = null;
    try {
      cablesCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (e) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) cablesCtx = new AudioCtxClass();
    }
    
    if (cablesCtx && opGainNode) {
      try {
        if (mediaSource) {
          try { mediaSource.disconnect(); } catch (e) {}
        }
        mediaSource = cablesCtx.createMediaStreamSource(streamDest.stream);
        mediaSource.connect(opGainNode);
        isAudioRouted = true;
      } catch (e) {
        op.log("Error creating media stream source:", e);
      }
    }
  }
}

function mountContainer() {
  if (containerEl) return;
  initOpAudio();

  styleElement = document.createElement("style");
  styleElement.id = "strudel-container-style-" + op.id;
  document.head.appendChild(styleElement);

  containerEl = document.createElement("div");
  containerEl.id = "strudel-container-" + op.id;
  containerEl.className = "strudel-container";

  replElement = document.createElement("strudel-editor");
  replElement.id = "strudel-repl-" + op.id;
  const initialCode = inCode.get() || 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')';
  replElement.setAttribute("code", initialCode);

  containerEl.appendChild(replElement);
  document.body.appendChild(containerEl);

  outElement.set(containerEl);

  ensureStrudelScriptsLoaded();
  updateContainerPositionStyles();
}

function unmountContainer() {
  if (containerEl && containerEl.parentNode) {
    containerEl.parentNode.removeChild(containerEl);
  }
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
  containerEl = null;
  replElement = null;
  styleElement = null;
  outElement.set(null);
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
  if (opGainNode) {
    let cablesCtx = null;
    try {
      cablesCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (e) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) cablesCtx = new AudioCtxClass();
    }
    const currentTime = cablesCtx ? cablesCtx.currentTime : 0;
    opGainNode.gain.linearRampToValueAtTime(inVolume.get(), currentTime + 0.05);
  }
};

inPopupAudio.onChange = () => {
  const enabled = inPopupAudio.get();
  if (window._strudelSpeakerGains) {
    for (const [ctx, speakerGain] of window._strudelSpeakerGains.entries()) {
      try {
        speakerGain.gain.setValueAtTime(enabled ? 1.0 : 0.0, ctx.currentTime);
      } catch (e) {}
    }
  }
};

mountContainer();

op.onAnimFrame = () => {
  if (replElement && replElement.editor && replElement.editor.repl && replElement.editor.repl.audioContext) {
    setupAudioRouting(replElement.editor.repl.audioContext);
  }
};

op.onDelete = () => {
  unmountContainer();
  if (mediaSource) {
    try { mediaSource.disconnect(); } catch (e) {}
    mediaSource = null;
  }
  if (opGainNode) {
    try { opGainNode.disconnect(); } catch (e) {}
    opGainNode = null;
  }
  if (replElement && replElement.editor && replElement.editor.repl && replElement.editor.repl.audioContext) {
    const ctx = replElement.editor.repl.audioContext;
    if (window._strudelDestinations) window._strudelDestinations.delete(ctx);
    if (window._strudelSpeakerGains) window._strudelSpeakerGains.delete(ctx);
  }
};
