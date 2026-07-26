// https://openprocessing.org/sketch/1678056 by Naoki Tsutae
// Inspired by Sage Jenson (https://cargocollective.com/sagejenson/physarum)
// Adapted for Cables P5Instance Op.

// SETTINGS / VARIABLES START
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

var antColor = new Uint8Array([255, 255, 255]);
var antsNum = 2750;
var sensorOffset = 25;
var clockwise = 15;
var counter = -15;
var stroke_width = 20;

// MAIN PART START
export default function (p, op, w, h) {
    let currentWidth = w || SCENE_WIDTH;
    let currentHeight = h || SCENE_HEIGHT;

    // Local state to avoid collision across operator instances
    let LIVEMODE = false;
    let DATA = [];
    let index = 0;

    const ant = () => ({
        x: p.width / 2,
        y: p.height / 2,
        angle: p.random(360),
        step: p.random(2, 3),
    });

    const ants = {
        ants: [],

        init() {
            this.ants.length = 0;
            for (let i = antsNum; i--;) this.ants.push(ant());
        },

        smell(a, d) {
            const aim = a.angle + d;
            let x = 0 | (a.x + sensorOffset * p.cos(aim));
            let y = 0 | (a.y + sensorOffset * p.sin(aim));
            x = (x + p.width) % p.width;
            y = (y + p.height) % p.height;

            const index = (x + y * p.width) * 4;
            return p.pixels[index]; // Only get red channel
        },

        updateAngle() {
            for (const a of this.ants) {
                const right = this.smell(a, clockwise),
                    center = this.smell(a, 0),
                    left = this.smell(a, counter);
                if (center > left && center > right) {
                    /* Carry on straight */
                } else if (left < right) a.angle += clockwise;
                else if (left > right) a.angle += counter;
            }
        },

        updatePosition() {
            for (const a of this.ants) {
                a.x += p.cos(a.angle) * a.step;
                a.y += p.sin(a.angle) * a.step;
                a.x = (a.x + p.width) % p.width;
                a.y = (a.y + p.height) % p.height;

                const index = ((0 | a.x) + (0 | a.y) * p.width) * 4;
                p.pixels.set(antColor, index);
            }
        },
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
        p.angleMode(p.DEGREES);
        p.pixelDensity(1);
        p.background(0); // Initialize trail
        ants.init();
    };

    p.draw = function () {
        p.background(0, 5); // Update trail
        p.stroke(255);
        p.strokeWeight(stroke_width);

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
                    p.line(
                        joint.x * p.width,
                        joint.y * p.height,
                        joint.x * p.width + 1,
                        joint.y * p.height + 1
                    );
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
                            p.line(
                                joint.x * p.width,
                                joint.y * p.height,
                                joint.x * p.width + 1,
                                joint.y * p.height + 1
                            );
                        }
                    }
                }
            }
        }

        p.loadPixels();
        for (let i = 2; i--;) {
            ants.updateAngle();
            ants.updatePosition();
        }
        p.updatePixels();
    };
}