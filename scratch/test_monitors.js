const fs = require('fs');
const path = require('path');

function testOp(filePath, name) {
    console.log(`\n=================== Testing ${name} ===================`);
    const code = fs.readFileSync(filePath, 'utf8');
    
    let activeVal = false;
    let onActiveChange = null;
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
        inString: (portName, def) => {
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; }
            };
        },
        inInt: (portName, def) => {
            let val = def;
            return {
                get: () => val,
                set: (v) => { val = v; }
            };
        },
        outTrigger: (portName) => ({
            trigger: () => console.log(`[Mock System] Trigger out: ${portName}`)
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
            filePath: (p) => p
        },
        set onDelete(cb) { onDeleteCallback = cb; }
    };

    // Run the op code in custom function context where "op" is injected
    const runCode = new Function('op', code);
    runCode(mockOp);

    return {
        setActive: (val) => mockOp.inBool("Active").set(val),
        delete: () => {
            console.log(`[Mock System] Deleting op...`);
            if (onDeleteCallback) onDeleteCallback();
        }
    };
}

const mouseOpFile = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftMouseMonitor/Ops.Extension.Standalone.Swift.SwiftMouseMonitor.js');
const keyboardOpFile = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor/Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor.js');

async function runTests() {
    // 1. Test Mouse Monitor
    const mouseInstance = testOp(mouseOpFile, "SwiftMouseMonitor");
    
    // Activate it
    mouseInstance.setActive(true);
    
    // Wait to let it spin up
    await new Promise((r) => setTimeout(r, 2000));
    
    // Deactivate it
    mouseInstance.setActive(false);
    
    // Clean delete
    mouseInstance.delete();

    // 2. Test Keyboard Monitor
    const keyboardInstance = testOp(keyboardOpFile, "SwiftKeyboardMonitor");
    
    // Activate it
    keyboardInstance.setActive(true);
    
    // Wait to let it spin up
    await new Promise((r) => setTimeout(r, 2000));
    
    // Deactivate it
    keyboardInstance.setActive(false);
    
    // Clean delete
    keyboardInstance.delete();

    console.log("\n=================== Lifecycle Verification Completed ===================");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
