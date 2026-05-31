var columns = 45;
var rows = 45;

var xSpace = 10;
var ySpace = 20;

var radiusNoise = 0.25;
var noiseSpeed = 0.02; // Slider value (20) / 1000
var tumult = 6.283; // 2 * PI

let pgTextSize = 170;
let currentpgTextSize = 170;

var leading = 0.6;
var currentLeading = 0.6;

var invert = false;

var input = "ALL|GOOD|THINGS|I HOPE.";
var splitInput = [];
var iT = [];
var currentInput = "";

var foreCol, backCol;

// Broadcast settings
var inpText = "";
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

var font0, font1, font2, font3, font4, font5;
var selVal = 0; // Select value mapping for fonts

function preload() {
  font0 = loadFont('../assets/IBMPlexMono-Regular.otf');
  font1 = loadFont('../assets/IBMPlexMono-Regular.otf');
  font2 = loadFont('../assets/WorkSans-Regular.ttf');
  font3 = loadFont('../assets/RobotoCondensed-Bold.ttf');
  font4 = loadFont('../assets/IBMPlexMono-Regular.otf');
  font5 = loadFont('../assets/Roboto-Thin.ttf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);
  noSmooth();

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  columns = 45;
  rows = 45;
  radiusNoise = 0.25;
  noiseSpeed = 0.02; // 20 / 1000
  tumult = 6.283;
  pgTextSize = 170;
  leading = 0.6;
  invert = false;
  selVal = 0;
  input = "ALL|GOOD|THINGS|I HOPE.";
  currentInput = "";

  foreCol = color('#ffffff');
  backCol = color('#000000');

  inpText = "ALL|GOOD|THINGS|I HOPE.";
  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;

  createSplits();
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.noiseSpeed !== undefined) noiseSpeed = settings.noiseSpeed / 1000;
  if (settings.radiusNoise !== undefined) radiusNoise = settings.radiusNoise;
  if (settings.tumult !== undefined) tumult = settings.tumult;
  if (settings.columns !== undefined) columns = settings.columns;
  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.text !== undefined) {
    input = String(settings.text);
    inpText = input;
  }
  if (settings.pgTextSize !== undefined) pgTextSize = settings.pgTextSize;
  if (settings.leading !== undefined) leading = settings.leading;
  if (settings.selVal !== undefined) selVal = settings.selVal;
  if (settings.invert !== undefined) invert = settings.invert;

  createSplits();
}

function updateSettings(data) {
  if (!data) return;

  if (data.preset) {
    const p = data.preset.toLowerCase();
    let loaded = false;
    if (typeof customPresets !== 'undefined') {
      const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase() === p);
      if (matchedKey) {
        applyCustomPreset(customPresets[matchedKey]);
        loaded = true;
      }
    }
    if (!loaded && p === 'reset') {
      reSetting();
    }
  }

  if (data.text !== undefined || data.string !== undefined) {
    input = data.text !== undefined ? String(data.text) : String(data.string);
    inpText = input;
    lastTextTime = millis();
    isClearing = false;
    createSplits();
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.noiseSpeed !== undefined) noiseSpeed = Number(data.noiseSpeed) / 1000;
  if (data.radiusNoise !== undefined) radiusNoise = Number(data.radiusNoise);
  if (data.tumult !== undefined) tumult = Number(data.tumult);
  if (data.columns !== undefined) columns = Number(data.columns);
  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.pgTextSize !== undefined) pgTextSize = Number(data.pgTextSize);
  if (data.leading !== undefined) leading = Number(data.leading);
  if (data.selVal !== undefined) { selVal = Number(data.selVal); createSplits(); }
  if (data.invert !== undefined) { invert = Boolean(data.invert) || data.invert === 'true'; createSplits(); }

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        noiseSpeed: noiseSpeed * 1000,
        radiusNoise: radiusNoise,
        tumult: tumult,
        columns: columns,
        rows: rows,
        text: input,
        pgTextSize: pgTextSize,
        leading: leading,
        selVal: selVal,
        invert: invert
      }
    };
    if (typeof pubChannel !== 'undefined') {
      pubChannel.postMessage(payload);
    }
  }
}

function draw() {
  // --- TIMING AND CLEARING LOGIC ---
  if (clearTextDelay > 0 && !isClearing && inpText !== "") {
    if (millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      input = "";
      isClearing = false;
      createSplits();
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        input = inpText;
        lastRemoveTime = millis();
        createSplits();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        input = inpText;
        lastRemoveTime = millis();
        createSplits();
        if (inpText === "") {
          isClearing = false;
        }
      }
    }
  }

  // --- CANVASES HIDING / EMPTY LOGIC ---
  if ((hideNoText && (!inpText || inpText.trim() === "")) || !inpText || inpText === "") {
    clear();
    if (typeof captureFrame === 'function') captureFrame();
    return;
  }

  clear();

  if (invert) {
    foreCol = color('#000000');
    backCol = color('#ffffff');
  } else {
    foreCol = color('#ffffff');
    backCol = color('#000000');
  }

  background(backCol);

  let currentRadiusNoise = radiusNoise * map(pgTextSize, 0, 1, 0, 2);

  if (input != currentInput || leading != currentLeading || pgTextSize != currentpgTextSize) {
    createSplits();
    currentInput = input;
    currentLeading = leading;
    currentpgTextSize = pgTextSize;
  }

  for (var z = 0; z < splitInput.length; z++) {
    push();
    var stripS = iT[z];
    if (!stripS) {
      pop();
      continue;
    }
    textureMode(NORMAL);

    xSpace = stripS.width / columns;
    ySpace = stripS.height / rows;

    texture(stripS);
    translate(-stripS.width / 2, -stripS.height / 2 - stripS.height * leading * (splitInput.length - 1) / 2 + stripS.height * z * leading);

    for (var y = 0; y < rows; y++) {
      beginShape(TRIANGLE_STRIP);
      for (var x = 0; x <= columns; x++) {
        let baseSpot = dist(0, stripS.height, stripS.width, -stripS.height / 0.5);
        let currentSpot = dist(x * xSpace, y * ySpace, stripS.width, -stripS.height / 0.5);
        let distMap = map(currentSpot, 0, baseSpot, 1, 0);
        let radiusMap = easer(distMap) * currentRadiusNoise;

        let nextSpot = dist(x * xSpace, (y + 1) * ySpace, stripS.width, -stripS.height / 0.5);
        let distMapNext = map(nextSpot, 0, baseSpot, 1, 0);
        let radiusMapNext = easer(distMapNext) * currentRadiusNoise;

        let noiseAngle = map(noise((x - (noiseSpeed * 15) * frameCount) * 0.1, (y + z * rows + (noiseSpeed * 5) * frameCount) * 0.1, frameCount * noiseSpeed), 0, 1, -tumult, tumult);
        let noiseAngleNext = map(noise((x - (noiseSpeed * 15) * frameCount) * 0.1, (y + 1 + z * rows + (noiseSpeed * 5) * frameCount) * 0.1, frameCount * noiseSpeed), 0, 1, -tumult, tumult);

        let u = map(x * xSpace + sin(noiseAngle) * radiusMap, 0, stripS.width, 0, 1);
        let vTop = map(y * ySpace + cos(noiseAngle) * radiusMap, 0, stripS.height, 0, 1);
        let vBottom = map((y + 1) * ySpace + cos(noiseAngleNext) * radiusMapNext, 0, stripS.height, 0, 1);

        vertex(x * xSpace, y * ySpace, u, vTop);
        vertex(x * xSpace, (y + 1) * ySpace, u, vBottom);
      }
      endShape();
    }
    pop();
  }

  if (typeof captureFrame === 'function') captureFrame();
}

function createSplits() {
  if (invert) {
    foreCol = color('#000000');
    backCol = color('#ffffff');
  } else {
    foreCol = color('#ffffff');
    backCol = color('#000000');
  }

  splitInput = input.split('|');

  for (var i = 0; i < splitInput.length; i++) {
    createIndTexture(i, splitInput[i]);
  }
}

function easer(step) {
  var p = 4;
  return pow(step, p) / (pow(step, p) + pow(1 - step, p));
}

function createIndTexture(i, indInput) {
  let selectedFont;

  if (selVal == 0) {
    selectedFont = font1;
  } else if (selVal == 1) {
    selectedFont = font2;
  } else if (selVal == 2) {
    selectedFont = font3;
  } else if (selVal == 3) {
    selectedFont = font4;
  } else if (selVal == 4) {
    selectedFont = font5;
  } else {
    selectedFont = font1;
  }

  textSize(pgTextSize);
  textFont(selectedFont);
  repeatSize = textWidth(indInput) * 1.015;

  var textureWidth = repeatSize * 1.4;
  var textureHeight = pgTextSize * 1.2;

  var textNudgeDown = pgTextSize * 0.7 / 2;

  if (selVal == 3) {
    textureHeight = pgTextSize * 1.75;
    textureWidth = repeatSize * 1.75;
    textNudgeDown = pgTextSize * 0.7 / 4;
  }

  iT[i] = createGraphics(textureWidth, textureHeight);
  iT[i].fill(foreCol);
  iT[i].noStroke();
  iT[i].textAlign(CENTER);
  iT[i].textSize(pgTextSize);
  iT[i].textFont(selectedFont);
  iT[i].translate(textureWidth / 2, textureHeight / 2 + textNudgeDown);
  iT[i].text(indInput, 0, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
