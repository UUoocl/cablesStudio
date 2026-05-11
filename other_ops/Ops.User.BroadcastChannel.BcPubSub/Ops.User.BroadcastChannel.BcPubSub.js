const
    channelName = op.inString("Channel Name", "defaultChannel"),
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

    console.log(`[BcPubSub] Initializing. Parent Origin: ${window.location.origin}`);
    console.log(`[BcPubSub] Channels: Listening on "${pubName}", Sending on "${subName}"`);

    pubChannel = new BroadcastChannel(pubName);
    subChannel = new BroadcastChannel(subName);

    pubChannel.onmessage = (event) => {
        console.log(`[BcPubSub] Received from "${pubName}":`, event.data);
        outMessage.setRef(event.data);
    };
}

channelName.onChange = initChannels;

function broadcastData() {
    if (!subChannel) {
        console.warn("[BcPubSub] Cannot broadcast: subChannel is null");
        return;
    }

    const payload = {};
    const allPorts = op.portsIn;
    
    for (let i = 0; i < allPorts.length; i++) {
        const p = allPorts[i];
        if (p.name === "Channel Name") continue;
        payload[p.name] = p.get();
    }

    const cName = channelName.get();
    console.log(`[BcPubSub] Broadcasting to "sub-${cName}":`, payload);

    try {
        subChannel.postMessage(payload);
    } catch (e) {
        op.warn("Failed to broadcast message: ", e);
    }
}

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
