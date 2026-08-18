const inChannel = op.inString("Channel", "default"),
    inSend = op.inTriggerButton("Send"),
    inObj = op.inObject("Event Object");

let bc = null;
inSend.onTriggered = send;

inChannel.onChange = () => {
    init();
};

function init() {
    if (bc) bc.close();
    bc = new BroadcastChannel(inChannel.get());
}

function send() {
    if (!bc) init();
    bc.postMessage(inObj.get());
}