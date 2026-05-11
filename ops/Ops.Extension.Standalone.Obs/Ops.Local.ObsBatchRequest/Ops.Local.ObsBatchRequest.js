const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    inRate = op.inFloat("Request Rate (Hz)", 10),
    inRequest = op.inObject("Request Object"),
    inAdd = op.inTriggerButton("Add to Batch"),
    
    outResults = op.outObject("Results"),
    outSuccess = op.outBoolNum("Success", false),
    outError = op.outString("Error", "");

let requests = [];
let timeout = null;
let lastSendTime = 0;

inAdd.onTriggered = () => {
    const req = inRequest.get();
    if (req) {
        // Support both single request and array of requests
        if (Array.isArray(req)) {
            requests.push(...req);
        } else {
            requests.push(req);
        }
    }
};

function sendBatch() {
    timeout = null;
    if (requests.length === 0) {
        scheduleNext();
        return;
    }

    const obs = inObs.get();
    if (!obs) {
        outError.set("Not connected to OBS");
        outSuccess.set(false);
        scheduleNext();
        return;
    }

    const currentBatch = requests.slice();
    requests = [];

    obs.callBatch(currentBatch)
        .then((response) => {
            outResults.set(response);
            outSuccess.set(true);
            outError.set("");
        })
        .catch((e) => {
            op.logError("OBS Batch Request Error: ", e);
            outError.set(e.message || "Unknown error");
            outSuccess.set(false);
        })
        .finally(() => {
            lastSendTime = Date.now();
            scheduleNext();
        });
}

function scheduleNext() {
    if (timeout) return;
    
    const rate = inRate.get();
    if (rate <= 0) return;

    const interval = 1000 / rate;
    const now = Date.now();
    const elapsed = now - lastSendTime;
    const wait = Math.max(0, interval - elapsed);

    timeout = setTimeout(sendBatch, wait);
}

inRate.onChange = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    scheduleNext();
};

op.onLoaded = () => {
    scheduleNext();
};

op.onDelete = () => {
    if (timeout) clearTimeout(timeout);
};
