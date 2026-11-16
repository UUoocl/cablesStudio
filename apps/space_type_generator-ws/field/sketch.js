// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var strecherX = 0;
var strecherY = 0;

// FIELD
var column = 33;
var row = 7;
var tracking = 5;
var lineSpace = 5;
var xSpace, ySpace;

// WAVE
var speed = -2;
var xOffset = 3.1;
var yOffset = 3.1;
var zWave = 0;
var zWaver = 0;
var zWaveChecked = 0;
var xWave = 0;
var xWaver = 0;
var xWaveChecked = 0;
var yWave = 0;
var yWaver = 0;
var yWaveChecked = 0;
var yWavezRot = 0;
var yWavezRoter = 0;
var yWavexStr = 0;
var yWavexStrer = 0;
var xStrechWave = 0;
var xStrechWaveChecked = 0;
var yStrechWave = 0;
var yStrechWaveChecked = 0;

// CAMERA
var xRotCamera = 0, yRotCamera = 0, zRotCamera = 0;
var zoomCamera = 0;

// STRING
var letter_select, inpText = "EVERYTHING IS STRANGE. THINGS ARE HUGE AND VERY SMALL.";
var myText = [];
var runLength;
var fullText = true;

// COLOR
var strkColor;
var bkgdColor;
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
  { key: 'column', get: () => column, set: v => { column = v; } },
  { key: 'row', get: () => row, set: v => { row = v; } },
  { key: 'tracking', get: () => tracking, set: v => { tracking = v; } },
  { key: 'lineSpace', get: () => lineSpace, set: v => { lineSpace = v; } },
  { key: 'typeX', get: () => typeX, set: v => { typeX = v; } },
  { key: 'typeY', get: () => typeY, set: v => { typeY = v; } },
  { key: 'typeStroke', get: () => typeStroke, set: v => { typeStroke = v; } },
  { key: 'speed', get: () => speed, set: v => { speed = v; } },
  { key: 'xOffset', get: () => xOffset, set: v => { xOffset = v; } },
  { key: 'yOffset', get: () => yOffset, set: v => { yOffset = v; } },
  { key: 'zWave', get: () => zWave, set: v => { zWave = v; } },
  { key: 'xWave', get: () => xWave, set: v => { xWave = v; } },
  { key: 'yWave', get: () => yWave, set: v => { yWave = v; } },
  { key: 'yWavezRot', get: () => yWavezRot, set: v => { yWavezRot = v; } },
  { key: 'yWavexStr', get: () => yWavexStr, set: v => { yWavexStr = v; } },
  { key: 'xStrechWave', get: () => xStrechWave, set: v => { xStrechWave = v; } },
  { key: 'yStrechWave', get: () => yStrechWave, set: v => { yStrechWave = v; } },
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

var font;

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
  const requestedPreset = params.get('preset') || params.get('p') || (window.fieldConfig && window.fieldConfig.preset);

  if (requestedPreset && typeof customPresets !== 'undefined') {
    const pLower = String(requestedPreset).toLowerCase();
    const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === pLower);
    if (matchedKey && typeof applyCustomPreset === 'function') {
      applyCustomPreset(customPresets[matchedKey]);
      if (window.fieldConfig) {
        window.fieldConfig.preset = matchedKey;
      }
      if (typeof syncConfigFromSketch === 'function') {
        syncConfigFromSketch();
      }
    } else if (params.has('preset') || params.has('p')) {
      console.warn(`[STG Field] Preset "${requestedPreset}" not found. Available presets:`, Object.keys(customPresets));
    }
  }

  if (typeof signalReady === 'function') signalReady();
  if (typeof registerClient === 'function') registerClient();
}

function reSetting() {
  yWaver = 0;
  column = 33; row = 7; tracking = 5; lineSpace = 5;
  typeX = 20; typeY = 40; typeStroke = 2;
  speed = -2; xOffset = 3.1; yOffset = 3.1;
  xWave = 0; zWave = 0; xStrechWave = 0; yStrechWave = 0;
  yWave = 0; yWavezRot = 0; yWavexStr = 0;
  xRotCamera = 0; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;

  zWaveChecked = 0;
  xWaveChecked = 0;
  yWaveChecked = 0;
  xStrechWaveChecked = 0;
  yStrechWaveChecked = 0;
  fullText = false;

  inp1 = color('#000000');
  inp2 = color('#ff0000');
  inp3 = color('#0000ff');
  inp4 = color('#ffff00');
  inp5 = color('#ffffff');
  inp6 = color('#760089');
  inpNumber = 1;
  strkColor = inp1;
  bkgdColor = color('#ffffff00');

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
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.column !== undefined) column = settings.column;
  if (settings.row !== undefined) row = settings.row;
  if (settings.tracking !== undefined) tracking = settings.tracking;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;

  if (settings.speed !== undefined) speed = settings.speed;
  if (settings.xOffset !== undefined) xOffset = settings.xOffset;
  if (settings.yOffset !== undefined) yOffset = settings.yOffset;
  if (settings.zWave !== undefined) zWave = settings.zWave;
  if (settings.zWaveChecked !== undefined) zWaveChecked = settings.zWaveChecked ? PI : 0;
  if (settings.xWave !== undefined) xWave = settings.xWave;
  if (settings.xWaveChecked !== undefined) xWaveChecked = settings.xWaveChecked ? PI : 0;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.yWaveChecked !== undefined) yWaveChecked = settings.yWaveChecked ? PI : 0;
  if (settings.yWavezRot !== undefined) yWavezRot = settings.yWavezRot;
  if (settings.yWavexStr !== undefined) yWavexStr = settings.yWavexStr;
  if (settings.xStrechWave !== undefined) xStrechWave = settings.xStrechWave;
  if (settings.xStrechWaveChecked !== undefined) xStrechWaveChecked = settings.xStrechWaveChecked ? PI / 2 : 0;
  if (settings.yStrechWave !== undefined) yStrechWave = settings.yStrechWave;
  if (settings.yStrechWaveChecked !== undefined) yStrechWaveChecked = settings.yStrechWaveChecked ? PI / 2 : 0;

  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;
  if (settings.fullText !== undefined) fullText = Boolean(settings.fullText);

  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
  if (settings.color1 !== undefined) { inp1 = color(settings.color1); }
  if (settings.color2 !== undefined) { inp2 = color(settings.color2); }
  if (settings.color3 !== undefined) { inp3 = color(settings.color3); }
  if (settings.color4 !== undefined) { inp4 = color(settings.color4); }
  if (settings.color5 !== undefined) { inp5 = color(settings.color5); }
  if (settings.color6 !== undefined) { inp6 = color(settings.color6); }
  if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
  if (settings.text !== undefined) inpText = String(settings.text);

  if (typeof syncConfigFromSketch === 'function') {
    syncConfigFromSketch();
  }
}

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

  xSpace = typeX + tracking;
  ySpace = typeY + lineSpace + yStrechWave / 2;

  noFill();
  strokeWeight(typeStroke);

  push();
  // Camera
  translate(0, 0, zoomCamera);
  rotateX(radians(xRotCamera));
  rotateY(radians(yRotCamera));
  rotateZ(radians(zRotCamera));

  var safeColumn = Math.max(1, Math.round(column));
  var safeXOffset = Math.abs(xOffset) < 0.001 ? (xOffset < 0 ? -0.001 : 0.001) : xOffset;
  var safeYOffset = Math.abs(yOffset) < 0.001 ? (yOffset < 0 ? -0.001 : 0.001) : yOffset;

  var textLen = inpText.length;
  if (fullText === true) {
    runLength = row * safeColumn;
    translate(-safeColumn * xSpace / 2, -row * ySpace / 2);
  } else {
    runLength = textLen;
    if (textLen >= safeColumn) {
      translate(-safeColumn * xSpace / 2, -Math.floor(textLen / safeColumn) * ySpace / 2);
    } else {
      translate(-textLen * xSpace / 2, -Math.floor(textLen / safeColumn) * ySpace / 2);
    }
  }

  // Precompute frame phase & color if single color
  var timePhase = frameCount * speed / 100;
  var invXOffset = 1 / safeXOffset;
  var invYOffset = 1 / safeYOffset;

  if (inpNumber == 1) {
    strkColor = inp1;
    stroke(strkColor);
  }

  // THE TYPE
  for (var i = 0; i < runLength; i++) {
    var colIdx = i % safeColumn;
    var rowIdx = Math.floor(i / safeColumn);

    if (fullText === true) {
      letter_select = i % textLen;
    } else {
      letter_select = i;
    }

    if (inpNumber > 1) {
      setTextColor(rowIdx);
      stroke(strkColor);
    }

    var basePhase = timePhase + colIdx * invXOffset + rowIdx * invYOffset;

    zWaver = zWave !== 0 ? sin(basePhase + zWaveChecked) * zWave : 0;
    xWaver = xWave !== 0 ? map(sin(basePhase + xWaveChecked), -1, 1, 0, xWave) : 0;
    yWaver = yWave !== 0 ? sin(basePhase + yWaveChecked) * yWave : 0;

    yWavezRoter = yWavezRot !== 0 ? cos(basePhase + yWaveChecked) * yWavezRot : 0;
    yWavexStrer = yWavexStr !== 0 ? map(cos((basePhase + yWaveChecked) * 2), -1, 1, 0, yWavexStr) : 0;

    strecherX = (xStrechWave !== 0 ? map(sin(basePhase + xStrechWaveChecked), -1, 1, 0, xStrechWave) : 0) + yWavexStrer;

    if (yStrechWave !== 0) {
      if (rowIdx % 2 === 1) {
        strecherY = map(sin(basePhase + yStrechWaveChecked), -1, 1, 0, yStrechWave);
      } else {
        strecherY = map(sin(basePhase + yStrechWaveChecked + PI), -1, 1, 0, yStrechWave);
      }
    } else {
      strecherY = 0;
    }

    push();
    translate(colIdx * xSpace + xWaver, rowIdx * ySpace + yWaver, zWaver);
    translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2);

    // Rotation adjustments when zWave is active
    if (zWave !== 0) {
      var preZAnchX = sin(timePhase + (colIdx - 1) * invXOffset + rowIdx * invYOffset + zWaveChecked) * zWave;
      var postZAnchX = sin(timePhase + (colIdx + 1) * invXOffset + rowIdx * invYOffset + zWaveChecked) * zWave;
      var diffZAnchorX = postZAnchX - preZAnchX;
      var newYrot = atan2(Math.abs(diffZAnchorX), 2 * xSpace);
      if (preZAnchX > postZAnchX) { rotateY(newYrot); } else { rotateY(-newYrot); }

      var preZAnchY = sin(timePhase + colIdx * invXOffset + (rowIdx - 1) * invYOffset + zWaveChecked) * zWave;
      var postZAnchY = sin(timePhase + colIdx * invXOffset + (rowIdx + 1) * invYOffset + zWaveChecked) * zWave;
      var diffZAnchorY = postZAnchY - preZAnchY;
      var newXrot = atan2(Math.abs(diffZAnchorY), 2 * ySpace);
      if (preZAnchY > postZAnchY) { rotateX(-newXrot); } else { rotateX(newXrot); }
    }

    if (yWavezRoter !== 0) {
      rotateZ(radians(yWavezRoter));
    }

    keyboardEngine();
    pop();
  }

  pop();
}

function setTextColor(switcher) {
  if (inpNumber == 6) {
    var m = switcher % 6;
    if (m == 0) strkColor = inp1;
    else if (m == 1) strkColor = inp2;
    else if (m == 2) strkColor = inp3;
    else if (m == 3) strkColor = inp4;
    else if (m == 4) strkColor = inp5;
    else strkColor = inp6;
  } else if (inpNumber == 5) {
    var m = switcher % 5;
    if (m == 0) strkColor = inp1;
    else if (m == 1) strkColor = inp2;
    else if (m == 2) strkColor = inp3;
    else if (m == 3) strkColor = inp4;
    else strkColor = inp5;
  } else if (inpNumber == 4) {
    var m = switcher % 4;
    if (m == 0) strkColor = inp1;
    else if (m == 1) strkColor = inp2;
    else if (m == 2) strkColor = inp3;
    else strkColor = inp4;
  } else if (inpNumber == 3) {
    var m = switcher % 3;
    if (m == 0) strkColor = inp1;
    else if (m == 1) strkColor = inp2;
    else strkColor = inp3;
  } else if (inpNumber == 2) {
    strkColor = (switcher % 2 == 0) ? inp1 : inp2;
  } else {
    strkColor = inp1;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

