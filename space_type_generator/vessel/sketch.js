var bkgdColor, foreColor, accentColor;
var colorSet = [];

var inputText = [];
var inpText = "THE\nMEANING\nOF ALL\nMOTIONS\nSHAPES &\nSOUNDS";

var tFont = [];
var pgTextSize = 90;
var pgBkgd = [];
var fontHeightFactor = [];
var coreBase;

var fontFactor = [];
var vesselSW = 2;

var wWindow;
var textScale = 1;
var saveMode = 0;

var centerY = 0;
var leftX = 0;
var rightX = 0;
var culmYtarget = 0;

var stageA = 30;
var stageB = 45;

var stageAdirect = 2;
var stageAstrength = 3;
var stageBdirect = 2;
var stageBstrength = 3;

var stageAlength = 25;
var stageBlength = 50;

var cTickerMeasure = 0;
var cTicker = 0;

var boxWmeas = 0;
var boxW = 0;
var boxWorg = 0;
var boxWtarget = 0;

var peakY = 0;
var boxH = 0;
var boxHorg = 0;
var boxHtarget = 0;

var boxRTop = 0;
var boxRTopOrg = 0;
var boxRTopTarget = 0;

var boxRBot = 0;
var boxRBotOrg = 0;
var boxRBotTarget = 0;

var charDelay = -2;
var lineDelay = -3;

var fontSel = 0;
var crestType = 1;

var debugOn = false;
var centerOn = false;

var svgSaveOn = false;
var cwidth, cheight;
var frate = 30;
var thisDensity = 1;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;


function preload() {
  if (window.location.protocol === 'file:') {
    tFont[0] = "IBMPlexMono-Regular";
    tFont[1] = "IBMPlexMono-BoldItalic";
    tFont[2] = "Roboto-Thin";
    tFont[3] = "RobotoCondensed-Bold";
    tFont[4] = "IBMPlexMono-ExtraLightItalic";
    tFont[5] = "Cairo-Black";
  } else {
    tFont[0] = loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[1] = loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
    tFont[2] = loadFont("../assets/Roboto-Thin.ttf");
    tFont[3] = loadFont("../assets/RobotoCondensed-Bold.ttf");
    tFont[4] = loadFont("../assets/IBMPlexMono-ExtraLightItalic.ttf");
    tFont[5] = loadFont("../assets/Cairo-Black.ttf");
  }

  fontFactor[0] = 0.8;
  fontHeightFactor[0] = 0.70;

  fontFactor[1] = 0.8;
  fontHeightFactor[1] = 0.72;

  fontFactor[2] = 0.9;
  fontHeightFactor[2] = 0.8;

  fontFactor[3] = 0.8;
  fontHeightFactor[3] = 0.70;

  fontFactor[4] = 0.8;
  fontHeightFactor[4] = 0.70;

  fontFactor[5] = 0.8;
  fontHeightFactor[5] = 0.70;
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);

  thisDensity = pixelDensity();
  cwidth = width;
  cheight = height;

  colorSet[0] = color('#f24b78');
  colorSet[1] = color('#0b8ad9');
  colorSet[2] = color('#0a5926');
  colorSet[3] = color('#f2a20c');
  colorSet[4] = color('#f21f0c');

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "THE\nMEANING\nOF ALL\nMOTIONS\nSHAPES &\nSOUNDS";
  accentColor = '#00ff00';
  foreColor = '#ffffff';
  bkgdColor = '#000000';

  fontSel = 0;
  textScale = 1;
  vesselSW = 2;
  crestType = 1;
  stageAdirect = 2;
  stageAstrength = 3;
  stageBdirect = 2;
  stageBstrength = 3;
  stageAlength = 25;
  stageBlength = 50;
  charDelay = -2;
  lineDelay = -3;

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
  isClearing = false;
  lastRemoveTime = 0;

  if (width < 500) {
    wWindow = width / 2;
  } else {
    wWindow = width / 3;
  }

  refigureStages();
  createAnimation();
  runCoreReset();
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.text !== undefined) inpText = settings.text;
  if (settings.fontSel !== undefined) fontSel = settings.fontSel;
  if (settings.textScale !== undefined) textScale = settings.textScale;
  if (settings.vesselSW !== undefined) vesselSW = settings.vesselSW;
  if (settings.crestType !== undefined) crestType = settings.crestType;
  if (settings.stageAdirect !== undefined) stageAdirect = settings.stageAdirect;
  if (settings.stageAstrength !== undefined) stageAstrength = settings.stageAstrength;
  if (settings.stageBdirect !== undefined) stageBdirect = settings.stageBdirect;
  if (settings.stageBstrength !== undefined) stageBstrength = settings.stageBstrength;
  if (settings.stageAlength !== undefined) stageAlength = settings.stageAlength;
  if (settings.stageBlength !== undefined) stageBlength = settings.stageBlength;
  if (settings.charDelay !== undefined) charDelay = settings.charDelay;
  if (settings.lineDelay !== undefined) lineDelay = settings.lineDelay;

  if (settings.foreColor !== undefined) foreColor = settings.foreColor;
  if (settings.bkgdColor !== undefined) bkgdColor = settings.bkgdColor;

  refigureStages();
  createAnimation();
  runCoreReset();
}

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
    setText();
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.fontSel !== undefined) { fontSel = Number(data.fontSel); createAnimation(); }
  if (data.textScale !== undefined) { textScale = Number(data.textScale); createAnimation(); }
  if (data.vesselSW !== undefined) { vesselSW = Number(data.vesselSW); }
  if (data.crestType !== undefined) { crestType = Number(data.crestType); }
  if (data.stageAdirect !== undefined) stageAdirect = Number(data.stageAdirect);
  if (data.stageAstrength !== undefined) stageAstrength = Number(data.stageAstrength);
  if (data.stageBdirect !== undefined) stageBdirect = Number(data.stageBdirect);
  if (data.stageBstrength !== undefined) stageBstrength = Number(data.stageBstrength);

  if (data.stageAlength !== undefined) { stageAlength = Number(data.stageAlength); refigureStages(); createAnimation(); runCoreReset(); }
  if (data.stageBlength !== undefined) { stageBlength = Number(data.stageBlength); refigureStages(); createAnimation(); runCoreReset(); }

  if (data.charDelay !== undefined) { charDelay = Number(data.charDelay); createAnimation(); runCoreReset(); }
  if (data.lineDelay !== undefined) { lineDelay = Number(data.lineDelay); createAnimation(); runCoreReset(); }

  if (data.foreColor !== undefined) foreColor = String(data.foreColor);
  if (data.bkgdColor !== undefined) bkgdColor = String(data.bkgdColor);

  // Handle save request
  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        text: inpText,
        fontSel: fontSel,
        textScale: textScale,
        vesselSW: vesselSW,
        crestType: crestType,
        stageAdirect: stageAdirect,
        stageAstrength: stageAstrength,
        stageBdirect: stageBdirect,
        stageBstrength: stageBstrength,
        stageAlength: stageAlength,
        stageBlength: stageBlength,
        charDelay: charDelay,
        lineDelay: lineDelay,
        foreColor: foreColor.toString(),
        bkgdColor: bkgdColor.toString()
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

  drawMain();

  cTicker++;

  if (cTicker > stageB) {
    runCoreReset();
  } else {
    runBorderAnim();
  }



  if (typeof captureFrame === 'function') captureFrame();
}

function drawMain() {
  push();
  translate(width / 2, height / 2);

  if (crestType == 1) {
    stroke(foreColor);
    strokeWeight(vesselSW);
    noFill();
    rect(0, 0, boxW, boxH, boxRTop, boxRTop, boxRBot, boxRBot);
  } else if (crestType == 2) {
    noStroke();
    fill(foreColor);
    rect(0, 0, boxW, boxH, boxRTop, boxRTop, boxRBot, boxRBot);
  }

  translate(0, -centerY / 2);
  translate(-(leftX + rightX) / 2, 0);

  centerY = 0;
  leftX = 0;
  rightX = 0;
  if (coreBase) coreBase.run();
  pop();
}

function runBorderAnim() {
  if (cTicker < cTickerMeasure) {
    boxW = boxWorg;
    boxH = boxHorg;
    boxRTop = boxRTopOrg;
    boxRBot = boxRBotOrg;
  } else if (cTicker < stageA) {
    var tk0 = map(cTicker, cTickerMeasure, stageA - 1, 0, 1);
    boxW = map(stageAaccel(tk0), 0, 1, boxWorg, boxWtarget);
    boxH = map(stageAaccel(tk0), 0, 1, boxHorg, boxHtarget);
    boxRTop = map(stageAaccel(tk0), 0, 1, boxRTopOrg, boxRTopTarget);
    boxRBot = map(stageAaccel(tk0), 0, 1, boxRBotOrg, boxRBotTarget);

    boxRTop = constrain(boxRTop, 0, 2000);
    boxRBot = constrain(boxRBot, 0, 2000);
  } else {
    boxW = boxWtarget;
    boxH = boxHtarget;
    boxRTop = boxRTopTarget;
    boxRBot = boxRBotTarget;
  }
}

function runCoreReset() {
  cTicker = cTickerMeasure;

  boxWorg = boxWtarget;
  boxHorg = boxHtarget;
  boxRTopOrg = boxRTopTarget;
  boxRBotOrg = boxRBotTarget;

  boxWmeas = 0;
  peakY = 0;

  if (coreBase) coreBase.resetMain();

  boxWtarget = boxWmeas + pgTextSize * fontFactor[fontSel];
  boxHtarget = peakY + (inputText.length) * pgTextSize * fontFactor[fontSel];

  boxWtarget *= 2;
  boxHtarget += 2.5 * pgTextSize * fontFactor[fontSel];

  boxRTopTarget = random(boxWtarget / 2);
  boxRBotTarget = random(boxWtarget / 2);
}

function createAnimation() {
  findMaxSize();

  textFont(tFont[fontSel]);
  textSize(pgTextSize);

  cTickerMeasure = 0;
  boxWmeas = 0;
  peakY = 0;

  coreBase = null;
  coreBase = new Base();

  cTicker = cTickerMeasure;
  boxWtarget = boxWmeas + pgTextSize * fontFactor[fontSel];
  boxHtarget = peakY + (inputText.length) * pgTextSize * fontFactor[fontSel];

  boxWtarget *= 2;
  boxHtarget += 2.5 * pgTextSize * fontFactor[fontSel];

  boxW = boxWtarget;
  boxH = boxHtarget;
  boxWorg = boxW;
  boxHorg = boxH;
}

function windowResized() {
  if (width < 500) {
    wWindow = width / 2;
  } else {
    wWindow = width / 3;
  }
  resizeCanvas(windowWidth, windowHeight);
  createAnimation();
}
