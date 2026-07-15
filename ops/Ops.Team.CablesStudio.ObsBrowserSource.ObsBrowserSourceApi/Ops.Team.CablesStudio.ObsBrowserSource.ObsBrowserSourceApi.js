// Define inputs
const inUpdate = op.inTrigger("Update Status");

const inSaveReplay = op.inTrigger("Save Replay Buffer");
const inStartReplay = op.inTrigger("Start Replay Buffer");
const inStopReplay = op.inTrigger("Stop Replay Buffer");

const inStartStreaming = op.inTrigger("Start Streaming");
const inStopStreaming = op.inTrigger("Stop Streaming");
const inStartRecording = op.inTrigger("Start Recording");
const inStopRecording = op.inTrigger("Stop Recording");
const inPauseRecording = op.inTrigger("Pause Recording");
const inUnpauseRecording = op.inTrigger("Unpause Recording");

const inStartVirtualcam = op.inTrigger("Start Virtualcam");
const inStopVirtualcam = op.inTrigger("Stop Virtualcam");

const inSetScene = op.inTrigger("Set Scene");
const inSceneName = op.inString("Scene Name", "");
const inSetTransition = op.inTrigger("Set Transition");
const inTransitionName = op.inString("Transition Name", "");

const inCustomEvents = op.inString("Custom Events", "");

// Define outputs
const outIsObs = op.outBoolNum("Is OBS Browser Source", false);
const outVersion = op.outString("Plugin Version", "");
const outControlLevel = op.outNumber("Control Level", 0);

const outRecording = op.outBoolNum("Recording", false);
const outRecordingPaused = op.outBoolNum("Recording Paused", false);
const outStreaming = op.outBoolNum("Streaming", false);
const outReplayBuffer = op.outBoolNum("Replay Buffer", false);
const outVirtualCam = op.outBoolNum("Virtual Cam", false);

const outCurrentSceneName = op.outString("Current Scene Name", "");
const outCurrentSceneWidth = op.outNumber("Current Scene Width", 0);
const outCurrentSceneHeight = op.outNumber("Current Scene Height", 0);

const outScenes = op.outArray("Scenes", null);
const outTransitions = op.outArray("Transitions", null);
const outCurrentTransition = op.outString("Current Transition", "");

const outStatusUpdated = op.outTrigger("On Status Updated");
const outError = op.outString("Error", "");

// Events: Scenes & Sources
const outSceneChanged = op.outTrigger("Scene Changed");
const outSceneChangedName = op.outString("Scene Changed Name", "");
const outSceneChangedDetail = op.outObject("Scene Changed Detail", null);

const outSceneListChanged = op.outTrigger("Scene List Changed");

const outTransitionChanged = op.outTrigger("Transition Changed");
const outTransitionChangedName = op.outString("Transition Changed Name", "");

const outTransitionListChanged = op.outTrigger("Transition List Changed");

const outVisibleChanged = op.outTrigger("Visible Changed");
const outSourceVisible = op.outBoolNum("Source Visible", false);

const outActiveChanged = op.outTrigger("Active Changed");
const outSourceActive = op.outBoolNum("Source Active", false);

// Events: Outputs
const outStreamingStarting = op.outTrigger("Streaming Starting");
const outStreamingStarted = op.outTrigger("Streaming Started");
const outStreamingStopping = op.outTrigger("Streaming Stopping");
const outStreamingStopped = op.outTrigger("Streaming Stopped");

const outRecordingStarting = op.outTrigger("Recording Starting");
const outRecordingStarted = op.outTrigger("Recording Started");
const outRecordingPausedEvent = op.outTrigger("Recording Paused Event");
const outRecordingUnpaused = op.outTrigger("Recording Unpaused");
const outRecordingStopping = op.outTrigger("Recording Stopping");
const outRecordingStopped = op.outTrigger("Recording Stopped");

const outReplayBufferStarting = op.outTrigger("Replay Buffer Starting");
const outReplayBufferStarted = op.outTrigger("Replay Buffer Started");
const outReplayBufferSaved = op.outTrigger("Replay Buffer Saved");
const outReplayBufferStopping = op.outTrigger("Replay Buffer Stopping");
const outReplayBufferStopped = op.outTrigger("Replay Buffer Stopped");

const outVirtualCamStarted = op.outTrigger("Virtual Cam Started");
const outVirtualCamStopped = op.outTrigger("Virtual Cam Stopped");

const outExit = op.outTrigger("Exit");

// Events: Custom
const outCustomEventReceived = op.outTrigger("Custom Event Received");
const outCustomEventName = op.outString("Custom Event Name", "");
const outCustomEventDetail = op.outObject("Custom Event Detail", null);

// Port groupings
op.setPortGroup("Replay Buffer", [inSaveReplay, inStartReplay, inStopReplay]);
op.setPortGroup("Streaming & Recording", [
    inStartStreaming, inStopStreaming,
    inStartRecording, inStopRecording,
    inPauseRecording, inUnpauseRecording
]);
op.setPortGroup("Virtual Camera", [inStartVirtualcam, inStopVirtualcam]);
op.setPortGroup("Scenes & Transitions", [inSetScene, inSceneName, inSetTransition, inTransitionName]);
op.setPortGroup("Custom Events", [inCustomEvents, outCustomEventReceived, outCustomEventName, outCustomEventDetail]);

op.setPortGroup("Status", [
    outIsObs, outVersion, outControlLevel,
    outRecording, outRecordingPaused, outStreaming, outReplayBuffer, outVirtualCam,
    outCurrentSceneName, outCurrentSceneWidth, outCurrentSceneHeight,
    outScenes, outTransitions, outCurrentTransition,
    outStatusUpdated, outError
]);

op.setPortGroup("Events: Scenes & Sources", [
    outSceneChanged, outSceneChangedName, outSceneChangedDetail,
    outSceneListChanged,
    outTransitionChanged, outTransitionChangedName,
    outTransitionListChanged,
    outVisibleChanged, outSourceVisible,
    outActiveChanged, outSourceActive
]);

op.setPortGroup("Events: Outputs", [
    outStreamingStarting, outStreamingStarted, outStreamingStopping, outStreamingStopped,
    outRecordingStarting, outRecordingStarted, outRecordingPausedEvent, outRecordingUnpaused, outRecordingStopping, outRecordingStopped,
    outReplayBufferStarting, outReplayBufferStarted, outReplayBufferSaved, outReplayBufferStopping, outReplayBufferStopped,
    outVirtualCamStarted, outVirtualCamStopped,
    outExit
]);

const listeners = {};
let registeredCustomEvents = [];

function addListener(eventName, handler) {
    listeners[eventName] = handler;
    window.addEventListener(eventName, handler);
}

function removeAllListeners() {
    for (const [eventName, handler] of Object.entries(listeners)) {
        window.removeEventListener(eventName, handler);
        delete listeners[eventName];
    }
    // Clean up custom events as well
    for (const eventName of registeredCustomEvents) {
        if (listeners[eventName]) {
            window.removeEventListener(eventName, listeners[eventName]);
            delete listeners[eventName];
        }
    }
    registeredCustomEvents = [];
}

op.onDelete = () => {
    removeAllListeners();
};

function queryControlLevel() {
    if (window.obsstudio && window.obsstudio.getControlLevel) {
        window.obsstudio.getControlLevel((level) => {
            outControlLevel.set(level);
            outStatusUpdated.trigger();
        });
    }
}

function queryStatus() {
    if (window.obsstudio && window.obsstudio.getStatus) {
        window.obsstudio.getStatus((status) => {
            if (status) {
                outRecording.set(!!status.recording);
                outRecordingPaused.set(!!status.recordingPaused);
                outStreaming.set(!!status.streaming);
                outReplayBuffer.set(!!status.replaybuffer);
                outVirtualCam.set(!!status.virtualcam);
                outStatusUpdated.trigger();
            }
        });
    }
}

function queryCurrentScene() {
    if (window.obsstudio && window.obsstudio.getCurrentScene) {
        window.obsstudio.getCurrentScene((scene) => {
            if (scene) {
                outCurrentSceneName.set(scene.name || "");
                outCurrentSceneWidth.set(scene.width || 0);
                outCurrentSceneHeight.set(scene.height || 0);
                outStatusUpdated.trigger();
            }
        });
    }
}

function queryScenes() {
    if (window.obsstudio && window.obsstudio.getScenes) {
        window.obsstudio.getScenes((scenes) => {
            outScenes.set(scenes || []);
            outStatusUpdated.trigger();
        });
    }
}

function queryTransitions() {
    if (window.obsstudio && window.obsstudio.getTransitions) {
        window.obsstudio.getTransitions((transitions) => {
            outTransitions.set(transitions || []);
            outStatusUpdated.trigger();
        });
    }
}

function queryCurrentTransition() {
    if (window.obsstudio && window.obsstudio.getCurrentTransition) {
        window.obsstudio.getCurrentTransition((transition) => {
            outCurrentTransition.set(transition || "");
            outStatusUpdated.trigger();
        });
    }
}

function executeCommand(fnName, ...args) {
    if (!window.obsstudio) {
        outError.set("window.obsstudio is not available");
        return;
    }
    if (typeof window.obsstudio[fnName] !== "function") {
        outError.set("obsstudio." + fnName + " is not a function or not available at current permission level");
        return;
    }
    try {
        window.obsstudio[fnName](...args);
        outError.set("");
    } catch (e) {
        outError.set("Failed to execute " + fnName + ": " + e.message);
    }
}

function updateCustomEventListeners() {
    // First, remove previous custom event listeners
    for (const eventName of registeredCustomEvents) {
        if (listeners[eventName]) {
            window.removeEventListener(eventName, listeners[eventName]);
            delete listeners[eventName];
        }
    }
    registeredCustomEvents = [];

    const val = inCustomEvents.get();
    if (!val) return;

    // Split events and strip quotes (double and single)
    const eventNames = val.split(/[,\s]+/).map(s => s.replace(/['"]/g, "").trim()).filter(Boolean);
    for (const name of eventNames) {
        const handler = (event) => {
            outCustomEventName.set(name);
            outCustomEventDetail.set(event.detail || null);
            outCustomEventReceived.trigger();
        };
        listeners[name] = handler;
        window.addEventListener(name, handler);
        registeredCustomEvents.push(name);
    }
}

// Bind Command Inputs
inUpdate.onTriggered = () => {
    if (!window.obsstudio) {
        outError.set("window.obsstudio not available");
        return;
    }
    queryControlLevel();
    queryStatus();
    queryCurrentScene();
    queryScenes();
    queryTransitions();
    queryCurrentTransition();
};

inSaveReplay.onTriggered = () => executeCommand("saveReplayBuffer");
inStartReplay.onTriggered = () => executeCommand("startReplayBuffer");
inStopReplay.onTriggered = () => executeCommand("stopReplayBuffer");

inStartStreaming.onTriggered = () => executeCommand("startStreaming");
inStopStreaming.onTriggered = () => executeCommand("stopStreaming");
inStartRecording.onTriggered = () => executeCommand("startRecording");
inStopRecording.onTriggered = () => executeCommand("stopRecording");
inPauseRecording.onTriggered = () => executeCommand("pauseRecording");
inUnpauseRecording.onTriggered = () => executeCommand("unpauseRecording");

inStartVirtualcam.onTriggered = () => executeCommand("startVirtualcam");
inStopVirtualcam.onTriggered = () => executeCommand("stopVirtualcam");

inSetScene.onTriggered = () => executeCommand("setCurrentScene", inSceneName.get() || "");
inSetTransition.onTriggered = () => executeCommand("setCurrentTransition", inTransitionName.get() || "");

inCustomEvents.onChange = updateCustomEventListeners;

// Initialization
function setup() {
    removeAllListeners();

    if (!window.obsstudio) {
        outIsObs.set(false);
        outVersion.set("");
        outError.set("Not running in OBS Browser Source (window.obsstudio not found)");
        return;
    }

    outIsObs.set(true);
    outVersion.set(window.obsstudio.pluginVersion || "unknown");
    outError.set("");

    // Register all standard events
    const standardEvents = {
        "obsSceneChanged": (e) => {
            const name = e.detail ? e.detail.name : "";
            outSceneChangedName.set(name);
            outSceneChangedDetail.set(e.detail || null);
            outSceneChanged.trigger();
            if (e.detail) {
                outCurrentSceneName.set(e.detail.name || "");
                outCurrentSceneWidth.set(e.detail.width || 0);
                outCurrentSceneHeight.set(e.detail.height || 0);
            }
        },
        "obsSceneListChanged": () => {
            outSceneListChanged.trigger();
            queryScenes();
        },
        "obsTransitionChanged": (e) => {
            const name = e.detail ? e.detail.name : "";
            outTransitionChangedName.set(name);
            outTransitionChanged.trigger();
            outCurrentTransition.set(name);
        },
        "obsTransitionListChanged": () => {
            outTransitionListChanged.trigger();
            queryTransitions();
        },
        "obsSourceVisibleChanged": (e) => {
            let visible = false;
            if (e.detail !== undefined) {
                if (typeof e.detail === "boolean") visible = e.detail;
                else if (typeof e.detail === "object" && e.detail !== null) visible = !!e.detail.visible;
            }
            outSourceVisible.set(visible);
            outVisibleChanged.trigger();
        },
        "obsSourceActiveChanged": (e) => {
            let active = false;
            if (e.detail !== undefined) {
                if (typeof e.detail === "boolean") active = e.detail;
                else if (typeof e.detail === "object" && e.detail !== null) active = !!e.detail.active;
            }
            outSourceActive.set(active);
            outActiveChanged.trigger();
        },
        "obsStreamingStarting": () => { outStreamingStarting.trigger(); queryStatus(); },
        "obsStreamingStarted": () => { outStreamingStarted.trigger(); queryStatus(); },
        "obsStreamingStopping": () => { outStreamingStopping.trigger(); queryStatus(); },
        "obsStreamingStopped": () => { outStreamingStopped.trigger(); queryStatus(); },
        "obsRecordingStarting": () => { outRecordingStarting.trigger(); queryStatus(); },
        "obsRecordingStarted": () => { outRecordingStarted.trigger(); queryStatus(); },
        "obsRecordingPaused": () => { outRecordingPausedEvent.trigger(); queryStatus(); },
        "obsRecordingUnpaused": () => { outRecordingUnpaused.trigger(); queryStatus(); },
        "obsRecordingStopping": () => { outRecordingStopping.trigger(); queryStatus(); },
        "obsRecordingStopped": () => { outRecordingStopped.trigger(); queryStatus(); },
        "obsReplaybufferStarting": () => { outReplayBufferStarting.trigger(); queryStatus(); },
        "obsReplaybufferStarted": () => { outReplayBufferStarted.trigger(); queryStatus(); },
        "obsReplaybufferSaved": () => { outReplayBufferSaved.trigger(); queryStatus(); },
        "obsReplaybufferStopping": () => { outReplayBufferStopping.trigger(); queryStatus(); },
        "obsReplaybufferStopped": () => { outReplayBufferStopped.trigger(); queryStatus(); },
        "obsVirtualcamStarted": () => { outVirtualCamStarted.trigger(); queryStatus(); },
        "obsVirtualcamStopped": () => { outVirtualCamStopped.trigger(); queryStatus(); },
        "obsExit": () => { outExit.trigger(); queryStatus(); }
    };

    for (const [eventName, handler] of Object.entries(standardEvents)) {
        addListener(eventName, handler);
    }

    // Register custom events
    updateCustomEventListeners();

    // Query initial status
    queryControlLevel();
    queryStatus();
    queryCurrentScene();
    queryScenes();
    queryTransitions();
    queryCurrentTransition();
}

setup();
