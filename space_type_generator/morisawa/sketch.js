// LETTER
var typeX, typeY;
var typeStroke = 1;
var tracking = 2.0; // tracking / 100

// FIELD
var xSpace, ySpace;
var yBlock;
var rows = 10;
var speed = 0.3;
var SA;
var padding = 20;
var mirror = true; // mirrorCheck.checked
var mirrorSpeed = false; // mirrorSpeedCheck.checked
var fluxCheck = false; // fluxCheck.checked
var track;
var lineSpace = 5;
var mover = 1;
var rowMax;

// STRING
var letter_select, inpText = "SPACE ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor, textColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;
var strkColor;

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
  createCanvas(w, h);
  smooth();
  textFont(font);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  rows = 10;
  typeStroke = 1;
  tracking = 2.0; // 200 / 100
  speed = 0.3;
  lineSpace = 5;
  padding = 20;
  mirror = true;
  mirrorSpeed = false;
  fluxCheck = false;
  mover = 1;

  textColor = color('#FFFFFF');
  bkgdColor = color('#000000');

  inp1 = color('#FFFFFF');
  inp2 = color('#ff8c00');
  inp3 = color('#ffef00');
  inp4 = color('#00811f');
  inp5 = color('#0044ff');
  inp6 = color('#760089');
  inpNumber = 1;

  inpText = "SPACE ";

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

  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.tracking !== undefined) tracking = settings.tracking / 100;
  if (settings.speed !== undefined) speed = settings.speed;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.padding !== undefined) padding = settings.padding;
  if (settings.mirror !== undefined) mirror = settings.mirror;
  if (settings.mirrorSpeed !== undefined) mirrorSpeed = settings.mirrorSpeed;
  if (settings.fluxCheck !== undefined) fluxCheck = settings.fluxCheck;

  if (settings.textColor !== undefined) textColor = color(settings.textColor);
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

  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.tracking !== undefined) tracking = Number(data.tracking) / 100;
  if (data.speed !== undefined) speed = Number(data.speed);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.padding !== undefined) padding = Number(data.padding);
  if (data.mirror !== undefined) mirror = Boolean(data.mirror) || data.mirror === 'true';
  if (data.mirrorSpeed !== undefined) mirrorSpeed = Boolean(data.mirrorSpeed) || data.mirrorSpeed === 'true';
  if (data.fluxCheck !== undefined) fluxCheck = Boolean(data.fluxCheck) || data.fluxCheck === 'true';

  if (data.textColor !== undefined) textColor = color(data.textColor);
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
        rows: rows,
        typeStroke: typeStroke,
        tracking: tracking * 100,
        speed: speed,
        lineSpace: lineSpace,
        padding: padding,
        mirror: mirror,
        mirrorSpeed: mirrorSpeed,
        fluxCheck: fluxCheck,
        textColor: textColor.toString(),
        bkgdColor: bkgdColor.toString(),
        inpNumber: inpNumber,
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
  textColor = color('#ffffff');
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
  strokeWeight(typeStroke);
  stroke(textColor);
  strokeCap(ROUND); strokeJoin(ROUND);

  push();
  translate(padding, 60);

  var displayRows = rows;
  if (fluxCheck === true) {
    rowMax = rows;
    displayRows = map(sinEngine(0.05, 2), -1, 1, rowMax, 0.99);
  }

  let xField = width - (2 * padding);
  let yField = height - 140;

  typeY = yField;
  let step = (sq(displayRows) + displayRows) / 2;

  if (mirror === true) {
    yBlock = (yField - (displayRows) * lineSpace * 2) / (step * 2);
  } else {
    yBlock = (yField - (displayRows - 1) * lineSpace) / (step);
  }

  let speedBlock = speed;

  for (var j = 0; j < displayRows; j++) {
    typeX = xField / ((j + 1) * inpText.length + ((j + 1) * inpText.length - 1) * tracking);
    if (typeX <= 0) typeX = 1;
    track = typeX * tracking;
    for (var i = 0; i < j + 1; i++) {
      for (var k = 0; k < inpText.length; k++) {
        letter_select = k;
        typeY = yBlock * (displayRows - j);

        if (inpNumber == 6) {
          setTextColor(j);
          stroke(strkColor);
        } else {
          stroke(textColor);
        }

        push();
        translate(k * typeX + k * track, 0);
        translate(inpText.length * typeX * i + inpText.length * track * i, 0);
        translate(-(mover * speedBlock * (displayRows - j)) % (xField + track), 0);
        keyboardEngine();
        pop();

        if (speed > 0) {
          push();
          translate(k * typeX + k * track, 0);
          translate(inpText.length * typeX * i + inpText.length * track * i, 0);
          translate(-(mover * speedBlock * (displayRows - j)) % (xField + track) + (xField + track), 0);
          keyboardEngine();
          pop();
        }
      }
    }
    translate(0, typeY + lineSpace);
  }

  if (mirror === true) {
    pop();
    push();
    translate(padding, 60);
    translate(0, yField);

    for (var m = 0; m < displayRows; m++) {
      typeX = xField / ((m + 1) * inpText.length + ((m + 1) * inpText.length - 1) * tracking);
      if (typeX <= 0) typeX = 1;
      track = typeX * tracking;
      typeY = yBlock * (displayRows - m);

      translate(0, -typeY - lineSpace);

      for (var n = 0; n < m + 1; n++) {
        for (var p = 0; p < inpText.length; p++) {
          letter_select = p;

          if (inpNumber == 6) {
            setTextColor(m);
            stroke(strkColor);
          } else {
            stroke(textColor);
          }

          push();
          translate(p * typeX + p * track, 0);
          translate(inpText.length * typeX * n + inpText.length * track * n, 0);

          if (mirrorSpeed === true) {
            translate((mover * speedBlock * (displayRows - m)) % (xField + track), 0);
          } else {
            translate(-(mover * speedBlock * (displayRows - m)) % (xField + track), 0);
          }
          keyboardEngine();
          pop();

          if (speed > 0) {
            push();
            translate(p * typeX + p * track, 0);
            translate(inpText.length * typeX * n + inpText.length * track * n, 0);

            if (mirrorSpeed === true) {
              translate((mover * speedBlock * (displayRows - m)) % (xField + track) - (xField + track), 0);
            } else {
              translate(-(mover * speedBlock * (displayRows - m)) % (xField + track) + (xField + track), 0);
            }
            keyboardEngine();
            pop();
          }
        }
      }
    }
  }

  pop();
  noStroke(); fill(bkgdColor);
  rect(-1, -1, padding, height - 60);
  rect(width + 1, -1, -padding, height - 60);

  mover++;

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(speed, slope) {
  var sinus = cos((mover * speed - PI));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - pow(1 - abs(sinus), slope));
  return sinerSquare;
}

function setTextColor(switcher) {
  if (switcher % 6 == 0) { strkColor = inp1; }
  if (switcher % 6 == 1) { strkColor = inp2; }
  if (switcher % 6 == 2) { strkColor = inp3; }
  if (switcher % 6 == 3) { strkColor = inp4; }
  if (switcher % 6 == 4) { strkColor = inp5; }
  if (switcher % 6 == 5) { strkColor = inp6; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
