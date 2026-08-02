const cgl = op.patch.cgl;

// Input ports
const inActive = op.inBool("Active", true);
const inMode = op.inValueSelect("Mode", ["Direct MIDI", "Message Output Only"], "Direct MIDI");
const inMidiDevice = op.inValueSelect("MIDI Device", ["none"], "none");

const inDawMode = op.inBool("DAW Mode", true);
const inControlMethod = op.inValueSelect("Control Method", ["SysEx", "MIDI Note", "Both"], "SysEx");
const inSurfaceMode = op.inValueSelect("Surface Mode", [
    "None",
    "DAW Mixer",
    "DAW Control",
    "Custom Mode 1", "Custom Mode 2", "Custom Mode 3", "Custom Mode 4",
    "Custom Mode 5", "Custom Mode 6", "Custom Mode 7", "Custom Mode 8",
    "Custom Mode 9", "Custom Mode 10", "Custom Mode 11", "Custom Mode 12",
    "Custom Mode 13", "Custom Mode 14", "Custom Mode 15", "Custom Mode 16"
], "None");

const inRow1Relative = op.inBool("Row 1 Relative", false);
const inRow2Relative = op.inBool("Row 2 Relative", false);
const inRow3Relative = op.inBool("Row 3 Relative", false);
const inFaderPickup = op.inBool("Fader Pickup", false);
const inTouchEvents = op.inBool("Touch Events", false);

const inSendMessage = op.inTriggerButton("Send Message");

// Output ports
const outMidiMessages = op.outObject("MIDI Messages", null);
const outStatus = op.outString("Status", "Disconnected");
const outConnected = op.outBool("Connected", false);

// MIDI Access State
let midi = null;
let outputDevice = null;
const deviceMap = new Map();

// Port groups
op.setPortGroup("Connectivity", [inMode, inMidiDevice]);
op.setPortGroup("DAW Configuration", [inDawMode, inControlMethod, inSurfaceMode]);
op.setPortGroup("Encoders & Features", [inRow1Relative, inRow2Relative, inRow3Relative, inFaderPickup, inTouchEvents]);
op.setPortGroup("Actions", [inSendMessage]);

// WebMIDI Support Scan
function requestMidi() {
    if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: true })
            .then(onMIDISuccess, onMIDIFailure);
    } else {
        onMIDIFailure("WebMIDI not supported");
    }
}

function onMIDIFailure(err) {
    outStatus.set("MIDI Error: " + (err.message || err));
    outConnected.set(false);
}

function onMIDISuccess(midiAccess) {
    midi = midiAccess;
    scanDevices();
    midiAccess.onstatechange = scanDevices;
}

function scanDevices() {
    if (!midi) return;
    deviceMap.clear();
    const deviceNames = ["none"];

    const nameCounts = {};
    const outputsArray = [];

    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
        outputsArray.push(output.value);
        nameCounts[output.value.name] = (nameCounts[output.value.name] || 0) + 1;
    }

    for (const output of outputsArray) {
        let displayName = output.name;
        if (nameCounts[output.name] > 1) {
            displayName = `${output.name} (ID: ${output.id})`;
        }
        deviceNames.push(displayName);
        deviceMap.set(displayName, output.id);
    }

    inMidiDevice.uiAttribs.values = deviceNames;
    op.refreshParams();
    updateConnection();
}

function updateConnection() {
    const mode = inMode.get();
    if (mode === "Message Output Only") {
        outputDevice = null;
        outStatus.set("Message Output Only");
        outConnected.set(true);
        return;
    }

    if (!midi) {
        outStatus.set("MIDI not initialized");
        outConnected.set(false);
        return;
    }

    const targetName = inMidiDevice.get();
    if (!targetName || targetName === "none") {
        outputDevice = null;
        outStatus.set("Disconnected");
        outConnected.set(false);
        return;
    }

    const targetId = deviceMap.get(targetName);
    if (targetId) {
        outputDevice = midi.outputs.get(targetId);
    } else {
        // Fallback for saved patch values
        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
            if (output.value.name === targetName || `${output.value.name} (ID: ${output.value.id})` === targetName) {
                outputDevice = output.value;
                break;
            }
        }
    }

    if (outputDevice) {
        outStatus.set("Connected to " + outputDevice.name);
        outConnected.set(true);
        sendConfiguredState();
    } else {
        outStatus.set("Device not found");
        outConnected.set(false);
    }
}

// Connection Mode Handlers
inMode.onChange = updateConnection;
inMidiDevice.onChange = updateConnection;

// MIDI Sender Function
function sendMidiMessage(bytes) {
    outMidiMessages.set(bytes);
    if (outputDevice && inActive.get()) {
        try {
            outputDevice.send(bytes);
        } catch (e) {
            outStatus.set("Send Error: " + e.message);
        }
    }
}

// Send all states based on ports
function sendConfiguredState() {
    if (!inActive.get()) return;

    const isDaw = inDawMode.get();
    const method = inControlMethod.get();

    if (isDaw) {
        // Enable DAW Mode
        if (method === "SysEx" || method === "Both") {
            sendMidiMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x02, 0x7F, 0xF7]);
        }
        if (method === "MIDI Note" || method === "Both") {
            sendMidiMessage([0x9F, 0x0C, 0x7F]);
        }

        // Send surface mode configuration if not "None"
        const surfaceModeStr = inSurfaceMode.get();
        if (surfaceModeStr !== "None") {
            let val = 1;
            if (surfaceModeStr === "DAW Control") val = 2;
            else if (surfaceModeStr.startsWith("Custom Mode ")) {
                const modeNum = parseInt(surfaceModeStr.replace("Custom Mode ", ""), 10);
                if (modeNum >= 1 && modeNum <= 4) {
                    val = 5 + modeNum;
                } else if (modeNum >= 5 && modeNum <= 16) {
                    val = 18 + (modeNum - 5);
                }
            }
            sendMidiMessage([0xB6, 30, val]);
        }

        // Relative Rows configuration
        sendMidiMessage([0xB6, 69, inRow1Relative.get() ? 127 : 0]);
        sendMidiMessage([0xB6, 72, inRow2Relative.get() ? 127 : 0]);
        sendMidiMessage([0xB6, 73, inRow3Relative.get() ? 127 : 0]);

        // Fader Pickup & Touch Events
        sendMidiMessage([0xB6, 70, inFaderPickup.get() ? 127 : 0]);
        sendMidiMessage([0xB6, 71, inTouchEvents.get() ? 127 : 0]);
    } else {
        // Disable DAW Mode
        if (method === "SysEx" || method === "Both") {
            sendMidiMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x02, 0x00, 0xF7]);
        }
        if (method === "MIDI Note" || method === "Both") {
            sendMidiMessage([0x9F, 0x0C, 0x00]);
        }
    }
}

// Individual port listeners
inDawMode.onChange = sendConfiguredState;
inControlMethod.onChange = sendConfiguredState;

inSurfaceMode.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    const surfaceModeStr = inSurfaceMode.get();
    if (surfaceModeStr === "None") return;
    let val = 1;
    if (surfaceModeStr === "DAW Control") val = 2;
    else if (surfaceModeStr.startsWith("Custom Mode ")) {
        const modeNum = parseInt(surfaceModeStr.replace("Custom Mode ", ""), 10);
        if (modeNum >= 1 && modeNum <= 4) {
            val = 5 + modeNum;
        } else if (modeNum >= 5 && modeNum <= 16) {
            val = 18 + (modeNum - 5);
        }
    }
    sendMidiMessage([0xB6, 30, val]);
};

inRow1Relative.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    sendMidiMessage([0xB6, 69, inRow1Relative.get() ? 127 : 0]);
};

inRow2Relative.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    sendMidiMessage([0xB6, 72, inRow2Relative.get() ? 127 : 0]);
};

inRow3Relative.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    sendMidiMessage([0xB6, 73, inRow3Relative.get() ? 127 : 0]);
};

inFaderPickup.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    sendMidiMessage([0xB6, 70, inFaderPickup.get() ? 127 : 0]);
};

inTouchEvents.onChange = () => {
    if (!inActive.get() || !inDawMode.get()) return;
    sendMidiMessage([0xB6, 71, inTouchEvents.get() ? 127 : 0]);
};

inSendMessage.onTriggered = sendConfiguredState;

// Cleanup on Op delete
op.onDelete = function () {
    if (outputDevice && inActive.get()) {
        const method = inControlMethod.get();
        try {
            if (method === "SysEx" || method === "Both") {
                outputDevice.send([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x02, 0x00, 0xF7]);
            }
            if (method === "MIDI Note" || method === "Both") {
                outputDevice.send([0x9F, 0x0C, 0x00]);
            }
        } catch (e) {
            // Ignore error on cleanup
        }
    }
    outputDevice = null;
};

// Auto-initialize WebMIDI scan
requestMidi();
