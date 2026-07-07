// Ops.Team.CablesStudio.HTMLInCanvas.js

// Define inputs
const inUpdate = op.inTrigger("Update");
const inElement = op.inObject("Element");
const inWidth = op.inInt("Width", 512);
const inHeight = op.inInt("Height", 512);
const inFlipY = op.inBool("Flip Y", true);

// Define outputs
const outNext = op.outTrigger("Next");
const outTexture = op.outTexture("Texture");
const outSupported = op.outBoolNum("Supported", false);
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Resolution", [inWidth, inHeight]);
op.setPortGroup("Texture", [inFlipY]);

const cgl = op.patch.cgl;
const gl = cgl.gl;
let tex = null;
const emptyTexture = CGL.Texture.getEmptyTexture(cgl);
outTexture.setRef(emptyTexture);

// Feature detection
const isSupported = ('requestPaint' in HTMLCanvasElement.prototype) && (gl && typeof gl.texElementImage2D === 'function');
outSupported.set(isSupported);

if (!isSupported) {
    op.setUiError("not_supported", "HTML-in-Canvas is not supported by your browser or WebGL context (requires canvas.requestPaint and gl.texElementImage2D). Only modern Chromium versions support this feature.", 1);
    outError.set("HTML-in-Canvas API is not supported in this browser environment.");
}

// Enable layout subtree on the Cables canvas
if (isSupported && cgl.canvas) {
    if (!cgl.canvas.hasAttribute("layoutsubtree")) {
        cgl.canvas.setAttribute("layoutsubtree", "");
        op.log("[HTMLInCanvas] Enabled layoutsubtree on the WebGL canvas.");
    }
}

let currentElement = null;
let needsUpdate = true;

// Listen to input changes
inWidth.onChange = () => { needsUpdate = true; };
inHeight.onChange = () => { needsUpdate = true; };
inFlipY.onChange = () => { needsUpdate = true; };

inElement.onChange = () => {
    // Clean up old element from canvas children
    if (currentElement && currentElement.parentNode === cgl.canvas) {
        try {
            cgl.canvas.removeChild(currentElement);
        } catch (e) {
            op.logWarn("[HTMLInCanvas] Failed to remove previous element:", e);
        }
    }

    currentElement = inElement.get();

    // Append new element as descendant of WebGL canvas to place it in the layout subtree
    if (currentElement && isSupported && cgl.canvas) {
        try {
            cgl.canvas.appendChild(currentElement);
            op.log("[HTMLInCanvas] Appended element to the WebGL canvas layout subtree.");
        } catch (e) {
            op.logError("[HTMLInCanvas] Failed to append element to WebGL canvas:", e);
            outError.set("Failed to append element: " + e.message);
        }
    }

    needsUpdate = true;
};

// Canvas paint listener chaining
const oldOnPaint = cgl.canvas ? cgl.canvas.onpaint : null;

function onPaintCallback(event) {
    if (oldOnPaint) {
        try {
            oldOnPaint(event);
        } catch (e) {
            op.logWarn("[HTMLInCanvas] Error in chained onpaint callback:", e);
        }
    }

    const element = inElement.get();
    if (!element || !isSupported) return;

    // Check if our element changed, or if parameters changed
    let shouldRender = needsUpdate;
    if (event && event.changedElements && event.changedElements.includes(element)) {
        shouldRender = true;
    }

    if (shouldRender) {
        renderTexture(element);
        needsUpdate = false;
    }
}

if (isSupported && cgl.canvas) {
    cgl.canvas.onpaint = onPaintCallback;
}

op.onDelete = () => {
    // Detach element from canvas
    if (currentElement && currentElement.parentNode === cgl.canvas) {
        try {
            cgl.canvas.removeChild(currentElement);
        } catch (e) {}
    }

    // Clean up WebGL texture
    if (tex) {
        tex.delete();
        tex = null;
    }

    // Restore original onpaint callback
    if (cgl.canvas && cgl.canvas.onpaint === onPaintCallback) {
        cgl.canvas.onpaint = oldOnPaint;
    }
};

inUpdate.onTriggered = () => {
    outNext.trigger();

    if (!isSupported) return;

    const element = inElement.get();
    if (!element) {
        outTexture.setRef(emptyTexture);
        return;
    }

    // Request paint pass on the canvas to trigger onpaint event
    cgl.canvas.requestPaint();
};

function renderTexture(element) {
    const w = inWidth.get();
    const h = inHeight.get();

    if (w <= 0 || h <= 0) return;

    if (!tex) {
        tex = new CGL.Texture(cgl, {
            filter: CGL.Texture.FILTER_LINEAR,
            wrap: CGL.Texture.WRAP_CLAMP_TO_EDGE
        });
    }

    if (tex.width !== w || tex.height !== h) {
        tex.setSize(w, h);
    }

    try {
        const gl = cgl.gl;
        gl.bindTexture(gl.TEXTURE_2D, tex.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, inFlipY.get());

        // Upload element layout subtree to WebGL texture using browser-native API
        const internalFormat = cgl.glVersion === 2 ? gl.RGBA8 : gl.RGBA;
        gl.texElementImage2D(gl.TEXTURE_2D, internalFormat, element);

        if (inFlipY.get()) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        outTexture.setRef(tex);
        outError.set("");
    } catch (err) {
        op.logError("[HTMLInCanvas] gl.texElementImage2D failed:", err);
        outError.set("WebGL render failed: " + err.message);
    }
}
