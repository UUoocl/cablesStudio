const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    inType = op.inString("Request Type", ""),
    inData = op.inObject("Request Data", null),
    inCall = op.inTriggerButton("Call"),
    
    outSuccess = op.outBoolNum("Success"),
    outResponse = op.outObject("Response"),
    outError = op.outString("Error");

inCall.onTriggered = () => {
    const obs = inObs.get();
    const requestType = inType.get();
    const requestData = inData.get() || {};

    if (!obs || typeof obs.call !== 'function') {
        outError.set("No valid OBS connection provided");
        outSuccess.set(false);
        return;
    }

    if (!requestType) {
        outError.set("No Request Type specified");
        outSuccess.set(false);
        return;
    }

    obs.call(requestType, requestData)
        .then((response) => {
            outSuccess.set(true);
            outResponse.set(response);
            outError.set("");
        })
        .catch((err) => {
            op.logError("OBS Call Error:", err);
            outSuccess.set(false);
            outResponse.set(null);
            outError.set(err.message || "Request failed");
        });
};
