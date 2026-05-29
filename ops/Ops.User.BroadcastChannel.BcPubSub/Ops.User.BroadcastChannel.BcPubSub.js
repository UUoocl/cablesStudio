const
    channelName = op.inString("Channel Name", "defaultChannel"),
    inData = op.inObject("data"),

    outDraw = op.outTrigger("On Draw"),
    outReady = op.outTrigger("On Ready"),
    outMessage = op.outObject("Message Received"),
    outMessageTrigger = op.outTrigger("On Message");

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
            return;
        }
        if (event.data && event.data.type === 'ready') {
            outReady.trigger();
            return;
        }
        outMessage.setRef(event.data);
        outMessageTrigger.trigger();
    };
}

channelName.onChange = initChannels;

function broadcastData() {
    if (!subChannel) return;

    const payload = inData.get();
    if (!payload) return;

    try {
        subChannel.postMessage(payload);
    } catch (e) {
        op.warn("Failed to broadcast message: ", e);
    }
}

inData.onChange = broadcastData;

initChannels();

op.onDelete = () => {
    if (pubChannel) pubChannel.close();
    if (subChannel) subChannel.close();
};
