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

// Output ports
const outTrigger = op.outTrigger("trigger");
const outMidiMessages = op.outObject("MIDI Messages", null);
const outStatus = op.outString("Status", "Disconnected");
const outConnected = op.outBool("Connected", false);

// MIDI Access State
let midi = null;
let outputDevice = null;

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
    if (!tex || !tex.tex) return;

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
                if (isRGB) {
                    const r = Math.min(127, Math.floor((rVal / 2) * brightness));
                    const g = Math.min(127, Math.floor((gVal / 2) * brightness));
                    const b = Math.min(127, Math.floor((bVal / 2) * brightness));
                    specs.push(0x03, index, r, g, b); // RGB type (0x03)
                } else {
                    const r = Math.min(255, Math.floor(rVal * brightness));
                    const g = Math.min(255, Math.floor(gVal * brightness));
                    const b = Math.min(255, Math.floor(bVal * brightness));
                    const colorIndex = getClosestPaletteIndex(r, g, b);
                    specs.push(0x00, index, colorIndex); // Palette type (0x00)
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

// Request WebMIDI immediately
requestMidi();
