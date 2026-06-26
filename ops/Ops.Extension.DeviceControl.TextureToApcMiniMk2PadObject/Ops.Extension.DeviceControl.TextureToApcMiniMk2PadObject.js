const cgl = op.patch.cgl;

// Input ports
const inUpdate = op.inTrigger("update");
const inTexture = op.inTexture("Texture");
const inBrightness = op.inValueSlider("Brightness", 1.0);
const inHighContrast = op.inBool("High Contrast", false);

// Output ports
const outTrigger = op.outTrigger("trigger");
const outPadsObject = op.outObject("Pads Object", null);

// Framebuffer and Pixel Reader state
let fbPads = null;
let quadMesh = null;
const pixelReaderPads = new CGL.PixelReader();

const bgFrag = `
    UNI sampler2D tex;
    IN vec2 texCoord;
    void main()
    {
       outColor = texture2D(tex, texCoord);
    }
`;
const bgShader = new CGL.Shader(cgl, "apc_mini_downsample_shader");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);

// Create fullscreen quad mesh for downsampling
function createMesh() {
    const geom = new CGL.Geometry("apc quad");
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

// Initialize 8x8 framebuffer (no multisampling or depth)
function initFramebuffer() {
    if (!fbPads) {
        fbPads = new CGL.Framebuffer2(cgl, 8, 8, {
            "name": "apc_pads_downsample",
            "depth": false,
            "multisampling": false
        });
    }
}

const palette = [
    { index: 0, r: 0, g: 0, b: 0 },         // Off / Black
    { index: 3, r: 0, g: 128, b: 255 },     // Light Blue
    { index: 5, r: 255, g: 0, b: 0 },       // Red
    { index: 8, r: 255, g: 255, b: 255 },   // White
    { index: 9, r: 255, g: 128, b: 0 },     // Orange
    { index: 13, r: 128, g: 255, b: 0 },    // Light Green / Lime
    { index: 17, r: 0, g: 255, b: 0 },      // Green
    { index: 21, r: 0, g: 128, b: 0 },      // Darker Green
    { index: 33, r: 0, g: 255, b: 255 },    // Teal / Cyan
    { index: 37, r: 0, g: 128, b: 255 },    // Light Blue (Alt)
    { index: 41, r: 0, g: 0, b: 255 },      // Blue
    { index: 45, r: 0, g: 0, b: 128 },      // Deep Blue
    { index: 49, r: 128, g: 0, b: 255 },    // Purple
    { index: 53, r: 64, g: 0, b: 128 },     // Rich Purple
    { index: 57, r: 255, g: 0, b: 255 },    // Pink
    { index: 60, r: 255, g: 64, b: 0 },     // Dark Orange / Peach
    { index: 61, r: 255, g: 255, b: 0 }     // Yellow
];

function getClosestPaletteIndex(r, g, b) {
    let minDist = Infinity;
    let bestIndex = 0;
    for (let i = 0; i < palette.length; i++) {
        const col = palette[i];
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

const padsObject = {};

inUpdate.onTriggered = function () {
    const padsTex = inTexture.get();
    if (!padsTex || !padsTex.tex) {
        outPadsObject.set(null);
        outTrigger.trigger();
        return;
    }

    if (!quadMesh) createMesh();
    initFramebuffer();

    fbPads.renderStart();
    
    // Disable depth and scissor tests to prevent clipping inside the 8x8 framebuffer
    const wasDepthTest = cgl.gl.isEnabled(cgl.gl.DEPTH_TEST);
    const wasScissorTest = cgl.gl.isEnabled(cgl.gl.SCISSOR_TEST);
    if (wasDepthTest) cgl.gl.disable(cgl.gl.DEPTH_TEST);
    if (wasScissorTest) cgl.gl.disable(cgl.gl.SCISSOR_TEST);

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
    
    if (wasDepthTest) cgl.gl.enable(cgl.gl.DEPTH_TEST);
    if (wasScissorTest) cgl.gl.enable(cgl.gl.SCISSOR_TEST);

    fbPads.renderEnd();

    // Read back 8x8 downsampled pixels asynchronously
    pixelReaderPads.read(cgl, fbPads.getGlFrameBuffer(), CGL.Texture.PFORMATSTR_RGBA8UB, 0, 0, 8, 8, (pixelData) => {
        if (!pixelData) return;
        
        const brightness = inBrightness.get();
        let tempRGB = [];
        for (let note = 0; note < 64; note++) {
            const y = Math.floor(note / 8);
            const x = note % 8;
            const idx = (y * 8 + x) * 4;
            const rPixel = pixelData[idx + 0];
            const gPixel = pixelData[idx + 1];
            const bPixel = pixelData[idx + 2];

            tempRGB.push([
                Math.min(255, Math.floor(rPixel * brightness)),
                Math.min(255, Math.floor(gPixel * brightness)),
                Math.min(255, Math.floor(bPixel * brightness))
            ]);
        }

        if (inHighContrast.get()) {
            const snappedRGB = [];
            for (let note = 0; note < 64; note++) {
                const y = Math.floor(note / 8);
                const x = note % 8;
                const current = tempRGB[note];

                const neighbors = [];
                if (x > 0) neighbors.push(tempRGB[y * 8 + (x - 1)]); // Left
                if (x < 7) neighbors.push(tempRGB[y * 8 + (x + 1)]); // Right
                if (y > 0) neighbors.push(tempRGB[(y - 1) * 8 + x]); // Up
                if (y < 7) neighbors.push(tempRGB[(y + 1) * 8 + x]); // Down

                if (neighbors.length > 0) {
                    let minDist = Infinity;
                    let closestColor = current;

                    for (let n = 0; n < neighbors.length; n++) {
                        const neighbor = neighbors[n];
                        const dr = current[0] - neighbor[0];
                        const dg = current[1] - neighbor[1];
                        const db = current[2] - neighbor[2];
                        const dist = dr * dr + dg * dg + db * db;
                        if (dist < minDist) {
                            minDist = dist;
                            closestColor = neighbor;
                        }
                    }
                    snappedRGB.push(closestColor);
                } else {
                    snappedRGB.push(current);
                }
            }
            tempRGB = snappedRGB;
        }

        let changed = false;
        for (let note = 0; note < 64; note++) {
            const rgb = tempRGB[note];
            const colorIndex = getClosestPaletteIndex(rgb[0], rgb[1], rgb[2]);

            const prevVal = padsObject[note];
            if (prevVal === undefined || prevVal !== colorIndex) {
                padsObject[note] = colorIndex;
                changed = true;
            }
        }

        // Emit new object reference when colors change so downstream ports re-evaluate
        if (changed) {
            const outputObj = {};
            for (let note = 0; note < 64; note++) {
                outputObj[note] = { "color": padsObject[note], "behavior": "solid" };
            }
            outPadsObject.set(outputObj);
        }
        
        outTrigger.trigger();
    });
};

op.onDelete = function () {
    if (fbPads) fbPads.delete();
};
