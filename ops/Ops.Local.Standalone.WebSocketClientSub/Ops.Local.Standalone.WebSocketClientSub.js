const
    inConnection = op.inObject("Client Connection"),
    inChannel = op.inString("Channel", "message"),
    inActive = op.inBool("Active", true),
    inAutoParse = op.inBool("Auto Parse JSON", true),

    outMessage = op.outTrigger("On Message"),
    outChannel = op.outString("Message Channel"),
    outData = op.outObject("Data"),
    outRaw = op.outString("Raw Message"),
    outSender = op.outString("Sender Client ID"),
    outTotalReceived = op.outNumber("Total Received", 0),
    outTimestamp = op.outNumber("Timestamp", 0);

let currentClient = null;
let subscribedChannel = null;
let messageCount = 0;

const handleMessage = (msgObj) =>
{
    if (!inActive.get()) return;
    if (!msgObj) return;

    const filterChannel = inChannel.get() || "*";
    const msgChannel = msgObj.channel || "";

    // Wildcard '*' filter, broadcast '*' channel, or exact channel match
    if (filterChannel !== "*" && msgChannel !== "*" && filterChannel !== msgChannel) return;

    messageCount++;
    outTotalReceived.set(messageCount);

    outChannel.set(msgChannel);
    outSender.set(msgObj.sender || "");
    outTimestamp.set(msgObj.timestamp || Date.now());

    let payload = msgObj.data;
    if (typeof payload === "string" && inAutoParse.get())
    {
        try
        {
            payload = JSON.parse(payload);
        }
        catch (e) {}
    }

    outData.set(payload);
    outRaw.set(typeof msgObj.data === "object" ? JSON.stringify(msgObj.data) : String(msgObj.data));

    outMessage.trigger();
};

function detachClient()
{
    if (currentClient)
    {
        if (subscribedChannel && typeof currentClient.unsubscribe === "function")
        {
            currentClient.unsubscribe(subscribedChannel);
        }
        if (typeof currentClient.off === "function")
        {
            currentClient.off("message", handleMessage);
        }
    }
    currentClient = null;
    subscribedChannel = null;
}

function updateSubscription()
{
    const connObj = inConnection.get();
    const client = connObj && (connObj.client || connObj.broker || connObj);
    const newChannel = inChannel.get();

    if (currentClient !== client)
    {
        detachClient();
        if (client && typeof client.on === "function")
        {
            currentClient = client;
            currentClient.on("message", handleMessage);
        }
    }

    if (currentClient && inActive.get())
    {
        if (subscribedChannel && subscribedChannel !== newChannel && typeof currentClient.unsubscribe === "function")
        {
            currentClient.unsubscribe(subscribedChannel);
        }

        if (newChannel && typeof currentClient.subscribe === "function")
        {
            currentClient.subscribe(newChannel);
            subscribedChannel = newChannel;
        }
    }
}

inConnection.onChange = updateSubscription;
inChannel.onChange = updateSubscription;
inActive.onChange = updateSubscription;

op.onDelete = () =>
{
    detachClient();
};
