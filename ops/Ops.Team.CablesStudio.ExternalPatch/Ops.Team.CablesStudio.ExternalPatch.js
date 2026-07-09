// Ops.Team.CablesStudio.ExternalPatch.js

const inChannelName = op.inString("Broadcast Channel Name", "patch-sync");
const inUrl = op.inString("Patch URL", "");
const inOpen = op.inTriggerButton("Open Window");
const inClose = op.inTriggerButton("Close Window");
const inTitle = op.inString("Window Title", "External Patch");
const inWidth = op.inInt("Window Width", 1024);
const inHeight = op.inInt("Window Height", 768);
const inX = op.inInt("Window X", 100);
const inY = op.inInt("Window Y", 100);
const inSendData = op.inObject("Send Message");
const inSendMessage = op.inTriggerButton("Send Trigger");

const outStatus = op.outString("Window Status", "Inactive");
const outOnReceived = op.outTrigger("On Received");
const outReceivedData = op.outObject("Received Message");

op.setPortGroup("Settings", [inChannelName, inUrl, inTitle, inWidth, inHeight, inX, inY]);
op.setPortGroup("Messaging", [inSendData, inSendMessage]);

let childWindow = null;
let bcRx = null;
let bcTx = null;
let pollInterval = null;

inOpen.onTriggered = openWindow;
inClose.onTriggered = closeWindow;
inSendMessage.onTriggered = sendMessage;

op.onDelete = () => {
    closeWindow();
    if (bcRx) {
        bcRx.close();
        bcRx = null;
    }
    if (bcTx) {
        bcTx.close();
        bcTx = null;
    }
};

function setupBroadcastChannel() {
    if (bcRx) {
        bcRx.close();
        bcRx = null;
    }
    if (bcTx) {
        bcTx.close();
        bcTx = null;
    }
    const channelName = inChannelName.get();
    if (channelName) {
        bcRx = new BroadcastChannel('sub-' + channelName);
        bcTx = new BroadcastChannel('pub-' + channelName);
        bcRx.onmessage = (event) => {
            if (event.data) {
                outReceivedData.setRef(event.data);
                outOnReceived.trigger();
            }
        };
    }
}

inChannelName.onChange = setupBroadcastChannel;
setupBroadcastChannel();

function openWindow() {
    if (childWindow && !childWindow.closed) {
        childWindow.close();
    }

    const baseUrl = inUrl.get();
    if (!baseUrl) {
        op.logError("No URL provided");
        outStatus.set("Error: No URL");
        return;
    }

    const channelName = inChannelName.get() || "patch-sync";
    let finalUrl = baseUrl;

    try {
        const urlObj = new URL(baseUrl, window.location.origin);
        urlObj.searchParams.set("channel", channelName);
        finalUrl = urlObj.toString();
    } catch (e) {
        const separator = baseUrl.includes("?") ? "&" : "?";
        finalUrl = baseUrl + separator + "channel=" + encodeURIComponent(channelName);
    }

    const winTitle = inTitle.get() || "External Patch";
    const w = inWidth.get() || 1024;
    const h = inHeight.get() || 768;
    const x = inX.get() || 100;
    const y = inY.get() || 100;

    const features = `width=${w},height=${h},left=${x},top=${y},directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=yes,resizable=yes,popup=true`;
    
    const uniqueId = CABLES.uuid ? CABLES.uuid() : Math.random().toString(36).substring(2, 9);
    childWindow = window.open(finalUrl, "extPatch#" + uniqueId, features);

    if (!childWindow) {
        op.logError("Failed to open child window. Pop-up blocker might be active.");
        outStatus.set("Error: Pop-up blocked");
        return;
    }

    outStatus.set("Open");

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(pollInterval);
            pollInterval = null;
            childWindow = null;
            outStatus.set("Closed");
        }
    }, 500);
}

function closeWindow() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    if (childWindow && !childWindow.closed) {
        childWindow.close();
    }
    childWindow = null;
    outStatus.set("Inactive");
}

function sendMessage() {
    if (!bcTx) return;
    const data = inSendData.get();
    if (data) {
        try {
            bcTx.postMessage(data);
        } catch (e) {
            op.warn("Failed to broadcast message: ", e);
        }
    }
}
