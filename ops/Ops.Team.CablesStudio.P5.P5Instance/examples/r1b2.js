// p5js advanced example by r1b2 - Modernized for Cables MediaPipe integration

// SETTINGS/ VARIABLES START
var EPHEMERAL = false;
var EPHEMERAL_ALPHA = 10;
var SCENE_SCALE = 1;
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

var LIVEMODE = false;
var DATA = []; // This will hold our live landmarks
var JOINTS_BY_NAME = {}; // For legacy compatibility

var PALETTES = [
    ["Autumn Rhythm", '#d3b893', ['#e3ded640', '#100d0340', '#99846040', '#99846040', '#4a4b5440', '#85756640', '#21211d40']],
    ["Number 1", '#e4caa8', ['#d2aa3440', '#30393d40', '#fff1d540', '#428e9440', '#f7ccc840', '#5c1a1440', '#10624440']],
    ["Number 18", '#a0a18f', ['#08090440', '#a7161b40', '#b0914140', '#eadbdc40', '#27494b40', '#c88e7a40', '#0a0a0840']],
    ["Dune", '#0c0606', ['#ab252640', '#e4712040', '#f8b21c40', '#e5761f40', '#d8513b40', '#fcea7340', '#35131440']],
    ["Reversion", '#cdd2d6', ['#00149140', '#efbb0d40', '#03010240', '#5e8aaf40', '#9c53bf20', '#b1262340', '#098d5e40']],
    ["The Abyss", '#06060c', ['#006d7740', '#83c5be40', '#edf6f940', '#05052040', '#05052040', '#00000040', '#f0f0f040']],
    ["Luncheon On The Grass", '#f0f0f0', ["#150F1840", "#44301A40", "#6F451C40", "#B0211340", "#E58D2A40", "#E2A53240", "#ADABC240"]],
    ["Kandinsky", '#f0f0f0', ["#80948640", "#194B6D40", "#D7100E40", "#11121940", "#D9771C40", "#59231940", "#EDE5DA40"]]
];

// Standard MediaPipe Pose Landmark Indices
const MP_JOINTS_MAP = {
    "NOSE": 0,
    "LEFT_EYE": 2,
    "RIGHT_EYE": 5,
    "LEFT_EAR": 7,
    "RIGHT_EAR": 8,
    "LEFT_SHOULDER": 11,
    "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13,
    "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15,
    "RIGHT_WRIST": 16,
    "LEFT_PINKY": 17,
    "RIGHT_PINKY": 18,
    "LEFT_INDEX": 19,
    "RIGHT_INDEX": 20,
    "LEFT_THUMB": 21,
    "RIGHT_THUMB": 22,
    "LEFT_HIP": 23,
    "RIGHT_HIP": 24,
    "LEFT_KNEE": 25,
    "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27,
    "RIGHT_ANKLE": 28,
    "LEFT_HEEL": 29,
    "RIGHT_HEEL": 30,
    "LEFT_FOOT_INDEX": 31,
    "RIGHT_FOOT_INDEX": 32
};

var JOINTS = [
    "LEFT_INDEX",
    "RIGHT_INDEX",
    "LEFT_ELBOW",
    "RIGHT_ELBOW",
    "LEFT_HIP",
    "LEFT_WRIST",
    "RIGHT_WRIST"
];

var PALETTE;
var SUBDATA;
var PAINTLINES;
var DRIPS = [];
var index = 0;

// HELPER FUNCTIONS START
function findJoinByName(frameidx, name) {
    let frame = DATA[frameidx];
    if (!frame) return false;
    
    // Check if name exists in our mapping
    const mpIdx = MP_JOINTS_MAP[name];
    if (mpIdx !== undefined && frame[mpIdx]) {
        return frame[mpIdx];
    }
    return false;
}

function parabolaInterpolator(y0, y1, y2) {
    var a = (y2 - 2 * y1 + y0) / 2;
    var b = (y1 - y0 - a);
    return (x) => a * x * x + b * x + y0;
}

function getJointPosition(frame, jointnr) {
    if (LIVEMODE) {
        let idx = findJoinByName(frame, JOINTS[jointnr]);
        if (idx) return [idx.x, idx.y];
        return [0.5, 0.5]; // Fallback
    } else {
        if (!SUBDATA || !SUBDATA[frame]) return [0.5, 0.5];
        return [SUBDATA[frame][2 * jointnr], SUBDATA[frame][2 * jointnr + 1]];
    }
}

// MAIN PART START
export default function(p, op, w, h) {

    if (w) SCENE_WIDTH = w;
    if (h) SCENE_HEIGHT = h;

    p.onDataChange = function(cablesData) {
        if (!cablesData) return;
        
        // MediaPipe PoseLandmarker format: cablesData.landmarks[poseIndex][landmarkIndex]
        if (cablesData.landmarks && cablesData.landmarks.length > 0) {
            LIVEMODE = true;
            DATA = [cablesData.landmarks[0]]; // Use the first detected pose
            index = 0;
            p.loop(); // Ensure we are running
        }
    };

    function randomizeColor(c) {
        var c0 = p.color(c);
        var r = p.random(-30, 30);
        return p.color(p.red(c0) + r, p.green(c0) + r, p.blue(c0) + r, p.alpha(c0));
    }

    class Drip {
        constructor(color, x, y, dx, dy, weight) {
            this.color = color;
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.weight = weight;
            this.k = 2.0;
        }

        update() {
            var k = p.random(0.5, 1);
            this.x += p.random(-4, 4) / p.width + k * this.dx;
            this.y += p.random(-4, 4) / p.height + k * this.dy;
            p.fill(randomizeColor(this.color));
            p.noStroke();
            p.circle(this.x * p.width, this.y * p.height, this.weight * this.k);
            this.k *= 0.95;
            return (this.k >= 0.5);
        }
    }

    class PaintLine {
        constructor(color, x, y) {
            this.color = color;
            this.x = x;
            this.y = y;
            this.x2 = x;
            this.y2 = y;
            this.weight = SCENE_SCALE;
            this.speed2 = 0;
        }

        directionChangedX(x) { return (this.x - x) * (this.x - this.x2) > 0; }
        directionChangedY(y) { return (this.y - y) * (this.y - this.y2) > 0; }

        move(x, y) {
            var px = parabolaInterpolator(this.x2, this.x, x);
            var py = parabolaInterpolator(this.y2, this.y, y);

            var dx = x - this.x;
            var dy = y - this.y;
            var speed2 = dx * dx + dy * dy;

            if (speed2 < 0.00000001) {
                var ndrops = p.random(1, 3);
                for (var i = 0; i < ndrops; ++i) {
                    DRIPS.push(new Drip(this.color, x + p.random(-1, 1) / p.width, y + p.random(-1, 1) / p.height, 0.0, p.random(1.0, 2.0) / p.height, p.random(4, 10.0) * SCENE_SCALE));
                }
            } else if (speed2 > 400 / (p.width * p.width)) {
                if (this.directionChangedX(x) || this.directionChangedY(y)) {
                    var ndrops = p.random(4, 18);
                    for (var i = 0; i < ndrops; ++i) {
                        var r = p.random(1.0, 2.0);
                        DRIPS.push(new Drip(this.color, px(1.1 + 0.25 * r), py(1.1 + 0.25 * r), 0.1 * dx, 0.1 * dy, r * SCENE_SCALE));
                    }
                }
            } else if (speed2 < 0.0125 * this.speed2) {
                if (p.random() < 0.5) {
                    for (var i = 0; i < 8; ++i) {
                        DRIPS.push(new Drip(this.color, x + p.random(-20, 20) / p.width, y + p.random(-20, 20) / p.width, 0, 0, p.random(3.0, 4.0)));
                    }
                }
            }

            this.speed2 = speed2;
            var weight = (10 - 0.2 * 800 * (p.pow(speed2, 0.3)));
            if (weight < 1.5) weight = 1.5;
            weight *= p.random(0.5, 1.5);
            this.weight = 0.5 * this.weight + 0.5 * weight;
            
            p.strokeWeight(this.weight * SCENE_SCALE);
            p.stroke(randomizeColor(this.color));
            p.noFill();
            
            var prevx = this.x;
            var prevy = this.y;
            for (var i = 1; i <= 10; ++i) {
                var newx = px(1.0 + i * 0.1);
                var newy = py(1.0 + i * 0.1);
                p.line(prevx * p.width, prevy * p.height, newx * p.width, newy * p.height);
                prevx = newx;
                prevy = newy;
            }
            this.x2 = this.x;
            this.y2 = this.y;
            this.x = x;
            this.y = y;
        }
    }

    p.setup = function() {
        PALETTE = PALETTES[(0.5 + p.random() * (PALETTES.length - 1)) | 0];
        p.createCanvas(p.width || SCENE_WIDTH, p.height || SCENE_HEIGHT, p5_MODE);
        p.clear();
        p.background(PALETTE[1]);
        p.frameRate(FPS);

        PAINTLINES = [];
        var colors = PALETTE[2];
        for (var i = 0; i < colors.length; ++i) {
            var [x, y] = getJointPosition(0, i);
            PAINTLINES.push(new PaintLine(colors[i], x, y));
        }
    };

    p.draw = function() {
        if (EPHEMERAL) {
            var bg = p.color(PALETTE[1]);
            bg.setAlpha(EPHEMERAL_ALPHA);
            p.fill(bg);
            p.rect(0, 0, p.width, p.height);
        }

        const nframes = LIVEMODE ? DATA.length : (SUBDATA ? SUBDATA.length : 0);
        
        if (!LIVEMODE) {
            index++;
        } else {
            index = 0; // In live mode, DATA[0] is always the latest frame
        }

        if (nframes === 0 || index >= nframes) {
            if (!EPHEMERAL || index >= nframes + 200) {
                // p.noLoop(); // Keep looping for drips
            }
        } else {
            for (var i = 0; i < PAINTLINES.length; ++i) {
                let [x, y] = getJointPosition(index, i);
                PAINTLINES[i].move(x, y);
            }
        }

        var i = 0;
        while (i < DRIPS.length) {
            if (DRIPS[i].update()) i++;
            else DRIPS.splice(i, 1);
        }
    };
}