// LETTER
var typeX = 7;
var typeY = 20;
var typeStroke = 2;

// FIELD
var SA;

// RIBBONS
var ribbonCount = 40;
var ribbonSize = 10;
var ribbonColor;

// SPIRAL
var radius = 3, radiusAdjusted;
var tracker = 10, tracking;
var spiralStart = 50;
var spin = 1;

// WAVE
var waveSize = 0, waveCount = 2;
var waveSpeed = 1;
var slope = 1;

// STRING
var letter_select, inpText = "THIS & THEN ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 4;

// TOGGLES
var inp0check = false;
var radioEnd = 1; // 1 = round, 2 = flat

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
  typeX = 7;
  typeY = 20;
  typeStroke = 2;
  ribbonCount = 40;
  ribbonSize = 10;
  radius = 3;
  tracker = 10;
  spiralStart = 50;
  spin = 1;
  waveSize = 0;
  waveCount = 2;
  waveSpeed = 1;
  slope = 1;
  radioEnd = 1;
  inp0check = false;

  inp1 = color('#ff0000');
  inp2 = color('#ffff00');
  inp3 = color('#0000ff');
  inp4 = color('#ffffff');
  inp5 = color('#000000');
  inp6 = color('#760089');
  bkgdColor = color('#000000');

  inpNumber = 4;
  inpText = "THIS & THEN ";

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
  if (settings.ribbonCount !== undefined) ribbonCount = settings.ribbonCount;
  if (settings.ribbonSize !== undefined) ribbonSize = settings.ribbonSize;
  if (settings.radius !== undefined) radius = settings.radius;
  if (settings.tracker !== undefined) tracker = settings.tracker;
  if (settings.spiralStart !== undefined) spiralStart = settings.spiralStart;
  if (settings.spin !== undefined) spin = settings.spin;
  if (settings.waveSize !== undefined) waveSize = settings.waveSize;
  if (settings.waveCount !== undefined) waveCount = settings.waveCount;
  if (settings.waveSpeed !== undefined) waveSpeed = settings.waveSpeed;
  if (settings.slope !== undefined) slope = settings.slope;
  if (settings.radioEnd !== undefined) radioEnd = settings.radioEnd;
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
    // Ensure trailing space is maintained if necessary
    if (!inpText.endsWith(" ")) {
      inpText += " ";
    }
    lastTextTime = millis();
    isClearing = false;
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.ribbonCount !== undefined) ribbonCount = Number(data.ribbonCount);
  if (data.ribbonSize !== undefined) ribbonSize = Number(data.ribbonSize);
  if (data.radius !== undefined) radius = Number(data.radius);
  if (data.tracker !== undefined) tracker = Number(data.tracker);
  if (data.spiralStart !== undefined) spiralStart = Number(data.spiralStart);
  if (data.spin !== undefined) spin = Number(data.spin);
  if (data.waveSize !== undefined) waveSize = Number(data.waveSize);
  if (data.waveCount !== undefined) waveCount = Number(data.waveCount);
  if (data.waveSpeed !== undefined) waveSpeed = Number(data.waveSpeed);
  if (data.slope !== undefined) slope = Number(data.slope);
  if (data.radioEnd !== undefined) radioEnd = Number(data.radioEnd);
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
        typeY: typeY,
        typeStroke: typeStroke,
        ribbonCount: ribbonCount,
        ribbonSize: ribbonSize,
        radius: radius,
        tracker: tracker,
        spiralStart: spiralStart,
        spin: spin,
        waveSize: waveSize,
        waveCount: waveCount,
        waveSpeed: waveSpeed,
        slope: slope,
        radioEnd: radioEnd,
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
  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  noFill();

  push();
  translate(width / 2, height / 2);
  rotate(frameCount * -(spin / 200));

  radiusAdjusted = map(radius, 0, 50, typeY / 6, typeY * 2);
  tracking = map(tracker, 0, 50, typeX * 3 / 14, typeX * 4);

  for (var k = 0; k < ribbonCount; k++) {
    // ribbon
    if (inp0check === false) {
      setRibbonColor(k);
      stroke(ribbonColor);
      if (radioEnd === 1) {
        strokeCap(ROUND);
      } else {
        strokeCap(SQUARE);
      }
      strokeJoin(ROUND);
      strokeWeight(typeY + ribbonSize);
      beginShape();
      for (var i = spiralStart + inpText.length * k - 1; i <= spiralStart + inpText.length + inpText.length * k; i++) {
        var polarX = -(radiusAdjusted) * sqrt(tracking * i) * cos(sqrt(tracking * i));
        var polarY = -(radiusAdjusted) * sqrt(tracking * i) * sin(sqrt(tracking * i));

        var echo = atan2(polarY, polarX);
        var theWave = sinEngine(echo, waveCount, waveSpeed / 100, slope) * waveSize;
        var waveX = (theWave) * cos(echo);
        var waveY = (theWave) * sin(echo);

        vertex(polarX + waveX, polarY + waveY);
      }
      endShape();
    }

    // letter
    setTextColor(k);
    strokeWeight(typeStroke);
    stroke(strkColor);
    strokeCap(PROJECT); strokeJoin(ROUND);
    for (var i = spiralStart + inpText.length * k; i < spiralStart + inpText.length + inpText.length * k; i++) {
      letter_select = (i - spiralStart) % inpText.length;
      var polarX = -(radiusAdjusted) * sqrt(tracking * i) * cos(sqrt(tracking * i));
      var polarY = -(radiusAdjusted) * sqrt(tracking * i) * sin(sqrt(tracking * i));

      var preX = -(radiusAdjusted) * sqrt(tracking * (i - 1)) * cos(sqrt(tracking * (i - 1)));
      var preY = -(radiusAdjusted) * sqrt(tracking * (i - 1)) * sin(sqrt(tracking * (i - 1)));
      var postX = -(radiusAdjusted) * sqrt(tracking * (i + 1)) * cos(sqrt(tracking * (i + 1)));
      var postY = -(radiusAdjusted) * sqrt(tracking * (i + 1)) * sin(sqrt(tracking * (i + 1)));

      var echo = atan2(polarY, polarX);
      var theWave = sinEngine(echo, waveCount, waveSpeed / 100, slope) * waveSize;
      var waveX = (theWave) * cos(echo);
      var waveY = (theWave) * sin(echo);

      var preEcho = atan2(preY, preX);
      var preWave = sinEngine(preEcho, waveCount, waveSpeed / 100, slope) * waveSize;
      var preWaveX = (preWave) * cos(preEcho);
      var preWaveY = (preWave) * sin(preEcho);

      var postEcho = atan2(postY, postX);
      var postWave = sinEngine(postEcho, waveCount, waveSpeed / 100, slope) * waveSize;
      var postWaveX = (postWave) * cos(postEcho);
      var postWaveY = (postWave) * sin(postEcho);

      var delta = atan2((postY + postWaveY) - (preY + preWaveY), (postX + postWaveX) - (preX + preWaveX));

      push();
      translate(polarX + waveX, polarY + waveY);
      rotate(delta);
      translate(-typeX / 2, -typeY / 2);
      keyboardEngine();
      pop();
    }
  }

  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(xCount, xLength, Speed, slopeN) {
  var sinus = sin((frameCount * Speed + xCount * xLength));
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
