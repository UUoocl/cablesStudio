const cgl = op.patch.cgl;

// Input ports
const inActive = op.inBool("Active", true);
const inMode = op.inValueSelect("Mode", ["Direct MIDI", "Message Output Only"], "Direct MIDI");
const inMidiDevice = op.inValueSelect("MIDI Device", ["none"], "none");

const inTargetMode = op.inValueSelect("Target Mode", ["Individual Control", "All Knobs Array", "All Buttons Array", "Clear All"], "Individual Control");

// Individual Control ports
const inControlSelect = op.inValueSelect("Control", [
    "Knob R1 C1", "Knob R1 C2", "Knob R1 C3", "Knob R1 C4", "Knob R1 C5", "Knob R1 C6", "Knob R1 C7", "Knob R1 C8",
    "Knob R2 C1", "Knob R2 C2", "Knob R2 C3", "Knob R2 C4", "Knob R2 C5", "Knob R2 C6", "Knob R2 C7", "Knob R2 C8",
    "Knob R3 C1", "Knob R3 C2", "Knob R3 C3", "Knob R3 C4", "Knob R3 C5", "Knob R3 C6", "Knob R3 C7", "Knob R3 C8",
    "Focus Button C1", "Focus Button C2", "Focus Button C3", "Focus Button C4", "Focus Button C5", "Focus Button C6", "Focus Button C7", "Focus Button C8",
    "Control Button C1", "Control Button C2", "Control Button C3", "Control Button C4", "Control Button C5", "Control Button C6", "Control Button C7", "Control Button C8",
    "Page Up", "Page Down", "Track Left", "Track Right", "Play", "Record", "Solo / Arm", "Mute / Select", "Device"
], "Knob R1 C1");

const inColorMode = op.inValueSelect("Color Mode", ["Palette", "RGB"], "Palette");
const inPaletteColor = op.inInt("Palette Color", 1);
const inRed = op.inFloat("Red", 1.0);
const inGreen = op.inFloat("Green", 0.0);
const inBlue = op.inFloat("Blue", 0.0);

// Array Control ports
const inPaletteArray = op.inArray("Palette Array");
const inRgbArray = op.inArray("RGB Array");

const inSend = op.inTriggerButton("Send");

// Output ports
const outMidiMessages = op.outObject("MIDI Messages", null);
const outStatus = op.outString("Status", "Disconnected");
const outConnected = op.outBool("Connected", false);

// MIDI Access State
let midi = null;
let outputDevice = null;
const deviceMap = new Map();

// Control index map
const controlMap = {
    "Knob R1 C1": 13, "Knob R1 C2": 14, "Knob R1 C3": 15, "Knob R1 C4": 16, "Knob R1 C5": 17, "Knob R1 C6": 18, "Knob R1 C7": 19, "Knob R1 C8": 20,
    "Knob R2 C1": 21, "Knob R2 C2": 22, "Knob R2 C3": 23, "Knob R2 C4": 24, "Knob R2 C5": 25, "Knob R2 C6": 26, "Knob R2 C7": 27, "Knob R2 C8": 28,
    "Knob R3 C1": 29, "Knob R3 C2": 30, "Knob R3 C3": 31, "Knob R3 C4": 32, "Knob R3 C5": 33, "Knob R3 C6": 34, "Knob R3 C7": 35, "Knob R3 C8": 36,
    "Focus Button C1": 37, "Focus Button C2": 38, "Focus Button C3": 39, "Focus Button C4": 40, "Focus Button C5": 41, "Focus Button C6": 42, "Focus Button C7": 43, "Focus Button C8": 44,
    "Control Button C1": 45, "Control Button C2": 46, "Control Button C3": 47, "Control Button C4": 48, "Control Button C5": 49, "Control Button C6": 50, "Control Button C7": 51, "Control Button C8": 52,
    "Page Up": 106, "Page Down": 107, "Track Left": 103, "Track Right": 102,
    "Play": 116, "Record": 118, "Solo / Arm": 65, "Mute / Select": 66, "Device": 104
};

// Knobs order for arrays: R1 C1-8, R2 C1-8, R3 C1-8
const knobCcList = [];
for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 8; c++) {
        knobCcList.push(controlMap[`Knob R${r} C${c}`]);
    }
}

// Buttons order for arrays: Focus C1-8, Control C1-8
const buttonCcList = [];
for (let c = 1; c <= 8; c++) {
    buttonCcList.push(controlMap[`Focus Button C${c}`]);
}
for (let c = 1; c <= 8; c++) {
    buttonCcList.push(controlMap[`Control Button C${c}`]);
}

// Port groups
op.setPortGroup("Connectivity", [inMode, inMidiDevice]);
op.setPortGroup("Target Selection", [inTargetMode]);
op.setPortGroup("Individual Control", [inControlSelect, inColorMode, inPaletteColor, inRed, inGreen, inBlue]);
op.setPortGroup("Bulk Array", [inPaletteArray, inRgbArray]);
op.setPortGroup("Actions", [inSend]);

function updatePortVisibility() {
    const mode = inTargetMode.get();
    inControlSelect.setUiAttribs({ "greyout": mode !== "Individual Control" });
    inColorMode.setUiAttribs({ "greyout": mode !== "Individual Control" });
    inPaletteColor.setUiAttribs({ "greyout": mode !== "Individual Control" || inColorMode.get() !== "Palette" });
    inRed.setUiAttribs({ "greyout": mode !== "Individual Control" || inColorMode.get() !== "RGB" });
    inGreen.setUiAttribs({ "greyout": mode !== "Individual Control" || inColorMode.get() !== "RGB" });
    inBlue.setUiAttribs({ "greyout": mode !== "Individual Control" || inColorMode.get() !== "RGB" });

    inPaletteArray.setUiAttribs({ "greyout": (mode !== "All Knobs Array" && mode !== "All Buttons Array") || inColorMode.get() !== "Palette" });
    inRgbArray.setUiAttribs({ "greyout": (mode !== "All Knobs Array" && mode !== "All Buttons Array") || inColorMode.get() !== "RGB" });
}

// Initial call to set visibility
updatePortVisibility();


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
    } else {
        outStatus.set("Device not found");
        outConnected.set(false);
    }
}

// Connection Mode Handlers
inMode.onChange = updateConnection;
inMidiDevice.onChange = updateConnection;

// MIDI Sender Function (handles single message or array of messages)
function sendMidiMessage(bytes) {
    outMidiMessages.set(bytes);
    if (outputDevice && inActive.get()) {
        if (bytes.length > 0 && Array.isArray(bytes[0])) {
            for (const msg of bytes) {
                try {
                    outputDevice.send(msg);
                } catch (e) {
                    outStatus.set("Send Error: " + e.message);
                }
            }
        } else {
            try {
                outputDevice.send(bytes);
            } catch (e) {
                outStatus.set("Send Error: " + e.message);
            }
        }
    }
}

// Helper to get MIDI status byte with the correct channel (knobs on Ch 16, buttons on Ch 1)
function getMidiStatusForCc(cc) {
    if (cc >= 5 && cc <= 36) {
        return 0xBF; // Channel 16 Control Change
    }
    return 0xB0; // Channel 1 Control Change
}

function sendIndividualColor() {
    const controlName = inControlSelect.get();
    const cc = controlMap[controlName];
    if (cc === undefined) return;

    if (inColorMode.get() === "Palette") {
        const color = Math.min(127, Math.max(0, inPaletteColor.get()));
        const status = getMidiStatusForCc(cc);
        sendMidiMessage([status, cc, color]);
    } else {
        const r = Math.min(127, Math.max(0, Math.floor(inRed.get() * 127)));
        const g = Math.min(127, Math.max(0, Math.floor(inGreen.get() * 127)));
        const b = Math.min(127, Math.max(0, Math.floor(inBlue.get() * 127)));
        sendMidiMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x01, 0x53, cc, r, g, b, 0xF7]);
    }
}

function sendArrayColors(targetMode) {
    const isPalette = inColorMode.get() === "Palette";
    const ccList = (targetMode === "All Knobs Array") ? knobCcList : buttonCcList;
    const messages = [];

    if (isPalette) {
        const arr = inPaletteArray.get();
        if (!arr || !Array.isArray(arr)) return;
        const limit = Math.min(arr.length, ccList.length);
        for (let i = 0; i < limit; i++) {
            const val = Math.min(127, Math.max(0, Math.floor(arr[i] || 0)));
            const cc = ccList[i];
            const status = getMidiStatusForCc(cc);
            messages.push([status, cc, val]);
        }
    } else {
        const arr = inRgbArray.get();
        if (!arr || !Array.isArray(arr)) return;
        const limit = Math.min(Math.floor(arr.length / 3), ccList.length);
        for (let i = 0; i < limit; i++) {
            const r = Math.min(127, Math.max(0, Math.floor((arr[i * 3 + 0] || 0) * 127)));
            const g = Math.min(127, Math.max(0, Math.floor((arr[i * 3 + 1] || 0) * 127)));
            const b = Math.min(127, Math.max(0, Math.floor((arr[i * 3 + 2] || 0) * 127)));
            messages.push([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x01, 0x53, ccList[i], r, g, b, 0xF7]);
        }
    }
    if (messages.length > 0) {
        sendMidiMessage(messages);
    }
}

function clearAllColors() {
    const messages = [];
    for (const key in controlMap) {
        const cc = controlMap[key];
        const status = getMidiStatusForCc(cc);
        messages.push([status, cc, 0]);
        messages.push([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x01, 0x53, cc, 0, 0, 0, 0xF7]);
    }
    sendMidiMessage(messages);
}

function executeSend() {
    if (!inActive.get()) return;

    const mode = inTargetMode.get();
    if (mode === "Individual Control") {
        sendIndividualColor();
    } else if (mode === "All Knobs Array" || mode === "All Buttons Array") {
        sendArrayColors(mode);
    } else if (mode === "Clear All") {
        clearAllColors();
    }
}

// Live trigger on change for parameters
inControlSelect.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };
inColorMode.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };
inPaletteColor.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };
inRed.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };
inGreen.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };
inBlue.onChange = () => { if (inTargetMode.get() === "Individual Control") sendIndividualColor(); };

// Auto-trigger when switching Target Mode or changing Arrays
inTargetMode.onChange = () => {
    updatePortVisibility();
    executeSend();
};
inPaletteArray.onChange = () => {
    const mode = inTargetMode.get();
    if (mode === "All Knobs Array" || mode === "All Buttons Array") {
        executeSend();
    }
};
inRgbArray.onChange = () => {
    const mode = inTargetMode.get();
    if (mode === "All Knobs Array" || mode === "All Buttons Array") {
        executeSend();
    }
};

// Action trigger button
inSend.onTriggered = executeSend;

// Cleanup on Op delete
op.onDelete = function () {
    if (outputDevice && inActive.get()) {
        try {
            // Turn off all LEDs on delete
            for (const key in controlMap) {
                const cc = controlMap[key];
                const status = getMidiStatusForCc(cc);
                outputDevice.send([status, cc, 0]);
                outputDevice.send([0xF0, 0x00, 0x20, 0x29, 0x02, 0x15, 0x01, 0x53, cc, 0, 0, 0, 0xF7]);
            }
        } catch (e) {
            // Ignore error on cleanup
        }
    }
    outputDevice = null;
};

// Auto-initialize WebMIDI scan
requestMidi();

