//GPU-IO Physarum by @amandaghassaei
//https://github.com/amandaghassaei/gpu-io

class Fluid {
    constructor(canvas, gui) {
        this.canvas = canvas;
        this.gui = gui;

        const {
            GPUComposer,
            GPUProgram,
            GPULayer,
            SHORT,
            INT,
            FLOAT,
            REPEAT,
            NEAREST,
            LINEAR,
            GLSL1,
            GLSL3,
            WEBGL1,
            WEBGL2,
            isWebGL2Supported,
            renderSignedAmplitudeProgram,
        } = GPUIO;

        this.PARAMS = {
            trailLength: 15,
            render: 'Fluid',
        };

        // Scaling factor for touch interactions.
        const TOUCH_FORCE_SCALE = 2;
        // Approx avg num particles per px.
        this.PARTICLE_DENSITY = 0.1;
        this.MAX_NUM_PARTICLES = 100000;
        // How long do the particles last before they are reset.
        // If we don't have then reset they tend to clump up.
        this.PARTICLE_LIFETIME = 1000;
        // How many steps to compute the zero pressure field.
        this.NUM_JACOBI_STEPS = 3;
        const PRESSURE_CALC_ALPHA = -1;
        const PRESSURE_CALC_BETA = 0.25;
        // How many steps to move particles between each step of the simulation.
        // This helps to make the trails look smoother in cases where the particles are moving >1 px per step.
        this.NUM_RENDER_STEPS = 3;
        // Compute the velocity at a lower resolution to increase efficiency.
        this.VELOCITY_SCALE_FACTOR = 8;
        // Put a speed limit on velocity, otherwise touch interactions get out of control.
        const MAX_VELOCITY = 30;
        // We are storing abs position (2 components) and displacements (2 components) in this buffer.
        // This decreases error when rendering to half float.
        this.POSITION_NUM_COMPONENTS = 4;

        this.shouldSavePNG = false;

        this.NUM_PARTICLES = this.calcNumParticles(canvas.width, canvas.height);

        // The composer orchestrates all of the GPU operations.
        const contextID = isWebGL2Supported() ? WEBGL2 : WEBGL1;
        const glslVersion = isWebGL2Supported() ? GLSL3 : GLSL1;
        this.composer = new GPUComposer({ canvas, contextID, glslVersion });

        // Init state.
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (width == 0 && height == 0) {
            width = SCENE_WIDTH;
            height = SCENE_HEIGHT;
        }
        this.velocityState = new GPULayer(this.composer, {
            name: 'velocity',
            dimensions: [Math.ceil(width / this.VELOCITY_SCALE_FACTOR), Math.ceil(height / this.VELOCITY_SCALE_FACTOR)],
            type: FLOAT,
            filter: LINEAR,
            numComponents: 2,
            wrapX: REPEAT,
            wrapY: REPEAT,
            numBuffers: 2,
        });
        this.divergenceState = new GPULayer(this.composer, {
            name: 'divergence',
            dimensions: [this.velocityState.width, this.velocityState.height],
            type: FLOAT,
            filter: NEAREST,
            numComponents: 1,
            wrapX: REPEAT,
            wrapY: REPEAT,
        });
        this.pressureState = new GPULayer(this.composer, {
            name: 'pressure',
            dimensions: [this.velocityState.width, this.velocityState.height],
            type: FLOAT,
            filter: NEAREST,
            numComponents: 1,
            wrapX: REPEAT,
            wrapY: REPEAT,
            numBuffers: 2,
        });
        this.particlePositionState = new GPULayer(this.composer, {
            name: 'position',
            dimensions: this.NUM_PARTICLES,
            type: FLOAT,
            numComponents: this.POSITION_NUM_COMPONENTS,
            numBuffers: 2,
        });
        // We can use the initial state to reset particles after they've died.
        this.particleInitialState = new GPULayer(this.composer, {
            name: 'initialPosition',
            dimensions: this.NUM_PARTICLES,
            type: FLOAT,
            numComponents: this.POSITION_NUM_COMPONENTS,
            numBuffers: 1,
        });
        this.particleAgeState = new GPULayer(this.composer, {
            name: 'age',
            dimensions: this.NUM_PARTICLES,
            type: SHORT,
            numComponents: 1,
            numBuffers: 2,
        });
        // Init a render target for trail effect.
        this.trailState = new GPULayer(this.composer, {
            name: 'trails',
            dimensions: [width, height],
            type: FLOAT,
            filter: NEAREST,
            numComponents: 1,
            numBuffers: 2,
        });

        // Init programs.
        this.advection = new GPUProgram(this.composer, {
            name: 'advection',
            fragmentShader: `
			in vec2 v_uv;
			uniform sampler2D u_state;
			uniform sampler2D u_velocity;
			uniform vec2 u_dimensions;
			out vec2 out_state;
			void main() {
				// Implicitly solve advection.
				out_state = texture(u_state, v_uv - texture(u_velocity, v_uv).xy / u_dimensions).xy;
			}`,
            uniforms: [
                {
                    name: 'u_state',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_velocity',
                    value: 1,
                    type: INT,
                },
                {
                    name: 'u_dimensions',
                    value: [canvas.width, canvas.height],
                    type: FLOAT,
                },
            ],
        });
        this.divergence2D = new GPUProgram(this.composer, {
            name: 'divergence2D',
            fragmentShader: `
			in vec2 v_uv;
			uniform sampler2D u_vectorField;
			uniform vec2 u_pxSize;
			out float out_divergence;
			void main() {
				float n = texture(u_vectorField, v_uv + vec2(0, u_pxSize.y)).y;
				float s = texture(u_vectorField, v_uv - vec2(0, u_pxSize.y)).y;
				float e = texture(u_vectorField, v_uv + vec2(u_pxSize.x, 0)).x;
				float w = texture(u_vectorField, v_uv - vec2(u_pxSize.x, 0)).x;
				out_divergence = 0.5 * ( e - w + n - s);
			}`,
            uniforms: [
                {
                    name: 'u_vectorField',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_pxSize',
                    value: [1 / this.velocityState.width, 1 / this.velocityState.height],
                    type: FLOAT,
                }
            ],
        });
        this.jacobi = new GPUProgram(this.composer, {
            name: 'jacobi',
            fragmentShader: `
			in vec2 v_uv;
			uniform float u_alpha;
			uniform float u_beta;
			uniform vec2 u_pxSize;
			uniform sampler2D u_previousState;
			uniform sampler2D u_divergence;
			out vec4 out_jacobi;
			void main() {
				vec4 n = texture(u_previousState, v_uv + vec2(0, u_pxSize.y));
				vec4 s = texture(u_previousState, v_uv - vec2(0, u_pxSize.y));
				vec4 e = texture(u_previousState, v_uv + vec2(u_pxSize.x, 0));
				vec4 w = texture(u_previousState, v_uv - vec2(u_pxSize.x, 0));
				vec4 d = texture(u_divergence, v_uv);
				out_jacobi = (n + s + e + w + u_alpha * d) * u_beta;
			}`,
            uniforms: [
                {
                    name: 'u_alpha',
                    value: PRESSURE_CALC_ALPHA,
                    type: FLOAT,
                },
                {
                    name: 'u_beta',
                    value: PRESSURE_CALC_BETA,
                    type: FLOAT,
                },
                {
                    name: 'u_pxSize',
                    value: [1 / this.velocityState.width, 1 / this.velocityState.height],
                    type: FLOAT,
                },
                {
                    name: 'u_previousState',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_divergence',
                    value: 1,
                    type: INT,
                },
            ],
        });
        this.gradientSubtraction = new GPUProgram(this.composer, {
            name: 'gradientSubtraction',
            fragmentShader: `
			in vec2 v_uv;
			uniform vec2 u_pxSize;
			uniform sampler2D u_scalarField;
			uniform sampler2D u_vectorField;
			out vec2 out_result;
			void main() {
				float n = texture(u_scalarField, v_uv + vec2(0, u_pxSize.y)).r;
				float s = texture(u_scalarField, v_uv - vec2(0, u_pxSize.y)).r;
				float e = texture(u_scalarField, v_uv + vec2(u_pxSize.x, 0)).r;
				float w = texture(u_scalarField, v_uv - vec2(u_pxSize.x, 0)).r;
				out_result = texture2D(u_vectorField, v_uv).xy - 0.5 * vec2(e - w, n - s);
			}`,
            uniforms: [
                {
                    name: 'u_pxSize',
                    value: [1 / this.velocityState.width, 1 / this.velocityState.height],
                    type: FLOAT,
                },
                {
                    name: 'u_scalarField',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_vectorField',
                    value: 1,
                    type: INT,
                },
            ],
        });
        this.renderParticles = new GPUProgram(this.composer, {
            name: 'renderParticles',
            fragmentShader: `
			#define FADE_TIME 0.1
			in vec2 v_uv;
			in vec2 v_uv_position;
			uniform isampler2D u_ages;
			uniform sampler2D u_velocity;
			out float out_state;
			void main() {
				float ageFraction = float(texture(u_ages, v_uv_position).x) / ${this.PARTICLE_LIFETIME.toFixed(1)};
				// Fade first 10% and last 10%.
				float opacity = mix(0.0, 1.0, min(ageFraction * 10.0, 1.0)) * mix(1.0, 0.0, max(ageFraction * 10.0 - 90.0, 0.0));
				vec2 velocity = texture(u_velocity, v_uv).xy;
				// Show the fastest regions with darker color.
				float multiplier = clamp(dot(velocity, velocity) * 0.05 + 0.7, 0.0, 1.0);
				out_state = opacity * multiplier;
			}`,
            uniforms: [
                {
                    name: 'u_ages',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_velocity',
                    value: 1,
                    type: INT,
                },
            ],
        });
        this.ageParticles = new GPUProgram(this.composer, {
            name: 'ageParticles',
            fragmentShader: `
			in vec2 v_uv;
			uniform isampler2D u_ages;
			out int out_age;
			void main() {
				int age = texture(u_ages, v_uv).x + 1;
				out_age = stepi(age, ${this.PARTICLE_LIFETIME}) * age;
			}`,
            uniforms: [
                {
                    name: 'u_ages',
                    value: 0,
                    type: INT,
                },
            ],
        });
        this.advectParticles = new GPUProgram(this.composer, {
            name: 'advectParticles',
            fragmentShader: `
			in vec2 v_uv;
			uniform vec2 u_dimensions;
			uniform sampler2D u_positions;
			uniform sampler2D u_velocity;
			uniform isampler2D u_ages;
			uniform sampler2D u_initialPositions;
			out vec4 out_position;
			void main() {
				// Store small displacements as separate number until they accumulate sufficiently.
				// Then add them to the absolution position.
				// This prevents small offsets on large abs positions from being lost in float16 precision.
				vec4 positionData = texture(u_positions, v_uv);
				vec2 absolute = positionData.rg;
				vec2 displacement = positionData.ba;
				vec2 position = absolute + displacement;
				// Forward integrate via RK2.
				vec2 pxSize = 1.0 / u_dimensions;
				vec2 velocity1 = texture(u_velocity, position * pxSize).xy;
				vec2 halfStep = position + velocity1 * 0.5 * ${1 / this.NUM_RENDER_STEPS};
				vec2 velocity2 = texture(u_velocity, halfStep * pxSize).xy;
				displacement += velocity2 * ${1 / this.NUM_RENDER_STEPS};
				// Merge displacement with absolute if needed.
				float shouldMerge = step(20.0, dot(displacement, displacement));
				// Also wrap absolute position if needed.
				absolute = mod(absolute + shouldMerge * displacement + u_dimensions, u_dimensions);
				displacement *= (1.0 - shouldMerge);
				// If this particle is being reset, give it a random position.
				int shouldReset = stepi(texture(u_ages, v_uv).x, 1);
				out_position = mix(vec4(absolute, displacement), texture(u_initialPositions, v_uv), float(shouldReset));
			}`,
            uniforms: [
                {
                    name: 'u_positions',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_velocity',
                    value: 1,
                    type: INT,
                },
                {
                    name: 'u_ages',
                    value: 2,
                    type: INT,
                },
                {
                    name: 'u_initialPositions',
                    value: 3,
                    type: INT,
                },
                {
                    name: 'u_dimensions',
                    value: [canvas.width, canvas.height],
                    type: 'FLOAT',
                },
            ],
        });
        this.fadeTrails = new GPUProgram(this.composer, {
            name: 'fadeTrails',
            fragmentShader: `
			in vec2 v_uv;
			uniform sampler2D u_image;
			uniform float u_increment;
			out float out_color;
			void main() {
				out_color = max(texture(u_image, v_uv).x + u_increment, 0.0);
			}`,
            uniforms: [
                {
                    name: 'u_image',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_increment',
                    value: -1 / this.PARAMS.trailLength,
                    type: 'FLOAT',
                },
            ],
        });
        this.renderTrails = new GPUProgram(this.composer, {
            name: 'renderTrails',
            fragmentShader: `
				in vec2 v_uv;
				uniform sampler2D u_trailState;
				out vec4 out_color;
				void main() {
					vec3 background = vec3(0.98, 0.922, 0.843);
					vec3 particle = vec3(0, 0, 0.2);
					out_color = vec4(mix(background, particle, texture(u_trailState, v_uv).x), 1);
				}
			`,
        });
        this.renderPressure = renderSignedAmplitudeProgram(this.composer, {
            name: 'renderPressure',
            type: this.pressureState.type,
            scale: 0.5,
            component: 'x',
        });

        // During touch, copy data from noise over to state.
        this.touch = new GPUProgram(this.composer, {
            name: 'touch',
            fragmentShader: `
			in vec2 v_uv;
			in vec2 v_uv_local;
			uniform sampler2D u_velocity;
			uniform vec2 u_vector;
			out vec2 out_velocity;
			void main() {
				vec2 radialVec = (v_uv_local * 2.0 - 1.0);
				float radiusSq = dot(radialVec, radialVec);
				vec2 velocity = texture(u_velocity, v_uv).xy + (1.0 - radiusSq) * u_vector * ${TOUCH_FORCE_SCALE.toFixed(1)};
				float velocityMag = length(velocity);
				out_velocity = velocity / velocityMag * min(velocityMag, ${MAX_VELOCITY.toFixed(1)});
			}`,
            uniforms: [
                {
                    name: 'u_velocity',
                    value: 0,
                    type: INT,
                },
                {
                    name: 'u_vector',
                    value: [0, 0],
                    type: FLOAT,
                },
            ],
        });

        //this.initGui();
    }

    // Render loop.
    draw() {
        // Advect the velocity vector field.
        this.composer.step({
            program: this.advection,
            input: [this.velocityState, this.velocityState],
            output: this.velocityState,
        });
        // Compute divergence of advected velocity field.
        this.composer.step({
            program: this.divergence2D,
            input: this.velocityState,
            output: this.divergenceState,
        });
        // Compute the pressure gradient of the advected velocity vector field (using jacobi iterations).
        for (let i = 0; i < this.NUM_JACOBI_STEPS; i++) {
            this.composer.step({
                program: this.jacobi,
                input: [this.pressureState, this.divergenceState],
                output: this.pressureState,
            });
        }
        // Subtract the pressure gradient from velocity to obtain a velocity vector field with zero divergence.
        this.composer.step({
            program: this.gradientSubtraction,
            input: [this.pressureState, this.velocityState],
            output: this.velocityState,
        });

        if (this.PARAMS.render === 'Pressure') {
            this.composer.step({
                program: this.renderPressure,
                input: this.pressureState,
            });
        } else if (this.PARAMS.render === 'Velocity') {
            this.composer.drawLayerAsVectorField({
                layer: this.velocityState,
                vectorSpacing: 10,
                vectorScale: 2.5,
                color: [0, 0, 0],
            });
        } else {
            // Increment particle age.
            this.composer.step({
                program: this.ageParticles,
                input: this.particleAgeState,
                output: this.particleAgeState,
            });
            // Fade current trails.
            this.composer.step({
                program: this.fadeTrails,
                input: this.trailState,
                output: this.trailState,
            });
            for (let i = 0; i < this.NUM_RENDER_STEPS; i++) {
                // Advect particles.
                this.composer.step({
                    program: this.advectParticles,
                    input: [this.particlePositionState, this.velocityState, this.particleAgeState, this.particleInitialState],
                    output: this.particlePositionState,
                });
                // Render particles to texture for trail effect.
                this.composer.drawLayerAsPoints({
                    layer: this.particlePositionState,
                    program: this.renderParticles,
                    input: [this.particleAgeState, this.velocityState],
                    output: this.trailState,
                    wrapX: true,
                    wrapY: true,
                });
            }
            // Render particle trails to screen.
            this.composer.step({
                program: this.renderTrails,
                input: this.trailState,
            });
        }
        if (this.shouldSavePNG) {
            this.composer.savePNG({ filename: `fluid` });
            this.shouldSavePNG = false;
        }
    }

    savePNG() {
        this.shouldSavePNG = true;
    }

    calcNumParticles(width, height) {
        return Math.min(Math.ceil(width * height * (this.PARTICLE_DENSITY)), this.MAX_NUM_PARTICLES);
    }

    // Touch events.
    pointerMove(current, last, p) {
        this.touch.setUniform('u_vector', [current[0] - last[0], - (current[1] - last[1])]);
        this.composer.stepSegment({
            program: this.touch,
            input: this.velocityState,
            output: this.velocityState,
            position1: [current[0], p.height - current[1]],
            position2: [last[0], p.height - last[1]],
            thickness: 30,
            endCaps: true,
        });
    }

    resize(width, height) {
        // Resize this.composer.
        this.composer.resize([width, height]);

        // Re-init textures at new size.
        const velocityDimensions = [Math.ceil(width / this.VELOCITY_SCALE_FACTOR), Math.ceil(height / this.VELOCITY_SCALE_FACTOR)];
        this.velocityState.resize(velocityDimensions);
        this.divergenceState.resize(velocityDimensions);
        this.pressureState.resize(velocityDimensions);
        this.trailState.resize([width, height]);

        // Update uniforms.
        this.advection.setUniform('u_dimensions', [width, height]);
        this.advectParticles.setUniform('u_dimensions', [width, height]);
        const velocityPxSize = [1 / velocityDimensions[0], 1 / velocityDimensions[1]];
        this.divergence2D.setUniform('u_pxSize', velocityPxSize);
        this.jacobi.setUniform('u_pxSize', velocityPxSize);
        this.gradientSubtraction.setUniform('u_pxSize', velocityPxSize);

        // Re-init particles.
        this.NUM_PARTICLES = this.calcNumParticles(width, height);
        // Init new positions.
        const positions = new Float32Array(this.NUM_PARTICLES * 4);
        for (let i = 0; i < positions.length / 4; i++) {
            positions[this.POSITION_NUM_COMPONENTS * i] = Math.random() * width;
            positions[this.POSITION_NUM_COMPONENTS * i + 1] = Math.random() * height;
        }
        this.particlePositionState.resize(this.NUM_PARTICLES, positions);
        this.particleInitialState.resize(this.NUM_PARTICLES, positions);
        // Init new ages.
        const ages = new Int16Array(this.NUM_PARTICLES);
        for (let i = 0; i < this.NUM_PARTICLES; i++) {
            ages[i] = Math.round(Math.random() * this.PARTICLE_LIFETIME);
        }
        this.particleAgeState.resize(this.NUM_PARTICLES, ages);
    }

    initGui() {
        this.gui.add(this.PARAMS, 'trailLength', 0, 100, 1).onChange((value) => {
            this.fadeTrails.setUniform('u_increment', -1 / this.PARAMS.trailLength);
        }).name('Trail Length');

        this.gui.add(this.PARAMS, 'render', [
            'Fluid',
            'Pressure',
            'Velocity',
        ]).name('Render');

        this.PARAMS.reset = () => this.resize(this.canvas.width, this.canvas.height);
        this.PARAMS.savePNG = this.savePNG;
        this.gui.add(this.PARAMS, 'reset').name('Reset');
        this.gui.add(this.PARAMS, 'savePNG').name('Save PNG (p)');
    }

    dispose() {
        this.velocityState.dispose();
        this.divergenceState.dispose();
        this.pressureState.dispose();
        this.particlePositionState.dispose();
        this.particleInitialState.dispose();
        this.particleAgeState.dispose();
        this.trailState.dispose();
        this.advection.dispose();
        this.divergence2D.dispose();
        this.jacobi.dispose();
        this.gradientSubtraction.dispose();
        this.renderParticles.dispose();
        this.ageParticles.dispose();
        this.advectParticles.dispose();
        this.renderTrails.dispose();
        this.fadeTrails.dispose();
        this.renderPressure.dispose();
        this.touch.dispose();
        this.composer.dispose();
    }
}