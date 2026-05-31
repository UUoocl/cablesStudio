// TYPE
var typeX = 20;
var typeY = 50;
var typeStroke = 1.5;
var typePush = 2;
var padding = 0.3;
var TR, TL, BR, BL;
var Rhalf, Lhalf, Thalf, Bhalf, Lthird, Rthird, Tthird, Bthird, L2third, R2third, T2third, B2third;
var Lquad, Rquad, Tquad, Bquad, L3quad, R3quad, T3quad, B3quad;
var L0506,R0506,T0506,B0506,L0106,R0106,T0106,B0106;
var L0108,R0108,T0108,B0108,L0708,R0708,T0708,B0708;
var L1528;

// GRID
var rows = 6;
var xSpace, ySpace;

// WAVE
var zWave = 50;
var yWave = 20;
var xWave = 95;
var offset = 0.3;
var speed = -0.03;
var rowOffset = 0.37;
var slope = 1;

// CAMERA
var xRotCamera = -50, yRotCamera = 65, zRotCamera = 11;
var zoomCamera = -40;

// STRING
var letter_select, inpText = " THIS & THEN ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor, ribbonColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 2;
var backSide = true;

// TOGGLES
var inp0check = false;

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
  typeX = 20;
  typeY = 50;
  typeStroke = 1.5;
  rows = 6;
  padding = 0.3;
  typePush = 2;
  zWave = 50;
  xWave = 95;
  yWave = 20;
  offset = 0.3;
  speed = -0.03;
  rowOffset = 0.37;
  slope = 1;

  xRotCamera = -50;
  yRotCamera = 65;
  zRotCamera = 11;
  zoomCamera = -40;

  inp0check = false;
  backSide = true;

  inp1 = color('#f5f5f5');
  inp2 = color('#000000');
  inp3 = color('#ff0000');
  inp4 = color('#ffff00');
  inp5 = color('#000000');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff');

  inpNumber = 2;
  inpText = " THIS & THEN ";

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
  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.padding !== undefined) padding = settings.padding;
  if (settings.typePush !== undefined) typePush = settings.typePush;
  if (settings.zWave !== undefined) zWave = settings.zWave;
  if (settings.xWave !== undefined) xWave = settings.xWave;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.offset !== undefined) offset = settings.offset;
  if (settings.speed !== undefined) speed = -settings.speed;
  if (settings.rowOffset !== undefined) rowOffset = settings.rowOffset;
  if (settings.slope !== undefined) slope = settings.slope;

  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;

  if (settings.inp0check !== undefined) inp0check = settings.inp0check;
  if (settings.backSide !== undefined) backSide = settings.backSide;

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
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.padding !== undefined) padding = Number(data.padding);
  if (data.typePush !== undefined) typePush = Number(data.typePush);
  if (data.zWave !== undefined) zWave = Number(data.zWave);
  if (data.xWave !== undefined) xWave = Number(data.xWave);
  if (data.yWave !== undefined) yWave = Number(data.yWave);
  if (data.offset !== undefined) offset = Number(data.offset);
  if (data.speed !== undefined) speed = -Number(data.speed);
  if (data.rowOffset !== undefined) rowOffset = Number(data.rowOffset);
  if (data.slope !== undefined) slope = Number(data.slope);

  if (data.xRotCamera !== undefined) xRotCamera = Number(data.xRotCamera);
  if (data.yRotCamera !== undefined) yRotCamera = Number(data.yRotCamera);
  if (data.zRotCamera !== undefined) zRotCamera = Number(data.zRotCamera);
  if (data.zoomCamera !== undefined) zoomCamera = Number(data.zoomCamera);

  if (data.inp0check !== undefined) inp0check = Boolean(data.inp0check) || data.inp0check === 'true';
  if (data.backSide !== undefined) backSide = Boolean(data.backSide) || data.backSide === 'true';

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
        rows: rows,
        padding: padding,
        typePush: typePush,
        zWave: zWave,
        xWave: xWave,
        yWave: yWave,
        offset: offset,
        speed: -speed,
        rowOffset: rowOffset,
        slope: slope,
        xRotCamera: xRotCamera,
        yRotCamera: yRotCamera,
        zRotCamera: zRotCamera,
        zoomCamera: zoomCamera,
        inp0check: inp0check,
        backSide: backSide,
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

  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  var mappedXWave = map(xWave, 0, 200, 0, 2.5 * typeX);
  var mappedYWave = map(yWave, 0, 100, 0, 2 * typeY);

  push();
  // camera
  translate(0, 0, zoomCamera);
  rotateX(radians(xRotCamera));
  rotateY(radians(yRotCamera));
  rotateZ(radians(zRotCamera));

  xSpace = typeX;
  ySpace = typeY;

  translate(-typeX * inpText.length / 2, -typeY * rows / 2);

  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < inpText.length; i++) {
      letter_select = i;
      setRibbonColor(j);

      if (inp0check === false) {
        setTextColor(j);
      } else {
        setTextOnlyColor(j);
      }

      var yWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * mappedYWave;
      var yWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * mappedYWave;
      var yWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * mappedYWave;
      var yWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * mappedYWave;

      var xWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * mappedXWave;
      var xWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * mappedXWave;
      var xWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * mappedXWave;
      var xWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * mappedXWave;

      var zWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * zWave;
      var zWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * zWave;
      var zWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * zWave;
      var zWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * zWave;

      TLbox = createVector(xWaverTL, yWaverTL, zWaverTL);
      TRbox = createVector(typeX + xWaverTR, yWaverTR, zWaverTR);
      BRbox = createVector(typeX + xWaverBR, typeY + yWaverBR, zWaverBR);
      BLbox = createVector(xWaverBL, typeY + yWaverBL, zWaverBL);

      Thalf = p5.Vector.lerp(TLbox, TRbox, 0.5);
      Bhalf = p5.Vector.lerp(BLbox, BRbox, 0.5);
      center = p5.Vector.lerp(Thalf, Bhalf, 0.5);

      TL = p5.Vector.lerp(TLbox, center, padding);
      TR = p5.Vector.lerp(TRbox, center, padding);
      BR = p5.Vector.lerp(BRbox, center, padding);
      BL = p5.Vector.lerp(BLbox, center, padding);

      push();
      translate(xSpace * i, ySpace * j);
      translate(-typeX / 2, -typeY / 2);
      noFill(); stroke(strkColor); strokeWeight(typeStroke);
      keyboardEngine_corners();
      if (inp0check === false) {
        translate(0, 0, -typePush);
        fill(ribbonColor); noStroke();
        beginShape();
        vertex(TLbox.x, TLbox.y, TLbox.z);
        vertex(TRbox.x, TRbox.y, TRbox.z);
        vertex(BRbox.x, BRbox.y, BRbox.z);
        vertex(BLbox.x, BLbox.y, BLbox.z);
        vertex(TLbox.x, TLbox.y, TLbox.z);
        endShape();
        if (backSide === true) {
          translate(0, 0, -1);
          fill(strkColor);
          beginShape();
          vertex(TLbox.x, TLbox.y, TLbox.z);
          vertex(TRbox.x, TRbox.y, TRbox.z);
          vertex(BRbox.x, BRbox.y, BRbox.z);
          vertex(BLbox.x, BLbox.y, BLbox.z);
          vertex(TLbox.x, TLbox.y, TLbox.z);
          endShape();
        }
      }
      pop();
    }
  }
  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(aCount, aLength, bCount, bLength, speed, slope) {
  var sinus = sin((frameCount * speed + aCount * aLength + bCount * bLength));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - pow(1 - abs(sinus), slope));
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
