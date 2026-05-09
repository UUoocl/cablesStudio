const inServer = op.inObject("Server Instance");
const inSend = op.inTriggerButton("Send Message");
const inChannel = op.inString("Channel Name", "broadcast");
const inMessage = op.inObject("Message To Send");

const outSent = op.outTrigger("Message Sent");
const outError = op.outString("Error");

inSend.onTriggered = () => {
    const server = inServer.get();
    if (!server) {
        outError.set("No Server Instance connected");
        return;
    }

    if (!server.websocketServer) {
        outError.set("Connected Server has no WebSocket support initialized");
        return;
    }

    const channel = inChannel.get() || "broadcast";
    let msgData = inMessage.get();

    if (msgData === null || msgData === undefined) {
        outError.set("No message to send");
        return;
    }

    let payload = null;
    try {
        // Always encapsulate in an object with the channel name
        payload = JSON.stringify({ channel: channel, data: msgData });
    } catch (e) {
        outError.set("Could not stringify message: " + e.message);
        return;
    }

    try {
        let sentCount = 0;
        server.websocketServer.clients.forEach(client => {
            // In the 'ws' module, readyState 1 is OPEN
            if (client.readyState === 1) {
                client.send(payload);
                sentCount++;
            }
        });
        outError.set("");
        outSent.trigger();
    } catch (e) {
        outError.set("Error sending message: " + e.message);
    }
};
