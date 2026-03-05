const osc = op.require("osc");

const
    inSocket = op.inObject("SC Socket", null, "socketcluster"),
    inTopic = op.inString("SC Topic Filter", "osc_send"),
    inOscConn = op.inObject("OSC Connection"),
    inIp = op.inString("OSC Target IP", "127.0.0.1"),
    inPort = op.inInt("OSC Target Port", 9000),
    inActive = op.inBool("Active", true),
    outReceived = op.outTrigger("Received & Sent"),
    outLastMsg = op.outObject("Last Message"),
    outDebug = op.outString("Debug Info");

let currentChannel = null;

inSocket.onChange = 
inTopic.onChange = 
inActive.onChange = setupSubscription;

function setupSubscription() {
    const socket = inSocket.get();
    const active = inActive.get();
    
    // Cleanup old subscription
    if (currentChannel) {
        currentChannel.close();
        currentChannel = null;
    }

    if (!active || !socket || !socket.channelName) {
        outDebug.set("Waiting for valid SC Socket and Channel...");
        return;
    }

    const channelPath = socket.channelName + "/objects";
    currentChannel = socket.subscribe(channelPath);
    outDebug.set(`Subscribed to: ${channelPath} (Topic: ${inTopic.get()})`);
    
    (async () => {
        try {
            for await (let data of currentChannel) {
                handleMessage(data);
            }
        } catch (e) {
            // Subscription might have been closed
        }
    })();
}

function handleMessage(data) {
    if (!data || data.topic !== inTopic.get()) return;
    
    const payload = data.payload;
    if (!payload || !payload.address) {
        outDebug.set(`Ignored message: invalid payload or missing address`);
        return;
    }

    const udpPort = inOscConn.get();
    if (!udpPort) {
        outDebug.set(`Error: No OSC Connection provided`);
        return;
    }

    const address = payload.address;
    const rawArgs = payload.args || [];

    // Map args to osc.js format
    const oscArgs = rawArgs.map(arg => {
        if (typeof arg === 'object' && arg !== null && arg.type && arg.value !== undefined) {
            return arg;
        }
        
        let type = 'f';
        if (typeof arg === 'string') type = 's';
        // Note: TouchOSC and many others often prefer floats even for 0/1 values
        else if (Number.isInteger(arg)) type = 'i';
        else if (typeof arg === 'boolean') type = arg ? 'T' : 'F';
        
        return { type, value: arg };
    });

    const packet = {
        address: address,
        args: oscArgs
    };

    try {
        const targetIp = inIp.get();
        const targetPort = inPort.get();
        
        udpPort.send(packet, targetIp, targetPort);
        
        outLastMsg.set(packet);
        outReceived.trigger();
        
        const timestamp = new Date().toLocaleTimeString();
        outDebug.set(`[${timestamp}] Sent to ${targetIp}:${targetPort}\nAddr: ${address}\nArgs: ${JSON.stringify(oscArgs)}`);
        
    } catch (e) {
        const errorMsg = "Bridge Send Error: " + (e.message || String(e));
        op.logError(errorMsg);
        outDebug.set(errorMsg);
    }
}

op.onDelete = () => {
    if (currentChannel) currentChannel.close();
};
