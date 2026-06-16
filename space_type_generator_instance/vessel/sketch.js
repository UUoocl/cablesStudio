// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "default": {
        "p.text": "THE\nMEANING\nOF ALL\nMOTIONS\nSHAPES &\nSOUNDS",
        "fontSel": 0,
        "textScale": 1,
        "vesselSW": 2,
        "crestType": 1,
        "stageAdirect": 2,
        "stageAstrength": 3,
        "stageBdirect": 2,
        "stageBstrength": 3,
        "stageA": 30,
        "stageB": 45,
        "charDelay": -2,
        "lineDelay": -3,
        "foreColor": "#ffffff",
        "bkgdColor": "#000000"
    },
    "bold_blue": {
        "p.text": "WHEN\nPROBABILITY\nWAVES\nCOLLAPSE\nINTO\nEVENT",
        "fontSel": 3,
        "textScale": 0.8,
        "vesselSW": 5,
        "crestType": 1,
        "stageAdirect": 1,
        "stageAstrength": 2,
        "stageBdirect": 1,
        "stageBstrength": 2,
        "stageA": 40,
        "stageB": 60,
        "charDelay": -4,
        "lineDelay": -6,
        "foreColor": "#00bfff",
        "bkgdColor": "#000000"
    },
    "filled_pink": {
        "p.text": "GOOD\nNIGHT\nNOISES\nEVERY\nWHERE",
        "fontSel": 1,
        "textScale": 1.2,
        "vesselSW": 0,
        "crestType": 2,
        "stageAdirect": 2,
        "stageAstrength": 3,
        "stageBdirect": 2,
        "stageBstrength": 3,
        "stageA": 25,
        "stageB": 40,
        "charDelay": -1,
        "lineDelay": -2,
        "foreColor": "#f24b78",
        "bkgdColor": "#ffffff"
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


// --- INLINED DEPENDENCY: js/0_classBase.js ---
class Base {
  constructor(){
    this.lines = [];

    for(var m = 0; m < inputText.length; m++){
      this.lines[m] = new Line(m);
    }
  }

  run(){
    for(var m = 0; m < inputText.length; m++){
      this.lines[m].run();
    }
  }

  resetMain(){
    for(var m = 0; m < inputText.length; m++){
      this.lines[m].resetMain();
    }
  }
}


// --- INLINED DEPENDENCY: js/1_classLine.js ---
class Line {
  constructor(index){
    this.index = index;

    this.text = inputText[this.index];
    this.count = this.text.length;

    this.baseX = 0;
    this.baseY = -(inputText.length - 1) * pgTextSize * fontFactor[fontSel]/2;
    this.baseY += index * pgTextSize * fontFactor[fontSel];
    this.baseY += pgTextSize * fontFactor[fontSel]/2;
    
    this.fullW = p.textWidth(this.text);

    this.preBudgeOrg = 0;
    this.preBudge = 0;
    this.preBudgeTarget = 0;
    this.postBudgeOrg = 0;
    this.postBudge = 0;
    this.postBudgeTarget = 0;

    this.lets = [];
    
    this.ticker = [];
    this.xTarget = [];
    this.yTarget = [];
    this.rTarget = [];
    this.shearTarget = [];
    this.shearXtarget = [];
    this.hTarget = [];

    this.motionType = "";

    this.build();
    this.pickMotion();
  }

  build(){
    p.textAlign(p.CENTER);

    for(var m = 0; m < this.count; m++){
      var currentString = p.textWidth(this.text.substring(0, m + 1));
      var currentLetter = p.textWidth(this.text.charAt(m));

      var thisDiff = currentString - currentLetter/2 - this.fullW/2;
      var x_ = thisDiff;

      this.lets[m] = {
        x: x_,
        y: 0,
        orgX: x_,
        orgY: 0,
        coreX: x_,
        coreY: 0,
        h: 1,
        orgH: 1,
        r: 0,
        orgR: 0,
        shear: 0,
        orgShear: 0,
        shearX: 0,
        orgShearX: 0,
        w: currentLetter,
        thisH: pgTextSize * (fontHeightFactor[fontSel]),
        letter: this.text.charAt(m)
      }
    }
  }

  pickMotion(){
    this.resetValues();

    var rs0 = p.random(90);

    if(rs0 < 10){
      this.makeOrig();
    } else if(rs0 < 20){
      this.makeAngles1();
    } else if(rs0 < 30){
      this.makeZigZag1();
    } else if(rs0 < 40){
      this.makeDiag1();
    } else if(rs0 < 50){
      this.makeBolt1();
    } else if(rs0 < 60){
      this.makeArc();
    } else if(rs0 < 70){
      this.makeBowtie();
    } else if(rs0 < 80){
      this.makeRays();
    } else if(rs0 < 90){
      this.makeLean();
    }

    if(this.index == 0 && p.random(10) < 5 && !centerOn){
      this.resetValues();

      var rs1;
      if(this.fullW < p.textWidth(inputText[1])){
        rs1 = p.random(25);
      } else {
        rs1 = p.random(20);
      }
      if(rs1 < 10){
        this.makeDiagOutside(true);
      } else if(rs1 < 20){
        this.makeArcOutside(true);
      } else if(rs1 < 25){
        this.makeCornerOutside(true);
      }
    }
    if(this.index == inputText.length - 1 && p.random(10) < 5 && !centerOn){
      this.resetValues();
      var rs1;

      if(this.fullW < p.textWidth(inputText[inputText.length - 2])){
        rs1 = p.random(25);
      } else {
        rs1 = p.random(20);
      }
      if(rs1 < 10){
        this.makeDiagOutside(false);
      } else if(rs1 < 20){
        this.makeArcOutside(false);
      } else if(rs1 < 25){
        this.makeCornerOutside(false);
      }
    }

    peakY += this.preBudgeTarget + this.postBudgeTarget;

    for(var m = 0; m < this.count; m++){
      var xDist = p.abs(this.xTarget[m]);
      if(xDist > boxWmeas){
        boxWmeas = xDist;
      }
    }
  }

  resetMain(){
    for(var m = 0; m < this.count; m++){
      this.lets[m].orgX = this.xTarget[m];
      this.lets[m].orgY = this.yTarget[m];
      this.lets[m].orgR = this.rTarget[m];
      this.lets[m].orgShear = this.shearTarget[m];
      this.lets[m].orgShearX = this.shearXtarget[m];
      this.lets[m].orgH = this.hTarget[m];
    }

    this.preBudgeOrg = this.preBudgeTarget;
    this.postBudgeOrg = this.postBudgeTarget;

    this.resetValues();
    this.pickMotion();
  }

  resetValues(){
    for(var m = 0; m < this.count; m++){
      this.ticker[m] = m * charDelay + this.index * lineDelay; 
      this.xTarget[m] = this.lets[m].coreX;
      this.yTarget[m] = this.lets[m].coreY;
      this.rTarget[m] = 0;
      this.shearTarget[m] = 0;
      this.shearXtarget[m] = 0;
      this.hTarget[m] = 1;

      if(this.ticker[m] < cTickerMeasure){
        cTickerMeasure = this.ticker[m];
      }
    }
    this.preBudgeTarget = 0;
    this.postBudgeTarget = 0;
  }

  run(){
    this.update();

    p.translate(0, this.preBudge);

    if(debugOn){
      this.displayDebug();
    }
    this.display();

    p.translate(0, this.postBudge);

    centerY += this.preBudge + this.postBudge;

    for(var m = 0; m < this.count; m++){
      if(this.lets[m].x < leftX){
        leftX = this.lets[m].x;
      }
      if(this.lets[m].x > rightX){
        rightX = this.lets[m].x;
      }
    }
  }

  update(){
    for(var m = 0; m < this.count; m++){
      this.ticker[m] ++;

      if(this.ticker[m] < 0){

        this.lets[m].x = this.lets[m].orgX;
        this.lets[m].y = this.lets[m].orgY;
        this.lets[m].r = this.lets[m].orgR;
        this.lets[m].shear = this.lets[m].orgShear;
        this.lets[m].shearX = this.lets[m].orgShearX;
        this.lets[m].h = this.lets[m].orgH;

        if(m == p.round(this.count/2)){
          this.preBudge = this.preBudgeOrg;
          this.postBudge = this.postBudgeOrg;
        }
      } else if(this.ticker[m] < stageA){
        var tk0 = p.map(this.ticker[m], 0, stageA - 1, 0, 1);

        this.lets[m].x = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgX, this.xTarget[m]);
        this.lets[m].y = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgY, this.yTarget[m]);
        this.lets[m].r = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgR, this.rTarget[m]);
        this.lets[m].shear = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgShear, this.shearTarget[m]);
        this.lets[m].shearX = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgShearX, this.shearXtarget[m]);
        this.lets[m].h = p.map(stageAaccel(tk0), 0, 1, this.lets[m].orgH, this.hTarget[m]);

        if(m == p.round(this.count/2)){
          this.preBudge = p.map(stageAaccel(tk0), 0, 1, this.preBudgeOrg, this.preBudgeTarget);
          this.postBudge = p.map(stageAaccel(tk0), 0, 1, this.postBudgeOrg, this.postBudgeTarget);
        }
      } else {
        this.lets[m].x = this.xTarget[m];
        this.lets[m].y = this.yTarget[m];
        this.lets[m].r = this.rTarget[m];
        this.lets[m].shear = this.shearTarget[m];
        this.lets[m].shearX = this.shearXtarget[m];
        this.lets[m].h = this.hTarget[m];

        if(m == p.round(this.count/2)){
          this.preBudge = this.preBudgeTarget;
          this.postBudge = this.postBudgeTarget;
        }
      }
    }
  }

  display(){
    p.noStroke();
    p.textAlign(p.CENTER);

    p.push();
      p.translate(this.baseX, this.baseY);

      for(var m = 0; m < this.count; m++){
        var l = this.lets[m];

        p.push();
          p.translate(l.x, l.y);
          
          p.shearY(l.shear);
          p.shearX(l.shearX);
          p.rotate(l.r);
          
          p.translate(0, -l.thisH/2);
          p.scale(1, l.h);

          p.textSize(pgTextSize);

          if(crestType == 2){
            p.fill(bkgdColor);
          } else {
            p.fill(foreColor);
          }

          if(svgSaveOn){
            let points = tFont[fontSel].textToPoints(l.letter, -l.w/2, l.thisH/2, pgTextSize, { sampleFactor:  0.9 });
            p.beginShape()
              for(let p of points){
                p.vertex(p.x, p.y);
              }
            p.endShape(p.CLOSE);
          } else {
            p.text(l.letter, 0, l.thisH/2); 
          }
        p.pop();
      }
    p.pop();
  }

  displayDebug(){
    p.push();
      p.translate(this.baseX, this.baseY);

      p.noStroke();
      p.fill(accentColor);
      p.ellipse(0, 0, 5, 5);

      p.textFont(tFont[0]);
      p.textSize(8);
      p.textAlign(p.LEFT);
      p.text("Animation style: " + this.motionType, p.width/4, 0);

      p.noFill();
      p.stroke(accentColor);
      p.strokeWeight(1);

      p.line(-10, 0, 10, 0);
      p.line(0, this.postBudge + this.lets[0].thisH/2, 0, -this.preBudge - this.lets[0].thisH/2);

      p.line(-5, this.postBudgeTarget - this.postBudge - 5, 5, this.postBudgeTarget - this.postBudge + 5);
      p.line(5, this.postBudgeTarget - this.postBudge - 5, -5, this.postBudgeTarget - this.postBudge + 5);

      p.strokeWeight(0.25);
      p.line(0, 0, p.width/4, 0);

      for(var m = 0; m < this.count; m++){
        var l = this.lets[m];
        p.ellipse(l.orgX, l.orgY, 5, 5);

        p.rect(l.x, l.y, 10, 10);

        p.line(l.orgX, l.orgY, this.xTarget[m], this.yTarget[m]);
        
        p.strokeWeight(0.25);
        p.push();
          p.translate(l.orgX, l.orgY);
          p.line(-5, 0, 5, 0);
          p.line(0, -5, 0, 5);

          p.shearY(l.orgShear);
          p.shearX(l.orgShearX);
          p.rotate(l.orgR);
          
          p.translate(0, -l.thisH/2);
          p.scale(1, l.orgH);

          p.stroke(accentColor);
          p.noFill();
          p.rect(0, 0, l.w, l.thisH);
        p.pop();

        p.strokeWeight(1.25);
        p.push();
          p.translate(this.xTarget[m], this.yTarget[m]);
          p.line(-5, -5, 5, 5);
          p.line(5, -5, -5, 5);

          p.shearY(this.shearTarget[m]);
          p.shearX(this.shearXtarget[m]);
          p.rotate(this.rTarget[m]);
          
          p.translate(0, -l.thisH/2);
          p.scale(1, this.hTarget[m]);

          p.stroke(accentColor);
          p.noFill();
          p.rect(0, 0, l.w, l.thisH);
        p.pop();
      }

    p.pop();
  }

  makeOrig(){
    for(var m = 0; m < this.count; m++){
      this.xTarget[m] = this.lets[m].coreX;
      this.yTarget[m] = this.lets[m].coreY;
      this.rTarget[m] = 0;
      this.shearTarget[m] = 0;
      this.shearXtarget[m] = 0;
    }

    this.postBudgeTarget = 0;
    this.preBudgeTarget = 0;
  }

  makeArcOutside(top){
    this.motionType = "Arc, Outside"

    var rotOn = true;
    if(p.random(10) < 5){
      rotOn = false;
    }

    var direct = 1;
    if(!top){
      direct *= -1;
    }

    var rad = this.fullW/(p.PI/2);
    var altSagitta = rad/(p.cos(p.PI/4));

    for(var m = 0; m < this.count; m++){
      var ang = -direct * p.PI * 3/4 + direct * p.map(m, 0, this.count-1, 0, p.PI/2);

      this.xTarget[m] = p.cos(ang) * (this.fullW/2 + this.lets[m].thisH/2);
      this.yTarget[m] = p.sin(ang) * (this.fullW/2 + this.lets[m].thisH/2) + direct * altSagitta/2;

      if(rotOn){
        this.rTarget[m] = ang + direct * p.PI/2;
      }
    }
    this.postBudgeTarget = this.lets[0].thisH/4;
    this.preBudgeTarget = this.lets[0].thisH/4;
  }

  makeDiagOutside(top){
    this.motionType = "Diagonal, Outside"

    var angOn = true;
    if(p.random(10) < 5){
      angOn = false;
    }
    var direct = 1;
    var bottomFlip = 1;
    if(p.random(10) < 5){
      direct *= -1;
    }
    var shiftOver;
    if(top){
      shiftOver = p.textWidth(inputText[1])/4;
    } else {
      shiftOver = p.textWidth(inputText[inputText.length - 2])/4;
      bottomFlip *= -1;
    }

    var ang = direct * p.atan2(this.lets[0].thisH/2, this.fullW);
    var spread = direct * this.lets[0].thisH/4;
    for(var m = 0; m < this.count; m++){
      this.xTarget[m] = this.lets[m].coreX + bottomFlip * direct * shiftOver;
      this.yTarget[m] = p.map(m, 0, this.count - 1, -spread, spread);

      if(angOn){
        this.shearTarget[m] = ang;      
      }
    }
    this.postBudgeTarget = this.lets[0].thisH/4;
    this.preBudgeTarget = this.lets[0].thisH/4;
  }

  makeCornerOutside(top){
    this.motionType = "Corner, Outside"

    var rotOn = true;
    if(p.random(10) < 5){
      rotOn = false;
    }

    var direct = 1;
    if(!top){
      direct *= -1;
    }

    var rad = this.fullW/(p.PI/2);
    var altSagitta = rad/(p.cos(p.PI/4));

    var shiftOver;
    if(top){
      shiftOver = p.textWidth(inputText[1])/3;
    } else {
      shiftOver = p.textWidth(inputText[inputText.length - 2])/3;
    }

    for(var m = 0; m < this.count; m++){
      var ang;
      if(top){
        ang = -p.PI + p.map(m, 0, this.count-1, 0, p.PI/2);
      } else {
        ang = p.PI/2 + p.map(m, 0, this.count-1, 0, -p.PI/2);
      }

      this.xTarget[m] = p.cos(ang) * (this.fullW/2 + this.lets[m].thisH/2) - direct * shiftOver;
      this.yTarget[m] = p.sin(ang) * (this.fullW/2 + this.lets[m].thisH/2) + direct * this.lets[0].thisH/2 + direct * altSagitta/2;

      if(rotOn){
        this.rTarget[m] = ang + direct * p.PI/2;
      }
    }
    this.postBudgeTarget = this.lets[0].thisH/4;
    this.preBudgeTarget = this.lets[0].thisH/4;
  }

  makeAngles1(){
    this.motionType = "Angles"

    var altOn = true;
    if(p.random(10) < 5){
      altOn = false;
    }

    for(var m = 0; m < this.count; m++){
      this.shearTarget[m] = -p.PI/8;

      if(altOn && m%2 == 0){
        this.shearTarget[m] *= -1;
      }
    }
    this.preBudgeTarget = this.lets[0].thisH/4;
    this.postBudgeTarget = this.lets[0].thisH/4;
  }

  makeBowtie(){
    this.motionType = "Bowtie"

    var altOn = true;
    if(p.random(10) < 5){
      altOn = false;
    }

    for(var m = 0; m < this.count; m++){
      if(altOn){
        if(m == (this.count + 1)/2 - 1){
          this.hTarget[m] = 1.5;
        } else if(m < this.count/2){
          this.hTarget[m] = p.map(m, 0, this.count/2 - 1, 1.1, 1.5);
        } else if(m > this.count/2){
          this.hTarget[m] = p.map(m, this.count/2, this.count - 1, 1.5, 1.1);
        }
      } else {
        if(m == (this.count + 1)/2 - 1){
          this.hTarget[m] = 1.0;
        } else if(m < this.count/2){
          this.hTarget[m] = p.map(m, 0, this.count/2 - 1, 1.5, 1.1);
        } else if(m > this.count/2){
          this.hTarget[m] = p.map(m, this.count/2, this.count - 1, 1.1, 1.5);
        }
      }
    }
    this.preBudgeTarget = this.lets[0].thisH/4;
    this.postBudgeTarget = this.lets[0].thisH/4;
  }

  makeRays(){
    this.motionType = "Rays"

    for(var m = 0; m < this.count; m++){
      if(m == (this.count + 1)/2 - 1){
        this.rTarget[m] = 0;
      } else if(m < this.count/2){
        this.rTarget[m] = p.map(m, 0, this.count/2 - 1, -p.PI/8, 0);
      } else if(m > this.count/2){
        this.rTarget[m] = p.map(m, this.count/2, this.count - 1, 0, p.PI/8);
      }
    }
  }

  makeLean(){
    this.motionType = "Lean"

    var angOn = true;
    if(p.random(10) < 5){
      angOn = false;
    }

    for(var m = 0; m < this.count; m++){
      if(m == (this.count + 1)/2 - 1){
        this.shearXtarget[m] = 0;
      } else if(m < this.count/2){
        this.shearXtarget[m] = p.map(m, 0, this.count/2 - 1, -p.PI/8, 0);
      } else if(m > this.count/2){
        this.shearXtarget[m] = p.map(m, this.count/2, this.count - 1, 0, p.PI/8);
      }

      if(angOn){
        this.shearXtarget[m] *= -1;
      }
    }
  }

  makeZigZag1(){
    this.motionType = "ZigZag"

    for(var m = 0; m < this.count; m++){
      this.yTarget[m] = this.lets[m].thisH/4;

      if(m%2 == 0){
        this.yTarget[m] *= -1;
      }
    }

    this.preBudgeTarget = this.lets[0].thisH/4;
    this.postBudgeTarget = this.lets[0].thisH/4;
  }

  makeDiag1(){
    this.motionType = "Diagonal"

    var angOn = true;
    if(p.random(10) < 5){
      angOn = false;
    }
    var flipOn = true;
    if(p.random(10) < 5){
      flipOn = false;
    }

    var ang = p.atan2(this.lets[0].thisH/2, this.fullW);
    var spread = this.lets[0].thisH/4;
    if(flipOn){
      ang *= -1;
      spread *= -1;
    }

    for(var m = 0; m < this.count; m++){
      this.yTarget[m] = p.map(m, 0, this.count - 1, -spread, spread);

      if(angOn){
        this.shearTarget[m] = ang;      
      }
    }

    this.preBudgeTarget = this.lets[0].thisH/4;
    this.postBudgeTarget = this.lets[0].thisH/4;
  }

  makeBolt1(){
    this.motionType = "Bolt"

    var angOn = true;
    if(p.random(10) < 5){
      angOn = false;
    }

    var ang = p.atan2(this.lets[0].thisH/2, this.fullW);
    var spread = this.lets[0].thisH/4;

    for(var m = 0; m < this.count; m++){
      if(m < ((this.count + 1)/2)){
        this.yTarget[m] = p.map(m, 0, this.count/2, -spread, spread);
      } else {
        this.yTarget[m] = p.map(m, this.count/2, this.count - 1, -spread, spread);
      }

      if(angOn){
        this.shearTarget[m] = ang;      
      }
    }

    this.preBudgeTarget = this.lets[0].thisH/4;
    this.postBudgeTarget = this.lets[0].thisH/4;
  }

  makeArc(){
    this.motionType = "Arc"

    var direct = 1;
    if(!top){
      direct *= -1;
    }

    var rad = this.fullW/(p.PI/2);
    var altSagitta = rad/(p.cos(p.PI/4));

    for(var m = 0; m < this.count; m++){
      var ang = -direct * p.PI * 3/4 + direct * p.map(m, 0, this.count-1, 0, p.PI/2);

      this.xTarget[m] = p.cos(ang) * (this.fullW/2 + this.lets[m].thisH/2);
      this.yTarget[m] = p.sin(ang) * (this.fullW/2 + this.lets[m].thisH/2) + rad - altSagitta/8;

      this.rTarget[m] = ang + direct * p.PI/2;
    }

    this.preBudgeTarget = this.lets[0].thisH/2;
    this.postBudgeTarget = this.lets[0].thisH;
  }
}


// --- INLINED DEPENDENCY: js/update.js ---
function setText(){
  var enteredText = inpText || "";
  
  inputText = enteredText.match(/[^\r\n]+/g);

  if(!inputText || enteredText == ""){
    inputText = [];
    inputText[0] = " ";
  }

  createAnimation();
}

function findMaxSize(){
  var testerSize = 100;
  p.textSize(testerSize);
  p.textFont(tFont[fontSel]);
  
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
  var heightTest = (p.height - 30);
  let holdH = inputText.length * sizeHolder * fontFactor[fontSel];
  while(holdH > heightTest){
    holdH = inputText.length * sizeHolder * fontFactor[fontSel];
    sizeHolder -= 2;
  }
  pgTextSize = sizeHolder * textScale;
}

function setFont(val){
  fontSel = val;
  createAnimation();
}

function setPGtextSize(val){
  textScale = p.map(val, 0, 100, 0.2, 3);
  createAnimation();
}

function setStageAlength(val){
  stageAlength = val;
  refigureStages();
  createAnimation();
  runCoreReset();
}

function setStageAdirect(val){
  stageAdirect = val;
}

function setStageAstrength(val){
  stageAstrength = val;
}

function setStageBlength(val){
  stageBlength = val;
  refigureStages();
  createAnimation();
  runCoreReset();
}

function setVesselSW(val){
  vesselSW = p.map(val, 0, 100, 0, 50);
}

function setDebugOn(){
  debugOn = !debugOn;
}
 
function setCenterOn(){
  centerOn = !centerOn;
}

function refigureStages(){
  var tempA = p.map(stageAlength, 0, 100, 10, 100);
  var tempB = p.map(stageBlength, 0, 100, 10, 60);
  stageA = tempA;
  stageB = tempA + tempB;
}

function setCrestType(val){
  crestType = val;
}

function setForeColor(val){ foreColor = val; }
function setBkgdColor(val){ bkgdColor = val; }
function setDebugColor(val){ accentColor = val; }

function setLineOffset(val){
  lineDelay = p.map(val, 0, 100, 0, -30);
  createAnimation();
  runCoreReset();
}

function setLetterOffset(val){
  charDelay = p.map(val, 0, 100, 0, -30);
  createAnimation();
  runCoreReset();
}



    // --- ORIGINAL SKETCH.JS CODE ---
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
    tFont[0] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[1] = p.loadFont("../assets/IBMPlexMono-BoldItalic.ttf");
    tFont[2] = p.loadFont("../assets/Roboto-Thin.ttf");
    tFont[3] = p.loadFont("../assets/RobotoCondensed-Bold.ttf");
    tFont[4] = p.loadFont("../assets/IBMPlexMono-ExtraLightItalic.ttf");
    tFont[5] = p.loadFont("../assets/Cairo-Black.ttf");
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
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h);

  thisDensity = p.pixelDensity();
  cwidth = p.width;
  cheight = p.height;

  colorSet[0] = p.color('#f24b78');
  colorSet[1] = p.color('#0b8ad9');
  colorSet[2] = p.color('#0a5926');
  colorSet[3] = p.color('#f2a20c');
  colorSet[4] = p.color('#f21f0c');

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
  lastTextTime = p.millis();
  isClearing = false;
  lastRemoveTime = 0;

  if (p.width < 500) {
    wWindow = p.width / 2;
  } else {
    wWindow = p.width / 3;
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
    lastTextTime = p.millis();
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

  // Handle p.save request
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
  p.push();
  p.translate(p.width / 2, p.height / 2);

  if (crestType == 1) {
    p.stroke(foreColor);
    p.strokeWeight(vesselSW);
    p.noFill();
    p.rect(0, 0, boxW, boxH, boxRTop, boxRTop, boxRBot, boxRBot);
  } else if (crestType == 2) {
    p.noStroke();
    p.fill(foreColor);
    p.rect(0, 0, boxW, boxH, boxRTop, boxRTop, boxRBot, boxRBot);
  }

  p.translate(0, -centerY / 2);
  p.translate(-(leftX + rightX) / 2, 0);

  centerY = 0;
  leftX = 0;
  rightX = 0;
  if (coreBase) coreBase.run();
  p.pop();
}

function runBorderAnim() {
  if (cTicker < cTickerMeasure) {
    boxW = boxWorg;
    boxH = boxHorg;
    boxRTop = boxRTopOrg;
    boxRBot = boxRBotOrg;
  } else if (cTicker < stageA) {
    var tk0 = p.map(cTicker, cTickerMeasure, stageA - 1, 0, 1);
    boxW = p.map(stageAaccel(tk0), 0, 1, boxWorg, boxWtarget);
    boxH = p.map(stageAaccel(tk0), 0, 1, boxHorg, boxHtarget);
    boxRTop = p.map(stageAaccel(tk0), 0, 1, boxRTopOrg, boxRTopTarget);
    boxRBot = p.map(stageAaccel(tk0), 0, 1, boxRBotOrg, boxRBotTarget);

    boxRTop = p.constrain(boxRTop, 0, 2000);
    boxRBot = p.constrain(boxRBot, 0, 2000);
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

  boxRTopTarget = p.random(boxWtarget / 2);
  boxRBotTarget = p.random(boxWtarget / 2);
}

function createAnimation() {
  findMaxSize();

  p.textFont(tFont[fontSel]);
  p.textSize(pgTextSize);

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
  if (p.width < 500) {
    wWindow = p.width / 2;
  } else {
    wWindow = p.width / 3;
  }
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  createAnimation();
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
