var tFont = [];
var pgTextSize = 100;
var bkgdColor, foreColor;
var colorA = [];

var main;
var selector = 0;
var fullMainWidth;
var budgeCenter = 0;

var mainFlash;
var sceneLength = 30;

var starterText = "THE\nCOLLECTIVE\nPOWER\nOF\nTINY\nMOMENTS";

var rampCounter = 0;

var thisFont = 0;
var thisFontAdjust = 0.7;
var thisFontAdjustUp = -0.2;

var flashCount = 13;
var sceneOn = [];
var sceneCount = 15;

var widgetOn = true;

const frate = 30;
var numFrames = 100;

let sceneRepeats = 2;
let thisDensity = 2;

let cwidth, cheight;
let saveMode = 0;

let coreCounter = 0;
let recMessageOn = false;
let colorSwapOn = true;

let displayMode = 0;
let accelMode = 0;
let sHold = 0;

// Broadcast settings
var inpText = "";
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

function preload(){
  if (window.location.protocol === 'file:') {
    tFont[0] = "IBMPlexMono-Regular";
    tFont[1] = "IBMPlexMono-Regular";
    tFont[2] = "Inter-Medium";
    tFont[3] = "IBMPlexMono-Regular";
    tFont[4] = "IBMPlexMono-Regular";
    tFont[5] = "IBMPlexMono-Regular";
    tFont[6] = "Cairo-Black";
  } else {
    tFont[0] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[1] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[2] = loadFont("../assets/Inter-Medium.ttf");
    tFont[3] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[4] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[5] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[6] = loadFont("../assets/Cairo-Black.ttf");
  }

  currentFont = tFont[0];
  thisFontAdjust = 0.7;
  thisFontAdjustUp = 0;
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);

  for(var n = 0; n < flashCount; n++){
    sceneOn[n] = true;
  }

  cwidth = width;
  cheight = height;
  thisDensity = pixelDensity();

  bkgdColor = color('#ffffff');
  foreColor = color('#000000');
  colorA[0] = color('#f25835');
  colorA[1] = color('#0487d9');
  colorA[2] = color('#014029');
  colorA[3] = color('#f2ae30');
  colorA[4] = color('#f2aec1');

  frameRate(frate);
  textureMode(NORMAL);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "THE\nCOLLECTIVE\nPOWER\nOF\nTINY\nMOMENTS";
  sceneLength = 30;
  thisFont = 0;
  colorSwapOn = true;

  foreColor = color('#000000');
  bkgdColor = color('#ffffff');

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;

  setText(inpText);
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.text !== undefined) inpText = String(settings.text);
  if (settings.sceneLength !== undefined) sceneLength = Number(settings.sceneLength);
  if (settings.thisFont !== undefined) {
    thisFont = Number(settings.thisFont);
    setFont(thisFont);
  }
  if (settings.colorSwapOn !== undefined) colorSwapOn = Boolean(settings.colorSwapOn);
  if (settings.foreColor !== undefined) foreColor = color(settings.foreColor);
  if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);

  setText(inpText);
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
    setText(inpText);
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.sceneLength !== undefined) sceneLength = Number(data.sceneLength);
  if (data.thisFont !== undefined) { thisFont = Number(data.thisFont); setFont(thisFont); }
  if (data.colorSwapOn !== undefined) colorSwapOn = Boolean(data.colorSwapOn) || data.colorSwapOn === 'true';
  if (data.foreColor !== undefined) foreColor = color(data.foreColor);
  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        text: inpText,
        sceneLength: sceneLength,
        thisFont: thisFont,
        colorSwapOn: colorSwapOn,
        foreColor: foreColor.toString(),
        bkgdColor: bkgdColor.toString()
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
      setText(inpText);
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = millis();
        setText(inpText);
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
        setText(inpText);
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
  ortho(-width / 2, width / 2, -height / 2, height / 2, -10000, 10000);
  
  push();
  translate(-width/2, -height/2);

  if (mainFlash) {
    mainFlash.update();
    mainFlash.display();
  }
  pop();

  if (displayMode == 0) {
    if ((coreCounter + 1) % sceneLength == 0) {
      pickScene();
    }
  } else if (displayMode == 1) {
    if (sHold != second()) {
      pickScene();
      sHold = second();
    }
  }

  coreCounter++;

  if (typeof captureFrame === 'function') captureFrame();
}

function pickScene(){
  if(mainFlash != null){
    mainFlash.removeGraphics();
  }

  if(selector == keyArray.length){
    selector = 0;
  }

  var currentText = keyArray[selector];
  if(displayMode == 1){
    let h = hour();
    let m = minute();
    let s = second();
    m = checkTime(m);
    s = checkTime(s);

    var barrier = ":";
    if(currentFont == tFont[5]){
      barrier = ".";
    }

    currentText = h + barrier + m + barrier + s;
  }

  if(sceneCount == 0){
    mainFlash = new Blank(rampCounter%2, currentText);
  } else {
    var sceneSelecting = true;
    var rs0 = random(flashCount * 10);
    while(sceneSelecting){
      if(rs0 < 10 && sceneOn[0]){
        mainFlash = new Arcer(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 10 && rs0 < 20 && sceneOn[1]){
        mainFlash = new Bend(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 20 && rs0 < 30 && sceneOn[2]){
        mainFlash = new Box(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 30 && rs0 < 40 && sceneOn[3]) {
        if(accelMode == 0){
          mainFlash = new BugEyes(rampCounter%2, currentText);
        } else {
          mainFlash = new BugEyesEE(rampCounter%2, currentText);
        }
        sceneSelecting = false;
      } else if(rs0 > 40 && rs0 < 50 && sceneOn[4]){
        mainFlash = new Halo(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 50 && rs0 < 60 && sceneOn[5]){
        mainFlash = new RiseSun(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 60 && rs0 < 70 && sceneOn[6]){
        if(accelMode == 0){
          mainFlash = new Shutters(rampCounter%2, currentText);
        } else {
          mainFlash = new ShuttersEE(rampCounter%2, currentText);
        }
        sceneSelecting = false;
      } else if(rs0 > 70 && rs0 < 80 && sceneOn[7]){
        mainFlash = new Shutters2(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 80 && rs0 < 90 && sceneOn[8]){
        mainFlash = new SlotMachine(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 90 && rs0 < 100 && sceneOn[9]){
        mainFlash = new Snap(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 100 && rs0 < 110 && sceneOn[10]){
        mainFlash = new Split(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 110 && rs0 < 120 && sceneOn[11]){
        mainFlash = new Starburst(rampCounter%2, currentText);
        sceneSelecting = false;
      } else if(rs0 > 120 && rs0 <= 130 && sceneOn[12]) {
        mainFlash = new Twist(rampCounter%2, currentText);
        sceneSelecting = false;
      } else {
        rs0 = random(flashCount * 10);
      }
    }
  }

  if(colorSwapOn){
    if(random(10) < 3){
      var colorAStr = rgbToHex(foreColor.levels[0], foreColor.levels[1], foreColor.levels[2]);
      var colorBStr = rgbToHex(bkgdColor.levels[0], bkgdColor.levels[1], bkgdColor.levels[2]);
  
      foreColor = color(colorBStr);
      bkgdColor = color(colorAStr);
    }
  }

  rampCounter ++;
  selector ++;
}

function checkTime(i){
  if (i < 10) {i = "0" + i};
  return i;
}

function rgbToHex(r, g, b) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight, WEBGL);
  cwidth = width;
  cheight = height;
}
