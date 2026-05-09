const
    render = op.inTrigger("Render"),
    inTexture = op.inTexture("Texture"),
    serverName = op.inString("Server Name", "Cables_Output");

let server = null;
let syphon = null;
let lastWidth = 0;
let lastHeight = 0;

try {
    syphon = op.require("node-syphon");
} catch (e) {
    op.setUiError("require", "node-syphon not found. Make sure it is installed in the Electron environment.");
    console.error(e);
}

render.onTriggered = () => {
    if (!syphon || !inTexture.get()) return;

    const tex = inTexture.get();
    const width = tex.width;
    const height = tex.height;

    if (!server || server.name !== serverName.get() || width !== lastWidth || height !== lastHeight) {
        if (server) server.dispose();
        
        try {
            server = new syphon.SyphonOpenGLServer(serverName.get());
            lastWidth = width;
            lastHeight = height;
        } catch (e) {
            console.error("Failed to create Syphon server:", e);
            return;
        }
    }

    if (server && tex.tex) {
        const gl = op.patch.cgl.gl;
        
        // Ensure we have a buffer for the pixels
        if (!op._pixelBuffer || op._pixelBuffer.length !== width * height * 4) {
            op._pixelBuffer = new Uint8ClampedArray(width * height * 4);
        }

        // Create a framebuffer to read from the texture
        if (!op._fbo) op._fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, op._fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.tex, 0);

        // Read pixels from the texture
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, op._pixelBuffer);

        // Unbind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Publish image data
        server.publishImageData(
            op._pixelBuffer,
            { x: 0, y: 0, width: width, height: height },
            { width: width, height: height },
            false,
            "GL_TEXTURE_2D"
        );
    }
};

op.onDelete = () => {
    if (server) {
        server.dispose();
        server = null;
    }
    if (op._fbo) {
        op.patch.cgl.gl.deleteFramebuffer(op._fbo);
        op._fbo = null;
    }
};
