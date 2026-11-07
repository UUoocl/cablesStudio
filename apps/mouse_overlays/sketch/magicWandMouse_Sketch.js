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
 * @param {string|number} mouseButton - The button identifier (e.g., 'MB1'..'MB6' or 1..6).
 */
function mousePressed(mouseButton) {
  const cfg = window.magicWandConfig || {};
  const maxStars = (typeof cfg.maxStars === 'number' && cfg.maxStars > 0) ? cfg.maxStars : 50;
  const minStars = Math.min(20, maxStars);
  const num = random(minStars, maxStars);

  const disperseSpeed = (typeof cfg.disperseSpeed === 'number' && cfg.disperseSpeed > 0) ? cfg.disperseSpeed : 5;
  const minSpeed = Math.min(2, disperseSpeed * 0.4);

  let btnIndex = 1;
  if (typeof mouseButton === 'number') {
    btnIndex = mouseButton;
  } else if (typeof mouseButton === 'string') {
    const match = mouseButton.match(/\d+/);
    if (match) btnIndex = parseInt(match[0], 10);
  }
  btnIndex = Math.max(1, Math.min(6, btnIndex));

  const defaultButtonColors = {
    1: [255, 0, 255],
    2: [129, 210, 235],
    3: [255, 215, 0],
    4: [0, 255, 128],
    5: [255, 102, 0],
    6: [180, 100, 255]
  };

  const colorKey = `colorMB${btnIndex}`;
  const fillColor = Array.isArray(cfg[colorKey]) ? cfg[colorKey] : defaultButtonColors[btnIndex];

  for (let i = 0; i < num; i++) {
    let velocity = p5.Vector.random2D().mult(random(minSpeed, disperseSpeed));
    stars.push(new Star(mousePosX, mousePosY, velocity.x, velocity.y, fillColor));
  }
}