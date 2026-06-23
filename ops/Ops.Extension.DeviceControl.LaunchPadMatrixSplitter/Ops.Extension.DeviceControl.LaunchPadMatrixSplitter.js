const cgl = op.patch.cgl;

// Inputs
const inRender = op.inTrigger("render");
const inTexture = op.inTexture("Texture");
const inResolution = op.inValueSelect("Output Resolution", ["Default (256x256)", "Launchpad (8x8)", "Launchpad Full (9x9)", "Half of Input", "128x128", "64x64"], "Default (256x256)");

// Inputs Config - Top-Left
const inSourceTL = op.inValueSelect("Source TL", ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"], "Top-Left");
const inRotationTL = op.inValueSelect("Rotation TL", ["None", "90° CW", "180°", "270° CW"], "None");
const inFlipXTL = op.inBool("Flip X TL", false);
const inFlipYTL = op.inBool("Flip Y TL", false);

// Inputs Config - Top-Right
const inSourceTR = op.inValueSelect("Source TR", ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"], "Top-Right");
const inRotationTR = op.inValueSelect("Rotation TR", ["None", "90° CW", "180°", "270° CW"], "None");
const inFlipXTR = op.inBool("Flip X TR", false);
const inFlipYTR = op.inBool("Flip Y TR", false);

// Inputs Config - Bottom-Left
const inSourceBL = op.inValueSelect("Source BL", ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"], "Bottom-Left");
const inRotationBL = op.inValueSelect("Rotation BL", ["None", "90° CW", "180°", "270° CW"], "None");
const inFlipXBL = op.inBool("Flip X BL", false);
const inFlipYBL = op.inBool("Flip Y BL", false);

// Inputs Config - Bottom-Right
const inSourceBR = op.inValueSelect("Source BR", ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"], "Bottom-Right");
const inRotationBR = op.inValueSelect("Rotation BR", ["None", "90° CW", "180°", "270° CW"], "None");
const inFlipXBR = op.inBool("Flip X BR", false);
const inFlipYBR = op.inBool("Flip Y BR", false);

// Outputs
const outTrigger = op.outTrigger("trigger");
const outTextureTL = op.outTexture("Texture TL");
const outTextureTR = op.outTexture("Texture TR");
const outTextureBL = op.outTexture("Texture BL");
const outTextureBR = op.outTexture("Texture BR");

// Framebuffers and Mesh state
let fbTL = null, fbTR = null, fbBL = null, fbBR = null;
let quadMesh = null;
let resWidth = 256;
let resHeight = 256;
let needInit = true;

// Shader
const bgFrag = `
    UNI sampler2D tex;
    UNI mat4 uvMatrix;
    IN vec2 texCoord;
    void main()
    {
       vec4 uvTransformed = uvMatrix * vec4(texCoord, 0.0, 1.0);
       outColor = texture2D(tex, uvTransformed.xy);
    }
`;
const bgShader = new CGL.Shader(cgl, "launchpad_matrix_splitter_shader");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);
const uvMatrixUniform = new CGL.Uniform(bgShader, "m4", "uvMatrix", mat4.create());

// Port Groups
op.setPortGroup("Configuration TL", [inSourceTL, inRotationTL, inFlipXTL, inFlipYTL]);
op.setPortGroup("Configuration TR", [inSourceTR, inRotationTR, inFlipXTR, inFlipYTR]);
op.setPortGroup("Configuration BL", [inSourceBL, inRotationBL, inFlipXBL, inFlipYBL]);
op.setPortGroup("Configuration BR", [inSourceBR, inRotationBR, inFlipXBR, inFlipYBR]);

// Set size / Resolution updates
inResolution.onChange = function () {
    needInit = true;
};

function createMesh() {
    const geom = new CGL.Geometry("launchpad splitter quad");
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

function initFramebuffers(inputTex) {
    const resMode = inResolution.get();
    let w = 256;
    let h = 256;

    if (resMode === "Launchpad (8x8)") {
        w = 8;
        h = 8;
    } else if (resMode === "Launchpad Full (9x9)") {
        w = 9;
        h = 9;
    } else if (resMode === "Half of Input" && inputTex) {
        w = Math.max(1, Math.floor(inputTex.width / 2));
        h = Math.max(1, Math.floor(inputTex.height / 2));
    } else if (resMode === "128x128") {
        w = 128;
        h = 128;
    } else if (resMode === "64x64") {
        w = 64;
        h = 64;
    }

    resWidth = w;
    resHeight = h;

    const options = {
        "depth": false,
        "multisampling": false
    };

    if (!fbTL) fbTL = new CGL.Framebuffer2(cgl, w, h, { ...options, "name": "splitter_tl" }); else fbTL.setSize(w, h);
    if (!fbTR) fbTR = new CGL.Framebuffer2(cgl, w, h, { ...options, "name": "splitter_tr" }); else fbTR.setSize(w, h);
    if (!fbBL) fbBL = new CGL.Framebuffer2(cgl, w, h, { ...options, "name": "splitter_bl" }); else fbBL.setSize(w, h);
    if (!fbBR) fbBR = new CGL.Framebuffer2(cgl, w, h, { ...options, "name": "splitter_br" }); else fbBR.setSize(w, h);

    needInit = false;
}

// Compute the 4x4 transformation matrix for UV coordinates
function getUVMatrix(quadrant, rotation, flipX, flipY) {
    // 1. Base translation & scaling to target quadrant
    let xMin = 0.0, yMin = 0.0;
    if (quadrant === "Top-Left") { xMin = 0.0; yMin = 0.5; }
    else if (quadrant === "Top-Right") { xMin = 0.5; yMin = 0.5; }
    else if (quadrant === "Bottom-Left") { xMin = 0.0; yMin = 0.0; }
    else if (quadrant === "Bottom-Right") { xMin = 0.5; yMin = 0.0; }

    const finalMatrix = mat4.create();
    mat4.translate(finalMatrix, finalMatrix, [xMin, yMin, 0.0]);
    mat4.scale(finalMatrix, finalMatrix, [0.5, 0.5, 1.0]);

    // 2. Normalized transformations (centered flip and rotation)
    const m = mat4.create();
    mat4.translate(m, m, [0.5, 0.5, 0.0]);

    const sx = flipX ? -1.0 : 1.0;
    const sy = flipY ? -1.0 : 1.0;
    mat4.scale(m, m, [sx, sy, 1.0]);

    let angle = 0;
    if (rotation === "90° CW") angle = -Math.PI / 2;
    else if (rotation === "180°") angle = Math.PI;
    else if (rotation === "270° CW") angle = Math.PI / 2;
    mat4.rotateZ(m, m, angle);

    mat4.translate(m, m, [-0.5, -0.5, 0.0]);

    // Combine
    mat4.multiply(finalMatrix, finalMatrix, m);
    return finalMatrix;
}

function drawQuadrant(fb, quadrant, rotation, flipX, flipY, tex) {
    fb.renderStart();

    // Reset projection, view, and model matrices to identity
    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushShader(bgShader);

    // Compute and bind the custom UV matrix
    const matrix = getUVMatrix(quadrant, rotation, flipX, flipY);
    uvMatrixUniform.setValue(matrix);

    cgl.setTexture(0, tex.tex);
    quadMesh.render(cgl.getShader());

    cgl.popShader();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    fb.renderEnd();
}

inRender.onTriggered = function () {
    const tex = inTexture.get();
    if (!tex || !tex.tex) {
        outTextureTL.set(null);
        outTextureTR.set(null);
        outTextureBL.set(null);
        outTextureBR.set(null);
        return;
    }

    if (!quadMesh) createMesh();
    if (!fbTL || needInit) initFramebuffers(tex);
    if (inResolution.get() === "Half of Input" && fbTL && (fbTL.getWidth() !== Math.max(1, Math.floor(tex.width / 2)))) {
        initFramebuffers(tex);
    }

    // Render 4 Quadrants
    drawQuadrant(fbTL, inSourceTL.get(), inRotationTL.get(), inFlipXTL.get(), inFlipYTL.get(), tex);
    drawQuadrant(fbTR, inSourceTR.get(), inRotationTR.get(), inFlipXTR.get(), inFlipYTR.get(), tex);
    drawQuadrant(fbBL, inSourceBL.get(), inRotationBL.get(), inFlipXBL.get(), inFlipYBL.get(), tex);
    drawQuadrant(fbBR, inSourceBR.get(), inRotationBR.get(), inFlipXBR.get(), inFlipYBR.get(), tex);

    // Set outputs
    outTextureTL.set(fbTL.getTextureColor());
    outTextureTR.set(fbTR.getTextureColor());
    outTextureBL.set(fbBL.getTextureColor());
    outTextureBR.set(fbBR.getTextureColor());

    outTrigger.trigger();
};
