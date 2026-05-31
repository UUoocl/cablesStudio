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
  textSize(testerSize);
  textFont(tFont[selFont]);
  
  ///////// FIND THE LONGEST LINE
  var longestLine = 0;
  var measurer = 0;

  for(var m = 0; m < inputText.length; m++){
    var tapeMeasurer = textWidth(inputText[m]);

    if(tapeMeasurer > measurer){
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  ///////// FIND THE SIZE THAT FILLS TO THE MAX WIDTH
  var widthTest = wWindow;

  let sizeHolder = 2;
  textSize(sizeHolder);
  let holdW = 0;

  while(holdW < widthTest){
    textSize(sizeHolder);
    holdW = textWidth(inputText[longestLine]);

    sizeHolder += 2;
  }
  pgTextSize = sizeHolder;

  ///////// MAKE SURE THE HEIGHT DOESN'T BREAK THE HEIGHT
  var heightTest = (height - 100) - (inputText.length - 1) * leading;
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
  scaler = map(val, 0, 100, 0.1, 1);
  wWindow = map(scaler, 0, 1, wWindowMin, wWindowMax);
  setText();
}

function setMinFlux(val){
  minFlux = map(val, 0, 100, -150, 150);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reDistance();
  }
}

function setMaxFlux(val){
  maxFlux = map(val, 0, 100, -150, 150);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reDistance();
  }
}

function setRandomFlux(val){
  randomFlux = map(val, 0, 100, 1, 20);

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
  stageAlength = round(map(val, 0, 100, 10, 200));
  setAnimStages();
}

function setStageBdirect(val){
  stageBdirect = val;
}

function setStageBstrength(val){
  stageBstrength = val;
}

function setStageBlength(val){
  stageBlength = round(map(val, 0, 100, 10, 200));
  setAnimStages();
}

function setPauseLength(val){
  pauseLength = round(map(val, 0, 100, 1, 100));
  setAnimStages();
}

function setDelay(val){
  delayMax = map(val, 0, 100, -1, -100);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].resetFull();
  }
}

function setForeColor(val){
  foreColor = color(val);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reColor();
  }
}
function setBkgdColor(val){ bkgdColor = color(val); }

function setColorSet(index, val){
  colorSet[index] = color(val);

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
  resLon = round(map(val, 0, 100, 50, 400));

  ang = TWO_PI/resLon;
  makeSpokes();
}

function setTaperOn(){
  taperOn = !taperOn;

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setBaseSW(val){
  baseSW = map(val, 0, 100, 0.1, 20);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setMinSW(val){
  minSW = map(val, 0, 100, 0.1, 30);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setMaxSW(val){
  maxSW = map(val, 0, 100, 0.1, 30);

  for(var m = 0; m < spokes.length; m++){
    spokes[m].reStroke();
  }
}

function setScrubOn(){
  scrubOn = !scrubOn;
}

function setScrubVal(val){
  scrubVal = map(val, 0, 100, 0, scrubFull);
}

function generateRandomPalette(){
  var rs0 = random(80);
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
    colorSet[m] = color(holdCol[m]);
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
  var rs0 = random(80);

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

  var rs1 = random(30);
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
