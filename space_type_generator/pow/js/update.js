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
  pgTextSize = int(map(val, 0, 100, 10, 400));
  coreScale = pgTextSize/250;  

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setFillColor(val){ fillColor = val; }
function setBkgdColor(val){ bkgdColor = val; }
function setStrokeColor(val){ strokeColor = val; }

function setCoreSW(val){
  coreSW = map(val, 1, 100, 0, 4);
}

function setDetailFactor(val){
  detailFactor = map(val, 1, 100, 1.5, 0.3);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setBlastFactor(val){
  blastFactor = map(val, 1, 100, 0.5, 3);

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setRatioFactor(val){
  ratioFactor = map(val, 1, 100, 0.1, 4);

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
  orgX = width/2;
  orgY = height/2;

  if (coreMousePop) coreMousePop.refresh(orgX, orgY);
}

function setFont(val){
  fontSelect = val;

  resetPop();
  if (coreSplode) coreSplode.refresh();
}

function setBlastType(val){
  blastType = val;

  orgX = width/2;
  orgY = height/2;

  buildIt();
}