const fs = require('fs');
const path = require('path');

function testSpeechOp(filePath, name) {
    console.log(`\n=================== Testing ${name} ===================`);
    const code = fs.readFileSync(filePath, 'utf8');
    
    let activeVal = false;
    let onActiveChange = null;
    let renderTriggered = null;
    let onDeleteCallback = null;
    let localeVal = "en-US";
    let onLocaleChange = null;
    let audioDeviceVal = "Default System Microphone";
    let onAudioDeviceChange = null;

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
        inTriggerButton: (portName) => {
            return {
                set onTriggered(cb) {}
            };
        },
        inString: (portName, def) => {
            if (portName === "Language Locale") {
                return {
                    get: () => localeVal,
                    set: (v) => {
                        localeVal = v;
                        console.log(`[Mock System] Setting Language Locale to ${v}`);
                        if (onLocaleChange) onLocaleChange();
                    },
                    set onChange(cb) { onLocaleChange = cb; },
                    setUiAttribs: () => {}
                };
            }
            if (portName === "Audio Input Device") {
                return {
                    get: () => audioDeviceVal,
                    set: (v) => {
                        audioDeviceVal = v;
                        console.log(`[Mock System] Setting Audio Input Device to ${v}`);
                        if (onAudioDeviceChange) onAudioDeviceChange();
                    },
                    set onChange(cb) { onAudioDeviceChange = cb; },
                    setUiAttribs: (attr) => {
                        console.log(`[Mock System] Available audio devices updated in dropdown:`, attr.values);
                    }
                };
            }
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
                set: (v) => { val = v; },
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

    const runCode = new Function('op', code);
    runCode(mockOp);

    return {
        setActive: (val) => {
            if (mockOp.inBool("Active")) {
                mockOp.inBool("Active").set(val);
            }
        },
        delete: () => {
            console.log(`[Mock System] Deleting op...`);
            if (onDeleteCallback) onDeleteCallback();
        }
    };
}

const filePath = path.join(__dirname, '../ops/Ops.Extension.Standalone.Swift.SwiftSpeechToText/Ops.Extension.Standalone.Swift.SwiftSpeechToText.js');

async function runTests() {
    const instance = testSpeechOp(filePath, "SwiftSpeechToText");
    
    // Activate it
    instance.setActive(true);
    
    // Wait for the sidecar to spin up and register devices
    console.log(`\n[Test System] Waiting for sidecar process to connect and run...`);
    await new Promise((r) => setTimeout(r, 4000));

    // Deactivate and delete
    console.log(`\n[Test System] Cleaning up resources...`);
    instance.setActive(false);
    instance.delete();
    
    console.log(`\n=================== Verification Completed ===================`);
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
