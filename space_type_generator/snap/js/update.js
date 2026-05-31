function setText(){
  textSize(pgTextSize);
  textFont(currentFont);

  var enteredText = inpText || "";
  keyText = enteredText;
  keyArray = enteredText.match(/[^\r\n]+/g);

  if(keyArray == null){
    keyArray = "";
  }

  resetAnim();
}

function setFont(val){
  currentFont = tFont[val];
  setText();
}

function setForeColor(val){
  foreColor = color(val);
}

function setBkgdColor(val){
  bkgdColor = color(val);
}

function setFontSize(val){ 
  for(var p = 0; p < groupCount; p++){
    kineticGroups[p] = 0;
  }

  pgTextSize = int(val);
  lineHeight = pgTextSize * 0.8;

  setText();
}

function sizeSaveChange(val){
  saveSizeState = val;

  if(saveSizeState == 0){
    newHeight = heightHold;
    newWidth = widthHold;

    cXadjust = 0;
    cYadjust = 0;
  } else if(saveSizeState == 1){
    if(widthHold > heightHold * 9/16){
      newHeight = heightHold;
      newWidth = heightHold * 9/16;
  
      cXadjust = -(widthHold - newWidth)/2;
      cYadjust = 0;
    } else {
      newHeight = widthHold * 16/9;
      newWidth = widthHold;

      cXadjust = 0;
      cYadjust = -(heightHold - newHeight)/2;
    }
  } else if(saveSizeState == 2){
    if(widthHold > heightHold){
      newWidth = heightHold;
      newHeight = heightHold;

      cXadjust = -(widthHold - newWidth)/2;
      cYadjust = 0;
    } else if(heightHold >= widthHold){
      newHeight = widthHold;
      newWidth = widthHold;

      cXadjust = 0;
      cYadjust = -(heightHold - newHeight)/2;
    }
  }

  horzSpacer = newWidth/2;
  frameFade = 4;

  setText();
}
