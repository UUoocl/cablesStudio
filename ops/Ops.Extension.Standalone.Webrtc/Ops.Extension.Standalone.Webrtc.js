/**
 * Ops.Extension.Standalone.Webrtc
 * Establishes a generic peer-to-peer WebRTC connection between two local/networked machines
 * using SDP string copy-paste or custom patching transport logic.
 */

const
    inCreateOffer = op.inTriggerButton("Create Offer"),
    inRemoteSdp = op.inString("Remote SDP Input", ""),
    inSetRemoteSdp = op.inTriggerButton("Set Remote SDP"),
    inSendData = op.inTriggerButton("Send Data"),
    inDataToSend = op.inString("Data to Send", ""),
    inTargetCanvas = op.inObject("Target Canvas Object", null),
    inTargetAudio = op.inObject("Target Audio Stream", null),
    inVideoEncoding = op.inValueSelect("Video Encoding", ["H.264 no alpha", "VP9 with alpha", "HEVC with Alpha"], "H.264 no alpha"),

    outLocalSdp = op.outString("Local SDP Output", ""),
    outOnSdpGenerated = op.outTrigger("On SDP Generated"),
    outChannelStatus = op.outString("Channel Status", "Disconnected"),
    outOnDataReceived = op.outTrigger("On Data Received"),
    outReceivedData = op.outString("Received Data", ""),
    outHasAudio = op.outBool("Has Audio", false),
    outHasVideo = op.outBool("Has Video", false),
    outHasData = op.outBool("Has Data", false),
    outRemoteVideoElement = op.outObject("Remote Video Element"),
    outRemoteAudioStream = op.outObject("Remote Audio Stream");

let pc = null;
let dc = null;
let remoteStream = null;
let remoteVideoElement = null;

// Clean up resources when operator is deleted
op.onDelete = disconnect;

inCreateOffer.onTriggered = createOffer;
inSetRemoteSdp.onTriggered = setRemoteSdp;
inSendData.onTriggered = sendData;

function disconnect() {
    if (dc) {
        try {
            dc.close();
        } catch (e) {
            op.logWarn("[WebRTC] Error closing data channel:", e.message);
        }
        dc = null;
    }

    if (pc) {
        try {
            pc.close();
        } catch (e) {
            op.logWarn("[WebRTC] Error closing peer connection:", e.message);
        }
        pc = null;
    }

    if (remoteVideoElement) {
        try {
            remoteVideoElement.pause();
            remoteVideoElement.srcObject = null;
            if (remoteVideoElement.parentNode) {
                remoteVideoElement.parentNode.removeChild(remoteVideoElement);
            }
        } catch (e) {}
        remoteVideoElement = null;
    }
    outRemoteVideoElement.set(null);

    if (remoteStream) {
        try {
            remoteStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        remoteStream = null;
    }
    outRemoteAudioStream.set(null);

    outLocalSdp.set("");
    outChannelStatus.set("Disconnected");
    outHasAudio.set(false);
    outHasVideo.set(false);
    outHasData.set(false);
}

function setupPeerConnectionListeners() {
    pc.onicegatheringstatechange = () => {
        op.log(`[WebRTC] ICE Gathering State: ${pc.iceGatheringState}`);
        if (pc.iceGatheringState === "complete") {
            outputLocalSdp();
        }
    };

    pc.onconnectionstatechange = handleConnectionStateChange;
    pc.oniceconnectionstatechange = handleConnectionStateChange;

    pc.ontrack = (event) => {
        op.log(`[WebRTC] Received remote track: ${event.track.kind}`);
        
        if (!remoteStream) {
            remoteStream = new MediaStream();
            outRemoteAudioStream.set(remoteStream);
        }
        
        remoteStream.addTrack(event.track);

        if (event.track.kind === "video") {
            if (!remoteVideoElement) {
                remoteVideoElement = document.createElement("video");
                remoteVideoElement.autoplay = true;
                remoteVideoElement.playsInline = true;
                remoteVideoElement.muted = true; // Mute to support browser autoplay policies
                
                // Keep offscreen/hidden unless styled by the user
                remoteVideoElement.style.position = "absolute";
                remoteVideoElement.style.top = "-9999px";
                remoteVideoElement.style.left = "-9999px";
                remoteVideoElement.style.width = "1px";
                remoteVideoElement.style.height = "1px";
                document.body.appendChild(remoteVideoElement);
            }
            
            remoteVideoElement.srcObject = remoteStream;
            remoteVideoElement.play().catch(err => {
                op.logWarn("[WebRTC] Error playing video element:", err.message);
            });
            
            outRemoteVideoElement.set(remoteVideoElement);
            op.log("[WebRTC] Configured Remote Video Element.");
        }
    };
}

function createOffer() {
    disconnect();

    if (typeof RTCPeerConnection === "undefined") {
        op.logError("[WebRTC] RTCPeerConnection is not available.");
        outChannelStatus.set("Disconnected");
        return;
    }

    op.log("[WebRTC] Creating PeerConnection as Initiator...");
    outChannelStatus.set("Connecting");

    try {
        pc = new RTCPeerConnection({ iceServers: [] });
        setupPeerConnectionListeners();

        dc = pc.createDataChannel("cables-webrtc-data", { ordered: true });
        setupDataChannel(dc);

        // Process canvas and audio stream if attached
        addMediaTracks();
        applyCodecPreferences();

        pc.createOffer().then((offer) => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            if (pc.iceGatheringState === "complete") {
                outputLocalSdp();
            }
        }).catch((err) => {
            op.logError(`[WebRTC] Offer creation failed: ${err.message}`);
            outChannelStatus.set("Disconnected");
        });

    } catch (err) {
        op.logError(`[WebRTC] Failed in Initiator setup: ${err.message}`);
        outChannelStatus.set("Disconnected");
    }
}

function setRemoteSdp() {
    const remoteSdpStr = inRemoteSdp.get();
    if (!remoteSdpStr) {
        op.logWarn("[WebRTC] Remote SDP Input is empty.");
        return;
    }

    const trimmed = remoteSdpStr.trim();
    let descObj = null;

    if (trimmed.startsWith("{")) {
        try {
            descObj = JSON.parse(trimmed);
        } catch (e) {
            op.logError("[WebRTC] Failed to parse Remote SDP as JSON:", e.message);
            return;
        }
    } else if (trimmed.startsWith("v=")) {
        // Raw SDP format. Detect type based on existing connection
        const type = pc ? "answer" : "offer";
        descObj = {
            type: type,
            sdp: trimmed
        };
    } else {
        op.logError("[WebRTC] Remote SDP format unrecognized. Must be JSON or starting with 'v='");
        return;
    }

    if (!descObj || !descObj.type || !descObj.sdp) {
        op.logError("[WebRTC] Invalid SDP object structure.");
        return;
    }

    if (descObj.type === "offer") {
        // Receiver Flow
        disconnect();

        if (typeof RTCPeerConnection === "undefined") {
            op.logError("[WebRTC] RTCPeerConnection is not available.");
            outChannelStatus.set("Disconnected");
            return;
        }

        op.log("[WebRTC] Setting Remote Offer and creating Answer...");
        outChannelStatus.set("Connecting");

        try {
            pc = new RTCPeerConnection({ iceServers: [] });
            setupPeerConnectionListeners();

            pc.ondatachannel = (event) => {
                setupDataChannel(event.channel);
            };

            pc.setRemoteDescription(new RTCSessionDescription(descObj)).then(() => {
                // Add tracks on receiver before creating the answer so they are negotiated
                addMediaTracks();
                applyCodecPreferences();
                return pc.createAnswer();
            }).then((answer) => {
                return pc.setLocalDescription(answer);
            }).then(() => {
                if (pc.iceGatheringState === "complete") {
                    outputLocalSdp();
                }
            }).catch((err) => {
                op.logError(`[WebRTC] Failed in Receiver handshake: ${err.message}`);
                outChannelStatus.set("Disconnected");
            });

        } catch (err) {
            op.logError(`[WebRTC] Failed in Receiver setup: ${err.message}`);
            outChannelStatus.set("Disconnected");
        }

    } else if (descObj.type === "answer") {
        // Initiator Finalization Flow
        if (!pc) {
            op.logError("[WebRTC] PeerConnection not initialized. You must click 'Create Offer' first if you are the Initiator.");
            return;
        }

        op.log("[WebRTC] Setting Remote Answer...");
        pc.setRemoteDescription(new RTCSessionDescription(descObj)).then(() => {
            updateChannelStatus();
            updateTrackInspectors();
        }).catch((err) => {
            op.logError(`[WebRTC] Failed to set remote answer: ${err.message}`);
        });
    } else {
        op.logError(`[WebRTC] Unsupported SDP type: ${descObj.type}`);
    }
}

function outputLocalSdp() {
    if (!pc || !pc.localDescription) return;
    const sdpStr = JSON.stringify(pc.localDescription, null, 2);
    outLocalSdp.set(sdpStr);
    updateTrackInspectors();
    outOnSdpGenerated.trigger();
    op.log("[WebRTC] Local SDP generated and outputted.");
}

function addMediaTracks() {
    if (!pc) return;

    // Target Canvas Object
    const canvas = inTargetCanvas.get();
    if (canvas) {
        try {
            if (typeof canvas.captureStream === "function") {
                const stream = canvas.captureStream(30);
                stream.getVideoTracks().forEach(track => {
                    pc.addTrack(track, stream);
                    op.log("[WebRTC] Added video track from canvas.");
                });
            } else if (canvas.canvas && typeof canvas.canvas.captureStream === "function") {
                const stream = canvas.canvas.captureStream(30);
                stream.getVideoTracks().forEach(track => {
                    pc.addTrack(track, stream);
                    op.log("[WebRTC] Added video track from wrapped canvas.");
                });
            } else {
                op.logWarn("[WebRTC] Target Canvas Object does not support captureStream.");
            }
        } catch (err) {
            op.logError("[WebRTC] Failed to add canvas track:", err.message);
        }
    }

    // Target Audio Stream
    const audioStream = inTargetAudio.get();
    if (audioStream) {
        try {
            let stream = audioStream;
            let isMediaStream = false;
            try {
                if (typeof MediaStream !== "undefined" && stream instanceof MediaStream) {
                    isMediaStream = true;
                }
            } catch (e) {}

            let isWrappedMediaStream = false;
            try {
                if (stream.stream && typeof MediaStream !== "undefined" && stream.stream instanceof MediaStream) {
                    isWrappedMediaStream = true;
                }
            } catch (e) {}

            if (isWrappedMediaStream) {
                stream = stream.stream;
                isMediaStream = true;
            }

            if (isMediaStream && typeof stream.getAudioTracks === "function") {
                stream.getAudioTracks().forEach(track => {
                    pc.addTrack(track, stream);
                    op.log("[WebRTC] Added audio track from media stream.");
                });
            } else {
                op.logWarn("[WebRTC] Target Audio Stream is not a MediaStream or doesn't support getAudioTracks.");
            }
        } catch (err) {
            op.logError("[WebRTC] Failed to add audio track:", err.message);
        }
    }
}

function setCodecPreference(transceiver, encodingName) {
    if (!RTCRtpReceiver || typeof RTCRtpReceiver.getCapabilities !== "function") {
        op.logWarn("[WebRTC] RTCRtpReceiver.getCapabilities is not supported by this browser.");
        return;
    }
    const capabilities = RTCRtpReceiver.getCapabilities("video");
    if (!capabilities || !capabilities.codecs) {
        op.logWarn("[WebRTC] No video codecs found in capabilities.");
        return;
    }

    let targetMimes = [];
    if (encodingName === "H.264 no alpha") {
        targetMimes.push("video/h264");
    } else if (encodingName === "VP9 with alpha") {
        targetMimes.push("video/vp9");
    } else if (encodingName === "HEVC with Alpha") {
        targetMimes.push("video/hevc", "video/h265");
    }

    if (targetMimes.length === 0) return;

    const codecs = capabilities.codecs;
    const preferred = codecs.filter(c => targetMimes.includes(c.mimeType.toLowerCase()));
    const others = codecs.filter(c => !targetMimes.includes(c.mimeType.toLowerCase()));

    if (preferred.length === 0) {
        op.logWarn(`[WebRTC] Preferred codec ${targetMimes.join("/")} is not supported by this browser.`);
        return;
    }

    const orderedCodecs = [...preferred, ...others];
    try {
        if (typeof transceiver.setCodecPreferences === "function") {
            transceiver.setCodecPreferences(orderedCodecs);
            op.log(`[WebRTC] Set codec preferences to prefer: ${targetMimes.join("/")}`);
        } else {
            op.logWarn("[WebRTC] RTCRtpTransceiver.setCodecPreferences is not supported by this browser.");
        }
    } catch (err) {
        op.logError(`[WebRTC] Failed to set codec preferences: ${err.message}`);
    }
}

function applyCodecPreferences() {
    if (!pc) return;
    const encoding = inVideoEncoding.get();
    if (!encoding) return;

    const transceivers = pc.getTransceivers();
    const videoTransceiver = transceivers.find(t => 
        (t.receiver && t.receiver.track && t.receiver.track.kind === "video") || 
        (t.sender && t.sender.track && t.sender.track.kind === "video")
    );

    if (videoTransceiver) {
        setCodecPreference(videoTransceiver, encoding);
    } else {
        op.log("[WebRTC] No active video transceiver found to apply codec preferences.");
    }
}

function inspectSdp(sdpString) {
    if (!sdpString) return { audio: false, video: false, data: false };
    const lines = sdpString.split("\n");
    let audio = false;
    let video = false;
    let data = false;
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith("m=audio")) {
            audio = true;
        } else if (line.startsWith("m=video")) {
            video = true;
        } else if (line.startsWith("m=application") || line.includes("webrtc-datachannel") || line.includes("sctp")) {
            data = true;
        }
    }
    return { audio, video, data };
}

function updateTrackInspectors() {
    let sdpText = "";
    if (pc) {
        if (pc.localDescription && pc.localDescription.sdp) {
            sdpText += pc.localDescription.sdp + "\n";
        }
        if (pc.remoteDescription && pc.remoteDescription.sdp) {
            sdpText += pc.remoteDescription.sdp + "\n";
        }
    }
    const inspection = inspectSdp(sdpText);
    outHasAudio.set(inspection.audio);
    outHasVideo.set(inspection.video);
    outHasData.set(inspection.data);
}

function handleConnectionStateChange() {
    if (!pc) return;
    op.log(`[WebRTC] ConnectionState: ${pc.connectionState} | IceConnectionState: ${pc.iceConnectionState}`);
    updateChannelStatus();
    updateTrackInspectors();
}

function updateChannelStatus() {
    if (!pc) {
        outChannelStatus.set("Disconnected");
        return;
    }

    const state = pc.connectionState;
    const iceState = pc.iceConnectionState;

    if (state === "closed" || iceState === "closed") {
        outChannelStatus.set("Closed");
        return;
    }

    if (state === "failed" || iceState === "failed" || state === "disconnected" || iceState === "disconnected") {
        outChannelStatus.set("Disconnected");
        return;
    }

    if (state === "connected" || iceState === "connected" || iceState === "completed") {
        if (dc && dc.readyState === "open") {
            outChannelStatus.set("Open");
        } else {
            outChannelStatus.set("Connecting");
        }
        return;
    }

    if (state === "connecting" || iceState === "checking" || pc.iceGatheringState === "gathering") {
        outChannelStatus.set("Connecting");
        return;
    }

    outChannelStatus.set("Disconnected");
}

function setupDataChannel(channel) {
    dc = channel;

    dc.onopen = () => {
        op.log("[WebRTC] Data channel is open.");
        updateChannelStatus();
    };

    dc.onclose = () => {
        op.log("[WebRTC] Data channel closed.");
        updateChannelStatus();
    };

    dc.onerror = (err) => {
        op.logError(`[WebRTC] Data channel error: ${err.message || String(err)}`);
    };

    dc.onmessage = (event) => {
        outReceivedData.set(event.data);
        outOnDataReceived.trigger();
    };
}

function sendData() {
    if (!dc || dc.readyState !== "open") {
        op.logWarn("[WebRTC] Cannot send data: data channel is not open.");
        return;
    }
    const payload = inDataToSend.get() || "";
    try {
        dc.send(payload);
        op.log("[WebRTC] Sent data:", payload);
    } catch (err) {
        op.logError(`[WebRTC] Failed to send data: ${err.message}`);
    }
}
