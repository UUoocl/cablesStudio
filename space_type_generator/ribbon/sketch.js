var segmentCount, segmentSpace, segmentLength;
var depth, typeHeight, tracking;
var typeStroke;
var xCenter, yCenter;
var radius, side, textDirect;
var sinStep, step;
var jumper = 0;
var count = 1;
var zSpace, xSpace;
var middleStretch = 2;

var bkgdColor, textColor, textColorAdjust;
var inp1Val, inp2Val, inp3Val, inp4Val, inp5Val;
var inpNumber = 3;
var typeX, typeY;
var rotX, rotY, rotZ;
var SA;
var scaler;

var latX;
var letXspeed;
var speed;
var ribbonColor;
var strkColor;

// STRING
var letter_select, inpText, runLength;
var myText = [];

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;


var altCheckVal = false;
var inp0checkVal = false;
var gradientCheckVal = true;
var bSideCheckVal = true;

function preload() {
  font = loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h, WEBGL);
  textFont(font);
  frameRate(30);

  // Initialize with default preset
  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
    segmentSpace = 15;
    segmentCount = 15;
    typeHeight = 30;
    tracking = 30;
    typeStroke = 1;
    speed = 0.1;
    depth = 30;
    middleStretch = 0.5;
    count = 1;
    zSpace = 1;
    xSpace = 0;
    altCheckVal = false;
    scaler = 1.6;
    rotX = -1.79;
    rotY = 0;
    rotZ = -0.4;
    inp0checkVal = false;
    gradientCheckVal = true;
    bSideCheckVal = true;
    inp1Val = '#0000ff';
    inp2Val = '#ff0000';
    inp3Val = '#ffff00';
    inp4Val = '#ffffff';
    inp5Val = '#000000';
    inpNumber = 3;
    
    bkgdColor = color(255);
    textColor = color(0);
    textColorAdjust = lerpColor(bkgdColor, textColor, 0.01);
    
    inpText = " Somewhere something incredible is waiting to be known. Somewhere something incredible is waiting to be known. ";

    clearTextDelay = 0;
    clearMethod = "all at once";
    seqInterval = 100;
    hideNoText = false;
    lastTextTime = millis();
    isClearing = false;
    lastRemoveTime = 0;
}

function applyCustomPreset(settings) {
    if (!settings) return;
    
    reSetting();
    
    if (settings.segmentSpace !== undefined) segmentSpace = settings.segmentSpace;
    if (settings.segmentCount !== undefined) segmentCount = settings.segmentCount;
    if (settings.typeHeight !== undefined) typeHeight = settings.typeHeight;
    if (settings.tracking !== undefined) tracking = settings.tracking;
    if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
    if (settings.speed !== undefined) speed = settings.speed;
    if (settings.depth !== undefined) depth = settings.depth;
    if (settings.middleStretch !== undefined) middleStretch = settings.middleStretch;
    if (settings.count !== undefined) count = settings.count;
    if (settings.zSpace !== undefined) zSpace = settings.zSpace;
    if (settings.xSpace !== undefined) xSpace = settings.xSpace;
    if (settings.altCheck !== undefined) altCheckVal = settings.altCheck;
    if (settings.scaler !== undefined) scaler = settings.scaler;
    if (settings.rotX !== undefined) rotX = settings.rotX;
    if (settings.rotY !== undefined) rotY = settings.rotY;
    if (settings.rotZ !== undefined) rotZ = settings.rotZ;
    if (settings.inp0check !== undefined) inp0checkVal = settings.inp0check;
    if (settings.gradientCheck !== undefined) gradientCheckVal = settings.gradientCheck;
    if (settings.bSideCheck !== undefined) bSideCheckVal = settings.bSideCheck;
    
    if (settings.color1 !== undefined) inp1Val = settings.color1;
    if (settings.color2 !== undefined) inp2Val = settings.color2;
    if (settings.color3 !== undefined) inp3Val = settings.color3;
    if (settings.color4 !== undefined) inp4Val = settings.color4;
    if (settings.color5 !== undefined) inp5Val = settings.color5;
    if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
    
    if (settings.bkgdColor !== undefined) bkgdColor = color(settings.bkgdColor);
    if (settings.textColor !== undefined) textColor = color(settings.textColor);
    if (settings.text !== undefined) inpText = settings.text;
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
    }
    if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
    if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
    if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
    if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

    if (data.segmentSpace !== undefined) segmentSpace = Number(data.segmentSpace);
    if (data.segmentCount !== undefined) segmentCount = Number(data.segmentCount);
    if (data.typeHeight !== undefined) typeHeight = Number(data.typeHeight);
    if (data.tracking !== undefined) tracking = Number(data.tracking);
    if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
    if (data.speed !== undefined) speed = Number(data.speed);
    if (data.depth !== undefined) depth = Number(data.depth);
    if (data.middleStretch !== undefined) middleStretch = Number(data.middleStretch);
    if (data.count !== undefined) count = Number(data.count);
    if (data.zSpace !== undefined) zSpace = Number(data.zSpace);
    if (data.xSpace !== undefined) xSpace = Number(data.xSpace);
    if (data.altCheck !== undefined) altCheckVal = Boolean(data.altCheck) || data.altCheck === 'true';
    if (data.scaler !== undefined) scaler = Number(data.scaler);
    if (data.rotX !== undefined) rotX = Number(data.rotX);
    if (data.rotY !== undefined) rotY = Number(data.rotY);
    if (data.rotZ !== undefined) rotZ = Number(data.rotZ);
    if (data.inp0check !== undefined) inp0checkVal = Boolean(data.inp0check) || data.inp0check === 'true';
    if (data.gradientCheck !== undefined) gradientCheckVal = Boolean(data.gradientCheck) || data.gradientCheck === 'true';
    if (data.bSideCheck !== undefined) bSideCheckVal = Boolean(data.bSideCheck) || data.bSideCheck === 'true';
    
    if (data.color1 !== undefined) inp1Val = String(data.color1);
    if (data.color2 !== undefined) inp2Val = String(data.color2);
    if (data.color3 !== undefined) inp3Val = String(data.color3);
    if (data.color4 !== undefined) inp4Val = String(data.color4);
    if (data.color5 !== undefined) inp5Val = String(data.color5);
    if (data.inpNumber !== undefined) inpNumber = Number(data.inpNumber);
    
    if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
    if (data.textColor !== undefined) textColor = color(data.textColor);

    // Handle save request
    if (data.action === "savePreset") {
        const payload = {
            type: "savePreset",
            iframeSrc: window.location.href,
            name: data.name || "custom_preset",
            settings: {
                segmentSpace: segmentSpace,
                segmentCount: segmentCount,
                typeHeight: typeHeight,
                tracking: tracking,
                typeStroke: typeStroke,
                speed: speed,
                depth: depth,
                middleStretch: middleStretch,
                count: count,
                zSpace: zSpace,
                xSpace: xSpace,
                altCheck: altCheckVal,
                scaler: scaler,
                rotX: rotX,
                rotY: rotY,
                rotZ: rotZ,
                inp0check: inp0checkVal,
                gradientCheck: gradientCheckVal,
                bSideCheck: bSideCheckVal,
                color1: inp1Val,
                color2: inp2Val,
                color3: inp3Val,
                color4: inp4Val,
                color5: inp5Val,
                inpNumber: inpNumber,
                bkgdColor: bkgdColor.toString(),
                textColor: textColor.toString()
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
    } else if (clearMethod === "sequential") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = millis();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = millis();
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
  runLength = inpText.length;
  sinStep = PI / segmentCount;  
  
  segmentLength = segmentCount * segmentSpace;
  radius = (segmentLength) / PI;
  
  textColorAdjust = lerpColor(bkgdColor, textColor, 0.01);

  push();  
  scale(scaler);
  rotateX(rotX);
  rotateY(rotY);
  rotateZ(rotZ + PI);

  let yCrawl = (runLength + frameCount * speed) / (segmentCount + segmentCount * middleStretch) * radius * 2;
  let ribbonHeight = runLength / (segmentCount + segmentCount * middleStretch) * radius * 2.25;
  let ribbonHeight2 = (count - 1) * xSpace * radius * 2;

  let ribbonWidth = segmentLength * middleStretch;
  
  if (altCheckVal === true) {
    translate(-ribbonWidth / 2, -yCrawl + ribbonHeight / 2 - radius, -depth * (count - 1) / 2 - (count - 1) * (zSpace - 1) * depth / 2);
  } else {
    translate(-ribbonWidth / 2, -yCrawl + ribbonHeight / 2 - (ribbonHeight2) / 2, -depth * (count - 1) / 2 - (count - 1) * (zSpace - 1) * depth / 2);
  }
  
  rectMode(CENTER);
  
  for (var j = 0; j < count; j++) {
    for (var i = frameCount * speed; i < runLength + frameCount * speed; i++) {
      step = i % (2 * segmentCount + 2 * segmentCount * middleStretch);
      
      if (gradientCheckVal === true) {
        setGradient(i - frameCount * speed);
      } else {
        ribbonColor = color(inp1Val);
      }
      
      letter_select = runLength - round(i + 1 - frameCount * speed);
      jumper = floor(i / (segmentCount * 2 + 2 * segmentCount * middleStretch));
    
      xCenterPre = xCenter;
      yCenterPre = yCenter;
      
      if (i % (2 * segmentCount + 2 * segmentCount * middleStretch) <= (segmentCount * middleStretch)) {
        xCenter = step * segmentSpace;
        yCenter = jumper * radius * 4;
        rot = 0;
        side = 1; textDirect = -1;
      } else if (i % (2 * segmentCount + 2 * segmentCount * middleStretch) <= (segmentCount + segmentCount * middleStretch)) {
        step -= segmentCount * middleStretch;
        xCenter = segmentLength * middleStretch;
        yCenter = jumper * radius * 4;
        rot = step * sinStep;
        side = 1; textDirect = -1;
      } else if (i % (2 * segmentCount + 2 * segmentCount * middleStretch) <= (segmentCount + 2 * segmentCount * middleStretch)) {
        step -= (segmentCount * middleStretch + segmentCount);
        xCenter = segmentLength * middleStretch - step * segmentSpace;
        yCenter = radius * 2 + jumper * radius * 4;
        rot = 0;
        side = -1; textDirect = 1;
      } else if (i % (2 * segmentCount + 2 * segmentCount * middleStretch) <= (2 * segmentCount + 2 * segmentCount * middleStretch)) {
        step -= (segmentCount * middleStretch + segmentCount);
        xCenter = 0;
        yCenter = radius * 2 + jumper * radius * 4;
        rot = -step * sinStep + PI * middleStretch;
        side = -1; textDirect = 1;
      }
    
      typeX = (segmentSpace - (tracking / 100) * segmentSpace) * textDirect;
      typeY = depth - (typeHeight / 100) * depth;
    
      let trackingAdjust = (tracking / 100) * segmentSpace * -textDirect;
      let typeHeightAdjust = (typeHeight / 100) * depth;
      
      push();
        if (altCheckVal === true) {
          translate(xCenter, yCenter + (j % 2) * radius * 2, j * depth * zSpace);
        } else {
          translate(xCenter, yCenter + j * xSpace * radius * 2, j * depth * zSpace);
        }
  
      rotateZ(rot);
        translate(0, -radius);
        rotateX(PI / 2);
      
        if (inp0checkVal === false) {
          stroke(ribbonColor); fill(ribbonColor);
          strokeWeight(2);
          rect(0, 0, segmentSpace, depth);
          if (bSideCheckVal === true) {
            translate(0, 0, side);
            fill(textColor); stroke(textColor);
            rect(0, 0, segmentSpace, depth);
          }
        }
        if (bSideCheckVal === true) {
          translate(-typeX / 2, -depth / 2 + typeHeightAdjust / 2, -3 * side / 2);
        } else {
          translate(-typeX / 2, -depth / 2 + typeHeightAdjust / 2, 0);        
        }
        noFill(); stroke(textColor); strokeWeight(typeStroke);
        keyboardEngine();
      
        if (inp0checkVal === true) {
          translate(0, 0, side / 2);
          noFill(); stroke(textColorAdjust); strokeWeight(typeStroke);
          keyboardEngine();
        }
      pop();
    }
  }
  pop();


  
  if (typeof captureFrame === 'function') captureFrame();
}

function setGradient(switcher) {
  if (inpNumber == 5 || inpNumber == 6) {
    let from = color(inp1Val);
    let mid = color(inp2Val);
    let mid2 = color(inp3Val);
    let mid3 = color(inp4Val);
    let to = color(inp5Val);    
    if (switcher <= (runLength / 4)) {
      ribbonColor = lerpColor(from, mid, switcher / (runLength / 4));
      strkColor = from;
    } else if (switcher > (runLength / 4) && switcher <= (runLength / 2)) {
      ribbonColor = lerpColor(mid, mid2, (switcher - runLength / 4) / (runLength / 4));
      strkColor = mid;
    } else if (switcher > (runLength / 2) && switcher <= (3 * runLength / 4)) {
      ribbonColor = lerpColor(mid2, mid3, (switcher - runLength / 2) / (runLength / 4));
      strkColor = mid2;
    } else {
      ribbonColor = lerpColor(mid3, to, (switcher - 3 * runLength / 4) / (runLength / 4));
      strkColor = mid3;
    }
  } else if (inpNumber == 4) {
    let from = color(inp1Val);
    let mid = color(inp2Val);
    let mid2 = color(inp3Val);
    let to = color(inp4Val);
    if (switcher <= (runLength / 3)) {
      ribbonColor = lerpColor(from, mid, switcher / (runLength / 3));
      strkColor = from;
    } else if (switcher > (runLength / 3) && switcher <= (2 * runLength / 3)) {
      ribbonColor = lerpColor(mid, mid2, (switcher - runLength / 3) / (runLength / 3));
      strkColor = mid;
    } else {
      ribbonColor = lerpColor(mid2, to, (switcher - 2 * runLength / 3) / (runLength / 3));
      strkColor = mid2;
    }
  } else if (inpNumber == 3) {
    let from = color(inp1Val);
    let mid = color(inp2Val);
    let to = color(inp3Val);
    if (switcher <= (runLength / 2)) {
      ribbonColor = lerpColor(from, mid, switcher / (runLength / 2));
      strkColor = from;
    } else {
      ribbonColor = lerpColor(mid, to, (switcher - runLength / 2) / (runLength / 2));
      strkColor = mid;
    }
  } else if (inpNumber == 2) {
    let from = color(inp1Val);
    let to = color(inp2Val);
    ribbonColor = lerpColor(from, to, switcher / runLength);
    strkColor = from;
  } else if (inpNumber == 1) {
    let from = color(inp1Val);
    let to = bkgdColor;
    ribbonColor = lerpColor(from, to, switcher / runLength);
    strkColor = to;
  }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
