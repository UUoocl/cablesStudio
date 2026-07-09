const
    inUpdate = op.inTrigger("Update"),
    next = op.outTrigger("Next"),
    inTexture = op.inTexture("Texture"),
    inChannelName = op.inString("Broadcast Channel Name", "texture-sync"),
    inPosX = op.inInt("Pos X", 0),
    inPosY = op.inInt("Pos Y", 0),
    inSizeX = op.inInt("Width", 800),
    inSizeY = op.inInt("Height", 480),
    inSmoothing = op.inBool("Smoothing", true),
    inStretch = op.inBool("Stretch", false),
    inTransparent = op.inBool("Transparent background"),
    inTitle = op.inString("Title", "cables texture"),
    inOpen = op.inTriggerButton("Open Window"),
    inFull = op.inTriggerButton("Fullscreen"),
    outEle = op.outObject("Element", null, "element"),
    outMode = op.outString("Mode", "None"),
    inClose = op.inTriggerButton("Close");

const cgl = op.patch.cgl;
let canvas = null;
let ctx = null; // 2D Context for WebGL fallback
let gpuContext = null; // WebGPU Context
let winWidth = 400, winHeight = 400;
let origWidth = 800, origHeight = 480;
let subWindow = null;
let x = 0;
let y = 0;

let fb = null;
let pixelData = null;
let channel = null;

// WebGPU Pipeline Cache
let webgpuPipeline = null;
let webgpuSampler = null;
let lastGpuTexture = null;
let webgpuBindGroup = null;

op.toWorkPortsNeedToBeLinked(inUpdate, next);
op.setPortGroup("Size", [inSizeX, inSizeY]);
op.setPortGroup("Position", [inPosY, inPosX]);

inClose.onTriggered = close;
inFull.onTriggered = fullscreen;
op.onDelete = () => {
    close();
    if (channel) {
        channel.close();
        channel = null;
    }
    if (window.cablesSharedTextures) {
        delete window.cablesSharedTextures[op.id];
    }
};

window.addEventListener("beforeunload", close, false);

if (CABLES.UI) gui.on("resizecanvas", () => { resize(); setTimeout(resize, 150); });

inStretch.onChange = resize;
inChannelName.onChange = updateChannel;

inPosY.onChange =
    inPosX.onChange = move;

inSizeY.onChange =
    inSizeX.onChange = onSize;

// Initialize Broadcast Channel
updateChannel();

function updateChannel() {
    if (channel) {
        channel.close();
    }
    const name = inChannelName.get();
    if (name) {
        channel = new BroadcastChannel(name);
    } else {
        channel = null;
    }
}

function onSize()
{
    if (subWindow) subWindow.resizeTo(inSizeX.get(), inSizeY.get());
    resize();
}

function move()
{
    if (!subWindow) return;
    subWindow.moveTo(inPosX.get(), inPosY.get());
}

inTitle.onChange = () =>
{
    if (subWindow) subWindow.document.title = inTitle.get();
};

function close()
{
    if (subWindow) subWindow.close();

    subWindow = null;
    canvas = null;
    ctx = null;
    gpuContext = null;
    webgpuPipeline = null;
    webgpuSampler = null;
    webgpuBindGroup = null;
    lastGpuTexture = null;
    outMode.set("Inactive");
}

function resize(useWinSize)
{
    if (!subWindow) return;

    const realTexture = inTexture.get();
    if (realTexture) {
        origWidth = realTexture.width || 800;
        origHeight = realTexture.height || 480;
    }

    winWidth = subWindow.innerWidth;
    winHeight = subWindow.innerHeight;

    x = 0;
    y = 0;

    if (inStretch.get())
    {
        canvas.width = winWidth;
        canvas.height = winHeight;
    }
    else
    {
        if (winWidth / winHeight < origWidth / origHeight)
        {
            canvas.width = winWidth;
            canvas.height = canvas.width * (origHeight / origWidth);
            y = Math.abs(winHeight - canvas.height) / 2;
        }
        else
        {
            canvas.height = winHeight;
            canvas.width = canvas.height / (origHeight / origWidth);
            x = Math.abs(winWidth - canvas.width) / 2;
        }
    }
}

function fullscreen()
{
    if (!subWindow) return;
    const elem = subWindow.document.body;
    if (elem.requestFullScreen) elem.requestFullScreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullScreen) elem.webkitRequestFullScreen();
    else if (elem.msRequestFullScreen) elem.msRequestFullScreen();

    resize();
}

inOpen.onTriggered = () =>
{
    if (subWindow) close();
    let id = CABLES.uuid();
    subWindow = window.open("", "view#" + id, "width=" + inSizeX.get() + ",height=" + inSizeY.get() + ",directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true");
    if (!subWindow) return;
    let document = subWindow.document;
    document.title = inTitle.get();

    let body = document.body;
    let bgColor = "#000";
    if (inTransparent.get()) bgColor = "transparent";
    body.style = "padding:0px;margin:0px;background-color:" + bgColor + ";overflow:hidden;";
    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.width = winWidth;
    canvas.height = winHeight;
    body.appendChild(canvas);

    // Context gets deferred initialized in the update loop depending on the API used
    ctx = null;
    gpuContext = null;

    outEle.setRef(body);

    resize();
    move();

    subWindow.addEventListener("resize", () =>
    {
        resize();
    });

    subWindow.addEventListener("beforeunload", close, false);

    canvas.addEventListener("dblclick", (e) =>
    {
        fullscreen();
    });
};

function renderWebGPU(device, presentationFormat, sourceGpuTexture) {
    if (!gpuContext) {
        gpuContext = canvas.getContext("webgpu");
        if (!gpuContext) return;
        gpuContext.configure({
            "device": device,
            "format": presentationFormat,
            "usage": GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    if (!webgpuPipeline) {
        const shaderModule = device.createShaderModule({
            "code": `
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) uv: vec2<f32>,
                }

                @vertex
                fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    var pos = array<vec2<f32>, 4>(
                        vec2<f32>(-1.0,  1.0),
                        vec2<f32>(-1.0, -1.0),
                        vec2<f32>( 1.0,  1.0),
                        vec2<f32>( 1.0, -1.0)
                    );
                    var uv = array<vec2<f32>, 4>(
                        vec2<f32>(0.0, 0.0),
                        vec2<f32>(0.0, 1.0),
                        vec2<f32>(1.0, 0.0),
                        vec2<f32>(1.0, 1.0)
                    );
                    var out: VertexOutput;
                    out.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                    out.uv = uv[vertexIndex];
                    return out;
                }

                @group(0) @binding(0) var mySampler: sampler;
                @group(0) @binding(1) var myTexture: texture_2d<f32>;

                @fragment
                fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
                    return textureSample(myTexture, mySampler, uv);
                }
            `
        });

        webgpuSampler = device.createSampler({
            "magFilter": "linear",
            "minFilter": "linear",
        });

        webgpuPipeline = device.createRenderPipeline({
            "layout": "auto",
            "vertex": {
                "module": shaderModule,
                "entryPoint": "vs_main",
            },
            "fragment": {
                "module": shaderModule,
                "entryPoint": "fs_main",
                "targets": [{
                    "format": presentationFormat,
                }],
            },
            "primitive": {
                "topology": "triangle-strip",
            },
        });
    }

    if (lastGpuTexture !== sourceGpuTexture) {
        webgpuBindGroup = device.createBindGroup({
            "layout": webgpuPipeline.getBindGroupLayout(0),
            "entries": [
                {
                    "binding": 0,
                    "resource": webgpuSampler,
                },
                {
                    "binding": 1,
                    "resource": sourceGpuTexture.createView(),
                },
            ],
        });
        lastGpuTexture = sourceGpuTexture;
    }

    const commandEncoder = device.createCommandEncoder();
    const renderPassDescriptor = {
        "colorAttachments": [{
            "view": gpuContext.getCurrentTexture().createView(),
            "clearValue": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 1.0 },
            "loadOp": "clear",
            "storeOp": "store",
        }],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(webgpuPipeline);
    passEncoder.setBindGroup(0, webgpuBindGroup);
    passEncoder.draw(4);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
}

inUpdate.onTriggered = () =>
{
    next.trigger();

    const realTexture = inTexture.get();

    // Register texture globally for zero-overhead lookup in the same JS thread/process
    window.cablesSharedTextures = window.cablesSharedTextures || {};
    if (realTexture) {
        window.cablesSharedTextures[op.id] = {
            "texture": realTexture,
            "cgl": cgl,
            "canvas": canvas
        };
    } else {
        delete window.cablesSharedTextures[op.id];
    }

    // Share WebGPU/WebGL texture location and dimensions via Broadcast Channel
    if (channel && realTexture) {
        channel.postMessage({
            "type": "texture_update",
            "key": op.id,
            "width": realTexture.width,
            "height": realTexture.height,
            "name": realTexture.name || "cables_texture",
            "api": realTexture.gpuTexture ? "WebGPU" : "WebGL",
            "windowState": subWindow ? "open" : "closed"
        });
    }

    if (!subWindow || !realTexture) {
        outMode.set("Inactive");
        return;
    }

    if (canvas)
    {
        canvas.style.top = y + "px";
        canvas.style.left = x + "px";

        // WebGPU Path
        if (realTexture.gpuTexture && op.patch.cgp && op.patch.cgp.device) {
            const device = op.patch.cgp.device;
            const presentationFormat = op.patch.cgp.presentationFormat || navigator.gpu.getPreferredCanvasFormat();
            renderWebGPU(device, presentationFormat, realTexture.gpuTexture);
            outMode.set("WebGPU");
            return;
        }

        // WebGL Fallback Path (using ImageBitmap and flipY option)
        if (realTexture.tex) {
            if (!ctx) {
                ctx = canvas.getContext("2d");
                if (!ctx) return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = inSmoothing.get();

            const gl = cgl.gl;
            if (!fb) fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, realTexture.tex, 0);

            const canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
            if (canRead) {
                const width = realTexture.width;
                const height = realTexture.height;
                const size = width * height * 4;

                if (!pixelData || pixelData.length !== size) {
                    pixelData = new Uint8Array(size);
                }

                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                // Construct ImageData from the flat Uint8Array
                const imgData = new ImageData(new Uint8ClampedArray(pixelData.buffer), width, height);

                // Use createImageBitmap with flipY option to let GPU handle orientation asynchronously
                createImageBitmap(imgData, { "imageOrientation": "flipY" }).then((bitmap) => {
                    if (ctx && canvas) {
                        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                    }
                    bitmap.close();
                }).catch((err) => {
                    console.error("createImageBitmap failed:", err);
                });
                outMode.set("WebGL");
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                outMode.set("WebGL (FB Error)");
            }
        }
    }
};
