// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "default": {
        "p.text": "ONE\nFINAL\nPERFECT\nFUTURE",
        "pgTextSize": 90,
        "groupCount": 7,
        "selFont": 0,
        "bkgdColor": "#000000",
        "foreColor": "#ffffff"
    },
    "compact": {
        "p.text": "THIS\nAND\nTHEN\nTHAT\nAND\nNOW\nTHIS",
        "pgTextSize": 60,
        "groupCount": 9,
        "selFont": 1,
        "bkgdColor": "#ffffff",
        "foreColor": "#000000"
    },
    "bold": {
        "p.text": "CHANGES\nchanges",
        "pgTextSize": 120,
        "groupCount": 5,
        "selFont": 2,
        "bkgdColor": "#ff0000",
        "foreColor": "#ffffff"
    }
};


// --- INLINED DEPENDENCY: js/animators.js ---
function sinEngine(aCount, aLength, Speed, slopeN) {
  var sinus = p.sin((p.frameCount*Speed + aCount*aLength));
  var sign = (sinus >= 0 ? 1: -1);
  var sinerSquare = sign * (1-p.pow(1-p.abs(sinus),slopeN));
  return sinerSquare;
}

function aSet(ticker, influ){          // takes a 0 - 1 and returns an eased 0 - 1
  var capTicker = ticker%1;
  var targetPoint = p.pow(capTicker,influ)/(p.pow(capTicker,influ) + p.pow(1-capTicker,influ));
  return targetPoint;
}

function aSet2(ticker, influ){  /// takes a 0 - 1 and returns an eased 0 - 1 then 1 to 0
  var nowTicker = ticker;

  var targetPoint = 0;
  if(nowTicker<=0.5){
    var thisTicker = p.map(nowTicker, 0, 0.5, 0, 1);
    targetPoint = p.pow(thisTicker,influ)/(p.pow(thisTicker,influ) + p.pow(1-thisTicker,influ));
  } else if(nowTicker<=1){
    var thisTicker = p.map(nowTicker, 0.5, 1, 1, 0);
    targetPoint = p.pow(thisTicker,influ)/(p.pow(thisTicker,influ) + p.pow(1-thisTicker,influ));
  }

  return targetPoint;
}

function aSet3(ticker, influ){          // takes a 0 - 1 and returns an eased 0 - 1 and then 1 – 2 and then 2 – 3, etc
  var culmTicker = p.floor(ticker/1);
  var capTicker = ticker%1;

  var targetPoint = culmTicker + p.pow(capTicker,influ)/(p.pow(capTicker,influ) + p.pow(1-capTicker,influ));

  return targetPoint;
}


// --- INLINED DEPENDENCY: js/kineticLetter.js ---
class KineticLetter {
  constructor(x_, p_, m_, n_){
    this.p = p_
    this.m = m_;
    this.n = n_;

    this.x0 = x_;
    this.y0 = 0;
    this.w = p.textWidth(keyArray[this.m].charAt(this.n));
    this.h = pgTextSize * 0.7;

    this.yA = 0;
    this.yAmax = (1 - this.n%2 * 2) * p.random(20, 140);
    this.xA = 0;
    this.xAmax;
    if(this.n == 0){
      this.xAmax = -p.random(40, 160);
      this.yAmax = 0;
    } else if(this.n == keyArray[this.m].length - 1){
      this.xAmax = p.random(40, 160);
      this.yAmax = 0;
    } else {
      this.xAmax = 0;
    }

    this.flicker = 255;

    this.xScale = 1;
    this.xScaleMax = p.random(1, 5);
    this.xScaleMaxB = p.random(0.5, 1.5);

    this.xShear = 0;
    this.xShearMax = p.random(-p.PI/3, p.PI/3);
    this.xShearMaxB = 0;

    var rs0 = p.random(100);
    if(rs0 < 100 * (1/keyArray[this.m].length)){
      this.xShearMaxB = p.random(-p.PI/4, p.PI/4);
    }

    this.ticker = -this.n * 3 - this.m * 3 - 0;

    this.anim01 = 30;          // INTRO
    this.anim12 = this.anim01 + 30;
    this.anim23 = this.anim12 + 30;

    this.xBudgeScale = 0;

    this.xBudgePre = 0;
    this.xBudgePost = 0;

    this.xTrack = 5;

    this.visible = false;

    this.influ = 8;
  }

  update(){
    if(this.ticker == 0){
      this.visible = true;
    }

    this.ticker ++;

    if(this.ticker < this.anim01){
      var tick0 = p.map(this.ticker, 0, this.anim01, 0.5, 1);
      var tick1 = aSet(tick0, this.influ);

      this.xA = p.map(tick1, 0.5, 1, this.xAmax, 0);
      this.yA = p.map(tick1, 0.5, 1, this.yAmax, 0);

      this.xScale = p.map(tick1, 0.5, 1, this.xScaleMax, 1);
      this.xShear = p.map(tick1, 0.5, 1, this.xShearMax, 0);
    } else if(this.ticker < this.anim12){
      var tick0 = p.map(this.ticker, this.anim01, this.anim12, 0, 1);
      var tick1 = aSet(tick0, this.influ);

      this.xScale = p.map(tick1, 0, 1, 1, this.xScaleMaxB);
      this.xBudgeScale = (this.xScale * this.w) - this.w;

      this.xShear = p.map(tick1, 0, 1, 0, this.xShearMaxB);
      if(this.xShear < 0){
        this.xBudgePost = -tan(this.xShear) * pgTextSize * 0.65;
      } else {
        this.xBudgePre = tan(this.xShear) * pgTextSize * 0.65;
      }
    } else {
      var tick0 = p.map(this.ticker, this.anim12, this.anim23, 0, 0.5);
      var tick1 = aSet(tick0, this.influ);

      this.yA = p.map(tick1, 0, 0.5, 0, -20);

      this.xScale = p.map(tick1, 0, 0.5, this.xScaleMaxB, 1);
      this.xBudgeScale = (this.xScale * this.w) - this.w;

      this.xShear = p.map(tick1, 0, 0.5, this.xShearMaxB, 0);
      if(this.xShear < 0){
        this.xBudgePost = -tan(this.xShear) * pgTextSize * 0.65;
      } else {
        this.xBudgePre = tan(this.xShear) * pgTextSize * 0.65;
      }
    }

    if(this.n < keyArray[this.m].length - 1){
      if (kineticGroups[this.p] && kineticGroups[this.p].kineticWords[this.m]) {
        kineticGroups[this.p].kineticWords[this.m].budgeCenter += (this.xBudgeScale + this.xBudgePost + this.xBudgePre);
      }
    }

    if(this.ticker > this.anim23-1){
      this.visible = false;

      if(this.m == keyArray.length - 1 &&
        this.n == keyArray[this.m].length - 1 &&
        this.p == groupCount - 1){
        resetAnim();
      }
    }
  }

  display(){
    p.translate(this.xBudgePre, 0);

    if(this.visible){
      p.push();
        p.translate(this.x0, this.y0);
        p.translate(this.xA, this.yA);
        p.shearX(this.xShear);
        p.scale(this.xScale, 1);
        p.noStroke();
        p.fill(foreColor);
        p.textFont(currentFont);
        p.textSize(pgTextSize);
        p.text(keyArray[this.m].charAt(this.n), 0, 0);
      p.pop();
    }
    p.translate(this.xBudgeScale, 0);
    p.translate(this.xBudgePost, 0);

    p.translate(this.xTrack, 0);
  }

}


// --- INLINED DEPENDENCY: js/kineticWord.js ---
class KineticWord {
  constructor(x_, y_, p_, m_){
    this.p = p_;
    this.m = m_;
    this.x0 = x_;
    this.y0 = y_;
    this.y1 = p.map(this.m, 0, keyArray.length-1, -newHeight/4, newHeight/4);
    this.yAnim = 0;
    
    this.kinetics = [];

    p.textSize(pgTextSize);
    p.textFont(currentFont);

    var thisTracking = pgTextSize * 0.15;
    var fullMainWidth = p.textWidth(keyArray[this.m]) - (keyArray[this.m].length - 1) * (thisTracking - 5);

    this.budgeCenter = 0;

    for(var n = 0; n < keyArray[this.m].length; n++){
      var tempMain0 = p.textWidth(keyArray[this.m].slice(0, n+1));
      var tempMain1 = p.textWidth(keyArray[this.m].charAt(n));

      var thisX = tempMain0 - tempMain1 - thisTracking * n - fullMainWidth/2;
      this.kinetics[n] = new KineticLetter(thisX, this.p, this.m, n);
    }

    this.influ = 10;
    this.ticker = -this.m * 1;
  }

  update(){
    this.ticker ++;

    if(this.ticker < 0){
      this.yAnim = this.y1;
    } else if(this.ticker < 60){
      var tick0 = p.map(this.ticker, 0, 60, 0, 1);
      var tick1 = aSet(tick0, this.influ);

      this.yAnim = p.map(tick1, 0, 1, this.y1, 0);
    } else {
      this.yAnim = 0;
    }
  }

  run(){
    p.push();
      p.translate(-this.budgeCenter/2, 0);
      p.translate(this.x0, this.y0);
      p.translate(0, this.yAnim);

      this.budgeCenter = 0;
      for(var n = 0; n < this.kinetics.length; n++){
        this.kinetics[n].update();
        this.kinetics[n].display();
      }
    p.pop();
  }
}


// --- INLINED DEPENDENCY: js/kineticGroup.js ---
class KineticGroup {
  constructor(x_, y_, p_){
    this.p = p_;
    this.x0 = x_;
    this.y0 = y_;
    this.xAnim = 0;

    this.kineticWords = [];
    for(var m = 0; m < keyArray.length; m++){
      this.kineticWords[m] = new KineticWord(0, m * lineHeight, this.p, m);
    }

    this.ticker = -this.p * 2;
    this.influ = 5;
  }

  update(){
    this.ticker ++;

    if(this.ticker < 45){
      this.xAnim = 0;
    } else if(this.ticker < 105){
      var tick0 = p.map(this.ticker, 45, 105, 0, 1);
      var tick1 = aSet(tick0, this.influ);

      this.xAnim = p.map(tick1, 0, 1, 0, horzSpacer);
    }
  }

  run(){
    p.push();
      p.translate(this.x0, this.y0);
      p.translate(this.xAnim, 0);
      for(var m = 0; m < keyArray.length; m++){
        this.kineticWords[m].update();
        this.kineticWords[m].run();
      }
    p.pop();
  }
}


// --- INLINED DEPENDENCY: js/update.js ---
function setText(){
  p.textSize(pgTextSize);
  p.textFont(currentFont);

  var enteredText = inpText || "";
  keyText = enteredText;
  keyArray = enteredText.match(/[^\r\n]+/g);

  if(keyArray == null){
    keyArray = "";
  }

  resetAnim();
}

function setFont(val){
  currentFont = tFont[val];
  setText();
}

function setForeColor(val){
  foreColor = p.color(val);
}

function setBkgdColor(val){
  bkgdColor = p.color(val);
}

function setFontSize(val){ 
  for(var p = 0; p < groupCount; p++){
    kineticGroups[p] = 0;
  }

  pgTextSize = int(val);
  lineHeight = pgTextSize * 0.8;

  setText();
}

function sizeSaveChange(val){
  saveSizeState = val;

  if(saveSizeState == 0){
    newHeight = heightHold;
    newWidth = widthHold;

    cXadjust = 0;
    cYadjust = 0;
  } else if(saveSizeState == 1){
    if(widthHold > heightHold * 9/16){
      newHeight = heightHold;
      newWidth = heightHold * 9/16;
  
      cXadjust = -(widthHold - newWidth)/2;
      cYadjust = 0;
    } else {
      newHeight = widthHold * 16/9;
      newWidth = widthHold;

      cXadjust = 0;
      cYadjust = -(heightHold - newHeight)/2;
    }
  } else if(saveSizeState == 2){
    if(widthHold > heightHold){
      newWidth = heightHold;
      newHeight = heightHold;

      cXadjust = -(widthHold - newWidth)/2;
      cYadjust = 0;
    } else if(heightHold >= widthHold){
      newHeight = widthHold;
      newWidth = widthHold;

      cXadjust = 0;
      cYadjust = -(heightHold - newHeight)/2;
    }
  }

  horzSpacer = newWidth/2;
  frameFade = 4;

  setText();
}



    // --- ORIGINAL SKETCH.JS CODE ---
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
  tFont[0] = p.loadFont("../assets/Inter-Medium.ttf");
  tFont[1] = p.loadFont("../assets/Inter-Black.ttf");
  tFont[2] = p.loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
  tFont[3] = p.loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
  tFont[4] = p.loadFont("../assets/SpaceMono-Regular.ttf");
  tFont[5] = p.loadFont("../assets/SpaceGrotesk-Bold.ttf");
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h);

  thisDensity = p.pixelDensity();
  widthHold = p.width;
  heightHold = p.height;

  reSetting();

  if(typeof signalReady === 'function') signalReady();
}

function reSetting() {
  pgTextSize = widthHold/11;
  lineHeight = pgTextSize * 0.8;

  inpText = "ONE\nFINAL\nPERFECT\nFUTURE";
  bkgdColor = p.color('#000000');
  foreColor = p.color('#FFFFFF');
  fadeColor = p.color('#FFFFFF');
  
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
  lastTextTime = p.millis();
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
    
    if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
    if (settings.foreColor !== undefined) foreColor = p.color(settings.foreColor);
    
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
        lastTextTime = p.millis();
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
    
    if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);
    if (data.foreColor !== undefined) foreColor = p.color(data.foreColor);

    // Handle p.save request
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
    if (p.millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = p.millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
      setText();
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = p.millis();
        setText();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = p.millis();
        setText();
        if (inpText === "") {
          isClearing = false;
        }
      }
    }
  }

  // --- CANVASES HIDING / EMPTY LOGIC ---
  if ((hideNoText && (!inpText || inpText.trim() === "")) || !inpText || inpText === "") {
    p.clear();
    if (typeof captureFrame === 'function') captureFrame();
    return;
  }

  p.background(bkgdColor);

  p.push();
    p.translate(widthHold/2, heightHold/2);
    p.translate(0, -fullHeight/2 + lineHeight);

    for(var p = 0; p < kineticGroups.length; p++){
      if (kineticGroups[p]) {
        kineticGroups[p].update();
        kineticGroups[p].run();
      }
    }
  p.pop();


  if (typeof captureFrame === 'function') captureFrame();
}

function resetAnim(){
  fullHeight = keyArray.length * lineHeight;

  for(var p = 0; p < groupCount; p++){
    kineticGroups[p] = new KineticGroup(-horzSpacer * ((groupCount-1)/2) + p * horzSpacer, 0, p);
  }
}

function windowResized(){
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  widthHold = p.width;
  heightHold = p.height;
  newHeight = heightHold;
  newWidth = widthHold;
  horzSpacer = newWidth/2;
  setText();
}


    // --- BIND LIFECYCLE HOOKS TO INSTANCE ---
    if (typeof preload === 'function') p.preload = preload;
    if (typeof setup === 'function') p.setup = setup;
    if (typeof draw === 'function') p.draw = draw;
    if (typeof windowResized === 'function') p.windowResized = windowResized;
    if (typeof keyPressed === 'function') p.keyPressed = keyPressed;
    if (typeof keyReleased === 'function') p.keyReleased = keyReleased;
    if (typeof keyTyped === 'function') p.keyTyped = keyTyped;
    if (typeof mousePressed === 'function') p.mousePressed = mousePressed;
    if (typeof mouseReleased === 'function') p.mouseReleased = mouseReleased;
    if (typeof mouseDragged === 'function') p.mouseDragged = mouseDragged;

    // --- CABLES GL DATA BRIDGE ---
    p.onDataChange = (data) => {
        if (data && typeof updateSettings === 'function') {
            updateSettings(data);
        }
    };
    
    // Fallback resize hook
    p.onResize = (w, h) => {
        if (p.resizeCanvas) p.resizeCanvas(w, h);
    };
}
