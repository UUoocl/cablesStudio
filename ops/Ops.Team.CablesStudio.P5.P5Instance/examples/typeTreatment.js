// https://openprocessing.org/sketch/1789074 by Sam Darlow

// SETTINGS / VARIABLES START
var SCENE_WIDTH = 800;
var SCENE_HEIGHT = 600;
var FPS = 60;
var p5_MODE = 'p2d';

// MAIN PART START
export default function (p, op, w, h) {
    let currentWidth = w || SCENE_WIDTH;
    let currentHeight = h || SCENE_HEIGHT;

    var fontSize = 70;
    var scaleRate = 5;
    var message = 'Interfaces';
    var inpactRange = 15;
    var canvas;
    var textData = [];
    var dotsCordinate = [];
    var particles = [];
    var myFont;

    let LIVEMODE = false;
    let DATA = [];
    let index = 0;

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.r = 2;
            this.originalX = x;
            this.originalY = y;
            this.color = Math.floor(Math.random() * 360);
            this.density = Math.random() * 30 + 10;
        }

        draw() {
            p.fill(this.color);
            p.circle(this.x, this.y, this.r * 2);
        }

        update(poses) {
            let distanceToOrigin = Math.sqrt(
                (this.originalX - this.x) ** 2 + (this.originalY - this.y) ** 2
            );

            let forced = false;
            let currentW = p.width || currentWidth;
            let currentH = p.height || currentHeight;

            for (let pose of poses) {
                if (!pose) continue;
                for (let joint of pose) {
                    if (!joint) continue;
                    let distanceToJoint = Math.sqrt(
                        (this.x - (joint.x * currentW)) ** 2 +
                        (this.y - (joint.y * currentH)) ** 2
                    );
                    if (distanceToJoint < inpactRange) {
                        let repulsionAngle = Math.atan2(
                            this.y - (joint.y * currentH),
                            this.x - (joint.x * currentW)
                        );
                        let repulsionForce = (
                            (inpactRange - distanceToJoint) / inpactRange *
                            this.density
                        );
                        this.x += Math.cos(repulsionAngle) * repulsionForce;
                        this.y += Math.sin(repulsionAngle) * repulsionForce;
                        forced = true;
                    }
                }
            }

            if (!forced) {
                let attractionAngle = Math.atan2(
                    this.originalY - this.y,
                    this.originalX - this.x
                );
                let attractionForce = Math.abs(distanceToOrigin) / this.density;
                this.x += Math.cos(attractionAngle) * attractionForce;
                this.y += Math.sin(attractionAngle) * attractionForce;
            }
        }
    }

    let getTextData = function (message) {
        const data = [];
        p.text(message, 0, 0);    // draw once and get data
        let textHeight = p.textAscent() + p.textDescent();
        for (let y = 0; y < textHeight; y++) {
            let row = [];
            for (let x = 0; x < p.textWidth(message); x++) {
                row.push(canvas.get(x, y));    // get data, [r, g, b, a]
            }
            data.push(row);
        }
        return data;
    };

    let getCordinates = function () {
        const cordinate = [];
        for (let y = 0; y < textData.length; y++) {
            let row = [];
            for (let x = 0; x < textData[0].length; x++) {
                let pixel = textData[y][x];
                // Check if pixel is within canvas bounds (alpha > 0) and is text (red < 128)
                if (pixel && pixel[3] > 0 && pixel[0] < 128) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
            dotsCordinate.push(row);
        }
        return cordinate;
    };

    let createParticles = function (scaleRate, marginX, marginY) {
        const particles = [];
        for (let y = 0; y < dotsCordinate.length; y++) {
            for (let x = 0; x < dotsCordinate[0].length; x++) {
                if (dotsCordinate[y][x] === 1) {
                    let particle = new Particle(
                        x * scaleRate + marginX,
                        y * scaleRate + marginY
                    );
                    particles.push(particle);
                }
            }
        }
        return particles;
    };

    function get_flat_landmarks(data_chunk) {
        if (!data_chunk) return null;
        if (Array.isArray(data_chunk)) {
            return data_chunk;
        }
        let lm = data_chunk.landmarks || data_chunk.pose || data_chunk.poseLandmarks;
        if (lm && Array.isArray(lm[0])) {
            lm = lm[0];
        }
        return lm;
    }

    p.preload = function () {
        myFont = 'membra';
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
        p.frameRate(FPS);
        canvas = p.createCanvas(currentWidth, currentHeight);
        p.colorMode(p.RGB);
        p.noStroke();
        p.background("#EAD5E1");
        p.fill("#273E55");
        p.textSize(fontSize);
        p.textAlign(p.LEFT, p.TOP);
        if (myFont) {
            try {
                p.textFont(myFont);
            } catch (err) {
                console.warn("p.textFont failed, setting via drawingContext instead:", err);
                p.drawingContext.font = fontSize + "px " + myFont;
            }
        }
        textData = getTextData(message);
        getCordinates();
        particles = createParticles(scaleRate, 50, 0);
    };

    p.draw = function () {
        p.background('#212529');
        let data_chunk = DATA[index];

        // early exit data check
        if (!data_chunk) {
            index = 0;
            return;
        }

        let landmarks = get_flat_landmarks(data_chunk);

        particles.forEach(part => {
            if (landmarks) {
                part.update([landmarks]);
            } else {
                part.update([]);
            }
            part.draw();
        });

        if (!LIVEMODE) {
            // loop over DATA via index variable
            if (index == DATA.length - 1) {
                // no more DATA left, restart
                index = 0;
            } else {
                // increment index for next run of draw() to create next frame
                index++;
            }
        }
    };
}