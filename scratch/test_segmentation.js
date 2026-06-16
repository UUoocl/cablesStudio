const fs = require('fs');
const path = require('path');

function testOp(filePath, name) {
    console.log(`\n=================== Testing ${name} ===================`);
    const code = fs.readFileSync(filePath, 'utf8');
    
    let activeVal = false;
    let onActiveChange = null;
    let renderTriggered = null;
    let onDeleteCallback = null;

    // Mock WebGL and Cables context
    const mockOp = {
        require: (moduleName) => {
            if (moduleName === "ws") {
                try {
                    return require("ws");
                } catch (e) {
                    return require("../ops/Ops.Local.WsPubSub/node_modules/ws");
                }
            }
            return require(moduleName);
        },
        inBool: (portName, def) => {
            if (portName === "Active") {
                return {
                    get: () => activeVal,
                    set: (v) => {
                        activeVal = v;
                        console.log(`[Mock System] Setting Active to ${v}`);
                        if (onActiveChange) onActiveChange();
                    },
                    set onChange(cb) { onActiveChange = cb; }
                };
            }
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; }
            };
        },
        inTrigger: (portName) => {
            return {
                set onTriggered(cb) { renderTriggered = cb; }
            };
        },
        inString: (portName, def) => {
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; },
                set onChange(cb) {},
                setUiAttribs: () => {}
            };
        },
        inValueSelect: (portName, options, def) => {
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; },
                set onChange(cb) {}
            };
        },
        inTexture: (portName) => {
            return {
                get: () => ({
                    tex: {},
                    width: 640,
                    height: 480
                })
            };
        },
        outTrigger: (portName) => ({
            trigger: () => console.log(`[Mock System] Trigger out: ${portName}`)
        }),
        outNumber: (portName, def) => ({
            set: (val) => console.log(`[Mock System] Output Number: ${portName} = ${val}`)
        }),
        outTexture: (portName) => ({
            set: (val) => console.log(`[Mock System] Output Texture updated:`, !!val)
        }),
        outString: (portName, def) => ({
            set: (val) => console.log(`[Mock System] Output String: ${portName} = ${val}`)
        }),
        outBool: (portName, def) => ({
            set: (val) => console.log(`[Mock System] Output Bool: ${portName} = ${val}`)
        }),
        log: (...args) => console.log(`[${name} Log]`, ...args),
        logError: (...args) => console.error(`[${name} Error]`, ...args),
        logWarn: (...args) => console.warn(`[${name} Warning]`, ...args),
        patch: {
            config: {
                prefixAssetPath: path.join(__dirname, '../')
            },
            filePath: (p) => p,
            cgl: {
                gl: {
                    createFramebuffer: () => ({}),
                    bindFramebuffer: () => {},
                    framebufferTexture2D: () => {},
                    blitFramebuffer: () => {},
                    readPixels: (x, y, w, h, format, type, buffer) => {
                        // fill mock frame buffer
                        buffer.fill(255);
                    },
                    deleteFramebuffer: () => {},
                    bindTexture: () => {},
                    texImage2D: () => {}
                }
            }
        },
        set onDelete(cb) { onDeleteCallback = cb; }
    };

    // Global mock injection for CGL.Texture
    global.CGL = {
        Texture: class {
            constructor(cgl, options) {
                this.width = options.width;
                this.height = options.height;
                this.tex = {};
            }
            dispose() {}
        }
    };
    global.CGL.Texture.FILTER_LINEAR = 9729;

    // Run the op code in custom function context
    const runCode = new Function('op', code);
    runCode(mockOp);

    return {
        setActive: (val) => {
            if (mockOp.inBool("Active")) {
                mockOp.inBool("Active").set(val);
            }
        },
        triggerRender: () => {
            if (renderTriggered) {
                renderTriggered();
            }
        },
        delete: () => {
            console.log(`[Mock System] Deleting op...`);
            if (onDeleteCallback) onDeleteCallback();
        }
    };
}

const segmentationFile = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftPersonSegmentation/Ops.Extension.Standalone.Swift.SwiftPersonSegmentation.js');

async function runTests() {
    const instance = testOp(segmentationFile, "SwiftPersonSegmentation");
    
    // Activate it
    instance.setActive(true);
    
    // Wait for the sidecar to spin up
    console.log("\n[Test System] Waiting for sidecar process to connect...");
    await new Promise((r) => setTimeout(r, 3000));
    
    // Trigger Render to write the file and notify the sidecar
    console.log("\n[Test System] Triggering render to process frame...");
    instance.triggerRender();
    
    // Wait for vision inference and callback
    await new Promise((r) => setTimeout(r, 2000));

    // Deactivate and delete
    console.log("\n[Test System] Cleaning up resources...");
    instance.setActive(false);
    instance.delete();

    console.log("\n=================== Person Segmentation Verification Completed ===================");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
