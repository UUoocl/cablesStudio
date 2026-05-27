// LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var tracking = 10;

// FIELD
var xSpace, ySpace;
var SA;

// RIBBONS
var ribbonCount = 9;
var ribbonSpaceX = -17;
var ribbonSpaceY = -35;
var ribbonSize = 35;
var ribbonColor;
var ribbonOffset = 0.2;

// WAVE
var yWave = 95, yWaver;
var speed = 0.01;
var offset = 0.26;
var slope = 1;

// STRING
var letter_select, inpText = "SPACE TYPE GENERATOR _V.STRIPES";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 3;

var font;

function preload() {
  font = loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : windowHeight;
  createCanvas(w, h);
  pixelDensity(1);
  smooth();
  textFont(font);

  // Initialize defaults
  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  typeX = 20; typeY = 40; typeStroke = 2; tracking = 10;
  ribbonCount = 9; ribbonSpaceX = -17; ribbonSpaceY = -35; ribbonSize = 35; ribbonOffset = 0.2;
  yWave = 95; speed = 0.01; offset = 0.26; slope = 1;

  inp1 = color('#ff0000');
  inp2 = color('#0000ff');
  inp3 = color('#ffff00');
  inp4 = color('#ffffff');
  inp5 = color('#000000');
  inp6 = color('#760089');
  bkgdColor = color('#ffffff00');

  inpNumber = 3;
  inpText = "SPACE TYPE GENERATOR _V.STRIPES";
}

function marqueeSet() {
  reSetting();
  typeX = 15; typeY = 25; typeStroke = 3; tracking = 30;
  ribbonCount = 11; ribbonSpaceX = 43; ribbonSpaceY = 57; ribbonSize = 45; ribbonOffset = 0.4;
  yWave = 41; speed = 0.025; offset = PI; slope = 2;
  inp1 = color('#ff0000'); inp2 = color('#ffffff'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "gHoEoLdLbOy?e";
  inpNumber = 5;
  bkgdColor = color('#ffff00');
}

function subwaySet() {
  reSetting();
  typeX = 20; typeY = 12; typeStroke = 2; tracking = 7;
  ribbonCount = 20; ribbonSpaceX = -10; ribbonSpaceY = 35; ribbonSize = 18; ribbonOffset = 2.4;
  yWave = 60; speed = 0.02; offset = 0.27; slope = 4;
  inp1 = color('#ff0000'); inp2 = color('#ffffff'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "Time moves in one direction, memory in another.";
  inpNumber = 4;
  bkgdColor = color('#000000');
}

function simpleWaveSet() {
  reSetting();
  typeX = 12; typeY = 19; typeStroke = 2; tracking = 9;
  ribbonCount = 8; ribbonSpaceX = 0; ribbonSpaceY = 0; ribbonSize = 23; ribbonOffset = 0.5;
  yWave = 100; speed = 0.01; offset = 0.2; slope = 1;
  inp1 = color('#ff0000'); inp2 = color('#ffff00'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "STG_v.Stripes*STG_v.Stripes*STG_v.Stripes*";
  inpNumber = 3;
  bkgdColor = color('#FFFFFF');
}

function oldSeaSet() {
  reSetting();
  typeX = 9; typeY = 74; typeStroke = 2; tracking = 18;
  ribbonCount = 18; ribbonSpaceX = -2; ribbonSpaceY = 60; ribbonSize = 26; ribbonOffset = 0.8;
  yWave = 44; speed = 0.3; offset = 0.22; slope = 1;
  inp1 = color('#000000'); inp2 = color('#4d4d4d'); inp3 = color('#808080'); inp4 = color('#b3b3b3'); inp5 = color('#f2f2f2');
  inpText = "LEIK*COMENNT*SUSCRIBE*LIKE*COMENT*SUBCRIBE*IKE*COMMNT*SUBSCRIB";
  inpNumber = 5;
  bkgdColor = color('#FFFFFF');
}

function colorSeaSet() {
  reSetting();
  typeX = 20; typeY = 46; typeStroke = 2; tracking = 11;
  ribbonCount = 33; ribbonSpaceX = 5; ribbonSpaceY = 37; ribbonSize = 35; ribbonOffset = 3.1;
  yWave = 45; speed = 0.03; offset = 0.42; slope = 1;
  inp1 = color('#ff0000'); inp2 = color('#FFFFFF'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "To be whole is to be part; true voyage is return.";
  inpNumber = 5;
  bkgdColor = color('#000000');
}

function wowSet() {
  reSetting();
  typeX = 20; typeY = 40; typeStroke = 2; tracking = 40;
  ribbonCount = 14; ribbonSpaceX = -38; ribbonSpaceY = 47; ribbonSize = 49; ribbonOffset = 0;
  yWave = 100; speed = 0.05; offset = 2.96; slope = 1;
  inp1 = color('#ff0000'); inp2 = color('#FFFFFF'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "*W*O*W* *W*O*W* *W*O*W* *W*O*W* *W*O*W* *W*O*W* *W*O*W* *W*O*W* ";
  inpNumber = 5;
  bkgdColor = color('#0000ff');
}

function stacksSet() {
  reSetting();
  typeX = 10; typeY = 100; typeStroke = 3; tracking = 10;
  ribbonCount = 34; ribbonSpaceX = -2; ribbonSpaceY = -2; ribbonSize = 57; ribbonOffset = 0.1;
  yWave = 34; speed = 0.06; offset = 0.2; slope = 1;
  inp1 = color('#ff0000'); inp2 = color('#FFFFFF'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "Stacks on Stacks";
  inpNumber = 5;
  bkgdColor = color('#ff0000');
}

function notSoWeirdSet() {
  reSetting();
  typeX = 11; typeY = 100; typeStroke = 2; tracking = 10;
  ribbonCount = 23; ribbonSpaceX = -5; ribbonSpaceY = 16; ribbonSize = 81; ribbonOffset = 2.9;
  yWave = 22; speed = 0.03; offset = 0.31; slope = 1;
  inp1 = color('#ff0000'); inp2 = color('#FFFFFF'); inp3 = color('#0000ff'); inp4 = color('#ffff00'); inp5 = color('#000000');
  inpText = "I'M NOT SO WEIRD TO ME.";
  inpNumber = 5;
  bkgdColor = color('#FFFFFF');
}

function racerSet() {
  reSetting();
  typeX = 35; typeY = 15; typeStroke = 2; tracking = 2;
  ribbonCount = 20; ribbonSpaceX = 3; ribbonSpaceY = -15; ribbonSize = 32; ribbonOffset = 0.4;
  yWave = 100; speed = 0.02; offset = 0.18; slope = 0.6;
  inp1 = color('#ffff00'); inp2 = color('#0000ff'); inp3 = color('#ffffff'); inp4 = color('#0000ff'); inp5 = color('#ff0000');
  inpText = "GO GO SPEED RACER GO GO SPEED RACER!";
  inpNumber = 5;
  bkgdColor = color('#ffff00');
}

function simpleWave2Set() {
  reSetting();
  typeX = 7; typeY = 42; typeStroke = 2; tracking = 11;
  ribbonCount = 34; ribbonSpaceX = -4; ribbonSpaceY = 20; ribbonSize = 22; ribbonOffset = 0.2;
  yWave = 98; speed = 0.02; offset = 0.14; slope = 1;
  inp1 = color('#ffff00'); inp2 = color('#0000ff'); inp3 = color('#ffffff'); inp4 = color('#0000ff'); inp5 = color('#ff0000');
  inpText = "A word after a word after a word is power";
  inpNumber = 5;
  bkgdColor = color('#000000');
}

function prideSet() {
  inpNumber = 6;
  inp1 = color('#e70000'); inp2 = color('#ff8c00'); inp3 = color('#ffef00'); inp4 = color('#00811f'); inp5 = color('#0044ff'); inp6 = color('#760089');
  bkgdColor = color('#ffffff');
}

function updateSettings(data) {
  if (!data) return;

  if (data.preset) {
    const p = data.preset.toLowerCase();
    if (p === 'marquee') marqueeSet();
    else if (p === 'subway') subwaySet();
    else if (p === 'simplewave') simpleWaveSet();
    else if (p === 'oldsea') oldSeaSet();
    else if (p === 'colorsea') colorSeaSet();
    else if (p === 'wow') wowSet();
    else if (p === 'stacks') stacksSet();
    else if (p === 'notsoweird') notSoWeirdSet();
    else if (p === 'racer') racerSet();
    else if (p === 'simplewave2') simpleWave2Set();
    else if (p === 'pride') prideSet();
    else if (p === 'reset') reSetting();
  }

  if (data.text !== undefined) inpText = String(data.text);
  else if (data.string !== undefined) inpText = String(data.string);

  if (data.typeX !== undefined) typeX = data.typeX;
  if (data.typeY !== undefined) typeY = data.typeY;
  if (data.typeStroke !== undefined) typeStroke = data.typeStroke;
  if (data.tracking !== undefined) tracking = data.tracking;

  if (data.ribbonCount !== undefined) ribbonCount = data.ribbonCount;
  if (data.ribbonSpaceX !== undefined) ribbonSpaceX = data.ribbonSpaceX;
  if (data.ribbonSpaceY !== undefined) ribbonSpaceY = data.ribbonSpaceY;
  if (data.ribbonSize !== undefined) ribbonSize = data.ribbonSize;
  if (data.ribbonOffset !== undefined) ribbonOffset = data.ribbonOffset;

  if (data.yWave !== undefined) yWave = data.yWave;
  if (data.speed !== undefined) speed = data.speed;
  if (data.offset !== undefined) offset = data.offset;
  if (data.slope !== undefined) slope = data.slope;

  if (data.bkgdColor !== undefined) bkgdColor = color(data.bkgdColor);
  if (data.color1 !== undefined) { inp1 = color(data.color1); inpNumber = 1; }
  if (data.color2 !== undefined) { inp2 = color(data.color2); inpNumber = 2; }
  if (data.color3 !== undefined) { inp3 = color(data.color3); inpNumber = 3; }
  if (data.color4 !== undefined) { inp4 = color(data.color4); inpNumber = 4; }
  if (data.color5 !== undefined) { inp5 = color(data.color5); inpNumber = 5; }
  if (data.color6 !== undefined) { inp6 = color(data.color6); inpNumber = 6; }
}

function draw() {
  clear();
  background(bkgdColor);

  runLength = inpText.length;
  xSpace = typeX + tracking;
  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;
  noFill();

  push();
  translate(width / 2, height / 2);
  translate(-xSpace * runLength / 2 - ribbonCount * ribbonSpaceX / 2, -ribbonCount * ribbonSpaceY / 2);

  // FLAG / STRIPES
  for (var k = 0; k < ribbonCount; k++) {

    // Ribbon Shadow
    strokeWeight(typeY + ribbonSize);
    stroke(0, 0, 0, 50);
    strokeCap(SQUARE);
    strokeJoin(ROUND);
    beginShape();
    for (var i = -1; i <= runLength; i++) {
      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      vertex(i * xSpace + k * ribbonSpaceX - ribbonSpaceX / 7, k * ribbonSpaceY - ribbonSpaceY / 7 + yWaver);
    }
    endShape();

    // Ribbon
    setRibbonColor(k);
    strokeWeight(typeY + ribbonSize);
    stroke(ribbonColor);
    beginShape();
    for (var i = -1; i <= runLength; i++) {
      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      vertex(i * xSpace + k * ribbonSpaceX, k * ribbonSpaceY + yWaver);
    }
    endShape();

    // Type
    setTextColor(k);
    strokeWeight(typeStroke);
    stroke(strkColor);
    strokeCap(PROJECT);
    for (var i = 0; i < runLength; i++) {
      var yWaverPre = sinEngine(offset, i - 1, ribbonOffset, k, -speed, slope) * yWave;
      var yWaverPost = sinEngine(offset, i + 1, ribbonOffset, k, -speed, slope) * yWave;
      var rotateFix = atan2(yWaverPost - yWaverPre, 2 * xSpace);

      yWaver = sinEngine(offset, i, ribbonOffset, k, -speed, slope) * yWave;
      letter_select = i;

      push();
      translate(i * xSpace + k * ribbonSpaceX, k * ribbonSpaceY + yWaver);
      rotate(rotateFix);
      translate(-(typeX) / 2, -(typeY) / 2);

      keyboardEngine();
      pop();
    }
  }
  pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var sinus = sin((frameCount * Speed + xCounter * xLength + yCounter * yLength));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - pow(1 - abs(sinus), slopeN));
  return sinerSquare;
}

function setRibbonColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { ribbonColor = inp1; }
    if (switcher % 6 == 1) { ribbonColor = inp2; }
    if (switcher % 6 == 2) { ribbonColor = inp3; }
    if (switcher % 6 == 3) { ribbonColor = inp4; }
    if (switcher % 6 == 4) { ribbonColor = inp5; }
    if (switcher % 6 == 5) { ribbonColor = inp6; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { ribbonColor = inp1; }
    if (switcher % 5 == 1) { ribbonColor = inp2; }
    if (switcher % 5 == 2) { ribbonColor = inp3; }
    if (switcher % 5 == 3) { ribbonColor = inp4; }
    if (switcher % 5 == 4) { ribbonColor = inp5; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { ribbonColor = inp1; }
    if (switcher % 4 == 1) { ribbonColor = inp2; }
    if (switcher % 4 == 2) { ribbonColor = inp3; }
    if (switcher % 4 == 3) { ribbonColor = inp4; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { ribbonColor = inp1; }
    if (switcher % 3 == 1) { ribbonColor = inp2; }
    if (switcher % 3 == 2) { ribbonColor = inp3; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { ribbonColor = inp1; }
    if (switcher % 2 == 1) { ribbonColor = inp2; }
  } else if (inpNumber == 1) {
    ribbonColor = inp1;
  }
}

function setTextColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { strkColor = inp6; }
    if (switcher % 6 == 1) { strkColor = inp1; }
    if (switcher % 6 == 2) { strkColor = inp4; }
    if (switcher % 6 == 3) { strkColor = inp3; }
    if (switcher % 6 == 4) { strkColor = inp2; }
    if (switcher % 6 == 5) { strkColor = inp5; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { strkColor = inp5; }
    if (switcher % 5 == 1) { strkColor = inp1; }
    if (switcher % 5 == 2) { strkColor = inp2; }
    if (switcher % 5 == 3) { strkColor = inp3; }
    if (switcher % 5 == 4) { strkColor = inp4; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { strkColor = inp4; }
    if (switcher % 4 == 1) { strkColor = inp1; }
    if (switcher % 4 == 2) { strkColor = inp2; }
    if (switcher % 4 == 3) { strkColor = inp3; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { strkColor = inp3; }
    if (switcher % 3 == 1) { strkColor = inp1; }
    if (switcher % 3 == 2) { strkColor = inp2; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { strkColor = inp2; }
    if (switcher % 2 == 1) { strkColor = inp1; }
  } else if (inpNumber == 1) {
    strkColor = bkgdColor;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
