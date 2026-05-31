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
  tFont[0] = loadFont("../assets/RobotoCondensed-Bold.ttf");
  tFont[1] = loadFont("../assets/Inter-Medium.ttf");
  tFont[2] = loadFont("../assets/RobotoCondensed-Bold.ttf");
  tFont[3] = loadFont("../assets/SpaceMono-Regular.ttf");
  tFont[4] = loadFont("../assets/RobotoCondensed-Bold.ttf");

  tFontFactor[0] = 0.75;
  tFontFactor[1] = 0.75;
  tFontFactor[2] = 0.75; 
  tFontFactor[3] = 0.9; 
  tFontFactor[4] = 0.8; 
}

function setup(){
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);

  thisDensity = pixelDensity();

  wWindowMin = width/8;
  wWindowMax = width;
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);

  c = createVector(width/2, height/2);

  ang = TWO_PI/resLon;
  if(width > height){
    radius = width;
  } else {
    radius = height;
  }
  radStep = (radius)/resLat;
  radMax = radius;

  foreColor = color('#ffffff');
  bkgdColor = color('#000000');

  colorSet[0] = color('#d90d43');
  colorSet[1] = color('#164df2');
  colorSet[2] = color('#f2b807');
  colorSet[3] = color('#078c4e');
  colorSet[4] = color('#f2a007');

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
  
  foreColor = color('#ffffff');
  bkgdColor = color('#000000');
  
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
  ang = TWO_PI/resLon;
  
  clearTextDelay = 0;
  clearMethod = "all at once";
  seqInterval = 100;
  hideNoText = false;
  lastTextTime = millis();
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
    
    if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
    if (settings.foreColor !== undefined) foreColor = color(settings.foreColor);
    
    wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
    ang = TWO_PI/resLon;
    
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
        lastTextTime = millis();
        isClearing = false;
        setText();
    }
    if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
    if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
    if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
    if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

    if (data.selFont !== undefined) { selFont = Number(data.selFont); setText(); }
    if (data.scaler !== undefined) { scaler = Number(data.scaler); wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax); setText(); }
    if (data.resLon !== undefined) { resLon = Number(data.resLon); ang = TWO_PI/resLon; makeSpokes(); }
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
    
    if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
    if (data.foreColor !== undefined) { foreColor = color(data.foreColor); for(var m = 0; m < spokes.length; m++) spokes[m].reColor(); }

    // Handle save request
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
      var tX = cos(tAng) * (n * radStep) + c.x;
      var tY = sin(tAng) * (n * radStep) + c.y;

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
    var distFromCenter = dist(c.x, c.y, spokes[p].p1.x, spokes[p].p1.y);
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
  wWindowMin = width/8;
  wWindowMax = width;
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
  c = createVector(width/2, height/2);

  if(width > height){
    radius = width;
  } else {
    radius = height;
  }
  radStep = (radius)/resLat;

  setText();
}
