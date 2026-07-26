// p5js stickman example - adapted for Cables P5Instance Op
// Visualizes MediaPipe Pose landmarks as a connected skeleton and hands when present.

// SETTINGS / VARIABLES START
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

var LIVEMODE = false;
var DATA = [];
var index = 0;

// Standard MediaPipe Pose Landmark Connections
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

// Standard MediaPipe Hand Landmark Connections Map (from index to connected indices)
const HAND_MAP = {
    0: [1, 5, 17],
    1: [2],
    2: [3],
    3: [4],
    5: [6, 9],
    6: [7],
    7: [8],
    9: [10, 13],
    10: [11],
    11: [12],
    13: [14, 17],
    14: [15],
    15: [16],
    17: [18],
    18: [19],
    19: [20]
};

// Helper function to find a landmark by its body part index and category type
function find_by_bpindex(data_chunk, bpindex, type) {
    if (!data_chunk) return null;

    // If data_chunk is a flat array, it's just the pose landmarks array
    if (Array.isArray(data_chunk)) {
        if (type === "pose" || !type) {
            return data_chunk[bpindex] || null;
        }
        return null;
    }

    // If data_chunk is an object, resolve the appropriate array based on type
    let list = null;
    if (type === "left_hand" || type === "leftHand") {
        list = data_chunk.leftHandLandmarks || data_chunk.left_hand || data_chunk.leftHand;
    } else if (type === "right_hand" || type === "rightHand") {
        list = data_chunk.rightHandLandmarks || data_chunk.right_hand || data_chunk.rightHand;
    } else {
        list = data_chunk.landmarks || data_chunk.pose || data_chunk.poseLandmarks;
        // Unwrap 2D array if necessary
        if (list && Array.isArray(list[0])) {
            list = list[0];
        }
    }

    if (list && Array.isArray(list)) {
        return list[bpindex] || null;
    }

    return null;
}

// Draw the body stick figure pose
function draw_stickfigure(p, data_chunk) {
    if (!data_chunk) return;

    let lm = null;
    if (Array.isArray(data_chunk)) {
        lm = data_chunk;
    } else {
        lm = data_chunk.landmarks || data_chunk.pose || data_chunk.poseLandmarks;
        if (lm && Array.isArray(lm[0])) {
            lm = lm[0];
        }
    }

    if (!lm || !Array.isArray(lm)) return;

    // Draw connections
    p.stroke('white');
    p.strokeWeight(3);
    for (const [a, b] of CONNECTIONS) {
        if (!lm[a] || !lm[b]) continue;
        const ax = lm[a].x * p.width;
        const ay = lm[a].y * p.height;
        const bx = lm[b].x * p.width;
        const by = lm[b].y * p.height;
        p.line(ax, ay, bx, by);
    }

    // Draw landmark dots
    p.noStroke();
    p.fill('red');
    for (let i = 0; i < lm.length; i++) {
        if (!lm[i]) continue;
        const px = lm[i].x * p.width;
        const py = lm[i].y * p.height;
        p.ellipse(px, py, 8, 8);
    }
}

// Draw hand landmarks if present in data_chunk
function draw_hands(p, data_chunk) {
    p.stroke('white');
    p.strokeWeight(2);

    // Left hand
    for (let first_bpindex in HAND_MAP) {
        let point_list = HAND_MAP[first_bpindex];
        for (let pindex in point_list) {
            let second_bpindex = point_list[pindex];
            let first_point = find_by_bpindex(data_chunk, first_bpindex, "left_hand");
            let second_point = find_by_bpindex(data_chunk, second_bpindex, "left_hand");

            if (!first_point || !second_point) continue;

            let x1 = first_point.x * p.width;
            let x2 = second_point.x * p.width;
            let y1 = first_point.y * p.height;
            let y2 = second_point.y * p.height;

            p.line(x1, y1, x2, y2);
        }
    }

    // Right hand
    for (let first_bpindex in HAND_MAP) {
        let point_list = HAND_MAP[first_bpindex];
        for (let pindex in point_list) {
            let second_bpindex = point_list[pindex];
            let first_point = find_by_bpindex(data_chunk, first_bpindex, "right_hand");
            let second_point = find_by_bpindex(data_chunk, second_bpindex, "right_hand");

            if (!first_point || !second_point) continue;

            let x1 = first_point.x * p.width;
            let x2 = second_point.x * p.width;
            let y1 = first_point.y * p.height;
            let y2 = second_point.y * p.height;

            p.line(x1, y1, x2, y2);
        }
    }
}

// MAIN SKETCH EXPORT
export default function (p, op, w, h) {
    if (w) SCENE_WIDTH = w;
    if (h) SCENE_HEIGHT = h;

    p.onDataChange = function (cablesData) {
        if (!cablesData) return;

        LIVEMODE = true;
        if (cablesData.landmarks && cablesData.landmarks.length > 0) {
            DATA = [cablesData]; // Store the whole object
        } else if (Array.isArray(cablesData) && cablesData.length > 0) {
            DATA = [cablesData]; // Store as direct array of landmarks
        } else {
            LIVEMODE = false;
            return;
        }
        index = 0;
        p.loop(); // Ensure drawing loop runs
    };

    p.setup = function () {
        p.createCanvas(p.width || SCENE_WIDTH, p.height || SCENE_HEIGHT, p5_MODE);
        p.background('#212529');
        p.frameRate(FPS);
    };

    p.draw = function () {
        p.clear();
        p.background('#212529');

        let data_chunk = DATA[index];

        if (!data_chunk) {
            index = 0;
            return;
        }

        if (LIVEMODE) {
            for (let pose of DATA) {
                draw_stickfigure(p, pose);
                draw_hands(p, pose);
            }
        } else {
            draw_stickfigure(p, data_chunk);
            draw_hands(p, data_chunk);

            if (index >= DATA.length - 1) {
                index = 0;
            } else {
                index++;
            }
        }
    };
}
