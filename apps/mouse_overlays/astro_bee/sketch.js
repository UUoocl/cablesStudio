/**
 * Astro Bee Overlay - p5.js WebGL Sketch
 * Renders a 3D Astro Bee robot following mouse coordinates and reacting to clicks.
 */

/** @type {p5.Geometry} The 3D model of the bee */
let beeModel;

/** Target X/Y position for the robot (centered) */
let targetX = 0;
let targetY = 0;
let currX = 0;
let currY = 0;

let mousePosX = window.innerWidth / 2;
let mousePosY = window.innerHeight / 2;
window.mousePosX = mousePosX;
window.mousePosY = mousePosY;

/** Scale / zoom levels */
let zoom = 150;
let targetZoom = 150;

/** Pitch / Yaw rotations */
let pitch = 0;
let yaw = 0;
let targetPitch = 0;
let targetYaw = 0;

function preload() {
  // Loading 3D model from shared models directory
  beeModel = loadModel('../models/bee3.obj', true);
}

function setup() {
  const w = (typeof initialWidth !== 'undefined' && initialWidth > 0) ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined' && initialHeight > 0) ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);
  currX = width / 2;
  currY = height / 2;

  // Apply preset from query parameter or initial config
  const params = (typeof urlParams !== 'undefined') ? urlParams : new URLSearchParams(window.location.search);
  const requestedPreset = params.get('preset') || params.get('p') || (window.astroBeeConfig && window.astroBeeConfig.preset);

  if (requestedPreset && typeof customPresets !== 'undefined') {
    const pLower = String(requestedPreset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey && typeof applyCustomPreset === 'function') {
      applyCustomPreset(customPresets[matchedKey]);
      if (window.astroBeeConfig) {
        window.astroBeeConfig.preset = matchedKey;
      }
    }
  }

  if (typeof signalReady === 'function') signalReady();
  if (typeof registerClient === 'function') registerClient();
}

function draw() {
  clear();
  noStroke();

  const cfg = window.astroBeeConfig || {};
  const activeLight = (typeof cfg.lightIntensity === 'number') ? cfg.lightIntensity : 100;
  const activeLerp = (typeof cfg.lerpSpeed === 'number') ? cfg.lerpSpeed : 0.05;
  const activeFloat = (typeof cfg.floatScale === 'number') ? cfg.floatScale : 1.0;
  const activeRotSpeed = (typeof cfg.rotationSpeed === 'number') ? cfg.rotationSpeed : 0.005;
  const activeShininess = (typeof cfg.shininess === 'number') ? cfg.shininess : 20;

  // Basic lighting
  ambientLight(activeLight);
  directionalLight(255, 255, 255, 0, 0, -1);
  pointLight(255, 255, 255, currX, currY, 100);

  // Smoothly move towards mouse position
  const mX = (typeof window.mousePosX !== 'undefined') ? window.mousePosX : mousePosX;
  const mY = (typeof window.mousePosY !== 'undefined') ? window.mousePosY : mousePosY;

  targetX = mX - width / 2;
  targetY = mY - height / 2;

  currX = lerp(currX, targetX, activeLerp);
  currY = lerp(currY, targetY, activeLerp);

  // Floating oscillation simulating microgravity
  const floatX = sin(frameCount * 0.02) * (20 * activeFloat);
  const floatY = cos(frameCount * 0.015) * (25 * activeFloat);
  const floatZ = sin(frameCount * 0.01) * (15 * activeFloat);

  // Interpolate zoom
  zoom = lerp(zoom, targetZoom, 0.1);

  // Interpolate rotation
  pitch = lerp(pitch, targetPitch, 0.1);
  yaw = lerp(yaw, targetYaw, 0.1);

  push();
  translate(currX + floatX, currY + floatY, floatZ);

  scale(zoom / 100);

  rotateX(pitch);
  rotateY(yaw);
  rotateZ(frameCount * activeRotSpeed);

  specularMaterial(250);
  shininess(activeShininess);

  if (beeModel) {
    model(beeModel);
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function triggerClickEffect() {
  targetPitch += random(-PI / 4, PI / 4);
  targetYaw += random(-PI / 2, PI / 2);
}

function updateZoom(delta) {
  targetZoom = Math.max(30, Math.min(350, targetZoom + delta));
  if (window.astroBeeConfig) {
    window.astroBeeConfig.zoom = targetZoom;
  }
}

function applyCustomPreset(settings) {
  if (!settings || typeof settings !== 'object') return;
  if (!window.astroBeeConfig) window.astroBeeConfig = {};

  if (typeof settings.zoom === 'number') {
    targetZoom = settings.zoom;
    zoom = settings.zoom;
    window.astroBeeConfig.zoom = settings.zoom;
  }
  if (typeof settings.lerpSpeed === 'number') window.astroBeeConfig.lerpSpeed = settings.lerpSpeed;
  if (typeof settings.floatScale === 'number') window.astroBeeConfig.floatScale = settings.floatScale;
  if (typeof settings.rotationSpeed === 'number') window.astroBeeConfig.rotationSpeed = settings.rotationSpeed;
  if (typeof settings.shininess === 'number') window.astroBeeConfig.shininess = settings.shininess;
  if (typeof settings.lightIntensity === 'number') window.astroBeeConfig.lightIntensity = settings.lightIntensity;
}

function applyParameterUpdates(params) {
  if (!params || typeof params !== 'object') return;
  if (!window.astroBeeConfig) window.astroBeeConfig = {};

  if (params.preset !== undefined && typeof customPresets !== 'undefined') {
    const pKey = String(params.preset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pKey);
    if (matchedKey) {
      applyCustomPreset(customPresets[matchedKey]);
      window.astroBeeConfig.preset = matchedKey;
    }
  }

  if (typeof params.zoom === 'number' && !isNaN(params.zoom)) {
    targetZoom = params.zoom;
    window.astroBeeConfig.zoom = params.zoom;
  }

  if (typeof params.lerpSpeed === 'number' && !isNaN(params.lerpSpeed)) {
    window.astroBeeConfig.lerpSpeed = params.lerpSpeed;
  }

  if (typeof params.floatScale === 'number' && !isNaN(params.floatScale)) {
    window.astroBeeConfig.floatScale = params.floatScale;
  }

  if (typeof params.rotationSpeed === 'number' && !isNaN(params.rotationSpeed)) {
    window.astroBeeConfig.rotationSpeed = params.rotationSpeed;
  }

  if (typeof params.shininess === 'number' && !isNaN(params.shininess)) {
    window.astroBeeConfig.shininess = params.shininess;
  }

  if (typeof params.lightIntensity === 'number' && !isNaN(params.lightIntensity)) {
    window.astroBeeConfig.lightIntensity = params.lightIntensity;
  }
}

