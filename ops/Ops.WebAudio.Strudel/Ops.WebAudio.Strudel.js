// Ops.WebAudio.Strudel.js

// Define Operator Inputs
const inCode = op.inStringEditor("Strudel Code", "s(\"bd sd [cp hh]\").play()", "js");
const inPlay = op.inTriggerButton("Play");
const inStop = op.inTriggerButton("Stop");
const inVolume = op.inFloat("Volume", 0.5);
const inDefaultSamples = op.inBool("Default Samples", true);

// Define WebAudio output port for downstream Cables nodes
const outAudio = op.outObject("Audio Node");

let StrudelLib = null;
let strudelInstance = null;
let gainNode = null;
let audioContext = null;

function getLibraryPath() {
  const relPath = "ops/" + op.objName + "/index.js";
  if (op.patch && typeof op.patch.filePath === "function") {
    return op.patch.filePath(relPath);
  }
  const prefix = (op.patch && op.patch.config && op.patch.config.prefixAssetPath) || "";
  let pathMod;
  try {
    pathMod = typeof op.require === "function" ? op.require("path") : require("path");
  } catch (e) {
    return prefix + relPath;
  }
  return pathMod.join(prefix, relPath);
}

async function initStrudel() {
  if (strudelInstance) return;

  if (!StrudelLib) {
    const libPath = getLibraryPath();
    try {
      if (typeof op.require === "function") {
        StrudelLib = op.require(libPath);
      } else {
        StrudelLib = require(libPath);
      }
    } catch (e) {
      op.setUiError("import_error", "Failed to load index.js from " + libPath + ". Error: " + e.message);
      return;
    }
  }

  if (!audioContext) {
    try {
      audioContext = CABLES.WEBAUDIO.createAudioContext(op);
    } catch (err) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }
  }

  if (!audioContext) {
    op.setUiError("audio_error", "No active Cables WebAudio context found.");
    return;
  }

  // Create an output GainNode for this operator
  gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(inVolume.get(), audioContext.currentTime);

  // Set the custom destinationNode on the context so Strudel routes its mix here
  audioContext.destinationNode = gainNode;

  // Expose the GainNode to the operator output port
  outAudio.set(gainNode);

  // Resolve the Strudel constructor (supporting namespace, default export, or direct export)
  const StrudelClass = StrudelLib.Strudel || (StrudelLib.default && StrudelLib.default.Strudel);
  if (!StrudelClass) {
    op.setUiError("import_error", "Strudel class not found in the bundle.");
    return;
  }

  // Instantiate the isolated Strudel engine
  const prebakeFunc = inDefaultSamples.get() ? () => StrudelLib.samples('github:tidalcycles/dirt-samples') : null;
  strudelInstance = new StrudelClass({
    audioContext: audioContext,
    miniAllStrings: true,
    prebake: prebakeFunc
  });

  await strudelInstance.init();
}

inPlay.onTriggered = async () => {
  await initStrudel();
  if (strudelInstance) {
    const code = inCode.get();
    try {
      op.setUiError("eval_error", null);
      await strudelInstance.evaluate(code);
    } catch (err) {
      op.setUiError("eval_error", "Strudel Error: " + err.message);
    }
  }
};

inStop.onTriggered = () => {
  if (strudelInstance) {
    strudelInstance.hush();
  }
};

inVolume.onChange = () => {
  if (gainNode && audioContext) {
    gainNode.gain.linearRampToValueAtTime(inVolume.get(), audioContext.currentTime + 0.05);
  }
};

// Cleanup on delete
op.onDelete = () => {
  if (strudelInstance) {
    strudelInstance.hush();
    strudelInstance = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  audioContext = null;
};
