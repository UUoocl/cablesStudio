// Interfaces 2026 – Stickman Sketch
//
// Default p5.js sketch that visualises MediaPipe Pose landmarks
// as a connected skeleton (stickman) using the data source interface.
// If optional hand landmarks are present on a frame, they are rendered and
// connected to the corresponding body wrist joints.
//
// The global `dataSource` object is injected by the Playground host page.
// Call `dataSource.getFrame()` in draw() to obtain the latest frame regardless
// of which data source is active (Database, Webcam, or WebSocket).
//
// Frame format: { index, timestamp, landmarks, rawJson }
//   landmarks – array of 33 points: [{ x, y, z, visibility }, …]
//               coordinates are normalised to [0, 1]; multiply by width/height.
//   null if no pose data is available yet.

// Skeleton connections – pairs of [from, to] landmark indices (MediaPipe Pose)
const CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7],
    [0, 4], [4, 5], [5, 6], [6, 8],
    // Shoulders
    [11, 12],
    // Left arm
    [11, 13], [13, 15],
    // Right arm
    [12, 14], [14, 16],
    // Torso
    [11, 23], [12, 24], [23, 24],
    // Left leg
    [23, 25], [25, 27], [27, 29], [27, 31],
    // Right leg
    [24, 26], [26, 28], [28, 30], [28, 32],
];

// MediaPipe Hand connections (same index order for left and right hands).
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [5, 9], [9, 10], [10, 11], [11, 12], // Middle
    [9, 13], [13, 14], [14, 15], [15, 16], // Ring
    [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [0, 17], // Palm edge
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    textSize(18);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(15, 15, 20);

    const frame = dataSource.getFrame();

    if (!frame) {
        // No frame has arrived yet – source not started or sketch just launched.
        fill(100, 100, 120);
        noStroke();
        text("Waiting for data…", width / 2, height / 2);
        fill(60, 60, 80);
        textSize(13);
        text("Start a data source in the control panel", width / 2, height / 2 + 30);
        textSize(18);
        return;
    }

    if (!frame.landmarks || frame.landmarks.length === 0) {
        // A frame arrived but it carries no pose landmarks.
        // This happens when pose estimation is off (webcam) or when the stored
        // rawdata does not contain MediaPipe landmark data.
        fill(200, 160, 60);
        noStroke();
        text("Frame received – no pose landmarks", width / 2, height / 2);
        fill(160, 120, 50);
        textSize(13);
        text(
            "frame #" + frame.index + " · " + dataSource.getName() +
            " – enable pose estimation or use MediaPipe data",
            width / 2, height / 2 + 30
        );
        textSize(18);
        return;
    }

    const lm = frame.landmarks;

    // Draw connections
    stroke(0, 220, 140);
    strokeWeight(2.5);
    for (const [a, b] of CONNECTIONS) {
        if (!lm[a] || !lm[b]) continue;
        const ax = lm[a].x * width;
        const ay = lm[a].y * height;
        const bx = lm[b].x * width;
        const by = lm[b].y * height;
        line(ax, ay, bx, by);
    }

    // Draw landmark dots
    noStroke();
    for (let i = 0; i < lm.length; i++) {
        if (!lm[i]) continue;
        // Highlight key joints
        const isKey = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(i);
        fill(isKey ? color(255, 80, 100) : color(80, 200, 255));
        const px = lm[i].x * width;
        const py = lm[i].y * height;
        ellipse(px, py, isKey ? 10 : 6, isKey ? 10 : 6);
    }

    // Draw optional hands when present.
    _drawHand(frame.leftHandLandmarks, lm[16], color(80, 180, 255));
    _drawHand(frame.rightHandLandmarks, lm[15], color(255, 170, 80));

    // HUD: frame info
    noStroke();
    fill(80, 80, 100);
    textSize(11);
    textAlign(LEFT, TOP);
    text(`frame #${frame.index}  |  source: ${dataSource.getName()}`, 8, 8);
    textAlign(CENTER, CENTER);
    textSize(18);
}

function _drawHand(handLandmarks, wristLandmark, handColor) {
    if (!handLandmarks || handLandmarks.length === 0) return;

    // Attach hand wrist root to corresponding body wrist.
    if (wristLandmark && handLandmarks[0]) {
        stroke(handColor);
        strokeWeight(2);
        line(
            wristLandmark.x * width,
            wristLandmark.y * height,
            handLandmarks[0].x * width,
            handLandmarks[0].y * height
        );
    }

    // Hand bone connections.
    stroke(handColor);
    strokeWeight(2);
    for (const [a, b] of HAND_CONNECTIONS) {
        if (!handLandmarks[a] || !handLandmarks[b]) continue;
        line(
            handLandmarks[a].x * width,
            handLandmarks[a].y * height,
            handLandmarks[b].x * width,
            handLandmarks[b].y * height
        );
    }

    // Hand points.
    noStroke();
    fill(handColor);
    for (let i = 0; i < handLandmarks.length; i++) {
        if (!handLandmarks[i]) continue;
        const size = i === 0 ? 7 : 5;
        ellipse(handLandmarks[i].x * width, handLandmarks[i].y * height, size, size);
    }
}