// Resolve konva in whichever environment the op runs in, without editing this file:
// - editor / npm: op.require("konva")
// - exported / online: konva attached as a CDN commonjs resource that sets a global
//   (https://cdn.jsdelivr.net/npm/konva@10.3.0/konva.min.js)
const Konva = (() => {
    if (typeof op.require === "function") {
        try {
            const m = op.require("konva");
            if (m) return m.default || m;
        }
        catch (e) { /* not available here, fall through to global */ }
    }
    return (typeof globalThis !== "undefined" && globalThis.Konva) || null;
})();

if (!Konva) op.setUiError("konva", "Konva library not found (needs the npm dependency in the editor, or a konva CDN commonjs resource in the export).");
else op.setUiError("konva", null);

const
    inStoreData = op.inString("Stored Automata Data", ""),
    exec = op.inTrigger("Trigger"),
    next = op.outTrigger("Next"),
    inShow = op.inTriggerButton("Show Editor"),
    resetTargetIn = op.inDropDown("Reset Target", ["START"], "START"),
    resetIn = op.inTriggerButton("Reset"),
    outActiveState = op.outString("Active State"),
    outNextState = op.outString("Next State"),
    frameCounterOut = op.outNumber("State Frames"),
    outTransitionCountdownOut = op.outNumber("Transition Countdown"),
    outStates = op.outArray("States");

inStoreData.setUiAttribs({ "hidePort": true, "greyout": true });
inShow.setUiAttribs({ "hidePort": true });

// --- Dynamic transition triggers (driven by inStoreData) ---
const createdTriggers = new Map();
let parsedData = { "states": [], "transitions": [], "regions": [] };
let currentActiveStateId = null;
let onActiveStateChanged = null;
let stateFrames = 0;
let resetTargets = [];
let currentActiveTransitionId = null;
let onTransitionActivityChanged = null;
let pendingTransition = null;
// Region "active" output ports, owned at op scope (not by the editor tab) so
// they are recreated from stored data on reload, like the transition triggers.
const regionActiveOutputs = new Map();
const STATE_RADIUS = 50;
const REGION_INACTIVE_FILL = "rgba(64, 180, 255, 0.12)";
const REGION_INACTIVE_STROKE = "rgba(64, 180, 255, 0.50)";
const REGION_ACTIVE_FILL = "rgba(64, 180, 255, 0.22)";
const REGION_ACTIVE_STROKE = "rgba(120, 220, 255, 0.88)";
const REGION_INACTIVE_TITLE_FILL = "rgba(220, 240, 255, 0.95)";
const REGION_ACTIVE_TITLE_FILL = "rgba(245, 252, 255, 1)";

function sanitizeFrames(value) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getNormalizedTransitionCountdown() {
    if (!pendingTransition || pendingTransition.frames <= 0) return 0;

    const remainingFrames = Math.max(pendingTransition.frames - pendingTransition.elapsed, 0);
    return remainingFrames / pendingTransition.frames;
}

function updateTransitionCountdownOutput() {
    outTransitionCountdownOut.set(getNormalizedTransitionCountdown());
}

// The state a pending (multi-frame) transition is heading to, so downstream can
// see what's about to become active. Empty when no transition is in progress.
function updateNextStateOutput() {
    outNextState.set(pendingTransition ? getStateLabel(pendingTransition.to) : "");
}

function setActiveTransitionId(id) {
    currentActiveTransitionId = id || null;
    if (onTransitionActivityChanged) onTransitionActivityChanged(currentActiveTransitionId);
}

function cancelPendingTransition() {
    pendingTransition = null;
    setActiveTransitionId(null);
    updateTransitionCountdownOutput();
    updateNextStateOutput();
}

function startTransition(transition) {
    if (!transition) return;
    const frames = sanitizeFrames(transition.frames);

    if (frames <= 0) {
        cancelPendingTransition();
        setActiveStateId(transition.to);
        return;
    }

    pendingTransition = {
        "id": transition.id,
        "from": transition.from,
        "to": transition.to,
        "frames": frames,
        "elapsed": 0
    };
    setActiveTransitionId(transition.id);
    updateTransitionCountdownOutput();
    updateNextStateOutput();
}

function updateFrameCounterOutput() {
    frameCounterOut.set(stateFrames);
}

// One simulation step, advanced exactly once per trigger (i.e. once per rendered
// frame when this op is connected into the main loop's trigger chain). Counting
// triggers makes "frames" an actual frame count rather than a wall-clock estimate,
// and means the automata stops when the op is disconnected, like any other op.
function advanceFrame() {
    stateFrames += 1;

    if (pendingTransition) {
        pendingTransition.elapsed += 1;
        if (pendingTransition.elapsed >= pendingTransition.frames) {
            const nextStateId = pendingTransition.to;
            pendingTransition = null;
            setActiveTransitionId(null);
            setActiveStateId(nextStateId); // resets stateFrames to 0
        }
    }

    updateFrameCounterOutput();
    updateTransitionCountdownOutput();
    updateNextStateOutput();
}

op.onDelete = () => {
    if (konvaState) {
        if (konvaState.resizeObserver) konvaState.resizeObserver.disconnect();
        if (konvaState.stage) konvaState.stage.destroy();
    }

    if (konvaTab && gui && gui.mainTabs && typeof gui.mainTabs.closeTab === "function") {
        gui.mainTabs.closeTab(konvaTab.id);
    }

    onActiveStateChanged = null;
    onTransitionActivityChanged = null;
    konvaState = null;
    konvaTab = null;
};

function parseStoredData() {
    try {
        const stored = inStoreData.get();
        const data = stored ? JSON.parse(stored) : null;
        parsedData = {
            "states": data && Array.isArray(data.states) ? data.states : [],
            "transitions": data && Array.isArray(data.transitions) ? data.transitions : [],
            "regions": data && Array.isArray(data.regions) ? data.regions : []
        };
    }
    catch (e) {
        parsedData = { "states": [], "transitions": [], "regions": [] };
    }
}

function getStateLabel(id) {
    const s = parsedData.states.find((x) => { return x && x.id === id; });
    return s && typeof s.label === "string" && s.label.trim().length > 0 ? s.label : id;
}

function getResetTargetLabel(state, counts) {
    const baseLabel = state && typeof state.label === "string" && state.label.trim().length > 0 ?
        state.label.trim() :
        String(state.id);

    return counts.get(baseLabel) > 1 ?
        baseLabel + " (" + state.id + ")" :
        baseLabel;
}

function getStartStateId() {
    const startState = parsedData.states.find(
        (state) => { return state && state.id && typeof state.label === "string" && state.label.trim() === "START"; }
    );
    return startState ? String(startState.id) : null;
}

function getDefaultResetTargetId() {
    return getStartStateId() || (resetTargets[0] ? resetTargets[0].id : null);
}

function updateResetTargets() {
    const counts = new Map();
    parsedData.states.forEach((state) => {
        if (!state || !state.id) return;
        const baseLabel = typeof state.label === "string" && state.label.trim().length > 0 ?
            state.label.trim() :
            String(state.id);
        counts.set(baseLabel, (counts.get(baseLabel) || 0) + 1);
    });

    resetTargets = parsedData.states
        .filter((state) => { return state && state.id; })
        .map((state) => {
            return {
                "id": String(state.id),
                "label": getResetTargetLabel(state, counts)
            };
        });

    const targetLabels = resetTargets.map((target) => { return target.label; });
    // Dropdown needs a non-empty option list; fall back to the default "START"
    // so we never push an empty value (which cables flags as "Invalid Value").
    const values = targetLabels.length ? targetLabels : ["START"];
    const selectedLabel = typeof resetTargetIn.get === "function" && typeof resetTargetIn.get() === "string" ?
        resetTargetIn.get() :
        "";
    const selectedExists = values.includes(selectedLabel);
    const defaultTargetId = getDefaultResetTargetId();
    const defaultTarget = resetTargets.find((target) => { return target.id === defaultTargetId; });
    const fallbackLabel = defaultTarget ?
        defaultTarget.label :
        (resetTargets[0] ? resetTargets[0].label : "");
    const nextValue = selectedExists ? selectedLabel : fallbackLabel;

    resetTargetIn.setUiAttribs({ "values": values });
    resetTargetIn.set(values.includes(nextValue) ? nextValue : values[0]);
    outStates.set(targetLabels);
}

function getResetTargetId() {
    const selectedLabel = resetTargetIn.get();
    const target = resetTargets.find((item) => { return item.label === selectedLabel; });
    return target ? target.id : getDefaultResetTargetId();
}

function getRegionTitle(region) {
    return typeof region.title === "string" && region.title.trim().length > 0 ?
        region.title.trim() :
        String(region.id);
}

// Stable port name from the immutable region id (link key, never changes).
function getRegionActiveOutputName(region) {
    return region && region.id ? String(region.id) + "-active" : null;
}

// Readable display title; disambiguated with the id only when two regions
// share a title. Changing this never affects links.
function getRegionActiveOutputTitle(region) {
    if (!region || !region.id) return "";

    const baseTitle = getRegionTitle(region) + " Active";
    const hasDuplicateTitle = parsedData.regions.some((other) => {
        return other &&
            other.id !== region.id &&
            (getRegionTitle(other) + " Active") === baseTitle;
    });

    return hasDuplicateTitle ? baseTitle + " (" + region.id + ")" : baseTitle;
}

function ensureRegionActiveOutput(region) {
    if (!region || !region.id) return null;

    const title = getRegionActiveOutputTitle(region);
    const existingEntry = regionActiveOutputs.get(region.id);
    if (existingEntry && existingEntry.port) {
        if (existingEntry.title !== title) {
            existingEntry.title = title;
            existingEntry.port.setUiAttribs({ "title": title });
        }
        return existingEntry.port;
    }

    const port = op.outNumber(getRegionActiveOutputName(region));
    port.setUiAttribs({ "title": title });
    regionActiveOutputs.set(region.id, { "port": port, "title": title });
    return port;
}

function removeRegionActiveOutput(regionId) {
    const entry = regionActiveOutputs.get(regionId);
    if (!entry) return;

    // Detach patch links before removing the port (see removeTrigger) so a
    // connected region output doesn't leave cables with a dangling Link.
    if (entry.port && typeof entry.port.removeLinks === "function") entry.port.removeLinks();
    if (entry.port && typeof op.removePort === "function") op.removePort(entry.port);
    regionActiveOutputs.delete(regionId);
}

function isStateInsideRegion(state, region) {
    if (!state || !region) return false;
    if (![state.x, state.y, region.x, region.y, region.radius].every(Number.isFinite)) return false;
    const dx = state.x - region.x;
    const dy = state.y - region.y;
    return Math.sqrt(dx * dx + dy * dy) <= region.radius + STATE_RADIUS;
}

// Recreate/rename/remove region output ports from stored data and push their
// current active values. Runs at op init and on every data change, so region
// outputs exist and are correct on reload without opening the editor tab.
function syncRegionActivityOutputs() {
    const regionIds = new Set(
        parsedData.regions.filter((region) => { return region && region.id; }).map((region) => { return String(region.id); })
    );

    Array.from(regionActiveOutputs.keys())
        .filter((id) => { return !regionIds.has(id); })
        .forEach(removeRegionActiveOutput);

    const activeState = parsedData.states.find((state) => { return state && state.id === currentActiveStateId; }) || null;

    parsedData.regions.forEach((region) => {
        if (!region || !region.id) return;
        const port = ensureRegionActiveOutput(region);
        if (port) port.set(isStateInsideRegion(activeState, region) ? 1 : 0);
    });
}

function refreshInspector() {
    if (!CABLES.UI || typeof gui !== "object" || !gui) return;

    const selectedOp = gui.patchView && typeof gui.patchView.getSelectedOp === "function" ?
        gui.patchView.getSelectedOp() :
        gui.opParams && gui.opParams.op ?
            gui.opParams.op :
            null;

    if (selectedOp !== op) return;

    if (gui.opParams && typeof gui.opParams.show === "function") {
        gui.opParams.show(op);
        return;
    }

    if (gui.patchView && typeof gui.patchView.selectOp === "function") {
        gui.patchView.selectOp(op);
        return;
    }

    if (typeof gui.selectOp === "function") {
        gui.selectOp(op);
    }
}

function setActiveStateId(id) {
    currentActiveStateId = id;
    stateFrames = 0;
    updateFrameCounterOutput();
    outActiveState.set(id ? getStateLabel(id) : "");
    syncRegionActivityOutputs();
    if (onActiveStateChanged) onActiveStateChanged(id);
}

resetIn.onTriggered = () => {
    const targetId = getResetTargetId();
    if (!targetId) return;
    cancelPendingTransition();
    setActiveStateId(targetId);
};

function getTransitionInfos() {
    return parsedData.transitions
        .filter((t) => { return t && typeof t.from === "string" && typeof t.to === "string"; })
        .map((t) => {
            const id = typeof t.id === "string" && t.id.trim().length > 0 ?
                t.id :
                (t.from + "-to-" + t.to);
            return {
                // Port name is the immutable transition id (link key, never
                // changes); the readable "A to B" text is only the display title,
                // so renaming a state can't break existing connections.
                "id": id,
                "title": getStateLabel(t.from) + " to " + getStateLabel(t.to),
                "transition":
                {
                    "id": id,
                    "from": t.from,
                    "to": t.to,
                    "frames": sanitizeFrames(t.frames)
                }
            };
        })
        .filter((info) => { return String(info.id).trim().length > 0; });
}

function ensureTrigger(id, title, transition) {
    const safeId = String(id).trim();
    if (!safeId) return;

    const existing = createdTriggers.get(safeId);
    if (existing) {
        existing.transition = transition;
        if (existing.title !== title) {
            existing.title = title;
            existing.trigger.setUiAttribs({ "title": title });
        }
        return;
    }

    const trigger = op.inTriggerButton(safeId);
    trigger.setUiAttribs({ "title": title });
    trigger.onTriggered = () => {
        const entry = createdTriggers.get(safeId);
        const t = entry ? entry.transition : null;
        if (!t) return;
        if (pendingTransition) return;
        if (currentActiveStateId !== t.from) return;
        startTransition(t);
    };
    createdTriggers.set(safeId, { "trigger": trigger, "transition": transition, "title": title });
}

function removeTrigger(id) {
    const entry = createdTriggers.get(id);
    if (!entry) return;
    const t = entry.trigger || entry;
    // Detach any patch links first: removing a port that still has a live link
    // leaves cables holding a dangling Link and it throws on the next update.
    if (t && typeof t.removeLinks === "function") t.removeLinks();
    if (typeof op.removePort === "function") op.removePort(t);
    else if (t && typeof t.remove === "function") t.remove();
    createdTriggers.delete(id);
}

function rebuildTriggers() {
    parseStoredData();
    updateResetTargets();

    if (pendingTransition) {
        const stillValid = parsedData.transitions.some((t) => {
            return t &&
                String(t.id) === pendingTransition.id &&
                String(t.from) === pendingTransition.from &&
                String(t.to) === pendingTransition.to;
        });
        if (!stillValid) cancelPendingTransition();
    }

    const infos = getTransitionInfos();
    const idSet = new Set(infos.map((i) => { return i.id; }));

    Array.from(createdTriggers.keys())
        .filter((id) => { return !idSet.has(id); })
        .forEach(removeTrigger);

    infos.forEach((info) => { return ensureTrigger(info.id, info.title, info.transition); });

    const stillExists = currentActiveStateId &&
        parsedData.states.some((s) => { return s && s.id === currentActiveStateId; });
    if (!stillExists) {
        const start = parsedData.states.find(
            (s) => { return s && typeof s.label === "string" && s.label.trim() === "START"; }
        );
        const fallback = start || parsedData.states[0] || null;
        setActiveStateId(fallback ? fallback.id : null);
    }
    else {
        outActiveState.set(getStateLabel(currentActiveStateId));
    }

    syncRegionActivityOutputs();
    refreshInspector();
}

inStoreData.onChange = rebuildTriggers;
rebuildTriggers();

inShow.onTriggered = addmytab;

let konvaContainerId = null;
let konvaState = null;
let konvaTab = null;

exec.onTriggered = () => {
    advanceFrame();

    if (CABLES.UI && konvaContainerId && !konvaState) {
        const container = document.getElementById(konvaContainerId);
        if (container) konvaState = initKonvaUI(container);
    }
    else if (konvaState && konvaState.layer) {
        konvaState.layer.batchDraw();
    }

    next.trigger();
};

function addmytab() {
    if (!CABLES.UI) return;

    let containerId = "konva-container-" + op.id;
    let tabName = "Automata " + op.id.substring(0, 6);
    let html = "<div id=\"" + containerId + "\" style=\"width:100%;height:100%;overflow:hidden;\"></div>";
    let tab = new CABLES.UI.Tab(tabName, { "icon": "cube", "infotext": "tab_gltf", "padding": false, "singleton": true });

    gui.mainTabs.addTab(tab, true);
    tab.html(html);
    gui.maintabPanel.show(true);

    konvaContainerId = containerId;
    konvaTab = tab;
    konvaState = null;

    const container = document.getElementById(containerId);
    if (container) konvaState = initKonvaUI(container);
}

// initKonvaUI(container) — the Konva editor UI — lives in the "inc_editor"
// attachment (att_inc_editor.js), which cables includes and executes in this
// op's scope before the code above. It is only used under CABLES.UI.