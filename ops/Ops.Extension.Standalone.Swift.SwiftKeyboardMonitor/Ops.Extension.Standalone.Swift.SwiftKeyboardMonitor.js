/**
 * Ops.Extension.Standalone.Swift.SwiftKeyboardMonitor
 * Operator that connects to the native macOS backend server via WebSockets
 * to stream high-frequency global keyboard events and hotkey combos.
 */

const
    inActive = op.inBool("Active", false),
    inHost = op.inString("Hostname", "127.0.0.1"),
    inPort = op.inInt("Port", 8080),
    
    outPress = op.outTrigger("On Press"),
    outRelease = op.outTrigger("On Release"),
    outCombo = op.outString("Combo", ""),
    outKey = op.outString("Key", ""),
    outModifiers = op.outString("Modifiers", "");

let ws = null;
let reconnectTimeout = null;

function closeSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (ws) {
        op.log("[SwiftKeyboardMonitor] Closing WebSocket connection.");
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) {
            // Ignore close errors
        }
        ws = null;
    }
}

function connectSocket() {
    closeSocket();
    
    if (!inActive.get()) return;
    
    const host = inHost.get() || "127.0.0.1";
    const port = inPort.get() || 8080;
    const url = `ws://${host}:${port}/events`;
    
    op.log(`[SwiftKeyboardMonitor] Connecting to telemetry WebSocket at ${url}...`);
    
    try {
        ws = new WebSocket(url);
        
        ws.onopen = () => {
            op.log("[SwiftKeyboardMonitor] Telemetry WebSocket connection established.");
        };
        
        ws.onmessage = (event) => {
            if (!event || !event.data) return;
            
            try {
                const msg = JSON.parse(event.data);
                
                if (msg.type === "keyboardPress") {
                    outCombo.set("");
                    outKey.set("");
                    outModifiers.set("");
                    
                    outCombo.set(msg.data.combo || "");
                    outKey.set(msg.data.key || "");
                    outModifiers.set(msg.data.modifiers || "");
                    outPress.trigger();
                } else if (msg.type === "keyboardRelease") {
                    outCombo.set("");
                    outKey.set("");
                    outModifiers.set("");
                    
                    outCombo.set(msg.data.combo || "");
                    outKey.set(msg.data.key || "");
                    outModifiers.set(msg.data.modifiers || "");
                    outRelease.trigger();
                }
            } catch (e) {
                // Ignore parse errors from malformed frames
            }
        };
        
        ws.onerror = (err) => {
            op.logWarn("[SwiftKeyboardMonitor] Telemetry WebSocket error encountered.");
        };
        
        ws.onclose = (event) => {
            op.log("[SwiftKeyboardMonitor] Telemetry WebSocket connection closed.");
            ws = null;
            
            // Proactive auto-reconnect logic if still active
            if (inActive.get()) {
                op.log("[SwiftKeyboardMonitor] Attempting automatic reconnection in 2 seconds...");
                reconnectTimeout = setTimeout(() => {
                    connectSocket();
                }, 2000);
            }
        };
        
    } catch (e) {
        op.logError("[SwiftKeyboardMonitor] Failed to instantiate WebSocket: " + String(e));
        if (inActive.get()) {
            reconnectTimeout = setTimeout(() => {
                connectSocket();
            }, 3000);
        }
    }
}

inActive.onChange = () => {
    if (inActive.get()) {
        connectSocket();
    } else {
        closeSocket();
    }
};

inHost.onChange = () => {
    if (inActive.get()) {
        connectSocket();
    }
};

inPort.onChange = () => {
    if (inActive.get()) {
        connectSocket();
    }
};

op.onDelete = () => {
    closeSocket();
};
