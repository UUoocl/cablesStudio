const fs = require('fs');
const path = require('path');

function testOp(filePath, name, patchMocks = {}) {
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

const syphonInFile = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftSyphonIn/Ops.Extension.Standalone.Swift.SwiftSyphonIn.js');
const syphonOutFile = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftSyphonOut/Ops.Extension.Standalone.Swift.SwiftSyphonOut.js');

async function runTests() {
    // 1. Launch SwiftSyphonIn
    const inputInstance = testOp(syphonInFile, "SwiftSyphonIn");
    inputInstance.setActive(true);
    
    // 2. Launch SwiftSyphonOut
    const outputInstance = testOp(syphonOutFile, "SwiftSyphonOut");
    
    // Trigger render on output to start WebSocket server and spawn process
    outputInstance.triggerRender();

    // Wait for daemons to spin up and mount RAM disk
    console.log("\n[Test System] Waiting 4 seconds for connections and RAM Disk frame exchange...");
    await new Promise((r) => setTimeout(r, 4000));

    // Trigger frame writes/reads a few times
    console.log("\n[Test System] Simulating active render frames...");
    outputInstance.triggerRender();
    await new Promise((r) => setTimeout(r, 500));
    outputInstance.triggerRender();
    await new Promise((r) => setTimeout(r, 500));

    // Deactivate and delete
    console.log("\n[Test System] Cleaning up resources...");
    inputInstance.setActive(false);
    inputInstance.delete();
    
    outputInstance.delete();

    console.log("\n=================== Syphon Verification Completed ===================");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
