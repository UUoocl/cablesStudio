// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var strecherXsize = 0;
var strecherX = 0;
var strecherYsize = 0;
var strecherY = 0;

// CYLINDER
var pieSlice;
var radius = 250;
var stackNum = 1;
var rRotate = -5;
var rOffset = 0;
var rWaveCount = 2;
var rWaveSpeed = 0;
var rWave = 0;
var rZaxis = 0;
var rLong = 0;
var xRotTweak = 0, yRotTweak = 0, zRotTweak = 0;
var rWaveOffset;
var stackHeight;
var stackHeightAdjust = 0;

// CAMERA
var xRotCamera = 15, yRotCamera = 0, zRotCamera = 0;
var zoomCamera = 0;

// STRING
var letter_select, inpText = "SPACE-TYPE-GENERATOR";
var myText = [];

// COLOR
var strkColor;
var bkgdColor;
var bkgdStrokeColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var animateSlidersToZero = false;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;
var savedSliderValues = null;
var clearStartTime = 0;
var clearTotalDuration = 0;

const CLEAR_ANIMATED_SLIDERS = [
  { key: 'radius', get: () => radius, set: v => { radius = v; } },
  { key: 'stackNum', get: () => stackNum, set: v => { stackNum = v; } },
  { key: 'stackHeightAdjust', get: () => stackHeightAdjust, set: v => { stackHeightAdjust = v; } },
  { key: 'rRotate', get: () => rRotate, set: v => { rRotate = v; } },
  { key: 'rOffset', get: () => rOffset, set: v => { rOffset = v; } },
  { key: 'rWaveCount', get: () => rWaveCount, set: v => { rWaveCount = v; } },
  { key: 'rWaveSpeed', get: () => rWaveSpeed, set: v => { rWaveSpeed = v; } },
  { key: 'rWave', get: () => rWave, set: v => { rWave = v; } },
  { key: 'rZaxis', get: () => rZaxis, set: v => { rZaxis = v; } },
  { key: 'rLong', get: () => rLong, set: v => { rLong = v; } },
  { key: 'typeX', get: () => typeX, set: v => { typeX = v; } },
  { key: 'typeY', get: () => typeY, set: v => { typeY = v; } },
  { key: 'typeStroke', get: () => typeStroke, set: v => { typeStroke = v; } },
  { key: 'strecherX', get: () => strecherXsize, set: v => { strecherXsize = v; } },
  { key: 'strecherY', get: () => strecherYsize, set: v => { strecherYsize = v; } },
  { key: 'xRotTweak', get: () => xRotTweak, set: v => { xRotTweak = v; } },
  { key: 'yRotTweak', get: () => yRotTweak, set: v => { yRotTweak = v; } },
  { key: 'zRotTweak', get: () => zRotTweak, set: v => { zRotTweak = v; } },
  { key: 'xRotCamera', get: () => xRotCamera, set: v => { xRotCamera = v; } },
  { key: 'yRotCamera', get: () => yRotCamera, set: v => { yRotCamera = v; } },
  { key: 'zRotCamera', get: () => zRotCamera, set: v => { zRotCamera = v; } },
  { key: 'zoomCamera', get: () => zoomCamera, set: v => { zoomCamera = v; } }
];

function snapshotSlidersForClear() {
  const snap = {};
  for (const s of CLEAR_ANIMATED_SLIDERS) {
    snap[s.key] = Number(s.get()) || 0;
  }
  savedSliderValues = snap;
  clearStartTime = millis();
  clearTotalDuration = Math.max(1, inpText.length * Math.max(1, seqInterval));
}

function interpolateSlidersForClear(t) {
  if (!savedSliderValues) return;
  for (const s of CLEAR_ANIMATED_SLIDERS) {
    const orig = savedSliderValues[s.key];
    if (orig !== undefined) {
      s.set(orig * (1 - t));
    }
  }
  if (typeof syncConfigFromSketch === 'function') {
    syncConfigFromSketch();
  }
}

function restoreSlidersFromClear(shouldNotify = true) {
  if (!savedSliderValues) return;
  for (const s of CLEAR_ANIMATED_SLIDERS) {
    if (savedSliderValues[s.key] !== undefined) {
      s.set(savedSliderValues[s.key]);
    }
  }
  savedSliderValues = null;
  if (typeof syncConfigFromSketch === 'function') {
    syncConfigFromSketch();
  }
  if (shouldNotify && typeof notifyConfigChange === 'function') {
    notifyConfigChange();
  }
}

function preload() {
  font = loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);
  smooth();



  textFont(font);
  frameRate(30);

  // Initialize with default preset
  reSetting();

  // Apply preset from query parameter if provided, or from initial config
  const params = (typeof urlParams !== 'undefined') ? urlParams : new URLSearchParams(window.location.search);
  const requestedPreset = params.get('preset') || params.get('p') || (window.cylinderConfig && window.cylinderConfig.preset);

  if (requestedPreset && typeof customPresets !== 'undefined') {
    const pLower = String(requestedPreset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey && typeof applyCustomPreset === 'function') {
      applyCustomPreset(customPresets[matchedKey]);
      if (window.cylinderConfig) {
        window.cylinderConfig.preset = matchedKey;
      }
      if (typeof syncConfigFromSketch === 'function') {
        syncConfigFromSketch();
      }
    } else if (params.has('preset') || params.has('p')) {
      console.warn(`[STG Cylinder] Preset "${requestedPreset}" not found. Available presets:`, Object.keys(customPresets));
    }
  }

  if (typeof signalReady === 'function') signalReady();
  if (typeof registerClient === 'function') registerClient();
}


// --- PRESET DEFINITIONS ---

function reSetting() {
  stackHeightAdjust = 0;
  radius = 250; stackNum = 1; rRotate = -5; rOffset = 0;
  rWaveCount = 2; rWaveSpeed = 0; rWave = 0; rLong = 0;
  rZaxis = 0; strecherXsize = 0; strecherYsize = 0;
  typeX = 20; typeY = 40; typeStroke = 2;
  xRotTweak = 0; yRotTweak = 0; zRotTweak = 0;
  xRotCamera = 15; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;

  inpNumber = 1;
  inp1 = color(0);
  inp2 = color(255, 140, 0);
  inp3 = color(255, 239, 0);
  inp4 = color(0, 129, 31);
  inp5 = color(0, 68, 255);
  inp6 = color(118, 0, 137);
  bkgdColor = color(255, 255, 255, 0); // transparent background for OBS/Camo overlays
  bkgdStrokeColor = color(235, 235, 235, 0);
  strkColor = color(0);

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  animateSlidersToZero = false;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;
  savedSliderValues = null;
  clearStartTime = 0;
  clearTotalDuration = 0;

  if (typeof syncConfigFromSketch === 'function') {
    syncConfigFromSketch();
  }
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.radius !== undefined) radius = settings.radius;
  if (settings.stackNum !== undefined) stackNum = settings.stackNum;
  if (settings.rRotate !== undefined) rRotate = settings.rRotate;
  if (settings.rOffset !== undefined) rOffset = settings.rOffset;
  if (settings.rWaveCount !== undefined) rWaveCount = settings.rWaveCount;
  if (settings.rWaveSpeed !== undefined) rWaveSpeed = settings.rWaveSpeed;
  if (settings.rWave !== undefined) rWave = settings.rWave;
  if (settings.rZaxis !== undefined) rZaxis = settings.rZaxis;
  if (settings.rLong !== undefined) rLong = settings.rLong;
  if (settings.strecherX !== undefined) strecherXsize = settings.strecherX;
  if (settings.strecherY !== undefined) strecherYsize = settings.strecherY;
  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;
  if (settings.xRotTweak !== undefined) xRotTweak = settings.xRotTweak;
  if (settings.yRotTweak !== undefined) yRotTweak = settings.yRotTweak;
  if (settings.zRotTweak !== undefined) zRotTweak = settings.zRotTweak;
  if (settings.stackHeightAdjust !== undefined) stackHeightAdjust = settings.stackHeightAdjust;

  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
  if (settings.color1 !== undefined) { inp1 = color(settings.color1); inpNumber = 1; }
  if (settings.color2 !== undefined) { inp2 = color(settings.color2); }
  if (settings.color3 !== undefined) { inp3 = color(settings.color3); }
  if (settings.color4 !== undefined) { inp4 = color(settings.color4); }
  if (settings.color5 !== undefined) { inp5 = color(settings.color5); }
  if (settings.color6 !== undefined) { inp6 = color(settings.color6); }
  if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;

  if (typeof syncConfigFromSketch === 'function') {
    syncConfigFromSketch();
  }
}

// REMOTE CONTROL HANDLER
function updateSettings(data) {
  if (!data) return;
  if (typeof applyParameterUpdates === 'function') {
    applyParameterUpdates(data);
  }
}

function draw() {
  // --- TIMING AND CLEARING LOGIC ---
  if (clearTextDelay > 0 && !isClearing && inpText !== "") {
    if (millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = millis();
      if ((clearMethod === "sequential" || clearMethod === "reverseSeq") && animateSlidersToZero) {
        snapshotSlidersForClear();
      }
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
      restoreSlidersFromClear();
    } else if (clearMethod === "sequential" || clearMethod === "reverseSeq") {
      if (savedSliderValues) {
        const t = constrain((millis() - clearStartTime) / clearTotalDuration, 0, 1);
        interpolateSlidersForClear(t);
      }
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = (clearMethod === "sequential")
          ? inpText.substring(1)
          : inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
        if (inpText === "") {
          isClearing = false;
          restoreSlidersFromClear();
        } else if (savedSliderValues && typeof notifyConfigChange === 'function') {
          notifyConfigChange();
        }
      }
    }
  }

  // --- CANVASES HIDING / EMPTY LOGIC ---
  if ((hideNoText && (!inpText || inpText.trim() === "")) || !inpText || inpText === "") {
    clear();
    return;
  }

  // Handle transparent or semi-transparent background for OBS / Camo overlays
  if (bkgdColor) {
    var a = (bkgdColor.levels && bkgdColor.levels[3] !== undefined)
      ? bkgdColor.levels[3]
      : ((typeof alpha === 'function') ? alpha(bkgdColor) : 255);
    if (a === 0) {
      clear();
    } else if (a < 255) {
      clear();
      background(bkgdColor);
    } else {
      background(bkgdColor);
    }
  } else {
    clear();
  }

  stackHeight = (typeY + strecherYsize / 2) + 5 + stackHeightAdjust;
  pieSlice = 2 * PI / inpText.length;
  rWaveOffset = 2 * PI / inpText.length * rWaveCount;

  noFill();
  strokeWeight(typeStroke);

  push();
  // camera
  translate(0, 0, zoomCamera);
  rotateX(radians(xRotCamera));
  rotateY(radians(yRotCamera));
  rotateZ(radians(zRotCamera));

  // center stack
  translate(0, -(stackNum - 1) * stackHeight / 2);

  // rotation
  rotateY(frameCount * (rRotate / 1000));

  const textLen = inpText.length;
  const totalChars = textLen * stackNum;
  const waveTime = frameCount * (rWaveSpeed / 1000);

  // Precompute stroke and background colors when not alternating through all 6
  if (inpNumber != 6) {
    strkColor = inp1;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }

  for (var i = 0; i < totalChars; i++) {
    var stackIdx = Math.floor(i / textLen);
    var ringSpot = i % textLen;
    letter_select = ringSpot;

    var spotPhase = ringSpot * rWaveOffset + waveTime;
    var stackPhase = stackIdx * rWaveOffset + waveTime;

    if (stackIdx % 2 === 1) {
      strecherY = map(sin(spotPhase), -1, 1, 0, strecherYsize);
    } else {
      strecherY = map(sin(spotPhase + PI), -1, 1, 0, strecherYsize);
    }

    strecherX = map(sin(stackPhase), -1, 1, 0, strecherXsize);

    push();
    // stack translates
    rotateY(stackIdx * rOffset);
    translate(0, stackIdx * stackHeight);
    // ring translates
    rotateY(ringSpot * pieSlice);

    translate(0, 0, radius);
    if (rLong != 0) {
      var rLonger = sin(stackPhase) * rLong;
      translate(0, 0, rLonger);
    }
    if (rZaxis != 0) {
      var rZaxiser = sin(spotPhase) * rZaxis;
      translate(0, rZaxiser, 0);
    }
    if (rWave != 0) {
      var rWaver = sin(spotPhase) * rWave;
      translate(0, 0, rWaver);
    }
    if (yRotTweak != 0) {
      rotateY(cos(spotPhase) * -radians(yRotTweak));
    }
    if (xRotTweak != 0) {
      rotateX(cos(spotPhase) * -radians(xRotTweak));
    }

    if (rLong != 0) {
      // fix rLong y-rotation
      var prerLonger = sin((stackIdx - 1) * rWaveOffset + waveTime) * rLong;
      var postrLonger = sin((stackIdx + 1) * rWaveOffset + waveTime) * rLong;
      var rLongAdjust = atan2(stackHeight * 2, (prerLonger - postrLonger));
      rotateX(rLongAdjust - PI / 2);
    }

    if (zRotTweak != 0) {
      rotateZ(cos(spotPhase) * radians(zRotTweak));
    }

    translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2, 0);
    // outer surface
    if (inpNumber == 6) {
      setTextColor(stackIdx);
    }
    stroke(strkColor);
    keyboardEngine();
    translate(0, 0, -1);
    // inner surface
    stroke(bkgdStrokeColor);
    keyboardEngine();
    pop();
  }
  pop();
}

function setTextColor(switcher) {
  if (switcher % 6 == 0) {
    strkColor = inp1;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 1) {
    strkColor = inp2;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 2) {
    strkColor = inp3;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 3) {
    strkColor = inp4;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 4) {
    strkColor = inp5;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 5) {
    strkColor = inp6;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}