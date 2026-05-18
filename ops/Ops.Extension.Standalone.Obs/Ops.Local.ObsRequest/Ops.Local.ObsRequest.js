const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    inType = op.inString("Request Type", ""),
    inData = op.inObject("Request Data", null),
    inRequest = op.inTriggerButton("Send Request"),
    
    outSuccess = op.outBoolNum("Success", false),
    outResult = op.outObject("Result", null),
    outRequestType = op.outString("Request Type Output", ""),
    outResultTrigger = op.outTrigger("On Result"),
    outError = op.outString("Error", "");

inRequest.onTriggered = async () => {
    const obs = inObs.get();
    const requestType = inType.get();
    
    // Extract requestId and params safely
    const rawData = inData.get() || {};
    let requestId = rawData.requestId || null;
    let params = {};
    
    // Detect if rawData is an HTTP request container (from HttpFileServer)
    const isHttpRequest = rawData.method && rawData.headers;
    if (isHttpRequest) {
        // Extract from body if possible
        const body = rawData.body || {};
        requestId = body.requestId || rawData.requestId || null;
        if (body.requestData && typeof body.requestData === "object") {
            params = body.requestData;
        } else if (rawData.requestData && typeof rawData.requestData === "object") {
            params = rawData.requestData;
        } else if (typeof body === "object") {
            params = body;
        }
    } else {
        // Standard payload or manual parameters
        if (rawData.requestData && typeof rawData.requestData === "object" && !Array.isArray(rawData.requestData)) {
            params = rawData.requestData;
        } else {
            params = rawData;
        }
    }
    
    // Create copy and remove control/HTTP parameter pollution
    const requestData = Object.assign({}, params);
    delete requestData.requestId;
    delete requestData.requestType;
    delete requestData.type;
    delete requestData.method;
    delete requestData.url;
    delete requestData.pathname;
    delete requestData.headers;
    delete requestData.body;
    delete requestData.query;
    
    // Bulletproof JSON-serialization check to prevent Converting circular structure to JSON errors
    let cleanRequestData = {};
    try {
        cleanRequestData = JSON.parse(JSON.stringify(requestData));
    } catch (err) {
        op.logWarning("[ObsRequest] Circular reference detected in requestData, sanitizing...");
        for (const [key, val] of Object.entries(requestData)) {
            if (val !== null && typeof val === "object") {
                try {
                    cleanRequestData[key] = JSON.parse(JSON.stringify(val));
                } catch (e) {
                    op.logWarning(`[ObsRequest] Stripped circular/invalid key: ${key}`);
                }
            } else if (typeof val !== "function" && typeof val !== "symbol") {
                cleanRequestData[key] = val;
            }
        }
    }

    if (!obs) {
        outError.set("Not connected to OBS");
        outSuccess.set(false);
        return;
    }

    try {
        const responseData = await obs.call(requestType, cleanRequestData);
        
        // Enveloped response matches OBS WS v5 standard
        const envelope = {
            requestType: requestType,
            requestId: requestId,
            requestStatus: {
                result: true,
                code: 100
            },
            responseData: responseData
        };

        outRequestType.set(requestType + "Response");
        outResult.set(envelope);
        outSuccess.set(true);
        outError.set("");
        outResultTrigger.trigger();
    } catch (e) {
        op.logError("OBS Request Error: ", e);
        
        const envelope = {
            requestType: requestType,
            requestId: requestId,
            requestStatus: {
                result: false,
                code: 0,
                comment: e.message || "Unknown error"
            },
            responseData: null
        };

        outRequestType.set(requestType + "Response");
        outResult.set(envelope);
        outError.set(e.message || "Unknown error");
        outSuccess.set(false);
        outResultTrigger.trigger(); // Trigger anyway so SSE always gets a status update
    }
};
