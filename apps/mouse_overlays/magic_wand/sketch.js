/**
 * Magic Wand Overlay - p5.js Sketch
 * Renders sparkly star particles following mouse movement and button bursts.
 */

var stars = [];
var lastMouseX = 0;
var lastMouseY = 0;
var mousePosX = 0;
var mousePosY = 0;

window.mousePosX = mousePosX;
window.mousePosY = mousePosY;

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);
  pixelDensity(1);

  // Apply preset from query parameter or initial config
  const params = (typeof urlParams !== 'undefined') ? urlParams : new URLSearchParams(window.location.search);
  const requestedPreset = params.get('preset') || params.get('p') || (window.magicWandConfig && window.magicWandConfig.preset);

  if (requestedPreset && typeof customPresets !== 'undefined') {
    const pLower = String(requestedPreset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey && typeof applyCustomPreset === 'function') {
      applyCustomPreset(customPresets[matchedKey]);
      if (window.magicWandConfig) {
        window.magicWandConfig.preset = matchedKey;
      }
    }
  }

  if (typeof signalReady === 'function') signalReady();
  if (typeof registerClient === 'function') registerClient();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();
  background(0, 0, 0, 0);

  // Use mousePosX and mousePosY updated via WebSocket / BroadcastChannel
  const currentX = (typeof window.mousePosX !== 'undefined') ? window.mousePosX : mousePosX;
  const currentY = (typeof window.mousePosY !== 'undefined') ? window.mousePosY : mousePosY;

  if (currentX !== lastMouseX || currentY !== lastMouseY) {
    const colorMove = (window.magicWandConfig && window.magicWandConfig.colorMove) || [255, 255, 0];
    stars.push(new Star(currentX, currentY, 0, 0, colorMove));
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].display();

    if (stars[i].done) {
      stars.splice(i, 1);
    }
  }

  lastMouseX = currentX;
  lastMouseY = currentY;
}

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

  const currentX = (typeof window.mousePosX !== 'undefined') ? window.mousePosX : mousePosX;
  const currentY = (typeof window.mousePosY !== 'undefined') ? window.mousePosY : mousePosY;

  for (let i = 0; i < num; i++) {
    let velocity = p5.Vector.random2D().mult(random(minSpeed, disperseSpeed));
    stars.push(new Star(currentX, currentY, velocity.x, velocity.y, fillColor));
  }
}

function applyCustomPreset(settings) {
  if (!settings || typeof settings !== 'object') return;
  if (!window.magicWandConfig) window.magicWandConfig = {};

  if (typeof settings.starSize === 'number') window.magicWandConfig.starSize = settings.starSize;
  if (typeof settings.starDecay === 'number') window.magicWandConfig.starDecay = settings.starDecay;
  if (typeof settings.maxStars === 'number') window.magicWandConfig.maxStars = Math.max(1, Math.round(settings.maxStars));
  if (typeof settings.disperseSpeed === 'number') window.magicWandConfig.disperseSpeed = Math.max(0.1, settings.disperseSpeed);

  if (settings.colorMove !== undefined) {
    const rgb = parseColorToRgb(settings.colorMove);
    if (rgb) window.magicWandConfig.colorMove = rgb;
  }

  for (let i = 1; i <= 6; i++) {
    const key = `colorMB${i}`;
    if (settings[key] !== undefined) {
      const rgb = parseColorToRgb(settings[key]);
      if (rgb) window.magicWandConfig[key] = rgb;
    }
  }
}

function applyParameterUpdates(params) {
  if (!params || typeof params !== 'object') return;
  if (!window.magicWandConfig) window.magicWandConfig = {};

  if (params.preset !== undefined && typeof customPresets !== 'undefined') {
    const pKey = String(params.preset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pKey);
    if (matchedKey) {
      applyCustomPreset(customPresets[matchedKey]);
      window.magicWandConfig.preset = matchedKey;
    }
  }

  const sizeVal = params.starSize !== undefined ? params.starSize : params.particleSize;
  if (typeof sizeVal === 'number' && !isNaN(sizeVal)) {
    window.magicWandConfig.starSize = sizeVal;
  }

  if (typeof params.starDecay === 'number' && !isNaN(params.starDecay)) {
    window.magicWandConfig.starDecay = params.starDecay;
  }

  if (typeof params.maxStars === 'number' && !isNaN(params.maxStars)) {
    window.magicWandConfig.maxStars = Math.max(1, Math.round(params.maxStars));
  }

  if (typeof params.disperseSpeed === 'number' && !isNaN(params.disperseSpeed)) {
    window.magicWandConfig.disperseSpeed = Math.max(0.1, params.disperseSpeed);
  }

  const moveColorVal = params.colorMove !== undefined ? params.colorMove : params.particleColor;
  if (moveColorVal !== undefined) {
    const rgb = parseColorToRgb(moveColorVal);
    if (rgb) window.magicWandConfig.colorMove = rgb;
  }

  if (params.colorClick !== undefined) {
    const rgb = parseColorToRgb(params.colorClick);
    if (rgb) window.magicWandConfig.colorMB1 = rgb;
  }

  for (let i = 1; i <= 6; i++) {
    const key = `colorMB${i}`;
    if (params[key] !== undefined) {
      const rgb = parseColorToRgb(params[key]);
      if (rgb) window.magicWandConfig[key] = rgb;
    }
  }
}

