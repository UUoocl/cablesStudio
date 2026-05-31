// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var tracking = 10;
var lineSpace = 20;

var yBlock;
var yField;
var typeYfigure;
var rows = 14;
var SA;

// WAVE
var waveSize, waveLength = 0.13;
var waveSpeed = 0.01;
var slope = 1;

// STRING
var letter_select, inpText = "SPACE TYPE GENERATOR _V.CASCADE";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var ribbonColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 2;

// TOGGLES
var mirrorCheck = false;
var gradientCheck = false;
var inp0check = false;

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
  smooth();
  textFont(font);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  typeX = 20;
  typeY = 40;
  typeStroke = 2;
  tracking = 10;
  lineSpace = 20;
  rows = 14;
  waveLength = 0.13;
  waveSpeed = 0.01;
  slope = 1;

  mirrorCheck = false;
  gradientCheck = false;
  inp0check = false;

  inp1 = color('#000000');
  inp2 = color('#ffffff');
  inp3 = color('#ff0000');
  inp4 = color('#ffff00');
  inp5 = color('#0000ff');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff');

  inpNumber = 2;
  inpText = "SPACE TYPE GENERATOR _V.CASCADE";

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
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.tracking !== undefined) tracking = settings.tracking;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.waveLength !== undefined) waveLength = settings.waveLength;
  if (settings.waveSpeed !== undefined) waveSpeed = settings.waveSpeed / 100;
  if (settings.slope !== undefined) slope = settings.slope;

  if (settings.mirrorCheck !== undefined) mirrorCheck = settings.mirrorCheck;
  if (settings.gradientCheck !== undefined) gradientCheck = settings.gradientCheck;
  if (settings.inp0check !== undefined) inp0check = settings.inp0check;

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

  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.tracking !== undefined) tracking = Number(data.tracking);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.waveLength !== undefined) waveLength = Number(data.waveLength);
  if (data.waveSpeed !== undefined) waveSpeed = Number(data.waveSpeed) / 100;
  if (data.slope !== undefined) slope = Number(data.slope);

  if (data.mirrorCheck !== undefined) mirrorCheck = Boolean(data.mirrorCheck) || data.mirrorCheck === 'true';
  if (data.gradientCheck !== undefined) gradientCheck = Boolean(data.gradientCheck) || data.gradientCheck === 'true';
  if (data.inp0check !== undefined) inp0check = Boolean(data.inp0check) || data.inp0check === 'true';

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
        typeX: typeX,
        typeStroke: typeStroke,
        tracking: tracking,
        lineSpace: lineSpace,
        rows: rows,
        waveLength: waveLength,
        waveSpeed: waveSpeed * 100,
        slope: slope,
        mirrorCheck: mirrorCheck,
        gradientCheck: gradientCheck,
        inp0check: inp0check,
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

  runLength = inpText.length;
  yField = height - 50;

  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  let step = (sq(rows) + rows) / 2;

  if (mirrorCheck === true) {
    yBlock = yField / (step * 2);
  } else {
    yBlock = yField / step;
  }

  let waveBlock = 2 * PI / rows;

  push();
  translate(width / 2, height / 2);
  translate(-(runLength * typeX + tracking * (runLength - 1)) / 2, -yField / 2);

  for (var k = 0; k < runLength; k++) {
    push();
    for (var i = 0; i < rows; i++) {
      if (gradientCheck === true) {
        setGradient(i);
      } else if (inp0check === false) {
        setTextColor(i);
        setRibbonColor(i);
      } else {
        setTextOnlyColor(i);
      }

      letter_select = k;

      if (waveSpeed > 0) {
        typeYfigure = map(sinEngine(i, waveBlock, k, waveLength, waveSpeed, slope), -1, 1, yBlock, rows * yBlock);
      } else {
        typeYfigure = (rows - i) * yBlock;
      }
      typeY = typeYfigure - typeYfigure * (lineSpace / 100);
      var currentLineSpace = typeYfigure * (lineSpace / 100);

      push();
      translate(typeX * k + tracking * k, 0);
      if (inp0check === false) {
        fill(ribbonColor); noStroke();
        rect(-tracking / 2, 0, typeX + tracking, typeYfigure);
      }
      translate(0, currentLineSpace / 2);
      stroke(strkColor); strokeWeight(typeStroke); noFill();
      keyboardEngine();
      pop();
      translate(0, typeYfigure);
    }
    pop();
  }

  if (mirrorCheck === true) {
    push();
    translate(0, yField / 2);

    for (var m = 0; m < runLength; m++) {
      push();
      for (var n = 1; n < rows + 1; n++) {
        if (gradientCheck === true) {
          setGradient(rows - n);
        } else if (inp0check === false) {
          setTextColor(rows - n);
          setRibbonColor(rows - n);
        } else {
          setTextOnlyColor(rows - n);
        }

        letter_select = m;

        if (waveSpeed > 0) {
          typeYfigure = map(sinEngine(rows - n, waveBlock, m, waveLength, waveSpeed, slope), -1, 1, yBlock, rows * yBlock);
        } else {
          typeYfigure = n * yBlock;
        }
        typeY = typeYfigure - typeYfigure * (lineSpace / 100);
        var currentLineSpace = typeYfigure * (lineSpace / 100);

        push();
        translate(typeX * m + tracking * m, 0);
        if (inp0check === false) {
          fill(ribbonColor); noStroke();
          rect(-tracking / 2, 0, typeX + tracking, typeYfigure);
        }
        translate(0, currentLineSpace / 2);
        stroke(strkColor); strokeWeight(typeStroke); noFill();
        keyboardEngine();
        pop();
        translate(0, typeYfigure);
      }
      pop();
    }
    pop();
  }

  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(aCount, aLength, bCount, bLength, Speed, slopeN) {
  var sinus = sin((-frameCount * Speed + aCount * aLength + bCount * bLength));
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

function setTextOnlyColor(switcher) {
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

function setGradient(switcher) {
  if (inpNumber == 5 || inpNumber == 6) {
    let from = inp1;
    let mid = inp2;
    let mid2 = inp3;
    let mid3 = inp4;
    let to = inp5;
    if (switcher <= (rows / 4)) {
      ribbonColor = lerpColor(from, mid, switcher / (rows / 4));
      strkColor = from;
    } else if (switcher > (rows / 4) && switcher <= (rows / 2)) {
      ribbonColor = lerpColor(mid, mid2, (switcher - rows / 4) / (rows / 4));
      strkColor = mid;
    } else if (switcher > (rows / 2) && switcher <= (3 * rows / 4)) {
      ribbonColor = lerpColor(mid2, mid3, (switcher - rows / 2) / (rows / 4));
      strkColor = mid2;
    } else {
      ribbonColor = lerpColor(mid3, to, (switcher - 3 * rows / 4) / (rows / 4));
      strkColor = mid3;
    }
  } else if (inpNumber == 4) {
    let from = inp1;
    let mid = inp2;
    let mid2 = inp3;
    let to = inp4;
    if (switcher <= (rows / 3)) {
      ribbonColor = lerpColor(from, mid, switcher / (rows / 3));
      strkColor = from;
    } else if (switcher > (rows / 3) && switcher <= (2 * rows / 3)) {
      ribbonColor = lerpColor(mid, mid2, (switcher - rows / 3) / (rows / 3));
      strkColor = mid;
    } else {
      ribbonColor = lerpColor(mid2, to, (switcher - 2 * rows / 3) / (rows / 3));
      strkColor = mid2;
    }
  } else if (inpNumber == 3) {
    let from = inp1;
    let mid = inp2;
    let to = inp3;
    if (switcher <= (rows / 2)) {
      ribbonColor = lerpColor(from, mid, switcher / (rows / 2));
      strkColor = from;
    } else {
      ribbonColor = lerpColor(mid, to, (switcher - rows / 2) / (rows / 2));
      strkColor = mid;
    }
  } else if (inpNumber == 2) {
    let from = inp1;
    let to = inp2;
    ribbonColor = lerpColor(from, to, switcher / rows);
    strkColor = from;
  } else if (inpNumber == 1) {
    let from = inp1;
    let to = bkgdColor;
    ribbonColor = lerpColor(from, to, switcher / rows);
    strkColor = to;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
