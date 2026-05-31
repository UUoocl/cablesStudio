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
  fontMenu = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect1 = loadFont("../assets/WorkSans-Regular.ttf");
  fontSelect2 = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect3 = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect4 = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect5 = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect6 = loadFont("../assets/IBMPlexMono-Regular.otf");
  fontSelect7 = loadFont("../assets/IBMPlexMono-Regular.otf");
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);

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

  textColor = color('#000000');
  blockColor = color('#ffffff');
  strokeColor = color('#000000');
  bkgdColor = color('#0000ff');

  inpText = "GOING. GOING. GOING. ";

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
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

  if (settings.textColor !== undefined) textColor = color(settings.textColor);
  if (settings.blockColor !== undefined) blockColor = color(settings.blockColor);
  if (settings.strokeColor !== undefined) strokeColor = color(settings.strokeColor);
  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
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
    lastTextTime = millis();
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

  if (data.textColor !== undefined) textColor = color(data.textColor);
  if (data.blockColor !== undefined) blockColor = color(data.blockColor);
  if (data.strokeColor !== undefined) strokeColor = color(data.strokeColor);
  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);

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
    if (millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = millis();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
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

  background(bkgdColor);

  shelfHeightH = height;
  shelfWidthH = width * 4;
  shelfHeightV = height;
  shelfWidthV = height * 4;

  rectMode(CENTER);
  textFont(fontAnimate);
  textSize(fontSize);
  textAlign(LEFT);

  sWidth = textWidth(inpText);
  if (sWidth <= 0) sWidth = 1;
  textRepeats = floor(width / sWidth) + 3;

  let hSpace = -height / 2 - shelfHeightH / 2;
  let vSpace = -width / 2 - shelfHeightV / 2;

  pinchH = -((hSpace + shelfHeightH / 2) + innerH) / stackCount;
  pinchV = -((vSpace + shelfHeightV / 2) + innerV) / stackCount;

  push();

  if (radioVal == 0) {
    translate(0, 0, layerDepth);
  } else if (radioVal == 1) {
    translate(0, 0, layerDepth * 3);
    rotateY(PI / 8);
    rotateX(PI / 8);
  } else if (radioVal == 2) {
    translate(0, -height / 4, layerDepth * 2);
    rotateX(PI / 8);
  }

  for (var i = stackCount; i > 0; i--) {
    if (i == stackCount) {
      alphaStep = map(frameCount * 2 % layerDepth, 0, layerDepth, 0, 255);
    } else {
      alphaStep = 255;
    }

    blockColor.setAlpha(alphaStep);
    strokeColor.setAlpha(alphaStep);
    textColor.setAlpha(alphaStep);

    push();
    translate(0, 0, i * -layerDepth);
    translate(0, 0, frameCount * 2 % layerDepth);

    for (var j = 0; j < 4; j++) {
      push();
      rotateZ(rotateFactor * i - rotateFactor * (frameCount * 2 % layerDepth) / layerDepth);
      rotateZ(j * PI / 2);

      if (j % 2 == 0) {
        translate(0, hSpace + pinchH * i - pinchH * (frameCount * 2 % layerDepth) / layerDepth);
      } else {
        translate(0, vSpace + pinchV * i - pinchV * (frameCount * 2 % layerDepth) / layerDepth);
      }

      rotateY(radians(1));

      fill(blockColor);
      stroke(strokeColor); strokeWeight(3);

      if (j % 2 == 0) {
        rect(0, 0, shelfWidthH, shelfHeightH);
        translate(0, shelfHeightH / 2 - 20, 1);
      } else {
        rect(0, 0, shelfWidthV, shelfHeightV);
        translate(0, shelfHeightV / 2 - 20, 1);
      }

      for (var k = 0; k < textRepeats; k++) {
        push();
        translate(k * sWidth - sWidth, 0);
        translate(-(frameCount * 4) % sWidth, 0);
        fill(textColor); noStroke();
        text(inpText, 0, 0);
        pop();
      }

      pop();
    }
    pop();
  }
  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
