// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "speed_racer": {
        "stackCount": 14,
        "fontSize": 90,
        "innerH": 985,
        "innerV": -225,
        "rotateFactor": -0.11,
        "textColor": "#000000",
        "blockColor": "#ffffff",
        "strokeColor": "#FF7E79",
        "bkgdColor": "#0000ff",
        "p.text": "GO, SPEED RACER, GO! ",
        "fontSelect": 1
    },
    "to_space": {
        "stackCount": 14,
        "fontSize": 300,
        "innerH": -10,
        "innerV": -10,
        "rotateFactor": -0.28,
        "textColor": "#000000",
        "blockColor": "#ffffff",
        "strokeColor": "#000000",
        "bkgdColor": "#0000ff",
        "p.text": "Go. Go. Go. ",
        "fontSelect": 4
    },
    "hangul_sample": {
        "stackCount": 16,
        "fontSize": 155,
        "innerH": 140,
        "innerV": 40,
        "rotateFactor": -0.78,
        "textColor": "#FFD479",
        "blockColor": "#000000",
        "strokeColor": "#ffffff",
        "bkgdColor": "#ffffff",
        "p.text": "나선형의 것 ",
        "fontSelect": 5
    },
    "lost_time": {
        "stackCount": 14,
        "fontSize": 100,
        "innerH": 600,
        "innerV": 50,
        "rotateFactor": 0,
        "textColor": "#ffffff",
        "blockColor": "#000000",
        "strokeColor": "#FF7E79",
        "bkgdColor": "#FF7E79",
        "p.text": "LOST TIME LOST TIME ",
        "fontSelect": 3
    },
    "dot_spiral": {
        "stackCount": 20,
        "fontSize": 250,
        "innerH": -50,
        "innerV": -165,
        "rotateFactor": 0.42,
        "textColor": "#ffffff",
        "blockColor": "#000000",
        "strokeColor": "#000000",
        "bkgdColor": "#0000ff",
        "p.text": ". . . . . . . . ",
        "fontSelect": 4,
        "radioVal": 2
    },
    "be_aggressive": {
        "stackCount": 20,
        "fontSize": 110,
        "innerH": -150,
        "innerV": -250,
        "rotateFactor": -0.1,
        "textColor": "#FF7E79",
        "blockColor": "#000000",
        "strokeColor": "#000000",
        "bkgdColor": "#ffffff",
        "p.text": "BE AGGRESSIVE.  ",
        "fontSelect": 6,
        "radioVal": 2
    },
    "meat_space": {
        "stackCount": 20,
        "fontSize": 100,
        "innerH": 415,
        "innerV": 1035,
        "rotateFactor": 0,
        "textColor": "#73FA79",
        "blockColor": "#000000",
        "strokeColor": "#ffffff",
        "bkgdColor": "#ffffff",
        "p.text": "MEAT SPACE -- // MEAT SPACE -- //",
        "fontSelect": 2
    }
};



    // --- ORIGINAL SKETCH.JS CODE ---
    p5.disableFriendlyErrors = true;

let shelfHeightH, shelfWidthH;
let shelfHeightV, shelfWidthV;
let fontSize = 100;
let sWidth;
let textRepeats;
let alphaStep;
let pinchFactor = 20;
let rotateFactor = 0.0;

let layerDepth = 200;

var blockColor, textColor, strokeColor, bkgdColor;

let innerH = 700;
let innerV = 50;
let pinchH, pinchV;

let stackCount = 14;

let fontAnimate;
var fontSelect = 0;
var radioVal = 0; // 0 = " ", 1 = "  ", 2 = "   "

// Broadcast settings
var inpText = "GOING. GOING. GOING. ";
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

var fontMenu, fontSelect1, fontSelect2, fontSelect3, fontSelect4, fontSelect5, fontSelect6, fontSelect7;

function preload() {
  fontMenu = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect1 = p.loadFont("../assets/WorkSans-Regular.ttf");
  fontSelect2 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect3 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect4 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect5 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect6 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect7 = p.loadFont("../assets/IBMPlexMono-Regular.otf");
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h, p.WEBGL);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  stackCount = 14;
  fontSize = 100;
  innerH = 700;
  innerV = 50;
  rotateFactor = 0;
  fontSelect = 0;
  radioVal = 0;

  textColor = p.color('#000000');
  blockColor = p.color('#ffffff');
  strokeColor = p.color('#000000');
  bkgdColor = p.color('#0000ff');

  inpText = "GOING. GOING. GOING. ";

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = p.millis();
  isClearing = false;
  lastRemoveTime = 0;

  setFont();
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.stackCount !== undefined) stackCount = settings.stackCount;
  if (settings.fontSize !== undefined) fontSize = settings.fontSize;
  if (settings.innerH !== undefined) innerH = settings.innerH;
  if (settings.innerV !== undefined) innerV = settings.innerV;
  if (settings.rotateFactor !== undefined) rotateFactor = settings.rotateFactor;
  if (settings.fontSelect !== undefined) fontSelect = settings.fontSelect;
  if (settings.radioVal !== undefined) radioVal = settings.radioVal;

  if (settings.textColor !== undefined) textColor = p.color(settings.textColor);
  if (settings.blockColor !== undefined) blockColor = p.color(settings.blockColor);
  if (settings.strokeColor !== undefined) strokeColor = p.color(settings.strokeColor);
  if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
  if (settings.text !== undefined) inpText = String(settings.text);

  setFont();
}

function updateSettings(data) {
  if (!data) return;

  if (data.preset) {
    const p = data.preset.toLowerCase().replace(" ", "_");
    let loaded = false;
    if (typeof customPresets !== 'undefined') {
      const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase().replace(" ", "_") === p);
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
    inpText = data.text !== undefined ? String(data.text) : String(data.string);
    lastTextTime = p.millis();
    isClearing = false;
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.stackCount !== undefined) stackCount = Number(data.stackCount);
  if (data.fontSize !== undefined) fontSize = Number(data.fontSize);
  if (data.innerH !== undefined) innerH = Number(data.innerH);
  if (data.innerV !== undefined) innerV = Number(data.innerV);
  if (data.rotateFactor !== undefined) rotateFactor = Number(data.rotateFactor);
  if (data.fontSelect !== undefined) { fontSelect = Number(data.fontSelect); setFont(); }
  if (data.radioVal !== undefined) radioVal = Number(data.radioVal);

  if (data.textColor !== undefined) textColor = p.color(data.textColor);
  if (data.blockColor !== undefined) blockColor = p.color(data.blockColor);
  if (data.strokeColor !== undefined) strokeColor = p.color(data.strokeColor);
  if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        stackCount: stackCount,
        fontSize: fontSize,
        innerH: innerH,
        innerV: innerV,
        rotateFactor: rotateFactor,
        fontSelect: fontSelect,
        radioVal: radioVal,
        textColor: textColor.toString(),
        blockColor: blockColor.toString(),
        strokeColor: strokeColor.toString(),
        bkgdColor: bkgdColor.toString(),
        text: inpText
      }
    };
    if (typeof pubChannel !== 'undefined') {
      pubChannel.postMessage(payload);
    }
  }
}

function setFont() {
  if (fontSelect == 0) { fontAnimate = fontSelect1; }
  else if (fontSelect == 1) { fontAnimate = fontSelect2; }
  else if (fontSelect == 2) { fontAnimate = fontSelect3; }
  else if (fontSelect == 3) { fontAnimate = fontSelect4; }
  else if (fontSelect == 4) { fontAnimate = fontSelect5; }
  else if (fontSelect == 5) { fontAnimate = fontSelect6; }
  else if (fontSelect == 6) { fontAnimate = fontSelect7; }
  else { fontAnimate = fontSelect1; }
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
      isClearing = false;
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = p.millis();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = p.millis();
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

  p.background(bkgdColor);

  shelfHeightH = p.height;
  shelfWidthH = p.width * 4;
  shelfHeightV = p.height;
  shelfWidthV = p.height * 4;

  rectMode(p.CENTER);
  p.textFont(fontAnimate);
  p.textSize(fontSize);
  p.textAlign(p.LEFT);

  sWidth = p.textWidth(inpText);
  if (sWidth <= 0) sWidth = 1;
  textRepeats = p.floor(p.width / sWidth) + 3;

  let hSpace = -p.height / 2 - shelfHeightH / 2;
  let vSpace = -p.width / 2 - shelfHeightV / 2;

  pinchH = -((hSpace + shelfHeightH / 2) + innerH) / stackCount;
  pinchV = -((vSpace + shelfHeightV / 2) + innerV) / stackCount;

  p.push();

  if (radioVal == 0) {
    p.translate(0, 0, layerDepth);
  } else if (radioVal == 1) {
    p.translate(0, 0, layerDepth * 3);
    p.rotateY(p.PI / 8);
    p.rotateX(p.PI / 8);
  } else if (radioVal == 2) {
    p.translate(0, -p.height / 4, layerDepth * 2);
    p.rotateX(p.PI / 8);
  }

  for (var i = stackCount; i > 0; i--) {
    if (i == stackCount) {
      alphaStep = p.map(p.frameCount * 2 % layerDepth, 0, layerDepth, 0, 255);
    } else {
      alphaStep = 255;
    }

    blockColor.setAlpha(alphaStep);
    strokeColor.setAlpha(alphaStep);
    textColor.setAlpha(alphaStep);

    p.push();
    p.translate(0, 0, i * -layerDepth);
    p.translate(0, 0, p.frameCount * 2 % layerDepth);

    for (var j = 0; j < 4; j++) {
      p.push();
      p.rotateZ(rotateFactor * i - rotateFactor * (p.frameCount * 2 % layerDepth) / layerDepth);
      p.rotateZ(j * p.PI / 2);

      if (j % 2 == 0) {
        p.translate(0, hSpace + pinchH * i - pinchH * (p.frameCount * 2 % layerDepth) / layerDepth);
      } else {
        p.translate(0, vSpace + pinchV * i - pinchV * (p.frameCount * 2 % layerDepth) / layerDepth);
      }

      p.rotateY(p.radians(1));

      p.fill(blockColor);
      p.stroke(strokeColor); p.strokeWeight(3);

      if (j % 2 == 0) {
        p.rect(0, 0, shelfWidthH, shelfHeightH);
        p.translate(0, shelfHeightH / 2 - 20, 1);
      } else {
        p.rect(0, 0, shelfWidthV, shelfHeightV);
        p.translate(0, shelfHeightV / 2 - 20, 1);
      }

      for (var k = 0; k < textRepeats; k++) {
        p.push();
        p.translate(k * sWidth - sWidth, 0);
        p.translate(-(p.frameCount * 4) % sWidth, 0);
        p.fill(textColor); p.noStroke();
        p.text(inpText, 0, 0);
        p.pop();
      }

      p.pop();
    }
    p.pop();
  }
  p.pop();

  if (typeof captureFrame === 'function') captureFrame();
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
