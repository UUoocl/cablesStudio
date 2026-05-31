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
    sceneLength = floor(frameRate()) + 2;
  }
}

function setAccelMode(val){
  accelMode = val;
}

function setForeColor(val){
  foreColor = color(val);
}

function setBkgdColor(val){
  bkgdColor = color(val);
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
  sceneRepeats = round(val);
}

function toggleColorSwap(val){
  colorSwapOn = Boolean(val);
}

function sizeSaveChange(val){
  saveMode = val;
  resizeForPreview();
}