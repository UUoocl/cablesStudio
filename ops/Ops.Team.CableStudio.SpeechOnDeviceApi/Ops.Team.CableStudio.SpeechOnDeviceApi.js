// Ops.Team.CableStudio.SpeechOnDeviceApi.js

// Define inputs
const inAudioIn = op.inObject("Audio In");
const inLanguage = op.inString("Language", "en-US");
const inContinuous = op.inBool("Continuous", true);
const inInterim = op.inBool("Interim Results", true);
const inPhrases = op.inArray("Phrases", null);
const inActive = op.inBool("Active", true);
const inStart = op.inTriggerButton("Start");

// Define outputs
const outText = op.outString("Text", "");
const outInterimText = op.outString("Interim Text", "");
const outConfidence = op.outNumber("Confidence", 0);
const outStatus = op.outString("Status", "Ready");
const outNewResult = op.outTrigger("New Result");
const outListening = op.outBool("Listening Status", false);
const outSupported = op.outBool("Supported", false);

// Port groupings
op.setPortGroup("Settings", [inAudioIn, inLanguage, inContinuous, inInterim, inPhrases, inActive]);
op.setPortGroup("Controls", [inStart]);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

outSupported.set(!!SpeechRecognition);

let recognition = null;
let isListening = false;
let restartTimeout = null;

function initRecognition() {
    if (recognition) {
        try {
            recognition.onend = null;
            recognition.stop();
        } catch (e) { }
        recognition = null;
    }

    if (!SpeechRecognition) {
        outStatus.set("Error: SpeechRecognition API not supported.");
        outSupported.set(false);
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = inContinuous.get();
    recognition.interimResults = inInterim.get();
    recognition.lang = inLanguage.get() || "en-US";

    if (recognition.processLocally !== undefined) {
        recognition.processLocally = true;
    }

    // Set grammar list if phrases are provided
    if (SpeechGrammarList) {
        const phrases = inPhrases.get();
        if (phrases && Array.isArray(phrases) && phrases.length > 0) {
            const speechRecognitionList = new SpeechGrammarList();
            const grammar = '#JSGF V1.0; grammar phrases; public <phrase> = ' + phrases.join(' | ') + ' ;';
            speechRecognitionList.addFromString(grammar, 1);
            recognition.grammars = speechRecognitionList;
        }
    }

    recognition.onstart = () => {
        isListening = true;
        outListening.set(true);
        outStatus.set("Listening...");
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
                finalTranscript += res[0].transcript;
                confidence = res[0].confidence;
            } else {
                interimTranscript += res[0].transcript;
            }
        }

        if (finalTranscript) {
            outText.set(finalTranscript);
            outConfidence.set(confidence);
            outNewResult.trigger();
        }

        if (inInterim.get()) {
            outInterimText.set(interimTranscript);
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        outStatus.set("Error: " + event.error);

        if (event.error === 'network' && SpeechRecognition.available) {
            outStatus.set("Error: network (Chrome on-device processing failed. Check chrome://settings/accessibility)");
        }
    };

    recognition.onend = () => {
        isListening = false;
        outListening.set(false);

        if (inActive.get()) {
            outStatus.set("Restarting...");
            clearTimeout(restartTimeout);
            restartTimeout = setTimeout(() => {
                if (inActive.get() && recognition) {
                    try {
                        recognition.start();
                    } catch (e) { }
                }
            }, 400);
        } else {
            outStatus.set("Stopped");
        }
    };
}

async function startListening() {
    initRecognition();
    if (!recognition) return;

    if (inActive.get()) {
        if (SpeechRecognition.available) {
            outStatus.set("Checking for on-device language support...");
            try {
                const result = await SpeechRecognition.available({ langs: [recognition.lang], processLocally: true });
                if (result === "available") {
                    tryStart();
                } else if (result === "unavailable") {
                    outStatus.set(`Language pack ${recognition.lang} not available.`);
                } else {
                    outStatus.set("Language pack download required. Installing...");
                    const success = await SpeechRecognition.install({ langs: [recognition.lang], processLocally: true });
                    if (success) {
                        tryStart();
                    } else {
                        outStatus.set("Download failed.");
                    }
                }
            } catch (e) {
                tryStart();
            }
        } else {
            tryStart();
        }
    }
}

function tryStart() {
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            outStatus.set("Start failed: " + e.message);
        }
    }
}

function stopListening() {
    clearTimeout(restartTimeout);
    if (recognition) {
        try {
            recognition.onend = null;
            recognition.stop();
        } catch (e) { }
    }
    isListening = false;
    outListening.set(false);
    outStatus.set("Stopped");
}

inStart.onTriggered = startListening;

inActive.onChange = () => {
    if (inActive.get()) {
        startListening();
    } else {
        stopListening();
    }
};

inLanguage.onChange = () => {
    if (inActive.get()) startListening();
};

inContinuous.onChange = () => {
    if (inActive.get()) startListening();
};

inInterim.onChange = () => {
    if (inActive.get()) startListening();
};

inPhrases.onChange = () => {
    if (inActive.get()) startListening();
};

op.onDelete = () => {
    clearTimeout(restartTimeout);
    if (recognition) {
        try {
            recognition.onend = null;
            recognition.stop();
        } catch (e) { }
    }
};

// Initial Setup on load
if (inActive.get()) {
    startListening();
} else {
    outStatus.set("Ready");
}
