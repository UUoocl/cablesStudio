// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var strecherX = 0;
var strecherY = 0;

// FIELD
var column = 21;
var row = 21;
var tracking = 5;
var lineSpace = 5;
var xSpace, ySpace;

// WAVE
var speed = 2;
var xOffset = 3.1416; // PI
var yOffset = 3.1416; // PI
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
var letter_select, inpText = "SPACE-TYPE-GENERATOR";
var runLength;
var fullText = false;

// COLOR
var strkColor;
var bkgdColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;

// Broadcast settings
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

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

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  yWaver = 0;
  column = 33;
  row = 7;
  tracking = 5;
  lineSpace = 5;
  typeX = 20;
  typeY = 40;
  typeStroke = 2;
  speed = -2;
  xOffset = 3.1;
  yOffset = 3.1;
  xWave = 0;
  zWave = 0;
  xStrechWave = 0;
  yStrechWave = 0;
  yWave = 0;
  yWavezRot = 0;
  yWavexStr = 0;
  xRotCamera = 0;
  yRotCamera = 0;
  zRotCamera = 0;
  zoomCamera = 0;

  xStrechWaveChecked = 0;
  yStrechWaveChecked = 0;
  xWaveChecked = 0;
  yWaveChecked = 0;
  zWaveChecked = 0;
  fullText = false;

  inp1 = color('#000000');
  inp2 = color('#ff0000');
  inp3 = color('#0000ff');
  inp4 = color('#ffff00');
  inp5 = color('#ffffff');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff');

  inpNumber = 1;
  inpText = "SPACE-TYPE-GENERATOR";

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;
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
  if (settings.xWave !== undefined) xWave = settings.xWave;
  if (settings.zWave !== undefined) zWave = settings.zWave;
  if (settings.xStrechWave !== undefined) xStrechWave = settings.xStrechWave;
  if (settings.yStrechWave !== undefined) yStrechWave = settings.yStrechWave;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.yWavezRot !== undefined) yWavezRot = settings.yWavezRot;
  if (settings.yWavexStr !== undefined) yWavexStr = settings.yWavexStr;
  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;

  if (settings.xStrechWaveChecked !== undefined) xStrechWaveChecked = settings.xStrechWaveChecked;
  if (settings.yStrechWaveChecked !== undefined) yStrechWaveChecked = settings.yStrechWaveChecked;
  if (settings.xWaveChecked !== undefined) xWaveChecked = settings.xWaveChecked;
  if (settings.yWaveChecked !== undefined) yWaveChecked = settings.yWaveChecked;
  if (settings.zWaveChecked !== undefined) zWaveChecked = settings.zWaveChecked;
  if (settings.fullText !== undefined) fullText = settings.fullText;

  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
  if (settings.color1 !== undefined) { inp1 = color(settings.color1); }
  if (settings.color2 !== undefined) { inp2 = color(settings.color2); }
  if (settings.color3 !== undefined) { inp3 = color(settings.color3); }
  if (settings.color4 !== undefined) { inp4 = color(settings.color4); }
  if (settings.color5 !== undefined) { inp5 = color(settings.color5); }
  if (settings.color6 !== undefined) { inp6 = color(settings.color6); }
  if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
  if (settings.text !== undefined) inpText = String(settings.text);
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
    if (!loaded && p === 'pride') {
      pride();
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

  if (data.column !== undefined) column = Number(data.column);
  if (data.row !== undefined) row = Number(data.row);
  if (data.tracking !== undefined) tracking = Number(data.tracking);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.speed !== undefined) speed = Number(data.speed);
  if (data.xOffset !== undefined) xOffset = Number(data.xOffset);
  if (data.yOffset !== undefined) yOffset = Number(data.yOffset);
  if (data.xWave !== undefined) xWave = Number(data.xWave);
  if (data.zWave !== undefined) zWave = Number(data.zWave);
  if (data.xStrechWave !== undefined) xStrechWave = Number(data.xStrechWave);
  if (data.yStrechWave !== undefined) yStrechWave = Number(data.yStrechWave);
  if (data.yWave !== undefined) yWave = Number(data.yWave);
  if (data.yWavezRot !== undefined) yWavezRot = Number(data.yWavezRot);
  if (data.yWavexStr !== undefined) yWavexStr = Number(data.yWavexStr);
  if (data.xRotCamera !== undefined) xRotCamera = Number(data.xRotCamera);
  if (data.yRotCamera !== undefined) yRotCamera = Number(data.yRotCamera);
  if (data.zRotCamera !== undefined) zRotCamera = Number(data.zRotCamera);
  if (data.zoomCamera !== undefined) zoomCamera = Number(data.zoomCamera);

  if (data.xStrechWaveChecked !== undefined) xStrechWaveChecked = Number(data.xStrechWaveChecked);
  if (data.yStrechWaveChecked !== undefined) yStrechWaveChecked = Number(data.yStrechWaveChecked);
  if (data.xWaveChecked !== undefined) xWaveChecked = Number(data.xWaveChecked);
  if (data.yWaveChecked !== undefined) yWaveChecked = Number(data.yWaveChecked);
  if (data.zWaveChecked !== undefined) zWaveChecked = Number(data.zWaveChecked);
  if (data.fullText !== undefined) fullText = Boolean(data.fullText) || data.fullText === 'true';

  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
  if (data.color1 !== undefined) { inp1 = color(data.color1); }
  if (data.color2 !== undefined) { inp2 = color(data.color2); }
  if (data.color3 !== undefined) { inp3 = color(data.color3); }
  if (data.color4 !== undefined) { inp4 = color(data.color4); }
  if (data.color5 !== undefined) { inp5 = color(data.color5); }
  if (data.color6 !== undefined) { inp6 = color(data.color6); }
  if (data.inpNumber !== undefined) inpNumber = Number(data.inpNumber);

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        column: column,
        row: row,
        tracking: tracking,
        lineSpace: lineSpace,
        typeX: typeX,
        typeY: typeY,
        typeStroke: typeStroke,
        speed: speed,
        xOffset: xOffset,
        yOffset: yOffset,
        xWave: xWave,
        zWave: zWave,
        xStrechWave: xStrechWave,
        yStrechWave: yStrechWave,
        yWave: yWave,
        yWavezRot: yWavezRot,
        yWavexStr: yWavexStr,
        xRotCamera: xRotCamera,
        yRotCamera: yRotCamera,
        zRotCamera: zRotCamera,
        zoomCamera: zoomCamera,
        xStrechWaveChecked: xStrechWaveChecked,
        yStrechWaveChecked: yStrechWaveChecked,
        xWaveChecked: xWaveChecked,
        yWaveChecked: yWaveChecked,
        zWaveChecked: zWaveChecked,
        fullText: fullText,
        inpNumber: inpNumber,
        bkgdColor: bkgdColor.toString(),
        color1: inp1.toString(),
        color2: inp2 ? inp2.toString() : undefined,
        color3: inp3 ? inp3.toString() : undefined,
        color4: inp4 ? inp4.toString() : undefined,
        color5: inp5 ? inp5.toString() : undefined,
        color6: inp6 ? inp6.toString() : undefined,
        text: inpText
      }
    };
    if (typeof pubChannel !== 'undefined') {
      pubChannel.postMessage(payload);
    }
  }
}

function pride() {
  inpNumber = 6;
  inp1 = color('#e70000');
  inp2 = color('#ff8c00');
  inp3 = color('#ffef00');
  inp4 = color('#00811f');
  inp5 = color('#0044ff');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff');
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

  xSpace = typeX + tracking;
  ySpace = typeY + lineSpace + yStrechWave / 2;

  noFill();
  strokeWeight(typeStroke);

  push();
  // camera
  translate(0, 0, zoomCamera);
  rotateX(radians(xRotCamera));
  rotateY(radians(yRotCamera));
  rotateZ(radians(zRotCamera));

  if (fullText === true) {
    runLength = row * column;
    translate(-column * xSpace / 2, -row * ySpace / 2);
  } else {
    runLength = inpText.length;
    if (inpText.length >= column) {
      translate(-column * xSpace / 2, -floor(inpText.length / column) * ySpace / 2);
    } else {
      translate(-inpText.length * xSpace / 2, -floor(inpText.length / column) * ySpace / 2);
    }
  }

  // THE TYPE
  for (var i = 0; i < runLength; i++) {
    if (fullText === true) {
      letter_select = i % inpText.length;
    } else {
      letter_select = i;
    }

    setTextColor(floor(i / column));
    stroke(strkColor);

    zWaver = sinEngine(zWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1) * zWave;
    xWaver = map(sinEngine(xWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1), -1, 1, 0, xWave);
    yWaver = sinEngine(yWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1) * yWave;

    yWavezRoter = cosEngine(yWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1) * yWavezRot;
    yWavexStrer = map(cosEngine2(yWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1), -1, 1, 0, yWavexStr);

    strecherX = map(sinEngine(xStrechWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1), -1, 1, 0, xStrechWave) + yWavexStrer;

    if (floor(i / column) % 2 == 1) {
      strecherY = map(sinEngine(yStrechWaveChecked, xOffset, i % column, yOffset, floor(i / column), speed, 1), -1, 1, 0, yStrechWave);
    } else {
      strecherY = map(sinEngine(yStrechWaveChecked + PI, xOffset, i % column, yOffset, floor(i / column), speed, 1), -1, 1, 0, yStrechWave);
    }

    push();
    translate((i % column) * xSpace + xWaver, floor(i / column) * ySpace + yWaver, zWaver);
    translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2);

    // rotation adjustments
    var preZAnchX = sinEngine(zWaveChecked, xOffset, (i % column) - 1, yOffset, floor((i) / column), speed, 1) * zWave;
    var postZAnchX = sinEngine(zWaveChecked, xOffset, (i % column) + 1, yOffset, floor((i) / column), speed, 1) * zWave;
    var diffZAnchorX = postZAnchX - preZAnchX;
    var newYrot = atan2(abs(diffZAnchorX), 2 * xSpace);
    if (preZAnchX > postZAnchX) { rotateY(newYrot); } else { rotateY(-newYrot); }

    var preZAnchY = sinEngine(zWaveChecked, xOffset, i % column, yOffset, floor(i / column) - 1, speed, 1) * zWave;
    var postZAnchY = sinEngine(zWaveChecked, xOffset, i % column, yOffset, floor(i / column) + 1, speed, 1) * zWave;
    var diffZAnchorY = postZAnchY - preZAnchY;
    var newXrot = atan2(abs(diffZAnchorY), 2 * ySpace);
    if (preZAnchY > postZAnchY) { rotateX(-newXrot); } else { rotateX(newXrot); }

    rotateZ(radians(yWavezRoter));
    keyboardEngine();
    pop();
  }

  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var sinus = sin((frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - pow(1 - abs(sinus), slopeN));
  return sinerSquare;
}

function cosEngine(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var cosus = cos((frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset));
  var sign = (cosus >= 0 ? 1 : -1);
  var coserSquare = sign * (1 - pow(1 - abs(cosus), slopeN));
  return coserSquare;
}

function cosEngine2(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var cosus = cos((frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset) * 2);
  var sign = (cosus >= 0 ? 1 : -1);
  var coserSquare = sign * (1 - pow(1 - abs(cosus), slopeN));
  return coserSquare;
}

function setTextColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { strkColor = inp1; }
    if (switcher % 6 == 1) { strkColor = inp2; }
    if (switcher % 6 == 2) { strkColor = inp3; }
    if (switcher % 6 == 3) { strkColor = inp4; }
    if (switcher % 6 == 4) { strkColor = inp5; }
    if (switcher % 6 == 5) { strkColor = inp6; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { strkColor = inp1; }
    if (switcher % 5 == 1) { strkColor = inp2; }
    if (switcher % 5 == 2) { strkColor = inp3; }
    if (switcher % 5 == 3) { strkColor = inp4; }
    if (switcher % 5 == 4) { strkColor = inp5; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { strkColor = inp1; }
    if (switcher % 4 == 1) { strkColor = inp2; }
    if (switcher % 4 == 2) { strkColor = inp3; }
    if (switcher % 4 == 3) { strkColor = inp4; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { strkColor = inp1; }
    if (switcher % 3 == 1) { strkColor = inp2; }
    if (switcher % 3 == 2) { strkColor = inp3; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { strkColor = inp1; }
    if (switcher % 2 == 1) { strkColor = inp2; }
  } else if (inpNumber == 1) {
    strkColor = inp1;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
