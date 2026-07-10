/**
 * Ops.Team.CablesStudio.Shortcuts
 * Executes Apple Shortcuts in a child window via shortcuts:// URI scheme and receives execution results
 * via BroadcastChannel or by directly setting the Cables patch variable "ShortCutsResult".
 * 
 * JXA AppleScript Callback Integration Guide:
 * 
 * To return values from macOS Shortcuts to Cables, add a "Run JavaScript for Automation"
 * action at the end of your Shortcut and use the JXA syntax below:
 * 
 * ------------------------------------------------------------------------------------------------
 * function run(input) {
 *     // input is passed as a 2D array from Apple Shortcuts (e.g. input[0][0])
 *     var payloadStr = input[0][0];
 *     var payload = JSON.parse(payloadStr);
 *     var uuid = payload.uuid;
 * 
 *     // ... Perform your shortcut processing here to get a result ...
 *     var result = {
 *         uuid: uuid, // Critical: include the UUID so the dispatcher can route the result
 *         status: "success",
 *         myOutput: "Hello from macOS Shortcuts!",
 *         data: payload.data
 *     };
 * 
 *     var success = false;
 * 
 *     // Target Google Chrome
 *     var chrome = Application("Google Chrome");
 *     if (chrome.exists()) {
 *         for (var w = 0; w < chrome.windows.length; w++) {
 *             var win = chrome.windows[w];
 *             for (var t = 0; t < win.tabs.length; t++) {
 *                 var tab = win.tabs[t];
 *                 var tabTitle = "";
 *                 try { tabTitle = tab.title(); } catch(e) {}
 *                 // Match only the runner window to avoid sending script execution to the main editor window
 *                 if (tabTitle && tabTitle.indexOf("Cables Apple Shortcuts Runner") !== -1 && tabTitle.indexOf(uuid) !== -1) {
 *                     // Set input value and click the element to bypass JXA sandboxing restrictions
 *                     var js = "var el = document.getElementById('ShortcutsResults'); if (el) { el.value = " + JSON.stringify(JSON.stringify(result)) + "; el.click(); }";
 *                     tab.execute({ javascript: js });
 *                     success = true;
 *                     break;
 *                 }
 *             }
 *             if (success) break;
 *         }
 *     }
 * 
 *     // Target Safari
 *     if (!success) {
 *         var safari = Application("Safari");
 *         if (safari.exists()) {
 *             for (var w = 0; w < safari.windows.length; w++) {
 *                 var win = safari.windows[w];
 *                 for (var t = 0; t < win.tabs.length; t++) {
 *                     var tab = win.tabs[t];
 *                     var tabName = "";
 *                     try { tabName = tab.name(); } catch(e) {}
 *                     // Match only the runner window to avoid sending script execution to the main editor window
 *                     if (tabName && tabName.indexOf("Cables Apple Shortcuts Runner") !== -1 && tabName.indexOf(uuid) !== -1) {
 *                         var js = "var el = document.getElementById('ShortcutsResults'); if (el) { el.value = " + JSON.stringify(JSON.stringify(result)) + "; el.click(); }";
 *                         safari.doJavaScript(js, { in: tab });
 *                         success = true;
 *                         break;
 *                     }
 *                 }
 *                 if (success) break;
 *             }
 *         }
 *     }
 * 
 *     return success ? "Result successfully sent" : "Runner tab with UUID not found";
 * }
 * ------------------------------------------------------------------------------------------------
 */

// Define Inputs
const inUUID = op.inString("UUID", "");
const inShortcutName = op.inString("Shortcut Name", "");
const inData = op.inObject("Data");
const inOpen = op.inTriggerButton("Open Window");
const inClose = op.inTriggerButton("Close Window");
const inChannelName = op.inString("Broadcast Channel Name", "shortcuts-channel");
const inSend = op.inTriggerButton("Send Shortcut Request");

// Define Outputs
const outResult = op.outObject("Shortcut Result Object", null);
const outOnResult = op.outTrigger("On Result Received");
const outWindowStatus = op.outString("Window Status", "closed");
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Settings", [inUUID, inShortcutName, inData, inChannelName]);
op.setPortGroup("Controls", [inOpen, inClose, inSend]);

let bc = null;
let childWindow = null;
let pollTimer = null;

// Helper to generate UUID
function generateUUID() {
    return crypto.randomUUID();
}

// Auto-initialize UUID if empty
function getUuid() {
    let uuid = inUUID.get();
    if (!uuid) {
        uuid = generateUUID();
        inUUID.set(uuid);
    }
    return uuid;
}

// Trigger initialization of UUID on op load
getUuid();

// Runner Window HTML template with premium aesthetic
const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Cables Apple Shortcuts Runner [UUID_PLACEHOLDER]</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090d16;
            --card-bg: rgba(17, 25, 40, 0.75);
            --border: rgba(255, 255, 255, 0.08);
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #6366f1;
            --accent-glow: rgba(99, 102, 241, 0.15);
            --success: #10b981;
            --success-glow: rgba(16, 185, 129, 0.15);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            background-image: radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 60%);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow: hidden;
        }
        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            width: 100%;
            max-width: 500px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            transition: border-color 0.3s;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .title { font-size: 18px; font-weight: 600; }
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            margin-right: 8px;
            box-shadow: 0 0 8px var(--success);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .info-row {
            margin-bottom: 16px;
        }
        .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 4px;
        }
        .value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            background: rgba(0, 0, 0, 0.2);
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
            word-break: break-all;
        }
        .log-section {
            margin-top: 24px;
            border-top: 1px solid var(--border);
            padding-top: 20px;
        }
        .log-title { font-size: 14px; font-weight: 500; margin-bottom: 10px; color: var(--text-muted); }
        .log-list {
            list-style: none;
            max-height: 120px;
            overflow-y: auto;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
        }
        .log-item {
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            display: flex;
            justify-content: space-between;
            color: var(--text-muted);
        }
        .log-item.active { color: var(--accent); }
        .jxa-instructions {
            margin-top: 16px;
            font-size: 11px;
            color: var(--text-muted);
            line-height: 1.4;
            background: rgba(99, 102, 241, 0.05);
            padding: 10px;
            border-radius: 8px;
            border: 1px solid rgba(99, 102, 241, 0.1);
        }
    </style>
    <script>
        // Placeholders replaced by parent op
        const UUID = "UUID_PLACEHOLDER";
        const BC_NAME = "BC_NAME_PLACEHOLDER";

        // Set UUID in location hash
        window.location.hash = UUID;

        const bc = new BroadcastChannel(BC_NAME);
        let logList = null;
        let statusText = null;

        window.addEventListener("DOMContentLoaded", () => {
            document.getElementById("uuid-display").textContent = UUID;
            document.getElementById("bc-display").textContent = BC_NAME;
            logList = document.getElementById("log-list");
            statusText = document.getElementById("status-text");

            // Attach event listener for the hidden input communication channel
            const resultInput = document.getElementById("ShortcutsResults");
            if (resultInput) {
                resultInput.addEventListener("click", () => {
                    try {
                        const rawVal = resultInput.value;
                        if (!rawVal) return;
                        const result = JSON.parse(rawVal);
                        
                        addLog("Result received via ShortcutsResults element", false);
                        processResult(result);
                    } catch (e) {
                        console.error("Failed to parse JXA result from input element:", e);
                        addLog("Parsing error: " + e.message, true);
                    }
                });
            }

            // Notify parent that the child window runner is fully loaded and ready
            bc.postMessage({ type: "ready", uuid: UUID });
            addLog("Shortcuts runner initialized", false);
        });

        function addLog(message, isActive) {
            if (!logList) return;
            const li = document.createElement("li");
            li.className = "log-item" + (isActive ? " active" : "");
            const time = new Date().toLocaleTimeString();
            li.innerHTML = \`<span>\${message}</span><span style="color: var(--text-muted); opacity: 0.6;">\${time}</span>\`;
            if (logList.children.length === 1 && logList.children[0].textContent.includes("Waiting")) {
                logList.innerHTML = "";
            }
            logList.insertBefore(li, logList.firstChild);
            if (logList.children.length > 10) {
                logList.removeChild(logList.lastChild);
            }
        }

        bc.onmessage = (event) => {
            const data = event.data;
            if (!data) return;

            if (data.type === "ping") {
                bc.postMessage({ type: "pong", uuid: UUID });
            } else if (data.type === "run-shortcut" && data.uuid === UUID) {
                const shortcutName = data.shortcutName;
                const payload = data.payload;

                if (statusText) {
                    statusText.textContent = "Triggering...";
                }
                const dot = document.querySelector(".status-dot");
                if (dot) {
                    dot.style.backgroundColor = "var(--accent)";
                    dot.style.boxShadow = "0 0 8px var(--accent)";
                }
                
                addLog(\`Running "\${shortcutName}"\`, true);
                runShortcut(shortcutName, payload);
            }
        };

        function runShortcut(name, payload) {
            try {
                const url = "shortcuts://run-shortcut?name=" + encodeURIComponent(name) + "&input=" + encodeURIComponent(JSON.stringify(payload));
                
                // Create a temporary hidden anchor link to trigger the shortcuts:// protocol
                const link = document.createElement("a");
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                addLog("Shortcut protocol triggered", false);

                // Reset status indicator back to ready after a short delay
                setTimeout(() => {
                    if (statusText) {
                        statusText.textContent = "Ready";
                    }
                    const dot = document.querySelector(".status-dot");
                    if (dot) {
                        dot.style.backgroundColor = "var(--success)";
                        dot.style.boxShadow = "0 0 8px var(--success)";
                    }
                }, 2000);
            } catch (err) {
                addLog("Error: " + err.message);
                if (statusText) {
                    statusText.textContent = "Error";
                }
                bc.postMessage({ type: "error", uuid: UUID, error: err.message });
            }
        }

        function processResult(result) {
            // 1. Post back via BroadcastChannel
            bc.postMessage({
                type: "result",
                uuid: UUID,
                result: result
            });

            // 2. Set variable in parent window via CABLES patch API
            try {
                if (window.opener && window.opener.CABLES && window.opener.CABLES.patch) {
                    window.opener.CABLES.patch.setVariable("ShortCutsResult", {
                        uuid: UUID,
                        result: result
                    });
                }
            } catch (e) {
                console.warn("Failed to set CABLES patch variable directly:", e);
            }
        }

        // Global callback for JXA injection (direct JS fallback support)
        window.receiveJxaResult = function(result) {
            addLog("Result received from JXA via receiveJxaResult", false);
            const input = document.getElementById("ShortcutsResults");
            if (input) {
                input.value = JSON.stringify(result);
            }
            processResult(result);
        };
    </script>
</head>
<body>
    <!-- Hidden input element used to receive data from JXA -->
    <input type="text" id="ShortcutsResults" style="display: none;" />

    <div class="card">
        <div class="header">
            <div class="title">Shortcuts Runner</div>
            <div class="status-badge">
                <div class="status-dot"></div>
                <span id="status-text">Ready</span>
            </div>
        </div>

        <div class="info-row">
            <div class="label">Runner Window UUID</div>
            <div class="value" id="uuid-display">Loading...</div>
        </div>

        <div class="info-row">
            <div class="label">Broadcast Channel</div>
            <div class="value" id="bc-display">Loading...</div>
        </div>

        <div class="jxa-instructions">
            <strong>JXA Setup Reminder:</strong> Ensure your browser has <em>Allow JavaScript from AppleEvents</em> checked in the Develop/Developer menu, so JXA can execute scripts inside this window.
        </div>

        <div class="log-section">
            <div class="log-title">Activity Log</div>
            <ul class="log-list" id="log-list">
                <li class="log-item">Waiting for first request...</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

function handleResult(result) {
    outResult.set(result);
    outOnResult.trigger();
}

function initBroadcastChannel() {
    if (bc) {
        bc.close();
        bc = null;
    }

    const cName = inChannelName.get();
    if (!cName) return;

    bc = new BroadcastChannel(cName);
    bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        // Verify that this message belongs to our UUID
        const currentUuid = getUuid();
        if (data.uuid !== currentUuid) return;

        if (data.type === "ready") {
            op.log("[Shortcuts] Child window runner ready.");
            outError.set("");
        } else if (data.type === "result") {
            op.log("[Shortcuts] Result received via BroadcastChannel for UUID:", currentUuid);
            handleResult(data.result);
        } else if (data.type === "error") {
            op.logError("[Shortcuts] Error in child window:", data.error);
            outError.set(data.error);
        }
    };
}

inChannelName.onChange = initBroadcastChannel;

inOpen.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const cName = inChannelName.get() || "shortcuts-channel";
    const uuid = getUuid();

    const w = 550;
    const h = 550;
    const x = (screen.width - w) / 2;
    const y = (screen.height - h) / 2;

    const features = `width=${w},height=${h},left=${x},top=${y},location=no,toolbar=no,menubar=no,status=no,popup=yes,scrollbars=no,resizable=yes`;

    childWindow = window.open("about:blank", `shortcuts_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup blocked! Allow popups to open the shortcuts runner window.");
        outWindowStatus.set("closed");
        return;
    }

    outError.set("");
    outWindowStatus.set("open");

    // Write template code with channel name and UUID substituted
    const doc = childWindow.document;
    doc.open();

    const customizedTemplate = templateHtml
        .replaceAll("UUID_PLACEHOLDER", uuid)
        .replaceAll("BC_NAME_PLACEHOLDER", cName);

    doc.write(customizedTemplate);
    doc.close();

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(pollTimer);
            pollTimer = null;
            outWindowStatus.set("closed");
            childWindow = null;
        }
    }, 500);
};

inClose.onTriggered = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
        outWindowStatus.set("closed");
    }
};

inSend.onTriggered = () => {
    if (!childWindow || childWindow.closed) {
        outError.set("Runner window is not open. Click 'Open Window' first.");
        return;
    }

    const shortcutName = inShortcutName.get();
    if (!shortcutName) {
        outError.set("Shortcut name is empty.");
        return;
    }

    const uuid = getUuid();
    const dataObj = inData.get() || {};

    const payload = {
        uuid: uuid,
        data: dataObj
    };

    if (bc) {
        bc.postMessage({
            type: "run-shortcut",
            uuid: uuid,
            shortcutName: shortcutName,
            payload: payload
        });
        outError.set("");
    } else {
        outError.set("Broadcast Channel is not initialized.");
    }
};

// Monitor the Cables patch variable ShortCutsResult
const handleVariableChange = (name, value) => {
    if (name === "ShortCutsResult") {
        if (value && value.uuid === getUuid()) {
            op.log("[Shortcuts] Result received via Cables patch variable.");
            handleResult(value.result);
        }
    }
};

if (op.patch && typeof op.patch.on === "function") {
    op.patch.on("variableChanged", handleVariableChange);
}

// Initialize Broadcast Channel on load
initBroadcastChannel();

op.onDelete = () => {
    if (pollTimer) {
        clearInterval(pollTimer);
    }
    if (bc) {
        bc.close();
    }
    if (childWindow) {
        childWindow.close();
    }
    if (op.patch && typeof op.patch.off === "function") {
        op.patch.off("variableChanged", handleVariableChange);
    }
};
