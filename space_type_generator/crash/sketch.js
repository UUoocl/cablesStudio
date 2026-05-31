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
  tFont[0] = loadFont("../assets/BebasNeue-Regular.ttf");
  pgTextFactor[0] = 0.69;

  tFont[1] = loadFont("../assets/Kanit-Regular.ttf");
  pgTextFactor[1] = 0.735;

  tFont[2] = loadFont("../assets/OpenSans-Regular.ttf");
  pgTextFactor[2] = 0.825;

  tFont[3] = loadFont("../assets/OpenSans-Regular.ttf");
  pgTextFactor[3] = 0.835;

  tFont[4] = loadFont("../assets/Roboto-Thin.ttf");
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
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  let canvas = createCanvas(w, h);

  thisDensity = pixelDensity();

  var engineOptions = {}
  engine = Engine.create(engineOptions);
  world = engine.world;
  
  if (tFont[fontSelect]) {
    textFont(tFont[fontSelect]);
  }
  textSize(pgTextSize);
  strokeJoin(ROUND);

  reSetting();

  // TYPE PIECES
  dropGroup = new DropAll();

  // BOUNDARY
  for(var m = 0; m < 4; m++){
    boundaries.push(new Boundary(0, 0, height + width, 400, 0));
  }
  positionBoundaries();
  
  // MOUSE THINGS
  let canvasMouse = Mouse.create(canvas.elt);
  let options = { mouse: canvasMouse, }
  canvasMouse.pixelRatio = pixelDensity();
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
  lastTextTime = millis();
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
    lastTextTime = millis();
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
    if (millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
      newText();
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = millis();
        newText();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
        newText();
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

  world.gravity.x = cos(gravityAng);
  world.gravity.y = sin(gravityAng);
  world.gravity.scale = gravityStrength;

  background(bkgdColor);
  Engine.update(engine);

  if (dropGroup) {
    dropGroup.run();
  }

  if(borderWeight > 0){
    borderWeight -= 0.05;
    stroke('#5080bf');
    strokeWeight(borderWeight);
    noFill();
    rectMode(CENTER);
    rect(width/2, height/2, width - (width - typeCoreW) * padFactor, height - (height - typeCoreH) * padFactor); 
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
  resizeCanvas(windowWidth, windowHeight);
  newText();
}

function positionBoundaries(){
  var vertPad = (height - typeCoreH)/2 * padFactor;
  var horzPad = (width - typeCoreW)/2 * padFactor;

  Matter.Body.setPosition(boundaries[0].body, {x: width/2, y: height + 200 - vertPad});
  Matter.Body.setAngle(boundaries[0].body, 0);

  Matter.Body.setPosition(boundaries[1].body, {x: width/2, y: - 200 + vertPad});
  Matter.Body.setAngle(boundaries[1].body, PI);

  Matter.Body.setPosition(boundaries[2].body, {x: - 200 + horzPad, y: height/2});
  Matter.Body.setAngle(boundaries[2].body, PI/2);

  Matter.Body.setPosition(boundaries[3].body, {x: width + 200 - horzPad, y: height/2});
  Matter.Body.setAngle(boundaries[3].body, PI * 3/2);

  borderWeight = 2;
}
