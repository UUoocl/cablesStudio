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
  textSize(testerSize);
  textFont(tFont[fontSel]);
  
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
  var heightTest = (height - 30);
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
  textScale = map(val, 0, 100, 0.2, 3);
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
  vesselSW = map(val, 0, 100, 0, 50);
}

function setDebugOn(){
  debugOn = !debugOn;
}
 
function setCenterOn(){
  centerOn = !centerOn;
}

function refigureStages(){
  var tempA = map(stageAlength, 0, 100, 10, 100);
  var tempB = map(stageBlength, 0, 100, 10, 60);
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
  lineDelay = map(val, 0, 100, 0, -30);
  createAnimation();
  runCoreReset();
}

function setLetterOffset(val){
  charDelay = map(val, 0, 100, 0, -30);
  createAnimation();
  runCoreReset();
}
