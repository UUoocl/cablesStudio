/**
 * @file astroBee_Sketch.js
 * @description p5.js sketch that renders a 3D Astro Bee robot.
 * The robot follows the mouse position received via BroadcastChannel
 * and reacts to keyboard and click events.
 */

/** @type {p5.Geometry} The 3D model of the bee */
let beeModel;

/** @type {number} Target X position for the robot (centered) */
let targetX = 0;
/** @type {number} Target Y position for the robot (centered) */
let targetY = 0;
/** @type {number} Current interpolated X position */
let currX = 0;
/** @type {number} Current interpolated Y position */
let currY = 0;

/** @type {number} Current scale/zoom level */
let zoom = 150;
/** @type {number} Target scale/zoom level for interpolation */
let targetZoom = 150;

/** @type {number} Current rotation on the X axis */
let pitch = 0;
/** @type {number} Current rotation on the Y axis */
let yaw = 0;
/** @type {number} Target pitch for interpolation */
let targetPitch = 0;
/** @type {number} Target yaw for interpolation */
let targetYaw = 0;

/**
 * Loads the 3D model before the sketch starts.
 */
function preload() {
  // Loading the OBJ model
  beeModel = loadModel('models/bee3.obj', true);
}

/**
 * Initializes the canvas and starting positions.
 */
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  currX = width / 2;
  currY = height / 2;
}

/**
 * Main draw loop. Handles animation, lighting, and rendering.
 */
function draw() {
  clear(); // Transparent background
  noStroke(); // Remove wireframe/edges
  
  // Basic lighting for 3D effect
  ambientLight(100);
  directionalLight(255, 255, 255, 0, 0, -1);
  pointLight(255, 255, 255, currX, currY, 100);

  // Smoothly move towards mouse position
  // mousePosX and mousePosY are updated by the BroadcastChannel in the HTML
  if (typeof mousePosX !== 'undefined') {
    targetX = mousePosX - width / 2;
    targetY = mousePosY - height / 2;
  }
  
  currX = lerp(currX, targetX, 0.05);
  currY = lerp(currY, targetY, 0.05);
  
  // Floating oscillation - simulates zero-gravity movement
  let floatX = sin(frameCount * 0.02) * 20;
  let floatY = cos(frameCount * 0.015) * 25;
  let floatZ = sin(frameCount * 0.01) * 15;
  
  // Smoothly interpolate zoom
  zoom = lerp(zoom, targetZoom, 0.1);
  
  // Smoothly interpolate rotation
  pitch = lerp(pitch, targetPitch, 0.1);
  yaw = lerp(yaw, targetYaw, 0.1);
  
  push();
  translate(currX + floatX, currY + floatY, floatZ);
  
  // Apply zoom
  scale(zoom / 100); 
  
  // Apply pitch and yaw
  rotateX(pitch);
  rotateY(yaw);
  
  // Add some continuous slight rotation for "space" feel
  rotateZ(frameCount * 0.005);
  
  // Material for the bee
  specularMaterial(250);
  shininess(20);
  
  model(beeModel);
  pop();
}

/**
 * Handles window resize events.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * Triggers a random pitch and yaw rotation.
 * Called when a 'mouse_click' message is received via BroadcastChannel.
 */
function triggerClickEffect() {
  targetPitch += random(-PI/4, PI/4);
  targetYaw += random(-PI/2, PI/2);
}

/**
 * Updates the target zoom level.
 * Called when '+' or '-' keys are pressed via 'keyboard_event' channel.
 * @param {number} delta - The amount to change the zoom level.
 */
function updateZoom(delta) {
  targetZoom = constrain(targetZoom + delta, 5, 500);
}
