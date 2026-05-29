// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var tracking = 10;

// FIELD
var xSpace, ySpace;
var SA;

// RIBBONS
var ribbonCount = 9;
var ribbonSpaceX = -17;
var ribbonSpaceY = -35;
var ribbonSize = 35;
var ribbonColor;
var ribbonOffset = 0.2;

// WAVE
var yWave = 95, yWaver;
var speed = 0.01;
var offset = 0.26;
var slope = 1;

// STRING
var letter_select, inpText = "SPACE TYPE GENERATOR _V.STRIPES";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 3;

// CLEAR AND HIDE
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
  createCanvas(w, h);
  pixelDensity(1);
  smooth();
  textFont(font);

  // Initialize defaults
  reSetting();

  if (typeof signalReady === 'function') signalReady();
  //frameRate(30);
}

function reSetting() {
  typeX = 20; typeY = 40; typeStroke = 2; tracking = 10;
  ribbonCount = 9; ribbonSpaceX = -17; ribbonSpaceY = -35; ribbonSize = 35; ribbonOffset = 0.2;
  yWave = 95; speed = 0.01; offset = 0.26; slope = 1;

  inp1 = color('#ff0000');
  inp2 = color('#0000ff');
  inp3 = color('#ffff00');
  inp4 = color('#ffffff');
  inp5 = color('#000000');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff00');

  inpNumber = 3;
  inpText = "SPACE TYPE GENERATOR _V.STRIPES";

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

  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.tracking !== undefined) tracking = settings.tracking;
  if (settings.ribbonCount !== undefined) ribbonCount = settings.ribbonCount;
  if (settings.ribbonSpaceX !== undefined) ribbonSpaceX = settings.ribbonSpaceX;
  if (settings.ribbonSpaceY !== undefined) ribbonSpaceY = settings.ribbonSpaceY;
  if (settings.ribbonSize !== undefined) ribbonSize = settings.ribbonSize;
  if (settings.ribbonOffset !== undefined) ribbonOffset = settings.ribbonOffset;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.speed !== undefined) speed = settings.speed;
  if (settings.offset !== undefined) offset = settings.offset;
  if (settings.slope !== undefined) slope = settings.slope;

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

  if (data.typeX !== undefined) typeX = data.typeX;
  if (data.typeY !== undefined) typeY = data.typeY;
  if (data.typeStroke !== undefined) typeStroke = data.typeStroke;
  if (data.tracking !== undefined) tracking = data.tracking;

  if (data.ribbonCount !== undefined) ribbonCount = data.ribbonCount;
  if (data.ribbonSpaceX !== undefined) ribbonSpaceX = data.ribbonSpaceX;
  if (data.ribbonSpaceY !== undefined) ribbonSpaceY = data.ribbonSpaceY;
  if (data.ribbonSize !== undefined) ribbonSize = data.ribbonSize;
  if (data.ribbonOffset !== undefined) ribbonOffset = data.ribbonOffset;

  if (data.yWave !== undefined) yWave = data.yWave;
  if (data.speed !== undefined) speed = data.speed;
  if (data.offset !== undefined) offset = data.offset;
  if (data.slope !== undefined) slope = data.slope;

  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
  if (data.color1 !== undefined) { inp1 = color(data.color1); inpNumber = 1; }
  if (data.color2 !== undefined) { inp2 = color(data.color2); inpNumber = 2; }
  if (data.color3 !== undefined) { inp3 = color(data.color3); inpNumber = 3; }
  if (data.color4 !== undefined) { inp4 = color(data.color4); inpNumber = 4; }
  if (data.color5 !== undefined) { inp5 = color(data.color5); inpNumber = 5; }
  if (data.color6 !== undefined) { inp6 = color(data.color6); inpNumber = 6; }
  if (data.inpNumber !== undefined) inpNumber = data.inpNumber;

  // Handle save request
  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        typeX: typeX,
        typeY: typeY,
        typeStroke: typeStroke,
        tracking: tracking,
        ribbonCount: ribbonCount,
        ribbonSpaceX: ribbonSpaceX,
        ribbonSpaceY: ribbonSpaceY,
        ribbonSize: ribbonSize,
        ribbonOffset: ribbonOffset,
        yWave: yWave,
        speed: speed,
        offset: offset,
        slope: slope,
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

  clear();
  background(bkgdColor);

  runLength = inpText.length;
  xSpace = typeX + tracking;
  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;
  noFill();

  push();
  translate(width / 2, height / 2);
  translate(-xSpace * runLength / 2 - ribbonCount * ribbonSpaceX / 2, -ribbonCount * ribbonSpaceY / 2);

  // FLAG / STRIPES
  for (var k = 0; k < ribbonCount; k++) {

    // Ribbon Shadow
    strokeWeight(typeY + ribbonSize);
    stroke(0, 0, 0, 50);
    strokeCap(SQUARE);
    strokeJoin(ROUND);
    beginShape();
    for (var i = -1; i <= runLength; i++) {
      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      vertex(i * xSpace + k * ribbonSpaceX - ribbonSpaceX / 7, k * ribbonSpaceY - ribbonSpaceY / 7 + yWaver);
    }
    endShape();

    // Ribbon
    setRibbonColor(k);
    strokeWeight(typeY + ribbonSize);
    stroke(ribbonColor);
    beginShape();
    for (var i = -1; i <= runLength; i++) {
      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      vertex(i * xSpace + k * ribbonSpaceX, k * ribbonSpaceY + yWaver);
    }
    endShape();

    // Type
    setTextColor(k);
    strokeWeight(typeStroke);
    stroke(strkColor);
    strokeCap(PROJECT);
    for (var i = 0; i < runLength; i++) {
      var yWaverPre = sinEngine(offset, i - 1, ribbonOffset, k, -speed, slope) * yWave;
      var yWaverPost = sinEngine(offset, i + 1, ribbonOffset, k, -speed, slope) * yWave;
      var rotateFix = atan2(yWaverPost - yWaverPre, 2 * xSpace);

      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      letter_select = i;

      push();
      translate(i * xSpace + k * ribbonSpaceX, k * ribbonSpaceY + yWaver);
      rotate(rotateFix);
      translate(-(typeX) / 2, -(typeY) / 2);

      keyboardEngine();
      pop();
    }
  }
  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var sinus = sin((frameCount * Speed + xCounter * xLength + yCounter * yLength));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - pow(1 - abs(sinus), slopeN));
  return sinerSquare;
}

function setRibbonColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { ribbonColor = inp1; }
    if (switcher % 6 == 1) { ribbonColor = inp2; }
    if (switcher % 6 == 2) { ribbonColor = inp3; }
    if (switcher % 6 == 3) { ribbonColor = inp4; }
    if (switcher % 6 == 4) { ribbonColor = inp5; }
    if (switcher % 6 == 5) { ribbonColor = inp6; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { ribbonColor = inp1; }
    if (switcher % 5 == 1) { ribbonColor = inp2; }
    if (switcher % 5 == 2) { ribbonColor = inp3; }
    if (switcher % 5 == 3) { ribbonColor = inp4; }
    if (switcher % 5 == 4) { ribbonColor = inp5; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { ribbonColor = inp1; }
    if (switcher % 4 == 1) { ribbonColor = inp2; }
    if (switcher % 4 == 2) { ribbonColor = inp3; }
    if (switcher % 4 == 3) { ribbonColor = inp4; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { ribbonColor = inp1; }
    if (switcher % 3 == 1) { ribbonColor = inp2; }
    if (switcher % 3 == 2) { ribbonColor = inp3; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { ribbonColor = inp1; }
    if (switcher % 2 == 1) { ribbonColor = inp2; }
  } else if (inpNumber == 1) {
    ribbonColor = inp1;
  }
}

function setTextColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { strkColor = inp6; }
    if (switcher % 6 == 1) { strkColor = inp1; }
    if (switcher % 6 == 2) { strkColor = inp4; }
    if (switcher % 6 == 3) { strkColor = inp3; }
    if (switcher % 6 == 4) { strkColor = inp2; }
    if (switcher % 6 == 5) { strkColor = inp5; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { strkColor = inp5; }
    if (switcher % 5 == 1) { strkColor = inp1; }
    if (switcher % 5 == 2) { strkColor = inp2; }
    if (switcher % 5 == 3) { strkColor = inp3; }
    if (switcher % 5 == 4) { strkColor = inp4; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { strkColor = inp4; }
    if (switcher % 4 == 1) { strkColor = inp1; }
    if (switcher % 4 == 2) { strkColor = inp2; }
    if (switcher % 4 == 3) { strkColor = inp3; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { strkColor = inp3; }
    if (switcher % 3 == 1) { strkColor = inp1; }
    if (switcher % 3 == 2) { strkColor = inp2; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { strkColor = inp2; }
    if (switcher % 2 == 1) { strkColor = inp1; }
  } else if (inpNumber == 1) {
    strkColor = bkgdColor;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
