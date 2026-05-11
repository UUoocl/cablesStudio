const
    inUrl = op.inString("Url", ""),
    inWidth = op.inInt("Width", 512),
    inHeight = op.inInt("Height", 512),
    inSettings = op.inObject("Settings"), // NEW: Port for sketch settings
    inReload = op.inTrigger("Reload"),
    exe = op.inTrigger("Execute"),
    outTexture = op.outTexture("Texture"),
    outLoaded = op.outBool("Is Loaded", false);

const cgl = op.patch.cgl;
let iframe = null;
let currentBmp = null;
let texture = null;

function cleanup() {
    if (iframe) {
        document.body.removeChild(iframe);
        iframe = null;
    }
    if (texture) {
        texture.dispose();
        texture = null;
    }
    outLoaded.set(false);
}

// Function to forward settings to iframe
function forwardSettings() {
    if (iframe && iframe.contentWindow && inSettings.get()) {
        iframe.contentWindow.postMessage({
            type: 'settings',
            payload: inSettings.get()
        }, '*');
    }
}

inSettings.onChange = forwardSettings;

function init() {
    cleanup();
    
    const url = inUrl.get();
    if (!url) return;

    iframe = document.createElement('iframe');
    iframe.src = url;
    
    // Hide iframe off-screen instead of display:none to avoid throttling
    iframe.style.position = 'absolute';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = inWidth.get() + 'px';
    iframe.style.height = inHeight.get() + 'px';
    iframe.style.border = 'none';
    
    // Minimal permissions
    iframe.setAttribute('allow', 'accelerometer; gyroscope');
    
    document.body.appendChild(iframe);

    iframe.onload = () => {
        outLoaded.set(true);
        updateSize();
        // Send initial settings on load
        forwardSettings();
    };

    texture = new CGL.Texture(cgl, {
        width: inWidth.get(),
        height: inHeight.get(),
        filter: CGL.Texture.FILTER_LINEAR,
    });
}

// Message listener specifically for this instance
const onMessage = (event) => {
    if (event.data && event.data.type === 'iframe_frame' && event.data.bmp) {
        // Ensure the message came from OUR iframe
        if (iframe && event.source === iframe.contentWindow) {
            const bmp = event.data.bmp;
            if (currentBmp) currentBmp.close();
            currentBmp = bmp;
        }
    }
};

window.addEventListener('message', onMessage);

// Debounced resize handler
let resizeTimeout = null;
function updateSize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const w = inWidth.get();
        const h = inHeight.get();
        if (texture) texture.setSize(w, h);
        if (iframe) {
            iframe.style.width = w + 'px';
            iframe.style.height = h + 'px';
            
            // Notify the sketch to resize its canvas
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'resize', w, h }, '*');
            }
        }
    }, 50);
}

inUrl.onChange = init;
inReload.onTriggered = init;
inWidth.onChange = updateSize;
inHeight.onChange = updateSize;

exe.onTriggered = () => {
    if (currentBmp && texture) {
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, texture.tex);
        cgl.gl.texImage2D(
            cgl.gl.TEXTURE_2D, 
            0, 
            cgl.gl.RGBA, 
            cgl.gl.RGBA, 
            cgl.gl.UNSIGNED_BYTE, 
            currentBmp
        );
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        outTexture.setRef(texture);
        
        currentBmp.close();
        currentBmp = null;
    }
    next.trigger();
};

op.onDelete = () => {
    window.removeEventListener('message', onMessage);
    cleanup();
};

init();
