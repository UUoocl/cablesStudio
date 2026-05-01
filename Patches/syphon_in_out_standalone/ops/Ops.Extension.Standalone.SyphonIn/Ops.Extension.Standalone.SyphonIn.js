const
    inRender = op.inTrigger("Render"),
    inServer = op.inString("Server", "None"),
    inManualServer = op.inString("Manual Server Name", ""),
    inManualApp = op.inString("Manual App Name", ""),
    outTex = op.outTexture("Texture"),
    outNext = op.outTrigger("Next"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outFound = op.outBool("Found");

inServer.setUiAttribs({ "display": "dropdown", "values": ["None"] });

let syphon = null;
let directory = null;
let client = null;
let texture = null;
let servers = [];

console.log("SyphonIn: Initializing...");

try {
    syphon = op.require("node-syphon");
    console.log("SyphonIn: node-syphon loaded:", !!syphon);
} catch (e) {
    op.setUiError("require", "node-syphon not found. Make sure it is installed in the Electron environment.");
    console.error("SyphonIn: Failed to load node-syphon:", e);
}

if (syphon) {
    try {
        directory = new syphon.SyphonServerDirectory();
        console.log("SyphonIn: Server directory created");
        
        const updateDropdown = () => {
            servers = directory.servers;
            console.log("SyphonIn: Found", servers.length, "servers");
            const names = ["None"];
            servers.forEach(s => {
                const name = s.SyphonServerDescriptionNameKey || "Unnamed";
                const app = s.SyphonServerDescriptionAppNameKey || "Unknown App";
                names.push(`${app}: ${name}`);
            });
            inServer.setUiAttribs({ "values": names });
        };

        directory.on("announce", updateDropdown);
        directory.on("retire", updateDropdown);
        directory.on("update", updateDropdown);
        
        directory.listen();
        updateDropdown();
    } catch (e) {
        console.error("SyphonIn: Failed to initialize server directory:", e);
    }
}

inRender.onTrigger = () => {
    outNext.trigger();
};

function updateClient() {
    if (!syphon) return;

    if (client) {
        client.dispose();
        client = null;
    }

    let description = null;
    const currentVal = inServer.get();
    const values = inServer.getUiAttribs().values || ["None"];
    const selectedIdx = values.indexOf(currentVal) - 1;

    if (selectedIdx >= 0 && servers[selectedIdx]) {
        description = servers[selectedIdx];
    } else if (inManualServer.get()) {
        description = {};
        description[syphon.SyphonServerDescriptionNameKey] = inManualServer.get();
        description[syphon.SyphonServerDescriptionAppNameKey] = inManualApp.get() || "";
        description[syphon.SyphonServerDescriptionUUIDKey] = ""; 
        description["SyphonServerDescriptionDictionaryVersionKey"] = 1;
    }

    if (description) {
        console.log("SyphonIn: Connecting to server...", description);
        try {
            client = new syphon.SyphonOpenGLClient(description);
            client.on("data", onFrame);
            outFound.set(true);
            console.log("SyphonIn: Client created successfully");
        } catch (e) {
            console.error("SyphonIn: Failed to create client:", e);
            outFound.set(false);
        }
    } else {
        outFound.set(false);
    }
}

function onFrame(frame) {
    const { width, height, buffer } = frame;

    if (!texture || texture.width !== width || texture.height !== height) {
        console.log("SyphonIn: Creating texture", width, "x", height);
        if (texture) texture.dispose();
        texture = new CGL.Texture(op.patch.cgl, {
            width: width,
            height: height,
            filter: CGL.Texture.FILTER_LINEAR,
        });
        outTex.set(texture);
    }

    outWidth.set(width);
    outHeight.set(height);

    const gl = op.patch.cgl.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture.tex);
    
    // Ensure buffer is a Uint8Array for WebGL compatibility
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data
    );
    outNext.trigger();
}

inServer.onChange = updateClient;
inManualServer.onChange = updateClient;
inManualApp.onChange = updateClient;

op.onDelete = () => {
    if (client) {
        client.dispose();
        client = null;
    }
    if (directory) {
        directory.dispose();
        directory = null;
    }
    if (texture) {
        texture.dispose();
        texture = null;
    }
};
