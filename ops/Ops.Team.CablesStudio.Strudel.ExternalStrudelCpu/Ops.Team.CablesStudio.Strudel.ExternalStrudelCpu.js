// Ops.Strudel.js

// Define Operator Inputs
const inOpen = op.inTriggerButton("Open REPL Window");
const inClose = op.inTriggerButton("Close REPL Window");
const inPlay = op.inBool("Play / Stop", true);
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

const defaultPatternCode = `// Sample Strudel Pattern (@strudel/repl)
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
)`;

const inCssVars = op.inStringEditor("Strudel CSS Variables", defaultCssVars, "json");
const inPattern = op.inStringEditor("Pattern Code", defaultPatternCode, "js");
const inVolume = op.inFloat("Volume", 1.0);
const inPopupAudio = op.inBool("Popup Sound Output", true);

// Define Operator Outputs
const outIsOpen = op.outBoolNum("Is Open");
const outWindow = op.outObject("Window Object");
const outCanvas = op.outObject("Canvas Element");
const outAudioNode = op.outObject("Audio Node");
const outPattern = op.outString("Current Pattern");

outPattern.set(defaultPatternCode);

// Telemetry Outputs
const outIsPlaying = op.outBoolNum("Is Playing");
const outActiveNotes = op.outArray("Active Notes");
const outActiveMidi = op.outArray("Active MIDI Notes");
const outActiveNames = op.outArray("Active Note Names");
const outActiveCount = op.outNumber("Active Note Count");
const outOnNote = op.outTrigger("On Note Event");
const outCPS = op.outNumber("CPS");
const outBPM = op.outNumber("BPM");
const outCycleProgress = op.outNumber("Cycle Progress");
const outCurrentCycle = op.outNumber("Current Cycle");
const outOnCycle = op.outTrigger("On Cycle");
const outLastEvent = op.outObject("Last Event");
const outLastSound = op.outString("Last Sound");
const outError = op.outString("Error");

op.setPortGroup("Controls", [inOpen, inClose, inPlay]);
op.setPortGroup("Settings", [inAutoOpen, inWidth, inHeight, inTitle, inCssVars, inPattern]);
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

let patternChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    patternChannel = new BroadcastChannel("strudel_pattern_channel");
    patternChannel.onmessage = (event) => {
      if (event.data) {
        if (event.data.type === "request-pattern") {
          broadcastPattern();
        } else if (event.data.type === "pattern-changed") {
          if (event.data.data !== undefined) {
            outPattern.set(event.data.data);
          }
        }
      }
    };
  } catch (e) {}
}

function broadcastPattern() {
  const code = inPattern.get() || defaultPatternCode;
  outPattern.set(code);
  if (patternChannel) {
    try {
      patternChannel.postMessage({ type: "update-pattern", data: code });
    } catch (e) {}
  }
}

let controlChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    controlChannel = new BroadcastChannel("strudel_control_channel");
    controlChannel.onmessage = (event) => {
      if (event.data && event.data.type === "request-play") {
        broadcastPlayState();
      }
    };
  } catch (e) {}
}

function broadcastPlayState() {
  const play = inPlay.get();
  if (controlChannel) {
    try {
      controlChannel.postMessage({ type: "set-play", data: play });
    } catch (e) {}
  }
  if (popupWindow && !popupWindow.closed && typeof popupWindow.setPlayState === "function") {
    popupWindow.setPlayState(play);
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

    // Real-time Telemetry & Active Notes Tracking Hub
    window.strudelState = {
      isPlaying: false,
      cps: 1.0,
      bpm: 120.0,
      cycle: 0.0,
      cycleProgress: 0.0,
      activeNotes: [],
      activeMidiNotes: [],
      activeNoteNames: [],
      activeNoteCount: 0,
      lastEvent: null,
      lastSound: "",
      error: "",
      noteEventCounter: 0,
      cycleEventCounter: 0
    };

    let activeNotesList = [];

    function midiToNoteName(midi) {
      if (typeof midi !== 'number' || isNaN(midi)) return "";
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(midi / 12) - 1;
      const noteName = names[Math.round(midi) % 12];
      return noteName + octave;
    }

    function parseMidiNote(n, freq) {
      if (typeof n === 'number' && !isNaN(n)) return Math.round(n);
      if (typeof freq === 'number' && freq > 0) {
        return Math.round(69 + 12 * Math.log2(freq / 440));
      }
      if (n === null || n === undefined || n === "") return null;
      if (typeof n === 'string') {
        const s = n.trim().toLowerCase();
        if (!isNaN(s) && s !== "") return Math.round(parseFloat(s));
        const noteMap = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
        const match = s.match(/^([a-g])([#s|b]?)(-?\d+)?$/);
        if (match) {
          let semitone = noteMap[match[1]];
          if (match[2] === '#' || match[2] === 's') semitone += 1;
          if (match[2] === 'b') semitone -= 1;
          const octave = match[3] !== undefined ? parseInt(match[3], 10) : 3;
          return (octave + 1) * 12 + semitone;
        }
      }
      return null;
    }

    function updateActiveNotesPool() {
      window.strudelState.activeNotes = activeNotesList.map(item => item.data);
      window.strudelState.activeMidiNotes = activeNotesList.map(item => item.data.midi).filter(m => m !== null);
      window.strudelState.activeNoteNames = activeNotesList.map(item => item.data.note).filter(n => n !== "");
      window.strudelState.activeNoteCount = window.strudelState.activeNotes.length;
      if (typeof window.broadcastTelemetry === 'function') window.broadcastTelemetry();
    }

    function handleStrudelHap(doughEvent, duration, cps) {
      if (!doughEvent) return;
      const valueObj = (doughEvent.value !== undefined) ? doughEvent.value : doughEvent;
      if (valueObj === null || valueObj === undefined) return;

      let soundName = "";
      let rawNote = undefined;
      let gain = 1.0;
      let velocity = 1.0;
      let orbit = 1;

      if (typeof valueObj === 'object') {
        soundName = valueObj.s || valueObj.bank || valueObj.sound || "";
        rawNote = valueObj.note !== undefined ? valueObj.note : (valueObj.n !== undefined ? valueObj.n : valueObj.freq);
        if (valueObj.gain !== undefined) gain = Number(valueObj.gain);
        if (valueObj.velocity !== undefined) velocity = Number(valueObj.velocity);
        if (valueObj.orbit !== undefined) orbit = Number(valueObj.orbit);
      } else {
        rawNote = valueObj;
        soundName = String(valueObj);
      }

      const midi = parseMidiNote(rawNote, (typeof valueObj === 'object') ? valueObj.freq : undefined);
      let noteName = "";
      if (typeof valueObj === 'object' && valueObj.note) {
        noteName = valueObj.note.toString().toUpperCase();
      } else if (midi !== null) {
        noteName = midiToNoteName(midi);
      }

      const hapDur = duration || doughEvent.duration;
      const durSec = hapDur ? Math.max(0.05, hapDur / (cps || window.strudelState.cps || 1)) : 0.25;
      const noteItem = {
        id: Symbol(),
        data: {
          note: noteName,
          midi: midi,
          sound: soundName,
          gain: gain,
          velocity: velocity,
          orbit: orbit,
          duration: durSec
        }
      };

      activeNotesList.push(noteItem);
      window.strudelState.lastEvent = (typeof valueObj === 'object') ? valueObj : { value: valueObj };
      window.strudelState.lastSound = soundName;
      window.strudelState.noteEventCounter++;
      updateActiveNotesPool();

      setTimeout(() => {
        activeNotesList = activeNotesList.filter(item => item.id !== noteItem.id);
        updateActiveNotesPool();
      }, Math.max(50, durSec * 1000));
    }

    const onHapTriggered = function(arg1, arg2, arg3) {
      let hap = null;
      let deadline = 0;
      let duration = 0.25;

      if (arg1 && typeof arg1 === 'object') {
        hap = arg1;
        deadline = typeof arg2 === 'number' ? arg2 : 0;
        duration = typeof arg3 === 'number' ? arg3 : (hap.duration || 0.25);
      } else if (this && typeof this === 'object' && (this.value !== undefined || this.whole !== undefined)) {
        hap = this;
        deadline = typeof arg1 === 'number' ? arg1 : 0;
        duration = typeof arg2 === 'number' ? arg2 : (hap.duration || 0.25);
      }

      if (!hap) return;
      if (hap._cablesProcessed) return;
      hap._cablesProcessed = true;

      window.strudelState.isPlaying = true;
      const cps = (replElement?.editor?.repl?.cps) || (replElement?.editor?.repl?.scheduler?.cps) || window.strudelState.cps || 1;
      handleStrudelHap(hap, duration, cps);
    };

    function hookHapListeners() {
      if (!replElement || !replElement.editor) return;
      const editor = replElement.editor;
      const repl = editor.repl;

      const samplePattern = repl?.pattern || editor?.pattern || (repl?.scheduler?.pattern);
      const PatternClass = window.Pattern || (repl && repl.Pattern) || (samplePattern && samplePattern.constructor);
      if (PatternClass && PatternClass.prototype && !PatternClass.prototype._cablesPatched) {
        PatternClass.prototype._cablesPatched = true;
        const origQueryArc = PatternClass.prototype.queryArc;
        PatternClass.prototype.queryArc = function(begin, end, ...args) {
          const haps = origQueryArc.apply(this, [begin, end, ...args]);
          if (Array.isArray(haps)) {
            haps.forEach(hap => {
              if (hap && !hap._cablesHooked) {
                hap._cablesHooked = true;
                const origOnTrigger = hap.onTrigger;
                hap.onTrigger = function(deadline, duration, ...tArgs) {
                  onHapTriggered.call(this, deadline, duration, ...tArgs);
                  if (typeof origOnTrigger === 'function') {
                    return origOnTrigger.apply(this, [deadline, duration, ...tArgs]);
                  }
                };
              }
            });
          }
          return haps;
        };
      }

      if (repl && !repl._cablesHapHooked) {
        repl._cablesHapHooked = true;
        if (typeof repl.on === 'function') {
          try { repl.on('hap', onHapTriggered); } catch(e) {}
          try { repl.on('trigger', onHapTriggered); } catch(e) {}
        }
      }

      if (repl && repl.scheduler && !repl.scheduler._cablesHapHooked) {
        repl.scheduler._cablesHapHooked = true;
        if (typeof repl.scheduler.on === 'function') {
          try { repl.scheduler.on('hap', onHapTriggered); } catch(e) {}
          try { repl.scheduler.on('trigger', onHapTriggered); } catch(e) {}
        }
        if (typeof repl.scheduler.onTrigger === 'function') {
          try { repl.scheduler.onTrigger((...args) => onHapTriggered(...args)); } catch(e) {}
        }
        if (typeof repl.scheduler.trigger === 'function' && !repl.scheduler._cablesTriggerPatched) {
          repl.scheduler._cablesTriggerPatched = true;
          const origTrigger = repl.scheduler.trigger;
          repl.scheduler.trigger = function(hap, ...args) {
            onHapTriggered(hap);
            return origTrigger.apply(this, [hap, ...args]);
          };
        }
      }

      if (editor && !editor._cablesHapHooked) {
        editor._cablesHapHooked = true;
        if (typeof editor.on === 'function') {
          try { editor.on('hap', onHapTriggered); } catch(e) {}
          try { editor.on('trigger', onHapTriggered); } catch(e) {}
        }
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data && event.data.dough) {
        window.strudelState.isPlaying = true;
        handleStrudelHap(event.data.dough, event.data.duration, event.data.cps);
      }
    });

    let lastQueryTime = -1;
    let lastCycleInt = -1;
    function pollStrudelTelemetry() {
      hookHapListeners();
      if (replElement && replElement.editor) {
        const editor = replElement.editor;
        const repl = editor.repl;

        if (repl) {
          const isStarted = repl.scheduler ? repl.scheduler.started : window.strudelState.isPlaying;
          window.strudelState.isPlaying = !!isStarted;

          const time = (repl.getTime ? repl.getTime() : (repl.scheduler ? repl.scheduler.getTime() : 0)) || 0;
          const cps = (repl.cps !== undefined ? repl.cps : (repl.scheduler ? repl.scheduler.cps : 1)) || 1;
          
          window.strudelState.cps = cps;
          window.strudelState.bpm = cps * 120;
          window.strudelState.cycle = time;
          window.strudelState.cycleProgress = time >= 0 ? (time % 1.0) : 0;

          // Direct pattern query for 100% active hap coverage
          const activePattern = repl.pattern || editor.pattern || (repl.scheduler && repl.scheduler.pattern);
          if (isStarted && activePattern && typeof activePattern.queryArc === 'function') {
            if (lastQueryTime >= 0 && time > lastQueryTime && (time - lastQueryTime) < 1.0) {
              try {
                const haps = activePattern.queryArc(lastQueryTime, time);
                if (Array.isArray(haps) && haps.length > 0) {
                  haps.forEach(hap => {
                    onHapTriggered(hap);
                  });
                }
              } catch(e) {}
            }
            lastQueryTime = time;
          } else {
            lastQueryTime = time;
          }

          const currentCycleInt = Math.floor(time);
          if (currentCycleInt > lastCycleInt) {
            lastCycleInt = currentCycleInt;
            window.strudelState.cycleEventCounter++;
          }
          if (typeof window.broadcastTelemetry === 'function') window.broadcastTelemetry();
        }
      }
      requestAnimationFrame(pollStrudelTelemetry);
    }
    requestAnimationFrame(pollStrudelTelemetry);

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

    // BroadcastChannel theme & pattern synchronization
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

      const patternChannel = new BroadcastChannel('strudel_pattern_channel');
      patternChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'update-pattern') {
          if (typeof event.data.data === 'string') {
            loadCode(event.data.data);
          }
        }
      };
      window.addEventListener('strudel-loaded', () => {
        patternChannel.postMessage({ type: 'request-pattern' });
      });

      window.broadcastPatternChanged = function(code) {
        try {
          patternChannel.postMessage({ type: 'pattern-changed', data: code });
        } catch (e) {}
      };

      const controlChannel = new BroadcastChannel('strudel_control_channel');
      controlChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'set-play') {
          window.setPlayState(event.data.data);
        }
      };
      window.addEventListener('strudel-loaded', () => {
        controlChannel.postMessage({ type: 'request-play' });
      });

      const telemetryChannel = new BroadcastChannel('strudel_telemetry_channel');
      window.broadcastTelemetry = function() {
        try {
          telemetryChannel.postMessage({
            type: 'update-telemetry',
            data: window.strudelState
          });
        } catch (e) {}
      };
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

    window.evaluatePattern = async function() {
      if (replElement && replElement.editor) {
        if (replElement.editor.repl && replElement.editor.repl.audioContext) {
          setupStreamForContext(replElement.editor.repl.audioContext);
        }
        await replElement.editor.evaluate();
      }
    };

    window.stopPattern = async function() {
      if (replElement && replElement.editor) {
        await replElement.editor.stop();
      }
    };

    window.setPlayState = function(play) {
      if (play) {
        window.evaluatePattern();
      } else {
        window.stopPattern();
      }
    };

    // Playback Controls
    document.getElementById('btn-play').addEventListener('click', async () => {
      await window.evaluatePattern();
    });

    document.getElementById('btn-stop').addEventListener('click', async () => {
      await window.stopPattern();
    });

    // Live Auto-Evaluation & Code Sync on User Edits
    let liveEvalTimeout = null;
    let isUpdatingFromParent = false;

    function getEditorCode() {
      if (!replElement) return '';
      if (replElement.editor) {
        if (typeof replElement.editor.getCode === 'function') {
          return replElement.editor.getCode();
        }
        if (typeof replElement.editor.code === 'string') {
          return replElement.editor.code;
        }
        if (replElement.editor.state && replElement.editor.state.doc) {
          return replElement.editor.state.doc.toString();
        }
      }
      if (typeof replElement.code === 'string') {
        return replElement.code;
      }
      return replElement.getAttribute('code') || '';
    }

    function notifyPatternChanged() {
      if (isUpdatingFromParent) return;
      if (typeof window.broadcastPatternChanged === 'function') {
        const code = getEditorCode();
        if (code !== undefined && code !== null) {
          window.broadcastPatternChanged(code);
        }
      }
    }

    function scheduleLiveEval() {
      notifyPatternChanged();
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
      if (code === undefined || code === null) return;
      const currentCode = getEditorCode();
      if (currentCode === code) return;
      isUpdatingFromParent = true;
      try {
        if (replElement.editor) {
          if (typeof replElement.editor.setCode === 'function') {
            replElement.editor.setCode(code);
          } else if (replElement.editor.dispatch && replElement.editor.state) {
            replElement.editor.dispatch({
              changes: { from: 0, to: replElement.editor.state.doc.length, insert: code }
            });
          } else {
            replElement.setAttribute('code', code);
          }
          scheduleLiveEval();
        } else {
          replElement.setAttribute('code', code);
        }
      } catch (e) {
        console.warn('Error loading code into Strudel editor:', e);
      } finally {
        isUpdatingFromParent = false;
      }
    }

    document.getElementById('btn-preset-1').addEventListener('click', () => loadCode(presets.preset1));
    document.getElementById('btn-preset-2').addEventListener('click', () => loadCode(presets.preset2));
    document.getElementById('btn-preset-3').addEventListener('click', () => loadCode(presets.preset3));
  </script>
</body>
</html>
`;

let lastNoteCounter = -1;
let lastCycleCounter = -1;

function resetTelemetryOutputs() {
  outIsPlaying.set(false);
  outActiveNotes.set([]);
  outActiveMidi.set([]);
  outActiveNames.set([]);
  outActiveCount.set(0);
  outCPS.set(1.0);
  outBPM.set(120.0);
  outCycleProgress.set(0.0);
  outCurrentCycle.set(0.0);
  outLastEvent.set(null);
  outLastSound.set("");
  outError.set("");
  lastNoteCounter = -1;
  lastCycleCounter = -1;
}

let telemetryChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    telemetryChannel = new BroadcastChannel("strudel_telemetry_channel");
    telemetryChannel.onmessage = (event) => {
      if (event.data && event.data.type === "update-telemetry" && event.data.data) {
        applyTelemetryState(event.data.data);
      }
    };
  } catch (e) {}
}

function applyTelemetryState(state) {
  if (!state) return;
  outIsPlaying.set(!!state.isPlaying);
  outActiveNotes.set(state.activeNotes || []);
  outActiveMidi.set(state.activeMidiNotes || []);
  outActiveNames.set(state.activeNoteNames || []);
  outActiveCount.set(state.activeNoteCount || 0);
  outCPS.set(state.cps !== undefined ? state.cps : 1.0);
  outBPM.set(state.bpm !== undefined ? state.bpm : 120.0);
  outCycleProgress.set(state.cycleProgress !== undefined ? state.cycleProgress : 0.0);
  outCurrentCycle.set(state.cycle !== undefined ? state.cycle : 0.0);
  outLastEvent.set(state.lastEvent || null);
  outLastSound.set(state.lastSound || "");
  outError.set(state.error || "");

  if (state.noteEventCounter !== lastNoteCounter) {
    if (lastNoteCounter !== -1) {
      outOnNote.trigger();
    }
    lastNoteCounter = state.noteEventCounter;
  }

  if (state.cycleEventCounter !== lastCycleCounter) {
    if (lastCycleCounter !== -1) {
      outOnCycle.trigger();
    }
    lastCycleCounter = state.cycleEventCounter;
  }
}

function updateTelemetry() {
  if (popupWindow && !popupWindow.closed && popupWindow.strudelState) {
    applyTelemetryState(popupWindow.strudelState);
  } else if (!popupWindow || popupWindow.closed) {
    resetTelemetryOutputs();
  }
}

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
  resetTelemetryOutputs();
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
        resetTelemetryOutputs();
        if (checkClosedInterval) clearInterval(checkClosedInterval);
      } else {
        outIsOpen.set(true);
        outWindow.set(popupWindow);
        const canvasEl = popupWindow.document ? popupWindow.document.getElementById("html-canvas") : null;
        outCanvas.set(canvasEl);
        setupParentAudioStream();
        updateTelemetry();
      }
    }
  }, 50);
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
    updateTelemetry();
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
    resetTelemetryOutputs();
    return;
  }

  if (!popupWindow) {
    if (op.setUiError) op.setUiError("popup_error", "Popup window blocked by browser. Please allow popups for this site.");
    outIsOpen.set(false);
    outCanvas.set(null);
    cleanupParentAudio();
    resetTelemetryOutputs();
    return;
  }

  popupWindow.focus();
  applyThemeWhenStrudelLoaded();
  broadcastPlayState();

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
  resetTelemetryOutputs();
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

const handlePatternChange = () => {
  broadcastPattern();
  if (popupWindow && !popupWindow.closed && typeof popupWindow.loadCode === "function") {
    popupWindow.loadCode(inPattern.get());
  }
};

inPattern.onChange = handlePatternChange;

const handlePlayChange = () => {
  broadcastPlayState();
};

inPlay.onChange = handlePlayChange;

op.onLoaded = () => {
  broadcastPattern();
  broadcastPlayState();
  if (inAutoOpen.get()) {
    openPopupWindow();
  }
};

op.onDelete = () => {
  if (themeChannel) {
    try { themeChannel.close(); } catch (e) {}
  }
  if (patternChannel) {
    try { patternChannel.close(); } catch (e) {}
  }
  if (controlChannel) {
    try { controlChannel.close(); } catch (e) {}
  }
  if (telemetryChannel) {
    try { telemetryChannel.close(); } catch (e) {}
  }
  closePopupWindow();
  cleanupParentAudio();
  resetTelemetryOutputs();
};
