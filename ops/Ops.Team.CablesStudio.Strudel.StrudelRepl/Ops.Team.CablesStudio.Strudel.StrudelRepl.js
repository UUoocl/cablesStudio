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
const inEnableTelemetry = op.inBool("Enable Telemetry", true);

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
const outLastEvent = op.outObject("Last Event");
const outLastSound = op.outString("Last Sound");
const outError = op.outString("Error");

op.setPortGroup("Controls", [inShowUI, inPlay]);
op.setPortGroup("Layout", [inWidth, inHeight, inPosX, inPosY, inOpacity]);
op.setPortGroup("Settings", [inCssVars, inCode, inEnableTelemetry]);
op.setPortGroup("Audio", [inVolume, inPopupAudio]);

let containerEl = null;
let replElement = null;
let styleElement = null;
let opGainNode = null;
let mediaSource = null;
let isAudioRouted = false;

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

const onHapTriggered = function(arg1, arg2, arg3) {
  if (!inEnableTelemetry.get()) return;
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

  strudelState.isPlaying = true;
  const cps = (replElement?.editor?.repl?.cps) || (replElement?.editor?.repl?.scheduler?.cps) || strudelState.cps || 1;
  handleStrudelHap(hap, duration, cps);
};

function hookHapListeners() {
  if (!inEnableTelemetry.get() || !replElement || !replElement.editor) return;
  const editor = replElement.editor;
  const repl = editor.repl;
  if (!repl) return;

  const samplePattern = repl.pattern || editor.pattern || (repl.scheduler?.pattern);
  const PatternClass = window.Pattern || (repl.Pattern) || (samplePattern && samplePattern.constructor);
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

  if (!repl._cablesHapHooked) {
    repl._cablesHapHooked = true;
    if (typeof repl.on === 'function') {
      try { repl.on('hap', onHapTriggered); } catch(e) {}
      try { repl.on('trigger', onHapTriggered); } catch(e) {}
    }
  }

  if (repl.scheduler && !repl.scheduler._cablesHapHooked) {
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
  if (!inEnableTelemetry.get()) return;
  
  hookHapListeners();
  if (replElement && replElement.editor) {
    const editor = replElement.editor;
    const repl = editor.repl;

    if (repl) {
      const isStarted = repl.scheduler ? repl.scheduler.started : strudelState.isPlaying;
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
          } catch(e) {}
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
  updatePatternOutput();
  
  // Listen to typing events to update the Current Pattern output
  replElement.addEventListener('input', updatePatternOutput);
  replElement.addEventListener('keyup', updatePatternOutput);
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

async function evaluatePattern() {
  if (replElement && replElement.editor) {
    if (replElement.editor.evaluate) {
      try {
        outError.set("");
        await replElement.editor.evaluate();
      } catch (e) {
        outError.set(e.message || String(e));
      }
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
    updatePatternOutput();
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

inEnableTelemetry.onChange = () => {
  if (!inEnableTelemetry.get()) {
    resetTelemetryOutputs();
  }
};

mountContainer();

op.onAnimFrame = () => {
  if (replElement && replElement.editor && replElement.editor.repl && replElement.editor.repl.audioContext) {
    setupAudioRouting(replElement.editor.repl.audioContext);
  }
  if (inEnableTelemetry.get()) {
    pollStrudelTelemetry();
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
  resetTelemetryOutputs();
};
