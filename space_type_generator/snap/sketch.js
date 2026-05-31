var tFont = [];
var pgTextSize = 90;
var lineHeight = pgTextSize * 0.8;
var bkgdColor, foreColor, fadeColor;

var keyText;
var keyArray = [];
var inpText = "ONE\nFINAL\nPERFECT\nFUTURE";

var groupCount = 7;
var kineticGroups = [];

var budgeCenter = [];
var fullHeight = 0;

let cwidth, cheight;
let cXadjust, cYadjust;
let widthHold, heightHold;
let cScale = 1;

let currentFont;
let saveSizeState = 0;
let horzSpacer;
var newWidth;
var newHeight;

var frameFade = 3;
var thisDensity;
var selFont = 0;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;


function preload(){
  tFont[0] = loadFont("../assets/Inter-Medium.ttf");
  tFont[1] = loadFont("../assets/Inter-Black.ttf");
  tFont[2] = loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
  tFont[3] = loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
  tFont[4] = loadFont("../assets/SpaceMono-Regular.ttf");
  tFont[5] = loadFont("../assets/SpaceGrotesk-Bold.ttf");
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);

  thisDensity = pixelDensity();
  widthHold = width;
  heightHold = height;

  reSetting();

  if(typeof signalReady === 'function') signalReady();
}

function reSetting() {
  pgTextSize = widthHold/11;
  lineHeight = pgTextSize * 0.8;

  inpText = "ONE\nFINAL\nPERFECT\nFUTURE";
  bkgdColor = color('#000000');
  foreColor = color('#FFFFFF');
  fadeColor = color('#FFFFFF');
  
  selFont = 0;
  currentFont = tFont[selFont];
  newWidth = widthHold;
  newHeight = heightHold;
  horzSpacer = widthHold/2;
  cXadjust = 0;
  cYadjust = 0;
  groupCount = 7;
  frameFade = 3;

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
    
    if (settings.text !== undefined) inpText = settings.text;
    if (settings.pgTextSize !== undefined) { pgTextSize = settings.pgTextSize; lineHeight = pgTextSize * 0.8; }
    if (settings.groupCount !== undefined) groupCount = settings.groupCount;
    if (settings.selFont !== undefined) { selFont = settings.selFont; currentFont = tFont[selFont]; }
    
    if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
    if (settings.foreColor !== undefined) foreColor = color(settings.foreColor);
    
    setText();
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

    if (data.pgTextSize !== undefined) { pgTextSize = Number(data.pgTextSize); lineHeight = pgTextSize * 0.8; setText(); }
    if (data.groupCount !== undefined) { groupCount = Number(data.groupCount); resetAnim(); }
    if (data.selFont !== undefined) { selFont = Number(data.selFont); currentFont = tFont[selFont]; setText(); }
    
    if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
    if (data.foreColor !== undefined) foreColor = color(data.foreColor);

    // Handle save request
    if (data.action === "savePreset") {
        const payload = {
            type: "savePreset",
            iframeSrc: window.location.href,
            name: data.name || "custom_preset",
            settings: {
                text: inpText,
                pgTextSize: pgTextSize,
                groupCount: groupCount,
                selFont: selFont,
                bkgdColor: bkgdColor.toString(),
                foreColor: foreColor.toString()
            }
        };
        pubChannel.postMessage(payload);
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

  push();
    translate(widthHold/2, heightHold/2);
    translate(0, -fullHeight/2 + lineHeight);

    for(var p = 0; p < kineticGroups.length; p++){
      if (kineticGroups[p]) {
        kineticGroups[p].update();
        kineticGroups[p].run();
      }
    }
  pop();


  if (typeof captureFrame === 'function') captureFrame();
}

function resetAnim(){
  fullHeight = keyArray.length * lineHeight;

  for(var p = 0; p < groupCount; p++){
    kineticGroups[p] = new KineticGroup(-horzSpacer * ((groupCount-1)/2) + p * horzSpacer, 0, p);
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  widthHold = width;
  heightHold = height;
  newHeight = heightHold;
  newWidth = widthHold;
  horzSpacer = newWidth/2;
  setText();
}
