// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "default": {
        "p.text": "GO\nNOW\nSTART\nOVER",
        "selFont": 4,
        "scaler": 0.75,
        "resLon": 200,
        "minFlux": -10,
        "maxFlux": 25,
        "randomFlux": 4,
        "taperOn": true,
        "baseSW": 2,
        "minSW": 1,
        "maxSW": 8,
        "stageAdirect": 1,
        "stageAstrength": 3,
        "stageAlength": 60,
        "stageBdirect": 0,
        "stageBstrength": 3,
        "stageBlength": 60,
        "pauseLength": 30,
        "delayMax": -30,
        "colorType": 0,
        "bkgdColor": "#000000",
        "foreColor": "#ffffff"
    },
    "set0": {
        "taperOn": true,
        "baseSW": 2,
        "minSW": 1,
        "maxSW": 8,
        "minFlux": -10,
        "maxFlux": 25,
        "randomFlux": 4,
        "stageAdirect": 1,
        "stageAstrength": 3,
        "stageAlength": 60,
        "stageBdirect": 0,
        "stageBstrength": 3,
        "stageBlength": 60,
        "pauseLength": 30,
        "delayMax": -30
    },
    "set1": {
        "taperOn": false,
        "minFlux": 50,
        "maxFlux": -50,
        "randomFlux": 1,
        "stageAdirect": 1,
        "stageAstrength": 3,
        "stageAlength": 30,
        "stageBdirect": 0,
        "stageBstrength": 3,
        "stageBlength": 30,
        "pauseLength": 30,
        "delayMax": -15
    },
    "set2": {
        "taperOn": false,
        "minFlux": 0,
        "maxFlux": 100,
        "randomFlux": 3,
        "stageAstrength": 3,
        "stageAdirect": 0,
        "stageAlength": 30,
        "stageBstrength": 3,
        "stageBdirect": 1,
        "stageBlength": 30,
        "pauseLength": 0,
        "delayMax": -45
    },
    "set3": {
        "taperOn": true,
        "baseSW": 2,
        "minSW": 0.5,
        "maxSW": 8,
        "minFlux": 75,
        "maxFlux": 0,
        "randomFlux": 1.5,
        "stageAstrength": 2,
        "stageAdirect": 1,
        "stageAlength": 45,
        "stageBstrength": 3,
        "stageBdirect": 0,
        "stageBlength": 45,
        "pauseLength": 0,
        "delayMax": -30
    },
    "set4": {
        "taperOn": false,
        "minFlux": 10,
        "maxFlux": 150,
        "randomFlux": 1.5,
        "stageAdirect": 1,
        "stageAstrength": 3,
        "stageAlength": 45,
        "stageBdirect": 0,
        "stageBstrength": 3,
        "stageBlength": 45,
        "pauseLength": 0,
        "delayMax": -45
    },
    "set5": {
        "taperOn": true,
        "baseSW": 2,
        "minSW": 10,
        "maxSW": 20,
        "minFlux": -150,
        "maxFlux": 75,
        "randomFlux": 1,
        "stageAdirect": 2,
        "stageAstrength": 2,
        "stageAlength": 25,
        "stageBdirect": 2,
        "stageBstrength": 2,
        "stageBlength": 25,
        "pauseLength": 25,
        "delayMax": -45
    },
    "set6": {
        "taperOn": true,
        "baseSW": 2,
        "minSW": 1,
        "maxSW": 10,
        "minFlux": 75,
        "maxFlux": -75,
        "randomFlux": 2.0,
        "stageAdirect": 2,
        "stageAstrength": 2,
        "stageAlength": 20,
        "stageBdirect": 2,
        "stageBstrength": 2,
        "stageBlength": 20,
        "pauseLength": 25,
        "delayMax": -75
    },
    "set7": {
        "taperOn": false,
        "baseSW": 2,
        "minFlux": 0,
        "maxFlux": 150,
        "randomFlux": 8.0,
        "stageAdirect": 1,
        "stageAstrength": 4,
        "stageAlength": 40,
        "stageBdirect": 0,
        "stageBstrength": 4,
        "stageBlength": 40,
        "pauseLength": 25,
        "delayMax": -10
    }
};


// --- INLINED DEPENDENCY: js/animators.js ---
function stageAaccel(val){
  if(stageAdirect == 0){
    if(stageAstrength == 0){ return easeInSine(val); }
    else if(stageAstrength == 1){ return easeInCubic(val); }
    else if(stageAstrength == 2){ return easeInCirc(val); }
    else if(stageAstrength == 3){ return easeInExpo(val); }
    else if(stageAstrength == 4){ return easeInBack(val); }
    else if(stageAstrength == 5){ return easeInBounce(val); }
    else if(stageAstrength == 6){ return easeInElastic(val); }
  } else if(stageAdirect == 1){
    if(stageAstrength == 0){ return easeOutSine(val); }
    else if(stageAstrength == 1){ return easeOutCubic(val); }
    else if(stageAstrength == 2){ return easeOutCirc(val); }
    else if(stageAstrength == 3){ return easeOutExpo(val); }
    else if(stageAstrength == 4){ return easeOutBack(val); }
    else if(stageAstrength == 5){ return easeOutBounce(val); }
    else if(stageAstrength == 6){ return easeOutElastic(val); }
  } else if(stageAdirect == 2){
    if(stageAstrength == 0){ return easeInOutSine(val); }
    else if(stageAstrength == 1){ return easeInOutCubic(val); }
    else if(stageAstrength == 2){ return easeInOutCirc(val); }
    else if(stageAstrength == 3){ return easeInOutExpo(val); }
    else if(stageAstrength == 4){ return easeInOutBack(val); }
    else if(stageAstrength == 5){ return easeInOutBounce(val); }
    else if(stageAstrength == 6){ return easeInOutElastic(val); }
  }
}

function stageBaccel(val){
  if(stageBdirect == 0){
    if(stageBstrength == 0){ return easeInSine(val); }
    else if(stageBstrength == 1){ return easeInCubic(val); }
    else if(stageBstrength == 2){ return easeInCirc(val); }
    else if(stageBstrength == 3){ return easeInExpo(val); }
    else if(stageBstrength == 4){ return easeInBack(val); }
    else if(stageBstrength == 5){ return easeInBounce(val); }
    else if(stageBstrength == 6){ return easeInElastic(val); }
  } else if(stageBdirect == 1){
    if(stageBstrength == 0){ return easeOutSine(val); }
    else if(stageBstrength == 1){ return easeOutCubic(val); }
    else if(stageBstrength == 2){ return easeOutCirc(val); }
    else if(stageBstrength == 3){ return easeOutExpo(val); }
    else if(stageBstrength == 4){ return easeOutBack(val); }
    else if(stageBstrength == 5){ return easeOutBounce(val); }
    else if(stageBstrength == 6){ return easeOutElastic(val); }
  } else if(stageBdirect == 2){
    if(stageBstrength == 0){ return easeInOutSine(val); }
    else if(stageBstrength == 1){ return easeInOutCubic(val); }
    else if(stageBstrength == 2){ return easeInOutCirc(val); }
    else if(stageBstrength == 3){ return easeInOutExpo(val); }
    else if(stageBstrength == 4){ return easeInOutBack(val); }
    else if(stageBstrength == 5){ return easeInOutBounce(val); }
    else if(stageBstrength == 6){ return easeInOutElastic(val); }
  }
}

function easeInSine(x) {
  return 1 - Math.cos((x * Math.PI) / 2);
}

function easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
}

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function easeInCubic(x) {
  return x * x * x;
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInCirc(x){
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

function easeOutCirc(x){
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}

function easeInOutCirc(x) {
  return x < 0.5
  ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
  : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

function easeInExpo(x) {
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeInOutExpo(x) {
  return x === 0
  ? 0
  : x === 1
  ? 1
  : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
  : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

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

function easeInBounce(x) {
  return 1 - easeOutBounce(1 - x);
}

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
  return x === 0
    ? 0
    : x === 1
    ? 1
    : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

function easeOutElastic(x) {
  const c4 = (2 * Math.PI) / 3;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeInOutElastic(x) {
  const c5 = (2 * Math.PI) / 4.5;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

function easeInQuad(x) {
  return x * x;
}

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

function easeInOutQuad(x) {
  return x < 0.5
    ? 2 * x * x
    : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function easeOutQuint(x){
  return 1 - Math.pow(1 - x, 5);
}

function easeInQuint(x) {
  return x * x * x * x * x;
}

function easeInOutQuint(x) {
  return x < 0.5 
    ? 16 * x * x * x * x * x
    : 1 - Math.pow(-2 * x + 2, 5) / 2;
}


// --- INLINED DEPENDENCY: js/class_spoke.js ---
class Spoke {
  constructor(p0, p1, ang, index){
    this.p0 = p0;
    this.p1 = p1;
    this.ang = ang;
    this.index = index;

    this.a0 = createVector(this.p0.x, this.p0.y);
    this.a1 = createVector(this.p1.x, this.p1.y);

    this.scrubOffset0 = 0;
    this.scrubOffset1 = 0;

    // DELAY
    // RANDOM MIN, MAX
    this.ranMin = 0;
    this.ranMax = 0;
    this.reDistance();

    // STROKE
    this.sw = 1;
    this.reStroke();

    // COLOR
    this.aColor = null;
    this.targetColor = null;
    this.startColor = null;
    this.reColor();
    
    this.ticker0 = 0;
    this.ticker1 = 0;
    this.t0 = null;
    this.t1 = null;
    this.reset();
  }

  run(){
    this.update();
    this.display();
  }

  update(){
    var frontTicker, backTicker;
    if(scrubOn){
      frontTicker = scrubVal + this.scrubOffset0;
      backTicker = scrubVal + this.scrubOffset1;
    } else {
      frontTicker = this.ticker0;
      backTicker = this.ticker1;
    }

    if(frontTicker < anim0){
      this.a0 = this.p0;
      this.aColor = this.startColor;

    } else if(frontTicker < anim1){
      var tk0 = p.map(frontTicker, anim0, anim1, 0, 1);

      this.a0 = p5.Vector.lerp(this.p0, this.t0, stageAaccel(tk0));
      this.aColor = p.lerpColor(this.startColor, this.targetColor, stageAaccel(tk0));
    } else if(frontTicker < anim2){
      var tk0 = p.map(frontTicker, anim1, anim2, 0, 1);

      this.a0 = p5.Vector.lerp(this.t0, this.p0, stageBaccel(tk0));
      this.aColor = p.lerpColor(this.targetColor, this.startColor, stageBaccel(tk0));

    } else {
      this.a0 = this.p0;
      this.aColor = this.startColor;
    }
    
    if(backTicker < anim0){
      this.a1 = this.p1;

    } else if(backTicker < anim1){
      var tk0 = p.map(backTicker, anim0, anim1, 0, 1);

      this.a1 = p5.Vector.lerp(this.p1, this.t1, stageAaccel(tk0));

    } else if(backTicker < anim2){
      var tk0 = p.map(backTicker, anim1, anim2, 0, 1);

      this.a1 = p5.Vector.lerp(this.t1, this.p1, stageBaccel(tk0));

    } else {
      this.a1 = this.p1;
    }

    if(!scrubOn){
      this.ticker0 ++;
      this.ticker1 ++;
    }
  }

  display(){
    p.noFill();
    p.stroke(this.aColor);
    p.strokeWeight(this.sw);
    p.line(this.a0.x, this.a0.y, this.a1.x, this.a1.y);
  }

  reset(){
    this.ticker0 = p.map(p.dist(c.x, c.y, this.p0.x, this.p0.y), 0, radMax, 0, delayMax);
    this.ticker1 = p.map(p.dist(c.x, c.y, this.p1.x, this.p1.y), 0, radMax, 0, delayMax);

    this.scrubOffset0 = p.map(p.dist(c.x, c.y, this.p0.x, this.p0.y), 0, radMax, 0, delayMax);
    this.scrubOffset1 = p.map(p.dist(c.x, c.y, this.p1.x, this.p1.y), 0, radMax, 0, delayMax);

    var ranDist = p.random(this.ranMin, this.ranMax);
    this.t0 = createVector(this.p0.x + p.cos(this.ang) * ranDist, this.p0.y + p.sin(this.ang) * ranDist);
    this.t1 = createVector(this.p1.x + p.cos(this.ang) * ranDist, this.p1.y + p.sin(this.ang) * ranDist);

    if(this.ang < p.PI/2){
      this.t0.x = p.constrain(this.t0.x, c.x, this.p0.x + p.cos(this.ang) * 10000);
      this.t0.y = p.constrain(this.t0.y, c.y, this.p0.y + p.sin(this.ang) * 10000);
  
      this.t1.x = p.constrain(this.t1.x, c.x, this.p1.x + p.cos(this.ang) * 10000);
      this.t1.y = p.constrain(this.t1.y, c.y, this.p1.y + p.sin(this.ang) * 10000);
    } else if(this.ang < p.PI){
      this.t0.x = p.constrain(this.t0.x, this.p0.x + p.cos(this.ang) * 10000, c.x);
      this.t0.y = p.constrain(this.t0.y, c.y, this.p0.y + p.sin(this.ang) * 10000);
  
      this.t1.x = p.constrain(this.t1.x, this.p1.x + p.cos(this.ang) * 10000, c.x);
      this.t1.y = p.constrain(this.t1.y, c.y, this.p1.y + p.sin(this.ang) * 10000);
    } else if(this.ang < p.PI * 3/2){
      this.t0.x = p.constrain(this.t0.x, this.p0.x + p.cos(this.ang) * 10000, c.x);
      this.t0.y = p.constrain(this.t0.y, this.p0.y + p.sin(this.ang) * 10000, c.y);
  
      this.t1.x = p.constrain(this.t1.x, this.p1.x + p.cos(this.ang) * 10000, c.x);
      this.t1.y = p.constrain(this.t1.y, this.p1.y + p.sin(this.ang) * 10000, c.y);
    } else {
      this.t0.x = p.constrain(this.t0.x, c.x, this.p0.x + p.cos(this.ang) * 10000);
      this.t0.y = p.constrain(this.t0.y, this.p0.y + p.sin(this.ang) * 10000, c.y);
  
      this.t1.x = p.constrain(this.t1.x, c.x, this.p1.x + p.cos(this.ang) * 10000);
      this.t1.y = p.constrain(this.t1.y, this.p1.y + p.sin(this.ang) * 10000, c.y);
    } 
  }

  resetFull(){
    this.reDistance();
    this.reStroke();
    this.reColor();
  }

  reStroke(){
    this.sw = baseSW;
    if(taperOn){
      var avgX = (this.p0.x + this.p1.x)/2;
      var avgY = (this.p0.y + this.p1.y)/2;
      var tk1 = p.map(p.dist(avgX, avgY, c.x, c.y), 0, radMax, 0, 1);
      this.sw = p.map(easeInSine(tk1), 0, 1, minSW, maxSW);

      if(tk1 > 1){
        this.sw = maxSW;
      }
    }

    this.sw *= p.width/1400;

    this.reset();
  }

  reDistance(){
    var dist0 = p.dist(this.p0.x, this.p0.y, c.x, c.y);
    var dist1 = p.dist(this.p1.x, this.p1.y, c.x, c.y);

    var distAve = (dist0 + dist1)/2;
    var tk0 = p.map(distAve, 0, radMax, 0, p.PI);
    this.ranMin = p.map(p.cos(tk0), 1, -1, minFlux, maxFlux);
    this.ranMax = this.ranMin * randomFlux;

    this.reset();
  }

  reColor(){
    this.aColor = foreColor;
    this.startColor = foreColor;
    if(colorType == 0){
      this.targetColor = foreColor;
    } else if(colorType == 1){
      this.targetColor = colorSet[int(p.random(3))];
    } else if(colorType == 2){
      this.targetColor = colorSet[int(p.random(5))];
    }
  }
}


// --- INLINED DEPENDENCY: js/textures.js ---
function drawText(p){   // straight p.text
  var w = p.width;
  var h = p.height;
  pg[p] = p.createGraphics(w, h);
  pg[p].background(0);
  pg[p].noStroke();
  pg[p].fill(255);
  pg[p].textFont(tFont[selFont]);
  pg[p].textSize(pgTextSize);
  pg[p].textAlign(p.CENTER);
  pg[p].push();
    pg[p].translate(w/2, h/2);
    pg[p].translate(0, -(inputText.length - 1) * pgTextSize * tFontFactor[selFont]/2);
    for(var m = 0; m < inputText.length; m++){
      pg[p].push();
        pg[p].translate(0, m * pgTextSize * tFontFactor[selFont]);
        pg[p].text(inputText[m], 0, pgTextSize * tFontFactor[selFont]/2);
      pg[p].pop();
    }
  pg[p].pop();
}


// --- INLINED DEPENDENCY: js/update.js ---
function setText(){
  var enteredText = inpText || "";
  
  inputText = "";
  inputText = enteredText.match(/[^\r\n]+/g);

  if(!inputText || enteredText == ""){
    inputText = [];
    inputText[0] = " ";
  }

  coreCount = inputText.length;

  findMaxSize();

  drawText(0);

  makeSpokes();
}

function findMaxSize(){
  var testerSize = 100;
  p.textSize(testerSize);
  p.textFont(tFont[selFont]);
  
  ///////// FIND THE LONGEST LINE
  var longestLine = 0;
  var measurer = 0;

  for(var m = 0; m < inputText.length; m++){
    var tapeMeasurer = p.textWidth(inputText[m]);

    if(tapeMeasurer > measurer){
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  ///////// FIND THE SIZE THAT FILLS TO THE MAX WIDTH
  var widthTest = wWindow;

  let sizeHolder = 2;
  p.textSize(sizeHolder);
  let holdW = 0;

  while(holdW < widthTest){
    p.textSize(sizeHolder);
    holdW = p.textWidth(inputText[longestLine]);

    sizeHolder += 2;
  }
  pgTextSize = sizeHolder;

  ///////// MAKE SURE THE HEIGHT DOESN'T BREAK THE HEIGHT
  var heightTest = (p.height - 100) - (inputText.length - 1) * leading;
  let holdH = inputText.length * sizeHolder * tFontFactor[selFont];
  while(holdH > heightTest){
    holdH = inputText.length * sizeHolder * tFontFactor[selFont];
    sizeHolder -= 2;
  }
  pgTextSize = sizeHolder;
}

function setFont(val){
  selFont = val;
  setText();
}

function setColorType(val){
  colorType = val;

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reColor();
  }
}

function setScaler(val){
  scaler = p.map(val, 0, 100, 0.1, 1);
  wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax);
  setText();
}

function setMinFlux(val){
  minFlux = p.map(val, 0, 100, -150, 150);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reDistance();
  }
}

function setMaxFlux(val){
  maxFlux = p.map(val, 0, 100, -150, 150);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reDistance();
  }
}

function setRandomFlux(val){
  randomFlux = p.map(val, 0, 100, 1, 20);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reDistance();
  }
}

function setStageAdirect(val){
  stageAdirect = val;
}

function setStageAstrength(val){
  stageAstrength = val;
}

function setStageAlength(val){
  stageAlength = p.round(p.map(val, 0, 100, 10, 200));
  setAnimStages();
}

function setStageBdirect(val){
  stageBdirect = val;
}

function setStageBstrength(val){
  stageBstrength = val;
}

function setStageBlength(val){
  stageBlength = p.round(p.map(val, 0, 100, 10, 200));
  setAnimStages();
}

function setPauseLength(val){
  pauseLength = p.round(p.map(val, 0, 100, 1, 100));
  setAnimStages();
}

function setDelay(val){
  delayMax = p.map(val, 0, 100, -1, -100);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].resetFull();
  }
}

function setForeColor(val){
  foreColor = p.color(val);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reColor();
  }
}
function setBkgdColor(val){ bkgdColor = p.color(val); }

function setColorSet(index, val){
  colorSet[index] = p.color(val);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reColor();
  }
}

function setAnimStages(){
  anim0 = 0;
  anim1 = anim0 + stageAlength;
  anim2 = anim1 + stageBlength;
  anim3 = anim2 + pauseLength;

  scrubFull = anim3 - delayMax - 1;
}

function setResLon(val){
  resLon = p.round(p.map(val, 0, 100, 50, 400));

  ang = p.TWO_PI/resLon;
  makeSpokes();
}

function setTaperOn(){
  taperOn = !taperOn;

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setBaseSW(val){
  baseSW = p.map(val, 0, 100, 0.1, 20);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setMinSW(val){
  minSW = p.map(val, 0, 100, 0.1, 30);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setMaxSW(val){
  maxSW = p.map(val, 0, 100, 0.1, 30);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setScrubOn(){
  scrubOn = !scrubOn;
}

function setScrubVal(val){
  scrubVal = p.map(val, 0, 100, 0, scrubFull);
}

function generateRandomPalette(){
  var rs0 = p.random(80);
  var holdCol = [];

  if(rs0 < 10){
    holdCol[0] = ('#2450A6');
    holdCol[1] = ('#bf9969');
    holdCol[2] = ('#88c1f2');
    holdCol[3] = ('#5892d9');
    holdCol[4] = ('#f2d6b3');
  } else if(rs0 < 20){
    holdCol[0] = ('#f20530');
    holdCol[1] = ('#0367a6');
    holdCol[2] = ('#038c65');
    holdCol[3] = ('#f29f05');
    holdCol[4] = ('#f20505');
  } else if(rs0 < 30){
    holdCol[0] = ('#f2d22e');
    holdCol[1] = ('#f252aa');
    holdCol[2] = ('#43bdd9');
    holdCol[3] = ('#f294c0');
    holdCol[4] = ('#8c6a03');
  } else if(rs0 < 40){
    holdCol[0] = ('#4f2859');
    holdCol[1] = ('#4ed9cb');
    holdCol[2] = ('#d93814');
    holdCol[3] = ('#d9cd30');
    holdCol[4] = ('#37a6a6');
  } else if(rs0 < 50){
    holdCol[0] = ('#1c2840');
    holdCol[1] = ('#f2f1f0');
    holdCol[2] = ('#797f8c');
    holdCol[3] = ('#bfbfbf');
    holdCol[4] = ('#3c4659');
  } else if(rs0 < 60){
    holdCol[0] = ('#f2359d');
    holdCol[1] = ('#4ab8d9');
    holdCol[2] = ('#5ea65b');
    holdCol[3] = ('#f2d43d');
    holdCol[4] = ('#ffffff');
  } else if(rs0 < 70){
    holdCol[0] = ('#95acbf');
    holdCol[1] = ('#f2a663');
    holdCol[2] = ('#d92d07');
    holdCol[3] = ('#400101');
    holdCol[4] = ('#f2f2f2');
  } else if(rs0 < 80){
    holdCol[0] = ('#f252ba');
    holdCol[1] = ('#3b42d9');
    holdCol[2] = ('#4bb2f2');
    holdCol[3] = ('#f2e529');
    holdCol[4] = ('#f26d3d');
  }

  for(var m = 0; m < 5; m++){
    colorSet[m] = p.color(holdCol[m]);
  }
  for(var m = 0; m < spokes.length; m++){
    spokes[m].reColor();
  }
}

function setRanRunOn(){
  ranRunOn = !ranRunOn;
}

function setAllSlidersOn(){
  allSlidersOn = !allSlidersOn;
}

function runRan(){
  var rs0 = p.random(80);

  if(rs0 < 10){
    taperOn = true;
    baseSW = 2;
    minSW = 1;
    maxSW = 8;

    minFlux = -10;
    maxFlux = 25;
    randomFlux = 4;

    stageAdirect = 1;
    stageAstrength = 3;
    stageAlength = 60;

    stageBdirect = 0;
    stageBstrength = 3;
    stageBlength = 60;
    pauseLength = 30;
    delayMax = -30;
  } else if(rs0 < 20){
    taperOn = false;

    minFlux = 50;
    maxFlux = -50;
    randomFlux = 1;

    stageAdirect = 1;
    stageAstrength = 3;
    stageAlength = 30;

    stageBdirect = 0;
    stageBstrength = 3;
    stageBlength = 30;
    pauseLength = 30;
    delayMax = -15;
  } else if(rs0 < 30){
    taperOn = false;

    minFlux = 0;
    maxFlux = 100;
    randomFlux = 3;

    stageAstrength = 3;
    stageAdirect = 0;
    stageAlength = 30;

    stageBstrength = 3;
    stageBdirect = 1;
    stageBlength = 30;
    pauseLength = 0;
    delayMax = -45;
  } else if(rs0 < 40){
    taperOn = true;
    baseSW = 2;
    minSW = 0.5;
    maxSW = 8;

    minFlux = 75;
    maxFlux = 0;
    randomFlux = 1.5;

    stageAstrength = 2;
    stageAdirect = 1;
    stageAlength = 45;

    stageBstrength = 3;
    stageBdirect = 0;
    stageBlength = 45;

    pauseLength = 0;
    delayMax = -30;
  } else if(rs0 < 50){
    taperOn = false;

    minFlux = 10;
    maxFlux = 150;
    randomFlux = 1.5;

    stageAdirect = 1;
    stageAstrength = 3;
    stageAlength = 45;

    stageBdirect = 0;
    stageBstrength = 3;
    stageBlength = 45;

    pauseLength = 0;
    delayMax = -45;
  } else if(rs0 < 60){
    taperOn = true;
    baseSW = 2;
    minSW = 10;
    maxSW = 20;

    minFlux = -150;
    maxFlux = 75;
    randomFlux = 1;

    stageAdirect = 2;
    stageAstrength = 2;
    stageAlength = 25;

    stageBdirect = 2;
    stageBstrength = 2;
    stageBlength = 25;

    pauseLength = 25;
    delayMax = -45;
  } else if(rs0 < 70){
    taperOn = true;
    baseSW = 2;
    minSW = 1;
    maxSW = 10;

    minFlux = 75;
    maxFlux = -75;
    randomFlux = 2.0;

    stageAdirect = 2;
    stageAstrength = 2;
    stageAlength = 20;

    stageBdirect = 2;
    stageBstrength = 2;
    stageBlength = 20;

    pauseLength = 25;
    delayMax = -75;
  } else if(rs0 < 80){
    taperOn = false;
    baseSW = 2;

    minFlux = 0;
    maxFlux = 150;
    randomFlux = 8.0;

    stageAdirect = 1;
    stageAstrength = 4;
    stageAlength = 40;

    stageBdirect = 0;
    stageBstrength = 4;
    stageBlength = 40;

    pauseLength = 25;
    delayMax = -10;
  }

  var rs1 = p.random(30);
  if(rs1 < 10){
    colorType = 0;
  } else if(rs1 < 20){
    colorType = 1;
    generateRandomPalette();
  } else if(rs1 < 30){
    colorType = 2;
    generateRandomPalette();
  } 

  setAnimStages();

  for(var m = 0; m < spokes.length; m++){
    spokes[m].resetFull();
  }
}



    // --- ORIGINAL SKETCH.JS CODE ---
    var bkgdColor, foreColor;
var inputText = [];
var inpText = "GO\nNOW\nSTART\nOVER";

var pg = [];
var tFont = [];
var tFontFactor = [];
var pgTextSize = 100;
var colorSet = [];
var colorType = 0;

var leading = 0;

var stageAdirect = 1; // 0: IN, 1: OUT, 2:InOut
var stageAstrength = 3;
var stageAlength = 60;

var stageBdirect = 0;
var stageBstrength = 3;
var stageBlength = 60;

var pauseLength = 30;
var delayMax = -30;

var resLon = 200;
var resLat = 250;
var ang;
var radius;
var radStep;
var radMax;

var anim0 = 0;
var anim1 = anim0 + stageAlength;
var anim2 = anim1 + stageBlength;
var anim3 = anim2 + pauseLength;

var wWindowMin, wWindowMax;
var scaler = 0.75;

var spokes = [];
var testPoints = [];

var pointCounter = 0;
var spokeCounter = 0;

var c;

var selFont = 4;
var scrubOn = false;
var scrubVal = 0;
var scrubFull = anim3 - delayMax -1;

var taperOn = true;
var baseSW = 2;
var minSW = 1;
var maxSW = 8;

var minFlux = -10;
var maxFlux = 25;
var randomFlux = 4;

var ranRunOn = false;
var thisDensity = 1;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;


function preload(){
  tFont[0] = p.loadFont("../assets/RobotoCondensed-Bold.ttf");
  tFont[1] = p.loadFont("../assets/Inter-Medium.ttf");
  tFont[2] = p.loadFont("../assets/RobotoCondensed-Bold.ttf");
  tFont[3] = p.loadFont("../assets/SpaceMono-Regular.ttf");
  tFont[4] = p.loadFont("../assets/RobotoCondensed-Bold.ttf");

  tFontFactor[0] = 0.75;
  tFontFactor[1] = 0.75;
  tFontFactor[2] = 0.75; 
  tFontFactor[3] = 0.9; 
  tFontFactor[4] = 0.8; 
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h);

  thisDensity = p.pixelDensity();

  wWindowMin = p.width/8;
  wWindowMax = p.width;
  wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax);

  c = createVector(p.width/2, p.height/2);

  ang = p.TWO_PI/resLon;
  if(p.width > p.height){
    radius = p.width;
  } else {
    radius = p.height;
  }
  radStep = (radius)/resLat;
  radMax = radius;

  foreColor = p.color('#ffffff');
  bkgdColor = p.color('#000000');

  colorSet[0] = p.color('#d90d43');
  colorSet[1] = p.color('#164df2');
  colorSet[2] = p.color('#f2b807');
  colorSet[3] = p.color('#078c4e');
  colorSet[4] = p.color('#f2a007');

  reSetting();

  if(typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "GO\nNOW\nSTART\nOVER";
  selFont = 4;
  scaler = 0.75;
  resLon = 200;
  minFlux = -10;
  maxFlux = 25;
  randomFlux = 4;
  taperOn = true;
  baseSW = 2;
  minSW = 1;
  maxSW = 8;
  stageAdirect = 1;
  stageAstrength = 3;
  stageAlength = 60;
  stageBdirect = 0;
  stageBstrength = 3;
  stageBlength = 60;
  pauseLength = 30;
  delayMax = -30;
  colorType = 0;
  
  foreColor = p.color('#ffffff');
  bkgdColor = p.color('#000000');
  
  wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax);
  ang = p.TWO_PI/resLon;
  
  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = p.millis();
  isClearing = false;
  lastRemoveTime = 0;
  
  setAnimStages();
  setText();
}

function applyCustomPreset(settings) {
    if (!settings) return;
    
    reSetting();
    
    if (settings.text !== undefined) inpText = settings.text;
    if (settings.selFont !== undefined) selFont = settings.selFont;
    if (settings.scaler !== undefined) scaler = settings.scaler;
    if (settings.resLon !== undefined) resLon = settings.resLon;
    if (settings.minFlux !== undefined) minFlux = settings.minFlux;
    if (settings.maxFlux !== undefined) maxFlux = settings.maxFlux;
    if (settings.randomFlux !== undefined) randomFlux = settings.randomFlux;
    if (settings.taperOn !== undefined) taperOn = settings.taperOn;
    if (settings.baseSW !== undefined) baseSW = settings.baseSW;
    if (settings.minSW !== undefined) minSW = settings.minSW;
    if (settings.maxSW !== undefined) maxSW = settings.maxSW;
    if (settings.stageAdirect !== undefined) stageAdirect = settings.stageAdirect;
    if (settings.stageAstrength !== undefined) stageAstrength = settings.stageAstrength;
    if (settings.stageAlength !== undefined) stageAlength = settings.stageAlength;
    if (settings.stageBdirect !== undefined) stageBdirect = settings.stageBdirect;
    if (settings.stageBstrength !== undefined) stageBstrength = settings.stageBstrength;
    if (settings.stageBlength !== undefined) stageBlength = settings.stageBlength;
    if (settings.pauseLength !== undefined) pauseLength = settings.pauseLength;
    if (settings.delayMax !== undefined) delayMax = settings.delayMax;
    if (settings.colorType !== undefined) colorType = settings.colorType;
    
    if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
    if (settings.foreColor !== undefined) foreColor = p.color(settings.foreColor);
    
    wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax);
    ang = p.TWO_PI/resLon;
    
    setAnimStages();
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

    if (data.selFont !== undefined) { selFont = Number(data.selFont); setText(); }
    if (data.scaler !== undefined) { scaler = Number(data.scaler); wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax); setText(); }
    if (data.resLon !== undefined) { resLon = Number(data.resLon); ang = p.TWO_PI/resLon; makeSpokes(); }
    if (data.minFlux !== undefined) { minFlux = Number(data.minFlux); for(var m = 0; m < spokes.length; m++) spokes[m].reDistance(); }
    if (data.maxFlux !== undefined) { maxFlux = Number(data.maxFlux); for(var m = 0; m < spokes.length; m++) spokes[m].reDistance(); }
    if (data.randomFlux !== undefined) { randomFlux = Number(data.randomFlux); for(var m = 0; m < spokes.length; m++) spokes[m].reDistance(); }
    if (data.taperOn !== undefined) { taperOn = Boolean(data.taperOn) || data.taperOn === 'true'; for(var m = 0; m < spokes.length; m++) spokes[m].reStroke(); }
    if (data.baseSW !== undefined) { baseSW = Number(data.baseSW); for(var m = 0; m < spokes.length; m++) spokes[m].reStroke(); }
    if (data.minSW !== undefined) { minSW = Number(data.minSW); for(var m = 0; m < spokes.length; m++) spokes[m].reStroke(); }
    if (data.maxSW !== undefined) { maxSW = Number(data.maxSW); for(var m = 0; m < spokes.length; m++) spokes[m].reStroke(); }
    if (data.stageAdirect !== undefined) stageAdirect = Number(data.stageAdirect);
    if (data.stageAstrength !== undefined) stageAstrength = Number(data.stageAstrength);
    if (data.stageAlength !== undefined) { stageAlength = Number(data.stageAlength); setAnimStages(); }
    if (data.stageBdirect !== undefined) stageBdirect = Number(data.stageBdirect);
    if (data.stageBstrength !== undefined) stageBstrength = Number(data.stageBstrength);
    if (data.stageBlength !== undefined) { stageBlength = Number(data.stageBlength); setAnimStages(); }
    if (data.pauseLength !== undefined) { pauseLength = Number(data.pauseLength); setAnimStages(); }
    if (data.delayMax !== undefined) { delayMax = Number(data.delayMax); for(var m = 0; m < spokes.length; m++) spokes[m].resetFull(); }
    if (data.colorType !== undefined) { colorType = Number(data.colorType); for(var m = 0; m < spokes.length; m++) spokes[m].reColor(); }
    
    if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);
    if (data.foreColor !== undefined) { foreColor = p.color(data.foreColor); for(var m = 0; m < spokes.length; m++) spokes[m].reColor(); }

    // Handle p.save request
    if (data.action === "savePreset") {
        const payload = {
            type: "savePreset",
            iframeSrc: window.location.href,
            name: data.name || "custom_preset",
            settings: {
                text: inpText,
                selFont: selFont,
                scaler: scaler,
                resLon: resLon,
                minFlux: minFlux,
                maxFlux: maxFlux,
                randomFlux: randomFlux,
                taperOn: taperOn,
                baseSW: baseSW,
                minSW: minSW,
                maxSW: maxSW,
                stageAdirect: stageAdirect,
                stageAstrength: stageAstrength,
                stageAlength: stageAlength,
                stageBdirect: stageBdirect,
                stageBstrength: stageBstrength,
                stageBlength: stageBlength,
                pauseLength: pauseLength,
                delayMax: delayMax,
                colorType: colorType,
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

  for(var m = 0; m < spokes.length; m++){
    spokes[m].run();
  }

  if(spokes[0] && spokes[0].ticker1 >= anim3 - delayMax){
    if(ranRunOn){
      runRan();
    } else {
      for(var m = 0; m < spokes.length; m++){
        spokes[m].reset();
      }
    }
  }



  if (typeof captureFrame === 'function') captureFrame();
}

function makeSpokes(){
  spokes = [];
  var switcher = false;

  for(var m = 0; m < resLon; m++){
    switcher = false;
    
    var preX = 0;
    var preY = 0;
    
    for(var n = 0; n < resLat; n++){
      var start;

      var tAng = m * ang;
      var tX = p.cos(tAng) * (n * radStep) + c.x;
      var tY = p.sin(tAng) * (n * radStep) + c.y;

      if(!switcher){
        if(brightness(pg[0].get(tX, tY)) > 10){
          start = createVector(tX, tY);
          preX = tX;
          preY = tY;
          
          switcher = true;
        }
      } else if(switcher){
        if(brightness(pg[0].get(tX, tY)) < 10){
          var end = createVector(tX, tY);

          var index = spokes.length;
          spokes[spokes.length] = new Spoke(start, end, tAng, index);

          switcher = false;
        }
      }
    }
  }

  //// find radMax;
  var distRuler = 0;
  for(var p = 0; p < spokes.length; p++){
    var distFromCenter = p.dist(c.x, c.y, spokes[p].p1.x, spokes[p].p1.y);
    if(distFromCenter > distRuler){
      distRuler = distFromCenter;
    }
  }
  radMax = distRuler;

  for(var m = 0; m < spokes.length; m++){
    spokes[m].resetFull();
  }
}

function windowResized(){
  wWindowMin = p.width/8;
  wWindowMax = p.width;
  wWindow = p.map(scaler, 0, 1, wWindowMin, wWindowMax);
  c = createVector(p.width/2, p.height/2);

  if(p.width > p.height){
    radius = p.width;
  } else {
    radius = p.height;
  }
  radStep = (radius)/resLat;

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
