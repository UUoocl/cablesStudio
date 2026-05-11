const
    exe = op.inTrigger("Execute"),
    inUrl = op.inString("Source URL", ""),
    inWidth = op.inValueInt("Width", 800),
    inHeight = op.inValueInt("Height", 600),
    next = op.outTrigger("Next"),
    outTexture = op.outTexture("Texture");

let iframe = null;
let canvas = null;
let offscreen = null;
let texture = null;
let cgl = op.patch.cgl;
let isLoaded = false;
let emptyTexture = CGL.Texture.getEmptyTexture(cgl);

outTexture.setRef(emptyTexture);

function init() {
    cleanup();

    const w = inWidth.get();
    const h = inHeight.get();
    const url = inUrl.get();

    if (!url || w <= 0 || h <= 0) return;

    // Create headless canvas
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    // Create texture
    texture = new CGL.Texture(cgl, { name: "TransferCanvasTexture" });
    texture.setSize(w, h);
    
    // Transfer control to offscreen
    try {
        offscreen = canvas.transferControlToOffscreen();
    } catch (e) {
        op.warn("Browser does not support transferControlToOffscreen", e);
        return;
    }

    // Create headless iframe
    iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('allow', 'accelerometer; gyroscope; magnetometer; device-orientation; device-motion');
    iframe.src = url;
    
    iframe.onload = () => {
        isLoaded = true;
        // Send the offscreen canvas to the iframe
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'init_canvas',
                canvas: offscreen
            }, '*', [offscreen]);
        }
    };

    document.body.appendChild(iframe);
}

function updateSize() {
    init();
}

inUrl.onChange = init;
inWidth.onChange = updateSize;
inHeight.onChange = updateSize;

exe.onTriggered = () => {
    if (isLoaded && canvas && texture) {
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, texture.tex);
        cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, canvas);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        
        outTexture.setRef(texture);
    }
    next.trigger();
};

function cleanup() {
    isLoaded = false;
    if (iframe) {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        iframe = null;
    }
    if (canvas) {
        canvas = null;
    }
    if (texture) {
        texture.delete();
        texture = null;
    }
    offscreen = null;
    outTexture.setRef(emptyTexture);
}

op.onDelete = cleanup;

// Initial setup
init();
