/**
 * P5JS Instance Op
 */

const inP5Url = op.inString("P5 Module URL", "http://127.0.0.1:8080/Ops.Local.P5/libs/p5.esm.min.js");
const inSketchUrl = op.inString("Sketch URL", "http://127.0.0.1:8080/Ops.Local.P5/p5_example_sketch.js");
const inWidth = op.inValueInt("Canvas Width", 800);
const inHeight = op.inValueInt("Canvas Height", 600);
const inData = op.inObject("Input Data");
const inFlipY = op.inBool("Flip Y", true);
const inTrigger = op.inTrigger("Render");
const inReload = op.inTriggerButton("Manual Reload");

const outTexture = op.outTexture("Rendered Texture");
const outCanvas = op.outObject("Canvas");
const outNext = op.outTrigger("Next");
const outData = op.outValue("Output Data");
const outError = op.outString("Error");

let p5Instance = null;
let p5Module = null;
let texture = null;
let container = null;
let isLoading = false;

op.setOutData = (data) => { outData.set(data); };

// ResolvePath removed - using direct URLs

async function loadP5() {
    const p5Url = inP5Url.get();
    if (!p5Url) return false;
    
    try {
        let resp = null;
        for (let i = 0; i < 3; i++) {
            try {
                resp = await fetch(p5Url, { cache: "no-cache" });
                if (resp.ok) break;
            } catch (e) {
                if (i === 2) throw e;
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        if (!resp || !resp.ok) throw new Error(`HTTP Error ${resp ? resp.status : 'No Response'}`);

        try {
            const mod = await import(p5Url);
            p5Module = mod.default || mod.p5 || (typeof window !== "undefined" ? window.p5 : null);
        } catch (importErr) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = p5Url;
                script.id = "p5_global_script";
                script.onload = () => {
                    p5Module = window.p5;
                    resolve();
                };
                script.onerror = (err) => reject(new Error("Script tag load FAILED"));
                document.head.appendChild(script);
            });
        }
        
        if (typeof p5Module !== 'function') {
            throw new Error("P5 library not found after loading.");
        }
        
        return true;
    } catch (e) {
        outError.set(`Failed to load P5: ${e.message} (URL: ${p5Url})`);
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

    const sketchUrlBase = inSketchUrl.get();
    if (!sketchUrlBase) return;

    if (!p5Module) {
        if (!await loadP5()) return;
    }

    try {
        const sketchUrl = sketchUrlBase + "?v=" + Date.now();
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
            sketchFn(p, op, inWidth.get(), inHeight.get());
            
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
                    outCanvas.set(canvas);

                    // Only update texture if it's actually being used
                    if (outTexture.isLinked()) {
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
                    } else if (texture) {
                        // Dispose internal texture if port is unlinked to save GPU memory
                        texture.dispose();
                        texture = null;
                        outTexture.set(null);
                    }
                }
                outNext.trigger();
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
inSketchUrl.onChange = initSketch;
inP5Url.onChange = () => { p5Module = null; initSketch(); };
inData.onChange = () => { 
    if (p5Instance && p5Instance.onDataChange) {
        p5Instance.onDataChange(inData.get());
    }
};
inWidth.onChange = inHeight.onChange = () => {
    if (p5Instance) {
        if (p5Instance.resizeCanvas) p5Instance.resizeCanvas(inWidth.get(), inHeight.get());
        if (p5Instance.onResize) p5Instance.onResize(inWidth.get(), inHeight.get());
        if (texture) texture.setSize(inWidth.get(), inHeight.get());
    }
};
inFlipY.onChange = () => { if (texture) texture.flip = inFlipY.get(); };
op.onDelete = () => { 
    if (p5Instance) p5Instance.remove(); 
    if (texture) texture.dispose();
    if (container) container.remove();
};
