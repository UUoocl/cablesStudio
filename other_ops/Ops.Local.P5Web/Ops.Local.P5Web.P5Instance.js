/**
 * P5JS Web-Compatible Instance Op
 * Uses pre-loaded p5Module and p5Sketch objects injected by cables.gl web
 */

const inWidth = op.inValueInt("Canvas Width", 800);
const inHeight = op.inValueInt("Canvas Height", 600);
const inData = op.inObject("Input Data");
const inFlipY = op.inBool("Flip Y", true);
const inTrigger = op.inTrigger("Render");
const inReload = op.inTriggerButton("Manual Reload");

const outTexture = op.outTexture("Rendered Texture");
const outCanvas = op.outObject("Canvas");
const outNext = op.outTrigger("Next");
const outData = op.outNumber("Output Data");
const outError = op.outString("Error");

let p5Instance = null;
let texture = null;
let container = null;
op.log("imported module", p5Module);
console.log("imported module", p5Module);

op.setOutData = (data) => { outData.set(data); };

function createSafeCanvas(canvas) {
    if (!canvas) return null;

    // Block properties that lead to Window/document or DOM traversal to prevent SecurityErrors in the sandbox iframe
    const blockedProps = new Set([
        'ownerDocument', 'defaultView', 'parent', 'top', 'window', 'document',
        'parentNode', 'parentElement', 'offsetParent', 'getRootNode', 'children',
        'childNodes', 'firstChild', 'lastChild', 'nextSibling', 'previousSibling'
    ]);

    return new Proxy(canvas, {
        get(target, prop, receiver) {
            if (blockedProps.has(prop)) {
                return null;
            }
            if (prop === 'constructor') {
                return HTMLCanvasElement;
            }
            if (prop === 'toJSON') {
                return () => "[HTMLCanvasElement]";
            }
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'function') {
                return val.bind(target);
            }
            return val;
        }
    });
}

function initSketch() {
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

    // Resolve the raw P5 constructor and sketch function, handling ES modules
    let p5Constructor = null;
    if (typeof p5Module !== 'undefined' && p5Module) {
        if (typeof p5Module === 'function') {
            p5Constructor = p5Module;
        } else if (p5Module.default && typeof p5Module.default === 'function') {
            p5Constructor = p5Module.default;
        } else if (p5Module.p5 && typeof p5Module.p5 === 'function') {
            p5Constructor = p5Module.p5;
        }
    }

    let sketchFn = null;
    if (typeof p5Sketch !== 'undefined' && p5Sketch) {
        if (typeof p5Sketch === 'function') {
            sketchFn = p5Sketch;
        } else if (p5Sketch.default && typeof p5Sketch.default === 'function') {
            sketchFn = p5Sketch.default;
        }
    }

    if (!p5Constructor) {
        outError.set("p5Module constructor is not defined or could not be resolved.");
        return;
    }
    if (!sketchFn) {
        outError.set("p5Sketch function is not defined or could not be resolved.");
        return;
    }

    try {
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

        // Append to the parent container of the cables WebGL canvas if available
        const cablesCanvas = op.patch && op.patch.cgl && op.patch.cgl.canvas;
        const parentElement = cablesCanvas ? (cablesCanvas.parentElement || cablesCanvas.parentNode) : null;
        if (parentElement) {
            parentElement.appendChild(container);
        } else {
            document.body.appendChild(container);
        }

        p5Instance = new p5Constructor((p) => {
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
                    // Wrap the canvas to shield it from cross-origin/sandbox serialization errors
                    const safeCanvas = createSafeCanvas(canvas);
                    outCanvas.set(safeCanvas);

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
    }
}

inTrigger.onTriggered = () => {
    if (p5Instance && p5Instance.redraw) p5Instance.redraw();
};
inReload.onTriggered = initSketch;
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

// Auto-initialize the sketch on op load
initSketch();
