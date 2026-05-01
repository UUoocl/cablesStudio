const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    inType = op.inString("Request Type", ""),
    inData = op.inObject("Request Data", null),
    inRequest = op.inTriggerButton("Send Request"),
    
    outSuccess = op.outBoolNum("Success", false),
    outResult = op.outObject("Result", null),
    outError = op.outString("Error", "");

inRequest.onTriggered = async () => {
    const obs = inObs.get();
    if (!obs) {
        outError.set("Not connected to OBS");
        outSuccess.set(false);
        return;
    }

    try {
        const response = await obs.call(inType.get(), inData.get() || {});
        outResult.set(response);
        outSuccess.set(true);
        outError.set("");
    } catch (e) {
        op.logError("OBS Request Error: ", e);
        outError.set(e.message || "Unknown error");
        outSuccess.set(false);
    }
};
