const
    inHttpTrigger = op.inTrigger("Trigger"),
    inHttpData = op.inObject("Object"),
    
    outCommand = op.outTrigger("Next"),
    outPayload = op.outObject("Result");

inHttpTrigger.onTriggered = () => {
    const req = inHttpData.get();
    if (!req) return;
    
    // Pass the entire request object so nested Object Parsers (e.g. zrk7ntnu5 reading body.requestType) function correctly
    outPayload.set(req);
    outCommand.trigger();
};
