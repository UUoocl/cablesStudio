// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "reset": {
        "p.text": "EVERY\nMORNING\nI START\nA FIRE\nAND BEGIN\nAGAIN",
        "fontSelect": 2,
        "textScaler": 0.75,
        "fillColor": "#000000",
        "bkgdColor": "#ffffff",
        "gravityStrength": 0.0001,
        "constrainMode": 1,
        "padFactor": 0.5
    }
};


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







// --- INLINED DEPENDENCY: js/class_0boundary.js ---
class Boundary {
    constructor(x, y, w, h, a) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.a = a;

        let options = {
            friction: 0,
            restitution: 0.6,
            angle: a,
            isStatic: true
        }
        this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
        Composite.add(world, this.body);
    }

    show() {
        p.stroke(0,0,255);
        p.noFill();
        p.ellipse(this.x,this.y,20,20);

        let pos = this.body.position;
        let angle = this.body.angle;
        p.push();
            p.translate(pos.x, pos.y);
            p.rotate(angle);
            rectMode(p.CENTER);

            p.rect(0, 0, this.w, this.h);
        p.pop();
    }
}

// --- INLINED DEPENDENCY: js/class_0circle.js ---
class Particle{
    constructor(x, y, r, fixed) {
      this.x = x;
      this.y = y;
      this.r = r;
      let options = {
          friction: 0,
          restitution: 0.95,
          isStatic: fixed
      }
      this.body = Bodies.circle(this.x, this.y, this.r,  options);
      Composite.add(world, this.body);
    }

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        p.push();
        p.translate(pos.x, pos.y);
        p.rotate(angle);
        rectMode(p.CENTER);
        p.strokeWeight(1);
        p.stroke(255)
        p.fill(127);
        p.ellipse(0, 0, this.r*2);
        p.line(0,0,this.r,0);
        p.pop();
    }
}

// --- INLINED DEPENDENCY: js/class_1all.js ---
class DropAll {
  constructor(){
    this.dropLines = [];
    for(var m = 0; m < inputText.length; m++){
      this.dropLines[m] = new DropLine(m);
    }
  }

  run(){
    for(var m = 0; m < inputText.length; m++){
      this.dropLines[m].run();
    }
    
    for(var m = 0; m < debrisGroup.length; m++){
      debrisGroup[m].run();
    }
  }

  refresh(){
    for(var m = 0; m < inputText.length; m++){
      this.dropLines[m].refresh();
    }
  }

  resetPos(){
    for(var m = 0; m < inputText.length; m++){
      this.dropLines[m].resetPos();
    }

    for(var m = 0; m < debrisGroup.length; m++){
      debrisGroup[m].resetPos();
    }
  }

  removeIt(){
    for(var m = inputText.length - 1; m >= 0; m--){
      this.dropLines[m].removeIt();
    }

    for(var m = debrisGroup.length - 1; m >= 0; m--){
      debrisGroup[m].removeIt();
    }
  }

  removeConstraint(){
    for(var m = inputText.length - 1; m >=0 ; m--){
      this.dropLines[m].removeConstraint();
    }
  }
}

// --- INLINED DEPENDENCY: js/class_2line.js ---
class DropLine {
  constructor(lineIndex){
    this.lineIndex = lineIndex;
    this.lineLength = inputText[this.lineIndex].length;
    
    this.letterCounter = 0;
    this.dropLetters = [];
    this.dropConstraints = [];

    this.dropDebris = [];

    this.setUnits();
  }

  run(){
    for(var m = 0; m < this.dropLetters.length; m++){
      this.dropLetters[m].run();
    }
  }

  setUnits(){
    p.textFont(tFont[fontSelect]);
    p.textSize(pgTextSize);

    var thisY = (pgTextSize * pgTextFactor[fontSelect] + leading) * this.lineIndex;
    thisY += p.height/2 - (inputText.length - 2) * (pgTextSize * pgTextFactor[fontSelect] + leading)/2;
    thisY -= leading/2;

    var xCulm = 0;

    for(var m = 0; m < unitCore[this.lineIndex].length; m++){
      if(unitCore[this.lineIndex][m].mode == 0){ ///////////////////////////////////////////// INSERT TEXT
        var thisWord = unitCore[this.lineIndex][m].content;

        for(var n = 0; n < thisWord.length; n++){
          var thisLetter = thisWord.charAt(n);

          var thisX = 0;
          if(n > 0){
            var holdX = p.textWidth(thisWord.substring(0, n + 1));
            thisX = holdX - p.textWidth(thisWord.charAt(n));
          }
    
          thisX += p.width/2;
          thisX += xCulm;
          thisX -= lineWidths[this.lineIndex]/2;

          var dropIndex = this.dropLetters.length;
          this.dropLetters[dropIndex] = new DropLetter(thisLetter, thisX, thisY);
        
          if(n > 0 && constrainMode != 0){
            this.configureConstraint(this.letterCounter);
          }

          this.letterCounter ++;
        } 

        xCulm += p.textWidth(thisWord + " ");

      } else if(unitCore[this.lineIndex][m].mode == 1){ ///////////////////////////////////// INSERT IMAGE
        var thisX = 0;
        thisX += p.width/2;
        thisX += xCulm;
        thisX -= lineWidths[this.lineIndex]/2;
        
        var thisDebris = debrisGroup.length;
        var thisDebrisIndex = unitCore[this.lineIndex][m].content.index;
        debrisGroup[thisDebris] = new DropDebris(thisDebrisIndex, thisX, thisY);

        xCulm += debrisGroup[thisDebris].w + p.textWidth(" ");
      } else if(unitCore[this.lineIndex][m].mode == 2){ ///////////////////////////////////// TYPE BLOCK
        var thisX = 0;
        thisX += p.width/2;
        thisX += xCulm;
        thisX -= lineWidths[this.lineIndex]/2;
        
        var thisDebris = debrisGroup.length;
        var thisWord = unitCore[this.lineIndex][m].content;
        var thisWordWidth = p.textWidth(thisWord);
        debrisGroup[thisDebris] = new DropWord(thisWord, thisWordWidth, thisX, thisY);

        xCulm += debrisGroup[thisDebris].w + p.textWidth(" ");
      }
    }
  }

  configureConstraint(m){
    // if(constrainMode == 1){
    //   if(this.dropLetters[m].thisLetter != " "){
    //     if(this.dropLetters[m - 1].thisLetter != " "){
    //       ///////// ONE CONSTRAINT
    //       let optionsA = {
    //         bodyA: this.dropLetters[m].bodyLetter,
    //         bodyB: this.dropLetters[m - 1].bodyLetter,
    //         stiffness: 0.05,
    //         damping: 0.1
    //       }
    //       this.dropConstraints[this.dropConstraints.length] = Constraint.create(optionsA);
    //       var thisConA = this.dropConstraints[this.dropConstraints.length - 1];
    //       World.add(world, thisConA);
    //     }
    //   }
    // } else if (constrainMode == 2){
      if(this.dropLetters[m].thisLetter != " "){
        if(this.dropLetters[m - 1].thisLetter != " "){
          ///////// FIRST CONSTRAINT
          let optionsA = {
            bodyA: this.dropLetters[m].bodyLetter,
            bodyB: this.dropLetters[m - 1].bodyLetter,
            pointA: {x: 0, y: -(pgTextSize * pgTextFactor[fontSelect])/2},
            pointB: {x: 0, y: -(pgTextSize * pgTextFactor[fontSelect])/2},
            stiffness: 0.1,
            damping: 0.05
          }
          this.dropConstraints[this.dropConstraints.length] = Constraint.create(optionsA);
          var thisConA = this.dropConstraints[this.dropConstraints.length - 1];
          World.add(world, thisConA);
          
          ///////// SECOND CONSTRAINT
          let optionsB = {
            bodyA: this.dropLetters[m].bodyLetter,
            bodyB: this.dropLetters[m - 1].bodyLetter,
            stiffness: 0.1,
            damping: 0.05
          }
          this.dropConstraints[this.dropConstraints.length] = Constraint.create(optionsB);
          var thisConB = this.dropConstraints[this.dropConstraints.length - 1];
          World.add(world, thisConB);

          ///////// THIRD CONSTRAINT
          let optionsC = {
            bodyA: this.dropLetters[m].bodyLetter,
            bodyB: this.dropLetters[m - 1].bodyLetter,
            pointA: {x: 0, y: (pgTextSize * pgTextFactor[fontSelect])/2},
            pointB: {x: 0, y: (pgTextSize * pgTextFactor[fontSelect])/2},
            stiffness: 0.1,
            damping: 0.05
          }
          this.dropConstraints[this.dropConstraints.length] = Constraint.create(optionsC);
          var thisConC = this.dropConstraints[this.dropConstraints.length - 1];
          World.add(world, thisConC);
        }
      }
    // }
  }

  refresh(){
    for(var m = 0; m < this.dropLetters.length; m++){
      this.dropLetters[m].refresh();
    }
    this.setOriginalOrder();
  }

  resetPos(){
    for(var m = 0; m < this.dropLetters.length; m++){
      this.dropLetters[m].resetPos();
    }
  }

  removeIt(){
    for(var m = this.dropLetters.length - 1; m >= 0; m--){
      this.dropLetters[m].removeIt();
    }
  }

  removeConstraint(){
    for(var m = this.dropConstraints.length - 1; m >=0; m--){
      var removeThisOne = this.dropConstraints[m];
      Composite.remove(world, removeThisOne);
    }
  }
}

// --- INLINED DEPENDENCY: js/class_3letter.js ---
class DropLetter {
  constructor(thisLetter, thisX, thisY, thisW){
    this.thisLetter = thisLetter;
    
    this.orgX = thisX;
    this.orgY = thisY;
    
    this.coreOrg;

    this.minPoint;
    this.maxPoint;
    this.diff;

    this.points;
    this.bodyLetter;

    if(this.thisLetter != " "){
      this.textPointMaker();
      this.physicsPointMaker();
    }
  }

  textPointMaker(){
    this.points = tFont[fontSelect].textToPoints(this.thisLetter, this.orgX, this.orgY, pgTextSize, {
      sampleFactor: 0.1,
      simplifyThreshold: 0
    });
  }

  physicsPointMaker(){
    var newX = this.orgX + p.textWidth(this.thisLetter)/2;
    var newY = this.orgY - pgTextSize * pgTextFactor[fontSelect]/2;

    this.bodyLetter = Bodies.fromVertices(newX, newY, this.points);
    Composite.add(world, this.bodyLetter);

    this.minPoint = createVector(this.bodyLetter.bounds.min.x, this.bodyLetter.bounds.min.y);
    this.maxPoint = createVector(this.bodyLetter.bounds.max.x, this.bodyLetter.bounds.max.y);

    var pos = this.bodyLetter.position;
    this.diff = createVector(-(pos.x - this.minPoint.x), -(pos.y - this.maxPoint.y));

    Matter.Body.setPosition(this.bodyLetter, {x: pos.x, y: this.orgY - this.diff.y});
    
    this.coreOrg = createVector(pos.x, this.orgY - this.diff.y);
  }

  run(){
    this.update();
    this.display();
  }

  update(){

  }

  display(){
    var pos = this.bodyLetter.position;
    var ang = this.bodyLetter.angle;

    p.noStroke();
    // p.fill(fillColor);

    // for(var m = 0; m < this.points.length; m++){
    //   p.ellipse(this.points[m].x, this.points[m].y, 3, 3);
    // }

    var verts = this.bodyLetter.vertices;
    // p.fill(255, 0, 0); 
    // for(var m = 0; m < verts.length; m++){
    //   p.ellipse(verts[m].x, verts[m].y, 10, 10);
    // }

    // p.fill(0,255,255);
    // p.ellipse(this.minPoint.x, this.minPoint.y, 20, 20);
    // p.ellipse(this.maxPoint.x, this.maxPoint.y, 20, 20);
    // p.ellipse(this.minPoint.x, this.maxPoint.y, 20, 20);
    
    p.push();
      p.translate(pos.x, pos.y);
      p.rotate(ang);
      // p.translate(this.diff.x, this.diff.y);
      p.translate(0, this.diff.y);

      // p.fill(0,255,0);
      // p.ellipse(0, 0, 20, 20);

      p.fill(fillColor);
      p.textAlign(p.CENTER);
      p.text(this.thisLetter, 0, 0);
    p.pop();

    // p.fill(0,0,255);
    // p.ellipse(pos.x, pos.y, 20, 20);
  }
  
  resetPos(){
    if(this.thisLetter != " "){
      Matter.Body.setPosition(this.bodyLetter, {x: this.coreOrg.x, y: this.coreOrg.y});
      Matter.Body.setAngle(this.bodyLetter, 0);
      Matter.Body.setAngularSpeed(this.bodyLetter, 0);
      Matter.Body.setAngularVelocity(this.bodyLetter, 0);
      Matter.Body.setSpeed(this.bodyLetter, 0);
    }
  }

  removeIt(){
    if(this.thisLetter != " "){
      Composite.remove(world, this.bodyLetter);
    }
  }
}

// --- INLINED DEPENDENCY: js/class_3debris.js ---
class DropDebris {
  constructor(m, x, y){
    // print("CREATED WITH THIS M: " + m);

    this.m = m;

    this.hr = pgImage[this.m].width/pgImage[this.m].height;

    this.w = this.hr * pgTextSize * pgTextFactor[fontSelect];
    this.h = pgTextSize * pgTextFactor[fontSelect];

    // this.coreX = x;
    // this.coreY = y;

    this.x = x + this.w/2;
    this.y = y - this.h/2;

    let options = {
      friction: 0,
      restitution: 0.6,
    }

    this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
    Composite.add(world, this.body);
  }

  run() {
    this.update();
    this.display();
  }
  
  update() {

  }

  display() {
    if(debrisData[this.m].mode == 0){
      this.displayFrame();
    } else if(debrisData[this.m].mode == 1){
      this.displayImage();
    }

  }

  displayFrame(){
    p.strokeWeight(1)
    p.stroke(strokeColor);
    p.noFill();

    let pos = this.body.position;
    let angle = this.body.angle;
    p.push();
        p.translate(pos.x, pos.y);
        p.rotate(angle);
        rectMode(p.CENTER);
        p.rect(0, 0, this.w, this.h);
        p.line(-this.w/2, -this.h/2, this.w/2, this.h/2);
        p.line(-this.w/2, this.h/2, this.w/2, -this.h/2);
    p.pop();
  }

  displayImage(){
    let pos = this.body.position;
    let angle = this.body.angle;
    p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);

      imageMode(p.CENTER);
      p.image(pgImage[this.m], 0, 0, this.w, this.h);

      // p.noStroke();
      // p.fill(0,0,255);
      // p.textSize(20);
      // p.text(this.m, 0, 40);
    p.pop();
  }

  resetPos(){
    Matter.Body.setPosition(this.body, {x: this.x, y: this.y});
    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularSpeed(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);
    Matter.Body.setSpeed(this.body, 0);
  }

  removeIt(){
    Composite.remove(world, this.body);
  }
}

// --- INLINED DEPENDENCY: js/class_3word.js ---
class DropWord {
  constructor(word, wordWidth, x, y,){
    this.word = word;

    this.w = wordWidth;
    this.h = pgTextSize * pgTextFactor[fontSelect];

    // this.coreX = x;
    // this.coreY = y;

    this.x = x + this.w/2;
    this.y = y - this.h/2;

    let options = {
      friction: 0,
      restitution: 0.6,
  }

    this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
    Composite.add(world, this.body);
  }

  run() {
    this.update();
    this.display();
  }
  
  update() {

  }

  display() {
    // this.displayFrame();
    this.displayWord();
  }

  displayFrame(){
    p.strokeWeight(1)
    p.stroke(strokeColor);
    p.noFill();

    let pos = this.body.position;
    let angle = this.body.angle;
    p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);
      rectMode(p.CENTER);
      p.rect(0, 0, this.w, this.h);
      p.line(-this.w/2, -this.h/2, this.w/2, this.h/2);
      p.line(-this.w/2, this.h/2, this.w/2, -this.h/2);
    p.pop();
  }

  displayWord(){
    p.fill(fillColor);
    p.noStroke();

    let pos = this.body.position;
    let angle = this.body.angle;
    p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);

      p.textAlign(p.CENTER);
      p.text(this.word, 0, this.h/2);
    p.pop();
  }

  resetPos(){
    Matter.Body.setPosition(this.body, {x: this.x, y: this.y});
    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularSpeed(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);
    Matter.Body.setSpeed(this.body, 0);
  }

  removeIt(){
    Composite.remove(world, this.body);
  }
}

// --- INLINED DEPENDENCY: js/update.js ---
function setText(){
  var enteredText = inpText;

  inputText = enteredText.match(/[^\r\n]+/g);

  if(enteredText == "" || !inputText){
    inputText = [];
    inputText[0] = " ";
  }

  ///////////////////////////// MAKE UNIT CORE
  debrisGroup = [];
  unitCore = [];
  for(var m = 0; m < inputText.length; m++){
    var thisLine = inputText[m].split(" ");

    unitCore[m] = []
    
    for(var n = 0; n < thisLine.length; n++){
      var thisMode = 0;
      if(constrainMode == 0){
        thisMode = 0;
      } else if(constrainMode == 2){
        thisMode = 2;
      } else if(constrainMode == 3){
        var rs0 = p.random(10);
        if(rs0 < 5) {
          thisMode = 0;
        } else {
          thisMode = 2;
        };
      }

      unitCore[m][n] = {
        mode: thisMode,
        content: thisLine[n]
      }
    }
  }


  for(var i = 0; i < debrisData.length; i++){
    var culmBot = 0;
    var culmTop = 0;
    for(var m = 0; m < unitCore.length; m++){
      culmTop += unitCore[m].length + 1;

      // INSERT IMAGE INTO POSITION
      if(debrisData[i].position >= culmBot && debrisData[i].position < culmTop){
        var newUnit = {
          mode: 1,
          content: debrisData[i]
        }
        unitCore[m].splice(debrisData[i].position - culmBot, 0, newUnit);
      }
      culmBot = culmTop;
    }

    // IF POSITION IS HIGHER THAN POSITIONS AVAILABLE
    if(debrisData[i].position >= culmTop){
      var newUnit = {
        mode: 1,
        content: debrisData[i]
      }
      unitCore[unitCore.length - 1].splice(unitCore[unitCore.length - 1].length, 0, newUnit);
    }
  }

  findMaxSize();
}

function findMaxSize(){
  var testerSize = 100;
  p.textSize(testerSize);
  if (tFont[fontSelect]) {
    p.textFont(tFont[fontSelect]);
  }
  
  ///////// FIND THE LONGEST LINE
  var longestLine = 0;
  var measurer = 0;

  for(var m = 0; m < unitCore.length; m++){
    var tapeMeasurer = 0;
    for(var n = 0; n < unitCore[m].length; n++){
      if(unitCore[m][n].mode == 0){
        tapeMeasurer += p.textWidth(unitCore[m][n].content + " ");
      } else if(unitCore[m][n].mode == 1){
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        tapeMeasurer += thisHR * testerSize * pgTextFactor[fontSelect];
      } else if(unitCore[m][n].mode == 2){
        tapeMeasurer += p.textWidth(unitCore[m][n].content + " ");
      }
    }

    if(tapeMeasurer > measurer){
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  ///////// FIND THE SIZE THAT FILLS TO THE MAX WIDTH
  var widthTest = (p.width - 30);

  let sizeHolder = 2;
  p.textSize(sizeHolder);
  let holdW = 0;

  while(holdW < widthTest){
    holdW = 0;
    for(var n = 0; n < unitCore[longestLine].length; n++){
      if(unitCore[longestLine][n].mode == 0){
        p.textSize(sizeHolder)
        holdW += p.textWidth(unitCore[longestLine][n].content + " ");
      } else if(unitCore[longestLine][n].mode == 1){
        var thisImage = unitCore[longestLine][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        holdW += thisHR * sizeHolder * pgTextFactor[fontSelect];
      } else if(unitCore[longestLine][n].mode == 2){
        p.textSize(sizeHolder)
        holdW += p.textWidth(unitCore[longestLine][n].content + " ");
      } 
    }

    sizeHolder += 2;
  }

  ///////// MAKE SURE THE HEIGHT DOESN'T BRAKE THE HEIGHT
  var heightTest = (p.height - 30) - inputText.length * leading;
  let holdH = inputText.length * sizeHolder * pgTextFactor[fontSelect];
  while(holdH > heightTest){
    holdH = inputText.length * sizeHolder * pgTextFactor[fontSelect];
    sizeHolder -= 2;
  }

  pgTextSize = p.constrain(sizeHolder * textScaler, 12, 1000);

  p.textSize(pgTextSize);

  lineWidths = [];
  for(var m = 0; m < unitCore.length; m++){
    lineWidths[m] = 0;
    for(var n = 0; n < unitCore[m].length; n++){
      if(unitCore[m][n].mode == 0){
        lineWidths[m] += p.textWidth(unitCore[m][n].content + " ");
      } else if(unitCore[m][n].mode == 1){
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        lineWidths[m] += thisHR * pgTextSize * pgTextFactor[fontSelect];
      } else if(unitCore[m][n].mode == 2){
        lineWidths[m] += p.textWidth(unitCore[m][n].content + " ");
      } 
    }
  }

  typeCoreW = lineWidths[longestLine];
  typeCoreH = (inputText.length * pgTextSize * pgTextFactor[fontSelect]) + (inputText.length - 1) * leading;
}

function newText(){
  if (dropGroup) {
    dropGroup.removeIt();
  }

  setText();

  dropGroup = new DropAll();

  positionBoundaries();
}

function setTextScaler(val){
  textScaler = p.map(val, 1, 100, 0.01, 1);
  newText();
}

function setFillColor(val){ fillColor = val; }
function setBkgdColor(val){ bkgdColor = val; }

function resetPos(){
  if (dropGroup) dropGroup.resetPos();
}

function adjustGravity(e){
  gravityAng = e.value + p.PI;
}

function setGravityStrength(val){
  gravityStrength = p.map(val, 0, 100, 0, 0.0005);
}

function setConnectSet(val){
  if(constrainMode == 0){
    constrainMode = val;
    newText();
  } else if(constrainMode == 1){
    if(val == 0){
      constrainMode = val;
      if (dropGroup) dropGroup.removeConstraint();
    } else {
      constrainMode = val;
      newText();
    }
  } else if(constrainMode == 2){
    constrainMode = val;
    newText();
  } else if(constrainMode == 3){
    constrainMode = val;
    if (dropGroup) dropGroup.removeConstraint();
    newText();
  }
}

function setFont(val){
  fontSelect = val;
  newText();
}

function setPadFactor(val){
  padFactor = p.map(val, 0, 100, 0, 1);
  positionBoundaries();
}

function addDebris(){
  if(debrisData.length < debrisCap){
    var positionCount = 0;
    for(var m = 0; m < unitCore.length; m++){
      for(var n = 0; n < unitCore[n].length; n++){
        positionCount ++;
      }
      positionCount++;
    }
    positionCount++;
  
    var thisPosition = p.round(p.random(positionCount - 1));
    var thisDebris = debrisData.length;
    debrisData[thisDebris] = {
      index: thisDebris,
      mode: 1,
      position: thisPosition
    }
    newText();
  }
}

function removeDebris(){
  if(debrisData.length > 0){
    debrisData.splice(debrisData.length-1, 1);
    newText();
  }
}

function setDebrisPlace(select, val){
  for(var m = 0; m < unitCore.length; m++){
    for(var n = 0; n < unitCore[m].length; n++){
      if(unitCore[m][n].mode == 1){
        if(unitCore[m][n].content.index == select){
          unitCore[m].splice(n, 1);
        }
      }
    }
  }

  var positionCount = 0;
  for(var m = 0; m < unitCore.length; m++){
    for(var n = 0; n < unitCore[n].length; n++){
      positionCount ++;
    }
    positionCount++;
  }
  positionCount++;

  debrisData[select].position = p.round(p.map(val, 0, 100, 0, positionCount));
  newText();
}

function setDebrisImage(select, path){
  pgImage[select] = loadImage(path);
  newText();
}


    // --- ORIGINAL SKETCH.JS CODE ---
    const {
    Engine,
    World,
    Bodies,
    Composite,
    Constraint,
    Mouse,
    MouseConstraint
} = Matter;

let engine;
let world;
let testPart;
let boundaries = [];
let mConstraint;

var bkgdColor = '#ffffff';
var strokeColor = '#0000ff';
var fillColor = '#000000';

var pg = [];
var pgTextSize = 200;

var tFont = [];
var pgTextFactor = [];
var leading = 0;
var textScaler = 0.75;

var starterText = "EVERY\nMORNING\nI START\nA FIRE\nAND BEGIN\nAGAIN";

var constrainMode = 1;
var fontSelect = 2;

var typeCoreW, typeCoreH;
var borderWeight = 1;

var inputText;
var widgetOn = true;

var padFactor = 0.5;
var padAnim = 30;

var gravityAng = 1.5708;
var gravityStrength = 0.0001;

var unitCore = [];
var lineWidths = [];

var dropGroup;
var debrisGroup = [];
var debrisData = [];

var pgImage = [];
var holdImage;

var refreshNewText = 5;
var debrisCap = 7;

var thisDensity = 2;
var gyroOn = false;

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
  tFont[0] = p.loadFont("../assets/BebasNeue-Regular.ttf");
  pgTextFactor[0] = 0.69;

  tFont[1] = p.loadFont("../assets/Kanit-Regular.ttf");
  pgTextFactor[1] = 0.735;

  tFont[2] = p.loadFont("../assets/OpenSans-Regular.ttf");
  pgTextFactor[2] = 0.825;

  tFont[3] = p.loadFont("../assets/OpenSans-Regular.ttf");
  pgTextFactor[3] = 0.835;

  tFont[4] = p.loadFont("../assets/Roboto-Thin.ttf");
  pgTextFactor[4] = 0.82;

  holdImage = loadImage("crash_resources/images/3.gif");
  pgImage[0] = loadImage("crash_resources/images/0.gif");
  pgImage[1] = loadImage("crash_resources/images/1.gif");
  pgImage[2] = loadImage("crash_resources/images/2.gif");
  pgImage[3] = loadImage("crash_resources/images/3.gif");
  pgImage[4] = loadImage("crash_resources/images/4.gif");
  pgImage[5] = loadImage("crash_resources/images/5.gif");
  pgImage[6] = loadImage("crash_resources/images/6.gif");
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  let canvas = p.createCanvas(w, h);

  thisDensity = p.pixelDensity();

  var engineOptions = {}
  engine = Engine.create(engineOptions);
  world = engine.world;
  
  if (tFont[fontSelect]) {
    p.textFont(tFont[fontSelect]);
  }
  p.textSize(pgTextSize);
  p.strokeJoin(p.ROUND);

  reSetting();

  // TYPE PIECES
  dropGroup = new DropAll();

  // BOUNDARY
  for(var m = 0; m < 4; m++){
    boundaries.push(new Boundary(0, 0, p.height + p.width, 400, 0));
  }
  positionBoundaries();
  
  // MOUSE THINGS
  let canvasMouse = Mouse.create(canvas.elt);
  let options = { mouse: canvasMouse, }
  canvasMouse.pixelRatio = p.pixelDensity();
  mConstraint = MouseConstraint.create(engine, options);
  World.add(world, mConstraint);

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  inpText = "EVERY\nMORNING\nI START\nA FIRE\nAND BEGIN\nAGAIN";
  fontSelect = 2;
  textScaler = 0.75;
  fillColor = '#000000';
  bkgdColor = '#ffffff';
  gravityStrength = 0.0001;
  constrainMode = 1;
  padFactor = 0.5;
  gravityAng = 1.5708;

  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = p.millis();
  isClearing = false;
  lastRemoveTime = 0;

  setText();
  findMaxSize();
}

function applyCustomPreset(settings) {
  if (!settings) return;

  reSetting();

  if (settings.text !== undefined) inpText = String(settings.text);
  if (settings.fontSelect !== undefined) fontSelect = Number(settings.fontSelect);
  if (settings.textScaler !== undefined) textScaler = Number(settings.textScaler);
  if (settings.fillColor !== undefined) fillColor = String(settings.fillColor);
  if (settings.bkgdColor !== undefined) bkgdColor = String(settings.bkgdColor);
  if (settings.gravityStrength !== undefined) gravityStrength = Number(settings.gravityStrength);
  if (settings.constrainMode !== undefined) constrainMode = Number(settings.constrainMode);
  if (settings.padFactor !== undefined) padFactor = Number(settings.padFactor);
  if (settings.gravityAng !== undefined) gravityAng = Number(settings.gravityAng);

  newText();
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
    newText();
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.fontSelect !== undefined) { fontSelect = Number(data.fontSelect); newText(); }
  if (data.textScaler !== undefined) { textScaler = Number(data.textScaler); newText(); }
  if (data.fillColor !== undefined) fillColor = String(data.fillColor);
  if (data.bkgdColor !== undefined) bkgdColor = String(data.bkgdColor);
  if (data.gravityStrength !== undefined) gravityStrength = Number(data.gravityStrength);
  if (data.constrainMode !== undefined) { constrainMode = Number(data.constrainMode); newText(); }
  if (data.padFactor !== undefined) { padFactor = Number(data.padFactor); positionBoundaries(); }
  if (data.gravityAng !== undefined) gravityAng = Number(data.gravityAng);

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        text: inpText,
        fontSelect: fontSelect,
        textScaler: textScaler,
        fillColor: fillColor,
        bkgdColor: bkgdColor,
        gravityStrength: gravityStrength,
        constrainMode: constrainMode,
        padFactor: padFactor,
        gravityAng: gravityAng
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
      newText();
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = p.millis();
        newText();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = p.millis();
        newText();
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

  world.gravity.x = p.cos(gravityAng);
  world.gravity.y = p.sin(gravityAng);
  world.gravity.scale = gravityStrength;

  p.background(bkgdColor);
  Engine.update(engine);

  if (dropGroup) {
    dropGroup.run();
  }

  if(borderWeight > 0){
    borderWeight -= 0.05;
    p.stroke('#5080bf');
    p.strokeWeight(borderWeight);
    p.noFill();
    rectMode(p.CENTER);
    p.rect(p.width/2, p.height/2, p.width - (p.width - typeCoreW) * padFactor, p.height - (p.height - typeCoreH) * padFactor); 
  }
  if(borderWeight < 0.1){
    borderWeight = 0;
  }

  if(refreshNewText < 4){
    newText();
    refreshNewText ++;
  }

  if (typeof captureFrame === 'function') captureFrame();
}

function windowResized(){
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  newText();
}

function positionBoundaries(){
  var vertPad = (p.height - typeCoreH)/2 * padFactor;
  var horzPad = (p.width - typeCoreW)/2 * padFactor;

  Matter.Body.setPosition(boundaries[0].body, {x: p.width/2, y: p.height + 200 - vertPad});
  Matter.Body.setAngle(boundaries[0].body, 0);

  Matter.Body.setPosition(boundaries[1].body, {x: p.width/2, y: - 200 + vertPad});
  Matter.Body.setAngle(boundaries[1].body, p.PI);

  Matter.Body.setPosition(boundaries[2].body, {x: - 200 + horzPad, y: p.height/2});
  Matter.Body.setAngle(boundaries[2].body, p.PI/2);

  Matter.Body.setPosition(boundaries[3].body, {x: p.width + 200 - horzPad, y: p.height/2});
  Matter.Body.setAngle(boundaries[3].body, p.PI * 3/2);

  borderWeight = 2;
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
