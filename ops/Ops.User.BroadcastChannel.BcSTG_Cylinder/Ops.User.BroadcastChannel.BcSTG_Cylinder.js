const
    channelName = op.inString("Channel Name", "defaultChannel"),
    inPreset = op.inString("Preset", "reset"),
    inText = op.inString("Text", "SPACE-TYPE-GENERATOR"),
    inRadius = op.inValue("Radius", 250),
    inStackNum = op.inInt("Stack Num", 1),
    inRRotate = op.inValue("Rotation Speed", -5),
    inROffset = op.inValue("Ring Offset", 0),
    inRWaveCount = op.inValue("Wave Count", 2),
    inRWaveSpeed = op.inValue("Wave Speed", 0),
    inRWave = op.inValue("Wave Intensity", 0),
    inRZaxis = op.inValue("Ripple Intensity", 0),
    inStrecherX = op.inValue("Stretch X", 0),
    inStrecherY = op.inValue("Stretch Y", 0),
    inTypeX = op.inValue("Font Width", 20),
    inTypeY = op.inValue("Font Height", 40),
    inTypeStroke = op.inValue("Stroke Thickness", 2),
    inXRotCamera = op.inValue("Camera X Rot", 15),
    inYRotCamera = op.inValue("Camera Y Rot", 0),
    inZRotCamera = op.inValue("Camera Z Rot", 0),
    inZoomCamera = op.inValue("Camera Zoom", 0),
    inBkgdColor = op.inString("Background Color", "#ffffff"),
    inColor1 = op.inString("Text Color", "#000000"),
    outDraw = op.outTrigger("On Draw"),
    outReady = op.outTrigger("On Ready"),
    outMessage = op.outObject("Message Received");

let pubChannel = null;
let subChannel = null;

function initChannels() {
    // Close existing channels
    if (pubChannel) {
        pubChannel.close();
        pubChannel = null;
    }
    if (subChannel) {
        subChannel.close();
        subChannel = null;
    }

    const cName = channelName.get();
    if (!cName) return;

    // pub-channel is for receiving messages FROM the sketch (e.g. draw signals)
    pubChannel = new BroadcastChannel('pub-' + cName);
    // sub-channel is for sending messages TO the sketch (e.g. settings)
    subChannel = new BroadcastChannel('sub-' + cName);

    pubChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'draw') {
            outDraw.trigger();
        }
        if (event.data && event.data.type === 'ready') {
            outReady.trigger();
        }
        outMessage.setRef(event.data);
    };


    subChannel.onmessage = (event) => {
        // Typically the sketch listens here, but we can log for debugging
        // console.log('sub message (sent to sketch):', event.data);
    };
}

channelName.onChange = initChannels;

function broadcastData() {
    if (!subChannel) return;

    const data = {
        preset: inPreset.get(),
        text: inText.get(),
        radius: inRadius.get(),
        stackNum: inStackNum.get(),
        rRotate: inRRotate.get(),
        rOffset: inROffset.get(),
        rWaveCount: inRWaveCount.get(),
        rWaveSpeed: inRWaveSpeed.get(),
        rWave: inRWave.get(),
        rZaxis: inRZaxis.get(),
        strecherX: inStrecherX.get(),
        strecherY: inStrecherY.get(),
        typeX: inTypeX.get(),
        typeY: inTypeY.get(),
        typeStroke: inTypeStroke.get(),
        xRotCamera: inXRotCamera.get(),
        yRotCamera: inYRotCamera.get(),
        zRotCamera: inZRotCamera.get(),
        zoomCamera: inZoomCamera.get(),
        bkgdColor: inBkgdColor.get(),
        color1: inColor1.get()
    };

    try {
        subChannel.postMessage(data);
    } catch (e) {
        op.warn("Failed to broadcast message: ", e);
    }
}

// Trigger broadcast on any input change
const inputs = [
    inPreset, inText, inRadius, inStackNum, inRRotate, inROffset,
    inRWaveCount, inRWaveSpeed, inRWave, inRZaxis, inStrecherX, inStrecherY,
    inTypeX, inTypeY, inTypeStroke, inXRotCamera, inYRotCamera, inZRotCamera,
    inZoomCamera, inBkgdColor, inColor1
];

inputs.forEach(input => {
    input.onChange = broadcastData;
});

// Initial setup
initChannels();

// Cleanup on operator delete
op.onDelete = () => {
    if (pubChannel) pubChannel.close();
    if (subChannel) subChannel.close();
};

