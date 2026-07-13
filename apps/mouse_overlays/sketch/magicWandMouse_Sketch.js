/**
 * @file magicWandMouse_Sketch.js
 * @description Sparkly Magic Wand effect that trails the mouse.
 * Adapted from a tutorial by Patt Vira.
 * @see https://youtu.be/NW6fw_8s_0Y
 */

/** @type {Star[]} Array of active star particles */
let stars = [];
/** @type {number} Previous X position for movement detection */
let lastMouseX = 0;
/** @type {number} Previous Y position for movement detection */
let lastMouseY = 0;

/**
 * Initializes the p5 canvas.
 */
function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);
  //createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
}

/**
 * Handles window resize events to update canvas size dynamically.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * Main draw loop. Creates new stars if the mouse has moved
 * and updates/displays existing stars.
 */
function draw() {
  clear()
  background(0, 0, 0, 0);

  // Use mousePosX/Y from the BroadcastChannel listener in the HTML
  if (mousePosX !== lastMouseX || mousePosY !== lastMouseY) {
    const colorMove = (window.magicWandConfig && window.magicWandConfig.colorMove) || [255, 255, 0];
    stars.push(new Star(mousePosX, mousePosY, 0, 0, colorMove));
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].display();

    if (stars[i].done) {
      stars.splice(i, 1);
    }
  }
  lastMouseX = mousePosX;
  lastMouseY = mousePosY;
}

/**
 * Required by p5 but unused here.
 */
function mouseDragged() {
}

/**
 * Handles mouse click events. Triggers a burst of stars.
 * @param {string} mouseButton - The button identifier (e.g., 'MB1').
 */
function mousePressed(mouseButton) {
  let num = random(20, 50);
  let fillColor = [255, 0, 255]; //default 
  //= (window.magicWandConfig && window.magicWandConfig.colorClick) || [255, 0, 255];
  switch (mouseButton) {
    case ('MB1'):
      fillColor = [255, 0, 255]
      break;
    case ('MB2'):
      fillColor = [129, 210, 235]
      break;
  }
  for (let i = 0; i < num; i++) {
    let velocity = p5.Vector.random2D().mult(random(2, 5));
    stars.push(new Star(mousePosX, mousePosY, velocity.x, velocity.y, fillColor));
  }
}