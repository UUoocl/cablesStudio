// Ops.WebAudio.StrudelWeb.js

// Define Operator Inputs
const inCode = op.inStringEditor("Strudel Code", "s(\"bd sd [cp hh]\").play()", "js");
const inPlay = op.inTriggerButton("Play");
const inStop = op.inTriggerButton("Stop");
const inVolume = op.inFloat("Volume", 0.5);
const inDefaultSamples = op.inBool("Default Samples", true);

// Define WebAudio output port for downstream Cables nodes
const outAudio = op.outObject("Audio Node");

let strudelInstance = null;
let gainNode = null;
let audioContext = null;

async function initStrudel() {
  if (strudelInstance) return;

  // Verify that the module dependency was uploaded and configured with the correct import name
  if (typeof StrudelLib === "undefined" || !StrudelLib) {
    op.setUiError("import_error", "StrudelLib not found. Upload index.mjs to cables as a 'JS Module' dependency and set the module import name to 'StrudelLib'.");
    return;
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
    op.setUiError("import_error", "Strudel class not found in the StrudelLib bundle.");
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
