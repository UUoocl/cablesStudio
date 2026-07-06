const
    inUpdate = op.inTrigger("Update"),
    next = op.outTrigger("Next"),
    inUrl = op.inString("URL", ""),
    inChannelName = op.inString("Broadcast Channel Name", "url-sync"),
    inPosX = op.inInt("Pos X", 0),
    inPosY = op.inInt("Pos Y", 0),
    inSizeX = op.inInt("Width", 800),
    inSizeY = op.inInt("Height", 480),
    inTransparent = op.inBool("Transparent background"),
    inTitle = op.inString("Title", "cables window"),
    inOpen = op.inTriggerButton("Open Window"),
    inFull = op.inTriggerButton("Fullscreen"),
    outEle = op.outObject("Element", null, "element"),
    inClose = op.inTriggerButton("Close");

let subWindow = null;
let currentFrameName = null;
let channel = null;

let ipcRenderer = null;
try {
    ipcRenderer = op.require("electron").ipcRenderer;
} catch (e) {
    // Not running inside Electron/Node environment
}

op.toWorkPortsNeedToBeLinked(inUpdate, next);
op.setPortGroup("Size", [inSizeX, inSizeY]);
op.setPortGroup("Position", [inPosY, inPosX]);

inClose.onTriggered = close;
inFull.onTriggered = fullscreen;
op.onDelete = () => {
    close();
    if (channel) {
        channel.close();
        channel = null;
    }
};

window.addEventListener("beforeunload", close, false);

inChannelName.onChange = updateChannel;
inPosY.onChange = inPosX.onChange = move;
inSizeY.onChange = inSizeX.onChange = onSize;

// Initialize Broadcast Channel
updateChannel();

function updateChannel() {
    if (channel) {
        channel.close();
    }
    const name = inChannelName.get();
    if (name) {
        channel = new BroadcastChannel(name);
    } else {
        channel = null;
    }
}

function onSize() {
    if (subWindow) {
        try {
            subWindow.resizeTo(inSizeX.get(), inSizeY.get());
        } catch (e) {
            // Ignore potential cross-origin access issues
        }
        if (ipcRenderer && currentFrameName) {
            ipcRenderer.send("resize-child-window", {
                "frameName": currentFrameName,
                "w": inSizeX.get(),
                "h": inSizeY.get()
            });
        }
    }
}

function move() {
    if (subWindow) {
        try {
            subWindow.moveTo(inPosX.get(), inPosY.get());
        } catch (e) {
            // Ignore potential cross-origin access issues
        }
        if (ipcRenderer && currentFrameName) {
            ipcRenderer.send("move-child-window", {
                "frameName": currentFrameName,
                "x": inPosX.get(),
                "y": inPosY.get()
            });
        }
    }
}

inTitle.onChange = () => {
    if (subWindow) {
        try {
            subWindow.document.title = inTitle.get();
        } catch (e) {
            // Ignore cross-origin access issues
        }
    }
};

inUrl.onChange = () => {
    if (subWindow && !subWindow.closed) {
        try {
            subWindow.location.href = inUrl.get();
        } catch (e) {
            // Ignore cross-origin access issues
        }
    }
};

function close() {
    if (subWindow) subWindow.close();
    subWindow = null;
    currentFrameName = null;
}

function fullscreen() {
    if (!subWindow) return;
    try {
        const elem = subWindow.document.body;
        if (elem.requestFullScreen) elem.requestFullScreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullScreen) elem.webkitRequestFullScreen();
        else if (elem.msRequestFullScreen) elem.msRequestFullScreen();
    } catch (e) {
        // Ignore cross-origin access issues
    }
}

inOpen.onTriggered = () => {
    if (subWindow) close();
    let id = CABLES.uuid();
    currentFrameName = "view#" + id;
    
    let features = `width=${inSizeX.get()},height=${inSizeY.get()},directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true`;
    if (inTransparent.get()) {
        features += ",transparent=true,frame=false";
    }

    subWindow = window.open(inUrl.get(), currentFrameName, features);
    if (!subWindow) return;

    try {
        let document = subWindow.document;
        document.title = inTitle.get();
        let body = document.body;
        let bgColor = "#000";
        if (inTransparent.get()) bgColor = "transparent";
        body.style = "padding:0px;margin:0px;background-color:" + bgColor + ";overflow:hidden;";
        outEle.setRef(body);
    } catch (e) {
        // Safe fallback for cross-origin URLs
        outEle.setRef(null);
    }

    onSize();
    move();
};

inUpdate.onTriggered = () => {
    next.trigger();

    if (subWindow && subWindow.closed) {
        close();
    }

    if (channel) {
        channel.postMessage({
            "type": "url_update",
            "key": op.id,
            "url": inUrl.get(),
            "windowState": subWindow ? "open" : "closed"
        });
    }
};
