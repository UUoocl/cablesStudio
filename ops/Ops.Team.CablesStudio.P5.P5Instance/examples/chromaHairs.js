// https://openprocessing.org/sketch/1198049 by Spencer Eastcott
// Adapted for Cables P5Instance Op.

// SETTINGS / VARIABLES START
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

// MAIN PART START
export default function (p, op, w, h) {
    let currentWidth = w || SCENE_WIDTH;
    let currentHeight = h || SCENE_HEIGHT;

    // Local state to avoid collision across operator instances
    let LIVEMODE = false;
    let DATA = [];
    let index = 0;

    let margin = 50;
    let stepX;
    let stepY;
    let cols = 10;
    let rows = 10;
    let hairLength = 0.03;
    let maxHairLength = 40;
    let scale_factor = 200;
    let gradientLength;
    let radiusOffset;

    const hair = function (x, y, joint) {
        var a = p.atan2(
            (joint.x * p.width) - x,
            (joint.y * p.height) - y
        ) + p.PI;
        var d = scale_factor / p.pow(
            p.dist(
                (joint.x * p.width),
                (joint.y * p.height), x, y
            ) * hairLength,
            2
        );
        var D = p.dist(
            (joint.x * p.width),
            (joint.y * p.height),
            x,
            y
        ) + radiusOffset;

        var g = p.sin(D * (p.TWO_PI / gradientLength)) * 255 / 2 + (255 / 2);
        var r = p.sin(D * (p.TWO_PI / gradientLength) + p.TWO_PI / 3) * 255 / 2 + (255 / 2);
        var b = p.sin(D * (p.TWO_PI / gradientLength) + (p.TWO_PI / 3) * 2) * 255 / 2 + (255 / 2);

        if (d > maxHairLength) {
            d = maxHairLength;
        }

        p.strokeWeight(4);
        p.stroke(r, g, b);
        p.line(x, y, (p.sin(a) * d) + x, (p.cos(a) * d) + y);
    };

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
        p.createCanvas(p.width || currentWidth, p.height || currentHeight, p5_MODE);
        p.frameRate(FPS);
    };

    p.draw = function () {
        p.background('#212529');

        // Prevent infinite loops and invalid dimensions
        if (p.width <= 2 * margin || p.height <= 2 * margin) {
            return;
        }

        stepX = (p.width - (2 * margin)) / (rows - 1);
        stepY = (p.height - (2 * margin)) / (cols - 1);
        gradientLength = p.width;
        radiusOffset = -p.width / 10;

        if (stepX <= 0 || stepY <= 0) {
            return; // Safety guard to prevent freezing / infinite loops
        }

        let data_chunk = DATA[index];

        if (!data_chunk) {
            index = 0;
            return;
        }

        // Extract landmarks exactly like stickman.js
        let lm = null;
        if (Array.isArray(data_chunk)) {
            lm = data_chunk;
        } else {
            lm = data_chunk.landmarks || data_chunk.pose || data_chunk.poseLandmarks;
            if (lm && Array.isArray(lm[0])) {
                lm = lm[0];
            }
        }

        if (lm) {
            if (!LIVEMODE) {
                for (let joint of lm) {
                    if (!joint) continue;
                    for (var x = margin; x < p.width - margin + 1; x += stepX) {
                        for (var y = margin; y < p.height - margin + 1; y += stepY) {
                            hair(x, y, joint);
                        }
                    }
                }
                if (index < DATA.length - 1) {
                    index++;
                } else {
                    index = 0;
                }
            } else {
                for (let poseObject of DATA) {
                    let poseLm = null;
                    if (Array.isArray(poseObject)) {
                        poseLm = poseObject;
                    } else {
                        poseLm = poseObject.landmarks || poseObject.pose || poseObject.poseLandmarks;
                        if (poseLm && Array.isArray(poseLm[0])) {
                            poseLm = poseLm[0];
                        }
                    }

                    if (poseLm) {
                        for (let joint of poseLm) {
                            if (!joint) continue;
                            for (var x = margin; x < p.width - margin + 1; x += stepX) {
                                for (var y = margin; y < p.height - margin + 1; y += stepY) {
                                    hair(x, y, joint);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}