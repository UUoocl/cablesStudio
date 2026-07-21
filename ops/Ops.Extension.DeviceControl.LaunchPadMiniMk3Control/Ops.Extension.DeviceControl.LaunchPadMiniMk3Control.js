const cgl = op.patch.cgl;

// Input ports
const inUpdate = op.inTrigger("update");
const inTexture = op.inTexture("Texture");
const inActive = op.inBool("Active", true);
const inMode = op.inValueSelect("Mode", ["Direct MIDI", "Message Output Only"], "Direct MIDI");
const inMidiDevice = op.inValueSelect("MIDI Device", ["none"], "none");
const inGridSize = op.inValueSelect("Grid Size", ["8x8 Grid", "9x9 Full (with Buttons)"], "8x8 Grid");
const inColorMode = op.inValueSelect("Color Mode", ["RGB (SysEx)", "Palette (Velocity)"], "RGB (SysEx)");
const inBrightness = op.inValueSlider("Brightness", 1.0);
const inSendHandshake = op.inTriggerButton("Send Handshake");
const inClearGrid = op.inTriggerButton("Clear Grid");
const inScrollText = op.inString("Scroll Text", "");
const inTriggerScroll = op.inTriggerButton("Trigger Scroll");
const inCharacter = op.inString("Character", "");
const inCharTransition = op.inValueSelect("Char Transition", ["Glitch", "Scroll", "Collapse"], "Glitch");
const inCharTransitionDuration = op.inValueSlider("Transition Duration", 0.5);
const inCharColor = op.inValueSelect("Char Color", ["Yellow", "White", "Red", "Orange", "Green", "Cyan", "Blue", "Purple", "Pink"], "Yellow");
const inCharRotation = op.inValueSelect("Char Rotation", ["0", "90", "180", "270"], "0");

// Output ports
const outTrigger = op.outTrigger("trigger");
const outMidiMessages = op.outObject("MIDI Messages", null);
const outStatus = op.outString("Status", "Disconnected");
const outConnected = op.outBool("Connected", false);

// MIDI Access State
let midi = null;
let outputDevice = null;

// Single Character Display State
let currentChar = " ";
let prevChar = " ";
let transitionStartTime = 0;
let isTransitioning = false;
let needsCharRedraw = false;
let animFrameId = null;

const charColorMap = {
    "White": 1,
    "Red": 5,
    "Orange": 9,
    "Yellow": 13,
    "Green": 21,
    "Cyan": 37,
    "Blue": 45,
    "Purple": 53,
    "Pink": 57
};

// WebGL Downsampling State
let fb = null;
let quadMesh = null;
const pixelReader = new CGL.PixelReader();

// Shader Source
const bgFrag = `
    UNI sampler2D tex;
    IN vec2 texCoord;
    void main()
    {
       outColor = texture2D(tex, texCoord);
    }
`;
const bgShader = new CGL.Shader(cgl, "launchpad_downsample_shader");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);

// Color palette mapping helper (approximate standard Launchpad colors)
const paletteColors = [
    { index: 0, r: 0, g: 0, b: 0 },         // Off
    { index: 1, r: 255, g: 255, b: 255 },   // White
    { index: 5, r: 255, g: 0, b: 0 },       // Red
    { index: 9, r: 255, g: 128, b: 0 },     // Orange
    { index: 13, r: 255, g: 255, b: 0 },    // Yellow
    { index: 21, r: 0, g: 255, b: 0 },       // Green
    { index: 37, r: 0, g: 255, b: 255 },     // Cyan
    { index: 45, r: 0, g: 0, b: 255 },       // Blue
    { index: 53, r: 128, g: 0, b: 255 },     // Purple
    { index: 57, r: 255, g: 0, b: 255 }      // Pink
];

function getClosestPaletteIndex(r, g, b) {
    let minDist = Infinity;
    let bestIndex = 0;
    for (const col of paletteColors) {
        const dr = col.r - r;
        const dg = col.g - g;
        const db = col.b - b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
            minDist = dist;
            bestIndex = col.index;
        }
    }
    return bestIndex;
}

// Port Configuration Groups
op.setPortGroup("Connectivity", [inMode, inMidiDevice]);
op.setPortGroup("Controls", [inGridSize, inColorMode, inBrightness, inSendHandshake, inClearGrid]);
op.setPortGroup("Scrolling Text", [inScrollText, inTriggerScroll]);
op.setPortGroup("Single Character", [inCharacter, inCharTransition, inCharTransitionDuration, inCharColor, inCharRotation]);

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

const deviceMap = new Map();

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
        // Automatically enter programmer mode
        enterProgrammerMode();
        needsCharRedraw = true;
        startAnimationLoop();
    } else {
        outStatus.set("Device not found");
        outConnected.set(false);
    }
}

// Connection Mode Handlers
inMode.onChange = updateConnection;
inMidiDevice.onChange = updateConnection;

// WebGL mesh creation
function createMesh() {
    const geom = new CGL.Geometry("launchpad quad");
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

// Initialize Framebuffer based on selected Grid Size
function initFramebuffer() {
    const size = inGridSize.get() === "8x8 Grid" ? 8 : 9;
    if (!fb) {
        fb = new CGL.Framebuffer2(cgl, size, size, {
            "name": "launchpad_downsample",
            "depth": false,
            "multisampling": false
        });
    } else {
        fb.setSize(size, size);
    }
}

inGridSize.onChange = initFramebuffer;

// Trigger Handlers
inSendHandshake.onTriggered = enterProgrammerMode;
inClearGrid.onTriggered = clearGrid;
inTriggerScroll.onTriggered = triggerTextScroll;

// Render loop update
inUpdate.onTriggered = function () {
    if (!inActive.get()) return;

    const tex = inTexture.get();
    if (!tex || !tex.tex) {
        if (isTransitioning || needsCharRedraw) {
            const now = Date.now();
            const duration = inCharTransitionDuration.get() * 1000;
            let t = duration > 0 ? (now - transitionStartTime) / duration : 1.0;
            if (t >= 1.0) {
                t = 1.0;
                isTransitioning = false;
                needsCharRedraw = false;
            }
            renderCharacterGrid(t);
        }
        outTrigger.trigger();
        return;
    }

    if (!quadMesh) createMesh();
    if (!fb) initFramebuffer();

    // Render texture downsampled into Framebuffer
    fb.renderStart();
    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushShader(bgShader);
    cgl.setTexture(0, tex.tex);
    quadMesh.render(cgl.getShader());
    cgl.popShader();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();
    fb.renderEnd();

    // Read back downsampled pixels asynchronously
    const size = inGridSize.get() === "8x8 Grid" ? 8 : 9;
    pixelReader.read(cgl, fb.getGlFrameBuffer(), CGL.Texture.PFORMATSTR_RGBA8UB, 0, 0, size, size, (pixelData) => {
        if (!pixelData) return;
        processPixels(pixelData, size, size);
    });

    outTrigger.trigger();
};

function processPixels(pixelData, w, h) {
    const header = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x03];
    const specs = [];
    const brightness = inBrightness.get();
    const isRGB = inColorMode.get() === "RGB (SysEx)";

    // Determine if we have a single character active
    let displayGrid = null;
    const hasChar = (currentChar !== " " || prevChar !== " " || isTransitioning);
    if (hasChar) {
        const now = Date.now();
        const duration = inCharTransitionDuration.get() * 1000;
        let t = duration > 0 ? (now - transitionStartTime) / duration : 1.0;
        if (t >= 1.0) {
            t = 1.0;
            isTransitioning = false;
            needsCharRedraw = false;
        }
        displayGrid = getTransitionGridAt(t);
    }

    const colorName = inCharColor.get() || "Yellow";
    const colorIndex = charColorMap[colorName] || 13;
    const colObj = paletteColors.find(c => c.index === colorIndex) || { r: 255, g: 255, b: 0 };

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const rVal = pixelData[idx + 0];
            const gVal = pixelData[idx + 1];
            const bVal = pixelData[idx + 2];

            // Determine pad note/CC index
            let index = null;
            if (w === 8) {
                index = (y + 1) * 10 + (x + 1);
            } else {
                if (x < 8 && y < 8) {
                    index = (y + 1) * 10 + (x + 1); // Grid pad
                } else if (x === 8 && y < 8) {
                    index = (y + 1) * 10 + 9; // Right button
                } else if (x < 8 && y === 8) {
                    index = 90 + (x + 1); // Top button
                } else if (x === 8 && y === 8) {
                    index = 99; // Logo button
                }
            }

            if (index !== null) {
                let finalR = rVal;
                let finalG = gVal;
                let finalB = bVal;

                if (displayGrid) {
                    const isActive = (x < 8 && y < 8) ? displayGrid[7 - y][x] : false;
                    if (isActive) {
                        // Prioritize the character: blend base character color with texture (70% character, 30% texture)
                        finalR = Math.round(colObj.r * 0.7 + rVal * 0.3);
                        finalG = Math.round(colObj.g * 0.7 + gVal * 0.3);
                        finalB = Math.round(colObj.b * 0.7 + bVal * 0.3);
                    } else {
                        // Dim background texture pixels
                        finalR = Math.round(rVal * 0.3);
                        finalG = Math.round(gVal * 0.3);
                        finalB = Math.round(bVal * 0.3);
                    }
                }

                if (isRGB) {
                    const r = Math.min(127, Math.floor((finalR / 2) * brightness));
                    const g = Math.min(127, Math.floor((finalG / 2) * brightness));
                    const b = Math.min(127, Math.floor((finalB / 2) * brightness));
                    specs.push(0x03, index, r, g, b); // RGB type (0x03)
                } else {
                    const r = Math.min(255, Math.floor(finalR * brightness));
                    const g = Math.min(255, Math.floor(finalG * brightness));
                    const b = Math.min(255, Math.floor(finalB * brightness));
                    const finalColorIndex = getClosestPaletteIndex(r, g, b);
                    specs.push(0x00, index, finalColorIndex); // Palette type (0x00)
                }
            }
        }
    }

    const msg = [...header, ...specs, 0xF7];
    sendMidiMessage(msg);
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

function enterProgrammerMode() {
    const programmerModeMsg = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x0E, 0x01, 0xF7];
    sendMidiMessage(programmerModeMsg);
}

function clearGrid() {
    const header = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x03];
    const specs = [];
    const size = inGridSize.get() === "8x8 Grid" ? 8 : 9;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let index = null;
            if (size === 8) {
                index = (y + 1) * 10 + (x + 1);
            } else {
                if (x < 8 && y < 8) {
                    index = (y + 1) * 10 + (x + 1);
                } else if (x === 8 && y < 8) {
                    index = (y + 1) * 10 + 9;
                } else if (x < 8 && y === 8) {
                    index = 90 + (x + 1);
                } else if (x === 8 && y === 8) {
                    index = 99;
                }
            }
            if (index !== null) {
                specs.push(0x00, index, 0); // Set palette color 0 (off)
            }
        }
    }

    const msg = [...header, ...specs, 0xF7];
    sendMidiMessage(msg);
}

function triggerTextScroll() {
    const text = inScrollText.get();
    if (!text) return;
    const header = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D];
    const textBytes = Array.from(text).map(c => c.charCodeAt(0));
    const msg = [
        ...header,
        0x07, // Scroll command
        0x00, // Loop = false
        0x04, // Speed = 4
        0x00, // Palette color spec
        0x0D, // Yellow color index
        ...textBytes,
        0xF7
    ];
    sendMidiMessage(msg);
}

// 8x8 font dictionary U+0020 - U+007E
const font = {
  " ": [0, 0, 0, 0, 0, 0, 0, 0],
  "!": [24, 60, 60, 24, 24, 0, 24, 0],
  "\"": [54, 54, 0, 0, 0, 0, 0, 0],
  "#": [54, 54, 127, 54, 127, 54, 54, 0],
  "$": [12, 62, 3, 30, 48, 31, 12, 0],
  "%": [0, 99, 51, 24, 12, 102, 99, 0],
  "&": [28, 54, 28, 110, 59, 51, 110, 0],
  "'": [6, 6, 3, 0, 0, 0, 0, 0],
  "(": [24, 12, 6, 6, 6, 12, 24, 0],
  ")": [6, 12, 24, 24, 24, 12, 6, 0],
  "*": [0, 102, 60, 255, 60, 102, 0, 0],
  "+": [0, 12, 12, 63, 12, 12, 0, 0],
  ",": [0, 0, 0, 0, 0, 12, 12, 6],
  "-": [0, 0, 0, 63, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12, 0],
  "/": [96, 48, 24, 12, 6, 3, 1, 0],
  "0": [62, 99, 115, 123, 111, 103, 62, 0],
  "1": [12, 14, 12, 12, 12, 12, 63, 0],
  "2": [30, 51, 48, 28, 6, 51, 63, 0],
  "3": [30, 51, 48, 28, 48, 51, 30, 0],
  "4": [56, 60, 54, 51, 127, 48, 120, 0],
  "5": [63, 3, 31, 48, 48, 51, 30, 0],
  "6": [28, 6, 3, 31, 51, 51, 30, 0],
  "7": [63, 51, 48, 24, 12, 12, 12, 0],
  "8": [30, 51, 51, 30, 51, 51, 30, 0],
  "9": [30, 51, 51, 62, 48, 24, 14, 0],
  ":": [0, 12, 12, 0, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 0, 12, 12, 6],
  "<": [24, 12, 6, 3, 6, 12, 24, 0],
  "=": [0, 0, 63, 0, 0, 63, 0, 0],
  ">": [6, 12, 24, 48, 24, 12, 6, 0],
  "?": [30, 51, 48, 24, 12, 0, 12, 0],
  "@": [62, 99, 123, 123, 123, 3, 30, 0],
  "A": [12, 30, 51, 51, 63, 51, 51, 0],
  "B": [63, 102, 102, 62, 102, 102, 63, 0],
  "C": [60, 102, 3, 3, 3, 102, 60, 0],
  "D": [31, 54, 102, 102, 102, 54, 31, 0],
  "E": [127, 70, 22, 30, 22, 70, 127, 0],
  "F": [127, 70, 22, 30, 22, 6, 15, 0],
  "G": [60, 102, 3, 3, 115, 102, 124, 0],
  "H": [51, 51, 51, 63, 51, 51, 51, 0],
  "I": [30, 12, 12, 12, 12, 12, 30, 0],
  "J": [120, 48, 48, 48, 51, 51, 30, 0],
  "K": [103, 102, 54, 30, 54, 102, 103, 0],
  "L": [15, 6, 6, 6, 70, 102, 127, 0],
  "M": [99, 119, 127, 127, 107, 99, 99, 0],
  "N": [99, 103, 111, 123, 115, 99, 99, 0],
  "O": [28, 54, 99, 99, 99, 54, 28, 0],
  "P": [63, 102, 102, 62, 6, 6, 15, 0],
  "Q": [30, 51, 51, 51, 59, 30, 56, 0],
  "R": [63, 102, 102, 62, 54, 102, 103, 0],
  "S": [30, 51, 7, 14, 56, 51, 30, 0],
  "T": [63, 45, 12, 12, 12, 12, 30, 0],
  "U": [51, 51, 51, 51, 51, 51, 63, 0],
  "V": [51, 51, 51, 51, 51, 30, 12, 0],
  "W": [99, 99, 99, 107, 127, 119, 99, 0],
  "X": [99, 99, 54, 28, 28, 54, 99, 0],
  "Y": [51, 51, 51, 30, 12, 12, 30, 0],
  "Z": [127, 99, 49, 24, 76, 102, 127, 0],
  "[": [30, 6, 6, 6, 6, 6, 30, 0],
  "\\": [3, 6, 12, 24, 48, 96, 64, 0],
  "]": [30, 24, 24, 24, 24, 24, 30, 0],
  "^": [8, 28, 54, 99, 0, 0, 0, 0],
  "_": [0, 0, 0, 0, 0, 0, 0, 255],
  "`": [12, 12, 24, 0, 0, 0, 0, 0],
  "a": [0, 0, 30, 48, 62, 51, 110, 0],
  "b": [7, 6, 6, 62, 102, 102, 59, 0],
  "c": [0, 0, 30, 51, 3, 51, 30, 0],
  "d": [56, 48, 48, 62, 51, 51, 110, 0],
  "e": [0, 0, 30, 51, 63, 3, 30, 0],
  "f": [28, 54, 6, 15, 6, 6, 15, 0],
  "g": [0, 0, 110, 51, 51, 62, 48, 31],
  "h": [7, 6, 54, 110, 102, 102, 103, 0],
  "i": [12, 0, 14, 12, 12, 12, 30, 0],
  "j": [48, 0, 48, 48, 48, 51, 51, 30],
  "k": [7, 6, 102, 54, 30, 54, 103, 0],
  "l": [14, 12, 12, 12, 12, 12, 30, 0],
  "m": [0, 0, 51, 127, 127, 107, 99, 0],
  "n": [0, 0, 31, 51, 51, 51, 51, 0],
  "o": [0, 0, 30, 51, 51, 51, 30, 0],
  "p": [0, 0, 59, 102, 102, 62, 6, 15],
  "q": [0, 0, 110, 51, 51, 62, 48, 120],
  "r": [0, 0, 59, 110, 102, 6, 15, 0],
  "s": [0, 0, 62, 3, 30, 48, 31, 0],
  "t": [8, 12, 62, 12, 12, 44, 24, 0],
  "u": [0, 0, 51, 51, 51, 51, 110, 0],
  "v": [0, 0, 51, 51, 51, 30, 12, 0],
  "w": [0, 0, 99, 107, 127, 127, 54, 0],
  "x": [0, 0, 99, 54, 28, 54, 99, 0],
  "y": [0, 0, 51, 51, 51, 62, 48, 31],
  "z": [0, 0, 63, 25, 12, 38, 63, 0],
  "{": [56, 12, 12, 7, 12, 12, 56, 0],
  "|": [24, 24, 24, 0, 24, 24, 24, 0],
  "}": [7, 12, 12, 56, 12, 12, 7, 0],
  "~": [110, 59, 0, 0, 0, 0, 0, 0]
};

const requestAnim = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (cb) => setTimeout(cb, 16);

function startAnimationLoop() {
    if (animFrameId) return;
    
    function animStep() {
        if (!inActive.get()) {
            animFrameId = null;
            return;
        }
        const tex = inTexture.get();
        if (tex && tex.tex) {
            animFrameId = null;
            return;
        }

        if (isTransitioning || needsCharRedraw) {
            const now = Date.now();
            const duration = inCharTransitionDuration.get() * 1000;
            let t = duration > 0 ? (now - transitionStartTime) / duration : 1.0;
            if (t >= 1.0) {
                t = 1.0;
                isTransitioning = false;
                needsCharRedraw = false;
            }
            renderCharacterGrid(t);
            outTrigger.trigger();
            
            if (isTransitioning || needsCharRedraw) {
                animFrameId = requestAnim(animStep);
                return;
            }
        }
        
        animFrameId = null;
    }
    
    animFrameId = requestAnim(animStep);
}

// charColorMap defined at the top

inActive.onChange = function() {
    if (inActive.get()) {
        needsCharRedraw = true;
        startAnimationLoop();
    }
};

inCharacter.onChange = function() {
    const val = inCharacter.get();
    const nextChar = (val === undefined || val === null || val === "") ? " " : String(val);
    if (nextChar !== currentChar) {
        prevChar = currentChar;
        currentChar = nextChar;
        transitionStartTime = Date.now();
        isTransitioning = true;
        needsCharRedraw = true;
        startAnimationLoop();
    }
};

inCharColor.onChange = () => {
    needsCharRedraw = true;
    startAnimationLoop();
};
inBrightness.onChange = () => {
    needsCharRedraw = true;
    startAnimationLoop();
};
inColorMode.onChange = () => {
    needsCharRedraw = true;
    startAnimationLoop();
};
inCharTransition.onChange = () => {
    needsCharRedraw = true;
    startAnimationLoop();
};
inCharRotation.onChange = () => {
    needsCharRedraw = true;
    startAnimationLoop();
};

// Add redraw flag for grid size changes
const origInitFramebuffer = initFramebuffer;
initFramebuffer = function() {
    origInitFramebuffer();
    needsCharRedraw = true;
    startAnimationLoop();
};
inGridSize.onChange = initFramebuffer;

function rotateGrid(grid, angle) {
    if (angle === "0" || !angle) return grid;
    
    const rotated = [];
    for (let y = 0; y < 8; y++) {
        rotated[y] = new Array(8).fill(false);
    }
    
    if (angle === "90") {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                rotated[x][7 - y] = grid[y][x];
            }
        }
    } else if (angle === "180") {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                rotated[7 - y][7 - x] = grid[y][x];
            }
        }
    } else if (angle === "270") {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                rotated[7 - x][y] = grid[y][x];
            }
        }
    }
    return rotated;
}

function centerGridHorizontally(grid) {
    let minCol = 8;
    let maxCol = -1;
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (grid[y][x]) {
                if (x < minCol) minCol = x;
                if (x > maxCol) maxCol = x;
            }
        }
    }
    if (maxCol === -1) return grid;

    const currentCenter = (minCol + maxCol) / 2;
    const offset = Math.round(3.5 - currentCenter);
    if (offset === 0) return grid;

    const centeredGrid = [];
    for (let y = 0; y < 8; y++) {
        centeredGrid[y] = new Array(8).fill(false);
        for (let x = 0; x < 8; x++) {
            const srcX = x - offset;
            if (srcX >= 0 && srcX < 8) {
                centeredGrid[y][x] = grid[y][srcX];
            }
        }
    }
    return centeredGrid;
}

function getCharGrid(charStr) {
    const grid = [];
    for (let y = 0; y < 8; y++) {
        grid[y] = new Array(8).fill(false);
    }
    const s = (charStr === undefined || charStr === null || charStr === "") ? " " : String(charStr);
    const c = s[0] || " ";
    const bytes = font[c] || font[c.toUpperCase()] || font[c.toLowerCase()] || font[' '] || [0,0,0,0,0,0,0,0];
    for (let y = 0; y < 8; y++) {
        const byteVal = bytes[y];
        for (let x = 0; x < 8; x++) {
            grid[y][x] = ((byteVal >> x) & 1) === 1;
        }
    }
    const rotatedGrid = rotateGrid(grid, inCharRotation.get());
    return centerGridHorizontally(rotatedGrid);
}

function getTransitionGridAt(t) {
    const sourceGrid = getCharGrid(prevChar);
    const targetGrid = getCharGrid(currentChar);
    const displayGrid = [];
    for (let y = 0; y < 8; y++) {
        displayGrid[y] = new Array(8).fill(false);
    }

    const type = inCharTransition.get();

    if (t >= 1.0) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                displayGrid[y][x] = targetGrid[y][x];
            }
        }
    } else if (type === "Glitch") {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const r = Math.random();
                if (r < t * t) {
                    displayGrid[y][x] = targetGrid[y][x];
                } else if (r > 1.0 - (1.0 - t) * (1.0 - t)) {
                    displayGrid[y][x] = sourceGrid[y][x];
                } else {
                    displayGrid[y][x] = Math.random() > 0.5;
                }
            }
        }
    } else if (type === "Scroll") {
        const xOffset = Math.round(8 * t);
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const srcX = x + xOffset;
                if (srcX < 8) {
                    displayGrid[y][x] = sourceGrid[y][srcX];
                } else {
                    displayGrid[y][x] = targetGrid[y][srcX - 8];
                }
            }
        }
    } else if (type === "Collapse") {
        if (t < 0.5) {
            const s = 1.0 - 2 * t;
            for (let y = 0; y < 8; y++) {
                if (s === 0) continue;
                const charY = Math.round(3.5 + (y - 3.5) / s);
                if (charY >= 0 && charY < 8) {
                    for (let x = 0; x < 8; x++) {
                        displayGrid[y][x] = sourceGrid[charY][x];
                    }
                }
            }
        } else {
            const s = 2 * t - 1.0;
            for (let y = 0; y < 8; y++) {
                if (s === 0) continue;
                const charY = Math.round(3.5 + (y - 3.5) / s);
                if (charY >= 0 && charY < 8) {
                    for (let x = 0; x < 8; x++) {
                        displayGrid[y][x] = targetGrid[charY][x];
                    }
                }
            }
        }
    }
    return displayGrid;
}

function renderCharacterGrid(t) {
    const displayGrid = getTransitionGridAt(t);
    sendCharacterGridToDevice(displayGrid);
}

function sendCharacterGridToDevice(displayGrid) {
    const header = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x03];
    const specs = [];
    const brightness = inBrightness.get();
    const isRGB = inColorMode.get() === "RGB (SysEx)";
    const size = inGridSize.get() === "8x8 Grid" ? 8 : 9;

    const colorName = inCharColor.get() || "Yellow";
    const colorIndex = charColorMap[colorName] || 13;
    const colObj = paletteColors.find(c => c.index === colorIndex) || { r: 255, g: 255, b: 0 };

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let index = null;
            if (size === 8) {
                index = (y + 1) * 10 + (x + 1);
            } else {
                if (x < 8 && y < 8) {
                    index = (y + 1) * 10 + (x + 1);
                } else if (x === 8 && y < 8) {
                    index = (y + 1) * 10 + 9;
                } else if (x < 8 && y === 8) {
                    index = 90 + (x + 1);
                } else if (x === 8 && y === 8) {
                    index = 99;
                }
            }

            if (index !== null) {
                const isActive = (x < 8 && y < 8) ? displayGrid[7 - y][x] : false;
                if (isActive) {
                    if (isRGB) {
                        const r = Math.min(127, Math.floor((colObj.r / 2) * brightness));
                        const g = Math.min(127, Math.floor((colObj.g / 2) * brightness));
                        const b = Math.min(127, Math.floor((colObj.b / 2) * brightness));
                        specs.push(0x03, index, r, g, b);
                    } else {
                        const r = Math.min(255, Math.floor(colObj.r * brightness));
                        const g = Math.min(255, Math.floor(colObj.g * brightness));
                        const b = Math.min(255, Math.floor(colObj.b * brightness));
                        const finalColorIndex = getClosestPaletteIndex(r, g, b);
                        specs.push(0x00, index, finalColorIndex);
                    }
                } else {
                    if (isRGB) {
                        specs.push(0x03, index, 0, 0, 0);
                    } else {
                        specs.push(0x00, index, 0);
                    }
                }
            }
        }
    }

    const msg = [...header, ...specs, 0xF7];
    sendMidiMessage(msg);
}

// Request WebMIDI immediately
requestMidi();
