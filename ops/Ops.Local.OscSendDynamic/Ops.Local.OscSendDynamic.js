const osc = op.require("osc");

const
    inConn = op.inObject("OSC Connection"),
    inIp = op.inString("Net Address", "127.0.0.1"),
    inPort = op.inInt("Port", 9000),
    inAddress = op.inString("OSC Address", "/1/fader1"),
    inArgs = op.inArray("Arguments"),
    inPayload = op.inObject("Payload Object"),
    inSend = op.inTriggerButton("Send"),
    inAutoSend = op.inBool("Auto Send on Payload", true),
    outSent = op.outTrigger("Sent"),
    outDebug = op.outString("Debug Info");

op.toWorkPortsNeedToBeLinked(inConn);

const mapArg = (arg) => {
    // If it's already an osc.js compatible object {type, value}
    if (typeof arg === 'object' && arg !== null && arg.type && arg.value !== undefined) {
        return arg;
    }
    
    // Auto-map basic types
    if (typeof arg === 'number') {
        // Many OSC clients (like TouchOSC) prefer floats for control values
        if (Number.isInteger(arg) && (arg < 0 || arg > 1)) return { type: 'i', value: arg };
        return { type: 'f', value: arg };
    }
    if (typeof arg === 'string') return { type: 's', value: arg };
    if (typeof arg === 'boolean') return { type: arg ? 'T' : 'F', value: arg };
    
    return { type: 's', value: String(arg) };
};

const send = () => {
    const udpPort = inConn.get();
    if (!udpPort) {
        outDebug.set("Error: No OSC Connection linked");
        return;
    }

    let address = inAddress.get();
    let args = inArgs.get() || [];
    
    // Override with payload data if available
    const payload = inPayload.get();
    if (payload) {
        // Direct format: { address, args }
        if (payload.address) address = payload.address;
        if (payload.args) args = payload.args;
        
        // Nested format (typical for SocketCluster objects): { topic, payload: { address, args } }
        if (payload.payload && payload.payload.address) {
            address = payload.payload.address;
            args = payload.payload.args || [];
        }
    }

    if (!address) {
        outDebug.set("Error: No OSC Address specified");
        return;
    }

    // Ensure args is an array
    if (args === null || args === undefined) args = [];
    const rawArgs = Array.isArray(args) ? args : [args];
    
    // Map to osc.js format
    const oscArgs = rawArgs.map(mapArg);

    try {
        const targetIp = inIp.get();
        const targetPort = inPort.get();
        
        udpPort.send({
            address: address,
            args: oscArgs
        }, targetIp, targetPort);
        
        outSent.trigger();
        
        const timestamp = new Date().toLocaleTimeString();
        outDebug.set(`[${timestamp}] Sent to ${targetIp}:${targetPort}\nAddr: ${address}\nArgs: ${JSON.stringify(oscArgs)}`);
        
    } catch (e) {
        const errorMsg = "OscSend Error: " + (e.message || String(e));
        op.logError(errorMsg);
        outDebug.set(errorMsg);
    }
};

inSend.onTriggered = send;

inPayload.onChange = () => {
    if (inAutoSend.get() && inPayload.get()) {
        send();
    }
};
