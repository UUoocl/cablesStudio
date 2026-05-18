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
    if (currentObs && typeof currentObs.off === 'function') {
        try {
            currentObs.off("__anyEvent", onObsEvent);
        } catch (e) {}
    }
    currentObs = null;

    const obs = inObs.get();
    if (obs && typeof obs.on === 'function') {
        currentObs = obs;
        currentObs.on("__anyEvent", onObsEvent);
    } else if (obs) {
        op.logWarn("[ObsEvent] Received invalid OBS connection object (missing .on() method)");
    }
};

op.onDelete = () => {
    if (currentObs && typeof currentObs.off === 'function') {
        try {
            currentObs.off("__anyEvent", onObsEvent);
        } catch (e) {}
    }
};
