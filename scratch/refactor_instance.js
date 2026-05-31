const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../space_type_generator');
const destDir = path.join(__dirname, '../space_type_generator_instance');

// List of all P5.js functions to prefix with 'p.'
const p5Functions = [
    "createCanvas", "smooth", "textFont", "color", "millis", "clear", "background", "noFill", 
    "strokeWeight", "stroke", "strokeCap", "strokeJoin", "push", "translate", "pop", "map", 
    "sq", "cos", "sin", "pow", "abs", "resizeCanvas", "radians", "rotate", "scale", 
    "shearX", "shearY", "beginShape", "vertex", "endShape", "bezierVertex", "ellipse", 
    "line", "rect", "textSize", "textAlign", "random", "round", "floor", "atan2", "lerpColor", 
    "red", "green", "blue", "alpha", "frameRate", "textureMode", "ortho", "fill", "normal", 
    "texture", "beginRaw", "endRaw", "noStroke", "applyMatrix", "resetMatrix", "camera", 
    "perspective", "loadShader", "shader", "resetShader", "point", "box", "sphere", "cylinder", 
    "cone", "ellipsoid", "torus", "plane", "ambientLight", "directionalLight", "pointLight", 
    "spotLight", "lightFalloff", "lights", "ambientMaterial", "specularMaterial", 
    "emissiveMaterial", "shininess", "loadFont", "textWidth", "text", "save", "saveFrames", 
    "saveCanvas", "image", "createImage", "createGraphics", "pixelDensity", "loadBytes", "arc",
    "noise", "noiseDetail", "noiseSeed", "randomSeed", "dist", "constrain", "log", "exp", "min", "max",
    "quad", "triangle", "bezier", "bezierDetail", "bezierPoint", "bezierTangent", "curve",
    "curveDetail", "curveTightness", "curvePoint", "curveTangent", "cursor",
    "noCursor", "colorMode", "blendMode", "get", "set", "loadPixels", "updatePixels",
    "rotateX", "rotateY", "rotateZ", "strokeCap", "strokeJoin"
];

// List of all P5.js constants & system variables to prefix with 'p.'
const p5Constants = [
    "PI", "HALF_PI", "QUARTER_PI", "TWO_PI", "TAU", "DEGREES", "RADIANS", 
    "windowWidth", "windowHeight", "frameCount", "CLOSE", "WEBGL", "P2D", 
    "ROUND", "SQUARE", "PROJECT", "MITER", "BEVEL", "LEFT", "CENTER", 
    "RIGHT", "TOP", "BOTTOM", "BASELINE",
    "mouseX", "mouseY", "pmouseX", "pmouseY",
    "key", "keyCode", "keyIsPressed", "mouseIsPressed",
    "focused"
];

// Regex builder
const symbols = [...p5Functions, ...p5Constants];
// Negative lookbehind for dot, word character, or dollar sign.
// Negative lookahead for colon to prevent replacing object literal keys (e.g. "width: 100")
const p5Regex = new RegExp(`(?<![a-zA-Z0-9_$.])\\b(${symbols.join('|')})\\b(?![a-zA-Z0-9_$])(?!\\s*:)`, 'g');

// Special rule for width and height (must not be followed by colon, and not be preceded by dot/char)
const widthHeightRegex = /(?<![a-zA-Z0-9_$.])\b(width|height)\b(?![a-zA-Z0-9_$])(?!\s*:)/g;

function prefixCode(code) {
    let result = code.replace(p5Regex, 'p.$1');
    result = result.replace(widthHeightRegex, 'p.$1');
    return result;
}

// Helper to recursively copy directories
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function refactorSketch(sketchName) {
    const sketchSrcDir = path.join(srcDir, sketchName);
    const sketchDestDir = path.join(destDir, sketchName);

    console.log(`Refactoring sketch: ${sketchName}`);

    const indexHtmlPath = path.join(sketchSrcDir, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
        console.log(`No index.html found for ${sketchName}, skipping compilation.`);
        return;
    }

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Parse all loaded scripts in order
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/g;
    const dependencies = [];
    let match;
    while ((match = scriptRegex.exec(indexHtml)) !== null) {
        const srcAttr = match[1];
        // Skip p5 library and sketch.js itself, as well as dynamic channel tags
        if (srcAttr.includes('p5.min') || srcAttr.includes('sketch.js') || srcAttr.startsWith('http') || srcAttr.includes('channel=')) {
            continue;
        }
        dependencies.push(srcAttr);
    }

    console.log(`Dependencies found for ${sketchName}:`, dependencies);

    // Read and combine dependency scripts (prefixed)
    let inlinedCode = '';
    for (let dep of dependencies) {
        const depPath = path.resolve(sketchSrcDir, dep);
        if (fs.existsSync(depPath)) {
            console.log(`  Inlining: ${dep}`);
            let content = fs.readFileSync(depPath, 'utf8');
            inlinedCode += `\n// --- INLINED DEPENDENCY: ${dep} ---\n`;
            inlinedCode += prefixCode(content) + '\n';
        } else {
            console.warn(`  Warning: Dependency file not found at ${depPath}`);
        }
    }

    // Read the main sketch.js
    const sketchJsPath = path.join(sketchSrcDir, 'sketch.js');
    if (!fs.existsSync(sketchJsPath)) {
        console.error(`Error: sketch.js not found in ${sketchSrcDir}`);
        return;
    }
    const originalSketchJs = fs.readFileSync(sketchJsPath, 'utf8');
    const prefixedSketchJs = prefixCode(originalSketchJs);

    // Build the clean self-contained ES module content
    const esmCode = `// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    ${inlinedCode}

    // --- ORIGINAL SKETCH.JS CODE ---
    ${prefixedSketchJs}

    // --- BIND LIFECYCLE HOOKS TO INSTANCE ---
    if (typeof preload === 'function') p.preload = preload;
    if (typeof setup === 'function') p.setup = setup;
    if (typeof draw === 'function') p.draw = draw;
    if (typeof windowResized === 'function') p.windowResized = windowResized;
    if (typeof keyPressed === 'function') p.keyPressed = keyPressed;
    if (typeof keyReleased === 'function') p.keyReleased = keyReleased;
    if (typeof keyTyped === 'function') p.keyTyped = keyTyped;
    if (typeof mousePressed === 'function') p.mousePressed = mousePressed;
    if (typeof mouseReleased === 'function') p.mouseReleased = mouseReleased;
    if (typeof mouseDragged === 'function') p.mouseDragged = mouseDragged;

    // --- CABLES GL DATA BRIDGE ---
    p.onDataChange = (data) => {
        if (data && typeof updateSettings === 'function') {
            updateSettings(data);
        }
    };
    
    // Fallback resize hook
    p.onResize = (w, h) => {
        if (p.resizeCanvas) p.resizeCanvas(w, h);
    };
}
`;

    // Ensure dest dir exists
    if (!fs.existsSync(sketchDestDir)) {
        fs.mkdirSync(sketchDestDir, { recursive: true });
    }

    // Write back to sketch.js in destination
    fs.writeFileSync(path.join(sketchDestDir, 'sketch.js'), esmCode, 'utf8');

    // Clean up auxiliary folders/files that are no longer needed
    const unnecessaryPaths = [
        path.join(sketchDestDir, 'index.html'),
        path.join(sketchDestDir, 'style.css'),
        path.join(sketchDestDir, 'preset.js'),
        path.join(sketchDestDir, 'js')
    ];
    for (let unp of unnecessaryPaths) {
        if (fs.existsSync(unp)) {
            const stat = fs.statSync(unp);
            if (stat.isDirectory()) {
                fs.rmSync(unp, { recursive: true, force: true });
            } else {
                fs.unlinkSync(unp);
            }
        }
    }
}

// 1. First, copy the entire directory to create a full duplicate
console.log('Copying space_type_generator to space_type_generator_instance...');
copyDirRecursive(srcDir, destDir);

// 2. Iterate and compile all 16 sketch subdirectories
const sketchDirs = fs.readdirSync(destDir).filter(f => {
    return fs.statSync(path.join(destDir, f)).isDirectory() && f !== 'assets' && f !== 'lib';
});

console.log('Processing sketches:', sketchDirs);
for (let sketch of sketchDirs) {
    refactorSketch(sketch);
}

console.log('Refactoring complete! All sketches converted successfully inside space_type_generator_instance.');
