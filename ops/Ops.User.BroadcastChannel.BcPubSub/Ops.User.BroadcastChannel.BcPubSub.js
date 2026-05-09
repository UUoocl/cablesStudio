const
    channelName = op.inString("Channel Name", "defaultChannel"),
    inString = op.inString("String", ""),
    inObject = op.inObject("Object"),
    inArray = op.inArray("Array"),
    inNumber = op.inValue("Number", 0),
    inBoolean = op.inBool("Boolean", false),
    inBase64 = op.inString("Base64", ""),
    outMessage = op.outObject("Message Received");

let pubChannel = null;
let subChannel = null;

function initChannels() {
    // Close existing channels
    if (pubChannel) {
        pubChannel.close();
        pubChannel = null;
    }
    if (subChannel) {
        subChannel.close();
        subChannel = null;
    }

    const cName = channelName.get();
    if (!cName) return;

    pubChannel = new BroadcastChannel('pub-' + cName);
    subChannel = new BroadcastChannel('sub-' + cName);

    // Listen for messages on pub channel
    pubChannel.onmessage = (event) => {
        outMessage.setRef(event.data);
    };
}

channelName.onChange = initChannels;

function broadcastData() {
    if (!subChannel) return;

    const bundledData = {
        string: inString.get(),
        object: inObject.get(),
        array: inArray.get(),
        number: inNumber.get(),
        boolean: inBoolean.get(),
        base64: inBase64.get()
    };

    try {
        subChannel.postMessage(bundledData);
    } catch (e) {
        op.warn("Failed to broadcast message: ", e);
    }
}

// Trigger broadcast on any input change
inString.onChange = broadcastData;
inObject.onChange = broadcastData;
inArray.onChange = broadcastData;
inNumber.onChange = broadcastData;
inBoolean.onChange = broadcastData;
inBase64.onChange = broadcastData;

// Initial setup
initChannels();

// Cleanup on operator delete
op.onDelete = () => {
    if (pubChannel) pubChannel.close();
    if (subChannel) subChannel.close();
};
