let microphone = null;
let mediaStream = null;
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

const inInputDevices = op.inDropDown("Audio Input", ["None"]);
const inGain = op.inFloatSlider("Volume", 1);
const inMute = op.inBool("Mute", false);
const inInit = op.inTriggerButton("Start");
const inStop = op.inTriggerButton("Stop");

const audioOut = op.outObject("Audio Out", null, "audioNode");
const recording = op.outBoolNum("Listening", false);
const outDevices = op.outArray("List of Input Devices");

op.setPortGroup("Volume Settings", [inGain, inMute]);

let audioDevices = []; // stores [{ label: "...", deviceId: "..." }, ...]
let audioInputsLoaded = false;
const gainNode = audioCtx.createGain();

op.onDelete = stopStream;

inInit.onTriggered = startStream;
inStop.onTriggered = stopStream;

inGain.onChange = () =>
{
    if (inMute.get()) return;
    gainNode.gain.setValueAtTime(Number(inGain.get()) || 0, audioCtx.currentTime);
};

inMute.onChange = () =>
{
    if (inMute.get())
    {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    else
    {
        gainNode.gain.setValueAtTime(Number(inGain.get()) || 0, audioCtx.currentTime);
    }
};

function enumerateInputs(cb)
{
    navigator.mediaDevices.enumerateDevices()
        .then((devices) =>
        {
            const audioInputDevices = devices
                .filter((device) => { return device.kind === "audioinput"; });

            audioDevices = audioInputDevices.map((device, index) => ({
                label: device.label || `microphone ${index + 1}`,
                deviceId: device.deviceId
            }));

            const names = audioDevices.map(d => d.label);
            inInputDevices.uiAttribs.values = names;
            outDevices.setRef(names);
            audioInputsLoaded = true;
            op.refreshParams();
            op.setUiError("devicesLoaded", null);
            if (cb) cb();
        })
        .catch((e) =>
        {
            op.log("[DesktopMicrophoneIn] error enumerating devices", e);
            op.setUiError("enumerateError", "Failed to load input devices: " + e.message, 1);
            if (cb) cb(e);
        });
}

function startStream()
{
    if (!audioCtx)
    {
        op.log("[DesktopMicrophoneIn] no audiocontext!");
        return;
    }

    stopStream();

    const proceedWithCapture = () =>
    {
        const deviceLabel = inInputDevices.get();
        if (deviceLabel === "None" || !deviceLabel)
        {
            recording.set(false);
            op.setUiError("noDeviceSelected", "No audio device selected!", 1);
            return;
        }
        else
        {
            op.setUiError("noDeviceSelected", null);
        }

        const matchedDevice = audioDevices.find(d => d.label === deviceLabel);
        
        // Exact mapping of device ID expected by Electron/Chromium
        const constraints = {
            "audio": matchedDevice ? { "deviceId": { "exact": matchedDevice.deviceId } } : true,
        };

        op.log("[DesktopMicrophoneIn] requesting stream with constraints: " + JSON.stringify(constraints));
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) =>
            {
                mediaStream = stream;
                microphone = audioCtx.createMediaStreamSource(stream);
                microphone.connect(gainNode);
                audioOut.set(gainNode);
                op.log("[DesktopMicrophoneIn] streaming microphone audio!", stream, microphone, gainNode);
                recording.set(true);
            })
            .catch((e) =>
            {
                op.log("[DesktopMicrophoneIn] ERROR STREAMING", e);
                op.setUiError("streamError", "Failed to capture microphone stream: " + e.message, 2);
                recording.set(false);
            });
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    {
        if (audioInputsLoaded)
        {
            proceedWithCapture();
        }
        else
        {
            // Initial call to getUserMedia to request browser permission dialog and then enumerate devices
            navigator.mediaDevices.getUserMedia({ "audio": true })
                .then((stream) =>
                {
                    // Immediately stop the temporary stream
                    const tracks = stream.getTracks();
                    tracks.forEach(t => t.stop());
                    
                    // Enumerate devices once permission has been granted
                    enumerateInputs(() => {
                        proceedWithCapture();
                    });
                })
                .catch((e) =>
                {
                    op.log("[DesktopMicrophoneIn] permission error", e);
                    op.setUiError("noPermission", "Microphone access denied: " + e.message, 2);
                    recording.set(false);
                });
        }
    }
    else
    {
        op.setUiError("unsupported", "MediaDevices API not supported in this browser environment.", 2);
        recording.set(false);
    }
}

function stopStream()
{
    recording.set(false);
    audioOut.set(null);

    if (microphone)
    {
        try { microphone.disconnect(); } catch (e) {}
        microphone = null;
    }

    if (mediaStream)
    {
        try
        {
            const tracks = mediaStream.getTracks();
            tracks.forEach((track) => { return track.stop(); });
        }
        catch (e) {}
        mediaStream = null;
    }
}

// Gentle initialization checking if permission was already granted previously
if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
{
    navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
            const hasLabels = devices.some(d => d.kind === "audioinput" && d.label);
            if (hasLabels) {
                // Permission has already been granted previously, we can enumerate immediately!
                enumerateInputs();
            }
        })
        .catch(() => {});
}
