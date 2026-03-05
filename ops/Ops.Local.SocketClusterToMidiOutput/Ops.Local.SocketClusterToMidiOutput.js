const
    inSocket = op.inObject("SC Socket", null, "socketcluster"),
    inTopic = op.inString("SC Topic Filter", "midi_send"),
    inActive = op.inBool("Active", true),
    inDeviceSelect = op.inValueSelect("Output Device", ["none"]),
    outForwarded = op.outTrigger("Forwarded"),
    outDebug = op.outString("Debug Info");

let midiAccess = null;
let outputDevice = null;
let currentChannel = null;

inSocket.onChange = 
inTopic.onChange = 
inActive.onChange = setupSubscription;

inDeviceSelect.onChange = setDevice;

function onMIDIFailure(msg) {
    outDebug.set("Error: No MIDI support or access denied. " + (msg || ""));
}

function onMIDISuccess(access) {
    midiAccess = access;
    refreshDevices();
    
    // Listen for state changes (plugging/unplugging)
    midiAccess.onstatechange = (e) => {
        refreshDevices();
    };
}

function refreshDevices() {
    if (!midiAccess) return;
    
    const deviceNames = ["none"];
    const outputs = midiAccess.outputs.values();

    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
        deviceNames.push(output.value.name);
    }

    inDeviceSelect.uiAttribs.values = deviceNames;
    op.refreshParams();
    setDevice();
}

function setDevice() {
    if (!midiAccess) return;
    const name = inDeviceSelect.get();
    outputDevice = null;

    if (name === "none") {
        op.setUiAttrib({ "extendTitle": "no device" });
        return;
    }

    op.setUiAttrib({ "extendTitle": name });
    const outputs = midiAccess.outputs.values();

    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
        if (output.value.name === name) {
            outputDevice = output.value;
            outDebug.set(`Selected Output: ${name}`);
            break;
        }
    }
}

function setupSubscription() {
    const socket = inSocket.get();
    const active = inActive.get();
    
    if (currentChannel) {
        currentChannel.close();
        currentChannel = null;
    }

    if (!active || !socket || !socket.channelName) {
        outDebug.set("Waiting for valid SC Socket and Channel...");
        return;
    }

    // Ensure MIDI is requested
    if (!midiAccess) requestMidi();

    const channelPath = socket.channelName + "/objects";
    currentChannel = socket.subscribe(channelPath);
    outDebug.set(`Subscribed to: ${channelPath} (Topic: ${inTopic.get()})`);
    
    (async () => {
        try {
            for await (let data of currentChannel) {
                handleMessage(data);
            }
        } catch (e) {}
    })();
}

function handleMessage(data) {
    if (!data || data.topic !== inTopic.get()) return;
    if (!outputDevice) return;

    const payload = data.payload || data;
    if (!payload) return;

    try {
        let midiData = null;
        const channel = (payload.channel || 1) - 1; // 0-15 internal
        const type = String(payload.type || "").toLowerCase();

        // 1. Construct from named fields (Standard MIDI Monitor format)
        if (type === "noteon" || payload.status >= 144 && payload.status <= 159) {
            const note = payload.note !== undefined ? payload.note : payload.data1;
            const velocity = payload.velocity !== undefined ? Math.floor(payload.velocity * 127) : (payload.data2 || 100);
            midiData = [0x90 | channel, note, velocity];
        } 
        else if (type === "noteoff" || payload.status >= 128 && payload.status <= 143) {
            const note = payload.note !== undefined ? payload.note : payload.data1;
            midiData = [0x80 | channel, note, 0];
        }
        else if (type === "controlchange" || type === "cc" || payload.status >= 176 && payload.status <= 191) {
            const controller = payload.controller !== undefined ? payload.controller : payload.data1;
            const value = payload.value !== undefined ? payload.value : (payload.data2 || 0);
            midiData = [0xB0 | channel, controller, value];
        }
        // 2. Fallback to raw array
        else if (Array.isArray(payload) && payload.length >= 3) {
            midiData = payload;
        }
        // 3. Fallback to raw status/data object
        else if (payload.status !== undefined && payload.data1 !== undefined) {
            midiData = [payload.status, payload.data1, payload.data2 || 0];
        }

        if (midiData) {
            outputDevice.send(midiData);
            outForwarded.trigger();
            const timestamp = new Date().toLocaleTimeString();
            outDebug.set(`[${timestamp}] Sent MIDI: ${JSON.stringify(midiData)} to ${outputDevice.name}`);
        }
    } catch (e) {
        const errorMsg = "MIDI Send Error: " + (e.message || String(e));
        op.logError(errorMsg);
        outDebug.set(errorMsg);
    }
}

function requestMidi() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ "sysex": false }).then(onMIDISuccess, onMIDIFailure);
    } else {
        onMIDIFailure("Web MIDI API not supported in this environment.");
    }
}

op.onDelete = () => {
    if (currentChannel) currentChannel.close();
};

// Start
requestMidi();
if (inActive.get()) setupSubscription();
