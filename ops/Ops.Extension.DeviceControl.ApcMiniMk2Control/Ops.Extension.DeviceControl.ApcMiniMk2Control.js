const cgl = op.patch.cgl;

// Input ports
const inUpdate = op.inTrigger("update");
const inActive = op.inBool("Active", true);
const inMode = op.inValueSelect("Mode", ["Direct MIDI", "Message Output Only"], "Direct MIDI");
const inMidiDevice = op.inValueSelect("MIDI Device", ["none"], "none");
const inPadsArray = op.inArray("Pads Array");
const inPadsObject = op.inObject("Pads Object");
const inHorizontalPadsArray = op.inArray("Horizontal Pads Array");
const inHorizontalPadsObject = op.inObject("Horizontal Pads Object");
const inVerticalPadsArray = op.inArray("Vertical Pads Array");
const inVerticalPadsObject = op.inObject("Vertical Pads Object");
const inShiftButton = op.inString("Shift Button", "off");
const inResetFaders = op.inTriggerButton("Reset Faders");
const inFaderDefaults = op.inArray("Fader Defaults", [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);

// Output ports
const outTrigger = op.outTrigger("trigger");
const outConnected = op.outBool("Connected", false);
const outStatus = op.outString("Status", "Disconnected");
const outMidiMessages = op.outObject("MIDI Messages", null);
const outFadersArray = op.outArray("Faders Array", null);
const outFadersObject = op.outObject("Faders Object", null);

// Individual faders
const outFaders = [];
const outFaderTurns = [];
for (let i = 0; i < 8; i++) {
    outFaders.push(op.outNumber("Fader " + (i + 1), 0.0));
}
const outMasterFader = op.outNumber("Master Fader", 0.0);

for (let i = 0; i < 8; i++) {
    outFaderTurns.push(op.outTrigger("Fader " + (i + 1) + " Turn"));
}
const outMasterFaderTurn = op.outTrigger("Master Fader Turn");

// Pads Grid Outputs
const outPadPress = op.outTrigger("Pad Press");
const outPadRelease = op.outTrigger("Pad Release");
const outLastPadIndex = op.outNumber("Last Pad Index", 0);
const outLastPadRow = op.outNumber("Last Pad Row", 0);
const outLastPadCol = op.outNumber("Last Pad Col", 0);
const outLastPadVelocity = op.outNumber("Last Pad Velocity", 0);
const outPadsState = op.outArray("Pads State", null);
const outPadsStateObject = op.outObject("Pads State Object", null);

// Bottom Buttons Outputs
const outHorizontalPress = op.outTrigger("Horizontal Press");
const outHorizontalRelease = op.outTrigger("Horizontal Release");
const outLastHorizontalIndex = op.outNumber("Last Horizontal Index", 0);

// Side Buttons Outputs
const outVerticalPress = op.outTrigger("Vertical Press");
const outVerticalRelease = op.outTrigger("Vertical Release");
const outLastVerticalIndex = op.outNumber("Last Vertical Index", 0);

const outHorizontalState = op.outArray("Horizontal State", null);
const outVerticalState = op.outArray("Vertical State", null);
const outShiftState = op.outBool("Shift State", false);
const outButtonsState = op.outObject("Buttons State", null);

// Port groups
op.setPortGroup("Connectivity", [inMode, inMidiDevice]);
op.setPortGroup("Pads", [inPadsArray, inPadsObject]);
op.setPortGroup("Horizontal Buttons", [inHorizontalPadsArray, inHorizontalPadsObject]);
op.setPortGroup("Vertical Buttons", [inVerticalPadsArray, inVerticalPadsObject]);
op.setPortGroup("Buttons", [inShiftButton]);
op.setPortGroup("Faders", [inResetFaders, inFaderDefaults]);

// MIDI Access State
let midi = null;
let outputDevice = null;
let inputDevice = null;
const deviceMap = new Map();

// Local Cache Structures to avoid spamming the device
const lastPadMessages = new Array(64).fill(null).map(() => new Uint8Array(0));
const lastHorizontalPads = new Array(8).fill(null);
const lastVerticalPads = new Array(8).fill(null);
let lastShiftPad = null;
let checkIndex = 0;

// Local Input States
const padsState = new Array(64).fill(false);
const horizontalState = new Array(8).fill(false);
const verticalState = new Array(8).fill(false);
const fadersArray = new Array(9).fill(0.0);
const fadersObject = {
    fader1: 0.0, fader2: 0.0, fader3: 0.0, fader4: 0.0,
    fader5: 0.0, fader6: 0.0, fader7: 0.0, fader8: 0.0,
    master: 0.0
};
const buttonsStateObject = {
    track1: false, track2: false, track3: false, track4: false,
    track5: false, track6: false, track7: false, track8: false,
    scene1: false, scene2: false, scene3: false, scene4: false,
    scene5: false, scene6: false, scene7: false, scene8: false,
    shift: false
};
const padsStateObject = {};



// Utility to compare arrays
function arraysEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// APCMiniCore Message Encoding Helpers
function encodePadMessage(note, color, behavior = 'solid', speed = 100) {
    let channel = 0x90; // Default Solid 10%

    if (behavior === 'solid') {
        const brightnessMap = { 10: 0x90, 25: 0x91, 50: 0x92, 65: 0x93, 75: 0x94, 90: 0x95, 100: 0x96 };
        channel = brightnessMap[speed] || 0x96;
    } else if (behavior === 'pulse') {
        const pulseMap = { '1/16': 0x97, '1/8': 0x98, '1/4': 0x99, '1/2': 0x9A };
        channel = pulseMap[speed] || 0x97;
    } else if (behavior === 'blink') {
        const blinkMap = { '1/24': 0x9B, '1/16': 0x9C, '1/8': 0x9D, '1/4': 0x9E, '1/2': 0x9F };
        channel = blinkMap[speed] || 0x9C;
    }

    return new Uint8Array([channel, note, color]);
}

function encodeButtonMessage(note, state = 'on') {
    let velocity = 0x01; // Solid On
    if (state === 'off' || state === false) velocity = 0x00;
    if (state === 'on' || state === true) velocity = 0x01;
    if (state === 'blink') velocity = 0x02;

    return new Uint8Array([0x90, note, velocity]);
}

function encodeIntroMessage() {
    return new Uint8Array([
        0xF0, 0x47, 0x7F, 0x4F, 0x60, 0x00, 0x04, 0x00, 0x01, 0x00, 0x00, 0xF7
    ]);
}

function encodeModeMessage(mode = 0) {
    return new Uint8Array([
        0xF0, 0x47, 0x7F, 0x4F, 0x62, 0x00, 0x01, mode, 0xF7
    ]);
}



function sendMidiMessage(bytes) {
    outMidiMessages.set(Array.from(bytes));
    if (outputDevice) {
        try {
            outputDevice.send(bytes);
        } catch (e) {
            outStatus.set("Send Error: " + e.message);
        }
    }
}

// Parse input helpers for array/object ports
function normalizeButtonState(val) {
    if (val === null || val === undefined) return 'off';
    if (typeof val === "boolean") return val ? 'on' : 'off';
    if (typeof val === "number") {
        if (val === 0) return 'off';
        if (val === 1) return 'on';
        if (val === 2) return 'blink';
        return val > 0 ? 'on' : 'off';
    }
    if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        if (lower === 'on' || lower === 'solid' || lower === 'true' || lower === '1') return 'on';
        if (lower === 'blink' || lower === '2') return 'blink';
        if (lower === 'off' || lower === 'false' || lower === '0') return 'off';
        return 'off';
    }
    return 'off';
}

function getPadInputVal(note) {
    if (inPadsObject.isLinked()) {
        const padsObj = inPadsObject.get();
        if (padsObj && typeof padsObj === "object") {
            const keys = [note, note.toString(), "0x" + note.toString(16), "0x" + note.toString(16).toUpperCase()];
            for (const k of keys) {
                if (padsObj[k] !== undefined) {
                    return padsObj[k];
                }
            }
        }
    }

    if (inPadsArray.isLinked()) {
        const padsArr = inPadsArray.get();
        if (padsArr && Array.isArray(padsArr)) {
            if (padsArr.length === 192) {
                return [padsArr[note * 3], padsArr[note * 3 + 1], padsArr[note * 3 + 2]];
            }
            if (padsArr[note] !== undefined) {
                return padsArr[note];
            }
        }
    }

    return undefined;
}

function processPadValue(note, val) {
    if (val === null || val === undefined) {
        return encodePadMessage(note, 0, 'solid', 100);
    }

    if (val && typeof val === "object" && val.color !== undefined) {
        const color = Math.max(0, Math.min(127, Math.floor(val.color)));
        const behavior = val.behavior || 'solid';
        const speed = val.speed !== undefined ? val.speed : 100;
        return encodePadMessage(note, color, behavior, speed);
    }

    if (typeof val === "number") {
        return encodePadMessage(note, Math.max(0, Math.min(127, Math.floor(val))), 'solid', 100);
    }

    return encodePadMessage(note, 0, 'solid', 100);
}

function getHorizontalInputVal(i) {
    const note = 0x64 + i;
    if (inHorizontalPadsObject.isLinked()) {
        const obj = inHorizontalPadsObject.get();
        if (obj && typeof obj === "object") {
            const keys = [i, i.toString(), note, note.toString(), "0x" + note.toString(16), (i + 1).toString(), "track" + (i + 1)];
            for (const k of keys) {
                if (obj[k] !== undefined) {
                    return obj[k];
                }
            }
        }
    }

    if (inHorizontalPadsArray.isLinked()) {
        const arr = inHorizontalPadsArray.get();
        if (arr && Array.isArray(arr)) {
            if (arr[i] !== undefined) {
                return arr[i];
            }
        }
    }
    return undefined;
}

function getVerticalInputVal(i) {
    const note = 0x70 + i;
    if (inVerticalPadsObject.isLinked()) {
        const obj = inVerticalPadsObject.get();
        if (obj && typeof obj === "object") {
            const keys = [i, i.toString(), note, note.toString(), "0x" + note.toString(16), (i + 1).toString(), "scene" + (i + 1)];
            for (const k of keys) {
                if (obj[k] !== undefined) {
                    return obj[k];
                }
            }
        }
    }

    if (inVerticalPadsArray.isLinked()) {
        const arr = inVerticalPadsArray.get();
        if (arr && Array.isArray(arr)) {
            if (arr[i] !== undefined) {
                return arr[i];
            }
        }
    }
    return undefined;
}

function getShiftInputVal() {
    return inShiftButton.get();
}

// State update handlers
function updateButtonsStateObject() {
    for (let i = 0; i < 8; i++) {
        buttonsStateObject["track" + (i + 1)] = horizontalState[i];
        buttonsStateObject["scene" + (i + 1)] = verticalState[i];
    }
    buttonsStateObject.shift = outShiftState.get() || false;
    outButtonsState.set(buttonsStateObject);
}

function updatePadsStateObject() {
    for (let i = 0; i < 64; i++) {
        padsStateObject[i] = padsState[i];
    }
    outPadsStateObject.set(padsStateObject);
}

function updateFaderState(index, byteValue) {
    const val = byteValue / 127;
    if (fadersArray[index] !== val) {
        fadersArray[index] = val;
        outFadersArray.set(fadersArray);

        const key = index === 8 ? "master" : "fader" + (index + 1);
        fadersObject[key] = val;
        outFadersObject.set(fadersObject);

        if (index < 8) {
            outFaders[index].set(val);
            outFaderTurns[index].trigger();
        } else {
            outMasterFader.set(val);
            outMasterFaderTurn.trigger();
        }
    }
}

function resetFaders() {
    const defaults = inFaderDefaults.get();
    if (defaults && defaults.length >= 9) {
        for (let i = 0; i < 9; i++) {
            const val = defaults[i] !== undefined ? defaults[i] : 0.0;
            updateFaderState(i, Math.round(val * 127));
        }
    } else {
        for (let i = 0; i < 9; i++) {
            updateFaderState(i, 0);
        }
    }
}

// Receive MIDI Event Handler
function onMidiMessage(event) {
    const data = event.data;
    if (!data) return;

    outMidiMessages.set(Array.from(data));

    const status = data[0];
    const type = status & 0xF0;

    // 1. SysEx messages (Fader status report on handshake)
    if (status === 0xF0) {
        if (data[1] === 0x47 && data[4] === 0x61) {
            for (let i = 0; i < 9; i++) {
                const val = data[7 + i];
                if (val !== undefined) {
                    updateFaderState(i, val);
                }
            }
        }
        return;
    }

    // 2. Note Messages (Pads, Buttons)
    if (type === 0x90 || type === 0x80) {
        const note = data[1];
        const velocity = data[2];
        const isPress = (type === 0x90 && velocity > 0);

        // A. Grid Pads (0x00 - 0x3F)
        if (note >= 0x00 && note <= 0x3F) {
            padsState[note] = isPress;
            outLastPadIndex.set(note);
            outLastPadRow.set(Math.floor(note / 8));
            outLastPadCol.set(note % 8);
            outLastPadVelocity.set(isPress ? velocity : 0);

            if (isPress) outPadPress.trigger();
            else outPadRelease.trigger();

            outPadsState.set(padsState);
            updatePadsStateObject();
        }

        // B. Track Buttons (0x64 - 0x6B)
        else if (note >= 0x64 && note <= 0x6B) {
            const idx = note - 0x64;
            horizontalState[idx] = isPress;
            outLastHorizontalIndex.set(idx);

            if (isPress) outHorizontalPress.trigger();
            else outHorizontalRelease.trigger();

            outHorizontalState.set(horizontalState);
            updateButtonsStateObject();
        }

        // C. Scene Buttons (0x70 - 0x77)
        else if (note >= 0x70 && note <= 0x77) {
            const idx = note - 0x70;
            verticalState[idx] = isPress;
            outLastVerticalIndex.set(idx);

            if (isPress) outVerticalPress.trigger();
            else outVerticalRelease.trigger();

            outVerticalState.set(verticalState);
            updateButtonsStateObject();
        }

        // D. Shift Button (0x7A)
        else if (note === 0x7A) {
            outShiftState.set(isPress);
            updateButtonsStateObject();
        }
    }

    // 3. CC Messages (Faders CC 0x30 - 0x38)
    if (type === 0xB0) {
        const cc = data[1];
        const value = data[2];
        if (cc >= 0x30 && cc <= 0x38) {
            updateFaderState(cc - 0x30, value);
        }
    }
}

// MIDI Connect logic
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
        if (inputDevice) inputDevice.onmidimessage = null;
        outputDevice = null;
        inputDevice = null;
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
        if (inputDevice) inputDevice.onmidimessage = null;
        outputDevice = null;
        inputDevice = null;
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
        if (inputDevice) inputDevice.onmidimessage = null;
        inputDevice = null;
        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            if (input.value.name === outputDevice.name) {
                inputDevice = input.value;
                break;
            }
        }

        outStatus.set("Connected to " + outputDevice.name);
        outConnected.set(true);

        if (inputDevice) {
            inputDevice.onmidimessage = onMidiMessage;
        }

        sendMidiMessage(encodeIntroMessage());
        sendMidiMessage(encodeModeMessage(0)); // Force Session Mode (0 = Ableton/Session Mode)
    } else {
        outStatus.set("Device not found");
        outConnected.set(false);
    }
}

// Cache clearing helpers to force full LED updates when inputs change or disconnect
function clearPadsCache() {
    for (let i = 0; i < 64; i++) {
        lastPadMessages[i] = new Uint8Array(0);
    }
}
function clearHorizontalCache() {
    lastHorizontalPads.fill(null);
}
function clearVerticalCache() {
    lastVerticalPads.fill(null);
}
function clearShiftCache() {
    lastShiftPad = null;
}

// Port listeners
inMode.onChange = updateConnection;
inMidiDevice.onChange = updateConnection;
inResetFaders.onTriggered = resetFaders;

inPadsArray.onChange = clearPadsCache;
inPadsObject.onChange = clearPadsCache;

inHorizontalPadsArray.onChange = clearHorizontalCache;
inHorizontalPadsObject.onChange = clearHorizontalCache;
inVerticalPadsArray.onChange = clearVerticalCache;
inVerticalPadsObject.onChange = clearVerticalCache;
inShiftButton.onChange = clearShiftCache;

// Main update tick
inUpdate.onTriggered = function () {
    if (!inActive.get()) return;

    // 1. Process Grid Pads (8x8) with round-robin scheduler
    let sentCount = 0;
    const MAX_SYSEX_PER_FRAME = 8; // Restrict to 8 updates/SysEx per frame to prevent overflow
    for (let i = 0; i < 64; i++) {
        const note = (checkIndex + i) % 64;
        const val = getPadInputVal(note);
        const msg = processPadValue(note, val);
        if (!arraysEqual(lastPadMessages[note], msg)) {
            if (sentCount < MAX_SYSEX_PER_FRAME) {
                sendMidiMessage(msg);
                lastPadMessages[note] = msg;
                sentCount++;
            } else {
                checkIndex = note;
                break;
            }
        }
    }
    if (sentCount < MAX_SYSEX_PER_FRAME) {
        checkIndex = 0;
    }

    // 2. Process Horizontal Buttons (Track buttons 1-8)
    for (let i = 0; i < 8; i++) {
        const val = getHorizontalInputVal(i);
        const state = normalizeButtonState(val);
        if (lastHorizontalPads[i] !== state) {
            const note = 0x64 + i;
            sendMidiMessage(encodeButtonMessage(note, state));
            lastHorizontalPads[i] = state;
        }
    }

    // 3. Process Vertical Buttons (Scene buttons 1-8)
    for (let i = 0; i < 8; i++) {
        const val = getVerticalInputVal(i);
        const state = normalizeButtonState(val);
        if (lastVerticalPads[i] !== state) {
            const note = 0x70 + i;
            sendMidiMessage(encodeButtonMessage(note, state));
            lastVerticalPads[i] = state;
        }
    }

    // 4. Process Shift Button LED (note 0x7A)
    const shiftVal = getShiftInputVal();
    const shiftState = normalizeButtonState(shiftVal);
    if (lastShiftPad !== shiftState) {
        sendMidiMessage(encodeButtonMessage(0x7A, shiftState));
        lastShiftPad = shiftState;
    }

    outTrigger.trigger();
};

// Cleanup on delete
op.onDelete = function () {
    if (inputDevice) {
        inputDevice.onmidimessage = null;
    }
    inputDevice = null;
    outputDevice = null;
};

// Init
resetFaders();
requestMidi();
