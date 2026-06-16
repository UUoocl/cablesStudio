// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "reset": {
        "p.text": "THE\nCOLLECTIVE\nPOWER\nOF\nTINY\nMOMENTS",
        "sceneLength": 30,
        "thisFont": 0,
        "colorSwapOn": true,
        "foreColor": "#000000",
        "bkgdColor": "#ffffff"
    }
};


// --- INLINED DEPENDENCY: js/textures.js ---
//////////////////////////////////////////////
/////////////////////////////       STRIP
//////////////////////////////////////////////

function drawText(p, inp, tFont){   // straight p.text
  p.textSize(pgTextSize);
  p.textFont(tFont);
  var repeatSize = p.round(p.textWidth(inp)) + 100;

  pg[p] = p.createGraphics(repeatSize, pgTextSize);

  pg[p].background(bkgdColor);
  pg[p].fill(foreColor);

  pg[p].noStroke();
  pg[p].textSize(pgTextSize);
  pg[p].textAlign(p.CENTER);
  pg[p].textFont(tFont);
  pg[p].text(inp, pgStrip[p].width/2, pgStrip[p].height/2 + pgTextSize*0.7/2);
}




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

function easeInQuad(ticker) {
  return ticker * ticker;
}

function easeOutQuad(ticker) {
  return 1 - (1 - ticker) * (1 - ticker);
}

function easeInOutQuad(ticker) {
  return ticker < 0.5
    ? 2 * ticker * ticker
    : 1 - Math.pow(-2 * ticker + 2, 2) / 2;
  }

function easeOutQuint(ticker){
  return 1 - Math.pow(1 - ticker, 5);
}

function easeInQuint(ticker) {
  return ticker * ticker * ticker * ticker * ticker;
}

function easeInOutQuint(ticker) {
  return ticker < 0.5 
    ? 16 * ticker * ticker * ticker * ticker * ticker
    : 1 - Math.pow(-2 * ticker + 2, 5) / 2;
  }

function easeOutCirc(ticker){
  return sqrt(1 - Math.pow(ticker - 1, 2));
}

function easeInCirc(ticker){
  return 1 - Math.sqrt(1 - Math.pow(ticker, 2));
}

function easeInOutCirc(ticker) {
  return ticker < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * ticker, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * ticker + 2, 2)) + 1) / 2;
  }

  function easeInOutBack(ticker) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
  
    return ticker < 0.5
      ? (Math.pow(2 * ticker, 2) * ((c2 + 1) * 2 * ticker - c2)) / 2
      : (Math.pow(2 * ticker - 2, 2) * ((c2 + 1) * (ticker * 2 - 2) + c2) + 2) / 2;
  }
  
  function easeInOutElastic(ticker) {
    const c5 = (2 * Math.PI) / 4.5;
    
    return ticker === 0
      ? 0
      : ticker === 1
      ? 1
      : ticker < 0.5
      ? -(Math.pow(2, 20 * ticker - 10) * Math.sin((20 * ticker - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * ticker + 10) * Math.sin((20 * ticker - 11.125) * c5)) / 2 + 1;
    }


// --- INLINED DEPENDENCY: js/0_arcer.js ---
class Arcer {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xSpots = [];
    this.findXpos();

    this.yAnim = [];
    this.yTarget = [];
    this.yStart = 50;
    this.yMin = 0;
    this.yMax = -150;
    this.setYtarget();

    this.ticker = 0;

    this.blPadding = 25;
    this.blSpacing = (p.width - 2*this.blPadding)/(keyArray.length - 1);

    this.ramp = ramp_;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    for(var n = 0; n < this.inp.length; n++){
      var tk1;
      if(accelMode == 0){
        if(this.ramp==0){
          tk1 = easeOutCirc(tk0);
        } else if(this.ramp==1){
          tk1 = easeInCirc(tk0);
        }
        this.yAnim[n] = p.map(tk1, 0, 1, this.yStart, this.yTarget[n]);
      } else {
        let a, b;
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a = this.yStart;
          b = this.yTarget[n]/2;
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a = this.yTarget[n]/2;
          b = this.yTarget[n];
        }
        this.yAnim[n] = p.map(tk1, 0, 1, a, b);
      }
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, (this.pgTextSize * thisFontAdjust)/2);
      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(this.xSpots[n], p.height/2);
          p.translate(0, this.yAnim[n]);
          p.text(this.inp.charAt(n), 0, 0);
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  setYtarget(){
    for(var n = 0; n < this.inp.length; n++){
      this.yAnim[n] = this.yMin;
      
      var tk0 = p.map(n, 0, this.inp.length - 1, 0, 2*p.PI);
      this.yTarget[n] = p.map(p.cos(tk0), 1, -1, this.yMin, this.yMax);
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  removeGraphics(){
  }
}


// --- INLINED DEPENDENCY: js/0_bend.js ---
class Bend {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA;
    this.drawTextures();
  
    this.ticker = 0;

    this.ramp = ramp_;

    this.res = 300;
    this.xSpace = this.pgA.width/this.res;
    this.yTopAnim;
    this.yBotAnim;

    this.yTopCorner = (p.height - this.pgA.height)/2;
    this.yBotCorner = (p.height - this.pgA.height)/2 + this.pgA.height;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;

    let a0, b0;
    let a1, b1;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }
      a0 = 0;
      b0 = -this.yTopCorner;

      a1 = this.pgA.height;
      b1 = this.yBotCorner;
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = 0;
        b0 = -this.yTopCorner/2;

        a1 = this.pgA.height;
        b1 = (this.yBotCorner + this.pgA.height)/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = -this.yTopCorner/2;
        b0 = -this.yTopCorner;

        a1 = (this.yBotCorner + this.pgA.height)/2;
        b1 = this.yBotCorner;
      }
    }

    this.yTopAnim = p.map(tk1, 0, 1, a0, b0);
    this.yBotAnim = p.map(tk1, 0, 1, a1, b1);
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.translate(-this.pgA.width/2, -this.pgA.height/2);

      p.texture(this.pgA);
      p.stroke(foreColor);
      // p.fill(bkgdColor);

      p.beginShape(TRIANGLE_STRIP);
        for(var n = 0; n <= this.res; n++){
          let t = n / this.res;

          let x = p.bezierPoint(0, p.width/2, p.width/2, p.width, t);
          let yTop = p.bezierPoint(this.yTopAnim, 0, 0, this.yTopAnim, t);
          let yBot = p.bezierPoint(this.yBotAnim, this.pgA.height, this.pgA.height, this.yBotAnim, t);

          var u = p.map(x, 0, this.pgA.width, 0, 1);

          p.vertex(x, yTop, u, 0);
          p.vertex(x, yBot, u, 1);
        }
      p.endShape();
    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.1));
    this.pgA.background(bkgdColor);
  
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.text(this.inp, this.pgA.width/2, thisAdjust);
  }

  removeGraphics(){
    this.pgA.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_blank.js ---
class Blank {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA;
    this.drawTextures();
  
    this.ticker = 0;
  }

  update(){
    this.ticker ++;
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.translate(-this.pgA.width/2, -this.pgA.height/2);
      p.image(this.pgA, 0, 0);
    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
    this.pgA.background(bkgdColor);
  
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.translate(p.width/2, thisAdjust);
    this.pgA.text(this.inp, 0, 0);
  }

  removeGraphics(){
    this.pgA.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_box.js ---
class Box {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA, this.pgB;
    this.drawTextures();
  
    this.ticker = 0;

    this.ramp = ramp_;

    this.stripH = this.pgA.height;
    
    this.xRot;
    this.xRotMax = p.random(-p.PI, p.PI);
    this.yRot;
    this.yRotMax = p.random(-p.PI/8, p.PI/8);
    this.zRot;
    this.zRotMax = p.random(-p.PI/2, p.PI/2);
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;

    let a0, b0;
    let a1, b1;
    let a2, b2;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }

      a0 = 0;
      b0 = this.xRotMax;
      a1 = 0;
      b1 = this.yRotMax;
      a2 = 0;
      b2 = this.zRotMax;
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = 0;
        b0 = this.xRotMax/2;
        a1 = 0;
        b1 = this.yRotMax/2;
        a2 = 0;
        b2 = this.zRotMax/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = this.xRotMax/2;
        b0 = this.xRotMax;
        a1 = this.yRotMax/2;
        b1 = this.yRotMax;
        a2 = this.zRotMax/2;
        b2 = this.zRotMax;
      }
    }
    
    this.xRot = p.map(tk1, 0, 1, a0, b0);
    this.yRot = p.map(tk1, 0, 1, a1, b1);
    this.zRot = p.map(tk1, 0, 1, a2, b2);
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.rotateY(this.yRot);
      p.rotateX(this.xRot);
      p.rotateZ(this.zRot);

      for(var m = 0; m < 4; m++){
        if(m%2 == 0){
          p.texture(this.pgA);
        } else {
          p.texture(this.pgB);
        }

        p.push();
          p.rotateX(m * p.PI/2);
          p.beginShape(TRIANGLE_STRIP);  
              p.vertex(-this.pgA.width/2, -this.pgA.height/2, this.stripH/2, 0, 0);
              p.vertex(-this.pgA.width/2, this.pgA.height/2, this.stripH/2, 0, 1);
              p.vertex(this.pgA.width/2, -this.pgA.height/2, this.stripH/2, 1, 0);
              p.vertex(this.pgA.width/2, this.pgA.height/2, this.stripH/2, 1, 1);
          p.endShape();
        p.pop();

        p.push();
          p.fill(bkgdColor);
          p.noStroke();
          p.translate(-this.pgA.width/2, -this.pgA.height/2, this.stripH/2);
          p.rotateY(p.PI/2);
          p.rect(-1, -1, this.stripH + 2, this.stripH + 2);
          p.translate(0, 0, this.pgA.width);
          p.rect(-1, -1, this.stripH + 2, this.stripH + 2);
        p.pop();
      }

    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.1));
    this.pgA.background(bkgdColor);
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.text(this.inp, this.pgA.width/2, thisAdjust);

    this.pgB = p.createGraphics(repeatSize, this.pgTextSize * 0.8);
    this.pgB.background(foreColor);
    this.pgB.fill(bkgdColor);
    this.pgB.noStroke();
    this.pgB.textSize(this.pgTextSize);
    this.pgB.textAlign(p.CENTER);
    this.pgB.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgB.text(this.inp, this.pgA.width/2, thisAdjust);
  }

  removeGraphics(){
    this.pgA.remove();
    this.pgB.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_bugEyes.js ---
class BugEyes {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.repeats;
    this.pgTextSize = 2;
    this.findTextSize();
    
    this.pg = [];
    this.makeTextures();

    this.ticker = 0;

    this.xSpots = [];
    this.shutterAnim = [];
    this.findXpos();

    this.xAnim = [];

    this.ramp = ramp_;

    this.pacer = (sceneLength/2)/this.inp.length;
  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      for(var p = 0; p < this.repeats; p++){
        var thisDist = p.dist(n, p, this.inp.length/2, this.repeats/2);
        var tk00 = p.constrain(this.ticker - (this.pacer * thisDist), 0, sceneLength);
        var tk0 = p.map(tk00, 0, sceneLength, 0.0, 1.0);
        
        var tk1;
        if(this.ramp==0){
          tk1 = easeOutQuad(tk0);
        } else if(this.ramp==1){
          tk1 = easeInQuad(tk0);
        }

        this.shutterAnim[n][p] = p.map(tk1, 0, 1, this.pg[n].height, 0);
      }
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, p.height/2);
      p.translate(0, -this.pg[0].height/2);

      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(0, -this.repeats * this.pg[n].height/2);

          p.translate(0, (n%2)*this.pg[n].height/2);

          for(var p = 0; p < this.repeats; p++){
            p.push();
              p.translate(this.xSpots[n], p * this.pg[n].height);
              p.texture(this.pg[n]);

              var vTop = 0;
              var vBot = p.map(this.pg[n].height - this.shutterAnim[n][p], 0, this.pg[n].height, 0, 1);
    
              p.beginShape(TRIANGLE_STRIP);
                p.vertex(0, this.shutterAnim[n][p], 0, vTop);
                p.vertex(0, this.pg[n].height, 0, vBot);
                p.vertex(this.pg[n].width, this.shutterAnim[n][p], 1, vTop);
                p.vertex(this.pg[n].width, this.pg[n].height, 1, vBot);
              p.endShape();
            p.pop();
          }
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      this.shutterAnim[n] = [];

      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);

    for(var n = 0; n < this.inp.length; n++){
      var repeatSize = p.round(p.textWidth(this.inp.charAt(n)));
    
      this.pg[n] = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
      this.pg[n].background(bkgdColor);
    
      this.pg[n].fill(foreColor);
      this.pg[n].noStroke();
      this.pg[n].textSize(this.pgTextSize);
      this.pg[n].textAlign(p.CENTER);
      this.pg[n].textFont(currentFont);
      var thisAdjust = this.pg[n].height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
      this.pg[n].text(this.inp.charAt(n), this.pg[n].width/2, thisAdjust);
    }

    this.repeats = p.floor((p.height)/this.pg[0].height) + 2;
  }

  removeGraphics(){
    for(var n = 0; n < this.inp.length; n++){
      this.pg[n].remove();
    }
  }
}


// --- INLINED DEPENDENCY: js/0_bugEyesEE.js ---
class BugEyesEE {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.repeats;
    this.pgTextSize = 2;
    this.findTextSize();
    
    this.pg = [];
    this.makeTextures();

    this.ticker = 0;

    this.xSpots = [];
    this.shutterAnim = [];
    this.shutterAnimBot = [];
    this.findXpos();

    this.xAnim = [];

    this.ramp = ramp_;

    this.pacer = (sceneLength/2)/this.inp.length;
  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      for(var p = 0; p < this.repeats; p++){
        var thisDist = p.dist(n, p, this.inp.length/2, this.repeats/2);
        var tk00 = p.constrain(this.ticker - (this.pacer * thisDist), 0, sceneLength);
        var tk0 = p.map(tk00, 0, sceneLength, 0.0, 1.0);
        
        var tk1;
        var a0, b0;
        var a1, b1;
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a0 = this.pg[n].height;
          b0 = 0;
          a1 = this.pg[n].height;
          b1 = this.pg[n].height;
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a0 = 0;
          b0 = 0;
          a1 = this.pg[n].height;
          b1 = 0;
        }

        this.shutterAnim[n][p] = p.map(tk1, 0, 1, a0, b0);
        this.shutterAnimBot[n][p] = p.map(tk1, 0, 1, a1, b1);
      }
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, p.height/2);
      p.translate(0, -this.pg[0].height/2);

      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(0, -this.repeats * this.pg[n].height/2);

          p.translate(0, (n%2)*this.pg[n].height/2);

          for(var p = 0; p < this.repeats; p++){
            p.push();
              p.translate(this.xSpots[n], p * this.pg[n].height);
              p.texture(this.pg[n]);

              var vTop = p.map(this.shutterAnimBot[n][p], 0, this.pg[n].height, 1, 0);
              var vBot = p.map(this.pg[n].height - this.shutterAnim[n][p], 0, this.pg[n].height, 0, 1);
    
              p.beginShape(TRIANGLE_STRIP);
                p.vertex(0, this.shutterAnim[n][p], 0, vTop);
                p.vertex(0, this.shutterAnimBot[n][p], 0, vBot);
                p.vertex(this.pg[n].width, this.shutterAnim[n][p], 1, vTop);
                p.vertex(this.pg[n].width, this.shutterAnimBot[n][p], 1, vBot);
              p.endShape();
            p.pop();
          }
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      this.shutterAnim[n] = [];
      this.shutterAnimBot[n] = [];

      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);

    for(var n = 0; n < this.inp.length; n++){
      var repeatSize = p.round(p.textWidth(this.inp.charAt(n)));
    
      this.pg[n] = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
      this.pg[n].background(bkgdColor);
    
      this.pg[n].fill(foreColor);
      this.pg[n].noStroke();
      this.pg[n].textSize(this.pgTextSize);
      this.pg[n].textAlign(p.CENTER);
      this.pg[n].textFont(currentFont);
      var thisAdjust = this.pg[n].height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
      this.pg[n].text(this.inp.charAt(n), this.pg[n].width/2, thisAdjust);
    }

    this.repeats = p.floor((p.height)/this.pg[0].height) + 2;
  }

  removeGraphics(){
    for(var n = 0; n < this.inp.length; n++){
      this.pg[n].remove();
    }
  }
}


// --- INLINED DEPENDENCY: js/0_cloud.js ---
class Cloud {
  constructor(ramp_, inp_){
    this.inp = inp_;
    
    this.pgTextSize = 2;
    this.findTextSize();

    this.x = [];
    this.xH = [];
    this.y = [];
    this.yH = [];
    this.yCore = [];
    this.yCoreMax = [];
    this.yCoreMax[0] = p.constrain(-this.pgTextSize, -p.height/2, 0);     /// back cloud
    this.yCoreMax[1] = this.pgTextSize * thisFontAdjust/2;     /// p.text
    this.yCoreMax[2] = p.constrain(this.pgTextSize, p.height/2, 0);     /// front cloud
    this.yCoreMin = [];
    this.yCoreMin[0] = p.constrain(-this.pgTextSize/2, -p.height/4, 0);
    this.yCoreMin[1] = this.pgTextSize * thisFontAdjust;
    this.yCoreMin[2] = p.constrain(this.pgTextSize/2, p.height/4, 0);


    this.cloudCount = 2;
    this.pointCount = 7;
    this.ang = 2*p.PI/this.pointCount;
    this.cloudW = p.width;
    this.cloudH = p.height/3;
    
    this.debrisCount = 10;

    this.xD = [];
    this.yD = [];
    this.xStart = [];
    this.yStart = [];
    this.xEnd = [];
    this.yEnd = [];
    this.rD = [];
    this.rStart = [];
    this.rEnd = [];

    this.sDw = [];
    this.sDh = [];

    this.cloudRefreshCount = 20;

    this.makeCloud();

    this.ticker = 0;

    this.ramp = ramp_;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;
    if(this.ramp==0){
      tk1 = easeOutCirc(tk0);
    } else if(this.ramp==1){
      tk1 = easeInCirc(tk0);
    }
    
    for(var m = 0; m < this.debrisCount; m++){
      this.xD[m] = p.map(tk1, 0, 1, this.xStart[m], this.xEnd[m]);
      this.yD[m] = p.map(tk1, 0, 1, this.yStart[m], this.yEnd[m]);
      this.rD[m] = p.map(tk1, 0, 1, this.rStart[m], this.rEnd[m]);
    }

    for(var m = 0; m < 3; m++){
      this.yCore[m] = p.map(tk1, 0, 1, this.yCoreMin[m], this.yCoreMax[m]);
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(p.width/2, p.height/2);
      
      //////////// BACK CLOUD

      p.push();
        p.translate(-50, this.yCore[0]);

        p.fill(bkgdColor);
        p.stroke(foreColor);
        p.strokeWeight(4);

        p.beginShape();
          p.vertex(this.x[0][0], this.y[0][0]);
          for(var n = 1; n < this.pointCount; n++){
            p.bezierVertex(this.xH[0][n-1], this.yH[0][n-1], this.xH[0][n], this.yH[0][n], this.x[0][n], this.y[0][n]);
          }
          p.bezierVertex(this.xH[0][this.pointCount-1], this.yH[0][this.pointCount-1], this.xH[0][0], this.yH[0][0], this.x[0][0], this.y[0][0]);
        p.endShape();
      p.pop();

      //////////// TEXT
      p.push();
        p.translate(0, this.yCore[1], 1);

        p.noStroke();
        p.fill(foreColor);
        p.textFont(currentFont);
        p.textAlign(p.CENTER);
        p.textSize(this.pgTextSize);
        p.text(this.inp, 0, 0);
      p.pop();

      //////////// DEBRIS
      for(var m = 0; m < this.debrisCount; m++){
        p.push();
          p.translate(this.xD[m], this.yD[m], 5);
          p.rotateZ(this.rD[m]);

          p.fill(bkgdColor);
          p.stroke(foreColor);
          p.strokeWeight(4);

          p.ellipse(0, 0, this.sDw[m], this.sDh[m]);
        p.pop();
      }

      //////////// p.TOP CLOUD
      p.push();
        p.translate(50, this.yCore[2], 10);

        p.fill(bkgdColor);
        p.stroke(foreColor);
        p.strokeWeight(4);

        p.beginShape();
          p.vertex(this.x[1][0], this.y[1][0]);
          for(var n = 1; n < this.pointCount; n++){
            p.bezierVertex(this.xH[1][n-1], this.yH[1][n-1], this.xH[1][n], this.yH[1][n], this.x[1][n], this.y[1][n]);
          }
          p.bezierVertex(this.xH[1][this.pointCount-1], this.yH[1][this.pointCount-1], this.xH[1][0], this.yH[1][0], this.x[1][0], this.y[1][0]);
        p.endShape();
      p.pop();
    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeCloud(){
    for(var m = 0; m < this.cloudCount; m++){
      this.x[m] = [];
      this.y[m] = [];
      this.xH[m] = [];
      this.yH[m] = [];

      for(var n = 0; n < this.pointCount; n++){
        var radRanX = p.random(p.width/8, p.width/4);
        var radRanY = p.random(p.height/8, p.height/4);
        var angRad = p.random(-p.PI/8, p.PI/8);
        var handleLength = p.random(200, 300);

        this.x[m][n] = p.cos(n * this.ang - angRad) * (this.cloudW - radRanX);
        this.y[m][n] = p.sin(n * this.ang - angRad) * (this.cloudH - radRanY);

        this.xH[m][n] = this.x[m][n] + p.cos(n*this.ang - angRad) * handleLength;
        this.yH[m][n] = this.y[m][n] + p.sin(n*this.ang - angRad) * handleLength;
      }
    }

    for(var m = 0; m < this.debrisCount; m++){
      var ang = m * 1.2;
      var radStart = p.random(p.width/8, p.width/4);
      var radEnd = radStart + p.random(p.width/8, p.width/2);

      this.xStart[m] = p.cos(ang) * radStart;
      this.yStart[m] = p.sin(ang) * radStart;

      this.xEnd[m] = p.cos(ang) * radEnd;
      this.yEnd[m] = p.sin(ang) * radEnd;

      var direction = 1;
      if(p.random(10) < 5){
        direction = -1;
      }
      this.rStart[m] = p.random(direction * p.PI);
      this.rEnd[m] = this.rStart[m] + p.random(direction * p.PI);

      this.sDw[m] = p.random(10, 80);
      this.sDh[m] = p.random(10, 80);
    }
  }

  removeGraphics(){
    
  }
}


// --- INLINED DEPENDENCY: js/0_grid.js ---
class Grid {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA;
    this.drawTextures();
  
    this.ticker = 0;

    this.ramp = ramp_;

    this.xCount = 10;
    this.xSpace = this.pgA.width/this.xCount;
    this.yCount = 30;
    this.ySpace = this.pgA.height/this.yCount;

    this.yAnim = [];
    this.xAnim = [];
    this.yAnimTarget = [];
    this.xAnimTarget = [];
    this.findTargets();
  }

  update(){
    this.ticker ++;
    
    for(var m = 0; m <= this.yCount; m ++){
      for(var n = 0; n <= this.xCount; n++){
        var delayDist = p.dist(n, m, this.xCount/2, this.yCount/2);

        var tk00 = p.constrain(this.ticker - delayDist*0.5 + 10, 0, sceneLength);
        var tk0 = p.map(tk00, 0, sceneLength, 0, 1);
        var tk1;
        if(this.ramp==0){
          tk1 = easeOutQuad(tk0);
        } else if(this.ramp==1){
          tk1 = easeInQuad(tk0);
        }

        this.xAnim[m][n] = p.map(tk1, 0, 1, this.xAnimTarget[m][n], 0);
        this.yAnim[m][n] = p.map(tk1, 0, 1, this.yAnimTarget[m][n], 0);
      }
    }
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.translate(-this.pgA.width/2, -this.pgA.height/2);

      p.texture(this.pgA);
      // p.stroke(foreColor);
      // p.fill(bkgdColor);

      for(var m = 0; m < this.yCount; m ++){
        p.beginShape(TRIANGLE_STRIP);
        for(var n = 0; n <= this.xCount; n++){
          var xLeft = n * this.xSpace;
          var xRight = (n+1) * this.xSpace;
          var yTop = m * this.ySpace;
          var yBot = (m+1) * this.ySpace;

          var uLeft = p.map(xLeft + this.xAnim[m][n], 0, this.pgA.width, 0, 1);
          var uRight = p.map(xRight + this.xAnim[m][n], 0, this.pgA.width, 0, 1);
          var vTop = p.map(yTop + this.yAnim[m][n], 0, this.pgA.height, 0, 1);
          var vBot = p.map(yBot + this.yAnim[m][n], 0, this.pgA.height, 0, 1);

          p.vertex(xLeft, yTop, uLeft, vTop);
          p.vertex(xLeft, yBot, uLeft, vBot);
          p.vertex(xRight, yTop, uRight, vTop);
          p.vertex(xRight, yBot, uRight, vBot);
        }
        p.endShape();
      }
    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  findTargets(){
    for(var m = 0; m <= this.yCount; m ++){
      this.xAnim[m] = [];
      this.yAnim[m] = [];
      
      this.xAnimTarget[m] = [];
      this.yAnimTarget[m] = [];
      for(var n = 0; n <= this.xCount; n++){
        var pacer = p.dist(n, m, this.xCount/2, this.yCount/2);

        var xDirect = 1;
        var yDirect = 1;
        if(n > this.xCount/2){
          xDirect = -1;
        }
        if(m > this.yCount/2){
          yDirect = -1;
        }

        this.xAnimTarget[m][n] = xDirect * (5 * pacer) + p.random(-25, 25);
        this.yAnimTarget[m][n] = yDirect * (20 * pacer);
      }
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * 0.8);
    this.pgA.background(bkgdColor);
  
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    this.pgA.text(this.inp, this.pgA.width/2, this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2);
  }

  removeGraphics(){
    this.pgA.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_halo.js ---
class Halo {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA, this.pgB;
    this.drawTextures();
  
    this.ticker = 0;

    this.ramp = ramp_;

    this.res = 100;
    this.ang = 2*p.PI/this.res;
    this.radius = p.width/2;
    this.sec = (2 * p.PI * this.radius)/this.res;
    this.stripH = this.pgA.height;
    
    this.xRot;
    this.xRotMax = p.random(-p.PI/4, p.PI/4);

    this.zRot;
    this.zRotMax = p.random(-p.PI/4, p.PI/4);

    this.heightRatio = this.pgA.width * this.stripH/this.pgA.height;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;

    let a0, b0;
    let a1, b1;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }

      a0 = 0;
      b0 = this.xRotMax;
      a1 = 0;
      b1 = this.zRotMax;
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = 0;
        b0 = this.xRotMax/2;
        a1 = 0;
        b1 = this.zRotMax/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = this.xRotMax/2;
        b0 = this.xRotMax;
        a1 = this.zRotMax/2;
        b1 = this.zRotMax;
      }
    }
    
    this.xRot = p.map(tk1, 0, 1, a0, b0);
    this.zRot = p.map(tk1, 0, 1, a1, b1);
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.rotateX(this.xRot);
      p.rotateZ(this.zRot);

      for(var m = 0; m < 2; m++){
        if(m==0){
          p.texture(this.pgA);
        } else {
          p.texture(this.pgB);
        }

        p.beginShape(TRIANGLE_STRIP);
          for(var n = 0; n <= this.res; n++){
            var x = p.cos(n * this.ang + p.PI) * (this.radius - m/2);
            var z = p.sin(n * this.ang + p.PI) * (this.radius - m/2);
            var yTop = -this.stripH/2 + m;
            var yBot = this.stripH/2 - m;
  
            var thisDist = (n * this.sec + this.ticker * 2 + 600) % this.heightRatio;
            var u = p.map(thisDist, 0, this.heightRatio, 1, 0);
  
            p.vertex(x, yTop, z, u, 0);
            p.vertex(x, yBot, z, u, 1);
  
            if(thisDist > this.heightRatio - this.sec){
              p.vertex(x, yTop, z, 1, 0);
              p.vertex(x, yBot, z, 1, 1);
            }
          }
        p.endShape();
      }

    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp)) + 200;
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.1));
    this.pgA.background(bkgdColor);
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.text(this.inp, this.pgA.width/2, thisAdjust);

    this.pgB = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.1));
    this.pgB.background(foreColor);
    this.pgB.fill(bkgdColor);
    this.pgB.noStroke();
    this.pgB.textSize(this.pgTextSize);
    this.pgB.textAlign(p.CENTER);
    this.pgB.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgB.text(this.inp, this.pgA.width/2, thisAdjust);
  }

  removeGraphics(){
    this.pgA.remove();
    this.pgB.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_riseSun.js ---
class RiseSun {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA, this.pgB;
    this.drawTextures();

    this.res = 50;
    this.ang = 2*p.PI/this.res;
    this.radiusX = p.height * 1.25;
    this.radiusY = p.height;

    this.xCenter = p.width/2;
    this.direction = 1;
    if(p.random(10) < 5){
      this.direction = 1;
    } else {
      this.direction = -1;      
    }
    this.direction2 = 1;
    if(p.random(10) < 5){
      this.direction2 = 1;
    } else {
      this.direction2 = -1;      
    }
    this.yCenterStart = (p.height/2 + this.direction * (this.radiusY - 25));
    this.yCenterEnd = (this.yCenterStart + 100);
  
    this.ticker = 0;

    this.ramp = ramp_;
  }

  update(){
    // this.yCenter += (this.direction2 * 0.5);
    // this.yCenter += 0.5;

    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;
    var a0, b0;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }
      a0 = this.yCenterStart;
      b0 = this.yCenterEnd;
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = this.yCenterStart;
        b0 = (this.yCenterStart + this.yCenterEnd)/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = (this.yCenterStart + this.yCenterEnd)/2;
        b0 = this.yCenterEnd;
      }
    }

    this.yCenter = p.map(tk1, 0, 1, a0, b0);
  }

  display(){
    p.image(this.pgA, 0, 0);

    p.texture(this.pgB);
    // p.stroke(0, 0, 255);

    p.beginShape(TRIANGLE_FAN);
      // p.vertex(this.xCenter, this.yCenter);
      for(var n = 0; n < this.res; n++){
        var x = this.xCenter + p.cos(n*this.ang) * this.radiusX;
        var y = this.yCenter + p.sin(n*this.ang) * this.radiusY;

        var u = p.map(x, 0, p.width, 0, 1);
        var v = p.map(y, 0, p.height, 0, 1);

        p.vertex(x,y,u,v);
      }
    p.endShape();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    this.pgA = p.createGraphics(p.width, p.height);
    this.pgA.background(foreColor);
    this.pgA.noStroke();
    this.pgA.fill(bkgdColor);
    this.pgA.textFont(currentFont);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textSize(this.pgTextSize);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.translate(p.width/2, thisAdjust);
    this.pgA.text(this.inp, 0, 0);

    this.pgB = p.createGraphics(p.width, p.height);
    this.pgB.background(bkgdColor);
    this.pgB.noStroke();
    this.pgB.fill(foreColor);
    this.pgB.textFont(currentFont);
    this.pgB.textAlign(p.CENTER);
    this.pgB.textSize(this.pgTextSize);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgB.translate(p.width/2, thisAdjust);
    this.pgB.text(this.inp, 0, 0);
  }

  removeGraphics(){
    this.pgA.remove();
    this.pgB.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_shutters.js ---
class Shutters {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xSpots = [];
    this.findXpos();

    this.pg = [];
    this.makeTextures();

    this.ticker = 0;

    this.shutterAnim = [];
    this.shutterYanim = [];

    this.ramp = ramp_;

    this.pacer = (sceneLength/2)/this.inp.length;
  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      var tk00 = p.constrain(this.ticker - this.pacer*n, 0, sceneLength);
      var tk0 = p.map(tk00, 0, sceneLength, 0, 1.0);

      var tk1;
      if(this.ramp==0){
        tk1 = easeOutQuad(tk0);
      } else if(this.ramp==1){
        tk1 = easeInOutQuad(tk0);
      }

      this.shutterAnim[n] = p.map(tk1, 0, 1, this.pg[0].height, 0);
      this.shutterYanim[n] = p.map(tk1, 0, 1, -this.pg[0].height/2, 0);
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, p.height/2);
      p.translate(0, -this.pg[0].height/2);

      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(this.xSpots[n], this.shutterYanim[n]);

          p.texture(this.pg[n]);
          
          var vTop = 0;
          var vBot = p.map(this.pg[n].height - this.shutterAnim[n], 0, this.pg[n].height, 0, 1);

          p.beginShape(TRIANGLE_STRIP);
            p.vertex(0, this.shutterAnim[n], 0, vTop);
            p.vertex(0, this.pg[n].height, 0, vBot);
            p.vertex(this.pg[n].width, this.shutterAnim[n], 1, vTop);
            p.vertex(this.pg[n].width, this.pg[n].height, 1, vBot);
          p.endShape();
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);

    for(var n = 0; n < this.inp.length; n++){

      var repeatSize = p.round(p.textWidth(this.inp.charAt(n)));
    
      this.pg[n] = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
      this.pg[n].background(bkgdColor);
    
      this.pg[n].fill(foreColor);
      this.pg[n].noStroke();
      this.pg[n].textSize(this.pgTextSize);
      this.pg[n].textAlign(p.CENTER);
      this.pg[n].textFont(currentFont);
      var thisAdjust = this.pg[n].height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
      this.pg[n].text(this.inp.charAt(n), this.pg[n].width/2, thisAdjust);
    }
  }

  removeGraphics(){
    for(var n = 0; n < this.inp.length; n++){
      this.pg[n].remove();
    }
  }
}


// --- INLINED DEPENDENCY: js/0_shutters2.js ---
class Shutters2 {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xSpots = [];
    this.findXpos();

    this.pg = [];
    this.makeTextures();

    this.ticker = 0;

    this.xAnim = [];

    this.shutterAnim = [];

    this.ramp = ramp_;

    this.pacer = (sceneLength/3)/this.inp.length;
  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      var tk00 = p.constrain(this.ticker - this.pacer*n, 0, sceneLength);
      var tk0 = p.map(tk00, 0, sceneLength, 0, 1.0);
      
      var tk1;
      var a0, b0;
      var a1, b1;
      if(accelMode == 0){
        if(this.ramp==0){
          tk1 = easeOutQuad(tk0);
        } else if(this.ramp==1){
          tk1 = easeInOutQuad(tk0);
        }
        a0 = 0;
        b0 = this.pg[n].width;
        a1 = p.width/2;
        b1 = this.xSpots[n];
      } else {
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a0 = 0;
          b0 = this.pg[n].width;
          a1 = p.width/2;
          b1 = this.xSpots[n];
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a0 = this.pg[n].width;
          b0 = 0;
          a1 = this.xSpots[n];
          b1 = this.xSpots[n];
        }
      }

      this.shutterAnim[n] = p.map(tk1, 0, 1, a0, b0);
      this.xAnim[n] = p.map(tk1, 0, 1, a1, b1); 
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, p.height/2);
      p.translate(0, -this.pg[0].height/2);

      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(this.xAnim[n], 0);

          p.texture(this.pg[n]);
          p.stroke(0, 0, 255);

          var uLeft = 0;
          var uRight = p.map(this.pg[n].width - this.shutterAnim[n], 0, this.pg[n].width, 1, 0);
          // var uRight =1;

          p.beginShape(TRIANGLE_STRIP);
            p.vertex(0, 0, uLeft, 0);
            p.vertex(0, this.pg[n].height, uLeft, 1);
            p.vertex(this.shutterAnim[n], 0, uRight, 0);
            p.vertex(this.shutterAnim[n], this.pg[n].height, uRight, 1);
          p.endShape();
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);

    for(var n = 0; n < this.inp.length; n++){
      var repeatSize = p.round(p.textWidth(this.inp.charAt(n)));
    
      this.pg[n] = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
      this.pg[n].background(bkgdColor);
    
      this.pg[n].fill(foreColor);
      this.pg[n].noStroke();
      this.pg[n].textSize(this.pgTextSize);
      this.pg[n].textAlign(p.CENTER);
      this.pg[n].textFont(currentFont);
      var thisAdjust = this.pg[n].height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
      this.pg[n].text(this.inp.charAt(n), this.pg[n].width/2, thisAdjust);
    }
  }

  removeGraphics(){
    for(var n = 0; n < this.inp.length; n++){
      this.pg[n].remove();
    }
  }
}


// --- INLINED DEPENDENCY: js/0_shuttersEE.js ---
class ShuttersEE {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xSpots = [];
    this.findXpos();

    this.pg = [];
    this.makeTextures();

    this.ticker = 0;

    this.shutterAnim = [];
    this.shutterAnimBot = [];
    this.shutterYanim = [];

    this.ramp = ramp_;

    this.pacer = (sceneLength/2)/this.inp.length;
  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      var tk00 = p.constrain(this.ticker - this.pacer*n, 0, sceneLength);
      var tk0 = p.map(tk00, 0, sceneLength, 0, 1.0);

      var tk1;
      var a0, b0;
      var a1, b1;
      var a2, b2;
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = this.pg[n].height;
        b0 = 0;
        a1 = this.pg[n].height;
        b1 = this.pg[n].height;

        a2 = this.pg[0].height/2;
        b2 = 0;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = 0;
        b0 = 0;
        a1 = this.pg[n].height;
        b1 = 0;

        a2 = 0;
        b2 = -this.pg[0].height/2;
      }

      this.shutterAnim[n] = p.map(tk1, 0, 1, a0, b0);
      this.shutterAnimBot[n] = p.map(tk1, 0, 1, a1, b1);
      this.shutterYanim[n] = p.map(tk1, 0, 1, a2, b2);
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, p.height/2);
      p.translate(0, -this.pg[0].height/2);

      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(this.xSpots[n], this.shutterYanim[n]);

          p.texture(this.pg[n]);
          
          var vTop = p.map(this.shutterAnimBot[n], 0, this.pg[n].height, 1, 0);
          var vBot = p.map(this.pg[n].height - this.shutterAnim[n], 0, this.pg[n].height, 0, 1);

          p.beginShape(TRIANGLE_STRIP);
            p.vertex(0, this.shutterAnim[n], 0, vTop);
            p.vertex(0, this.shutterAnimBot[n], 0, vBot);
            p.vertex(this.pg[n].width, this.shutterAnim[n], 1, vTop);
            p.vertex(this.pg[n].width, this.shutterAnimBot[n], 1, vBot);
          p.endShape();
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  makeTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);

    for(var n = 0; n < this.inp.length; n++){

      var repeatSize = p.round(p.textWidth(this.inp.charAt(n)));
    
      this.pg[n] = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
      this.pg[n].background(bkgdColor);
    
      this.pg[n].fill(foreColor);
      this.pg[n].noStroke();
      this.pg[n].textSize(this.pgTextSize);
      this.pg[n].textAlign(p.CENTER);
      this.pg[n].textFont(currentFont);
      var thisAdjust = this.pg[n].height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
      this.pg[n].text(this.inp.charAt(n), this.pg[n].width/2, thisAdjust);
    }
  }

  removeGraphics(){
    for(var n = 0; n < this.inp.length; n++){
      this.pg[n].remove();
    }
  }
}


// --- INLINED DEPENDENCY: js/0_slotMachine.js ---
class SlotMachine {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.repeats = 2;
    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xSpots = [];
    this.findXpos();

    this.yAnim = [];
    this.yTarget = [];
    this.yStart = 50;
    this.yMin = 0;
    this.yMax = -150;
    this.setYtarget();

    this.ticker = 0;

    this.blPadding = 25;
    this.blSpacing = (p.width - 2*this.blPadding)/(keyArray.length - 1);

    this.ramp = ramp_;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    for(var n = 0; n < this.inp.length; n++){
      var tk1;
      var a0, b0;
      if(accelMode == 0){
        if(this.ramp==0){
          tk1 = easeOutCirc(tk0);
        } else if(this.ramp==1){
          tk1 = easeInCirc(tk0);
        }
        a0 = this.yStart;
        b0 = this.yTarget[n];
      } else {
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a0 = this.yStart;
          b0 = (this.yStart + this.yTarget[n])/2;
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a0 = (this.yStart + this.yTarget[n])/2;
          b0 = this.yTarget[n];
        }
      }

      this.yAnim[n] = p.map(tk1, 0, 1, a0, b0);
    }
  }

  display(){
    p.background(bkgdColor);
    p.push();
      p.translate(0, (this.pgTextSize * thisFontAdjust)/2);
      p.textSize(this.pgTextSize);
      p.textAlign(p.LEFT);

      p.fill(foreColor);
      p.noStroke();

      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.translate(this.xSpots[n], p.height/2);
          p.translate(0, this.yAnim[n]);

          p.translate(0, -this.repeats*(this.pgTextSize*0.8)/2);
          for(var p = 0; p < this.repeats; p++){
            p.text(this.inp.charAt(n), 0, p * this.pgTextSize * 0.8);
          }
        p.pop();
      }
    p.pop();
  }

  findXpos(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);
    var fullSize = p.textWidth(this.inp);
    var xStart = p.width/2 - fullSize/2;

    for(var n = 0; n < this.inp.length; n++){
      var thisLetterWidth = p.textWidth(this.inp.charAt(n));
      var upUntilWidth = p.textWidth(this.inp.slice(0,n+1));
      var difference = upUntilWidth - thisLetterWidth;
      this.xSpots[n] = xStart + difference;
    }
  }

  setYtarget(){
    for(var n = 0; n < this.inp.length; n++){
      this.yTarget[n] = p.random(-this.pgTextSize*2, this.pgTextSize*2);;
    }
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }

    this.repeats = p.round((p.height*2)/this.pgTextSize) + 5;
  }

  removeGraphics(){
    
  }  
}


// --- INLINED DEPENDENCY: js/0_snap.js ---
class Snap {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();
    
    this.xKern = [];
    this.xWidths = [];
    this.xScaleMax = 0.2;
    this.xScale = [];
    this.xShear = [];
    this.xShearMax = -p.PI/8;
    this.findSpacing();

    this.ticker = 0;

    this.ramp = ramp_;

    this.pacer = (sceneLength/1.5)/this.inp.length;

  }

  update(){
    this.ticker ++;

    for(var n = 0; n < this.inp.length; n++){
      var tk00 = p.constrain(this.ticker - n*this.pacer, 0, sceneLength);
      var tk0 = p.map(tk00, 0, sceneLength, 0, 1);
      var tk1;
      var a0, b0;
      var a1, b1;
      if(accelMode == 0){
        if(this.ramp==0){
          tk1 = easeOutQuad(tk0);
        } else if(this.ramp==1){
          tk1 = easeInQuad(tk0);
        }
        a0 = this.xScaleMax;
        b0 = 1;
        a1 = this.xShearMax;
        b1 = 0;
      } else {
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a0 = this.xScaleMax;
          b0 = (this.xScaleMax + 1)/2;
          a1 = this.xShearMax;
          b1 = this.xShearMax/2;
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a0 = (this.xScaleMax + 1)/2;
          b0 = 1;
          a1 = this.xShearMax/2;
          b1 = 0;
        }
      }

      this.xScale[n] = p.map(tk1, 0, 1, a0, b0);
      this.xShear[n] = p.map(tk1, 0, 1, a1, b1);

      this.xWidths[n] = p.textWidth(this.inp.charAt(n)) * this.xScale[n];
    }

    var fullSize = 0;
    for(var n = 0; n < this.inp.length-1; n++){
      this.xKern[n] = this.xWidths[n]/2 + this.xWidths[n+1]/2;
      fullSize += this.xKern[n];
    }
    this.xKern[this.inp.length-1] = 0;

    this.xStart = -fullSize/2;
  }

  display(){
    p.background(bkgdColor);

    p.fill(foreColor);
    p.noStroke();

    p.push();
      p.translate(p.width/2, p.height/2);
      p.translate(this.xStart, 0);
      p.translate(0, this.pgTextSize * thisFontAdjust/2);

      p.textFont(currentFont);
      p.textSize(this.pgTextSize);
      p.textAlign(p.CENTER);
      for(var n = 0; n < this.inp.length; n++){
        p.push();
          p.fill(foreColor);
          p.noStroke();
          p.shearX(this.xShear[n]);
          p.scale(this.xScale[n], 1);
          p.text(this.inp.charAt(n), 0, 0);
        p.pop();
        p.translate(this.xKern[n], 0);
      }
    p.pop();
  }

  findSpacing(){
    p.textFont(currentFont);
    p.textSize(this.pgTextSize);

    for(var n = 0; n < this.inp.length; n++){
      this.xWidths[n] = p.textWidth(this.inp.charAt(n));
    }
    var fullSize = 0;
    for(var n = 0; n < this.inp.length-1; n++){
      this.xKern[n] = this.xWidths[n]/2 + this.xWidths[n+1]/2;
      fullSize += this.xKern[n];
    }
    this.xKern[this.inp.length-1] = 0;

    this.xStart = -fullSize/2;
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  removeGraphics(){

  }
}


// --- INLINED DEPENDENCY: js/0_split.js ---
class Split {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA;
    this.drawTextures();

    this.direction = 1;
    if(p.random(10) < 5){
      this.direction = -1;
    }

    this.ticker = 0;

    this.ramp = ramp_;

    this.animShear = 0;
    this.animShearMax = this.direction * p.PI/8;

    this.splitR = [];
    this.splitR[0] = 0;
    this.splitR[1] = this.splitR[0] + p.random(0.1, 0.4);
    this.splitR[2] = this.splitR[1] + p.random(0.1, 0.6);
    this.splitR[3] = 1;


    this.animX = [];
    this.animXmax = [];
    this.animXmax[0] = this.direction * -100;
    this.animXmax[1] = this.direction * 50;
    this.animXmax[2] = this.direction * 25;
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }

      this.animShear = p.map(tk1, 0, 1, 0, this.animShearMax);

      for(var m = 0; m < 3; m++){
        this.animX[m] = p.map(tk1, 0, 1, 0, this.animXmax[m]);
      }
    } else {
      let a, b;
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a = 0;
        b = this.animShearMax/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a = this.animShearMax/2;
        b = this.animShearMax;
      }
      this.animShear = p.map(tk1, 0, 1, a, b);

      for(var m = 0; m < 3; m++){
        let a, b;
        if(tk0 < 0.5){
          var tk0b = p.map(tk0, 0, 0.5, 0, 1);
          tk1 = easeOutCirc(tk0b);
          a = 0;
          b = this.animXmax[m]/2;
        } else {
          var tk0b = p.map(tk0, 0.5, 1, 0, 1);
          tk1 = easeInCirc(tk0b);
          a = this.animXmax[m]/2;
          b = this.animXmax[m];
        }
        this.animX[m] = p.map(tk1, 0, 1, a, b);
      }
    }
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);

      p.scale(0.75);
      p.shearX(this.animShear);
      p.translate(-this.pgA.width/2, -this.pgA.height/2);

      p.texture(this.pgA);

      for(var m = 0; m < 3; m++){
        p.translate(this.animX[m], 0);
        p.beginShape(TRIANGLE_STRIP);
          p.vertex(0, this.pgA.height * this.splitR[m], 0, this.splitR[m]);
          p.vertex(0, this.pgA.height * this.splitR[m + 1], 0, this.splitR[m + 1]);
          p.vertex(this.pgA.width, this.pgA.height * this.splitR[m], 1, this.splitR[m]);
          p.vertex(this.pgA.width, this.pgA.height * this.splitR[m + 1], 1, this.splitR[m + 1]);
        p.endShape();
      }
    p.pop();

  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
    this.pgA.background(bkgdColor);
  
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.text(this.inp, this.pgA.width/2, thisAdjust);
  }

  removeGraphics(){
    this.pgA.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_starburst.js ---
class Starburst {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA, this.pgB;
    this.drawTextures();

    this.res = p.round(p.random(2,10)) * 4;
    this.ang = 2*p.PI/this.res;
    this.radiusX;
    this.radiusY;
    this.radiusMinX = 0;
    this.radiusMaxX = p.width/2;
    this.radiusMinY = 0;
    this.radiusMaxY = p.height/2;
    this.radiusXinner = p.width/8;
    this.radiusYinner = p.height/8;

    this.xCenter = p.width/2;
    this.yCenter = p.height/2;
    this.yMin = p.height * 3/4;
    this.yMax = p.height/2

    this.rotZ = 0
    this.rotZmax = p.random(-p.PI, p.PI);

    this.ticker = 0;

    this.ramp = ramp_;
  }

  update(){
    // this.yCenter += (this.direction2 * 0.5);
    // this.yCenter += 0.5;

    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;
    var a0, b0;
    var a1, b1;
    var a2, b2;
    var a3, b3;
    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }
      a0 = this.radiusMinX;
      b0 = this.radiusMaxX;
      a1 = this.radiusMinY;
      b1 = this.radiusMaxY;
      a2 = 0;
      b2 = this.rotZmax;
      a3 = this.yMin;
      b3 = this.yMax;
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        a0 = this.radiusMinX;
        b0 = (this.radiusMinX + this.radiusMaxX)/2;
        a1 = this.radiusMinY;
        b1 = (this.radiusMinY + this.radiusMaxY)/2;
        a2 = 0;
        b2 = this.rotZmax/2;
        a3 = this.yMin;
        b3 = (this.yMin + this.yMax)/2;
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        a0 = (this.radiusMinX + this.radiusMaxX)/2;
        b0 = this.radiusMaxX;
        a1 = (this.radiusMinY + this.radiusMaxY)/2;
        b1 = this.radiusMaxY;
        a2 = this.rotZmax/2;
        b2 = this.rotZmax;
        a3 = (this.yMin + this.yMax)/2;
        b3 = this.yMax;
      }
    }

    this.radiusX = p.map(tk1, 0, 1, a0, b0);
    this.radiusY = p.map(tk1, 0, 1, a1, b1);
    this.rotZ = p.map(tk1, 0, 1, 0, a2, b2);

    this.yCenter = p.map(tk1, 0, 1, a3, b3);
  }

  display(){
    p.image(this.pgA, 0, 0);

    p.texture(this.pgB);
    // p.stroke(0, 0, 255);

    p.beginShape(TRIANGLE_FAN);
      p.vertex(this.xCenter, this.yCenter, 0.5, 0.5);
      for(var n = 0; n <= this.res; n++){
        var nowRadiusX = this.radiusXinner;
        var nowRadiusY = this.radiusYinner;
        if(n%2 == 0){
          nowRadiusX = this.radiusX;
          nowRadiusY = this.radiusY;
        }

        var x = this.xCenter + p.cos(n*this.ang + this.rotZ) * nowRadiusX;
        var y = this.yCenter + p.sin(n*this.ang + this.rotZ) * nowRadiusY;

        var u = p.map(x, 0, p.width, 0, 1);
        var v = p.map(y, 0, p.height, 0, 1);

        p.vertex(x,y,u,v);
      }
    p.endShape();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    this.pgA = p.createGraphics(p.width, p.height);
    this.pgA.background(foreColor);
    this.pgA.noStroke();
    this.pgA.fill(bkgdColor);
    this.pgA.textFont(currentFont);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textSize(this.pgTextSize);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.translate(p.width/2, thisAdjust);
    this.pgA.text(this.inp, 0, 0);

    this.pgB = p.createGraphics(p.width, p.height);
    this.pgB.background(bkgdColor);
    this.pgB.noStroke();
    this.pgB.fill(foreColor);
    this.pgB.textFont(currentFont);
    this.pgB.textAlign(p.CENTER);
    this.pgB.textSize(this.pgTextSize);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgB.translate(p.width/2, thisAdjust);
    this.pgB.text(this.inp, 0, 0);
  }

  removeGraphics(){
    this.pgA.remove();
    this.pgB.remove();
  }
}


// --- INLINED DEPENDENCY: js/0_twist.js ---
class Twist {
  constructor(ramp_, inp_){
    this.inp = inp_;

    this.pgTextSize = 2;
    this.findTextSize();

    this.pgA;
    this.drawTextures();
  
    this.ticker = 0;

    this.ramp = ramp_;

    this.yOutside = (p.height - this.pgA.height)/2;

    this. d = 1;
    if(p.random(10) < 5){
      this.d = -1;
    }

    this.res = 300;
    this.tl = createVector(0, 0);
    this.bl = createVector(0, this.pgA.height);
    this.tml = createVector(this.pgA.width/3, 0);
    this.bml = createVector(this.pgA.width/3, this.pgA.height);
    this.tmr = createVector(this.pgA.width * 2/3, 0);
    this.bmr = createVector(this.pgA.width * 2/3, this.pgA.height);
    this.tr = createVector(this.pgA.width, 0);
    this.br = createVector(this.pgA.width, this.pgA.height);
  }

  update(){
    this.ticker ++;

    var tk0 = p.map(this.ticker, 0, sceneLength, 0, 1);
    var tk1;
    var a0, b0;
    var a1, b1;

    if(accelMode == 0){
      if(this.ramp==0){
        tk1 = easeOutCirc(tk0);
      } else if(this.ramp==1){
        tk1 = easeInCirc(tk0);
      }
      if(this.d == 1){
        a0 = 0;
        b0 = -this.yOutside;
        a1 = this.pgA.height;
        b1 = this.pgA.height + this.yOutside;
      } else {
        a0 = this.pgA.height;
        b0 = this.pgA.height + this.yOutside;
        a1 = 0;
        b1 = this.d * this.yOutside;
      }
    } else {
      if(tk0 < 0.5){
        var tk0b = p.map(tk0, 0, 0.5, 0, 1);
        tk1 = easeOutCirc(tk0b);
        if(this.d == 1){
          a0 = 0;
          b0 = -this.yOutside/2;
          a1 = this.pgA.height;
          b1 = this.pgA.height + this.yOutside/2;
        } else {
          a0 = this.pgA.height;
          b0 = this.pgA.height + this.yOutside/2;
          a1 = 0;
          b1 = (this.d * this.yOutside)/2;
        }
      } else {
        var tk0b = p.map(tk0, 0.5, 1, 0, 1);
        tk1 = easeInCirc(tk0b);
        if(this.d == 1){
          a0 = -this.yOutside/2;
          b0 = -this.yOutside;
          a1 = this.pgA.height + this.yOutside/2;
          b1 = this.pgA.height + this.yOutside;
        } else {
          a0 = this.pgA.height + this.yOutside/2;
          b0 = this.pgA.height + this.yOutside;
          a1 = (this.d * this.yOutside)/2;
          b1 = this.d * this.yOutside;
        }
      }
    }

    if(this.d == 1){
      this.tl.y = p.map(tk1, 0, 1, a0, b0);
      this.tml.y = this.tl.y;
      this.bmr.y = p.map(tk1, 0, 1, a1, b1);
      this.br.y = this.bmr.y;
    } else {
      this.bl.y = p.map(tk1, 0, 1, a0, b0);
      this.bml.y = this.bl.y;
      this.tmr.y = p.map(tk1, 0, 1, a1, b1);
      this.tr.y = this.tmr.y;
    }
  }

  display(){
    p.background(bkgdColor);

    p.push();
      p.translate(p.width/2, p.height/2);
      p.translate(-this.pgA.width/2, -this.pgA.height/2);

      p.texture(this.pgA);
      p.stroke(foreColor);
      // p.fill(bkgdColor);

      p.beginShape(TRIANGLE_STRIP);
        for(var n = 0; n <= this.res; n++){
          let t = n / this.res;

          let xTop = p.bezierPoint(this.tl.x, this.tml.x, this.tmr.x, this.tr.x, t);
          let yTop = p.bezierPoint(this.tl.y, this.tml.y, this.tmr.y, this.tr.y, t);

          let xBot = p.bezierPoint(this.bl.x, this.bml.x, this.bmr.x, this.br.x, t);
          let yBot = p.bezierPoint(this.bl.y, this.bml.y, this.bmr.y, this.br.y, t);

          var u = p.map(xTop, 0, this.pgA.width, 0, 1);

          p.vertex(xTop, yTop, u, 0);
          p.vertex(xBot, yBot, u, 1);
        }
      p.endShape();
    p.pop();
  }

  findTextSize(){
    var measured = 0;
    while(measured < p.width){
      p.textSize(this.pgTextSize)
      p.textFont(currentFont);
      measured = p.textWidth(this.inp);

      this.pgTextSize += 2;
    }

    if(this.pgTextSize * thisFontAdjust > p.height * 7/8){
      this.pgTextSize = (p.height * 7/8)/thisFontAdjust;
    }
  }

  drawTextures(){
    p.textSize(this.pgTextSize);
    p.textFont(currentFont);
    var repeatSize = p.round(p.textWidth(this.inp));
  
    this.pgA = p.createGraphics(repeatSize, this.pgTextSize * (thisFontAdjust + 0.05));
    this.pgA.background(bkgdColor);
  
    this.pgA.fill(foreColor);
    this.pgA.noStroke();
    this.pgA.textSize(this.pgTextSize);
    this.pgA.textAlign(p.CENTER);
    this.pgA.textFont(currentFont);
    var thisAdjust = this.pgA.height/2 + this.pgTextSize * thisFontAdjust/2 + this.pgTextSize * thisFontAdjustUp;
    this.pgA.text(this.inp, this.pgA.width/2, thisAdjust);
  }

  removeGraphics(){
    this.pgA.remove();
  }
}


// --- INLINED DEPENDENCY: js/update.js ---
function setText(val){
  var enteredText = inpText;
  keyText = enteredText;
  keyArray = enteredText.match(/[^\r\n]+/g);

  if(keyArray == null){
    keyArray = "";
  }

  selector = 0;
  pickScene();
}

function setSceneLength(val){
  sceneLength = int(val);
}

function setFont(val){
  currentFont = tFont[val];
  if(val == 0){
    thisFontAdjust = 0.7;
    thisFontAdjustUp = 0;
  } else if(val == 1){
    thisFontAdjust = 0.7;
    thisFontAdjustUp = 0;
  } else if(val == 2){
    thisFontAdjust = 0.75;
    thisFontAdjustUp = 0;
  } else if(val == 3){
    thisFontAdjust = 0.7;
    thisFontAdjustUp = 0;
  } else if(val == 4){
    thisFontAdjust = 0.75;
    thisFontAdjustUp = 0;
  } else if(val == 5){
    thisFontAdjust = 0.775;
    thisFontAdjustUp = 0;
  } else if(val == 6){
    thisFontAdjust = 1.05;
    thisFontAdjustUp = -0.315;
  }
}

function setSelectMode(val){
  displayMode = val;
  if(displayMode == 1){        // CLOCK
    sceneLength = p.floor(p.frameRate()) + 2;
  }
}

function setAccelMode(val){
  accelMode = val;
}

function setForeColor(val){
  foreColor = p.color(val);
}

function setBkgdColor(val){
  bkgdColor = p.color(val);
}

function clearAllScenes(){
  for(var n = 0; n < flashCount; n++){
    sceneOn[n] = false;
  }
  sceneCount = 0;
}

function setScene(val){
  sceneOn[val] = !sceneOn[val];

  sceneCount = 0;
  for(var n = 0; n < flashCount; n++){
    if(sceneOn[n]){
      sceneCount++;
    }
  }
}

function setSceneRepeats(val){
  sceneRepeats = p.round(val);
}

function toggleColorSwap(val){
  colorSwapOn = Boolean(val);
}

function sizeSaveChange(val){
  saveMode = val;
  resizeForPreview();
}


    // --- ORIGINAL SKETCH.JS CODE ---
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
    tFont[0] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[1] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[2] = p.loadFont("../assets/Inter-Medium.ttf");
    tFont[3] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[4] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[5] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
    tFont[6] = p.loadFont("../assets/Cairo-Black.ttf");
  }

  currentFont = tFont[0];
  thisFontAdjust = 0.7;
  thisFontAdjustUp = 0;
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h, p.WEBGL);

  for(var n = 0; n < flashCount; n++){
    sceneOn[n] = true;
  }

  cwidth = p.width;
  cheight = p.height;
  thisDensity = p.pixelDensity();

  bkgdColor = p.color('#ffffff');
  foreColor = p.color('#000000');
  colorA[0] = p.color('#f25835');
  colorA[1] = p.color('#0487d9');
  colorA[2] = p.color('#014029');
  colorA[3] = p.color('#f2ae30');
  colorA[4] = p.color('#f2aec1');

  p.frameRate(frate);
  p.textureMode(NORMAL);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "THE\nCOLLECTIVE\nPOWER\nOF\nTINY\nMOMENTS";
  sceneLength = 30;
  thisFont = 0;
  colorSwapOn = true;

  foreColor = p.color('#000000');
  bkgdColor = p.color('#ffffff');

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = p.millis();
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
  if (settings.foreColor !== undefined) foreColor = p.color(settings.foreColor);
  if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);

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
    lastTextTime = p.millis();
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
  if (data.foreColor !== undefined) foreColor = p.color(data.foreColor);
  if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);

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
    if (p.millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = p.millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
      setText(inpText);
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = p.millis();
        setText(inpText);
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = p.millis();
        setText(inpText);
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
  p.ortho(-p.width / 2, p.width / 2, -p.height / 2, p.height / 2, -10000, 10000);
  
  p.push();
  p.translate(-p.width/2, -p.height/2);

  if (mainFlash) {
    mainFlash.update();
    mainFlash.display();
  }
  p.pop();

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
    var rs0 = p.random(flashCount * 10);
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
        rs0 = p.random(flashCount * 10);
      }
    }
  }

  if(colorSwapOn){
    if(p.random(10) < 3){
      var colorAStr = rgbToHex(foreColor.levels[0], foreColor.levels[1], foreColor.levels[2]);
      var colorBStr = rgbToHex(bkgdColor.levels[0], bkgdColor.levels[1], bkgdColor.levels[2]);
  
      foreColor = p.color(colorBStr);
      bkgdColor = p.color(colorAStr);
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
  p.resizeCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  cwidth = p.width;
  cheight = p.height;
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
