// Ops.Team.CablesStudio.Strudel.StrudelEmbed.js
// HTML Wrapped Strudel REPL Operator inside an iframe for Cables.gl

const inShowUI = op.inBool("Show UI", true);
const inPlay = op.inBool("Play / Stop", true);
const inWidth = op.inFloat("Width", 800);
const inHeight = op.inFloat("Height", 500);
const inOpacity = op.inFloat("Opacity", 1.0);
const inCode = op.inStringEditor("Pattern Code", 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')\n.off(-1/8, set(speed("1.5").gain(.25)))\n\nn("<0 1 2 3 4>*8").scale(\'G4 minor\')\n.s("gm_lead_6_voice")', "js");
const inEnableTelemetry = op.inBool("Enable Telemetry", true);
const inVolume = op.inFloat("Volume", 0.8);
const inSoundOutput = op.inBool("Sound Output", false);
const inTransparent = op.inBool("Transparent Background", false);
const inShowLineNumbers = op.inBool("Show Line Numbers", true);

// Output Ports
const outElement = op.outObject("Element");
const outAudioNode = op.outObject("Audio Node");
const outCurrentPattern = op.outString("Current Pattern");

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

// Triggers for play / stop / error
const outOnPlay = op.outTrigger("On Play");
const outOnStop = op.outTrigger("On Stop");
const outOnError = op.outTrigger("On Error");

const outLastEvent = op.outObject("Last Event");
const outLastSound = op.outString("Last Sound");
const outError = op.outString("Error");

op.setPortGroup("Controls", [inShowUI, inPlay]);
op.setPortGroup("Layout", [inWidth, inHeight, inOpacity]);
op.setPortGroup("Settings", [inCode, inEnableTelemetry, inTransparent, inShowLineNumbers]);
op.setPortGroup("Audio", [inVolume, inSoundOutput]);

let containerEl = null;
let iframeEl = null;
let styleElement = null;
let opGainNode = null;
let mediaSource = null;
let isAudioRouted = false;
let replElement = null;
let iframeLoaded = false;
let parentAudioCtx = null;

// Telemetry State
let activeNotesList = [];
let lastNoteCounter = -1;
let lastCycleCounter = -1;
let lastQueryTime = -1;
let lastCycleInt = -1;

const strudelState = {
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

function updateCssStyles() {
  if (!styleElement) return;

  const transparentBg = inTransparent.get();
  const transparentRules = transparentBg ? `
    #strudel-container-${op.id},
    #strudel-container-${op.id} iframe {
      background: transparent !important;
      background-color: transparent !important;
    }
  ` : '';

  styleElement.textContent = `
    #strudel-container-${op.id} {
      width: ${inWidth.get()}px;
      height: ${inHeight.get()}px;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: absolute !important;
      top: 20px;
      left: 20px;
      z-index: 10 !important;
    }
    ${transparentRules}
  `;
  document.head.appendChild(styleElement);
}

function updateContainerPositionStyles() {
  if (!containerEl) return;
  const opacity = inOpacity.get();
  const w = inWidth.get();
  const h = inHeight.get();

  containerEl.style.width = w + "px";
  containerEl.style.height = h + "px";
  updateCssStyles();

  if (!inShowUI.get()) {
    containerEl.style.display = "none";
  } else {
    containerEl.style.display = "flex";
    containerEl.style.opacity = opacity;
  }
}

function initOpAudio() {
  if (!opGainNode) {
    if (!parentAudioCtx) {
      try {
        parentAudioCtx = CABLES.WEBAUDIO.createAudioContext(op);
      } catch (e) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) parentAudioCtx = new AudioCtxClass();
      }
    }

    if (parentAudioCtx) {
      opGainNode = parentAudioCtx.createGain();
      opGainNode.gain.setValueAtTime(inVolume.get(), parentAudioCtx.currentTime);
      outAudioNode.set(opGainNode);
    }
  }
}

function setupAudioRouting(strudelCtx) {
  if (isAudioRouted || !strudelCtx || !iframeEl || !iframeEl.contentWindow) return;

  const iframeWin = iframeEl.contentWindow;
  const stream = iframeWin.strudelAudioStream;

  if (stream) {
    initOpAudio();

    if (parentAudioCtx && opGainNode) {
      try {
        if (mediaSource) {
          try { mediaSource.disconnect(); } catch (e) { }
        }
        mediaSource = parentAudioCtx.createMediaStreamSource(stream);
        mediaSource.connect(opGainNode);
        isAudioRouted = true;
      } catch (e) {
        op.log("Error creating media stream source:", e);
      }
    }
  }
}

// Note parsing utilities
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
  if (!inEnableTelemetry.get()) return;
  strudelState.activeNotes = activeNotesList.map(item => item.data);
  strudelState.activeMidiNotes = activeNotesList.map(item => item.data.midi).filter(m => m !== null);
  strudelState.activeNoteNames = activeNotesList.map(item => item.data.note).filter(n => n !== "");
  strudelState.activeNoteCount = strudelState.activeNotes.length;

  applyTelemetryOutputs();
}

function handleStrudelHap(doughEvent, duration, cps) {
  if (!inEnableTelemetry.get() || !doughEvent) return;
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
  const durSec = hapDur ? Math.max(0.05, hapDur / (cps || strudelState.cps || 1)) : 0.25;
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
  strudelState.lastEvent = (typeof valueObj === 'object') ? valueObj : { value: valueObj };
  strudelState.lastSound = soundName;
  strudelState.noteEventCounter++;
  updateActiveNotesPool();

  setTimeout(() => {
    activeNotesList = activeNotesList.filter(item => item.id !== noteItem.id);
    updateActiveNotesPool();
  }, Math.max(50, durSec * 1000));
}

const onHapTriggered = function (arg1, arg2, arg3) {
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

  const valueObj = (hap.value !== undefined) ? hap.value : hap;
  const themeVal = (valueObj && valueObj.theme) || hap.theme || (hap.value && hap.value.theme);
  if (themeVal && typeof themeVal === 'string') {
    const cleanTheme = themeVal.toLowerCase().trim();
    const themeMap = {
      nord: 'nord',
      dracula: 'dracula',
      blackscreen: 'blackscreen',
      bluescreen: 'bluescreen',
      twilight: 'sublime',
      monokai: 'monokai',
      bluescreenlight: 'bluescreenlight',
      whitescreen: 'whitescreen',
      teletext: 'teletext',
      algoboy: 'algoboy',
      cutiepi: 'CutiePi',
      sonicpink: 'sonicPink',
      redtext: 'redText',
      greentext: 'greenText',
      archbtw: 'archBtw',
      fruitdaw: 'fruitDaw',
      androidstudio: 'androidstudio',
      atomone: 'atomone',
      aura: 'aura',
      darcula: 'darcula',
      duotonedark: 'duotoneDark',
      eclipse: 'eclipse',
      githubdark: 'githubDark',
      githublight: 'githubLight',
      gruvboxdark: 'gruvboxDark',
      gruvboxlight: 'gruvboxLight',
      materialdark: 'materialDark',
      materiallight: 'materialLight',
      noctislilac: 'noctisLilac',
      solarizeddark: 'solarizedDark',
      solarizedlight: 'solarizedLight',
      sublime: 'sublime',
      tokyonight: 'tokyoNight',
      tokyonightstorm: 'tokyoNightStorm',
      tokyonightday: 'tokyoNightDay',
      vscodedark: 'vscodeDark',
      vscodelight: 'vscodeLight',
      xcodelight: 'xcodeLight',
      bbedit: 'bbedit'
    };
    const mappedTheme = themeMap[cleanTheme] || cleanTheme;
    if (replElement && replElement.editor && typeof replElement.editor.setTheme === 'function') {
      replElement.editor.setTheme(mappedTheme);
    }
  }

  if (!inEnableTelemetry.get()) return;

  strudelState.isPlaying = true;
  const cps = (replElement?.editor?.repl?.cps) || (replElement?.editor?.repl?.scheduler?.cps) || strudelState.cps || 1;
  handleStrudelHap(hap, duration, cps);
};

function hookHapListeners() {
  if (!replElement || !replElement.editor || !iframeEl || !iframeEl.contentWindow) return;
  const iframeWin = iframeEl.contentWindow;
  const editor = replElement.editor;
  const repl = editor.repl;
  if (!repl) return;

  const samplePattern = repl.pattern || editor.pattern || (repl.scheduler?.pattern);
  const PatternClass = iframeWin.Pattern || (repl.Pattern) || (samplePattern && samplePattern.constructor);
  if (PatternClass && PatternClass.prototype && !PatternClass.prototype._cablesPatched) {
    PatternClass.prototype._cablesPatched = true;

    PatternClass.prototype.theme = function (name) {
      this._cablesTheme = name;
      if (typeof this.set === 'function') {
        try {
          const res = this.set('theme', name);
          if (res) {
            res._cablesTheme = name;
            return res;
          }
        } catch (e) {}
      }
      return this;
    };

    const origQueryArc = PatternClass.prototype.queryArc;
    PatternClass.prototype.queryArc = function (begin, end, ...args) {
      const haps = origQueryArc.apply(this, [begin, end, ...args]);
      if (Array.isArray(haps)) {
        haps.forEach(hap => {
          if (this._cablesTheme !== undefined) {
            if (hap.value && typeof hap.value === 'object') {
              hap.value.theme = this._cablesTheme;
            } else {
              hap.theme = this._cablesTheme;
            }
          }

          if (hap && !hap._cablesHooked) {
            hap._cablesHooked = true;
            const origOnTrigger = hap.onTrigger;
            hap.onTrigger = function (deadline, duration, ...tArgs) {
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

  if (!repl._cablesHapHooked) {
    repl._cablesHapHooked = true;
    if (typeof repl.on === 'function') {
      try { repl.on('hap', onHapTriggered); } catch (e) { }
      try { repl.on('trigger', onHapTriggered); } catch (e) { }
    }
  }

  if (repl.scheduler && !repl.scheduler._cablesHapHooked) {
    repl.scheduler._cablesHapHooked = true;
    if (typeof repl.scheduler.on === 'function') {
      try { repl.scheduler.on('hap', onHapTriggered); } catch (e) { }
      try { repl.scheduler.on('trigger', onHapTriggered); } catch (e) { }
    }
    if (typeof repl.scheduler.onTrigger === 'function') {
      try { repl.scheduler.onTrigger((...args) => onHapTriggered(...args)); } catch (e) { }
    }
    if (typeof repl.scheduler.trigger === 'function' && !repl.scheduler._cablesTriggerPatched) {
      repl.scheduler._cablesTriggerPatched = true;
      const origTrigger = repl.scheduler.trigger;
      repl.scheduler.trigger = function (hap, ...args) {
        onHapTriggered(hap);
        return origTrigger.apply(this, [hap, ...args]);
      };
    }
  }
}

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
  lastQueryTime = -1;
  lastCycleInt = -1;
  activeNotesList = [];
}

function applyTelemetryOutputs() {
  if (!inEnableTelemetry.get()) return;

  outIsPlaying.set(!!strudelState.isPlaying);
  outActiveNotes.set(strudelState.activeNotes || []);
  outActiveMidi.set(strudelState.activeMidiNotes || []);
  outActiveNames.set(strudelState.activeNoteNames || []);
  outActiveCount.set(strudelState.activeNoteCount || 0);
  outCPS.set(strudelState.cps !== undefined ? strudelState.cps : 1.0);
  outBPM.set(strudelState.bpm !== undefined ? strudelState.bpm : 120.0);
  outCycleProgress.set(strudelState.cycleProgress !== undefined ? strudelState.cycleProgress : 0.0);
  outCurrentCycle.set(strudelState.cycle !== undefined ? strudelState.cycle : 0.0);
  outLastEvent.set(strudelState.lastEvent || null);
  outLastSound.set(strudelState.lastSound || "");

  if (strudelState.noteEventCounter !== lastNoteCounter) {
    if (lastNoteCounter !== -1) {
      outOnNote.trigger();
    }
    lastNoteCounter = strudelState.noteEventCounter;
  }

  if (strudelState.cycleEventCounter !== lastCycleCounter) {
    if (lastCycleCounter !== -1) {
      outOnCycle.trigger();
    }
    lastCycleCounter = strudelState.cycleEventCounter;
  }
}

function pollStrudelTelemetry() {
  if (!inEnableTelemetry.get() || !iframeEl || !iframeEl.contentWindow) return;

  const iframeWin = iframeEl.contentWindow;
  hookHapListeners();

  if (replElement && replElement.editor) {
    const editor = replElement.editor;
    const repl = editor.repl;

    if (repl) {
      const isStarted = repl.scheduler ? repl.scheduler.started : strudelState.isPlaying;

      if (isStarted !== strudelState.isPlaying) {
        if (isStarted) {
          outOnPlay.trigger();
        } else {
          outOnStop.trigger();
        }
      }

      strudelState.isPlaying = !!isStarted;

      const time = (repl.getTime ? repl.getTime() : (repl.scheduler ? repl.scheduler.getTime() : 0)) || 0;
      const cps = (repl.cps !== undefined ? repl.cps : (repl.scheduler ? repl.scheduler.cps : 1)) || 1;

      strudelState.cps = cps;
      strudelState.bpm = cps * 120;
      strudelState.cycle = time;
      strudelState.cycleProgress = time >= 0 ? (time % 1.0) : 0;

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
          } catch (e) { }
        }
        lastQueryTime = time;
      } else {
        lastQueryTime = time;
      }

      const currentCycleInt = Math.floor(time);
      if (currentCycleInt > lastCycleInt) {
        lastCycleInt = currentCycleInt;
        strudelState.cycleEventCounter++;
      }

      applyTelemetryOutputs();
    }
  }
}

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

function updatePatternOutput() {
  const code = getEditorCode();
  outCurrentPattern.set(code);
}

function checkAndHookIframe() {
  if (!iframeEl || !iframeEl.contentWindow || !iframeEl.contentDocument) return;

  const iframeDoc = iframeEl.contentDocument;
  const iframeWin = iframeEl.contentWindow;

  const el = iframeDoc.getElementById("repl-editor");
  if (el && el.editor) {
    replElement = el;
    iframeLoaded = true;

    // Sync initial settings
    replElement.setAttribute("code", inCode.get() || "");
    if (typeof replElement.editor.setCode === "function") {
      replElement.editor.setCode(inCode.get() || "");
    }

    updateLineNumbers();
    updateCssStyles();

    if (typeof iframeWin.setPopupSoundOutput === "function") {
      iframeWin.setPopupSoundOutput(inSoundOutput.get());
    }

    // Add typing event listeners inside the iframe
    replElement.addEventListener('input', updatePatternOutput);
    replElement.addEventListener('keyup', updatePatternOutput);
  } else {
    setTimeout(checkAndHookIframe, 50);
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

  iframeEl = document.createElement("iframe");
  iframeEl.id = "strudel-iframe-" + op.id;
  iframeEl.style.width = "100%";
  iframeEl.style.height = "100%";
  iframeEl.style.border = "none";
  iframeEl.style.background = "transparent";
  iframeEl.setAttribute("allow", "autoplay");

  // Write content to iframe using srcdoc
  const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent !important;
    }
    strudel-editor {
      min-height: 100% !important;
      height: 100% !important;
      width: 100% !important;
    }
    .cm-editor {
      min-height: 100% !important;
      height: 100% !important;
      flex: 1 !important;
    }
    .cm-scroller {
      height: 100% !important;
    }
    canvas#test-canvas, canvas[style*="fixed"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  </style>
  <script>
    // Audio Context stream interception
    window.strudelAudioStream = null;
    window.strudelAudioContext = null;
    window.popupSpeakerGain = null;
    window.popupSoundEnabled = false;

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
        window.strudelAudioStream = streamDest.stream;

        const origConnect = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function(destination, output, input) {
          if (destination === ctx.destination) {
            return origConnect.call(this, strudelMasterGain, output, input);
          }
          return origConnect.call(this, destination, output, input);
        };
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
  </script>
  <script src="https://unpkg.com/@strudel/repl@latest" type="module"></script>
</head>
<body>
  <strudel-editor id="repl-editor"></strudel-editor>
</body>
</html>`;

  iframeEl.srcdoc = iframeHtml;
  containerEl.appendChild(iframeEl);

  const cablesCanvas = op.patch && op.patch.cgl && op.patch.cgl.canvas;
  const parentElement = cablesCanvas ? (cablesCanvas.parentElement || cablesCanvas.parentNode) : null;
  if (parentElement) {
    parentElement.appendChild(containerEl);
  } else {
    document.body.appendChild(containerEl);
  }

  outElement.set(containerEl);

  updateContainerPositionStyles();
  updatePatternOutput();

  // Watch for load event on iframe to hook listeners
  iframeEl.addEventListener('load', () => {
    checkAndHookIframe();
  });
}

function unmountContainer() {
  if (containerEl && containerEl.parentNode) {
    containerEl.parentNode.removeChild(containerEl);
  }
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
  containerEl = null;
  iframeEl = null;
  styleElement = null;
  replElement = null;
  iframeLoaded = false;
  outElement.set(null);
}

async function evaluatePattern() {
  if (replElement && replElement.editor) {
    if (replElement.editor.evaluate) {
      try {
        outError.set("");
        await replElement.editor.evaluate();
        outOnPlay.trigger();
      } catch (e) {
        outError.set(e.message || String(e));
        outOnError.trigger();
      }
    }
  }
}

function stopPattern() {
  if (replElement && replElement.editor) {
    if (replElement.editor.stop) {
      try {
        replElement.editor.stop();
        outOnStop.trigger();
      } catch (e) {
        outError.set(e.message || String(e));
        outOnError.trigger();
      }
    }
  }
}

inShowUI.onChange = () => updateContainerPositionStyles();
inWidth.onChange = () => updateContainerPositionStyles();
inHeight.onChange = () => updateContainerPositionStyles();
inOpacity.onChange = () => updateContainerPositionStyles();
inTransparent.onChange = () => updateCssStyles();

function updateLineNumbers() {
  if (replElement && replElement.editor && typeof replElement.editor.setLineNumbersDisplayed === 'function') {
    replElement.editor.setLineNumbersDisplayed(inShowLineNumbers.get());
  }
}
inShowLineNumbers.onChange = () => updateLineNumbers();

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
    updatePatternOutput();
  }
};

inVolume.onChange = () => {
  if (opGainNode && parentAudioCtx) {
    const currentTime = parentAudioCtx.currentTime;
    opGainNode.gain.linearRampToValueAtTime(inVolume.get(), currentTime + 0.05);
  }
};

inSoundOutput.onChange = () => {
  const enabled = inSoundOutput.get();
  if (iframeEl && iframeEl.contentWindow && typeof iframeEl.contentWindow.setPopupSoundOutput === "function") {
    iframeEl.contentWindow.setPopupSoundOutput(enabled);
  }
};

inEnableTelemetry.onChange = () => {
  if (!inEnableTelemetry.get()) {
    resetTelemetryOutputs();
  }
};

mountContainer();

let isEditorConfigured = false;
op.onAnimFrame = () => {
  if (iframeEl && iframeEl.contentWindow) {
    const iframeWin = iframeEl.contentWindow;
    if (replElement && replElement.editor && replElement.editor.repl && replElement.editor.repl.audioContext) {
      setupAudioRouting(replElement.editor.repl.audioContext);
    } else if (iframeWin.strudelAudioContext) {
      setupAudioRouting(iframeWin.strudelAudioContext);
    }
  }

  if (replElement && replElement.editor && !isEditorConfigured) {
    isEditorConfigured = true;
    updateLineNumbers();
  }

  if (inEnableTelemetry.get()) {
    pollStrudelTelemetry();
  }
};

op.onDelete = () => {
  unmountContainer();
  if (mediaSource) {
    try { mediaSource.disconnect(); } catch (e) { }
    mediaSource = null;
  }
  if (opGainNode) {
    try { opGainNode.disconnect(); } catch (e) { }
    opGainNode = null;
  }
  if (replElement && replElement.editor && replElement.editor.repl && replElement.editor.repl.audioContext) {
    const ctx = replElement.editor.repl.audioContext;
    if (window._strudelDestinations) window._strudelDestinations.delete(ctx);
    if (window._strudelSpeakerGains) window._strudelSpeakerGains.delete(ctx);
  }
  if (iframeEl && iframeEl.contentWindow && iframeEl.contentWindow.strudelAudioContext) {
    const ctx = iframeEl.contentWindow.strudelAudioContext;
    if (window._strudelDestinations) window._strudelDestinations.delete(ctx);
    if (window._strudelSpeakerGains) window._strudelSpeakerGains.delete(ctx);
  }
  parentAudioCtx = null;
  if (window._strudelReplOps) {
    window._strudelReplOps.delete(op);
  }
  resetTelemetryOutputs();
};

if (!window._strudelReplOps) window._strudelReplOps = new Set();
window._strudelReplOps.add(op);

window._cablesSyncStrudelThemes = () => {
  for (const activeOp of window._strudelReplOps) {
    if (activeOp && typeof activeOp.updateCssStyles === "function") {
      try {
        activeOp.updateCssStyles();
      } catch (e) { }
    }
  }
};

op.updateCssStyles = updateCssStyles;
