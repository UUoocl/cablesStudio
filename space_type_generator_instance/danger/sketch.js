// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "all_yours": {
        "noiseSpeed": 20,
        "radiusNoise": 0.8,
        "tumult": 15.708, // 5*p.PI
        "columns": 45,
        "rows": 45,
        "p.text": "One|day|all|this|will|be|yours.",
        "pgTextSize": 85,
        "leading": 0.75,
        "selVal": 0,
        "invert": false
    },
    "just_ok": {
        "noiseSpeed": 12,
        "radiusNoise": 0.8,
        "tumult": 15.708, // 5*p.PI
        "columns": 15,
        "rows": 150,
        "p.text": "OK",
        "pgTextSize": 500,
        "leading": 0.6,
        "selVal": 4,
        "invert": false
    },
    "not_so_good": {
        "noiseSpeed": 10,
        "radiusNoise": 1.0,
        "tumult": 15.708, // 5*p.PI
        "columns": 30,
        "rows": 30,
        "p.text": "NOT|SO|GOOD",
        "pgTextSize": 220,
        "leading": 0.65,
        "selVal": 2,
        "invert": true
    },
    "be_aggressive": {
        "noiseSpeed": 15,
        "radiusNoise": 0.2,
        "tumult": 12.566, // 4*p.PI
        "columns": 40,
        "rows": 50,
        "p.text": "be|aggressive",
        "pgTextSize": 110,
        "leading": 0.4,
        "selVal": 3,
        "invert": true
    },
    "today_date": {
        "noiseSpeed": 15,
        "radiusNoise": 0.2,
        "tumult": 18.8496, // 6*p.PI
        "columns": 80,
        "rows": 80,
        "p.text": "2016–|TODAY",
        "pgTextSize": 50,
        "leading": 0.65,
        "selVal": 0,
        "invert": true
    },
    "hopes": {
        "noiseSpeed": 10,
        "radiusNoise": 1.0,
        "tumult": 9.4248, // 3*p.PI
        "columns": 25,
        "rows": 25,
        "p.text": "Hopes|    and|  Dangers",
        "pgTextSize": 50,
        "leading": 0.4,
        "selVal": 3,
        "invert": false
    },
    "circle": {
        "noiseSpeed": 20,
        "radiusNoise": 1.0,
        "tumult": 6.283, // 2*p.PI
        "columns": 30,
        "rows": 150,
        "p.text": " O ",
        "pgTextSize": 500,
        "leading": 0.0,
        "selVal": 1,
        "invert": true
    }
};



    // --- ORIGINAL SKETCH.JS CODE ---
    var columns = 45;
var rows = 45;

var xSpace = 10;
var ySpace = 20;

var radiusNoise = 0.25;
var noiseSpeed = 0.02; // Slider value (20) / 1000
var tumult = 6.283; // 2 * p.PI

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
  font0 = p.loadFont('../assets/IBMPlexMono-Regular.otf');
  font1 = p.loadFont('../assets/IBMPlexMono-Regular.otf');
  font2 = p.loadFont('../assets/WorkSans-Regular.ttf');
  font3 = p.loadFont('../assets/RobotoCondensed-Bold.ttf');
  font4 = p.loadFont('../assets/IBMPlexMono-Regular.otf');
  font5 = p.loadFont('../assets/Roboto-Thin.ttf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h, p.WEBGL);
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

  foreCol = p.color('#ffffff');
  backCol = p.color('#000000');

  inpText = "ALL|GOOD|THINGS|I HOPE.";
  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = p.millis();
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
    lastTextTime = p.millis();
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
    if (p.millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = p.millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      input = "";
      isClearing = false;
      createSplits();
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        input = inpText;
        lastRemoveTime = p.millis();
        createSplits();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        input = inpText;
        lastRemoveTime = p.millis();
        createSplits();
        if (inpText === "") {
          isClearing = false;
        }
      }
    }
  }

  // --- CANVASES HIDING / EMPTY LOGIC ---
  if ((hideNoText && (!inpText || inpText.trim() === "")) || !inpText || inpText === "") {
    p.clear();
    if (typeof captureFrame === 'function') captureFrame();
    return;
  }

  p.clear();

  if (invert) {
    foreCol = p.color('#000000');
    backCol = p.color('#ffffff');
  } else {
    foreCol = p.color('#ffffff');
    backCol = p.color('#000000');
  }

  p.background(backCol);

  let currentRadiusNoise = radiusNoise * p.map(pgTextSize, 0, 1, 0, 2);

  if (input != currentInput || leading != currentLeading || pgTextSize != currentpgTextSize) {
    createSplits();
    currentInput = input;
    currentLeading = leading;
    currentpgTextSize = pgTextSize;
  }

  for (var z = 0; z < splitInput.length; z++) {
    p.push();
    var stripS = iT[z];
    if (!stripS) {
      p.pop();
      continue;
    }
    p.textureMode(NORMAL);

    xSpace = stripS.width / columns;
    ySpace = stripS.height / rows;

    p.texture(stripS);
    p.translate(-stripS.width / 2, -stripS.height / 2 - stripS.height * leading * (splitInput.length - 1) / 2 + stripS.height * z * leading);

    for (var y = 0; y < rows; y++) {
      p.beginShape(TRIANGLE_STRIP);
      for (var x = 0; x <= columns; x++) {
        let baseSpot = p.dist(0, stripS.height, stripS.width, -stripS.height / 0.5);
        let currentSpot = p.dist(x * xSpace, y * ySpace, stripS.width, -stripS.height / 0.5);
        let distMap = p.map(currentSpot, 0, baseSpot, 1, 0);
        let radiusMap = easer(distMap) * currentRadiusNoise;

        let nextSpot = p.dist(x * xSpace, (y + 1) * ySpace, stripS.width, -stripS.height / 0.5);
        let distMapNext = p.map(nextSpot, 0, baseSpot, 1, 0);
        let radiusMapNext = easer(distMapNext) * currentRadiusNoise;

        let noiseAngle = p.map(p.noise((x - (noiseSpeed * 15) * p.frameCount) * 0.1, (y + z * rows + (noiseSpeed * 5) * p.frameCount) * 0.1, p.frameCount * noiseSpeed), 0, 1, -tumult, tumult);
        let noiseAngleNext = p.map(p.noise((x - (noiseSpeed * 15) * p.frameCount) * 0.1, (y + 1 + z * rows + (noiseSpeed * 5) * p.frameCount) * 0.1, p.frameCount * noiseSpeed), 0, 1, -tumult, tumult);

        let u = p.map(x * xSpace + p.sin(noiseAngle) * radiusMap, 0, stripS.width, 0, 1);
        let vTop = p.map(y * ySpace + p.cos(noiseAngle) * radiusMap, 0, stripS.height, 0, 1);
        let vBottom = p.map((y + 1) * ySpace + p.cos(noiseAngleNext) * radiusMapNext, 0, stripS.height, 0, 1);

        p.vertex(x * xSpace, y * ySpace, u, vTop);
        p.vertex(x * xSpace, (y + 1) * ySpace, u, vBottom);
      }
      p.endShape();
    }
    p.pop();
  }

  if (typeof captureFrame === 'function') captureFrame();
}

function createSplits() {
  if (invert) {
    foreCol = p.color('#000000');
    backCol = p.color('#ffffff');
  } else {
    foreCol = p.color('#ffffff');
    backCol = p.color('#000000');
  }

  splitInput = input.split('|');

  for (var i = 0; i < splitInput.length; i++) {
    createIndTexture(i, splitInput[i]);
  }
}

function easer(step) {
  var p = 4;
  return p.pow(step, p) / (p.pow(step, p) + p.pow(1 - step, p));
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

  p.textSize(pgTextSize);
  p.textFont(selectedFont);
  repeatSize = p.textWidth(indInput) * 1.015;

  var textureWidth = repeatSize * 1.4;
  var textureHeight = pgTextSize * 1.2;

  var textNudgeDown = pgTextSize * 0.7 / 2;

  if (selVal == 3) {
    textureHeight = pgTextSize * 1.75;
    textureWidth = repeatSize * 1.75;
    textNudgeDown = pgTextSize * 0.7 / 4;
  }

  iT[i] = p.createGraphics(textureWidth, textureHeight);
  iT[i].fill(foreCol);
  iT[i].noStroke();
  iT[i].textAlign(p.CENTER);
  iT[i].textSize(pgTextSize);
  iT[i].textFont(selectedFont);
  iT[i].translate(textureWidth / 2, textureHeight / 2 + textNudgeDown);
  iT[i].text(indInput, 0, 0);
}

function windowResized() {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
}


    // --- BIND LIFECYCLE HOOKS TO INSTANCE ---
    if (typeof preload === 'function') p.preload = preload;
    if (typeof setup === 'function') p.setup = setup;
    if (typeof draw === 'function') p.draw = draw;
    if (typeof windowResized === 'function') p.windowResized = windowResized;
    if (typeof keyPressed === 'function') p.keyPressed = keyPressed;
    if (typeof keyReleased === 'function') p.keyReleased = keyReleased;
    if (typeof keyTyped === 'function') p.keyTyped = keyTyped;
    if (typeof mousePressed === 'function') p.mousePressed = mousePressed;
    if (typeof mouseReleased === 'function') p.mouseReleased = mouseReleased;
    if (typeof mouseDragged === 'function') p.mouseDragged = mouseDragged;

    // --- CABLES GL DATA BRIDGE ---
    p.onDataChange = (data) => {
        if (data && typeof updateSettings === 'function') {
            updateSettings(data);
        }
    };
    
    // Fallback resize hook
    p.onResize = (w, h) => {
        if (p.resizeCanvas) p.resizeCanvas(w, h);
    };
}
