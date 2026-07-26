/**
 * P5JS Web-Compatible Instance Op
 * Loads sketches dynamically from a multiport string input using Blob URLs and ES Modules.
 * Uses pre-loaded p5Module object injected by cables.gl web.
 */

const inWidth = op.inInt("Canvas Width", 800);
const inHeight = op.inInt("Canvas Height", 450);
const inData = op.inObject("Input Data");
const inFlipX = op.inBool("Flip X", false);
const inFlipY = op.inBool("Flip Y", true);
const inTrigger = op.inTrigger("Render");
const inReload = op.inTriggerButton("Manual Reload");
const inSketchFiles = op.inMultiPort2("Sketch Files", CABLES.OP_PORT_TYPE_STRING, { "display": "editor" });
const inMainScript = op.inString("Main Script", "sketch.js");

const outTexture = op.outTexture("Rendered Texture");
const outCanvas = op.outObject("Canvas");
const outNext = op.outTrigger("Next");
const outData = op.outNumber("Output Data");
const outError = op.outString("Error");

let p5Instance = null;
let texture = null;
let container = null;
let activeBlobUrls = {};
let copyTexture = null;
let flipXUniform = null;

const flipXShaderSrc = `
    UNI sampler2D tex;
    IN vec2 texCoord;
    UNI float flipX;
    void main()
    {
        vec2 tc = texCoord;
        if (flipX > 0.5) tc.x = 1.0 - tc.x;
        outColor = texture(tex, tc);
    }
`;

if (typeof p5Module !== 'undefined') {
    op.log("imported module", p5Module);
    console.log("imported module", p5Module);
}

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

function clearBlobUrls() {
    for (const path in activeBlobUrls) {
        URL.revokeObjectURL(activeBlobUrls[path]);
    }
    activeBlobUrls = {};
}

async function initSketch() {
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
        outTexture.set(null);
        if (texture) {
            texture.dispose();
            texture = null;
        }
        if (copyTexture) {
            copyTexture.dispose();
            copyTexture = null;
            flipXUniform = null;
        }
        if (container) {
            container.remove();
            container = null;
        }
    }

    // Resolve the raw P5 constructor, handling ES modules
    let p5Constructor = null;
    const globalP5Module = (typeof p5Module !== 'undefined' && p5Module) || (typeof window !== 'undefined' && window.p5);
    if (globalP5Module) {
        if (typeof globalP5Module === 'function') {
            p5Constructor = globalP5Module;
        } else if (globalP5Module.default && typeof globalP5Module.default === 'function') {
            p5Constructor = globalP5Module.default;
        } else if (globalP5Module.p5 && typeof globalP5Module.p5 === 'function') {
            p5Constructor = globalP5Module.p5;
        }
    }

    if (!p5Constructor) {
        outError.set("p5Module constructor is not defined or could not be resolved.");
        return;
    }

    const files = {};
    const ports = inSketchFiles.get();
    const availableTitles = [];
    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const title = port.getTitle() || (port.uiAttribs && port.uiAttribs.title) || port.name;
        availableTitles.push(title);
        files[title] = port.get() || "";
        console.log(`P5Instance Port ${i}: title="${port.getTitle()}", name="${port.name}", resolvedTitle="${title}"`);
    }

    const mainScript = inMainScript.get() || "sketch.js";
    if (files[mainScript] === undefined) {
        outError.set(`Main script "${mainScript}" not found in Sketch Files. Available files: [${availableTitles.join(', ')}]`);
        return;
    }

    clearBlobUrls();
    const resolving = new Set();

    function getOrCreateBlobUrl(filePath) {
        if (activeBlobUrls[filePath]) return activeBlobUrls[filePath];
        if (resolving.has(filePath)) {
            op.logWarn(`Circular dependency detected for ${filePath}`);
            return "";
        }
        resolving.add(filePath);

        let content = files[filePath];
        if (content === undefined) {
            resolving.delete(filePath);
            return null;
        }

        // Helper to normalize path resolution
        function resolvePath(basePath, relativePath) {
            if (relativePath.startsWith('/') || relativePath.startsWith('http:') || relativePath.startsWith('https:')) {
                return relativePath;
            }
            const baseParts = basePath.split('/');
            baseParts.pop(); // Remove filename to get directory
            const relParts = relativePath.split('/');
            for (const part of relParts) {
                if (part === '.' || part === '') {
                    continue;
                } else if (part === '..') {
                    baseParts.pop();
                } else {
                    baseParts.push(part);
                }
            }
            return baseParts.join('/');
        }

        function resolveImportPath(currentFile, importPath) {
            let resolved = resolvePath(currentFile, importPath);
            if (files[resolved] !== undefined) {
                const url = getOrCreateBlobUrl(resolved);
                if (url) return url;
            }
            if (files[importPath] !== undefined) {
                const url = getOrCreateBlobUrl(importPath);
                if (url) return url;
            }
            return null;
        }

        // Rewrite static import/export ... from 'path'
        const fromRegex = /(\b(?:import|export)\b.*?\bfrom\s*['"])([^'"]+)(['"])/g;
        content = content.replace(fromRegex, (match, prefix, path, suffix) => {
            const resolved = resolveImportPath(filePath, path);
            if (resolved) {
                return `${prefix}${resolved}${suffix}`;
            }
            return match;
        });

        // Rewrite import 'path'
        const importRegex = /(\bimport\s*['"])([^'"]+)(['"])/g;
        content = content.replace(importRegex, (match, prefix, path, suffix) => {
            const resolved = resolveImportPath(filePath, path);
            if (resolved) {
                return `${prefix}${resolved}${suffix}`;
            }
            return match;
        });

        // Rewrite import('path')
        const dynamicImportRegex = /(\bimport\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;
        content = content.replace(dynamicImportRegex, (match, prefix, path, suffix) => {
            const resolved = resolveImportPath(filePath, path);
            if (resolved) {
                return `${prefix}${resolved}${suffix}`;
            }
            return match;
        });

        const blob = new Blob([content], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        activeBlobUrls[filePath] = url;

        resolving.delete(filePath);
        return url;
    }

    let mainScriptUrl = null;
    try {
        mainScriptUrl = getOrCreateBlobUrl(mainScript);
    } catch (e) {
        outError.set("Error resolving dependencies: " + e.message);
        return;
    }

    if (!mainScriptUrl) {
        outError.set(`Failed to create Blob URL for main script "${mainScript}"`);
        return;
    }

    let sketchFn = null;
    try {
        const sketchMod = await import(mainScriptUrl);
        sketchFn = sketchMod.default;
    } catch (e) {
        outError.set("Failed to load sketch: " + e.message);
        return;
    }

    if (typeof sketchFn !== 'function') {
        outError.set("Sketch file must export a default function (instance mode).");
        return;
    }

    try {
        container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = inWidth.get() + "px";
        container.style.height = inHeight.get() + "px";
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
                if (p.resizeCanvas) p.resizeCanvas(inWidth.get(), inHeight.get());
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
                                texture.setSize(inWidth.get(), inHeight.get());
                                outTexture.set(texture);
                            } else {
                                outError.set("Cables Texture class not found.");
                            }
                        }
                        if (texture && texture.initTexture) {
                            texture.flip = inFlipY.get();
                            texture.initTexture(canvas);
                        }

                        if (texture) {
                            if (inFlipX.get()) {
                                if (!copyTexture && op.patch.cgl) {
                                    copyTexture = new CGL.CopyTexture(op.patch.cgl, "p5_flip_x", {
                                        shader: flipXShaderSrc
                                    });
                                    flipXUniform = new CGL.Uniform(copyTexture.bgShader, "f", "flipX", 1.0);
                                }
                                if (copyTexture) {
                                    flipXUniform.setValue(1.0);
                                    const flippedTex = copyTexture.copy(texture);
                                    outTexture.setRef(flippedTex);
                                }
                            } else {
                                outTexture.set(texture);
                            }
                        }
                    } else {
                        if (texture) {
                            // Dispose internal texture if port is unlinked to save GPU memory
                            texture.dispose();
                            texture = null;
                            outTexture.set(null);
                        }
                        if (copyTexture) {
                            copyTexture.dispose();
                            copyTexture = null;
                            flipXUniform = null;
                        }
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
    if (container) {
        container.style.width = inWidth.get() + "px";
        container.style.height = inHeight.get() + "px";
    }
    if (p5Instance) {
        if (p5Instance.resizeCanvas) p5Instance.resizeCanvas(inWidth.get(), inHeight.get());
        if (p5Instance.onResize) p5Instance.onResize(inWidth.get(), inHeight.get());
        if (texture) texture.setSize(inWidth.get(), inHeight.get());
    }
};
inFlipX.onChange = () => { if (p5Instance && p5Instance.redraw) p5Instance.redraw(); };
inFlipY.onChange = () => { if (texture) texture.flip = inFlipY.get(); };
inSketchFiles.onChange = () => {
    const ports = inSketchFiles.get();
    for (let i = 0; i < ports.length; i++) {
        ports[i].onChange = initSketch;
    }
    initSketch();
};
inMainScript.onChange = initSketch;

op.onDelete = () => {
    if (p5Instance) p5Instance.remove();
    if (texture) texture.dispose();
    if (container) container.remove();
    if (copyTexture) copyTexture.dispose();
    clearBlobUrls();
};

// Auto-initialize the sketch on op load
initSketch();
