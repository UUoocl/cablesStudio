const cgl = op.patch.cgl;

// Input ports
const inUpdate = op.inTrigger("update");
const inActive = op.inBool("Active", true);
const inMode = op.inValueSelect("Mode", ["Direct MIDI", "Message Output Only"], "Direct MIDI");
const inMidiDevice = op.inValueSelect("MIDI Device", ["none"], "none");
const inPadsTexture = op.inTexture("Pads Texture");

// Default sample pattern: red/green color gradient across 4 rows and 16 columns
const defaultPadsArray = [];
for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 16);
    const col = i % 16;
    defaultPadsArray.push([row / 3, col / 15, 0.0]);
}
const inPadsArray = op.inArray("Pads Array", defaultPadsArray);
const inMuteLights = op.inArray("Mute Lights", [true, false, true, false]);
const inOledTexture = op.inTexture("OLED Texture");
const inOledText = op.inString("OLED Text", "");
const inOledDrawMode = op.inValueSelect("OLED Draw Mode", ["Text Only", "Texture Only", "Combined"], "Text Only");
const inOledSendTrigger = op.inTriggerButton("OLED Send Trigger");

const defaultButtonLights = {
    "patternUp": true,
    "patternDown": false,
    "browser": false,
    "gridLeft": false,
    "gridRight": false
};
const inButtonLights = op.inObject("Button Lights", defaultButtonLights);
const inBrightness = op.inValueSlider("Brightness", 1.0);
const inResetKnobs = op.inTriggerButton("Reset Knobs");
const inKnobDefaults = op.inArray("Knob Defaults", [0.5, 0.5, 0.5, 0.5, 0.0]);

// Output ports
const outTrigger = op.outTrigger("trigger");
const outConnected = op.outBool("Connected", false);
const outStatus = op.outString("Status", "Disconnected");
const outMidiMessages = op.outObject("MIDI Messages", null);
const outKnobsObject = op.outObject("Knobs Object", null);
const outKnobVol = op.outNumber("Knob Vol", 0.5);
const outKnobPan = op.outNumber("Knob Pan", 0.5);
const outKnobFilter = op.outNumber("Knob Filter", 0.5);
const outKnobRes = op.outNumber("Knob Res", 0.5);
const outKnobSelect = op.outNumber("Knob Select", 0.0);
const outKnobVolTurn = op.outTrigger("Knob Vol Turn");
const outKnobPanTurn = op.outTrigger("Knob Pan Turn");
const outKnobFilterTurn = op.outTrigger("Knob Filter Turn");
const outKnobResTurn = op.outTrigger("Knob Res Turn");
const outKnobSelectTurn = op.outTrigger("Knob Select Turn");
const outPadPress = op.outTrigger("Pad Press");
const outPadRelease = op.outTrigger("Pad Release");
const outLastPadIndex = op.outNumber("Last Pad Index", 0);
const outLastPadRow = op.outNumber("Last Pad Row", 0);
const outLastPadCol = op.outNumber("Last Pad Col", 0);
const outLastPadVelocity = op.outNumber("Last Pad Velocity", 0);
const outPadsState = op.outArray("Pads State", null);
const outMute1 = op.outBool("Mute 1", false);
const outMute2 = op.outBool("Mute 2", false);
const outMute3 = op.outBool("Mute 3", false);
const outMute4 = op.outBool("Mute 4", false);
const outButtonsState = op.outObject("Buttons State", null);

// Port groups
op.setPortGroup("Connectivity", [inMode, inMidiDevice]);
op.setPortGroup("Pads", [inPadsTexture, inPadsArray, inBrightness]);
op.setPortGroup("Mute Lights", [inMuteLights]);
op.setPortGroup("OLED", [inOledTexture, inOledText, inOledDrawMode, inOledSendTrigger]);
op.setPortGroup("Buttons", [inButtonLights]);
op.setPortGroup("Knobs", [inResetKnobs, inKnobDefaults]);

// MIDI Access State
let midi = null;
let outputDevice = null;
let inputDevice = null;
const deviceMap = new Map();

// Local structures to avoid spamming the device
const lastPadColors = new Array(64).fill(null).map(() => ({ r: -1, g: -1, b: -1 }));
const lastMuteLights = new Array(4).fill(null);
const lastButtonLights = {};
const padsState = new Array(64).fill(false);
const activeButtons = {};

// Knob States
let knobVol = 0.5;
let knobPan = 0.5;
let knobFilter = 0.5;
let knobRes = 0.5;
let knobSelect = 0.0;

// OLED Downsampling and State
let fbPads = null;
let fbOled = null;
let quadMesh = null;
const pixelReaderPads = new CGL.PixelReader();
const pixelReaderOled = new CGL.PixelReader();

// OLED limit parameters
let lastOledSendTime = 0;
const OLED_MIN_INTERVAL = 150; // ms
let triggerSendOled = false;
let oledNeedsUpdate = false;

// Shader setup
const bgFrag = `
    UNI sampler2D tex;
    IN vec2 texCoord;
    void main()
    {
       outColor = texture2D(tex, texCoord);
    }
`;
const bgShader = new CGL.Shader(cgl, "fire_downsample_shader");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);

// Mapping matrices & fonts
const baseNotes = [0x36, 0x46, 0x56, 0x66];

const buttonCCNames = {
  0x1F: "patternUp",
  0x20: "patternDown",
  0x21: "browser",
  0x22: "gridLeft",
  0x23: "gridRight",
  0x24: "solo1",
  0x25: "solo2",
  0x26: "solo3",
  0x27: "solo4",
  0x19: "selectPress",
  0x2C: "step",
  0x2D: "note",
  0x2E: "drum",
  0x2F: "perform",
  0x32: "shift",
  0x33: "alt",
  0x38: "play",
  0x39: "stop",
  0x3A: "record"
};

const buttonLightsMap = {
  "patternUp": 0x1F,
  "patternDown": 0x20,
  "browser": 0x21,
  "gridLeft": 0x22,
  "gridRight": 0x23,
  "solo1": 0x24,
  "solo2": 0x25,
  "solo3": 0x26,
  "solo4": 0x27,
  "selectPress": 0x19,
  "step": 0x2C,
  "note": 0x2D,
  "drum": 0x2E,
  "perform": 0x2F,
  "shift": 0x32,
  "alt": 0x33,
  "play": 0x38,
  "stop": 0x39,
  "record": 0x3A
};

const bitMutate = [
  [13, 19, 25, 31, 37, 43, 49],
  [0, 20, 26, 32, 38, 44, 50],
  [1, 7, 27, 33, 39, 45, 51],
  [2, 8, 14, 34, 40, 46, 52],
  [3, 9, 15, 21, 41, 47, 53],
  [4, 10, 16, 22, 28, 48, 54],
  [5, 11, 17, 23, 29, 35, 55],
  [6, 12, 18, 24, 30, 36, 42]
];

const font = {
  'A': [0x7E, 0x11, 0x11, 0x11, 0x7E],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
  'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
  'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
  'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
  'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
  'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
  'W': [0x3F, 0x40, 0x38, 0x40, 0x3F],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
  '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1E]
};

// Functions
function createMesh() {
    const geom = new CGL.Geometry("fire quad");
    geom.vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    geom.texCoords = [
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
    ];
    geom.verticesIndices = [
        0, 1, 2,
        2, 1, 3
    ];
    quadMesh = new CGL.Mesh(cgl, geom);
}

function initFramebuffers() {
    if (!fbPads) {
        fbPads = new CGL.Framebuffer2(cgl, 16, 4, {
            "name": "fire_pads_downsample",
            "depth": false,
            "multisampling": false
        });
    }
    if (!fbOled) {
        fbOled = new CGL.Framebuffer2(cgl, 128, 64, {
            "name": "fire_oled_downsample",
            "depth": false,
            "multisampling": false
        });
    }
}

function getPadFromNote(note) {
    for (let r = 0; r < 4; r++) {
        if (note >= baseNotes[r] && note < baseNotes[r] + 16) {
            return { row: r, col: note - baseNotes[r] };
        }
    }
    return null;
}

function parseInput(data) {
    if (data.length < 3) return null;
    const status = data[0];
    const note = data[1];
    const velocity = data[2];

    const cmd = status & 0xF0;

    if (cmd === 0x90 || cmd === 0x80) {
        const isPress = (cmd === 0x90 && velocity > 0);
        return { type: 'note', note, velocity, isPress };
    } else if (cmd === 0xB0) {
        return { type: 'cc', cc: note, value: velocity };
    }
    return null;
}

function sendMidiMessage(bytes) {
    outMidiMessages.set(bytes);
    if (outputDevice) {
        try {
            outputDevice.send(bytes);
        } catch (e) {
            outStatus.set("Send Error: " + e.message);
        }
    }
}

function createRGBMessage(index, r, g, b) {
    return new Uint8Array([
      0xF0, 0x47, 0x7F, 0x43, 0x65,
      0x00, 0x04,
      index, r, g, b,
      0xF7
    ]);
}

function resetKnobs() {
    const defaults = inKnobDefaults.get();
    if (defaults && defaults.length >= 5) {
        knobVol = defaults[0] !== undefined ? defaults[0] : 0.5;
        knobPan = defaults[1] !== undefined ? defaults[1] : 0.5;
        knobFilter = defaults[2] !== undefined ? defaults[2] : 0.5;
        knobRes = defaults[3] !== undefined ? defaults[3] : 0.5;
        knobSelect = defaults[4] !== undefined ? defaults[4] : 0.0;
    } else {
        knobVol = 0.5;
        knobPan = 0.5;
        knobFilter = 0.5;
        knobRes = 0.5;
        knobSelect = 0.0;
    }
    outKnobVol.set(knobVol);
    outKnobPan.set(knobPan);
    outKnobFilter.set(knobFilter);
    outKnobRes.set(knobRes);
    outKnobSelect.set(knobSelect);
    updateKnobsObject();
}

function updateKnobsObject() {
    outKnobsObject.set({
        "vol": knobVol,
        "pan": knobPan,
        "filter": knobFilter,
        "res": knobRes,
        "select": knobSelect
    });
}

function handleKnobCC(cc, value) {
    const delta = (value <= 0x3F) ? value : (value - 128);
    // Relative scaling step: 0.02
    if (cc === 0x10) {
        knobVol = Math.max(0.0, Math.min(1.0, knobVol + delta * 0.02));
        outKnobVol.set(knobVol);
        outKnobVolTurn.trigger();
    } else if (cc === 0x11) {
        knobPan = Math.max(0.0, Math.min(1.0, knobPan + delta * 0.02));
        outKnobPan.set(knobPan);
        outKnobPanTurn.trigger();
    } else if (cc === 0x12) {
        knobFilter = Math.max(0.0, Math.min(1.0, knobFilter + delta * 0.02));
        outKnobFilter.set(knobFilter);
        outKnobFilterTurn.trigger();
    } else if (cc === 0x13) {
        knobRes = Math.max(0.0, Math.min(1.0, knobRes + delta * 0.02));
        outKnobRes.set(knobRes);
        outKnobResTurn.trigger();
    } else if (cc === 0x76) {
        knobSelect = Math.max(0.0, Math.min(1.0, knobSelect + delta * 0.02));
        outKnobSelect.set(knobSelect);
        outKnobSelectTurn.trigger();
    }
    updateKnobsObject();
}

function encodeOledBuffer(pixelData) {
    const buffer = new Uint8Array(1171);
    
    function setPixel(x, y, on) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) return;
        const stripX = x + 128 * Math.floor(y / 8);
        const stripY = y % 8;
        const blockIdx = Math.floor(stripX / 7);
        const colInBlock = stripX % 7;
        const bitIdx = bitMutate[stripY][colInBlock];
        const byteOffsetInBlock = Math.floor(bitIdx / 7);
        const bitInByte = bitIdx % 7;
        const byteIndex = (blockIdx * 8) + byteOffsetInBlock;
        if (byteIndex >= buffer.length) return;
        if (on) {
            buffer[byteIndex] |= (1 << bitInByte);
        } else {
            buffer[byteIndex] &= ~(1 << bitInByte);
        }
    }

    const drawMode = inOledDrawMode.get();
    
    // 1. Draw Text
    if (drawMode === "Text Only" || drawMode === "Combined") {
        const text = inOledText.get();
        if (text) {
            let cursorX = 0;
            const startY = 28; // Center vertically
            for (const char of text) {
                const bitmap = font[char.toUpperCase()] || [0x7F, 0x7F, 0x7F, 0x7F, 0x7F];
                for (let i = 0; i < 5; i++) {
                    for (let bit = 0; bit < 8; bit++) {
                        if (bitmap[i] & (1 << bit)) {
                            setPixel(cursorX + i, startY + bit, true);
                        }
                    }
                }
                cursorX += 6;
                if (cursorX >= 128) break;
            }
        }
    }

    // 2. Draw Texture
    if ((drawMode === "Texture Only" || drawMode === "Combined") && pixelData) {
        for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 128; x++) {
                const pixelY = 63 - y; // Flip Y for WebGL
                const idx = (pixelY * 128 + x) * 4;
                const r = pixelData[idx + 0];
                const g = pixelData[idx + 1];
                const b = pixelData[idx + 2];
                const on = (r + g + b) > 382;
                
                if (drawMode === "Combined") {
                    if (on) setPixel(x, y, true);
                } else {
                    setPixel(x, y, on);
                }
            }
        }
    }

    const header = [
      0xF0, 0x47, 0x7F, 0x43, 0x0E,
      0x09, 0x17,
      0x00, 0x07,
      0x00, 0x7F
    ];
    const message = new Uint8Array(header.length + buffer.length + 1);
    message.set(header);
    message.set(buffer, header.length);
    message[message.length - 1] = 0xF7;
    return message;
}

function processPadsPixels(pixelData) {
    const brightness = inBrightness.get();
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 16; x++) {
            const padRow = 3 - y;
            const padCol = x;
            const index = padRow * 16 + padCol;
            
            const idx = (y * 16 + x) * 4;
            const rPixel = pixelData[idx + 0];
            const gPixel = pixelData[idx + 1];
            const bPixel = pixelData[idx + 2];

            const rVal = Math.min(127, Math.floor((rPixel / 2) * brightness));
            const gVal = Math.min(127, Math.floor((gPixel / 2) * brightness));
            const bVal = Math.min(127, Math.floor((bPixel / 2) * brightness));

            const lastColor = lastPadColors[index];
            if (lastColor.r !== rVal || lastColor.g !== gVal || lastColor.b !== bVal) {
                sendMidiMessage(createRGBMessage(index, rVal, gVal, bVal));
                lastPadColors[index] = { r: rVal, g: gVal, b: bVal };
            }
        }
    }
}

function processPadsArray() {
    const padsArray = inPadsArray.get();
    if (!padsArray || padsArray.length === 0) return;
    const brightness = inBrightness.get();
    
    for (let index = 0; index < 64; index++) {
        let rPixel = 0;
        let gPixel = 0;
        let bPixel = 0;

        if (padsArray.length >= 192) {
            const scale = (padsArray[0] <= 1.0 && padsArray[1] <= 1.0) ? 255 : 1;
            rPixel = padsArray[index * 3] * scale;
            gPixel = padsArray[index * 3 + 1] * scale;
            bPixel = padsArray[index * 3 + 2] * scale;
        } else if (padsArray[index]) {
            const col = padsArray[index];
            if (Array.isArray(col)) {
                const scale = (col[0] <= 1.0) ? 255 : 1;
                rPixel = col[0] * scale;
                gPixel = col[1] * scale;
                bPixel = col[2] * scale;
            } else if (col && col.r !== undefined) {
                const scale = (col.r <= 1.0) ? 255 : 1;
                rPixel = col.r * scale;
                gPixel = col.g * scale;
                bPixel = col.b * scale;
            }
        }

        const rVal = Math.min(127, Math.floor((rPixel / 2) * brightness));
        const gVal = Math.min(127, Math.floor((gPixel / 2) * brightness));
        const bVal = Math.min(127, Math.floor((bPixel / 2) * brightness));

        const lastColor = lastPadColors[index];
        if (lastColor.r !== rVal || lastColor.g !== gVal || lastColor.b !== bVal) {
            sendMidiMessage(createRGBMessage(index, rVal, gVal, bVal));
            lastPadColors[index] = { r: rVal, g: gVal, b: bVal };
        }
    }
}

function processMuteLights() {
    const lights = inMuteLights.get();
    if (!lights || lights.length === 0) return;
    
    for (let i = 0; i < 4; i++) {
        const val = lights[i];
        const isOn = (typeof val === "boolean") ? val : (val > 0);
        
        if (lastMuteLights[i] !== isOn) {
            const cc = 0x24 + i;
            const midiVal = isOn ? 0x02 : 0x00;
            sendMidiMessage(new Uint8Array([0xB0, cc, midiVal]));
            lastMuteLights[i] = isOn;
        }
    }
}

function processButtonLights() {
    const btnLights = inButtonLights.get();
    if (!btnLights || typeof btnLights !== "object") return;
    
    for (const name in btnLights) {
        const cc = buttonLightsMap[name] || parseInt(name);
        if (!isNaN(cc)) {
            const val = btnLights[name];
            const isOn = (typeof val === "boolean") ? (val ? 0x02 : 0x00) : val;
            if (lastButtonLights[cc] !== isOn) {
                sendMidiMessage(new Uint8Array([0xB0, cc, isOn]));
                lastButtonLights[cc] = isOn;
            }
        }
    }
}

function onMidiMessage(event) {
    const data = event.data;
    if (!data) return;
    
    outMidiMessages.set(Array.from(data));
    
    const parsed = parseInput(data);
    if (!parsed) return;
    
    if (parsed.type === 'note') {
        const padCoords = getPadFromNote(parsed.note);
        if (padCoords) {
            const idx = padCoords.row * 16 + padCoords.col;
            padsState[idx] = parsed.isPress;
            
            outLastPadIndex.set(idx);
            outLastPadRow.set(padCoords.row);
            outLastPadCol.set(padCoords.col);
            outLastPadVelocity.set(parsed.isPress ? parsed.velocity : 0);
            
            if (parsed.isPress) {
                outPadPress.trigger();
            } else {
                outPadRelease.trigger();
            }
            outPadsState.set(padsState);
        }
    } else if (parsed.type === 'cc') {
        const cc = parsed.cc;
        const value = parsed.value;
        
        if (cc === 0x10 || cc === 0x11 || cc === 0x12 || cc === 0x13 || cc === 0x76) {
            handleKnobCC(cc, value);
        } else {
            if (cc >= 0x24 && cc <= 0x27) {
                const muteIdx = cc - 0x24;
                const isPressed = value > 0;
                if (muteIdx === 0) outMute1.set(isPressed);
                else if (muteIdx === 1) outMute2.set(isPressed);
                else if (muteIdx === 2) outMute3.set(isPressed);
                else if (muteIdx === 3) outMute4.set(isPressed);
            }
            
            const btnName = buttonCCNames[cc] || `cc_${cc}`;
            activeButtons[btnName] = (value > 0);
            outButtonsState.set(activeButtons);
        }
    }
}

// MIDI Connectivity Setup
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
    } else {
        outStatus.set("Device not found");
        outConnected.set(false);
    }
}

// Change Handlers
inMode.onChange = updateConnection;
inMidiDevice.onChange = updateConnection;

inOledText.onChange = function() {
    oledNeedsUpdate = true;
};
inOledDrawMode.onChange = function() {
    oledNeedsUpdate = true;
};
inOledSendTrigger.onTriggered = function () {
    triggerSendOled = true;
};

// Render/Update Loop
inUpdate.onTriggered = function () {
    if (!inActive.get()) return;

    if (!quadMesh) createMesh();
    initFramebuffers();

    // 1. Process Pads
    const padsTex = inPadsTexture.get();
    if (padsTex && padsTex.tex) {
        fbPads.renderStart();
        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);
        cgl.pushViewMatrix();
        mat4.identity(cgl.vMatrix);
        cgl.pushModelMatrix();
        mat4.identity(cgl.mMatrix);
        cgl.pushShader(bgShader);
        cgl.setTexture(0, padsTex.tex);
        quadMesh.render(cgl.getShader());
        cgl.popShader();
        cgl.popPMatrix();
        cgl.popModelMatrix();
        cgl.popViewMatrix();
        fbPads.renderEnd();

        pixelReaderPads.read(cgl, fbPads.getGlFrameBuffer(), CGL.Texture.PFORMATSTR_RGBA8UB, 0, 0, 16, 4, (pixelData) => {
            if (!pixelData) return;
            processPadsPixels(pixelData);
        });
    } else {
        processPadsArray();
    }

    // 2. Process Mutes
    processMuteLights();

    // 3. Process OLED
    const oledDrawModeVal = inOledDrawMode.get();
    const oledTex = inOledTexture.get();
    const useTexture = (oledDrawModeVal === "Texture Only" || oledDrawModeVal === "Combined") && oledTex && oledTex.tex;
    
    const now = Date.now();
    const isIntervalPassed = (now - lastOledSendTime >= OLED_MIN_INTERVAL);
    const shouldSendOled = triggerSendOled || (isIntervalPassed && (oledNeedsUpdate || useTexture));

    if (shouldSendOled) {
        triggerSendOled = false;
        oledNeedsUpdate = false;
        lastOledSendTime = now;
        
        if (useTexture) {
            fbOled.renderStart();
            cgl.pushPMatrix();
            mat4.identity(cgl.pMatrix);
            cgl.pushViewMatrix();
            mat4.identity(cgl.vMatrix);
            cgl.pushModelMatrix();
            mat4.identity(cgl.mMatrix);
            cgl.pushShader(bgShader);
            cgl.setTexture(0, oledTex.tex);
            quadMesh.render(cgl.getShader());
            cgl.popShader();
            cgl.popPMatrix();
            cgl.popModelMatrix();
            cgl.popViewMatrix();
            fbOled.renderEnd();

            pixelReaderOled.read(cgl, fbOled.getGlFrameBuffer(), CGL.Texture.PFORMATSTR_RGBA8UB, 0, 0, 128, 64, (pixelData) => {
                if (!pixelData) return;
                const msg = encodeOledBuffer(pixelData);
                sendMidiMessage(msg);
            });
        } else {
            const msg = encodeOledBuffer(null);
            sendMidiMessage(msg);
        }
    }

    // 4. Process secondary button lights
    processButtonLights();

    outTrigger.trigger();
};

// Cleanup on operator delete
op.onDelete = function () {
    if (inputDevice) {
        inputDevice.onmidimessage = null;
    }
    inputDevice = null;
    outputDevice = null;
    if (fbPads) fbPads.delete();
    if (fbOled) fbOled.delete();
};

// Init
resetKnobs();
requestMidi();
