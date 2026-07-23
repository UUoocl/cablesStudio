let speed = 1.0;
let channel = null;
let w = 400;
let h = 300;

// Web Audio variables for testing sound capture
let audioCtx = null;
let oscillator = null;
let isPlaying = false;

function setup() {
    createCanvas(w, h, WEBGL);

    // Setup BroadcastChannel to communicate with Cables
    channel = new BroadcastChannel("cables_iframe_channel");

    // Broadcast loaded event to Cables parent
    console.log("[SampleSketch] Setup complete. Broadcasting loaded event.");
    channel.postMessage({ type: "SKETCH_LOADED", timestamp: Date.now() });

    // Listen for variable changes from Cables
    channel.onmessage = (e) => {
        console.log("[SampleSketch] Received message from parent:", e.data);
        if (e.data && e.data.type === "SET_VAR") {
            if (e.data.key === "speed") {
                speed = parseFloat(e.data.value);
                console.log("[SampleSketch] Updated speed to:", speed);
            }
            if (e.data.key === "width") {
                w = parseFloat(e.data.value);
                console.log("[SampleSketch] Updated w to:", w);
                resizeCanvas(w, h);
            }
            if (e.data.key === "height") {
                h = parseFloat(e.data.value);
                console.log("[SampleSketch] Updated h to:", h);
                resizeCanvas(w, h);
            }
        }
    };
}

function draw() {
    clear(); // Keep background transparent for alpha transfer

    // Change background slightly when sound is playing to give visual feedback
    if (isPlaying) {
        background(30, 40, 50);
    } else {
        background(0, 0, 0, 0); // transparent
    }

    rotateY(frameCount * 0.01 * speed);
    normalMaterial();
    box(200);
}

// Mouse pressed starts/stops a test tone to verify audio capture
function mousePressed() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    if (!isPlaying) {
        oscillator = audioCtx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note

        // Intercepted connection target
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        isPlaying = true;
        console.log("[SampleSketch] Audio started. 440Hz tone playing.");
    } else {
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        }
        isPlaying = false;
        console.log("[SampleSketch] Audio stopped.");
    }
}