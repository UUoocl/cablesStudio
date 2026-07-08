// Ops.Team.CableStudio.ExternalSpeechOnDevice.js

// Define inputs
const inLanguage = op.inString("Language", "en-US");
const inContinuous = op.inBool("Continuous", true);
const inInterim = op.inBool("Interim Results", true);
const inPhrases = op.inArray("Phrases", null);
const inActive = op.inBool("Active", true);

const inOpenChild = op.inTriggerButton("Open Child");
const inCloseChild = op.inTriggerButton("Close Child");
const inStart = op.inTriggerButton("Start");
const inChannelName = op.inString("Broadcast Channel Name", "speech-on-device-sync");

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
op.setPortGroup("Settings", [inLanguage, inContinuous, inInterim, inPhrases, inActive]);
op.setPortGroup("Controls", [inOpenChild, inCloseChild, inStart, inChannelName]);

let bcParent = null;
let childWindow = null;
let windowPollInterval = null;
let activeSessionId = "";

// Support check
const hasSpeech = !!(window.webkitSpeechRecognition);
outSupported.set(hasSpeech);

// Embedded runner window HTML template
const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ExternalSpeechOnDevice Runner</title>
    <style>
        body {
            background: #0f172a;
            color: #38bdf8;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }
        .container {
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #334155;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            font-size: 22px;
            margin-top: 0;
            color: #22d3ee;
        }
        .setup-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-align: left;
            margin-bottom: 20px;
        }
        label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        select {
            width: 100%;
            padding: 10px;
            background: #0f172a;
            border: 1px solid #334155;
            color: #f8fafc;
            border-radius: 6px;
            font-size: 14px;
        }
        .status-area {
            background: #0f172a;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #334155;
            margin-top: 15px;
            text-align: left;
        }
        .status-msg {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .transcript-preview {
            font-size: 18px;
            color: #f8fafc;
            min-height: 1.5em;
            word-wrap: break-word;
        }
        .pulse {
            width: 12px;
            height: 12px;
            background: #22d3ee;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            vertical-align: middle;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
        }
        .btn {
            background: #06b6d4;
            color: #0f172a;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 700;
            font-size: 15px;
            transition: background 0.2s;
            width: 100%;
        }
        .btn:hover {
            background: #0891b2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>On-Device Transcriber</h1>
        
        <div class="setup-section">
            <label for="mic-select">Microphone Device</label>
            <select id="mic-select">
                <option value="">Default Microphone</option>
            </select>
        </div>

        <button id="permission-btn" class="btn" style="display:none;">Grant Microphone Permission</button>

        <div class="status-area">
            <div class="status-msg">
                <span id="status-pulse" class="pulse" style="display:none;"></span>
                Status: <span id="status-text">Ready</span>
            </div>
            <div id="transcript" class="transcript-preview">...</div>
        </div>
    </div>

    <script>
        var bcChild = null;
        var recognition = null;
        var restartTimeout = null;
        var activeMicStream = null;

        var active = true;
        var language = 'en-US';
        var continuous = true;
        var interimResults = true;
        var phrases = [];
        var currentSessionId = "";
        
        var channelName = "speech-on-device-sync";

        // Strictly target Chrome On-Device webkitSpeechRecognition API
        var SpeechRecognition = window.webkitSpeechRecognition;
        var SpeechGrammarList = window.webkitSpeechGrammarList;

        function updateUIStatus(msg, isListening) {
            document.getElementById('status-text').textContent = msg;
            document.getElementById('status-pulse').style.display = isListening ? 'inline-block' : 'none';
        }

        function initChannel() {
            if (bcChild) bcChild.close();
            bcChild = new BroadcastChannel(channelName);
            bcChild.onmessage = async function(event) {
                var data = event.data;
                if (data.sessionId !== currentSessionId) return;

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
            };
        }

        function sendMsg(msg) {
            if (bcChild) {
                bcChild.postMessage(msg);
            }
        }

        async function populateDevices() {
            try {
                var devices = await navigator.mediaDevices.enumerateDevices();
                var micSelect = document.getElementById('mic-select');
                
                // Clear existing options except default
                micSelect.innerHTML = '<option value="">Default Microphone</option>';
                
                var count = 0;
                devices.forEach(function(device) {
                    if (device.kind === 'audioinput') {
                        var opt = document.createElement('option');
                        opt.value = device.deviceId;
                        opt.textContent = device.label || 'Microphone ' + (++count);
                        micSelect.appendChild(opt);
                    }
                });
            } catch(e) {
                console.warn("Failed to enumerate devices:", e);
            }
        }

        async function requestMicrophonePermission() {
            try {
                // Prime mic access to trigger browser label permissions
                var tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                tempStream.getTracks().forEach(function(track) { track.stop(); });
                
                document.getElementById('permission-btn').style.display = 'none';
                await populateDevices();
            } catch(e) {
                updateUIStatus("Error: Microphone access denied.", false);
                document.getElementById('permission-btn').style.display = 'block';
            }
        }

        async function acquireSelectedMic() {
            if (activeMicStream) {
                activeMicStream.getTracks().forEach(function(track) { track.stop(); });
                activeMicStream = null;
            }

            var micId = document.getElementById('mic-select').value;
            var constraints = {
                audio: micId ? { deviceId: { exact: micId } } : true
            };

            try {
                activeMicStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch(e) {
                console.warn("Failed to acquire selected mic stream:", e.message);
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
                updateUIStatus("Error: webkitSpeechRecognition API not supported.", false);
                sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Error: webkitSpeechRecognition API not supported' });
                return;
            }

            if (!SpeechRecognition.available) {
                updateUIStatus("Error: Chrome On-Device Speech API not available.", false);
                sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Error: Chrome On-Device Speech API not available' });
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = continuous;
            recognition.interimResults = interimResults;
            recognition.lang = language;

            // Configure local processing only with no cloud fallback
            recognition.processLocally = true;

            if (SpeechGrammarList && phrases && phrases.length > 0) {
                var speechRecognitionList = new SpeechGrammarList();
                var grammar = '#JSGF V1.0; grammar phrases; public <phrase> = ' + phrases.join(' | ') + ' ;';
                speechRecognitionList.addFromString(grammar, 1);
                recognition.grammars = speechRecognitionList;
            }

            recognition.onstart = () => {
                updateUIStatus("Listening (On-Device)...", true);
                sendMsg({ type: 'listening', sessionId: currentSessionId, value: true });
                sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Listening...' });
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
                    sessionId: currentSessionId,
                    final: finalTranscript,
                    interim: interimTranscript,
                    confidence: confidence
                });
            };

            recognition.onerror = (event) => {
                if (event.error === 'no-speech' || event.error === 'aborted') return;
                updateUIStatus("Error: " + event.error, false);
                sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Error: ' + event.error });
            };

            recognition.onend = () => {
                updateUIStatus("Speech Recognition ended.", false);
                sendMsg({ type: 'listening', sessionId: currentSessionId, value: false });

                if (active) {
                    updateUIStatus("Restarting speech engine...", false);
                    sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Restarting...' });
                    clearTimeout(restartTimeout);
                    restartTimeout = setTimeout(() => {
                        if (active) {
                            try { recognition.start(); } catch(e) {}
                        }
                    }, 400);
                } else {
                    sendMsg({ type: 'status', sessionId: currentSessionId, value: 'Stopped' });
                }
            };
        }

        async function startRecognition() {
            // Prime selected microphone device stream in the tab
            await acquireSelectedMic();

            initSpeechRecognition();
            if (!recognition) return;

            if (SpeechRecognition.available) {
                updateUIStatus("Checking on-device support...", false);
                try {
                    var result = await SpeechRecognition.available({ langs: [recognition.lang], processLocally: true });
                    if (result === "available") {
                        tryStart();
                    } else if (result === "unavailable") {
                        updateUIStatus("Language pack not available locally.", false);
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
                    updateUIStatus("Error checking support: " + e.message, false);
                }
            } else {
                updateUIStatus("Error: Chrome On-Device Speech API not available.", false);
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
            if (recognition) {
                try {
                    recognition.onend = null;
                    recognition.stop();
                } catch(e) {}
            }
            if (activeMicStream) {
                activeMicStream.getTracks().forEach(function(track) { track.stop(); });
                activeMicStream = null;
            }
            updateUIStatus("Stopped", false);
        }

        // Event listeners
        document.getElementById('mic-select').onchange = function() {
            if (active) {
                startRecognition();
            }
        };
        document.getElementById('permission-btn').onclick = requestMicrophonePermission;

        // Auto-initialize on load
        currentSessionId = Math.random().toString(36).substr(2, 9);
        initChannel();
        
        // Initial setup flow
        requestMicrophonePermission().then(function() {
            sendMsg({ type: 'ready', sessionId: currentSessionId });
        });
    </script>
</body>
</html>`;

function sendConfig() {
    if (bcParent) {
        const phrasesData = inPhrases.get();
        const config = {
            type: 'config',
            sessionId: activeSessionId,
            language: inLanguage.get() || 'en-US',
            continuous: inContinuous.get(),
            interimResults: inInterim.get(),
            active: inActive.get(),
            phrases: Array.isArray(phrasesData) ? phrasesData : []
        };
        try {
            bcParent.postMessage(config);
        } catch(e) {}
    }
}

function initBroadcastChannel() {
    if (bcParent) {
        bcParent.close();
    }
    const cName = inChannelName.get() || "speech-on-device-sync";
    bcParent = new BroadcastChannel(cName);
    
    bcParent.onmessage = async (event) => {
        const data = event.data;
        
        if (data.type === 'ready') {
            activeSessionId = data.sessionId;
            sendConfig();
        } else {
            if (data.sessionId !== activeSessionId) return;

            if (data.type === 'result') {
                outText.set(data.final);
                outInterimText.set(data.interim);
                outConfidence.set(data.confidence);
                if (data.final) outNewResult.trigger();
            } else if (data.type === 'listening') {
                outListening.set(data.value);
            } else if (data.type === 'status') {
                outStatus.set(data.value);
            }
        }
    };
}

inStart.onTriggered = () => {
    sendConfig();
};

inOpenChild.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const name = "Speech Recognition Receiver";
    const features = "width=600,height=450,scrollbars=no,resizable=yes,location=no,toolbar=no,menubar=no,status=no,popup=yes";

    childWindow = window.open("", `speech_on_device_runner_${op.id}`, features);
    if (!childWindow) {
        outStatus.set("Error: Popup blocked");
        outWindowStatus.set("closed");
        return;
    }

    outWindowStatus.set("open");

    const doc = childWindow.document;
    doc.open();
    
    // Dynamically inject the BroadcastChannel name into the runner's script context
    const customizedTemplate = templateHtml
        .replace('var channelName = "speech-on-device-sync";', `var channelName = "${inChannelName.get() || "speech-on-device-sync"}";`);
        
    doc.write(customizedTemplate);
    doc.close();

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

inChannelName.onChange = () => {
    initBroadcastChannel();
};

op.onDelete = () => {
    clearInterval(windowPollInterval);
    if (childWindow) {
        try { childWindow.close(); } catch(e) {}
    }
    if (bcParent) {
        try { bcParent.close(); } catch(e) {}
    }
};

// Start BroadcastChannel listening on load
initBroadcastChannel();
