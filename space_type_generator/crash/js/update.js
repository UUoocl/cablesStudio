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
        var rs0 = random(10);
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
  textSize(testerSize);
  if (tFont[fontSelect]) {
    textFont(tFont[fontSelect]);
  }
  
  ///////// FIND THE LONGEST LINE
  var longestLine = 0;
  var measurer = 0;

  for(var m = 0; m < unitCore.length; m++){
    var tapeMeasurer = 0;
    for(var n = 0; n < unitCore[m].length; n++){
      if(unitCore[m][n].mode == 0){
        tapeMeasurer += textWidth(unitCore[m][n].content + " ");
      } else if(unitCore[m][n].mode == 1){
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        tapeMeasurer += thisHR * testerSize * pgTextFactor[fontSelect];
      } else if(unitCore[m][n].mode == 2){
        tapeMeasurer += textWidth(unitCore[m][n].content + " ");
      }
    }

    if(tapeMeasurer > measurer){
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  ///////// FIND THE SIZE THAT FILLS TO THE MAX WIDTH
  var widthTest = (width - 30);

  let sizeHolder = 2;
  textSize(sizeHolder);
  let holdW = 0;

  while(holdW < widthTest){
    holdW = 0;
    for(var n = 0; n < unitCore[longestLine].length; n++){
      if(unitCore[longestLine][n].mode == 0){
        textSize(sizeHolder)
        holdW += textWidth(unitCore[longestLine][n].content + " ");
      } else if(unitCore[longestLine][n].mode == 1){
        var thisImage = unitCore[longestLine][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        holdW += thisHR * sizeHolder * pgTextFactor[fontSelect];
      } else if(unitCore[longestLine][n].mode == 2){
        textSize(sizeHolder)
        holdW += textWidth(unitCore[longestLine][n].content + " ");
      } 
    }

    sizeHolder += 2;
  }

  ///////// MAKE SURE THE HEIGHT DOESN'T BRAKE THE HEIGHT
  var heightTest = (height - 30) - inputText.length * leading;
  let holdH = inputText.length * sizeHolder * pgTextFactor[fontSelect];
  while(holdH > heightTest){
    holdH = inputText.length * sizeHolder * pgTextFactor[fontSelect];
    sizeHolder -= 2;
  }

  pgTextSize = constrain(sizeHolder * textScaler, 12, 1000);

  textSize(pgTextSize);

  lineWidths = [];
  for(var m = 0; m < unitCore.length; m++){
    lineWidths[m] = 0;
    for(var n = 0; n < unitCore[m].length; n++){
      if(unitCore[m][n].mode == 0){
        lineWidths[m] += textWidth(unitCore[m][n].content + " ");
      } else if(unitCore[m][n].mode == 1){
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage] ? pgImage[thisImage].width/pgImage[thisImage].height : 1.0;
        lineWidths[m] += thisHR * pgTextSize * pgTextFactor[fontSelect];
      } else if(unitCore[m][n].mode == 2){
        lineWidths[m] += textWidth(unitCore[m][n].content + " ");
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
  textScaler = map(val, 1, 100, 0.01, 1);
  newText();
}

function setFillColor(val){ fillColor = val; }
function setBkgdColor(val){ bkgdColor = val; }

function resetPos(){
  if (dropGroup) dropGroup.resetPos();
}

function adjustGravity(e){
  gravityAng = e.value + PI;
}

function setGravityStrength(val){
  gravityStrength = map(val, 0, 100, 0, 0.0005);
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
  padFactor = map(val, 0, 100, 0, 1);
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
  
    var thisPosition = round(random(positionCount - 1));
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

  debrisData[select].position = round(map(val, 0, 100, 0, positionCount));
  newText();
}

function setDebrisImage(select, path){
  pgImage[select] = loadImage(path);
  newText();
}