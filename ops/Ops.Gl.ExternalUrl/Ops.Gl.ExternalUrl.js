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
let iframe = null;
let channel = null;

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
    if (subWindow) subWindow.resizeTo(inSizeX.get(), inSizeY.get());
}

function move() {
    if (subWindow) subWindow.moveTo(inPosX.get(), inPosY.get());
}

inTitle.onChange = () => {
    if (subWindow) subWindow.document.title = inTitle.get();
};

inUrl.onChange = () => {
    if (iframe) {
        iframe.src = inUrl.get();
    }
};

function close() {
    if (subWindow) subWindow.close();
    subWindow = null;
    iframe = null;
}

function fullscreen() {
    if (!subWindow) return;
    const elem = subWindow.document.body;
    if (elem.requestFullScreen) elem.requestFullScreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullScreen) elem.webkitRequestFullScreen();
    else if (elem.msRequestFullScreen) elem.msRequestFullScreen();
}

inOpen.onTriggered = () => {
    if (subWindow) close();
    let id = CABLES.uuid();
    subWindow = window.open("", "view#" + id, "width=" + inSizeX.get() + ",height=" + inSizeY.get() + ",directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true");
    if (!subWindow) return;

    let document = subWindow.document;
    document.title = inTitle.get();

    let body = document.body;
    let bgColor = "#000";
    if (inTransparent.get()) bgColor = "transparent";
    body.style = "padding:0px;margin:0px;background-color:" + bgColor + ";overflow:hidden;";

    // Create iframe to host the target URL safely (blank window + iframe avoids Electron blocking external URLs)
    iframe = document.createElement("iframe");
    iframe.src = inUrl.get();
    iframe.style = "border:none;width:100%;height:100%;position:absolute;top:0;left:0;";
    if (inTransparent.get()) {
        iframe.style.backgroundColor = "transparent";
        iframe.setAttribute("allowtransparency", "true");
    }
    body.appendChild(iframe);

    outEle.setRef(body);

    onSize();
    move();

    subWindow.addEventListener("resize", () => {
        onSize();
    });

    subWindow.addEventListener("beforeunload", close, false);
};

inUpdate.onTriggered = () => {
    next.trigger();

    if (channel) {
        channel.postMessage({
            "type": "url_update",
            "key": op.id,
            "url": inUrl.get(),
            "windowState": subWindow ? "open" : "closed"
        });
    }
};
