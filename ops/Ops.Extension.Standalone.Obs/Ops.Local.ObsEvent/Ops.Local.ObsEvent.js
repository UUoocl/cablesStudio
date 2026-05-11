const
    inObs = op.inObject("obsConnection", null, "obsConnection"),
    outType = op.outString("Event Type"),
    outData = op.outObject("Event Data"),
    outTrigger = op.outTrigger("Received");

let currentObs = null;

function onObsEvent(data) {
    outType.set(data.eventType || "");
    outData.set(data.eventData || null);
    outTrigger.trigger();
}

inObs.onChange = () => {
    if (currentObs) {
        currentObs.off("__anyEvent", onObsEvent);
        currentObs = null;
    }

    const obs = inObs.get();
    if (obs) {
        currentObs = obs;
        currentObs.on("__anyEvent", onObsEvent);
    }
};

op.onDelete = () => {
    if (currentObs) {
        currentObs.off("__anyEvent", onObsEvent);
    }
};
