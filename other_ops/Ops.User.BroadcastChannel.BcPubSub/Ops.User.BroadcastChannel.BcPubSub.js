const
    channelName = op.inString("Channel Name", "defaultChannel"),
    // Add your input ports here:
    inText = op.inString("Text", "Hello World"),
    inValue = op.inValue("Value", 0),

    outDraw = op.outTrigger("On Draw"),
    outReady = op.outTrigger("On Ready"),
    outMessage = op.outObject("Message Received");

let pubChannel = null;
let subChannel = null;

function initChannels() {
    if (pubChannel) { pubChannel.close(); pubChannel = null; }
    if (subChannel) { subChannel.close(); subChannel = null; }

    const cName = channelName.get();
    if (!cName) return;

    const pubName = 'pub-' + cName;
    const subName = 'sub-' + cName;

    console.log(`[BcPubSub] Initializing. Channels: Listening on "${pubName}", Sending on "${subName}"`);

    pubChannel = new BroadcastChannel(pubName);
    subChannel = new BroadcastChannel(subName);

    pubChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'draw') {
            outDraw.trigger();
        }
        if (event.data && event.data.type === 'ready') {
            outReady.trigger();
        }
        outMessage.setRef(event.data);
    };
}

channelName.onChange = initChannels;

function broadcastData() {
    if (!subChannel) return;

    const payload = {};
    const allPorts = op.portsIn;
    
    for (let i = 0; i < allPorts.length; i++) {
        const p = allPorts[i];
        if (p.name === "Channel Name") continue;
        payload[p.name] = p.get();
    }

    try {
        subChannel.postMessage(payload);
    } catch (e) {
        op.warn("Failed to broadcast message: ", e);
    }
}

// Bind broadcast to all input ports except Channel Name
op.onPortAdded = (p) => {
    if (p.name !== "Channel Name") {
        p.onChange = broadcastData;
    }
};

op.portsIn.forEach(p => {
    if (p.name !== "Channel Name") {
        p.onChange = broadcastData;
    }
});

initChannels();

op.onDelete = () => {
    if (pubChannel) pubChannel.close();
    if (subChannel) subChannel.close();
};





initChannels();

op.onDelete = () => {
    if (pubChannel) pubChannel.close();
    if (subChannel) subChannel.close();
};
