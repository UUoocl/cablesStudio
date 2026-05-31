var bkgdColor = '#f2B441';
var strokeColor = '#000000';
var fillColor = '#ffffff';

var pg = [];
var pgTextSize = 250;

var tFont = [];
var pgTextFactor = [];
var fontSelect = 0;

var starterText = "AND\nBEGIN\nAGAIN";

var inputText;
var coreSplode;
var coreMousePop;

var orgX, orgY;
var coreScale = 1;
var coreSW = 2;
var widgetOn = true;

var blastFactor = 1;
var detailFactor = 0.7;
var ratioFactor = 2;
let spurMessyToggle = false;

var mousePopOn = true;

const frate = 30;
var numFrames = 300;

let thisDensity = 2;
let blastType = 0;

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
  tFont[0] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[0] = 0.85;

  tFont[1] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[1] = 0.85;

  tFont[2] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[2] = 0.75;

  tFont[3] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[3] = 0.75;

  tFont[4] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[4] = 0.75;

  tFont[5] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[5] = 0.75;

  tFont[6] = loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[6] = 1.0;
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);

  thisDensity = pixelDensity();

  orgX = width/2;
  orgY = height/2;
  if(mousePopOn){
    coreMousePop = new MousePop(orgX, orgY);
  }

  frameRate(frate);

  textFont(tFont[fontSelect]);
  textSize(pgTextSize);
  strokeJoin(ROUND);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "AND\nBEGIN\nAGAIN";
  fontSelect = 0;
  pgTextSize = 250;
  fillColor = '#ffffff';
  strokeColor = '#000000';
  bkgdColor = '#f2B441';
  coreSW = 2;
  blastType = 0;
  detailFactor = 0.7;
  blastFactor = 1;
  ratioFactor = 2;
  spurMessyToggle = false;
  mousePopOn = true;

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;

  setText();
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.text !== undefined) inpText = String(settings.text);
  if (settings.fontSelect !== undefined) fontSelect = Number(settings.fontSelect);
  if (settings.pgTextSize !== undefined) pgTextSize = Number(settings.pgTextSize);
  if (settings.fillColor !== undefined) fillColor = String(settings.fillColor);
  if (settings.strokeColor !== undefined) strokeColor = String(settings.strokeColor);
  if (settings.bkgdColor !== undefined) bkgdColor = String(settings.bkgdColor);
  if (settings.coreSW !== undefined) coreSW = Number(settings.coreSW);
  if (settings.blastType !== undefined) blastType = Number(settings.blastType);
  if (settings.detailFactor !== undefined) detailFactor = Number(settings.detailFactor);
  if (settings.blastFactor !== undefined) blastFactor = Number(settings.blastFactor);
  if (settings.ratioFactor !== undefined) ratioFactor = Number(settings.ratioFactor);
  if (settings.spurMessyToggle !== undefined) spurMessyToggle = Boolean(settings.spurMessyToggle);
  if (settings.mousePopOn !== undefined) mousePopOn = Boolean(settings.mousePopOn);

  setText();
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
    setText();
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.fontSelect !== undefined) { fontSelect = Number(data.fontSelect); setFont(fontSelect); }
  if (data.pgTextSize !== undefined) { pgTextSize = Number(data.pgTextSize); setPGtextSize(data.pgTextSize); }
  if (data.fillColor !== undefined) fillColor = String(data.fillColor);
  if (data.strokeColor !== undefined) strokeColor = String(data.strokeColor);
  if (data.bkgdColor !== undefined) bkgdColor = String(data.bkgdColor);
  if (data.coreSW !== undefined) { coreSW = Number(data.coreSW); setCoreSW(data.coreSW); }
  if (data.blastType !== undefined) { blastType = Number(data.blastType); setBlastType(blastType); }
  if (data.detailFactor !== undefined) { detailFactor = Number(data.detailFactor); setDetailFactor(data.detailFactor); }
  if (data.blastFactor !== undefined) { blastFactor = Number(data.blastFactor); setBlastFactor(data.blastFactor); }
  if (data.ratioFactor !== undefined) { ratioFactor = Number(data.ratioFactor); setRatioFactor(data.ratioFactor); }
  if (data.spurMessyToggle !== undefined) { spurMessyToggle = Boolean(data.spurMessyToggle) || data.spurMessyToggle === 'true'; toggleSpurMessy(spurMessyToggle); }
  if (data.mousePopOn !== undefined) { mousePopOn = Boolean(data.mousePopOn) || data.mousePopOn === 'true'; toggleMousePop(mousePopOn); }

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        text: inpText,
        fontSelect: fontSelect,
        pgTextSize: pgTextSize,
        fillColor: fillColor,
        strokeColor: strokeColor,
        bkgdColor: bkgdColor,
        coreSW: coreSW,
        blastType: blastType,
        detailFactor: detailFactor,
        blastFactor: blastFactor,
        ratioFactor: ratioFactor,
        spurMessyToggle: spurMessyToggle,
        mousePopOn: mousePopOn
      }
    };
    if (typeof pubChannel !== 'undefined') {
      pubChannel.postMessage(payload);
    }
  }
}

function draw(){
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
      setText();
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = millis();
        setText();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
        setText();
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

  if(mousePopOn && coreMousePop){ coreMousePop.runBottom(); }
  if (coreSplode) {
    coreSplode.run();
  }
  if(mousePopOn && coreMousePop){ coreMousePop.runTop();}

  if (typeof captureFrame === 'function') captureFrame();
}

function mousePressed(){
  if(mouseX > 200 || mouseY > 250){
    orgX = mouseX;
    orgY = mouseY;
  
    if (coreSplode) coreSplode.refresh();
    if (coreMousePop) coreMousePop.refresh(orgX, orgY);
  }
}

function buildIt(){
  coreSplode = new SplodeAll();

  orgX = width/2;
  orgY = height/2;

  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);

  if (coreSplode) coreSplode.refresh();
  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
}
