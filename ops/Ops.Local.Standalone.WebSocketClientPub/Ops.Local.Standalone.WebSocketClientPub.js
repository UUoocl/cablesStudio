const
    inConnection = op.inObject("Client Connection"),
    inChannel = op.inString("Channel", "message"),
    inData = op.inObject("Data"),
    inPublish = op.inTriggerButton("Publish"),
    inTargetClientId = op.inString("Target Client ID", ""),
    inSendToAllClients = op.inBool("Send to All Clients", false),
    inSendToAllChannels = op.inBool("Send to All Channels", false),
    inRetain = op.inBool("Retain", false),

    outPublished = op.outTrigger("On Published"),
    outSuccess = op.outBoolNum("Success", false);

inPublish.onTriggered = () =>
{
    const connObj = inConnection.get();
    const client = connObj && (connObj.client || connObj.broker || connObj);

    if (!client || typeof client.publish !== "function")
    {
        outSuccess.set(false);
        return;
    }

    const channel = inChannel.get() || "message";
    const data = inData.get();
    const targetClientId = inTargetClientId.get() ? inTargetClientId.get().trim() : null;
    const sendToAllClients = inSendToAllClients.get();
    const sendToAllChannels = inSendToAllChannels.get();
    const retain = inRetain.get();

    try
    {
        const success = client.publish(channel, data, {
            "targetClientId": targetClientId,
            "sendToAllClients": sendToAllClients,
            "sendToAllChannels": sendToAllChannels,
            "retain": retain
        });

        outSuccess.set(Boolean(success));
        if (success)
        {
            outPublished.trigger();
        }
    }
    catch (e)
    {
        op.logWarn("[WebSocketClientPub] Error:", e);
        outSuccess.set(false);
    }
};
