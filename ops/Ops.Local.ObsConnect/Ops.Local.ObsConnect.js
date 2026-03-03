const
    inIp = op.inString("IP", "localhost"),
    inPort = op.inFloat("Port", 4455),
    inPassword = op.inString("password", ""),
    inConnect = op.inBool("connect", false),
    inSubGeneral = op.inBool("Sub General", true),
    inSubConfig = op.inBool("Sub Config", true),
    inSubScenes = op.inBool("Sub Scenes Events", true),
    inSubInputs = op.inBool("Sub Inputs", true),
    inSubTransitions = op.inBool("Sub Transitions", true),
    inSubFilters = op.inBool("Sub Filters", true),
    inSubOutputs = op.inBool("Sub Outputs", true),
    inSubSceneItems = op.inBool("Sub SceneItems", true),
    inSubMediaInputs = op.inBool("Sub MediaInputs", true),
    inSubVendors = op.inBool("Sub Vendors", true),
    inSubUi = op.inBool("Sub Ui", true),
    outConnected = op.outBool("connected", false),
    outError = op.outString("Error"),
    outConnection = op.outObject("obsConnection", null, "obsConnection");

inSubGeneral.setUiAttribs({ group: "Event Subscriptions" });
inSubConfig.setUiAttribs({ group: "Event Subscriptions" });
inSubScenes.setUiAttribs({ group: "Event Subscriptions" });
inSubInputs.setUiAttribs({ group: "Event Subscriptions" });
inSubTransitions.setUiAttribs({ group: "Event Subscriptions" });
inSubFilters.setUiAttribs({ group: "Event Subscriptions" });
inSubOutputs.setUiAttribs({ group: "Event Subscriptions" });
inSubSceneItems.setUiAttribs({ group: "Event Subscriptions" });
inSubMediaInputs.setUiAttribs({ group: "Event Subscriptions" });
inSubVendors.setUiAttribs({ group: "Event Subscriptions" });
inSubUi.setUiAttribs({ group: "Event Subscriptions" });

op.obsInstance = null;

inConnect.onChange = updateConnection;
op.onDelete = disconnect;

function updateConnection() {
    if (inConnect.get()) {
        connect();
    } else {
        disconnect();
    }
}

async function connect() {
    if (op.obsInstance) return;

    let OBSWebSocket = null;

    // try to load electron version
    try {
        const pkg = op.require("obs-websocket-js");
        OBSWebSocket = pkg.default || pkg;
    } catch (e) {
        // failed
    }

    // try to load web version from global scope (loaded via libs in json)
    if (!OBSWebSocket && typeof globalThis.OBSWebSocket !== 'undefined') {
        OBSWebSocket = globalThis.OBSWebSocket;
    }

    if (!OBSWebSocket) {
        op.logError("OBSWebSocket library not loaded");
        outError.set("Library not loaded");
        return;
    }

    op.obsInstance = new OBSWebSocket();
    outError.set("");

    const EventSubscription = OBSWebSocket.EventSubscription || {
        General: 1,
        Config: 2,
        Scenes: 4,
        Inputs: 8,
        Transitions: 16,
        Filters: 32,
        Outputs: 64,
        SceneItems: 128,
        MediaInputs: 256,
        Vendors: 512,
        Ui: 1024
    };

    let subs = 0;
    if (inSubGeneral.get()) subs |= EventSubscription.General;
    if (inSubConfig.get()) subs |= EventSubscription.Config;
    if (inSubScenes.get()) subs |= EventSubscription.Scenes;
    if (inSubInputs.get()) subs |= EventSubscription.Inputs;
    if (inSubTransitions.get()) subs |= EventSubscription.Transitions;
    if (inSubFilters.get()) subs |= EventSubscription.Filters;
    if (inSubOutputs.get()) subs |= EventSubscription.Outputs;
    if (inSubSceneItems.get()) subs |= EventSubscription.SceneItems;
    if (inSubMediaInputs.get()) subs |= EventSubscription.MediaInputs;
    if (inSubVendors.get()) subs |= EventSubscription.Vendors;
    if (inSubUi.get()) subs |= EventSubscription.Ui;

    const url = "ws://" + inIp.get() + ":" + inPort.get();

    try {
        await op.obsInstance.connect(url, inPassword.get(), {
            eventSubscriptions: subs
        });
        outConnected.set(true);
        outConnection.set(op.obsInstance);
        op.setUiAttrib({ extendTitle: "connected" });
        
        op.obsInstance.on('ConnectionClosed', () => {
            handleDisconnect();
        });
    } catch (err) {
        op.logError("OBS Connection Error:", err);
        outError.set(err.message || "Connection failed");
        disconnect();
    }
}

function handleDisconnect() {
    outConnected.set(false);
    outConnection.set(null);
    op.obsInstance = null;
    op.setUiAttrib({ extendTitle: "disconnected" });
}

function disconnect() {
    if (op.obsInstance) {
        if (typeof op.obsInstance.disconnect === 'function') {
            try {
                op.obsInstance.disconnect();
            } catch(e) {
                console.warn("Error disconnecting OBS", e);
            }
        }
        op.obsInstance = null;
    }
    handleDisconnect();
}

// Check initial state
updateConnection();
