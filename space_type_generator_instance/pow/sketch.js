// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "reset": {
        "p.text": "AND\nBEGIN\nAGAIN",
        "fontSelect": 0,
        "pgTextSize": 250,
        "fillColor": "#ffffff",
        "strokeColor": "#000000",
        "bkgdColor": "#f2B441",
        "coreSW": 2,
        "blastType": 0,
        "detailFactor": 0.7,
        "blastFactor": 1,
        "ratioFactor": 2,
        "spurMessyToggle": false,
        "mousePopOn": true
    }
};


// --- INLINED DEPENDENCY: js/class_0mousePop.js ---
class MousePop {
  constructor(x, y){
    this.x = x;
    this.y = y;

    this.origVec = createVector(this.x, this.y);

    this.debrisCount;
    this.currentVec = [];
    this.targetVec = [];
    this.animWindowDebris = [];
    this.tickerDebris = [];
    this.w = [];
    this.h = [];
    this.ang = [];

    this.lineCount;
    this.p1 = [];
    this.p1target = [];
    this.p2 = [];
    this.p2target = [];
    this.tickerLine = [];
    this.animWindowLine = [];

    this.refresh(this.x, this.y);
  }

  runBottom(){
    this.update();
    this.displayLine();
  }

  runTop(){
    this.displayDebris();
  }

  update(){
    for(var m = 0; m < this.debrisCount; m++){
      if(this.tickerDebris[m] < 0){
        this.currentVec[m] = this.origVec;
      } else if(this.tickerDebris[m] < this.animWindowDebris[m]){
        var tk0 = p.map(this.tickerDebris[m], 0, this.animWindowDebris[m], 0, 1);

        this.currentVec[m] = p5.Vector.lerp(this.origVec, this.targetVec[m], easeOutExpo(tk0))
      } else {
        this.currentVec[m] = this.targetVec[m];
      }
      this.tickerDebris[m] ++;
    }

    for(var m = 0; m < this.lineCount; m++){
      if(this.tickerLine[m] < 0){
        this.p1[m] = this.origVec;
        this.p2[m] = this.origVec;
      } else if(this.tickerLine[m] < this.animWindowLine[m]){
        var tk0 = p.map(this.tickerLine[m], 0, this.animWindowLine[m], 0, 1);

        this.p1[m] = p5.Vector.lerp(this.origVec, this.p1target[m], easeOutExpo(tk0))
        this.p2[m] = p5.Vector.lerp(this.origVec, this.p2target[m], easeOutExpo(tk0))
      } else {
        this.p1[m] = this.p1target[m];
        this.p2[m] = this.p2target[m];
      }
      this.tickerLine[m] ++;
    }
  }

  displayDebris(){
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW);

    for(var m = 0; m < this.debrisCount; m++){
      p.push();
        p.translate(this.currentVec[m].x, this.currentVec[m].y);
        p.rotate(this.ang[m]);
        p.ellipse(0, 0, this.w[m], this.h[m]);
      p.pop();
    }
  }

  displayLine(){
    p.fill(bkgdColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW);

    for(var m = 0; m < this.lineCount; m++){
      p.line(this.p1[m].x, this.p1[m].y, this.p2[m].x, this.p2[m].y);
    }
  }

  refresh(x, y){
    this.origVec.set(x, y);

    this.debrisCount = int(p.random(8, 18));
    this.currentVec = [];
    this.targetVec = [];
    this.animWindowDebris = [];
    this.tickerDebris = [];
    this.w = [];
    this.h = [];
    this.ang = [];

    this.lineCount = int(p.random(20, 50));
    this.p1 = [];
    this.p1target = [];
    this.p2 = [];
    this.p2target = [];
    this.tickerLine = [];
    this.animWindowLine = [];

    var culmAng = 0;
    for(var m = 0; m < this.debrisCount; m++){
      var rAng = p.random(p.PI/4, p.PI/2);
      culmAng += rAng
      var rDist = p.random(10, p.width/2);

      var x_ = this.origVec.x + p.cos(culmAng) * rDist;
      var y_ = this.origVec.y + p.sin(culmAng) * rDist;
      this.targetVec[m] = createVector(x_, y_);

      this.animWindowDebris[m] = p.random(30, 60);
      this.tickerDebris[m] = 0;

      this.w[m] = p.random(7, 15);
      this.h[m] = this.w[m] * p.random(1, 2);
      this.ang[m] = culmAng + p.PI/2;
    }

    this.lineCount = int(p.random(10, 30));
    this.p1 = [];
    this.p1target = [];
    this.p2 = [];
    this.p2target = [];

    for(var m = 0; m < this.lineCount; m++){
      var rRad1 = p.random(60, 200);
      var rRad2 = rRad1 + p.random(100, 500);
      var rAng = p.random(p.PI/4, p.PI/2);
      culmAng += rAng;

      var x1_ = this.origVec.x + p.cos(culmAng) * rRad1;
      var y1_ = this.origVec.y + p.sin(culmAng) * rRad1;
      this.p1target[m] = createVector(x1_, y1_);

      var x2_ = this.origVec.x + p.cos(culmAng) * rRad2;
      var y2_ = this.origVec.y + p.sin(culmAng) * rRad2;
      this.p2target[m] = createVector(x2_, y2_);

      this.animWindowLine[m] = p.random(30, 60);
      this.tickerLine[m] = 0;
    }
  }
}

// --- INLINED DEPENDENCY: js/class_1all.js ---
class SplodeAll {
  constructor(){
    this.splodeLines = [];
    for(var m = 0; m < inputText.length; m++){
      this.splodeLines[m] = new SplodeLine(m);
    }
  }

  run(){
    for(var m = 0; m < inputText.length; m++){
      this.splodeLines[m].run();
    }
  }

  refresh(){
    for(var m = 0; m < inputText.length; m++){
      this.splodeLines[m].refresh();
    }
  }
}

// --- INLINED DEPENDENCY: js/class_2line.js ---
class SplodeLine {
  constructor(index){
    this.index = index;
    this.lineLength = inputText[this.index].length;
    this.splodeLetters = [];

    this.setOriginalOrder();
    this.setNewOrder();
  }

  run(){
    for(var m = 0; m < this.lineLength; m++){
      this.splodeLetters[m].run();
    }
  }

  setOriginalOrder(){
    p.textFont(tFont[fontSelect]);
    p.textSize(pgTextSize);

    // this.splodeLetters = [];
    for(var m = 0; m < this.lineLength; m++){
      var thisLetter = inputText[this.index].charAt(m);

      var thisX = 0;
      if(m > 0){
        var holdX = p.textWidth(inputText[this.index].substring(0, m + 1));
        thisX = holdX - p.textWidth(inputText[this.index].charAt(m));
      }
      var thisY = pgTextSize * pgTextFactor[fontSelect] * this.index;

      thisX += p.width/2 - p.textWidth(inputText[this.index])/2;
      // thisY += p.height/2 + pgTextSize * pgTextFactor[fontSelect]/2 - (inputText.length - 1) * pgTextSize * pgTextFactor[fontSelect]/2;
      thisY += p.height/2 - (inputText.length - 2) * pgTextSize * pgTextFactor[fontSelect]/2;

      if(blastType == 0){
        this.splodeLetters[m] = new SplodeLetter(m, thisLetter, thisX, thisY);
      } else if(blastType == 1){
        this.splodeLetters[m] = new SpurLetter(m, thisLetter, thisX, thisY);
      }
    }
  }

  setNewOrder(){
    var centerClick = 0;
    var xTest = p.width;

    for(var m = 0; m < this.lineLength; m++){
      var charW = p.textWidth(inputText[this.index].charAt(centerClick));
      var measureX = p.dist(orgX, 0, this.splodeLetters[m].x + charW/2, 0);

      if(measureX < xTest){
        centerClick = m;
        xTest = measureX;
      }
    }

    var holdOrder = [];
    for(var m = 0; m < this.splodeLetters.length; m++){
      holdOrder[m] = this.splodeLetters[m];
    }
    this.splodeLetters[this.lineLength - 1] = holdOrder[centerClick];

    var filled = 1;
    var direct = 1;
    var clicker = 1;
    var m = 2;
    while(filled < this.splodeLetters.length){
      if(holdOrder[centerClick + direct * clicker] != null){
        this.splodeLetters[this.lineLength - m] = holdOrder[centerClick + direct * clicker];

        filled ++;
        m ++;
      }

      if(direct == -1){
        clicker ++;
      }
      direct *= -1;
    }
  }

  refresh(){
    for(var m = 0; m < this.lineLength; m++){
      this.splodeLetters[m].refresh();
    }
    this.setOriginalOrder();
    this.setNewOrder();
  }
}

// --- INLINED DEPENDENCY: js/class_3letter.js ---
class SplodeLetter {
  constructor(index, letter, x, y){
    this.index = index;
    this.letter = letter;
    this.x = x;
    this.y = y;

    this.testPoints;
    this.points = [];
    this.module = [];
    this.burst = [];

    this.bumpMin, this.bumpMax, this.influMin, this.influMax;

    this.ticker = [];
    this.animWindow = 60;

    this.tickerSpeed = 2;

    this.solidToggle = true;

    this.isLetter = true;
    if(this.letter == ' '){
      this.isLetter = false;      
    }
    
    this.setValue();

    if(this.isLetter){
      this.createPoints();
      this.createModules();
    }
  }

  setValue(){
    this.bumpMin = coreScale * 2 * detailFactor;
    this.bumpMax = this.bumpMin * 5;
    this.influMin = coreScale * 2.5 * blastFactor;
    this.influMax = this.influMin * 12;
  }

  run(){
    this.update();
    if(this.solidToggle){
      this.runLetter();
    } else {
      this.runBuldge();
    }

    // this.runPoints();
  }

  runPoints(){
    for(var m = 0; m < this.testPoints.length; m++){
      p.fill(0);
      p.noStroke();
      
      p.ellipse(this.testPoints[m].x, this.testPoints[m].y, 5, 5); 
    }
  }

  update(){
    for(var p = 0; p < this.points.length; p++){
      for(var m = 0; m < this.module[p].length; m++){
        var tk0 = p.map(this.ticker[p][m], 0, this.animWindow, 0, 1);

        if(this.ticker[p][m] < 0){
          this.module[p][m].xPHactual = this.module[p][m].xPre;
          this.module[p][m].yPHactual = this.module[p][m].yPre;
          this.module[p][m].xHactual = this.module[p][m].x;
          this.module[p][m].yHactual = this.module[p][m].y;
        } else if(this.ticker[p][m] < this.animWindow){
          this.module[p][m].xPHactual = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].xPre, this.module[p][m].xPH);
          this.module[p][m].yPHactual = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].yPre, this.module[p][m].yPH);
          this.module[p][m].xHactual = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].x, this.module[p][m].xH);
          this.module[p][m].yHactual = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].y, this.module[p][m].yH);

          // this.module[p][m] = p5.Vector.lerp(this.anchs[p][m], this.handsTarget[p][m], easeOutExpo(tk0));
        } else {
          this.module[p][m].xPHactual = this.module[p][m].xPH;
          this.module[p][m].yPHactual = this.module[p][m].yPH;
          this.module[p][m].xHactual = this.module[p][m].xH;
          this.module[p][m].yHactual = this.module[p][m].yH;
        }

        this.ticker[p][m] += this.tickerSpeed;

        if(this.ticker[p][m] > 0){
          this.solidToggle = false;
        }
      }

      for(var m = 0; m < this.burst[p].length; m++){
        var tk0 = p.map(this.ticker[p][m], 0, this.animWindow, 0, 1);

        if(this.ticker[p][m] < 0){
          this.burst[p][m].x1mover = this.burst[p][m].x1start;
          this.burst[p][m].y1mover = this.burst[p][m].y1start;
          this.burst[p][m].x2mover = this.burst[p][m].x2start;
          this.burst[p][m].y2mover = this.burst[p][m].y2start;
        } else if(this.ticker[p][m] < this.animWindow){
          this.burst[p][m].x1mover = p.map(easeOutExpo(tk0), 0, 1, this.burst[p][m].x1start, this.burst[p][m].x1end);
          this.burst[p][m].y1mover = p.map(easeOutExpo(tk0), 0, 1, this.burst[p][m].y1start, this.burst[p][m].y1end);
          this.burst[p][m].x2mover = p.map(easeOutExpo(tk0), 0, 1, this.burst[p][m].x2start, this.burst[p][m].x2end);
          this.burst[p][m].y2mover = p.map(easeOutExpo(tk0), 0, 1, this.burst[p][m].y2start, this.burst[p][m].y2end);
        } else {
          this.burst[p][m].x1mover = this.burst[p][m].x1end;
          this.burst[p][m].y1mover = this.burst[p][m].y1end;
          this.burst[p][m].x2mover = this.burst[p][m].x2end;
          this.burst[p][m].y2mover = this.burst[p][m].y2end;
        }
      }
    }
  }

  runLetter(){
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW * 2);
    p.text(this.letter, this.x, this.y);
  }

  runBuldge(){
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW);

    p.beginShape();

    for(var p = 0; p < this.points.length; p++){
      
      if(p != 0){
        beginContour();
      }

      // p.beginShape();
      p.vertex(this.module[p][0].x, this.module[p][0].y);

      for(var m = 1; m < this.module[p].length; m++){
        if(this.module[p][m].a == 0){
          p.vertex(this.module[p][m].x, this.module[p][m].y);
        } else if(this.module[p][m].a == 1){
          p.bezierVertex(
            this.module[p][m].xPHactual, this.module[p][m].yPHactual,
            this.module[p][m].xHactual, this.module[p][m].yHactual,
            this.module[p][m].x, this.module[p][m].y
          )
        } else if(this.module[p][m].a == 2){
          p.vertex(this.module[p][m].xHactual, this.module[p][m].yHactual);
          p.vertex(this.module[p][m].x, this.module[p][m].y);
        }
      }
      if(p != 0){
        endContour();
      }
    }
    p.endShape(p.CLOSE);

    for(var p = 0; p < this.points.length; p++){    
      for(var q = 0; q < this.burst[p].length; q++){
        p.noStroke();
        if(p == 0){
          p.fill(fillColor);
        } else {
          p.fill(bkgdColor);
        }

        p.quad( this.burst[p][q].x1start, this.burst[p][q].y1start,
              this.burst[p][q].x1mover, this.burst[p][q].y1mover,
              this.burst[p][q].x2mover, this.burst[p][q].y2mover,
              this.burst[p][q].x2start, this.burst[p][q].y2start,
              );

        p.noFill();
        p.stroke(strokeColor);
        p.line(this.burst[p][q].x1start, this.burst[p][q].y1start, this.burst[p][q].x1mover, this.burst[p][q].y1mover);
        p.line(this.burst[p][q].x2start, this.burst[p][q].y2start, this.burst[p][q].x2mover, this.burst[p][q].y2mover);
      }
    }
  }

  createPoints(){
    var holdPoints = tFont[fontSelect].textToPoints(this.letter, this.x, this.y, pgTextSize, {sampleFactor: 0.2});
    this.testPoints = tFont[fontSelect].textToPoints(this.letter, this.x, this.y, pgTextSize, {sampleFactor: 0.2});

    var pathCount = 0;
    var pointCount = 0;
    this.points[pathCount] = [];
    this.points[pathCount][pointCount] = holdPoints[0];
    pointCount++;
    var preX = holdPoints[0].x;
    var preY = holdPoints[0].y;
    for(var m = 1; m < holdPoints.length; m++){
      if(p.dist(preX, preY, holdPoints[m].x, holdPoints[m].y) > 10){
        pathCount ++;
        pointCount = 0;
        this.points[pathCount] = [];
        this.points[pathCount][pointCount] = holdPoints[m];
        pointCount ++;
      } else {
        this.points[pathCount][pointCount] = holdPoints[m];
        pointCount++;
      }

      preX = holdPoints[m].x;
      preY = holdPoints[m].y;
    }
  }

  createModules(){
    this.module = [];
    this.burst = [];
    this.solidToggle = true;

    for(var p = 0; p < this.points.length; p++){
      this.module[p] = [];
      this.burst[p] = [];

      var filled = 0;
      var makerMode = 0;
      var process = true;
      var processCount = 0;
      var processClicker = 0;

      var prePoint = 0;

      // FILL THE REST OF PATH WITH ANCHOR AND HANDLS
      while(filled < this.points[p].length){
        if(process){
          if(makerMode == 0){              ///////////////////  straight
            processCount = int(p.random(5, 15) / ratioFactor);
          } else if(makerMode == 1){       ///////////////////  bumpers
            processCount = int(p.random(3, 7) * ratioFactor);
          } else if(makerMode == 2){       ///////////////////  poker
            processCount = 1;
          }
          process = false;    
          processClicker = 0;      
        }

        var runLength = 0;
        if(makerMode == 0){
          runLength = 1;
        } else if (makerMode == 1){
          runLength = int(p.random(this.bumpMin, this.bumpMax));
        } else if (makerMode == 2){
          runLength = 2;
        }
        
        // var randomLength = int(p.random(this.bumpMin, this.bumpMax));

        if(this.points[p][filled + runLength] != null){
          var thisPoint = this.points[p][filled + runLength];
          var thisPointPre = this.points[p][prePoint];

          if(makerMode == 0){
            this.module[p][this.module[p].length] = {
              x: thisPoint.x,
              y: thisPoint.y,
              a: 0
            }
          } else if(makerMode == 1){
            var ang = p.atan2(thisPoint.y - orgY, thisPoint.x - orgX);
            var influ = p.random(this.influMin, this.influMax);
            var xH_ = thisPoint.x + p.cos(ang) * influ;
            var yH_ = thisPoint.y + p.sin(ang) * influ;

            var angPre = p.atan2(thisPointPre.y - orgY, thisPointPre.x - orgX);
            var influPre = influ;
            var xPH_ = thisPointPre.x + p.cos(angPre) * influPre;
            var yPH_ = thisPointPre.y + p.sin(angPre) * influPre;

            this.module[p][this.module[p].length] = {
              x: thisPoint.x,
              y: thisPoint.y,
              a: 1,
              xPre: thisPointPre.x,
              yPre: thisPointPre.y,
              xPHactual: thisPointPre.x,
              xPHactual: thisPointPre.y,
              xPH: xPH_,
              yPH: yPH_,
              xHactual: thisPoint.x,
              xHactual: thisPoint.y,
              xH: xH_,
              yH: yH_
            }
          } else if(makerMode == 2){
            var midPoint = this.points[p][filled + runLength - 1];

            var ang = p.atan2(midPoint.y - orgY, midPoint.x - orgX);
            var influ = p.random(this.influMin, this.influMax);
            var xH_ = midPoint.x + p.cos(ang) * influ;
            var yH_ = midPoint.y + p.sin(ang) * influ;

            this.module[p][this.module[p].length] = {
              x: thisPoint.x,
              y: thisPoint.y,
              a: 2,
              xHactual: midPoint.x,
              xHactual: midPoint.y,
              xH: xH_,
              yH: yH_
            }
          }

          if(processClicker == 0){
            if(p.random(10) < 3){
              var thisPoint = this.points[p][filled + runLength];
              var prePoint = this.points[p][filled + runLength - 1];
              var postPoint = thisPoint;
              // if(this.points[p][filled + runLength + 1] != null){
              //   postPoint = this.points[p][filled + runLength + 1];
              // }
  
              var ang = p.atan2(thisPoint.y - orgY, thisPoint.x - orgX);
              var influ = p.random(this.influMin, this.influMax);

              var distToOrigin = p.dist(thisPoint.x, thisPoint.y, orgX, orgY);
              var midToOrigin = {
                x: thisPoint.x - p.cos(ang) * distToOrigin/(blastFactor),
                y: thisPoint.y - p.sin(ang) * distToOrigin/(blastFactor) //distToOrigin/8,
              }

              var postAng = p.atan2(postPoint.y - midToOrigin.y, postPoint.x - midToOrigin.x);
              var preAng = p.atan2(prePoint.y - midToOrigin.y, prePoint.x - midToOrigin.x);

              var x1start_ = prePoint.x - p.cos(preAng) * coreSW * 2;
              var y1start_ = prePoint.y - p.sin(preAng) * coreSW * 2;
              var x1end_ = prePoint.x + p.cos(preAng) * influ/2;
              var y1end_ = prePoint.y + p.sin(preAng) * influ/2;
              var x2start_ = postPoint.x - p.cos(postAng) * coreSW * 2;
              var y2start_ = postPoint.y - p.sin(postAng) * coreSW * 2
              var x2end_ = postPoint.x + p.cos(postAng) * influ/2;
              var y2end_ = postPoint.y + p.sin(postAng) * influ/2;
  
              this.burst[p][this.burst[p].length] = {
                x1start: x1start_,
                y1start: y1start_,
                x1end: x1end_,
                y1end: y1end_,
                x1mover: x1start_,
                y1mover: y1start_,
                x2start: x2start_,
                y2start: y2start_,
                x2end: x2end_,
                y2end: y2end_,
                x2mover: x2start_,
                y2mover: y2start_,
              }
            }
          }

          prePoint = filled + runLength;

          processClicker++;
        }

        if(processClicker == processCount){
          makerMode = p.round(p.random(2));
          // makerMode = 1;
          process = true;
        }

        filled += runLength;
      }
    }

    this.ticker = [];

    for(var p = 0; p < this.module.length; p++){
      this.ticker[p] = [];
      for(var m = 0; m < this.module[p].length; m++){
        var delayDist = p.dist(orgX, orgY, this.module[p][m].x, this.module[p][m].y);
        this.ticker[p][m] = p.map(delayDist, 0, p.width/2, 0, -15);
      }
    }
  }

  refresh(){
    this.setValue();

    if(this.isLetter){
      // this.createPoints();
      this.createModules();
    }
  }
}

// --- INLINED DEPENDENCY: js/class_4spur.js ---
class SpurLetter {
  constructor(index, letter, x, y){
    this.index = index;
    this.letter = letter;
    this.x = x;
    this.y = y;

    this.testPoints;
    this.points = [];
    this.module = [];

    this.bumpMin, this.bumpMax, this.influMin, this.influMax;

    this.ticker = [];
    this.animWindow = 60;

    this.tickerSpeed = 2;

    this.solidToggle = true;

    this.isLetter = true;
    if(this.letter == ' '){
      this.isLetter = false;      
    }
    
    this.setValue();

    if(this.isLetter){
      this.createPoints();
      this.createModules();
    }
  }

  setValue(){
    this.bumpMin = coreScale * 2 * detailFactor;
    this.bumpMax = this.bumpMin * 5;
    this.influMin = coreScale * 3.0 * blastFactor;
    this.influMax = this.influMin * 12;
  }

  run(){
    this.update();
    // if(this.solidToggle){
      // this.runLetter();
    // } else {
      this.runBuldge();
    // }

    // this.runPoints();
  }

  runPoints(){
    for(var m = 0; m < this.testPoints.length; m++){
      p.fill(0);
      p.noStroke();
      
      p.ellipse(this.testPoints[m].x, this.testPoints[m].y, 5, 5); 
    }
  }

  update(){
    for(var p = 0; p < this.points.length; p++){
      for(var m = 0; m < this.module[p].length; m++){
        var tk0 = p.map(this.ticker[p][m], 0, this.animWindow, 0, 1);

        if(this.ticker[p][m] < 0){
          this.module[p][m].x = this.module[p][m].xStart;
          this.module[p][m].y = this.module[p][m].yStart;
          this.module[p][m].xH = 0;
          this.module[p][m].yH = 0; 
        } else if(this.ticker[p][m] < this.animWindow){
          this.module[p][m].x = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].xStart, this.module[p][m].xEnd);
          this.module[p][m].y = p.map(easeOutExpo(tk0), 0, 1, this.module[p][m].yStart, this.module[p][m].yEnd);
          this.module[p][m].xH = p.map(easeOutExpo(tk0), 0, 1, 0, this.module[p][m].xHend);
          this.module[p][m].yH = p.map(easeOutExpo(tk0), 0, 1, 0, this.module[p][m].yHend);
        } else {
          this.module[p][m].x = this.module[p][m].xEnd;
          this.module[p][m].y = this.module[p][m].yEnd;
          this.module[p][m].xH = this.module[p][m].xHend;
          this.module[p][m].yH = this.module[p][m].yHend; 
        }

        this.ticker[p][m] += this.tickerSpeed;

        if(this.ticker[p][m] > 0){
          this.solidToggle = false;
        }
      }
    }
  }

  runLetter(){
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW * 2);
    p.text(this.letter, this.x, this.y);
  }

  runBuldge(){
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(coreSW);

    p.beginShape();

    for(var p = 0; p < this.points.length; p++){
      
      if(p != 0){
        beginContour();
      }

      // p.beginShape();
      p.vertex(this.module[p][0].x, this.module[p][0].y);

      for(var m = 1; m < this.module[p].length; m++){
        var thisMod = this.module[p][m];
        var preMod = this.module[p][m - 1];

        // p.vertex(thisMod.x, thisMod.y);
        if((m%2) == 0){     /////// IN
          p.bezierVertex(
            preMod.x, preMod.y,
            preMod.xStart, preMod.yStart,
            thisMod.x, thisMod.y
          )
        } else {            /////// OUT
          p.bezierVertex(
            thisMod.xStart, thisMod.yStart,
            thisMod.x, thisMod.y,
            thisMod.x, thisMod.y
          )
        }
      }
      if(p != 0){
        endContour();
      }
    }
    p.endShape(p.CLOSE);
  }

  createPoints(){
    var sampleFac = p.map(detailFactor, 1.5, 0.3, 0.04, 0.175)

    var holdPoints = tFont[fontSelect].textToPoints(this.letter, this.x, this.y, pgTextSize, {sampleFactor: sampleFac}); // 0.085
    this.testPoints = tFont[fontSelect].textToPoints(this.letter, this.x, this.y, pgTextSize, {sampleFactor: sampleFac}); // 0.085

    var pathCount = 0;
    var pointCount = 0;
    this.points[pathCount] = [];
    this.points[pathCount][pointCount] = holdPoints[0];
    pointCount++;
    var preX = holdPoints[0].x;
    var preY = holdPoints[0].y;
    for(var m = 1; m < holdPoints.length; m++){
      if(p.dist(preX, preY, holdPoints[m].x, holdPoints[m].y) > 30){
        pathCount ++;
        pointCount = 0;
        this.points[pathCount] = [];
        this.points[pathCount][pointCount] = holdPoints[m];
        pointCount ++;
      } else {
        this.points[pathCount][pointCount] = holdPoints[m];
        pointCount++;
      }

      preX = holdPoints[m].x;
      preY = holdPoints[m].y;
    }
  }

  createModules(){
    this.module = [];
    this.solidToggle = true;

    for(var p = 0; p < this.points.length; p++){
      this.module[p] = [];

      var prePoint = 0;

      // FILL THE REST OF PATH WITH ANCHOR AND HANDLS
      for(var n = 0; n < this.points[p].length; n++){
        var thisPoint = this.points[p][n];

        var ang = p.atan2(thisPoint.y - orgY, thisPoint.x - orgX);
        
        // var splashDist = p.random(10,60) * (n%2);
        var splashDist = p.random(this.influMin, this.influMax) * (this.module[p].length%2);
        var xEnd_ = thisPoint.x + p.cos(ang) * splashDist;
        var yEnd_ = thisPoint.y + p.sin(ang) * splashDist;

        this.module[p][this.module[p].length] = {
          x: thisPoint.x,
          y: thisPoint.y,
          xStart: thisPoint.x,
          yStart: thisPoint.y,
          xEnd: xEnd_,
          yEnd: yEnd_,
        }

        prePoint = n;

        if(p.random(10) < 3.5 && n < this.points[p].length - 4 && spurMessyToggle){
          n++;
        }
      }
    }
    this.ticker = [];

    for(var p = 0; p < this.module.length; p++){
      this.ticker[p] = [];
      for(var m = 0; m < this.module[p].length; m++){
        var delayDist = p.dist(orgX, orgY, this.module[p][m].x, this.module[p][m].y);
        this.ticker[p][m] = p.map(delayDist, 0, p.width/2, 0, -15);
      }
    }
  }

  refresh(){
    this.setValue();

    if(this.isLetter){
      // this.createPoints();
      this.createModules();
    }
  }
}

// --- INLINED DEPENDENCY: js/animators.js ---
////////////////////////////////////// SINE
function easeInSine(x) {
  return 1 - Math.cos((x * Math.PI) / 2);
}

function easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
}

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

////////////////////////////////////// CUBIC
function easeInCubic(x) {
  return x * x * x;
}

function easeOutCubic(x) {
  return 1 - p.pow(1 - x, 3);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

////////////////////////////////////// CIRC
function easeInCirc(x){
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

function easeOutCirc(x){
  return sqrt(1 - Math.pow(x - 1, 2));
}

function easeInOutCirc(x) {
  return x < 0.5
  ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
  : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

////////////////////////////////////// QUAD
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

////////////////////////////////////// QUINT
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


////////////////////////////////////// EXPO
function easeInExpo(x) {
  return x === 0 ? 0 : p.pow(2, 10 * x - 10);
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

////////////////////////////////////// BACK
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

////////////////////////////////////// BOUNCE
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

////////////////////////////////////// ELASTIC
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







// --- INLINED DEPENDENCY: js/update.js ---
function setText(){
  var enteredText = inpText;

  inputText = enteredText.match(/[^\r\n]+/g);

  if(enteredText == "" || !inputText){
    inputText = [];
    inputText[0] = " ";
  }

  buildIt();
}

function setPGtextSize(val){
  pgTextSize = int(p.map(val, 0, 100, 10, 400));
  coreScale = pgTextSize/250;  

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setFillColor(val){ fillColor = val; }
function setBkgdColor(val){ bkgdColor = val; }
function setStrokeColor(val){ strokeColor = val; }

function setCoreSW(val){
  coreSW = p.map(val, 1, 100, 0, 4);
}

function setDetailFactor(val){
  detailFactor = p.map(val, 1, 100, 1.5, 0.3);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setBlastFactor(val){
  blastFactor = p.map(val, 1, 100, 0.5, 3);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setRatioFactor(val){
  ratioFactor = p.map(val, 1, 100, 0.1, 4);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function toggleMousePop(val){
  mousePopOn = Boolean(val);
}

function toggleSpurMessy(val){
  spurMessyToggle = Boolean(val);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function resetPop(){
  orgX = p.width/2;
  orgY = p.height/2;

  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
}

function setFont(val){
  fontSelect = val;

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setBlastType(val){
  blastType = val;

  orgX = p.width/2;
  orgY = p.height/2;

  buildIt();
}


    // --- ORIGINAL SKETCH.JS CODE ---
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
  tFont[0] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[0] = 0.85;

  tFont[1] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[1] = 0.85;

  tFont[2] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[2] = 0.75;

  tFont[3] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[3] = 0.75;

  tFont[4] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[4] = 0.75;

  tFont[5] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[5] = 0.75;

  tFont[6] = p.loadFont("../assets/IBMPlexMono-Regular.otf");
  pgTextFactor[6] = 1.0;
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h);

  thisDensity = p.pixelDensity();

  orgX = p.width/2;
  orgY = p.height/2;
  if(mousePopOn){
    coreMousePop = new MousePop(orgX, orgY);
  }

  p.frameRate(frate);

  p.textFont(tFont[fontSelect]);
  p.textSize(pgTextSize);
  p.strokeJoin(p.ROUND);

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
  lastTextTime = p.millis();
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
    lastTextTime = p.millis();
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

  if(mousePopOn && coreMousePop){ coreMousePop.runBottom(); }
  if (coreSplode) {
    coreSplode.run();
  }
  if(mousePopOn && coreMousePop){ coreMousePop.runTop();}

  if (typeof captureFrame === 'function') captureFrame();
}

function mousePressed(){
  if(p.mouseX > 200 || p.mouseY > 250){
    orgX = p.mouseX;
    orgY = p.mouseY;
  
    if (coreSplode) coreSplode.refresh();
    if (coreMousePop) coreMousePop.refresh(orgX, orgY);
  }
}

function buildIt(){
  coreSplode = new SplodeAll();

  orgX = p.width/2;
  orgY = p.height/2;

  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
}

function windowResized(){
  p.resizeCanvas(p.windowWidth, p.windowHeight);

  if (coreSplode) coreSplode.refresh();
  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
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
