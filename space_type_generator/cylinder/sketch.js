// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var strecherXsize = 0;
var strecherX = 0;
var strecherYsize = 0;
var strecherY = 0;

// CYLINDER
var pieSlice;
var radius = 250;
var stackNum = 1;
var rRotate = -5;
var rOffset = 0;
var rWaveCount = 2;
var rWaveSpeed = 0;
var rWave = 0;
var rZaxis = 0;
var rLong = 0;
var xRotTweak = 0, yRotTweak = 0, zRotTweak = 0;
var rWaveOffset;
var stackHeight;
var stackHeightAdjust = 0;

// CAMERA
var xRotCamera = 15, yRotCamera = 0, zRotCamera = 0;
var zoomCamera = 0;

// STRING
var letter_select, inpText = "SPACE-TYPE-GENERATOR";
var myText = [];

// COLOR
var strkColor;
var bkgdColor;
var bkgdStrokeColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

function preload() {
  font = loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);
  smooth();



  textFont(font);
  frameRate(30);

  // Initialize with default preset
  reSetting();

  if (typeof signalReady === 'function') signalReady();
}


// --- PRESET DEFINITIONS ---

function reSetting() {
  stackHeightAdjust = 0;
  radius = 250; stackNum = 1; rRotate = -5; rOffset = 0;
  rWaveCount = 2; rWaveSpeed = 0; rWave = 0; rLong = 0;
  rZaxis = 0; strecherXsize = 0; strecherYsize = 0;
  typeX = 20; typeY = 40; typeStroke = 2;
  xRotTweak = 0; yRotTweak = 0; zRotTweak = 0;
  xRotCamera = 15; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;

  inpNumber = 1;
  inp1 = color(0);
  bkgdColor = color(255);
  bkgdStrokeColor = color(235);
  strkColor = color(0);

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

  if (settings.radius !== undefined) radius = settings.radius;
  if (settings.stackNum !== undefined) stackNum = settings.stackNum;
  if (settings.rRotate !== undefined) rRotate = settings.rRotate;
  if (settings.rOffset !== undefined) rOffset = settings.rOffset;
  if (settings.rWaveCount !== undefined) rWaveCount = settings.rWaveCount;
  if (settings.rWaveSpeed !== undefined) rWaveSpeed = settings.rWaveSpeed;
  if (settings.rWave !== undefined) rWave = settings.rWave;
  if (settings.rZaxis !== undefined) rZaxis = settings.rZaxis;
  if (settings.rLong !== undefined) rLong = settings.rLong;
  if (settings.strecherX !== undefined) strecherXsize = settings.strecherX;
  if (settings.strecherY !== undefined) strecherYsize = settings.strecherY;
  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;
  if (settings.xRotTweak !== undefined) xRotTweak = settings.xRotTweak;
  if (settings.yRotTweak !== undefined) yRotTweak = settings.yRotTweak;
  if (settings.zRotTweak !== undefined) zRotTweak = settings.zRotTweak;
  if (settings.stackHeightAdjust !== undefined) stackHeightAdjust = settings.stackHeightAdjust;

  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
  if (settings.color1 !== undefined) { inp1 = color(settings.color1); inpNumber = 1; }
  if (settings.color2 !== undefined) { inp2 = color(settings.color2); }
  if (settings.color3 !== undefined) { inp3 = color(settings.color3); }
  if (settings.color4 !== undefined) { inp4 = color(settings.color4); }
  if (settings.color5 !== undefined) { inp5 = color(settings.color5); }
  if (settings.color6 !== undefined) { inp6 = color(settings.color6); }
  if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
}

// REMOTE CONTROL HANDLER
function updateSettings(data) {
  if (!data) return;


  // Process preset first
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

  // Apply overrides
  if (data.text !== undefined || data.string !== undefined) {
    inpText = data.text !== undefined ? String(data.text) : String(data.string);
    lastTextTime = millis();
    isClearing = false;
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.radius !== undefined) radius = data.radius;
  if (data.stackNum !== undefined) stackNum = data.stackNum;
  if (data.rRotate !== undefined) rRotate = data.rRotate;
  if (data.rOffset !== undefined) rOffset = data.rOffset;
  if (data.rWaveCount !== undefined) rWaveCount = data.rWaveCount;
  if (data.rWaveSpeed !== undefined) rWaveSpeed = data.rWaveSpeed;
  if (data.rWave !== undefined) rWave = data.rWave;
  if (data.rZaxis !== undefined) rZaxis = data.rZaxis;
  if (data.strecherX !== undefined) strecherXsize = data.strecherX;
  if (data.strecherY !== undefined) strecherYsize = data.strecherY;
  if (data.typeX !== undefined) typeX = data.typeX;
  if (data.typeY !== undefined) typeY = data.typeY;
  if (data.typeStroke !== undefined) typeStroke = data.typeStroke;
  if (data.xRotCamera !== undefined) xRotCamera = data.xRotCamera;
  if (data.yRotCamera !== undefined) yRotCamera = data.yRotCamera;
  if (data.zRotCamera !== undefined) zRotCamera = data.zRotCamera;
  if (data.zoomCamera !== undefined) zoomCamera = data.zoomCamera;
  if (data.xRotTweak !== undefined) xRotTweak = data.xRotTweak;
  if (data.yRotTweak !== undefined) yRotTweak = data.yRotTweak;
  if (data.zRotTweak !== undefined) zRotTweak = data.zRotTweak;

  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
  if (data.color1 !== undefined) {
    inp1 = color(data.color1);
    inpNumber = 1; // Switch back to single color mode if color1 is sent
  }

  // Handle save request
  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        radius: radius,
        stackNum: stackNum,
        rRotate: rRotate,
        rOffset: rOffset,
        rWaveCount: rWaveCount,
        rWaveSpeed: rWaveSpeed,
        rWave: rWave,
        rZaxis: rZaxis,
        strecherX: strecherXsize,
        strecherY: strecherYsize,
        typeX: typeX,
        typeY: typeY,
        typeStroke: typeStroke,
        xRotCamera: xRotCamera,
        yRotCamera: yRotCamera,
        zRotCamera: zRotCamera,
        zoomCamera: zoomCamera,
        xRotTweak: xRotTweak,
        yRotTweak: yRotTweak,
        zRotTweak: zRotTweak,
        stackHeightAdjust: stackHeightAdjust,
        inpNumber: inpNumber,
        bkgdColor: bkgdColor.toString(),
        color1: inp1.toString(),
        color2: inp2 ? inp2.toString() : undefined,
        color3: inp3 ? inp3.toString() : undefined,
        color4: inp4 ? inp4.toString() : undefined,
        color5: inp5 ? inp5.toString() : undefined,
        color6: inp6 ? inp6.toString() : undefined
      }
    };
    pubChannel.postMessage(payload);
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

  background(bkgdColor);

  stackHeight = (typeY + strecherYsize / 2) + 5 + stackHeightAdjust;
  pieSlice = 2 * PI / inpText.length;
  rWaveOffset = 2 * PI / inpText.length * rWaveCount;

  noFill();
  strokeWeight(typeStroke);

  push();
  // camera
  translate(0, 0, zoomCamera);
  rotateX(radians(xRotCamera));
  rotateY(radians(yRotCamera));
  rotateZ(radians(zRotCamera));

  // center stack
  translate(0, -(stackNum - 1) * stackHeight / 2);

  // rotation
  rotateY(frameCount * (rRotate / 1000));

  for (var i = 0; i < inpText.length * stackNum; i++) {
    var ringSpot = i % inpText.length;
    letter_select = ringSpot;

    if (floor(i / inpText.length) % 2 === 1) {
      strecherY = map(sin(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)), -1, 1, 0, strecherYsize);
    } else {
      strecherY = map(sin(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000) + PI), -1, 1, 0, strecherYsize);
    }

    strecherX = map(sin(floor(i / inpText.length) * rWaveOffset + frameCount * (rWaveSpeed / 1000)), -1, 1, 0, strecherXsize);

    push();
    // stack translates
    rotateY(floor(i / inpText.length) * rOffset);
    translate(0, floor(i / inpText.length) * stackHeight);
    // ring translates
    rotateY(ringSpot * pieSlice);

    translate(0, 0, radius);
    if (rLong != 0) {
      var rLonger = sin(floor(i / inpText.length) * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * rLong;
      translate(0, 0, rLonger);
    }
    if (rZaxis != 0) {
      var rZaxiser = sin(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * rZaxis;
      translate(0, rZaxiser, 0);
    }
    if (rWave != 0) {
      var rWaver = sin(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * rWave;
      translate(0, 0, rWaver);
    }
    if (yRotTweak != 0) {
      rotateY(cos(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * -radians(yRotTweak));
    }
    if (xRotTweak != 0) {
      rotateX(cos(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * -radians(xRotTweak));
    }

    if (rLong != 0) {
      // fix rLong y-rotation
      var prerLonger = sin(floor((i / inpText.length) - 1) * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * rLong;
      var postrLonger = sin(floor((i / inpText.length) + 1) * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * rLong;
      var rLongAdjust = atan2(stackHeight * 2, (prerLonger - postrLonger))
      rotateX(rLongAdjust - PI / 2);
    }

    if (zRotTweak != 0) {
      rotateZ(cos(ringSpot * rWaveOffset + frameCount * (rWaveSpeed / 1000)) * radians(zRotTweak));
    }

    translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2, 0);
    // outer surface
    if (inpNumber == 6) {
      setTextColor(floor(i / inpText.length));
    } else {
      strkColor = inp1;
      bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
    }
    stroke(strkColor);
    keyboardEngine();
    translate(0, 0, -1);
    // inner surface
    stroke(bkgdStrokeColor);
    keyboardEngine()
    pop();
  }
  pop();


  if (typeof captureFrame === 'function') captureFrame();
}

function setTextColor(switcher) {
  if (switcher % 6 == 0) {
    strkColor = inp1;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 1) {
    strkColor = inp2;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 2) {
    strkColor = inp3;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 3) {
    strkColor = inp4;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 4) {
    strkColor = inp5;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 5) {
    strkColor = inp6;
    bkgdStrokeColor = lerpColor(strkColor, bkgdColor, 0.75);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}