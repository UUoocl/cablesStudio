const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    inRate = op.inFloat("Request Rate (Hz)", 0),
    inData = op.inObject("Request Data", null),
    inRequest = op.inTriggerButton("Send Request"),
    
    outSuccess = op.outBoolNum("Success", false),
    outResult = op.outObject("Result", null),
    outRequestType = op.outString("Request Type Output", ""),
    outResultTrigger = op.outTrigger("On Result"),
    outError = op.outString("Error", "");

let pendingTransactions = [];
let sendTimeout = null;
let lastSendTime = 0;

inRequest.onTriggered = () => {
    const obs = inObs.get();
    if (!obs) {
        const rawData = inData.get() || {};
        let requestId = rawData.requestId || (rawData.body && rawData.body.requestId) || null;
        failImmediate(requestId, "Not connected to OBS");
        return;
    }

    // Extract requestId and params safely
    const rawData = inData.get() || {};
    let requestId = rawData.requestId || null;
    let params = {};
    let finalRequestType = "";
    
    // Detect if rawData is an HTTP request container (from HttpFileServer)
    const isHttpRequest = rawData.method && rawData.headers;
    let body = {};
    if (isHttpRequest) {
        // Extract from body if possible
        body = rawData.body || {};
        requestId = body.requestId || rawData.requestId || null;
        finalRequestType = body.requestType || rawData.requestType || "";
        if (body.requestData && typeof body.requestData === "object") {
            params = body.requestData;
        } else if (rawData.requestData && typeof rawData.requestData === "object") {
            params = rawData.requestData;
        } else if (typeof body === "object") {
            params = body;
        }
    } else {
        body = rawData;
        finalRequestType = rawData.requestType || "";
        // Standard payload or manual parameters
        if (rawData.requestData && typeof rawData.requestData === "object" && !Array.isArray(rawData.requestData)) {
            params = rawData.requestData;
        } else {
            params = rawData;
        }
    }
    
    // Detect if it is a batch request
    let isBatch = false;
    if (Array.isArray(params)) {
        isBatch = true;
    } else if (params && Array.isArray(params.requests)) {
        isBatch = true;
    } else if (body && Array.isArray(body.requests)) {
        isBatch = true;
    }

    // Standardize requests
    let requests = [];
    if (isBatch) {
        const rawRequests = Array.isArray(params) ? params : (params.requests || body.requests || []);
        requests = rawRequests.map(req => {
            const reqCopy = Object.assign({}, req.requestData || req || {});
            delete reqCopy.requestId;
            delete reqCopy.requestType;
            
            // Clean up using same sanitization logic
            let cleanReqData = {};
            try {
                cleanReqData = JSON.parse(JSON.stringify(reqCopy));
            } catch (err) {
                for (const [key, val] of Object.entries(reqCopy)) {
                    if (val !== null && typeof val === "object") {
                        try {
                            cleanReqData[key] = JSON.parse(JSON.stringify(val));
                        } catch (e) {}
                    } else if (typeof val !== "function" && typeof val !== "symbol") {
                        cleanReqData[key] = val;
                    }
                }
            }
            return {
                requestType: req.requestType || "",
                requestData: cleanReqData
            };
        });
    } else {
        // Validation for single request
        if (!finalRequestType) {
            const errMsg = "Your request's `requestType` may not be empty.";
            failImmediate(requestId, errMsg);
            return;
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

        requests = [{
            requestType: finalRequestType,
            requestData: cleanRequestData
        }];
    }

    const transaction = {
        requestId: requestId,
        isBatch: isBatch,
        requests: requests,
        originalRequestType: finalRequestType
    };

    pendingTransactions.push(transaction);
    scheduleSend();
};

function scheduleSend() {
    if (sendTimeout) return;
    
    const rate = inRate.get();
    if (rate <= 0) {
        sendBatch();
        return;
    }
    
    const interval = 1000 / rate;
    const elapsed = Date.now() - lastSendTime;
    const wait = Math.max(0, interval - elapsed);
    
    sendTimeout = setTimeout(sendBatch, wait);
}

async function sendBatch() {
    sendTimeout = null;
    if (pendingTransactions.length === 0) return;
    
    const obs = inObs.get();
    if (!obs) {
        const transactionsToFail = pendingTransactions.slice();
        pendingTransactions = [];
        for (const tx of transactionsToFail) {
            failTransaction(tx, "Not connected to OBS");
        }
        lastSendTime = Date.now();
        return;
    }
    
    const currentTransactions = pendingTransactions.slice();
    pendingTransactions = [];
    
    // If there is only 1 transaction, and it is a single request, run it directly via call() for maximum performance.
    if (currentTransactions.length === 1 && !currentTransactions[0].isBatch) {
        const tx = currentTransactions[0];
        const req = tx.requests[0];
        try {
            const responseData = await obs.call(req.requestType, req.requestData);
            successTransaction(tx, responseData);
        } catch (e) {
            failTransaction(tx, e.message || "Unknown error");
        }
        lastSendTime = Date.now();
        return;
    }
    
    // If there are multiple transactions or it is a batch request, compile into a single array for callBatch()
    let flatRequests = [];
    let txMapping = []; // maps flatRequests index back to transaction index
    
    currentTransactions.forEach((tx, txIndex) => {
        tx.requests.forEach((req) => {
            flatRequests.push({
                requestType: req.requestType,
                requestData: req.requestData
            });
            txMapping.push(txIndex);
        });
    });
    
    try {
        const responses = await obs.callBatch(flatRequests);
        
        // Group response results back to their transactions
        const txResults = currentTransactions.map(() => []);
        responses.forEach((resp, index) => {
            const txIndex = txMapping[index];
            txResults[txIndex].push(resp);
        });
        
        // Resolve each transaction
        currentTransactions.forEach((tx, txIndex) => {
            const results = txResults[txIndex];
            if (tx.isBatch) {
                successTransaction(tx, results);
            } else {
                const batchItem = results[0];
                if (batchItem && batchItem.requestStatus && batchItem.requestStatus.result) {
                    successTransaction(tx, batchItem.responseData);
                } else {
                    failTransaction(tx, (batchItem && batchItem.requestStatus && batchItem.requestStatus.comment) || "Batch item execution failed");
                }
            }
        });
    } catch (e) {
        op.logError("[ObsRequest] Bundled Batch Request Error: ", e);
        currentTransactions.forEach((tx) => {
            failTransaction(tx, e.message || "Unknown error");
        });
    }
    
    lastSendTime = Date.now();
}

function successTransaction(tx, responseData) {
    if (tx.isBatch) {
        const envelope = {
            requestType: "RequestBatch",
            requestId: tx.requestId,
            requestStatus: { result: true, code: 100 },
            responseData: responseData
        };
        outRequestType.set("RequestBatchResponse");
        outResult.set(envelope);
        outSuccess.set(true);
        outError.set("");
        outResultTrigger.trigger();
    } else {
        const envelope = {
            requestType: tx.originalRequestType,
            requestId: tx.requestId,
            requestStatus: { result: true, code: 100 },
            responseData: responseData
        };
        outRequestType.set(tx.originalRequestType + "Response");
        outResult.set(envelope);
        outSuccess.set(true);
        outError.set("");
        outResultTrigger.trigger();
    }
}

function failTransaction(tx, errMsg) {
    if (tx.isBatch) {
        const envelope = {
            requestType: "RequestBatch",
            requestId: tx.requestId,
            requestStatus: { result: false, code: 0, comment: errMsg },
            responseData: null
        };
        outRequestType.set("RequestBatchResponse");
        outResult.set(envelope);
        outSuccess.set(false);
        outError.set(errMsg);
        outResultTrigger.trigger();
    } else {
        const envelope = {
            requestType: tx.originalRequestType || "",
            requestId: tx.requestId,
            requestStatus: { result: false, code: 0, comment: errMsg },
            responseData: null
        };
        outRequestType.set((tx.originalRequestType || "Response") + "Response");
        outResult.set(envelope);
        outSuccess.set(false);
        outError.set(errMsg);
        outResultTrigger.trigger();
    }
}

function failImmediate(requestId, errMsg) {
    outError.set(errMsg);
    outSuccess.set(false);
    
    const envelope = {
        requestType: "",
        requestId: requestId,
        requestStatus: {
            result: false,
            code: 0,
            comment: errMsg
        },
        responseData: null
    };
    outRequestType.set("Response");
    outResult.set(envelope);
    outResultTrigger.trigger();
}

inData.onChange = () => {
    if (inData.get()) {
        inRequest.onTriggered();
    }
};

inRate.onChange = () => {
    if (sendTimeout) {
        clearTimeout(sendTimeout);
        sendTimeout = null;
        if (pendingTransactions.length > 0) {
            scheduleSend();
        }
    }
};

op.onDelete = () => {
    if (sendTimeout) {
        clearTimeout(sendTimeout);
    }
};
