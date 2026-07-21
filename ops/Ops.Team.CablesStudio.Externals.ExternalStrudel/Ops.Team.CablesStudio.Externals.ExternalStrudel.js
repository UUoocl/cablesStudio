// Ops.Strudel.js

// Define Operator Inputs
const inOpen = op.inTriggerButton("Open REPL Window");
const inClose = op.inTriggerButton("Close REPL Window");
const inAutoOpen = op.inBool("Auto Open On Load", false);
const inWidth = op.inInt("Width", 1000);
const inHeight = op.inInt("Height", 750);
const inTitle = op.inString("Window Title", "Strudel REPL");
const defaultCssVarsObj = {
  "--background": "#22200000 !important",
  "--lineBackground": "#22222200 !important",
  "--foreground": "#fff !important",
  "--caret": "#ffcc00 !important",
  "--selection": "rgba(128, 203, 196, 0.5) !important",
  "--selectionMatch": "#036dd626 !important",
  "--lineHighlight": "#00000050 !important",
  "--gutterBackground": "transparent !important",
  "--gutterForeground": "#8a919966 !important"
};

const defaultCssVars = JSON.stringify(defaultCssVarsObj, null, 2);

const inCssVars = op.inStringEditor("Strudel CSS Variables", defaultCssVars, "json");
const inVolume = op.inFloat("Volume", 1.0);
const inPopupAudio = op.inBool("Popup Sound Output", true);

// Define Operator Outputs
const outIsOpen = op.outBoolNum("Is Open");
const outWindow = op.outObject("Window Object");
const outCanvas = op.outObject("Canvas Element");
const outAudioNode = op.outObject("Audio Node");

op.setPortGroup("Controls", [inOpen, inClose]);
op.setPortGroup("Settings", [inAutoOpen, inWidth, inHeight, inTitle, inCssVars]);
op.setPortGroup("Audio", [inVolume, inPopupAudio]);

let popupWindow = null;
let checkClosedInterval = null;
let currentBlobUrl = null;
let parentAudioCtx = null;
let mediaStreamSource = null;
let parentGainNode = null;

let themeChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    themeChannel = new BroadcastChannel("strudel_theme_channel");
    themeChannel.onmessage = (event) => {
      if (event.data && event.data.type === "request-theme") {
        broadcastCssVars();
      }
    };
  } catch (e) {}
}

function broadcastCssVars() {
  const cssData = inCssVars.get();
  if (themeChannel) {
    try {
      themeChannel.postMessage({ type: "update-theme", data: cssData });
    } catch (e) {}
  }
}

// Embedded sample.html content
const sampleHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Strudel REPL Sample (@strudel/repl)</title>
  
  <!-- Import Strudel REPL Web Component -->
  <script src="https://unpkg.com/@strudel/repl@latest"></script>

  <!-- Strudel Editor Theme CSS Variables -->
  <style id="custom-strudel-theme-vars">:root {
      --background: #22200000 !important;
--lineBackground: #22222200 !important;
--foreground: #fff !important;
--caret: #ffcc00 !important;
--selection: rgba(128, 203, 196, 0.5) !important;
--selectionMatch: #036dd626 !important;
--lineHighlight: #00000050 !important;
--gutterBackground: transparent !important;
--gutterForeground: #8a919966 !important;
    }</style>

  <style>
    :root {
      --bg-color: #121316;
      --card-bg: #1e202600;
      --accent-color: #5d8aff;
      --accent-hover: #749cff;
      --text-color: #e2e8f0;
      --text-muted: #94a3b8;
      --border-color: #2e323b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      padding: 24px;
      line-height: 1.5;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    header {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 16px;
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    p.subtitle a {
      color: var(--accent-color);
      text-decoration: none;
    }

    p.subtitle a:hover {
      text-decoration: underline;
    }

    .info-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px 20px;
    }

    .info-card h2 {
      font-size: 1.1rem;
      margin-bottom: 10px;
      color: var(--accent-color);
    }

    .shortcuts-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      list-style: none;
    }

    .shortcuts-list li {
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    kbd {
      background-color: #2b2e38;
      border: 1px solid #404554;
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 0.85em;
      color: #fff;
    }

    .editor-wrapper {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      padding: 4px 0;
    }

    /* Hide web component host tag height so created editor container sits at top */
    strudel-editor {
      display: none;
    }

    .cm-editor {
      min-height: 320px;
    }

    .controls-panel {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .controls-panel span {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-right: 8px;
    }

    button.btn {
      background-color: #2a2d37;
      color: #ffffff;
      border: 1px solid var(--border-color);
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.88rem;
      transition: all 0.2s ease;
    }

    button.btn:hover {
      background-color: var(--accent-color);
      border-color: var(--accent-color);
    }

    button.btn-play {
      background-color: #166534;
      border-color: #22c55e;
    }

    button.btn-play:hover {
      background-color: #15803d;
      border-color: #4ade80;
    }

    button.btn-stop {
      background-color: #991b1b;
      border-color: #ef4444;
    }

    button.btn-stop:hover {
      background-color: #b91c1c;
      border-color: #f87171;
    }
    canvas#test-canvas {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Strudel REPL Sample</h1>
    </header>

    <section class="info-card">
      <h2>Keyboard Controls & Shortcuts</h2>
      <ul class="shortcuts-list">
        <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> : <strong>Evaluate / Play</strong></li>
        <li><kbd>Ctrl</kbd> + <kbd>.</kbd> / <kbd>Cmd</kbd> + <kbd>.</kbd> : <strong>Hush / Stop</strong></li>
        <li><kbd>Click Play Button</kbd> : <strong>Initialize Audio & Start</strong></li>
      </ul>
    </section>

    <!-- Strudel REPL Web Component wrapped in HTML-in-Canvas -->
    <canvas layoutsubtree id="html-canvas" style="width: 100%; display: block;">
      <div class="editor-wrapper">
        <strudel-editor id="repl">
          <!--
// Sample Strudel Pattern (@strudel/repl)
setcps(1)

stack(
  s("bd*2, ~ rim*<1!3 2>, hh*4").bank('RolandTR909')
  .off(-1/8, set(speed("1.5").gain(.25)))
  .mask("<0!4 1!28>")
  ,
  n("<0 1 2 3 4>*8").scale('G4 minor')
  .s("gm_lead_6_voice")
  .clip(sine.range(.2,.8).slow(8))
  .jux(rev)
  .room(2)
  .sometimes(add(note("12")))
  .lpf(perlin.range(200,20000).slow(4))
)
-->
        </strudel-editor>
      </div>
    </canvas>

    <!-- Programmatic Playback & Preset Controls -->
    <div class="controls-panel">
      <span>Playback Controls:</span>
      <button class="btn btn-play" id="btn-play">Play / Evaluate</button>
      <button class="btn btn-stop" id="btn-stop">Stop / Hush</button>

      <span style="margin-left: 16px;">Live Sound Updates:</span>
      <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; cursor: pointer; color: var(--text-color);">
        <input type="checkbox" id="chk-live-eval" checked style="cursor: pointer; accent-color: var(--accent-color);" />
        Auto-update sound on live edits
      </label>

      <span style="margin-left: 16px;">Presets:</span>
      <button class="btn" id="btn-preset-1">Synth & Drums</button>
      <button class="btn" id="btn-preset-2">Arpeggio Pattern</button>
      <button class="btn" id="btn-preset-3">Minimal Beat</button>
    </div>
  </div>

  <script>
    const replElement = document.getElementById('repl');
    const chkLiveEval = document.getElementById('chk-live-eval');

    // Helper to apply CSS Theme variables from JSON or object once loaded
    window.applyStrudelTheme = function(vars) {
      if (!vars) return;
      let obj = vars;
      if (typeof vars === 'string') {
        try {
          obj = JSON.parse(vars);
        } catch (e) {
          obj = null;
        }
      }
      let cssString = '';
      if (obj && typeof obj === 'object') {
        const rules = Object.entries(obj)
          .map(function(pair) { return '  ' + pair[0] + ': ' + pair[1] + ';'; })
          .join('\\n');
        cssString = ':root, strudel-editor, .editor-wrapper, .cm-editor {\\n' + rules + '\\n}';
      } else if (typeof vars === 'string') {
        cssString = vars;
      }

      let styleEl = document.getElementById('custom-strudel-theme-vars');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-strudel-theme-vars';
      }
      styleEl.textContent = cssString;
      document.head.appendChild(styleEl);
    };

    // Web Audio Stream Capture & Speaker Control
    window.strudelAudioStream = null;
    window.strudelAudioContext = null;
    window.popupSpeakerGain = null;
    window.streamDestNode = null;
    window.popupSoundEnabled = true;

    window.setPopupSoundOutput = function(enabled) {
      window.popupSoundEnabled = !!enabled;
      if (window.popupSpeakerGain && window.strudelAudioContext) {
        try {
          window.popupSpeakerGain.gain.setValueAtTime(
            window.popupSoundEnabled ? 1.0 : 0.0,
            window.strudelAudioContext.currentTime
          );
        } catch (e) {}
      }
    };

    function setupStreamForContext(ctx) {
      if (!ctx || ctx._strudelStreamSetup) return;
      ctx._strudelStreamSetup = true;
      window.strudelAudioContext = ctx;

      try {
        const streamDest = ctx.createMediaStreamDestination();
        const speakerGain = ctx.createGain();
        speakerGain.gain.setValueAtTime(
          window.popupSoundEnabled ? 1.0 : 0.0,
          ctx.currentTime
        );
        speakerGain.connect(ctx.destination);

        const strudelMasterGain = ctx.createGain();
        strudelMasterGain.connect(speakerGain);
        strudelMasterGain.connect(streamDest);

        ctx.destinationNode = strudelMasterGain;
        window.popupSpeakerGain = speakerGain;
        window.streamDestNode = streamDest;
        window.strudelAudioStream = streamDest.stream;

        const origConnect = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function(destination, output, input) {
          if (destination === ctx.destination) {
            return origConnect.call(this, strudelMasterGain, output, input);
          }
          return origConnect.call(this, destination, output, input);
        };

        window.dispatchEvent(new CustomEvent('strudel-audio-ready'));
      } catch (e) {
        console.warn('Error setting up Strudel WebAudio stream:', e);
      }
    }

    const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OrigAudioContext) {
      window.AudioContext = function(...args) {
        const ctx = new OrigAudioContext(...args);
        setupStreamForContext(ctx);
        return ctx;
      };
      window.AudioContext.prototype = OrigAudioContext.prototype;
      if (window.webkitAudioContext) window.webkitAudioContext = window.AudioContext;
    }

    // Detect when Strudel REPL has finished loading
    window.isStrudelLoaded = false;
    function checkStrudelLoaded() {
      if (replElement && replElement.editor) {
        window.isStrudelLoaded = true;
        if (replElement.editor.repl && replElement.editor.repl.audioContext) {
          setupStreamForContext(replElement.editor.repl.audioContext);
        }
        window.dispatchEvent(new CustomEvent('strudel-loaded'));
      } else {
        setTimeout(checkStrudelLoaded, 50);
      }
    }
    checkStrudelLoaded();

    // BroadcastChannel theme synchronization
    if ('BroadcastChannel' in window) {
      const themeChannel = new BroadcastChannel('strudel_theme_channel');
      themeChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'update-theme') {
          window.applyStrudelTheme(event.data.data);
        }
      };
      window.addEventListener('strudel-loaded', () => {
        themeChannel.postMessage({ type: 'request-theme' });
      });
    }

    // Setup HTML-in-Canvas feature handler with High-DPI resolution scaling
    const htmlCanvas = document.getElementById('html-canvas');
    const editorWrapper = document.querySelector('.editor-wrapper');
    
    if (htmlCanvas && htmlCanvas.getContext) {
      const updateCanvasResolution = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = htmlCanvas.getBoundingClientRect();
        const contentHeight = editorWrapper ? editorWrapper.offsetHeight : rect.height;
        const targetWidth = Math.max(300, Math.round(rect.width * dpr));
        const targetHeight = Math.max(300, Math.round(contentHeight * dpr));
        
        if (htmlCanvas.width !== targetWidth || htmlCanvas.height !== targetHeight) {
          htmlCanvas.width = targetWidth;
          htmlCanvas.height = targetHeight;
        }
      };

      updateCanvasResolution();
      const resizeObserver = new ResizeObserver(() => {
        updateCanvasResolution();
        if (typeof htmlCanvas.requestPaint === 'function') {
          htmlCanvas.requestPaint();
        }
      });
      resizeObserver.observe(htmlCanvas);
      if (editorWrapper) resizeObserver.observe(editorWrapper);

      const ctx = htmlCanvas.getContext('2d');
      if (ctx && typeof ctx.drawElementImage === 'function') {
        htmlCanvas.onpaint = () => {
          updateCanvasResolution();
          ctx.reset();
          const targetEl = editorWrapper || replElement;
          const transform = ctx.drawElementImage(targetEl, 0, 0);
          if (transform && targetEl) {
            targetEl.style.transform = transform.toString();
          }
        };
      }
    }

    // Automatically remove unnecessary test-canvas created by Strudel
    const removeUnnecessaryCanvas = () => {
      const testCanvas = document.getElementById('test-canvas');
      if (testCanvas) {
        testCanvas.remove();
      }
    };
    removeUnnecessaryCanvas();
    const canvasObserver = new MutationObserver(removeUnnecessaryCanvas);
    canvasObserver.observe(document.body, { childList: true, subtree: true });

    // Playback Controls
    document.getElementById('btn-play').addEventListener('click', async () => {
      if (replElement.editor) {
        if (replElement.editor.repl && replElement.editor.repl.audioContext) {
          setupStreamForContext(replElement.editor.repl.audioContext);
        }
        await replElement.editor.evaluate();
      }
    });

    document.getElementById('btn-stop').addEventListener('click', async () => {
      if (replElement.editor) {
        await replElement.editor.stop();
      }
    });

    // Live Auto-Evaluation on User Edits
    let liveEvalTimeout = null;
    function scheduleLiveEval() {
      if (!chkLiveEval.checked) return;
      clearTimeout(liveEvalTimeout);
      liveEvalTimeout = setTimeout(async () => {
        if (replElement.editor && replElement.editor.repl && replElement.editor.repl.scheduler.started) {
          try {
            await replElement.editor.evaluate();
          } catch (e) {
            console.warn('Live eval error:', e);
          }
        }
      }, 350);
    }

    // Listen to typing & editor input events
    replElement.addEventListener('input', scheduleLiveEval);
    replElement.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) {
        return;
      }
      scheduleLiveEval();
    });

    const presets = {
      preset1: \`// Preset 1: Synth & Drums
setcps(1)
stack(
  s("bd*2, ~ rim*<1!3 2>, hh*4").bank('RolandTR909')
  .off(-1/8, set(speed("1.5").gain(.25))),
  n("<0 1 2 3 4>*8").scale('G4 minor')
  .s("gm_lead_6_voice")
  .clip(sine.range(.2,.8).slow(8))
  .jux(rev)
  .room(2)
  .sometimes(add(note("12")))
  .lpf(perlin.range(200,20000).slow(4))
)\`,
      preset2: \`// Preset 2: Arpeggio Pattern
setcps(0.8)
note("c3 e3 g3 b3 c4 b3 g3 e3")
  .s("sawtooth")
  .cutoff(perlin.range(400, 4000).slow(8))
  .decay(0.15)
  .sustain(0)
  .room(0.5)\`,
      preset3: \`// Preset 3: Minimal Beat
setcps(1.2)
stack(
  s("bd hh sd hh"),
  s("~ cp").room(0.3)
)\`
    };

    function loadCode(code) {
      if (replElement.editor) {
        replElement.editor.setCode(code);
        scheduleLiveEval();
      } else {
        replElement.setAttribute('code', code);
      }
    }

    document.getElementById('btn-preset-1').addEventListener('click', () => loadCode(presets.preset1));
    document.getElementById('btn-preset-2').addEventListener('click', () => loadCode(presets.preset2));
    document.getElementById('btn-preset-3').addEventListener('click', () => loadCode(presets.preset3));
  </script>
</body>
</html>
`;

function cleanupParentAudio() {
  outAudioNode.set(null);
  if (mediaStreamSource) {
    try { mediaStreamSource.disconnect(); } catch (e) {}
    mediaStreamSource = null;
  }
  if (parentGainNode) {
    try { parentGainNode.disconnect(); } catch (e) {}
    parentGainNode = null;
  }
  parentAudioCtx = null;
}

function setupParentAudioStream() {
  if (!popupWindow || popupWindow.closed) return;

  if (typeof popupWindow.setPopupSoundOutput === "function") {
    popupWindow.setPopupSoundOutput(inPopupAudio.get());
  }

  const stream = popupWindow.strudelAudioStream;
  if (!stream || mediaStreamSource) return;

  if (!parentAudioCtx) {
    try {
      parentAudioCtx = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (err) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) parentAudioCtx = new AudioCtxClass();
    }
  }

  if (!parentAudioCtx) return;

  if (parentAudioCtx.state === "suspended") {
    parentAudioCtx.resume().catch((err) => { op.log("Failed to resume parent AudioContext:", err); });
  }

  if (!parentGainNode) {
    parentGainNode = parentAudioCtx.createGain();
    parentGainNode.gain.setValueAtTime(inVolume.get(), parentAudioCtx.currentTime);
  }

  try {
    mediaStreamSource = parentAudioCtx.createMediaStreamSource(stream);
    mediaStreamSource.connect(parentGainNode);
    outAudioNode.set(parentGainNode);
  } catch (e) {
    op.log("Error connecting MediaStream to parent AudioContext:", e);
  }
}

function startCheckClosedTimer() {
  if (checkClosedInterval) clearInterval(checkClosedInterval);
  checkClosedInterval = setInterval(() => {
    if (popupWindow) {
      if (popupWindow.closed) {
        popupWindow = null;
        outIsOpen.set(false);
        outWindow.set(null);
        outCanvas.set(null);
        cleanupParentAudio();
        if (checkClosedInterval) clearInterval(checkClosedInterval);
      } else {
        outIsOpen.set(true);
        outWindow.set(popupWindow);
        const canvasEl = popupWindow.document ? popupWindow.document.getElementById("html-canvas") : null;
        outCanvas.set(canvasEl);
        setupParentAudioStream();
      }
    }
  }, 500);
}

function openPopupWindow() {
  if (op.setUiError) op.setUiError("popup_error", null);

  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus();
    outIsOpen.set(true);
    outWindow.set(popupWindow);
    const canvasEl = popupWindow.document ? popupWindow.document.getElementById("html-canvas") : null;
    outCanvas.set(canvasEl);
    setupParentAudioStream();
    return;
  }

  const w = inWidth.get() || 1000;
  const h = inHeight.get() || 750;
  const title = inTitle.get() || "Strudel REPL";

  const left = Math.max(0, (window.screen.width - w) / 2);
  const top = Math.max(0, (window.screen.height - h) / 2);

  const windowFeatures = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

  // Create Blob URL for clean document parsing without parser-blocking document.write
  if (currentBlobUrl) {
    try { URL.revokeObjectURL(currentBlobUrl); } catch (e) { }
  }
  const blob = new Blob([sampleHtmlContent], { type: "text/html;charset=utf-8" });
  currentBlobUrl = URL.createObjectURL(blob);

  try {
    popupWindow = window.open(currentBlobUrl, title, windowFeatures);
  } catch (err) {
    if (op.setUiError) op.setUiError("popup_error", "Failed to open popup window: " + err.message);
    outIsOpen.set(false);
    outCanvas.set(null);
    cleanupParentAudio();
    return;
  }

  if (!popupWindow) {
    if (op.setUiError) op.setUiError("popup_error", "Popup window blocked by browser. Please allow popups for this site.");
    outIsOpen.set(false);
    outCanvas.set(null);
    cleanupParentAudio();
    return;
  }

  popupWindow.focus();
  applyThemeWhenStrudelLoaded();

  outIsOpen.set(true);
  outWindow.set(popupWindow);
  const canvasEl = popupWindow.document ? popupWindow.document.getElementById("html-canvas") : null;
  outCanvas.set(canvasEl);
  startCheckClosedTimer();
}

function updateCssVars() {
  broadcastCssVars();
  if (popupWindow && !popupWindow.closed && popupWindow.document) {
    if (typeof popupWindow.applyStrudelTheme === "function") {
      popupWindow.applyStrudelTheme(inCssVars.get());
    } else {
      let styleEl = popupWindow.document.getElementById("custom-strudel-theme-vars");
      if (!styleEl) {
        styleEl = popupWindow.document.createElement("style");
        styleEl.id = "custom-strudel-theme-vars";
        popupWindow.document.head.appendChild(styleEl);
      }
      try {
        const obj = JSON.parse(inCssVars.get());
        const rules = Object.entries(obj).map(function (pair) { return "  " + pair[0] + ": " + pair[1] + ";"; }).join("\n");
        styleEl.textContent = ":root, strudel-editor, .editor-wrapper, .cm-editor {\n" + rules + "\n}";
      } catch (e) {
        styleEl.textContent = inCssVars.get() || "";
      }
      popupWindow.document.head.appendChild(styleEl);
    }
  }
}

function applyThemeWhenStrudelLoaded() {
  broadcastCssVars();
  if (!popupWindow || popupWindow.closed) return;

  if (popupWindow.isStrudelLoaded) {
    updateCssVars();
  } else {
    let attempts = 0;
    const pollInterval = setInterval(() => {
      attempts++;
      if (!popupWindow || popupWindow.closed) {
        clearInterval(pollInterval);
        return;
      }
      if (popupWindow.isStrudelLoaded || (popupWindow.document && popupWindow.document.getElementById('repl')?.editor)) {
        clearInterval(pollInterval);
        updateCssVars();
      } else if (attempts > 50) {
        clearInterval(pollInterval);
        updateCssVars();
      }
    }, 100);
  }
}

function closePopupWindow() {
  if (popupWindow && !popupWindow.closed) {
    popupWindow.close();
    popupWindow = null;
  }
  if (currentBlobUrl) {
    try { URL.revokeObjectURL(currentBlobUrl); } catch (e) { }
    currentBlobUrl = null;
  }
  outIsOpen.set(false);
  outWindow.set(null);
  outCanvas.set(null);
  cleanupParentAudio();
  if (checkClosedInterval) clearInterval(checkClosedInterval);
}

// Event Bindings
inOpen.onTriggered = () => {
  openPopupWindow();
};

inClose.onTriggered = () => {
  closePopupWindow();
};

const handleCssVarsChange = () => {
  broadcastCssVars();
  applyThemeWhenStrudelLoaded();
};

inCssVars.onChange = handleCssVarsChange;
inCssVars.onValueChanged = handleCssVarsChange;

inVolume.onChange = () => {
  if (parentGainNode && parentAudioCtx) {
    parentGainNode.gain.linearRampToValueAtTime(inVolume.get(), parentAudioCtx.currentTime + 0.05);
  }
};

inPopupAudio.onChange = () => {
  if (popupWindow && !popupWindow.closed && typeof popupWindow.setPopupSoundOutput === "function") {
    popupWindow.setPopupSoundOutput(inPopupAudio.get());
  }
};

op.onLoaded = () => {
  if (inAutoOpen.get()) {
    openPopupWindow();
  }
};

op.onDelete = () => {
  if (themeChannel) {
    try { themeChannel.close(); } catch (e) {}
  }
  closePopupWindow();
  cleanupParentAudio();
};
