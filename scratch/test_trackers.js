const fs = require('fs');
const path = require('path');

function testTrackerOp(filePath, name) {
    console.log(`\n=================== Testing ${name} ===================`);
    const code = fs.readFileSync(filePath, 'utf8');
    
    let activeVal = false;
    let onActiveChange = null;
    let renderTriggered = null;
    let onDeleteCallback = null;

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
        inValueSlider: (portName, def) => {
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; }
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
        outArray: (portName) => ({
            set: (val) => console.log(`[Mock System] Output Array: ${portName} updated with count = ${val ? val.length : 0}`)
        }),
        outNumber: (portName, def) => ({
            set: (val) => console.log(`[Mock System] Output Number: ${portName} = ${val}`)
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

const opsPath = path.join(__dirname, '../ops');
const files = [
    { name: "SwiftHumanFace", file: "Ops.Extension.Standalone.Swift.SwiftHumanFace/Ops.Extension.Standalone.Swift.SwiftHumanFace.js" },
    { name: "SwiftHumanHand", file: "Ops.Extension.Standalone.Swift.SwiftHumanHand/Ops.Extension.Standalone.Swift.SwiftHumanHand.js" },
    { name: "SwiftHumanPose2d", file: "Ops.Extension.Standalone.Swift.SwiftHumanPose2d/Ops.Extension.Standalone.Swift.SwiftHumanPose2d.js" },
    { name: "SwiftHumanPose3d", file: "Ops.Extension.Standalone.Swift.SwiftHumanPose3d/Ops.Extension.Standalone.Swift.SwiftHumanPose3d.js" }
];

async function runTests() {
    for (const item of files) {
        const filePath = path.join(opsPath, item.file);
        const instance = testTrackerOp(filePath, item.name);
        
        // Activate it
        instance.setActive(true);
        
        // Wait for the sidecar to spin up
        console.log(`\n[Test System] Waiting for ${item.name} sidecar process to connect...`);
        await new Promise((r) => setTimeout(r, 2000));
        
        // Trigger Render to write the file and notify the sidecar
        console.log(`\n[Test System] Triggering render to process frame for ${item.name}...`);
        instance.triggerRender();
        
        // Wait for vision inference and callback
        await new Promise((r) => setTimeout(r, 1500));

        // Deactivate and delete
        console.log(`\n[Test System] Cleaning up resources for ${item.name}...`);
        instance.setActive(false);
        instance.delete();
        
        console.log(`\n=================== ${item.name} Verification Completed ===================`);
    }
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
