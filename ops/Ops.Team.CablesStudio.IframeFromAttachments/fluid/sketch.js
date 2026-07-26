/******************
Code by Vamoss
Original code link:
https://openprocessing.org/sketch/1799766

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

// https://github.com/amandaghassaei/gpu-io/blob/main/examples/fluid/index.js
var fluid;

// https://github.com/amandaghassaei/canvas-capture
var canvasCapture;
var capturedFrames = 0;

// Touch events.
var activeTouches = {};
var TOUCH_DIAMETER = 25;

var active_joints = {};

sketch = function (p) {

    var index = 0;

    // LIVEMODE: Memorize data
    var cur_data;
    var last_data;

    p.draw = function () {
        fluid.draw();
        if (!LIVEMODE) {

            let cur_data_chunk = DATA[index];
            let last_data_chunk = DATA[index - 1];

            if (!cur_data_chunk || !last_data_chunk) {
                index++
                return
            }

            for (let joint_idx in cur_data_chunk) {
                let cur_joint = cur_data_chunk[joint_idx]
                let last_joint = last_data_chunk[joint_idx]
                if (!cur_joint || !last_joint) {
                    continue
                }
                let cur_pos = [cur_joint.x * SCENE_WIDTH, cur_joint.y * SCENE_HEIGHT]
                let last_pos = [last_joint.x * SCENE_WIDTH, last_joint.y * SCENE_HEIGHT]
                fluid.pointerMove(cur_pos, last_pos, p)
            }

            if (index == DATA.length - 1) {
                // no more DATA left, restart
                index = 0
            } else {
                // increment index for next run of draw() to create next frame
                index++
            }
        } else {
            cur_data = DATA
            if (last_data) {
                if (last_data.length != cur_data.length) {
                    return
                }
                for (let pose_idx in cur_data) {
                    let cur_pose = cur_data[pose_idx]
                    let last_pose = last_data[pose_idx]
                    for (let joint_idx in cur_pose) {
                        let cur_joint = cur_pose[joint_idx]
                        let last_joint = last_pose[joint_idx]
                        let cur_pos = [cur_joint.x * SCENE_WIDTH, cur_joint.y * SCENE_HEIGHT]
                        let last_pos = [last_joint.x * SCENE_WIDTH, last_joint.y * SCENE_HEIGHT]
                        fluid.pointerMove(cur_pos, last_pos, p)
                    }
                }
            }
            last_data = cur_data
        }
    }

    p.setup = function () {
        //hack to enable p5js WEBGL2
        if (GPUIO.isWebGL2Supported()) {
            p5.RendererGL.prototype._initContext = function () {
                try {
                    this.drawingContext =
                        this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
                        this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
                    if (this.drawingContext === null) {
                        throw new Error('Error creating webgl2 context');
                    } else {
                        const gl = this.drawingContext;
                        gl.enable(gl.DEPTH_TEST);
                        gl.depthFunc(gl.LEQUAL);
                        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                        this._viewport = this.drawingContext.getParameter(
                            this.drawingContext.VIEWPORT
                        );
                    }
                } catch (er) {
                    throw er;
                }
            };
        }
        var renderer = p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT, p.WEBGL);

        const RECORD_FPS = 60;

        // Init a simple gui.
        //const gui = new dat.GUI();

        fluid = new Fluid(renderer.canvas);
        fluid.resize(p.width, p.height);

    }
    p.mouseMoved = function (e) {
        const current = [e.clientX, e.clientY];
        if (activeTouches[e.pointerId] === undefined) {
            activeTouches[e.pointerId] = {
                current: current,
            }
            return;
        }
        var last = activeTouches[e.pointerId].last = activeTouches[e.pointerId].current;
        activeTouches[e.pointerId].current = current;

        if (current[0] == last[0] && current[1] == last[1]) {
            return;
        }

        fluid.pointerMove(current, last, p);
    }

    p.mouseReleased = function (e) {
        delete activeTouches[e.pointerId];
    }

    p.windowResized = function () {
        fluid.resize(p.width, p.height);
    }
}

// make sure the following line remains unchanged!
stage = new p5(sketch, 'p5_stage')