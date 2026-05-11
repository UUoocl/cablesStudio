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

// DIAGNOSTICS
var lastMessageStr = "";
var messageTimestamp = 0;

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
}

function simpleSet() {
    reSetting();
    radius = 185; stackNum = 8; rRotate = -10; rOffset = 0.2; 
    rWaveSpeed = 75; rWave = 41; xRotTweak = 24; yRotTweak = 27; xRotCamera = 20;
}

function jellyfishSet() {
    reSetting();
    radius = 200; stackNum = 6; rOffset = 0.15; rWaveCount = 3; 
    rWaveSpeed = 100; rLong = 80; strecherXsize = 23; 
    typeX = 13; typeY = 64; typeStroke = 0.5; xRotCamera = 25;
    strkColor = color(255); bkgdColor = color(0); bkgdStrokeColor = color(25);
}

function crownSet() {
    reSetting();
    stackNum = 3; rRotate = -5; rWaveCount = 4; rWaveSpeed = 50;
    rZaxis = 21; strecherYsize = 76; typeX = 30; typeStroke = 3;
    strecherXsize = -25; zoomCamera = -500;
}

function complexSet() {
    reSetting();
    radius = 178; stackNum = 11; rRotate = 0; rOffset = 0.16; 
    rWaveCount = 6; rWaveSpeed = 75; rWave = 10; rLong = 31; 
    typeX = 16; typeY = 40; typeStroke = 2; xRotTweak = 15; 
    yRotTweak = 35; zRotTweak = 0; xRotCamera = -34; yRotCamera = 10; zRotCamera = 25;
    bkgdColor = color(0); bkgdStrokeColor = color(25);
}

function weaveSet() {
    reSetting();
    stackHeightAdjust = 30; radius = 110; stackNum = 7; rRotate = 15; 
    rOffset = 0.62; rWaveCount = 5; rWaveSpeed = 30; rZaxis = 15; 
    typeX = 12; typeY = 19; typeStroke = 1; zRotTweak = 33;
    xRotCamera = 15; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;
}

function zebraSet() {
    reSetting();
    stackHeightAdjust = 10; radius = 110; stackNum = 7; rRotate = 20; 
    rOffset = 0.3; rWaveCount = 2; rWaveSpeed = 30; rWave = 15; rZaxis = 15; 
    strecherYsize = 33; typeX = 12; typeY = 19; typeStroke = 1;
    xRotTweak = 9; yRotTweak = 24; zRotTweak = 22;
    xRotCamera = 15; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;
    bkgdColor = color(0); bkgdStrokeColor = color(25);
}

function hoopsSet() {
    reSetting();
    stackHeightAdjust = 30; radius = 110; stackNum = 7; rRotate = 15; 
    rOffset = 0.62; rWaveCount = 1; rWaveSpeed = 100; rZaxis = 58; 
    typeX = 12; typeY = 19; typeStroke = 1.5; zRotTweak = 28; xRotCamera = -10;
    bkgdColor = color(0); bkgdStrokeColor = color(25);
}

function prideSet() {
    stackNum = 6;
    inpNumber = 6;
    inp1 = color('#e70000'); inp2 = color('#ff8c00'); inp3 = color('#ffef00'); 
    inp4 = color('#00811f'); inp5 = color('#0044ff'); inp6 = color('#760089');
}

// REMOTE CONTROL HANDLER
function updateSettings(data) {
    if (!data) return;
    
    // Set diagnostic message
    lastMessageStr = "RECV: " + Object.keys(data).join(", ");
    messageTimestamp = millis();

    // Process preset first
    if (data.preset) {
        const p = data.preset.toLowerCase();
        if (p === 'simple') simpleSet();
        else if (p === 'jellyfish') jellyfishSet();
        else if (p === 'crown') crownSet();
        else if (p === 'complex') complexSet();
        else if (p === 'weave') weaveSet();
        else if (p === 'zebra') zebraSet();
        else if (p === 'hoops') hoopsSet();
        else if (p === 'pride') prideSet();
        else if (p === 'reset') reSetting();
    }

    // Apply overrides
    if (data.text !== undefined) inpText = String(data.text);
    else if (data.string !== undefined) inpText = String(data.string); // Alias for default port name
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
}

function draw() {
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

  // Draw diagnostic message overlay
  if (millis() - messageTimestamp < 3000) {
      push();
      // Move to top left of WEBGL canvas
      translate(-width/2 + 10, -height/2 + 20, 100); 
      fill(255, 0, 0);
      noStroke();
      textSize(14);
      textAlign(LEFT);
      text(lastMessageStr, 0, 0);
      pop();
  }
  
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