// Ops.Team.CableStudio.ExternalSpeechOnDevice.js

// Define inputs
const inAudioIn = op.inObject("Audio In");
const inLanguage = op.inString("Language", "en-US");
const inContinuous = op.inBool("Continuous", true);
const inInterim = op.inBool("Interim Results", true);
const inPhrases = op.inArray("Phrases", null);
const inActive = op.inBool("Active", true);

const inOpenChild = op.inTriggerButton("Open Child");
const inCloseChild = op.inTriggerButton("Close Child");
const inStart = op.inTriggerButton("Start");

// Define outputs
const outText = op.outString("Text", "");
const outInterimText = op.outString("Interim Text", "");
const outConfidence = op.outNumber("Confidence", 0);
const outStatus = op.outString("Status", "Ready");
const outNewResult = op.outTrigger("New Result");
const outListening = op.outBool("Listening Status", false);
const outSupported = op.outBool("Supported", false);
const outWindowStatus = op.outString("Window Status", "closed");

// Port groupings
op.setPortGroup("Settings", [inAudioIn, inLanguage, inContinuous, inInterim, inPhrases, inActive]);
op.setPortGroup("Controls", [inOpenChild, inCloseChild, inStart]);

let pcParent = null;
let dcParent = null;
let childWindow = null;
let windowPollInterval = null;

// Support check
const hasWebRTC = !!(window.RTCPeerConnection);
outSupported.set(hasWebRTC);

// Embedded runner window HTML template
const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ExternalSpeechOnDevice Runner</title>
    <style>
        body {
            background: #000;
            color: #22d3ee;
            font-family: -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .pulse {
            width: 15px;
            height: 15px;
            background: #22d3ee;
            border-radius: 50%;
            display: inline-block;
            margin-bottom: 15px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(34, 211, 238, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
        }
        #transcript {
            font-size: 24px;
            color: white;
            min-height: 1.5em;
            word-wrap: break-word;
            margin-top: 15px;
        }
        #status {
            font-size: 14px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div id="status-pulse" class="pulse" style="display:none;"></div>
    <div id="status">Ready to connect...</div>
    <div id="transcript">...</div>

    <script>
        var pcChild = null;
        var dcChild = null;
        var recognition = null;
        var restartTimeout = null;
        var incomingStream = null;

        var useLocalProcessing = true;
        var active = true;
        var language = 'en-US';
        var continuous = true;
        var interimResults = true;
        var phrases = [];

        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

        function updateUIStatus(msg, isListening) {
            document.getElementById('status').textContent = msg;
            document.getElementById('status-pulse').style.display = isListening ? 'inline-block' : 'none';
        }

        window.receiveOfferFromParent = async (offer) => {
            if (pcChild) {
                pcChild.close();
            }
            
            pcChild = new RTCPeerConnection({ iceServers: [] });
            
            pcChild.onicecandidate = (event) => {
                if (event.candidate) {
                    try {
                        window.opener.addIceCandidateFromChild(event.candidate);
                    } catch(e) {}
                }
            };
            
            pcChild.ondatachannel = (event) => {
                dcChild = event.channel;
                setupDataChannel(dcChild);
            };
            
            pcChild.ontrack = (event) => {
                console.log("Child received track");
                incomingStream = event.streams[0];
            };
            
            try {
                await pcChild.setRemoteDescription(offer);
                var answer = await pcChild.createAnswer();
                await pcChild.setLocalDescription(answer);
                window.opener.receiveAnswerFromChild(answer);
                updateUIStatus("WebRTC Connected. Handshaking...", false);
            } catch(e) {
                updateUIStatus("WebRTC Connection failed: " + e.message, false);
            }
        };

        window.addIceCandidateFromParent = async (candidate) => {
            if (pcChild) {
                try {
                    await pcChild.addIceCandidate(candidate);
                } catch(e) {}
            }
        };

        function setupDataChannel(channel) {
            channel.onopen = () => {
                updateUIStatus("WebRTC Connected. Ready.", false);
                sendMsg({ type: 'status', value: 'Connected via WebRTC' });
            };
            channel.onclose = () => {
                updateUIStatus("WebRTC Connection closed", false);
            };
            channel.onmessage = (event) => {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'config') {
                        language = data.language;
                        continuous = data.continuous;
                        interimResults = data.interimResults;
                        active = data.active;
                        phrases = data.phrases;
                        
                        if (active) {
                            startRecognition();
                        } else {
                            stopRecognition();
                        }
                    }
                } catch(e) {}
            };
        }

        function sendMsg(msg) {
            if (dcChild && dcChild.readyState === 'open') {
                dcChild.send(JSON.stringify(msg));
            }
        }

        function initSpeechRecognition() {
            if (recognition) {
                try {
                    recognition.onend = null;
                    recognition.stop();
                } catch(e) {}
                recognition = null;
            }

            if (!SpeechRecognition) {
                updateUIStatus("Error: SpeechRecognition API not supported.", false);
                sendMsg({ type: 'status', value: 'Error: SpeechRecognition API not supported' });
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = continuous;
            recognition.interimResults = interimResults;
            recognition.lang = language;

            if (recognition.processLocally !== undefined && useLocalProcessing) {
                recognition.processLocally = true;
            } else if (recognition.processLocally !== undefined) {
                recognition.processLocally = false;
            }

            if (SpeechGrammarList && phrases && phrases.length > 0) {
                var speechRecognitionList = new SpeechGrammarList();
                var grammar = '#JSGF V1.0; grammar phrases; public <phrase> = ' + phrases.join(' | ') + ' ;';
                speechRecognitionList.addFromString(grammar, 1);
                recognition.grammars = speechRecognitionList;
            }

            recognition.onstart = () => {
                updateUIStatus("Listening...", true);
                sendMsg({ type: 'listening', value: true });
                sendMsg({ type: 'status', value: 'Listening...' });
            };

            recognition.onresult = (event) => {
                var finalTranscript = '';
                var interimTranscript = '';
                var confidence = 0;

                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    var res = event.results[i];
                    if (res.isFinal) {
                        finalTranscript += res[0].transcript;
                        confidence = res[0].confidence;
                    } else {
                        interimTranscript += res[0].transcript;
                    }
                }

                if (finalTranscript) {
                    document.getElementById('transcript').textContent = finalTranscript;
                }

                sendMsg({
                    type: 'result',
                    final: finalTranscript,
                    interim: interimTranscript,
                    confidence: confidence
                });
            };

            recognition.onerror = (event) => {
                if (event.error === 'no-speech' || event.error === 'aborted') return;
                
                if (event.error === 'language-not-supported' && useLocalProcessing) {
                    console.warn("Local speech recognition not supported. Falling back to cloud-based...");
                    useLocalProcessing = false;
                    updateUIStatus("Language not supported locally. Falling back to cloud...", false);
                    stopRecognition();
                    active = true;
                    setTimeout(startRecognition, 100);
                    return;
                }

                updateUIStatus("Error: " + event.error, false);
                sendMsg({ type: 'status', value: 'Error: ' + event.error });
            };

            recognition.onend = () => {
                updateUIStatus("Speech Recognition ended.", false);
                sendMsg({ type: 'listening', value: false });

                if (active) {
                    updateUIStatus("Restarting speech engine...", false);
                    sendMsg({ type: 'status', value: 'Restarting...' });
                    clearTimeout(restartTimeout);
                    restartTimeout = setTimeout(() => {
                        if (active) {
                            try { recognition.start(); } catch(e) {}
                        }
                    }, 400);
                } else {
                    sendMsg({ type: 'status', value: 'Stopped' });
                }
            };
        }

        async function startRecognition() {
            initSpeechRecognition();
            if (!recognition) return;

            if (SpeechRecognition.available && useLocalProcessing) {
                updateUIStatus("Checking on-device language support...", false);
                try {
                    var result = await SpeechRecognition.available({ langs: [recognition.lang], processLocally: true });
                    if (result === "available") {
                        tryStart();
                    } else if (result === "unavailable") {
                        updateUIStatus("Language pack not available.", false);
                    } else {
                        updateUIStatus("Language pack download required. Installing...", false);
                        var success = await SpeechRecognition.install({ langs: [recognition.lang], processLocally: true });
                        if (success) {
                            tryStart();
                        } else {
                            updateUIStatus("Download failed.", false);
                        }
                    }
                } catch(e) {
                    tryStart();
                }
            } else {
                tryStart();
            }
        }

        function tryStart() {
            if (recognition) {
                try {
                    recognition.start();
                } catch(e) {
                    updateUIStatus("Start failed: " + e.message, false);
                }
            }
        }

        function stopRecognition() {
            clearTimeout(restartTimeout);
            active = false;
            if (recognition) {
                try {
                    recognition.onend = null;
                    recognition.stop();
                } catch(e) {}
            }
            updateUIStatus("Stopped", false);
            sendMsg({ type: 'listening', value: false });
            sendMsg({ type: 'status', value: 'Stopped' });
        }
    </script>
</body>
</html>`;

function sendConfig() {
    if (dcParent && dcParent.readyState === 'open') {
        dcParent.send(JSON.stringify({
            type: 'config',
            language: inLanguage.get() || "en-US",
            continuous: inContinuous.get(),
            interimResults: inInterim.get(),
            phrases: inPhrases.get() || [],
            active: inActive.get()
        }));
    }
}

function handleChildMessage(dataStr) {
    try {
        const data = JSON.parse(dataStr);
        if (data.type === 'status') {
            outStatus.set(data.value);
        } else if (data.type === 'listening') {
            outListening.set(data.value);
        } else if (data.type === 'result') {
            if (data.final) {
                outText.set(data.final);
                outConfidence.set(data.confidence);
                outNewResult.trigger();
            }
            if (inInterim.get()) {
                outInterimText.set(data.interim);
            }
        }
    } catch (e) {
        op.logWarn("[ExternalSpeechOnDevice] Error parsing message from child:", e);
    }
}

// Global hooks for in-memory signaling between windows
window.receiveAnswerFromChild = async (answer) => {
    if (pcParent) {
        try {
            await pcParent.setRemoteDescription(answer);
        } catch(e) {
            outStatus.set("SDP Answer Error: " + e.message);
        }
    }
};

window.addIceCandidateFromChild = async (candidate) => {
    if (pcParent) {
        try {
            await pcParent.addIceCandidate(candidate);
        } catch(e) {}
    }
};

async function setupWebRTC() {
    if (pcParent) {
        try { pcParent.close(); } catch(e) {}
        pcParent = null;
    }

    if (!hasWebRTC) {
        outStatus.set("Error: WebRTC not supported");
        return;
    }

    pcParent = new RTCPeerConnection({ iceServers: [] });

    dcParent = pcParent.createDataChannel("speech-sync");
    dcParent.onopen = () => {
        outStatus.set("Data channel connected");
        sendConfig();
    };
    dcParent.onclose = () => {
        outStatus.set("Data channel closed");
    };
    dcParent.onmessage = (event) => {
        handleChildMessage(event.data);
    };

    // Grab audio track from MicrophoneIn input connection
    const audioObj = inAudioIn.get();
    if (audioObj) {
        let stream = null;
        if (audioObj instanceof MediaStream) {
            stream = audioObj;
        } else if (audioObj.context && audioObj.connect) {
            const ctx = audioObj.context;
            const dest = ctx.createMediaStreamDestination();
            audioObj.connect(dest);
            stream = dest.stream;
        }

        if (stream && stream.getAudioTracks().length > 0) {
            const track = stream.getAudioTracks()[0];
            pcParent.addTrack(track, stream);
            outStatus.set("Audio track linked");
        } else {
            outStatus.set("Warning: Audio In has no tracks");
        }
    }

    pcParent.onicecandidate = (event) => {
        if (event.candidate && childWindow && !childWindow.closed) {
            try {
                childWindow.addIceCandidateFromParent(event.candidate);
            } catch(e) {}
        }
    };
}

async function startNegotiation() {
    await setupWebRTC();
    if (!pcParent || !childWindow || childWindow.closed) {
        outStatus.set("Negotiation failed: Window closed");
        return;
    }

    try {
        const offer = await pcParent.createOffer();
        await pcParent.setLocalDescription(offer);
        childWindow.receiveOfferFromParent(offer);
        outStatus.set("Negotiating WebRTC...");
    } catch(e) {
        outStatus.set("Negotiation error: " + e.message);
    }
}

inStart.onTriggered = startNegotiation;

inOpenChild.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const name = "Speech Recognition Receiver";
    const features = "width=600,height=400,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";

    childWindow = window.open("", `speech_on_device_runner_${op.id}`, features);
    if (!childWindow) {
        outStatus.set("Error: Popup blocked");
        outWindowStatus.set("closed");
        return;
    }

    outWindowStatus.set("open");

    const doc = childWindow.document;
    doc.open();
    
    // Inject dynamic Title
    const customizedTemplate = templateHtml
        .replace("<title>ExternalSpeechOnDevice Runner</title>", `<title>${name}</title>`);
        
    doc.write(customizedTemplate);
    doc.close();

    // Start signaling automatically upon window open
    setTimeout(startNegotiation, 500);

    clearInterval(windowPollInterval);
    windowPollInterval = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(windowPollInterval);
            outWindowStatus.set("closed");
            childWindow = null;
        }
    }, 500);
};

inCloseChild.onTriggered = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
        outWindowStatus.set("closed");
    }
};

inLanguage.onChange = sendConfig;
inContinuous.onChange = sendConfig;
inInterim.onChange = sendConfig;
inPhrases.onChange = sendConfig;
inActive.onChange = sendConfig;

op.onDelete = () => {
    clearInterval(windowPollInterval);
    if (pcParent) {
        try { pcParent.close(); } catch(e) {}
    }
    if (childWindow) {
        try { childWindow.close(); } catch(e) {}
    }
};
