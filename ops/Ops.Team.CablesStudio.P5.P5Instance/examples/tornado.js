// p5js - "tornado taz" visuals demo

// Intended to give an example on how to work with DATA similar
// to the stickman example, but with more interesting curves between
// somehow arbitrary joints

// edginess, green color value and alpha are calculated via z-coordinate
// differences of lines defined below
// use these values for scaling and tinkering on the effect of z-axis
// differences
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

// MAIN PART START
export default function (p, op, w, h) {
    let currentWidth = w || SCENE_WIDTH;
    let currentHeight = h || SCENE_HEIGHT;

    var edginess_scale = 40; // high value: bezier slowly becomes a line
    var green_scale = 300; // color intensity z-axis differences "sensibility"
    var alpha_scale = 400; // lower value: only draw/highlight high z-axis differences 

    var start_frame = 0;

    // time-based red color scaling
    var step_red_scale = 150;

    // we don't need each frame? use this to control frame step size
    var step_size = 5;  // higher value = use less frames for complete image

    // precalcultate number of steps to be drawn
    var steps = 0;

    // derived from
    // https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md
    // ... but connected in "nonhuman" way ( e.g. nose and ankles aka 0: [27, 28] )
    var curve_map = {
        0: [27, 28],
        11: [12, 25, 27],
        12: [26, 28],
        13: [14, 27],
        14: [28],
        27: [28],
        15: [16, 27],
        16: [28],
        25: [26],
    };

    let LIVEMODE = false;
    let DATA = [];
    let index = start_frame;
    let cur_step = 0;

    function find_by_bpindex(data_chunk, bpindex, type) {
        if (!data_chunk) return null;

        // If data_chunk is a flat array, it's just the pose landmarks array
        if (Array.isArray(data_chunk)) {
            if (type === "pose" || type === "body" || !type) {
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
        index = start_frame;
        cur_step = 0;
        steps = (DATA.length - start_frame) / step_size;
        p.loop(); // Ensure drawing loop runs
    };

    p.setup = function () {
        p.createCanvas(p.width || currentWidth, p.height || currentHeight, p5_MODE);
        p.background('black');
        p.frameRate(FPS);
    };

    p.draw = function () {
        let currentW = p.width || currentWidth;
        let currentH = p.height || currentHeight;

        // background
        p.noStroke();
        p.fill(0, 1);
        p.rect(0, 0, currentW, currentH);

        // fetch current data_chunk aka frame
        let data_chunk = DATA[index];

        // early exit data check
        if (!data_chunk) {
            if (LIVEMODE) {
                index = 0;
                cur_step = 0;
            } else {
                p.noLoop();
                return;
            }
        }

        // loop to create taz body from curve_map
        for (let first_bpindex in curve_map) {
            let point_list = curve_map[first_bpindex];
            for (let pindex in point_list) {
                let second_bpindex = point_list[pindex];
                let first_point = find_by_bpindex(data_chunk, first_bpindex, "body");
                let second_point = find_by_bpindex(data_chunk, second_bpindex, "body");

                // make sure we've found useful data, skip if not found
                if (!first_point || !second_point) {
                    continue;
                }

                // make sure to multiply normalized coordinates to get correct coordinates
                let x1 = first_point.x * currentW;
                let x2 = second_point.x * currentW;
                let y1 = first_point.y * currentH;
                let y2 = second_point.y * currentH;

                // z-axis difference calculations
                let z_dist = first_point.z - second_point.z;
                let z_abs = p.abs(z_dist);
                let green = z_abs * green_scale;
                let alpha = z_abs * alpha_scale;
                let edginess = z_dist * edginess_scale;

                // decrease red color by time passed
                let red = step_red_scale - (steps > 0 ? (cur_step / steps) * step_red_scale : 0);

                p.stroke(red, green, 0, alpha);

                p.bezier(
                    x1, y1,
                    x1 + (currentW / edginess), y1 + (currentH / edginess),
                    x2 - (currentW / edginess), y2 + (currentH / edginess),
                    x2, y2
                );
            }
        }

        // loop over DATA via index variable
        if (index >= DATA.length - 1) {
            if (LIVEMODE) {
                index = 0;
                cur_step = 0;
            } else {
                p.noLoop();
                return;
            }
        } else {
            // increment index for next run of draw() to create next frame
            index = index + step_size;
            // ... also memorize real step count
            cur_step++;
        }
    };
}