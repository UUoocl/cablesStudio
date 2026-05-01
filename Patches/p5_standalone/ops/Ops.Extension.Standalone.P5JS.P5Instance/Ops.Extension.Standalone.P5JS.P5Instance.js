/**
 * P5JS Instance Op
 */

const fs = op.require("fs");
const path = op.require("path");

const inP5Path = op.inString("P5 Library Path", "libs/p5.min.js");
const inSketchFile = op.inString("Sketch File", "p5_example_sketch.js");
const inData = op.inObject("Input Data");
const inFlipY = op.inBool("Flip Y", true);
const inTrigger = op.inTrigger("Render");
const inReload = op.inTriggerButton("Manual Reload");

const outTexture = op.outTexture("Rendered Texture");
const outData = op.outValue("Output Data");
const outError = op.outString("Error");

let p5Instance = null;
let p5Module = null;
let texture = null;
let container = null;
let isLoading = false;

op.setOutData = (data) => { outData.set(data); };

function resolvePath(p) {
    if (!p) return p;
    if (path.isAbsolute(p)) return p;
    const config = op.patch.config || {};
    const paths = config.paths || {};
    let patchPath = paths.patchPath || config.patchDir || config.path;
    if ((!patchPath || patchPath === ".") && op.patch.getFilePath) {
        try {
            const fp = op.patch.getFilePath();
            if (fp) patchPath = path.dirname(fp);
        } catch (e) {}
    }
    if (patchPath && patchPath !== ".") return path.resolve(patchPath, p);
    return p;
}

async function loadP5() {
    try {
        const resolved = resolvePath(inP5Path.get());
        const p5Url = "esm://" + resolved;
        
        // Try importing as a module first
        const mod = await import(p5Url);
        p5Module = mod.default || mod.p5 || (typeof window !== "undefined" ? window.p5 : null);
        
        if (typeof p5Module !== 'function') {
            // If import() returned an empty module (typical for global scripts loaded as ESM),
            // try loading it via a standard script tag to ensure global scope execution.
            return new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = p5Url;
                script.id = "p5_global_script";
                script.onload = () => {
                    p5Module = window.p5;
                    if (typeof p5Module === 'function') {
                        resolve(true);
                    } else {
                        outError.set("Script loaded but window.p5 is still undefined.");
                        resolve(false);
                    }
                };
                script.onerror = (err) => {
                    outError.set("Failed to load P5 via script tag.");
                    resolve(false);
                };
                document.head.appendChild(script);
            });
        }
        
        return true;
    } catch (e) {
        outError.set("Failed to load P5: " + e.message);
        return false;
    }
}

async function initSketch() {
    if (isLoading) return;
    isLoading = true;
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
        outTexture.set(null);
        if (texture) {
            texture.dispose();
            texture = null;
        }
        if (container) {
            container.remove();
            container = null;
        }
    }

    const sketchFile = inSketchFile.get();
    if (!sketchFile) return;

    if (!p5Module) {
        if (!await loadP5()) return;
    }

    try {
        const resolved = resolvePath(sketchFile);
        const sketchUrl = "esm://" + resolved + "?v=" + Date.now();
        const sketchMod = await import(sketchUrl);
        const sketchFn = sketchMod.default;

        if (typeof sketchFn !== 'function') {
            outError.set("Sketch file must export a default function (instance mode)");
            return;
        }

        container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "1px";
        container.style.height = "1px";
        container.style.overflow = "hidden";
        container.style.opacity = "0.001"; // Nearly invisible but 'visible' to avoid throttling
        container.style.pointerEvents = "none";
        container.style.zIndex = "-1000";
        document.body.appendChild(container);

        p5Instance = new p5Module((p) => {
            sketchFn(p, op);
            
            const originalSetup = p.setup;
            p.setup = () => {
                if (originalSetup) originalSetup();
                p.loop();
            };

            const originalDraw = p.draw;
            p.draw = () => {
                if (originalDraw) originalDraw();
                const canvas = p.canvas || (p._renderer && p._renderer.elt);
                if (canvas) {
                    if (!texture && op.patch.cgl) {
                        const TextureClass = (window.CABLES && window.CABLES.GL && window.CABLES.GL.Texture) || (window.CABLES && window.CABLES.Texture);
                        if (TextureClass) {
                            texture = new TextureClass(op.patch.cgl, {
                                "name": "p5_texture",
                                "texture": canvas,
                                "flip": inFlipY.get()
                            });
                            outTexture.set(texture);
                        } else {
                            outError.set("Cables Texture class not found.");
                        }
                    }
                    if (texture && texture.initTexture) {
                        texture.flip = inFlipY.get();
                        texture.initTexture(canvas);
                    }
                }
            };

            if (p.onDataChange) p.onDataChange(inData.get());
        }, container);
        
        outError.set("");
    } catch (e) {
        outError.set("Failed to load sketch: " + e.message);
    } finally {
        isLoading = false;
    }
}

inTrigger.onTriggered = () => {
    if (p5Instance && p5Instance.redraw) p5Instance.redraw();
};
inReload.onTriggered = initSketch;
inSketchFile.onChange = initSketch;
inP5Path.onChange = () => { p5Module = null; initSketch(); };
inData.onChange = () => { 
    if (p5Instance && p5Instance.onDataChange) {
        p5Instance.onDataChange(inData.get());
    }
};
inFlipY.onChange = () => { if (texture) texture.flip = inFlipY.get(); };
op.onDelete = () => { 
    if (p5Instance) p5Instance.remove(); 
    if (texture) texture.dispose();
    if (container) container.remove();
};
