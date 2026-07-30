// Ops.Team.CablesStudio.Strudel.ExternalStrudel.js
// Strudel REPL Operator running inside an external popup window for Cables.gl

const inOpen = op.inTriggerButton("Open REPL Window");
const inClose = op.inTriggerButton("Close REPL Window");
const inUpdate = op.inTriggerButton("Update");
const inPlay = op.inBool("Play / Stop", true);
const inAutoOpen = op.inBool("Auto Open On Load", false);
const inWidth = op.inFloat("Width", 1000);
const inHeight = op.inFloat("Height", 750);
const inTitle = op.inString("Window Title", "Strudel REPL");
const inCode = op.inStringEditor("Pattern Code", 's("bd*2, ~ rim*<1!3 2>, hh*4").bank(\'RolandTR909\')\n.off(-1/8, set(speed("1.5").gain(.25)))\n\nn("<0 1 2 3 4>*8").scale(\'G4 minor\')\n.s("gm_lead_6_voice")', "js");
const inEnableTelemetry = op.inBool("Enable Telemetry", true);
const inVolume = op.inFloat("Volume", 0.8);
const inSoundOutput = op.inBool("Sound Output", false);
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

op.setPortGroup("Controls", [inOpen, inClose, inUpdate, inPlay]);
op.setPortGroup("Settings", [inAutoOpen, inWidth, inHeight, inTitle, inCode, inEnableTelemetry, inShowLineNumbers]);
op.setPortGroup("Audio", [inVolume, inSoundOutput]);

let popupWindow = null;
let currentBlobUrl = null;
let opGainNode = null;
let mediaSource = null;
let isAudioRouted = false;
let isEditorConfigured = false;
let checkClosedInterval = null;
let parentAudioCtx = null;

// Telemetry State
let lastNoteCounter = -1;
let lastCycleCounter = -1;
let lastPatternUpdateCounter = -1;

const sampleHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Strudel REPL</title>
  
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #181825 !important;
      display: flex;
      flex-direction: column;
    }
    .control-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: #1e1e2e;
      border-bottom: 1px solid #313244;
      flex-shrink: 0;
    }
    .btn {
      padding: 6px 14px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #cdd6f4;
    }
    .btn-play {
      background: #a6e3a1;
      color: #11111b;
    }
    .btn-play:hover {
      background: #94e2d5;
      transform: translateY(-1px);
    }
    .btn-stop {
      background: #f38ba8;
      color: #11111b;
    }
    .btn-stop:hover {
      background: #eba0ac;
      transform: translateY(-1px);
    }
    .btn-update {
      background: #89b4fa;
      color: #11111b;
    }
    .btn-update:hover {
      background: #b4befe;
      transform: translateY(-1px);
    }
    .status-indicator {
      font-family: monospace;
      font-size: 0.85rem;
      color: #a6adc8;
      margin-left: auto;
    }
    strudel-editor {
      flex: 1 !important;
      min-height: 0 !important;
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
  <script src="https://unpkg.com/@strudel/repl@latest"></script>
</head>
<body>
  <div class="control-bar">
    <button class="btn btn-play" id="btn-play">Play</button>
    <button class="btn btn-stop" id="btn-stop">Stop</button>
    <button class="btn btn-update" id="btn-update">Update</button>
    <span class="status-indicator" id="status-ind">Stopped</span>
  </div>
  <div class="editor-wrapper" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100%; width: 100%;">
    <strudel-editor id="repl" style="flex: 1 !important; height: 100% !important; width: 100% !important;"></strudel-editor>
  </div>

  <script>
    const replElement = document.getElementById('repl');

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
      cycleEventCounter: 0,
      updatedPatternCode: "",
      patternUpdateCounter: 0
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

      window.strudelState.isPlaying = true;
      const cps = (replElement?.editor?.repl?.cps) || (replElement?.editor?.repl?.scheduler?.cps) || window.strudelState.cps || 1;
      handleStrudelHap(hap, duration, cps);
    };

    function hookHapListeners() {
      if (!replElement || !replElement.editor) return;
      const editor = replElement.editor;
      const repl = editor.repl;
      if (!repl) return;

      const samplePattern = repl.pattern || editor.pattern || (repl.scheduler?.pattern);
      const PatternClass = window.Pattern || (repl.Pattern) || (samplePattern && samplePattern.constructor);
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

          const statusInd = document.getElementById('status-ind');
          if (statusInd) {
            if (window.strudelState.error) {
              statusInd.textContent = "Error";
              statusInd.style.color = "#f38ba8";
            } else if (isStarted) {
              statusInd.textContent = "Playing";
              statusInd.style.color = "#a6e3a1";
            } else {
              statusInd.textContent = "Stopped";
              statusInd.style.color = "#a6adc8";
            }
          }

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
              } catch (e) { }
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
        }
      }
      requestAnimationFrame(pollStrudelTelemetry);
    }
    requestAnimationFrame(pollStrudelTelemetry);

    window.isStrudelLoaded = false;
    function checkStrudelLoaded() {
      const el = document.getElementById('repl');
      if (el && el.editor) {
        window.isStrudelLoaded = true;
        if (el.editor.repl && el.editor.repl.audioContext) {
          setupStreamForContext(el.editor.repl.audioContext);
        }
      } else {
        setTimeout(checkStrudelLoaded, 50);
      }
    }
    checkStrudelLoaded();

    window.evaluatePattern = async function () {
      const el = document.getElementById('repl');
      if (el && el.editor) {
        if (el.editor.repl && el.editor.repl.audioContext) {
          setupStreamForContext(el.editor.repl.audioContext);
        }
        triggerPatternUpdate();
        await el.editor.evaluate();
      }
    };

    window.stopPattern = async function () {
      const el = document.getElementById('repl');
      if (el && el.editor) {
        await el.editor.stop();
      }
    };

    window.loadCode = function (code) {
      const el = document.getElementById('repl');
      if (el) {
        el.setAttribute("code", code);
        if (el.editor && typeof el.editor.setCode === "function") {
          el.editor.setCode(code);
        }
      }
    };

    window.setLineNumbersDisplayed = function (visible) {
      const el = document.getElementById('repl');
      if (el && el.editor && typeof el.editor.setLineNumbersDisplayed === "function") {
        el.editor.setLineNumbersDisplayed(visible);
      }
    };

    function triggerPatternUpdate() {
      const el = document.getElementById('repl');
      if (el) {
        let code = '';
        if (el.editor) {
          const cm = el.editor;
          if (typeof cm.getCode === "function") code = cm.getCode();
          else if (typeof cm.code === "string") code = cm.code;
          else if (cm.state && cm.state.doc) code = cm.state.doc.toString();
        }
        if (!code && typeof el.code === "string") code = el.code;
        if (!code) code = el.getAttribute("code") || "";
        
        window.strudelState.updatedPatternCode = code;
        window.strudelState.patternUpdateCounter++;
      }
    }

    // Keydown listener for Ctrl+Enter / Cmd+Enter
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        triggerPatternUpdate();
      }
    });

    // Bind UI Play/Stop/Update Buttons
    const playBtn = document.getElementById('btn-play');
    const stopBtn = document.getElementById('btn-stop');
    const updateBtn = document.getElementById('btn-update');
    if (playBtn) playBtn.addEventListener('click', () => { window.evaluatePattern(); });
    if (stopBtn) stopBtn.addEventListener('click', () => { window.stopPattern(); });
    if (updateBtn) updateBtn.addEventListener('click', () => { triggerPatternUpdate(); });
  </script>
</body>
</html>`;

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

function setupAudioRouting() {
  if (isAudioRouted || !popupWindow || popupWindow.closed || !popupWindow.strudelAudioStream) return;

  const stream = popupWindow.strudelAudioStream;
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
  lastPatternUpdateCounter = -1;
}

function applyTelemetryState(state) {
  if (!state) return;

  const isStarted = !!state.isPlaying;
  if (isStarted !== outIsPlaying.get()) {
    if (isStarted) outOnPlay.trigger();
    else outOnStop.trigger();
  }

  if (isStarted !== inPlay.get()) {
    inPlay.set(isStarted);
  }

  outIsPlaying.set(isStarted);
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

  if (state.patternUpdateCounter !== lastPatternUpdateCounter) {
    if (state.updatedPatternCode !== undefined && state.updatedPatternCode !== null) {
      outCurrentPattern.set(state.updatedPatternCode);
    }
    lastPatternUpdateCounter = state.patternUpdateCounter;
  }

  if (state.error !== outError.get()) {
    outError.set(state.error || "");
    if (state.error) outOnError.trigger();
  }

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

function openPopupWindow() {
  if (op.setUiError) op.setUiError("popup_error", null);

  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus();
    return;
  }

  const w = inWidth.get() || 1000;
  const h = inHeight.get() || 750;
  const title = inTitle.get() || "Strudel REPL";

  const left = Math.max(0, (window.screen.width - w) / 2);
  const top = Math.max(0, (window.screen.height - h) / 2);
  const windowFeatures = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

  if (currentBlobUrl) {
    try { URL.revokeObjectURL(currentBlobUrl); } catch (e) { }
  }
  const blob = new Blob([sampleHtmlContent], { type: "text/html;charset=utf-8" });
  currentBlobUrl = URL.createObjectURL(blob);

  try {
    popupWindow = window.open(currentBlobUrl, title, windowFeatures);
  } catch (err) {
    if (op.setUiError) op.setUiError("popup_error", "Failed to open popup window: " + err.message);
    closePopupWindow();
    return;
  }

  if (!popupWindow) {
    if (op.setUiError) op.setUiError("popup_error", "Popup window blocked by browser. Please allow popups for this site.");
    closePopupWindow();
    return;
  }

  popupWindow.focus();
  isEditorConfigured = false;
  isAudioRouted = false;
  startCheckClosedTimer();
}

function closePopupWindow() {
  if (checkClosedInterval) {
    clearInterval(checkClosedInterval);
    checkClosedInterval = null;
  }
  if (popupWindow && !popupWindow.closed) {
    try { popupWindow.close(); } catch (e) { }
  }
  popupWindow = null;

  if (currentBlobUrl) {
    try { URL.revokeObjectURL(currentBlobUrl); } catch (e) { }
    currentBlobUrl = null;
  }

  if (mediaSource) {
    try { mediaSource.disconnect(); } catch (e) { }
    mediaSource = null;
  }
  isAudioRouted = false;
  outElement.set(null);
  resetTelemetryOutputs();
}

async function evaluatePattern() {
  if (popupWindow && !popupWindow.closed && popupWindow.evaluatePattern) {
    try {
      await popupWindow.evaluatePattern();
    } catch (e) {
      outError.set(e.message || String(e));
      outOnError.trigger();
    }
  }
}

async function stopPattern() {
  if (popupWindow && !popupWindow.closed && popupWindow.stopPattern) {
    try {
      await popupWindow.stopPattern();
    } catch (e) {
      outError.set(e.message || String(e));
      outOnError.trigger();
    }
  }
}

inOpen.onTriggered = () => openPopupWindow();
inClose.onTriggered = () => closePopupWindow();
inUpdate.onTriggered = () => {
  if (popupWindow && !popupWindow.closed) {
    if (typeof popupWindow.loadCode === "function") {
      popupWindow.loadCode(inCode.get());
    }
    evaluatePattern();
  }
};

inPlay.onChange = () => {
  if (inPlay.get()) evaluatePattern();
  else stopPattern();
};

inCode.onChange = () => {
  if (popupWindow && !popupWindow.closed && typeof popupWindow.loadCode === "function") {
    popupWindow.loadCode(inCode.get());
  }
};

inShowLineNumbers.onChange = () => {
  if (popupWindow && !popupWindow.closed && typeof popupWindow.setLineNumbersDisplayed === "function") {
    popupWindow.setLineNumbersDisplayed(inShowLineNumbers.get());
  }
};

inVolume.onChange = () => {
  if (opGainNode && parentAudioCtx) {
    const currentTime = parentAudioCtx.currentTime;
    opGainNode.gain.linearRampToValueAtTime(inVolume.get(), currentTime + 0.05);
  }
};

inSoundOutput.onChange = () => {
  if (popupWindow && !popupWindow.closed && typeof popupWindow.setPopupSoundOutput === "function") {
    popupWindow.setPopupSoundOutput(inSoundOutput.get());
  }
};

function startCheckClosedTimer() {
  if (checkClosedInterval) {
    clearInterval(checkClosedInterval);
    checkClosedInterval = null;
  }
  checkClosedInterval = setInterval(() => {
    if (popupWindow) {
      if (popupWindow.closed) {
        closePopupWindow();
      } else {
        // 1. Sync config once loaded
        if (popupWindow.isStrudelLoaded) {
          if (!isEditorConfigured) {
            isEditorConfigured = true;
            if (typeof popupWindow.loadCode === "function") popupWindow.loadCode(inCode.get());
            if (typeof popupWindow.setLineNumbersDisplayed === "function") popupWindow.setLineNumbersDisplayed(inShowLineNumbers.get());
            if (typeof popupWindow.setPopupSoundOutput === "function") popupWindow.setPopupSoundOutput(inSoundOutput.get());
            if (inPlay.get()) evaluatePattern();
          }
        }

        // 2. Poll Element and Code
        if (popupWindow.document) {
          const el = popupWindow.document.querySelector(".editor-wrapper") || popupWindow.document.getElementById("repl");
          if (el) {
            outElement.set(el);
          }
        }

        // 3. Route Audio
        if (popupWindow.strudelAudioStream) {
          setupAudioRouting();
        }

        // 4. Poll Telemetry
        if (inEnableTelemetry.get() && popupWindow.strudelState) {
          applyTelemetryState(popupWindow.strudelState);
        }
      }
    } else {
      if (checkClosedInterval) {
        clearInterval(checkClosedInterval);
        checkClosedInterval = null;
      }
    }
  }, 100);
}

op.onLoaded = () => {
  if (inAutoOpen.get()) {
    openPopupWindow();
  }
};

op.onDelete = () => {
  closePopupWindow();
  if (opGainNode) {
    try { opGainNode.disconnect(); } catch (e) { }
    opGainNode = null;
  }
  parentAudioCtx = null;
};
