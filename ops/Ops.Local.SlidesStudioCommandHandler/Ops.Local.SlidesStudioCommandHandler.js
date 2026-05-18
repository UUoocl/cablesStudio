const
    inHttpTrigger = op.inTrigger("On HTTP Request"),
    inHttpData = op.inObject("HTTP Request Data"),
    
    outCommand = op.outTrigger("On Command"),
    outPayload = op.outObject("Payload"),
    outType = op.outString("Command Type");

inHttpTrigger.onTriggered = () => {
    const req = inHttpData.get();
    if (!req || !req.body) return;
    
    const data = req.body;
    
    // Route based on type
    if (data.type) outType.set(data.type);
    
    outPayload.set(data);
    outCommand.trigger();
    
    // If the request has a response object, we could potentially use it
    // but the HttpFileServer already sends a default response after 100ms.
};
