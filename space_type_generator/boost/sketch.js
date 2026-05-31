var bkgdColor, textColor, strokeColor, sideSolidColor;
var colorSet = [];

var inputText = [];
var tFont = [];
var tFontData = [];
var myFont = [];
var tFontFactor = [];
var starterText = "A\nSAD\nWILD\nTHING";

var pgTextSize = 100;
var res = 8;
var pauseLength = 30;
var fontCount = 9;

var culmLength = [];
var coreBase;
var baseAnimA = 60;
var animA = 60;     ////// INTRO
var baseAnimB = 0;
var animB = animA;     ////// STAY
var baseAnimC = 60;
var animC = animB + 60;     ////// OUTRO
var maxDelay = -20;

var stageAdirect = 2;
var stageAstrength = 3;

var stageBdirect = 2;
var stageBstrength = 3;

var wWindowMin, wWindowMax, wWindow;
var scaler = 0.6;

var widgetOn = true;

var fullW, fullH;

var extrudeType = 1;
var tumbleDepthLength = -75;
var tumbleAmount = 1;
var zoomDepthLength = -500;
var punchDepthLength = -50;
var punchDistance = 100;
var punchInvert = false;

var mouseCenterOnToggle = false;
var mouseCenter;
var maxDist = 100;

var orbitOnToggle = false;
var capsOnToggle = true;
var strokeOnToggle = false;
var strokeW = 1.1;

var sidesType = 2;
var alignMode = 1;

let enableOrbit = true;

var saveMode = 0;
var recording = false;

var cwidth, cheight;
var recMessageOn = false;
var frate = 30;
var recordedFrames = 0;
var numFrames = 300;

var thisDensity = 1;
var selFont = 0;

let p5Camera;

function preload() {
  for (let m = 0; m < fontCount; m++) {
    tFont[m] = loadFont('../assets/IBMPlexMono-Regular.otf');
    tFontData[m] = loadBytes('../assets/IBMPlexMono-Regular.otf');
  }

  tFontFactor[0] = 0.73;
  tFontFactor[1] = 0.75;
  tFontFactor[2] = 0.7; 
  tFontFactor[3] = 0.675; 
  tFontFactor[4] = 0.7;
  tFontFactor[5] = 0.82;
  tFontFactor[6] = 0.75;
  tFontFactor[7] = 0.95;
  tFontFactor[8] = 0.5;
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);

  thisDensity = pixelDensity();

  cwidth = width;
  cheight = height;

  mouseCenter = createVector(0, 0);

  for (var m = 0; m < fontCount; m++) {
    myFont[m] = opentype.parse(tFontData[m].bytes.buffer);
  }

  wWindowMin = width / 8;
  wWindowMax = width;
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);

  textColor = color('#ffffff');
  strokeColor = color('#000000');
  bkgdColor = color('#000000');
  sideSolidColor = color('#f26666');

  colorSet[0] = color('#ffffff');
  colorSet[1] = color('#4e7cd9');
  colorSet[2] = color('#02733e');
  colorSet[3] = color('#f23030');
  colorSet[4] = color('#f26666');

  frameRate(frate);
  curveDetail(res);

  strokeJoin(ROUND);
  strokeCap(ROUND);
  rectMode(CENTER);

  reSetting();

  p5Camera = createCamera();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inputText = starterText.match(/[^\r\n]+/g);
  selFont = 0;
  alignMode = 1;
  scaler = 0.6;
  
  textColor = color('#ffffff');
  strokeColor = color('#000000');
  bkgdColor = color('#000000');
  sideSolidColor = color('#f26666');

  colorSet[0] = color('#ffffff');
  colorSet[1] = color('#4e7cd9');
  colorSet[2] = color('#02733e');
  colorSet[3] = color('#f23030');
  colorSet[4] = color('#f26666');

  extrudeType = 1;
  tumbleDepthLength = -75;
  tumbleAmount = 1;
  zoomDepthLength = -500;
  punchDepthLength = -50;
  punchDistance = 100;
  punchInvert = false;

  mouseCenterOnToggle = false;
  mouseCenter.set(0, 0);

  orbitOnToggle = false;
  capsOnToggle = true;
  strokeOnToggle = false;
  strokeW = 1.1;

  sidesType = 2;
  
  baseAnimA = 60;
  baseAnimB = 0;
  baseAnimC = 60;
  setAnimStages();

  maxDelay = -20;
  stageAdirect = 2;
  stageAstrength = 3;
  stageBdirect = 2;
  stageBstrength = 3;

  setText(starterText);
}

function setText(enteredText) {
  if (enteredText === undefined) {
    enteredText = starterText;
  }
  
  inputText = enteredText.match(/[^\r\n]+/g);

  if (enteredText === "") {
    inputText = [];
    inputText[0] = " ";
  }

  coreCount = inputText.length;

  findMaxSize();

  createAnimation();
}

function findMaxSize() {
  var leading = 10;

  var testerSize = 100;
  textSize(testerSize);
  textFont(tFont[selFont]);
  
  ///////// FIND THE LONGEST LINE
  var longestLine = 0;
  var measurer = 0;

  for (var m = 0; m < inputText.length; m++) {
    var tapeMeasurer = textWidth(inputText[m]);

    if (tapeMeasurer > measurer) {
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  ///////// FIND THE SIZE THAT FILLS TO THE MAX WIDTH
  var widthTest = wWindow;

  let sizeHolder = 2;
  textSize(sizeHolder);
  let holdW = 0;

  while (holdW < widthTest) {
    textSize(sizeHolder);
    holdW = textWidth(inputText[longestLine]);

    sizeHolder += 2;
  }
  pgTextSize = sizeHolder;

  ///////// MAKE SURE THE HEIGHT DOESN'T BREAK THE HEIGHT
  var heightTest = (height - 100) - (inputText.length - 1) * leading;
  let holdH = inputText.length * sizeHolder * tFontFactor[selFont];
  while (holdH > heightTest) {
    holdH = inputText.length * sizeHolder * tFontFactor[selFont];
    sizeHolder -= 2;
  }
  pgTextSize = sizeHolder;

  textSize(pgTextSize);
  fullH = inputText.length * pgTextSize * tFontFactor[selFont] + (inputText.length - 1) * leading;
  fullW = textWidth(inputText[longestLine]);
}

function draw() {
  if (extrudeType == 0) {
    ortho();
  } else {
    perspective();
  }

  background(bkgdColor);

  if (enableOrbit && orbitOnToggle) {
    orbitControl();
  }

  push();
    if (coreBase) coreBase.run();
  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function mousePressed() {
  if (mouseCenterOnToggle && enableOrbit) {
    mouseCenter.set(mouseX - width / 2, mouseY - height / 2);

    if (coreBase) {
      coreBase.liveReset();
      coreBase.tickerReset();
    }
  }
}

function quadLerp(p0, p1, p2, t) {
  return ((1 - t) * (1 - t)) * p0 + 2 * ((1 - t) * t * p1) + t * t * p2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
  cwidth = width;
  cheight = height;
  wWindowMin = width / 8;
  wWindowMax = width;
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
  setText(inputText.join("\n"));
}

function setAlignMode(val) {
  alignMode = Number(val);
  setText(inputText.join("\n"));
}

function createAnimation() {
  coreBase = null;
  coreBase = new TumbleBase();
}

function setFont(val) {
  selFont = Number(val);
  setText(inputText.join("\n"));
}

function setScaler(val) {
  scaler = map(Number(val), 0, 100, 0.1, 1);
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
  setText(inputText.join("\n"));
}

function setExtrudeType(val) {
  extrudeType = Number(val);
  if (extrudeType == 2) {
    maxDelay = -5;
    stageAstrength = 3;
    stageAdirect = 1;
    if (coreBase) coreBase.tickerReset();
  }
  if (coreBase) coreBase.liveReset();
}

function setMouseCenterOn(val) {
  if (val !== undefined) {
    mouseCenterOnToggle = Boolean(val) || val === 'true';
  } else {
    mouseCenterOnToggle = !mouseCenterOnToggle;
  }
  if (mouseCenterOnToggle === false) {
    mouseCenter.set(0, 0);
  }
  if (coreBase) coreBase.tickerReset();
}

function setTumbleDepthLength(val) {
  tumbleDepthLength = map(Number(val), 0, 100, 0, -150);
  if (coreBase) coreBase.liveReset();
}

function setTumbleAmount(val) {
  tumbleAmount = map(Number(val), 0, 100, 0, 2);
  if (coreBase) coreBase.liveReset();
}

function setZoomDepthLength(val) {
  zoomDepthLength = map(Number(val), 0, 100, 0, -1000);
  if (coreBase) coreBase.liveReset();
}

function setPunchDepthLength(val) {
  punchDepthLength = map(Number(val), 0, 100, 0, -150);
  if (coreBase) coreBase.liveReset();
}

function setPunchDistance(val) {
  punchDistance = map(Number(val), 0, 100, 0, 200);
  if (coreBase) coreBase.liveReset();
}

function setPunchInvert(val) {
  if (val !== undefined) {
    punchInvert = Boolean(val) || val === 'true';
  } else {
    punchInvert = !punchInvert;
  }
  if (coreBase) coreBase.tickerReset();
}

function setMaxDelay(val) {
  maxDelay = map(Number(val), 0, 100, 0, -90);
  if (coreBase) coreBase.tickerReset();
}

function setStageAdirect(val) {
  stageAdirect = Number(val);
}

function setStageAstrength(val) {
  stageAstrength = Number(val);
}

function setStageAlength(val) {
  baseAnimA = round(map(Number(val), 0, 100, 10, 200));
  setAnimStages();
}

function setStageBdirect(val) {
  stageBdirect = Number(val);
}

function setStageBstrength(val) {
  stageBstrength = Number(val);
}

function setStageBlength(val) {
  baseAnimC = round(map(Number(val), 0, 100, 10, 200));
  setAnimStages();
}

function setPauseLength(val) {
  baseAnimB = round(map(Number(val), 0, 100, 0, 100));
  setAnimStages();
}

function setAnimStages() {
  animA = baseAnimA;
  animB = baseAnimA + baseAnimB;
  animC = baseAnimA + baseAnimB + baseAnimC;
}

function setCapsOn(val) {
  if (val !== undefined) {
    capsOnToggle = Boolean(val) || val === 'true';
  } else {
    capsOnToggle = !capsOnToggle;
  }
}

function setStrokeOn(val) {
  if (val !== undefined) {
    strokeOnToggle = Boolean(val) || val === 'true';
  } else {
    strokeOnToggle = !strokeOnToggle;
  }
}

function setStrokeWeight(val) {
  strokeW = map(Number(val), 0, 100, 0, 10);
}

function setBkgdColor(val) { bkgdColor = color(val); }
function setTextColor(val) { textColor = color(val); }
function setStrokeColor(val) { strokeColor = color(val); }
function setSideSolidColor(val) { sideSolidColor = color(val); }

function setOrbitOn(val) {
  if (val !== undefined) {
    orbitOnToggle = Boolean(val) || val === 'true';
  } else {
    orbitOnToggle = !orbitOnToggle;
  }
  if (orbitOnToggle === false) {
    camera();
  }
}

function setColorSet(index, val) {
  colorSet[Number(index)] = color(val);
}

function setSidesType(val) {
  sidesType = Number(val);
}

function generateRandomPalette() {
  var rs0 = random(80);
  var holdCol = [];
  var holdBkgd, holdStroke, holdText;

  if (rs0 < 10) {
    holdCol[0] = '#484fd9';
    holdCol[1] = '#3f52bf';
    holdCol[2] = '#7ef25e';
    holdCol[3] = '#f2f2f2';
    holdCol[4] = '#000000';
    holdBkgd = '#ffffff';
    holdText = '#f2f2f2';
    holdStroke = '#000000';
  } else if (rs0 < 20) {
    holdCol[0] = '#f20530';
    holdCol[1] = '#0367a6';
    holdCol[2] = '#038c65';
    holdCol[3] = '#f29f05';
    holdCol[4] = '#f20505';
    holdBkgd = '#ffffff';
    holdText = '#000000';
    holdStroke = '#000000';
  } else if (rs0 < 30) {
    holdCol[0] = '#0597F2';
    holdCol[1] = '#05c7F2';
    holdCol[2] = '#f2e205';
    holdCol[3] = '#f2cb05';
    holdCol[4] = '#f2220f';
    holdBkgd = '#f2220f';
    holdText = '#000000';
    holdStroke = '#000000';
  } else if (rs0 < 40) {
    holdCol[0] = '#4f2859';
    holdCol[1] = '#4ed9cb';
    holdCol[2] = '#d93814';
    holdCol[3] = '#d9cd30';
    holdCol[4] = '#37a6a6';
    holdBkgd = '#4ed9cb';
    holdText = '#ffffff';
    holdStroke = '#5e5e5e';
  } else if (rs0 < 50) {
    holdCol[0] = '#1c2840';
    holdCol[1] = '#f2f1f0';
    holdCol[2] = '#797f8c';
    holdCol[3] = '#bfbfbf';
    holdCol[4] = '#3c4659';
    holdBkgd = '#1c2840';
    holdText = '#ffffff';
    holdStroke = '#000000';
  } else if (rs0 < 60) {
    holdCol[0] = '#f2359d';
    holdCol[1] = '#4ab8d9';
    holdCol[2] = '#5ea65b';
    holdCol[3] = '#f2d43d';
    holdCol[4] = '#ffffff';
    holdBkgd = '#000000';
    holdText = '#000000';
    holdStroke = '#ffffff';
  } else if (rs0 < 70) {
    holdCol[0] = '#95acbf';
    holdCol[1] = '#f2a663';
    holdCol[2] = '#d92d07';
    holdCol[3] = '#400101';
    holdCol[4] = '#f2f2f2';
    holdBkgd = '#c2c2c2';
    holdText = '#ffffff';
    holdStroke = '#000000';
  } else {
    holdCol[0] = '#8c8c8b';
    holdCol[1] = '#141414';
    holdCol[2] = '#424242';
    holdCol[3] = '#707070';
    holdCol[4] = '#444444';
    holdBkgd = '#000000';
    holdText = '#212121';
    holdStroke = '#00ff97';
  }

  bkgdColor = color(holdBkgd);
  textColor = color(holdText);
  strokeColor = color(holdStroke);
  for (var m = 0; m < 5; m++) {
    colorSet[m] = color(holdCol[m]);
  }
}

function updateSettings(data) {
  if (!data) return;

  if (data.preset) {
    const p = data.preset.toLowerCase();
    if (p === 'reset') {
      reSetting();
    }
  }

  // Handle set-prefixed parameter mappings
  if (data.text !== undefined || data.string !== undefined) {
    var txt = data.text !== undefined ? String(data.text) : String(data.string);
    setText(txt);
  }
  if (data.setFont !== undefined) setFont(data.setFont);
  if (data.setAlignMode !== undefined) setAlignMode(data.setAlignMode);
  if (data.setScaler !== undefined) setScaler(data.setScaler);
  if (data.setBkgdColor !== undefined) setBkgdColor(data.setBkgdColor);
  if (data.setCapsOn !== undefined) setCapsOn(data.setCapsOn);
  if (data.setTextColor !== undefined) setTextColor(data.setTextColor);
  if (data.setStrokeOn !== undefined) setStrokeOn(data.setStrokeOn);
  if (data.setStrokeWeight !== undefined) setStrokeWeight(data.setStrokeWeight);
  if (data.setStrokeColor !== undefined) setStrokeColor(data.setStrokeColor);
  if (data.setSidesType !== undefined) setSidesType(data.setSidesType);
  if (data.setSideSolidColor !== undefined) setSideSolidColor(data.setSideSolidColor);
  
  if (data.quint0color !== undefined) setColorSet(0, data.quint0color);
  if (data.quint1color !== undefined) setColorSet(1, data.quint1color);
  if (data.quint2color !== undefined) setColorSet(2, data.quint2color);
  if (data.quint3color !== undefined) setColorSet(3, data.quint3color);
  if (data.quint4color !== undefined) setColorSet(4, data.quint4color);
  
  if (data.setOrbitOn !== undefined) setOrbitOn(data.setOrbitOn);
  if (data.setMouseCenterOn !== undefined) setMouseCenterOn(data.setMouseCenterOn);
  if (data.setExtrudeType !== undefined) setExtrudeType(data.setExtrudeType);
  if (data.setTumbleDepthLength !== undefined) setTumbleDepthLength(data.setTumbleDepthLength);
  if (data.setTumbleAmount !== undefined) setTumbleAmount(data.setTumbleAmount);
  if (data.setZoomDepthLength !== undefined) setZoomDepthLength(data.setZoomDepthLength);
  if (data.setPunchDepthLength !== undefined) setPunchDepthLength(data.setPunchDepthLength);
  if (data.setPunchDistance !== undefined) setPunchDistance(data.setPunchDistance);
  if (data.setMaxDelay !== undefined) setMaxDelay(data.setMaxDelay);
  
  if (data.setStageAstrength !== undefined) setStageAstrength(data.setStageAstrength);
  if (data.setStageAdirect !== undefined) setStageAdirect(data.setStageAdirect);
  if (data.setStageAlength !== undefined) setStageAlength(data.setStageAlength);
  
  if (data.setPauseLength !== undefined) setPauseLength(data.setPauseLength);
  
  if (data.setStageBstrength !== undefined) setStageBstrength(data.setStageBstrength);
  if (data.setStageBdirect !== undefined) setStageBdirect(data.setStageBdirect);
  if (data.setStageBlength !== undefined) setStageBlength(data.setStageBlength);

  if (data.p5CameraX !== undefined && data.p5CameraY !== undefined && data.p5CameraZ !== undefined) {
    p5Camera.camera(Number(data.p5CameraX), Number(data.p5CameraY), Number(data.p5CameraZ));
  }

  // Also support direct parameter keys (e.g. font, scaler, bkgdColor, etc.)
  if (data.font !== undefined) setFont(data.font);
  if (data.alignMode !== undefined) setAlignMode(data.alignMode);
  if (data.scaler !== undefined) setScaler(data.scaler);
  if (data.bkgdColor !== undefined) setBkgdColor(data.bkgdColor);
  if (data.capsOn !== undefined) setCapsOn(data.capsOn);
  if (data.textColor !== undefined) setTextColor(data.textColor);
  if (data.strokeOn !== undefined) setStrokeOn(data.strokeOn);
  if (data.strokeWeight !== undefined) setStrokeWeight(data.strokeWeight);
  if (data.strokeColor !== undefined) setStrokeColor(data.strokeColor);
  if (data.sidesType !== undefined) setSidesType(data.sidesType);
  if (data.sideSolidColor !== undefined) setSideSolidColor(data.sideSolidColor);
  if (data.orbitOn !== undefined) setOrbitOn(data.orbitOn);
  if (data.mouseCenterOn !== undefined) setMouseCenterOn(data.mouseCenterOn);
  if (data.extrudeType !== undefined) setExtrudeType(data.extrudeType);
  if (data.tumbleDepthLength !== undefined) setTumbleDepthLength(data.tumbleDepthLength);
  if (data.tumbleAmount !== undefined) setTumbleAmount(data.tumbleAmount);
  if (data.zoomDepthLength !== undefined) setZoomDepthLength(data.zoomDepthLength);
  if (data.punchDepthLength !== undefined) setPunchDepthLength(data.punchDepthLength);
  if (data.punchDistance !== undefined) setPunchDistance(data.punchDistance);
  if (data.maxDelay !== undefined) setMaxDelay(data.maxDelay);
  
  if (data.stageAstrength !== undefined) setStageAstrength(data.stageAstrength);
  if (data.stageAdirect !== undefined) setStageAdirect(data.stageAdirect);
  if (data.stageAlength !== undefined) setStageAlength(data.stageAlength);
  if (data.pauseLength !== undefined) setPauseLength(data.pauseLength);
  if (data.stageBstrength !== undefined) setStageBstrength(data.stageBstrength);
  if (data.stageBdirect !== undefined) setStageBdirect(data.stageBdirect);
  if (data.stageBlength !== undefined) setStageBlength(data.stageBlength);
}

////////////////////////////////////// EASING ANIMATIONS (animators.js)
function stageAaccel(val) {
  if (stageAdirect == 0) {
    if (stageAstrength == 0) { return easeInSine(val); }
    else if (stageAstrength == 1) { return easeInCubic(val); }
    else if (stageAstrength == 2) { return easeInCirc(val); }
    else if (stageAstrength == 3) { return easeInExpo(val); }
    else if (stageAstrength == 4) { return easeInBack(val); }
    else if (stageAstrength == 5) { return easeInBounce(val); }
    else if (stageAstrength == 6) { return easeInElastic(val); }
  } else if (stageAdirect == 1) {
    if (stageAstrength == 0) { return easeOutSine(val); }
    else if (stageAstrength == 1) { return easeOutCubic(val); }
    else if (stageAstrength == 2) { return easeOutCirc(val); }
    else if (stageAstrength == 3) { return easeOutExpo(val); }
    else if (stageAstrength == 4) { return easeOutBack(val); }
    else if (stageAstrength == 5) { return easeOutBounce(val); }
    else if (stageAstrength == 6) { return easeOutElastic(val); }
  } else if (stageAdirect == 2) {
    if (stageAstrength == 0) { return easeInOutSine(val); }
    else if (stageAstrength == 1) { return easeInOutCubic(val); }
    else if (stageAstrength == 2) { return easeInOutCirc(val); }
    else if (stageAstrength == 3) { return easeInOutExpo(val); }
    else if (stageAstrength == 4) { return easeInOutBack(val); }
    else if (stageAstrength == 5) { return easeInOutBounce(val); }
    else if (stageAstrength == 6) { return easeInOutElastic(val); }
  }
}

function stageBaccel(val) {
  if (stageBdirect == 0) {
    if (stageBstrength == 0) { return easeInSine(val); }
    else if (stageBstrength == 1) { return easeInCubic(val); }
    else if (stageBstrength == 2) { return easeInCirc(val); }
    else if (stageBstrength == 3) { return easeInExpo(val); }
    else if (stageBstrength == 4) { return easeInBack(val); }
    else if (stageBstrength == 5) { return easeInBounce(val); }
    else if (stageBstrength == 6) { return easeInElastic(val); }
  } else if (stageBdirect == 1) {
    if (stageBstrength == 0) { return easeOutSine(val); }
    else if (stageBstrength == 1) { return easeOutCubic(val); }
    else if (stageBstrength == 2) { return easeOutCirc(val); }
    else if (stageBstrength == 3) { return easeOutExpo(val); }
    else if (stageBstrength == 4) { return easeOutBack(val); }
    else if (stageBstrength == 5) { return easeOutBounce(val); }
    else if (stageBstrength == 6) { return easeOutElastic(val); }
  } else if (stageBdirect == 2) {
    if (stageBstrength == 0) { return easeInOutSine(val); }
    else if (stageBstrength == 1) { return easeInOutCubic(val); }
    else if (stageBstrength == 2) { return easeInOutCirc(val); }
    else if (stageBstrength == 3) { return easeInOutExpo(val); }
    else if (stageBstrength == 4) { return easeInOutBack(val); }
    else if (stageBstrength == 5) { return easeInOutBounce(val); }
    else if (stageBstrength == 6) { return easeInOutElastic(val); }
  }
}

function easeInSine(x) { return 1 - Math.cos((x * Math.PI) / 2); }
function easeOutSine(x) { return Math.sin((x * Math.PI) / 2); }
function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }
function easeInCubic(x) { return x * x * x; }
function easeOutCubic(x) { return 1 - pow(1 - x, 3); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function easeInCirc(x) { return 1 - Math.sqrt(1 - Math.pow(x, 2)); }
function easeOutCirc(x) { return sqrt(1 - Math.pow(x - 1, 2)); }
function easeInOutCirc(x) { return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2; }
function easeInExpo(x) { return x === 0 ? 0 : pow(2, 10 * x - 10); }
function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function easeInOutExpo(x) { return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; }

function easeInBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * x * x * x - c1 * x * x;
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeInOutBack(x) {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function easeInBounce(x) { return 1 - easeOutBounce(1 - x); }

function easeOutBounce(x) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

function easeInOutBounce(x) {
  return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
}

function easeInElastic(x) {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

function easeOutElastic(x) {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeInOutElastic(x) {
  const c5 = (2 * Math.PI) / 4.5;
  return x === 0 ? 0 : x === 1 ? 1 : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

function easeInQuad(x) { return x * x; }
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function easeInQuint(x) { return x * x * x * x * x; }
function easeInOutQuint(x) { return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2; }

////////////////////////////////////// TUMBLE CLASSES
class TumbleBase {
  constructor() {
    this.lets = [];
    this.build();
  }

  build() {
    var leading = 10;
    var tracking = 0;
    if (selFont == 5) {
      tracking = 5;
    }

    maxDist = 0;

    if (selFont == 7 || selFont == 8) { //////////// ARABIC
      var fullLeftX = 0;
      var fullRightX = 0;
      var topY = 0;
      var botY = 0;
      
      for (var p = 0; p < inputText.length; p++) {
        var testerPath = myFont[selFont].getPath(inputText[p], 0, 0, pgTextSize);

        for (var m = 0; m < testerPath.commands.length - 1; m++) {
          if (testerPath.commands[m].y) {
            if (testerPath.commands[m].x < fullLeftX) {
              fullLeftX = testerPath.commands[m].x;
            } else if (testerPath.commands[m].x > fullRightX) {
              fullRightX = testerPath.commands[m].x;
            }

            var thisY = testerPath.commands[m].y + p * pgTextSize * tFontFactor[selFont];
            if (thisY < topY) {
              topY = thisY;
            } else if (thisY > botY) {
              botY = thisY;
            }
          }
        }
      }

      var allFullX = dist(fullLeftX, 0, fullRightX, 0);
      var fullY = dist(0, topY, 0, botY);

      var letCounter = 0;
      for (var p = 0; p < inputText.length; p++) {
        var holderPaths = myFont[selFont].getPath(inputText[p], 0, 0, pgTextSize);
        var thesePaths = [];
        var pathCounter = 0;
        thesePaths[pathCounter] = [];
        var leftX = 0;
        var rightX = 0;

        for (var m = 0; m < holderPaths.commands.length; m++) {
          if (holderPaths.commands[m].x < leftX) {
            leftX = holderPaths.commands[m].x;
          } else if (holderPaths.commands[m].x > rightX) {
            rightX = holderPaths.commands[m].x;
          }

          thesePaths[pathCounter].push(holderPaths.commands[m]);

          if (holderPaths.commands[m].type == 'Z') {
            if (
              m < holderPaths.commands.length - 1
              && holderPaths.commands[m + 1].x > leftX
              && holderPaths.commands[m + 1].x < rightX
            ) {
              // Counter detected
            } else {
              if (m < holderPaths.commands.length - 1) {
                pathCounter++;
                thesePaths[pathCounter] = [];
              }
            }
          }
        }

        var fullX = dist(leftX, 0, rightX, 0);

        for (var m = 0; m < thesePaths.length; m++) {
          var x = 0;
          var y = p * pgTextSize * tFontFactor[selFont];

          y += pgTextSize * tFontFactor[selFont];
          y -= fullY / 2;

          if (alignMode == 0) {
            x -= allFullX / 2;
          } else if (alignMode == 1) {
            x -= fullX / 2;
          } else if (alignMode == 2) {
            x += allFullX / 2;
            x -= fullX;
          }
          
          this.lets[letCounter] = new TumbleLetArabic(x, y, thesePaths[m], p, m);

          var meas = dist(this.lets[letCounter].orgX, this.lets[letCounter].orgY, mouseCenter.x, mouseCenter.y);
          if (meas > maxDist) {
            maxDist = meas;
          }

          letCounter++;
        }
      }
    } else { //////////// EVERYTHING ELSE
      for (var p = 0; p < inputText.length; p++) {
        for (var m = 0; m < inputText[p].length; m++) {
          var nextW = textWidth(inputText[p].substring(0, m + 1));
          var thisW = textWidth(inputText[p].charAt(m));
  
          var x = nextW - thisW;
          var y = p * pgTextSize * tFontFactor[selFont];
          
          if (alignMode == 0) {
            x -= fullW / 2;
          } else if (alignMode == 1) {
            x -= (textWidth(inputText[p]) + (inputText[p].length - 1) * tracking) / 2;
          } else if (alignMode == 2) {
            x += fullW / 2;
            x -= textWidth(inputText[p]);
          }
  
          x += (m - 1) * tracking;
  
          y -= -pgTextSize * tFontFactor[selFont] + inputText.length * pgTextSize * tFontFactor[selFont] / 2;
          y -= (inputText.length - 1) * leading / 2;
          if (p > 0) {
            y += (p) * leading;
          }
  
          if (inputText[p].charAt(m) != " ") {
            this.lets[this.lets.length] = new TumbleLet(x, y, p, m);
  
            var meas = dist(x, y, mouseCenter.x, mouseCenter.y);
            if (meas > maxDist) {
              maxDist = meas;
            }
          }
        }
      }
    }

    this.liveReset();
    this.tickerReset();
  }

  run() {
    for (var m = 0; m < this.lets.length; m++) {
      this.lets[m].run();
    }
  }

  liveReset() {
    for (var m = 0; m < this.lets.length; m++) {
      this.lets[m].liveReset();
    }
  }

  tickerReset() {
    for (var m = 0; m < this.lets.length; m++) {
      this.lets[m].tickerReset();
    }
  }
}

class TumbleLet {
  constructor(x, y, coreNumber, index) {
    textSize(pgTextSize);
    textFont(tFont[selFont]);

    this.x = x;
    this.y = y;

    this.xAct = 0; this.xTar = 0;
    this.yAct = 0; this.yTar = 0; this.yRotReturn = 0;
    this.zAct = 0; this.zTar = 0;
    this.xRotAct = 0; this.xRotTar = 0; this.xRotBase = 0;
    this.yRotAct = 0; this.yRotTar = 0; this.yRotBase = 0;
    this.zRotAct = 0; this.zRotTar = 0; this.zRotBase = 0;
    this.dAct = 0; this.dTar = 0;
    this.swAct = 0; this.swTar = 0;

    this.coreNumber = coreNumber;
    this.index = index;

    this.l = inputText[coreNumber].charAt(this.index);
    this.w = textWidth(this.l);

    this.h = pgTextSize * tFontFactor[selFont];

    this.coreTicker = 0;
    this.ticker = 0;

    this.p = null;
    this.mode = null;
    this.cols = [];

    this.build();
    this.runReset();
  }

  build() {
    textFont(tFont[selFont]);
    this.p = myFont[selFont].getPath(this.l, 0, 0, pgTextSize);
  }

  runReset() {
    this.tickerReset();

    this.xRotBase = random(-PI / 8, PI / 8);
    this.yRotBase = random(-PI / 6, PI / 6);
    this.zRotBase = random(-PI / 6, PI / 6);

    this.liveReset();

    for (var p = 0; p < this.p.commands.length; p++) {
      this.cols[p] = round(random(colorSet.length - 1));
    }
  }

  tickerReset() {
    var tkDist = dist(mouseCenter.x, mouseCenter.y, this.x + this.w / 2, this.y - this.h / 2);
    this.ticker = map(tkDist, 0, maxDist, 0, maxDelay);
    this.coreTicker = 0;
  }

  liveReset() {
    this.xTar = 0;
    this.yTar = 0;
    this.zTar = 0;
    this.xRotTar = 0;
    this.yRotTar = 0;
    this.yRotReturn = 0;
    this.zRotTar = 0;

    if (extrudeType == 0) { ////////////////////////////// TUMBLE
      this.xRotTar = tumbleAmount * this.xRotBase;
      this.yRotTar = tumbleAmount * this.yRotBase;
      this.zRotTar = tumbleAmount * this.zRotBase;

      this.dTar = tumbleDepthLength;
      this.zTar = -this.dTar / 2 + this.index % 2 * this.dTar;

    } else if (extrudeType == 1) { ////////////////////////////// ZOOM
      this.dTar = zoomDepthLength;
      this.zTar = -this.dTar / 2;

    } else if (extrudeType == 2) { ////////////////////////////// PUNCH
      var blastAng = atan2((this.y - this.h / 2) - mouseCenter.y, (this.x + this.w / 2) - mouseCenter.x);

      var blastDist = dist(mouseCenter.x, mouseCenter.y, this.x + this.w / 2, this.y - this.h / 2);
      var blastMag0 = map(blastDist, 0, maxDist, 0, 1);
      if (punchInvert) {
        blastMag0 = map(blastDist, 0, maxDist, 1, 0);
      }
      var blastMag = map(easeInOutExpo(blastMag0), 0, 1, 0, punchDistance);

      this.xTar = cos(blastAng) * blastMag;
      this.yTar = sin(blastAng) * blastMag;

      if (this.x + this.w / 2 < 0) {
        if ((this.y - this.h / 2) < 0) {
          this.zRotTar = (blastAng + PI) / 3;
        } else {
          this.zRotTar = (blastAng - PI) / 3;
        }
      } else {
        this.zRotTar = (blastAng) / 3;
      }
  
      this.yRotTar = map(easeInOutExpo(blastMag0), 0, 1, 0, -PI / 3);
      if (this.yRotTar < -PI / 6 && random(10) < 3) {
        var spinAdd = random(2, 4) * PI;
        this.yRotTar -= spinAdd;
        if (this.x + this.w / 2 < 0) {
          this.yRotReturn = -floor(this.yRotTar / TWO_PI) * TWO_PI;
        } else {
          this.yRotReturn = floor(this.yRotTar / TWO_PI) * TWO_PI;
        }
      } else {
        this.yRotReturn = 0;
      }
      if (this.x + this.w / 2 < 0) {
        this.yRotTar *= -1;
      }
  
      this.yRotTar += random(-PI / 16, PI / 16);
      this.zRotTar += random(-PI / 16, PI / 16);

      this.dTar = punchDepthLength;
      this.zTar = -this.dTar / 2 + this.index % 2 * this.dTar;
    }
  }

  run() {
    this.update();
    push();
      translate(this.x, this.y);
      translate(this.xAct, this.yAct, this.zAct);

      translate(this.w / 2, -this.h / 2, this.dAct / 2);
      rotateX(this.xRotAct);
      rotateY(this.yRotAct);
      rotateZ(this.zRotAct);
      translate(-this.w / 2, this.h / 2, -this.dAct / 2);

      this.displayShape();
      if (strokeOnToggle) {
        this.displaySkel();
      }
      if (sidesType != 0) {
        this.displayExtrudePatch();
      }
    pop();
  }

  update() {
    this.coreTicker++;
    this.ticker++;

    if (this.ticker < 0) {
      this.xAct = 0;
      this.yAct = 0;
      this.zAct = 0;
      this.xRotAct = 0;
      this.yRotAct = 0;
      this.zRotAct = 0;
      this.dAct = 0;

    } else if (this.ticker < animA) {
      var tk0 = map(this.ticker, 0, animA, 0, 1);
      var tk1 = stageAaccel(tk0);

      this.xAct = map(tk1, 0, 1, 0, this.xTar);
      this.yAct = map(tk1, 0, 1, 0, this.yTar);
      this.zAct = map(tk1, 0, 1, 0, this.zTar);
      this.xRotAct = map(tk1, 0, 1, 0, this.xRotTar);
      this.yRotAct = map(tk1, 0, 1, 0, this.yRotTar);
      this.zRotAct = map(tk1, 0, 1, 0, this.zRotTar);
      this.dAct = map(tk1, 0, 1, 0, this.dTar);

    } else if (this.ticker < animB) {
      this.xAct = this.xTar;
      this.yAct = this.yTar;
      this.zAct = this.zTar;
      this.xRotAct = this.xRotTar;
      this.yRotAct = this.yRotTar;
      this.zRotAct = this.zRotTar;
      this.dAct = this.dTar;

    } else if (this.ticker < animC) {
      var tk0 = map(this.ticker, animB, animC, 0, 1);
      var tk1 = stageBaccel(tk0);

      this.xAct = map(tk1, 0, 1, this.xTar, 0);
      this.yAct = map(tk1, 0, 1, this.yTar, 0);
      this.zAct = map(tk1, 0, 1, this.zTar, 0);
      this.xRotAct = map(tk1, 0, 1, this.xRotTar, 0);
      this.yRotAct = map(tk1, 0, 1, this.yRotTar, this.yRotReturn);
      this.zRotAct = map(tk1, 0, 1, this.zRotTar, 0);
      this.dAct = map(tk1, 0, 1, this.dTar, 0);

    } else {
      this.xAct = 0;
      this.yAct = 0;
      this.zAct = 0;
      this.xRotAct = 0;
      this.yRotAct = this.yRotReturn;
      this.zRotAct = 0;
      this.dAct = 0;
    }

    if (this.coreTicker >= animC + abs(maxDelay * 2)) {
      this.runReset();
    }
  }

  displayType() {
    push();
      translate(this.w / 2, 0);
      noStroke();
      fill(textColor);
      textAlign(CENTER);
      textFont(tFont[selFont]);
      textSize(pgTextSize);
      text(this.l, 0, 0);
    pop();
  }

  displayShape() {
    var strokeRepeats = 2;

    for (var m = 0; m < strokeRepeats; m++) { ////// DISPLAY 0: FRONT AND 1: BACK
      push();
        translate(0, 0, m * this.dAct);

        for (var r = 0; r < strokeRepeats; r++) { ////// DISPLAY 0: FILL AND 1: STROKE
          var openContour = false;

          if (strokeOnToggle) {
            if (r == 0) {
              strokeWeight(strokeW);
              stroke(strokeColor);
              noFill();
            } else {
              translate(0, 0, -0.5);
              noStroke();
              if (capsOnToggle) {
                fill(textColor);
              } else {
                noFill();
              }
            }
          } else {
            noStroke();
            if (capsOnToggle) {
              fill(textColor);
            } else {
              noFill();
            }
          }

          var closePoint = 0;
          for (var i = 0; i < this.p.commands.length; i++) {
            if (this.p.commands[i].type == "M") {
              if (i > 0) {
                beginContour();
                openContour = true;
              } else {
                beginShape(TESS);
              }
              vertex(this.p.commands[i].x, this.p.commands[i].y);
            }
        
            if (this.p.commands[i].type == "Z") {
              if (openContour) {
                endContour();
              }
              if (i == this.p.commands.length - 1) {
                endShape(CLOSE);
              }
              closePoint = i + 1;
            }
        
            if (this.p.commands[i].type == "L") {
              vertex(this.p.commands[i].x, this.p.commands[i].y);
            }

            if (this.p.commands[i].type == "Q") {
              quadraticVertex(
                this.p.commands[i].x1,
                this.p.commands[i].y1,
                this.p.commands[i].x,
                this.p.commands[i].y
              );
            }

            if (this.p.commands[i].type == "C") {
              bezierVertex(
                this.p.commands[i].x1,
                this.p.commands[i].y1,
                this.p.commands[i].x2,
                this.p.commands[i].y2,
                this.p.commands[i].x,
                this.p.commands[i].y
              );
              vertex(
                this.p.commands[i].x,
                this.p.commands[i].y
              );
            }
          }
        }
      pop();
    }
  }

  displayExtrudePatch() {
    if (sidesType == 1) {
      fill(sideSolidColor);
    }
    noStroke();

    var closePoint = 0;
    for (var i = 0; i < this.p.commands.length; i++) {
      if (sidesType == 2) {
        fill(colorSet[this.cols[i]]);
      }

      if (this.p.commands[i].type == "Z") {
        beginShape(TRIANGLE_STRIP);
          vertex(this.p.commands[i - 1].x, this.p.commands[i - 1].y, 0);
          vertex(this.p.commands[i - 1].x, this.p.commands[i - 1].y, this.dAct);

          vertex(this.p.commands[closePoint].x, this.p.commands[closePoint].y, 0);
          vertex(this.p.commands[closePoint].x, this.p.commands[closePoint].y, this.dAct);
        endShape();

        closePoint = i + 1;
      }
  
      if (this.p.commands[i].type == "L") {
        beginShape(TRIANGLE_STRIP);
          vertex(this.p.commands[i - 1].x, this.p.commands[i - 1].y, 0);
          vertex(this.p.commands[i - 1].x, this.p.commands[i - 1].y, this.dAct);

          vertex(this.p.commands[i].x, this.p.commands[i].y, 0);
          vertex(this.p.commands[i].x, this.p.commands[i].y, this.dAct);
        endShape();
      }
      
      if (this.p.commands[i].type == "Q") {
        beginShape(TRIANGLE_STRIP);
          for (var r = 0; r < res; r++) {
            var thisT = r / (res - 1);
            var thisX = quadLerp(this.p.commands[i - 1].x, this.p.commands[i].x1, this.p.commands[i].x, thisT);
            var thisY = quadLerp(this.p.commands[i - 1].y, this.p.commands[i].y1, this.p.commands[i].y, thisT);

            vertex(thisX, thisY, 0);
            vertex(thisX, thisY, this.dAct);
          }
        endShape();
      }

      if (this.p.commands[i].type == "C") {
        beginShape(TRIANGLE_STRIP);
          for (var r = 0; r < res; r++) {
            var thisT = r / (res - 1);
            var thisX = bezierPoint(this.p.commands[i - 1].x, this.p.commands[i].x1, this.p.commands[i].x2, this.p.commands[i].x, thisT);
            var thisY = bezierPoint(this.p.commands[i - 1].y, this.p.commands[i].y1, this.p.commands[i].y2, this.p.commands[i].y, thisT);

            vertex(thisX, thisY, 0);
            vertex(thisX, thisY, this.dAct);
          }
        endShape();
      }
    }
  }
  
  displaySkel() {
    push();
      translate(0, 0, -1);
      noFill();
      stroke(strokeColor);
      strokeWeight(strokeW);

      for (var i = 0; i < this.p.commands.length; i++) {
        if (this.p.commands[i].type != "Z") {
          line(
            this.p.commands[i].x, this.p.commands[i].y, 0,
            this.p.commands[i].x, this.p.commands[i].y, this.dAct
          );
        }
      }
    pop();
  }
}

class TumbleLetArabic {
  constructor(x, y, path, coreNumber, index) {
    this.x = x;
    this.y = y;

    this.orgX = path[0].x;
    this.orgY = path[0].y;
    
    this.path = path;

    this.xAct = 0; this.xTar = 0;
    this.yAct = 0; this.yTar = 0; this.yRotReturn = 0;
    this.zAct = 0; this.zTar = 0;
    this.xRotAct = 0; this.xRotTar = 0; this.xRotBase = 0;
    this.yRotAct = 0; this.yRotTar = 0; this.yRotBase = 0;
    this.zRotAct = 0; this.zRotTar = 0; this.zRotBase = 0;
    this.dAct = 0; this.dTar = 0;
    this.swAct = 0; this.swTar = 0;

    this.coreNumber = coreNumber;
    this.index = index;

    this.centerX = 0;
    this.centerY = 0;

    this.coreTicker = 0;
    this.ticker = 0;

    this.mode = null;
    this.cols = [];

    this.zeroOut();
    this.runReset();
  }

  zeroOut() {
    var xMin = this.path[0].x;
    var xMax = this.path[0].x;
    var yMin = this.path[0].y;
    var yMax = this.path[0].y;
    for (var p = 0; p < this.path.length - 1; p++) {
      if (this.path[p].x < xMin) { xMin = this.path[p].x; }
      if (this.path[p].x > xMax) { xMax = this.path[p].x; }
      if (this.path[p].y < yMin) { yMin = this.path[p].y; }
      if (this.path[p].y > yMax) { yMax = this.path[p].y; }
    }

    this.centerX = (xMax - xMin) / 2;
    this.centerY = (yMax - yMin) / 2;

    for (var p = 0; p < this.path.length - 1; p++) {
      if (this.path[p].x != null) { this.path[p].x -= xMin; }
      if (this.path[p].x1 != null) { this.path[p].x1 -= xMin; }
      if (this.path[p].x2 != null) { this.path[p].x2 -= xMin; }
    }
    this.x += xMin;
    this.orgX = this.x;
  }

  runReset() {
    this.tickerReset();

    this.xRotBase = random(-PI / 8, PI / 8);
    this.yRotBase = random(-PI / 6, PI / 6);
    this.zRotBase = random(-PI / 6, PI / 6);

    this.liveReset();

    for (var p = 0; p < this.path.length; p++) {
      this.cols[p] = round(random(colorSet.length - 1));
    }
  }

  tickerReset() {
    var tkDist = dist(mouseCenter.x, mouseCenter.y, this.orgX, this.orgY);
    this.ticker = map(tkDist, 0, maxDist, 0, maxDelay);
    this.coreTicker = 0;
  }

  liveReset() {
    this.xTar = 0;
    this.yTar = 0;
    this.zTar = 0;
    this.xRotTar = 0;
    this.yRotTar = 0;
    this.yRotReturn = 0;
    this.zRotTar = 0;

    if (extrudeType == 0) { ////////////////////////////// TUMBLE
      this.xRotTar = tumbleAmount * this.xRotBase;
      this.yRotTar = tumbleAmount * this.yRotBase;
      this.zRotTar = tumbleAmount * this.zRotBase;

      this.dTar = tumbleDepthLength;
      this.zTar = -this.dTar / 2 + this.index % 2 * this.dTar;

    } else if (extrudeType == 1) { ////////////////////////////// ZOOM
      this.dTar = zoomDepthLength;
      this.zTar = -this.dTar / 2;

    } else if (extrudeType == 2) { ////////////////////////////// PUNCH
      var blastAng = atan2((this.y - this.centerY) - mouseCenter.y, (this.x + this.centerX) - mouseCenter.x);

      var blastDist = dist(mouseCenter.x, mouseCenter.y, this.x + this.centerX, this.y - this.centerY);
      var blastMag0 = map(blastDist, 0, maxDist, 0, 1);
      if (punchInvert) {
        blastMag0 = map(blastDist, 0, maxDist, 1, 0);
      }
      var blastMag = map(easeInOutExpo(blastMag0), 0, 1, 0, punchDistance);

      this.xTar = cos(blastAng) * blastMag;
      this.yTar = sin(blastAng) * blastMag;

      if (this.x + this.centerX < 0) {
        if ((this.y - this.centerY) < 0) {
          this.zRotTar = (blastAng + PI) / 3;
        } else {
          this.zRotTar = (blastAng - PI) / 3;
        }
      } else {
        this.zRotTar = (blastAng) / 3;
      }
  
      this.yRotTar = map(easeInOutExpo(blastMag0), 0, 1, 0, -PI / 3);
      if (this.yRotTar < -PI / 6 && random(10) < 3) {
        var spinAdd = random(2, 4) * PI;
        this.yRotTar -= spinAdd;
        if (this.x + this.centerX < 0) {
          this.yRotReturn = -floor(this.yRotTar / TWO_PI) * TWO_PI;
        } else {
          this.yRotReturn = floor(this.yRotTar / TWO_PI) * TWO_PI;
        }
      } else {
        this.yRotReturn = 0;
      }
      if (this.x + this.centerX < 0) {
        this.yRotTar *= -1;
      }
  
      this.yRotTar += random(-PI / 16, PI / 16);
      this.zRotTar += random(-PI / 16, PI / 16);

      this.dTar = punchDepthLength;
      this.zTar = -this.dTar / 2 + this.index % 2 * this.dTar;
    }
  }

  run() {
    this.update();

    push();
      translate(this.x, this.y);
      translate(this.xAct, this.yAct, this.zAct);

      translate(this.centerX, -this.centerY, this.dAct / 2);
      rotateX(this.xRotAct);
      rotateY(this.yRotAct);
      rotateZ(this.zRotAct);
      translate(-this.centerX, this.centerY, -this.dAct / 2);

      this.displayShape();
      if (strokeOnToggle) {
        this.displaySkel();
      }
      if (sidesType != 0) {
        this.displayExtrudePatch();
      }
    pop();
  }

  update() {
    this.coreTicker++;
    this.ticker++;

    if (this.ticker < 0) {
      this.xAct = 0;
      this.yAct = 0;
      this.zAct = 0;
      this.xRotAct = 0;
      this.yRotAct = 0;
      this.zRotAct = 0;
      this.dAct = 0;

    } else if (this.ticker < animA) {
      var tk0 = map(this.ticker, 0, animA, 0, 1);
      var tk1 = stageAaccel(tk0);

      this.xAct = map(tk1, 0, 1, 0, this.xTar);
      this.yAct = map(tk1, 0, 1, 0, this.yTar);
      this.zAct = map(tk1, 0, 1, 0, this.zTar);
      this.xRotAct = map(tk1, 0, 1, 0, this.xRotTar);
      this.yRotAct = map(tk1, 0, 1, 0, this.yRotTar);
      this.zRotAct = map(tk1, 0, 1, 0, this.zRotTar);
      this.dAct = map(tk1, 0, 1, 0, this.dTar);

    } else if (this.ticker < animB) {
      this.xAct = this.xTar;
      this.yAct = this.yTar;
      this.zAct = this.zTar;
      this.xRotAct = this.xRotTar;
      this.yRotAct = this.yRotTar;
      this.zRotAct = this.zRotTar;
      this.dAct = this.dTar;

    } else if (this.ticker < animC) {
      var tk0 = map(this.ticker, animB, animC, 0, 1);
      var tk1 = stageBaccel(tk0);

      this.xAct = map(tk1, 0, 1, this.xTar, 0);
      this.yAct = map(tk1, 0, 1, this.yTar, 0);
      this.zAct = map(tk1, 0, 1, this.zTar, 0);
      this.xRotAct = map(tk1, 0, 1, this.xRotTar, 0);
      this.yRotAct = map(tk1, 0, 1, this.yRotTar, this.yRotReturn);
      this.zRotAct = map(tk1, 0, 1, this.zRotTar, 0);
      this.dAct = map(tk1, 0, 1, this.dTar, 0);

    } else {
      this.xAct = 0;
      this.yAct = 0;
      this.zAct = 0;
      this.xRotAct = 0;
      this.yRotAct = this.yRotReturn;
      this.zRotAct = 0;
      this.dAct = 0;
    }

    if (this.coreTicker >= animC + abs(maxDelay * 2)) {
      this.runReset();
    }
  }

  displayType() {
    push();
      translate(this.centerX, 0);
      noStroke();
      fill(textColor);
      textAlign(CENTER);
      textFont(tFont[selFont]);
      textSize(pgTextSize);
      text(this.l, 0, 0);
    pop();
  }

  displayShape() {
    var strokeRepeats = 2;

    for (var m = 0; m < strokeRepeats; m++) { ////// DISPLAY 0: FRONT AND 1: BACK
      push();
        translate(0, 0, m * this.dAct);

        for (var r = 0; r < strokeRepeats; r++) { ////// DISPLAY 0: FILL AND 1: STROKE
          var openContour = false;

          if (strokeOnToggle) {
            if (r == 0) {
              strokeWeight(strokeW);
              stroke(strokeColor);
              noFill();
            } else {
              translate(0, 0, -0.5);
              noStroke();
              if (capsOnToggle) {
                fill(textColor);
              } else {
                noFill();
              }
            }
          } else {
            noStroke();
            if (capsOnToggle) {
              fill(textColor);
            } else {
              noFill();
            }
          }

          var closePoint = 0;
          for (var i = 0; i < this.path.length; i++) {
            if (this.path[i].type == "M") {
              if (i > 0) {
                beginContour();
                openContour = true;
              } else {
                beginShape(TESS);
              }
              vertex(this.path[i].x, this.path[i].y);
            }
        
            if (this.path[i].type == "Z") {
              if (openContour) {
                endContour();
              }
              if (i == this.path.length - 1) {
                endShape(CLOSE);
              }
              closePoint = i + 1;
            }
        
            if (this.path[i].type == "L") {
              vertex(this.path[i].x, this.path[i].y);
            }

            if (this.path[i].type == "Q") {
              quadraticVertex(
                this.path[i].x1,
                this.path[i].y1,
                this.path[i].x,
                this.path[i].y
              );
            }

            if (this.path[i].type == "C") {
              bezierVertex(
                this.path[i].x1,
                this.path[i].y1,
                this.path[i].x2,
                this.path[i].y2,
                this.path[i].x,
                this.path[i].y
              );
              vertex(
                this.path[i].x,
                this.path[i].y
              );
            }
          }
        }
      pop();
    }
  }

  displayExtrudePatch() {
    if (sidesType == 1) {
      fill(sideSolidColor);
    }
    noStroke();

    var closePoint = 0;
    for (var i = 0; i < this.path.length; i++) {
      if (sidesType == 2) {
        fill(colorSet[this.cols[i]]);
      }

      if (this.path[i].type == "Z") {
        beginShape(TRIANGLE_STRIP);
          vertex(this.path[i - 1].x, this.path[i - 1].y, 0);
          vertex(this.path[i - 1].x, this.path[i - 1].y, this.dAct);

          vertex(this.path[closePoint].x, this.path[closePoint].y, 0);
          vertex(this.path[closePoint].x, this.path[closePoint].y, this.dAct);
        endShape();

        closePoint = i + 1;
      }
  
      if (this.path[i].type == "L") {
        beginShape(TRIANGLE_STRIP);
          vertex(this.path[i - 1].x, this.path[i - 1].y, 0);
          vertex(this.path[i - 1].x, this.path[i - 1].y, this.dAct);

          vertex(this.path[i].x, this.path[i].y, 0);
          vertex(this.path[i].x, this.path[i].y, this.dAct);
        endShape();
      }
      
      if (this.path[i].type == "Q") {
        beginShape(TRIANGLE_STRIP);
          for (var r = 0; r < res; r++) {
            var thisT = r / (res - 1);
            var thisX = quadLerp(this.path[i - 1].x, this.path[i].x1, this.path[i].x, thisT);
            var thisY = quadLerp(this.path[i - 1].y, this.path[i].y1, this.path[i].y, thisT);

            vertex(thisX, thisY, 0);
            vertex(thisX, thisY, this.dAct);
          }
        endShape();
      }

      if (this.path[i].type == "C") {
        beginShape(TRIANGLE_STRIP);
          for (var r = 0; r < res; r++) {
            var thisT = r / (res - 1);
            var thisX = bezierPoint(this.path[i - 1].x, this.path[i].x1, this.path[i].x2, this.path[i].x, thisT);
            var thisY = bezierPoint(this.path[i - 1].y, this.path[i].y1, this.path[i].y2, this.path[i].y, thisT);

            vertex(thisX, thisY, 0);
            vertex(thisX, thisY, this.dAct);
          }
        endShape();
      }
    }
  }
  
  displaySkel() {
    push();
      translate(0, 0, -1);
      noFill();
      stroke(strokeColor);
      strokeWeight(strokeW);

      for (var i = 0; i < this.path.length; i++) {
        if (this.path[i].type != "Z") {
          line(
            this.path[i].x, this.path[i].y, 0,
            this.path[i].x, this.path[i].y, this.dAct
          );
        }
      }
    pop();
  }
}
