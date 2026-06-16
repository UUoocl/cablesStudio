// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "basic": {
        "segmentSpace": 8,
        "segmentCount": 27,
        "typeHeight": 56,
        "tracking": 30,
        "typeStroke": 1.4,
        "speed": 0.32,
        "depth": 30,
        "middleStretch": 0.2,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 2,
        "rotX": -1.87,
        "rotY": -0.56,
        "rotZ": -0.56,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": false,
        "color1": "#ff0000",
        "color2": "#FF9300",
        "color3": "#ffff00",
        "color4": "#00ff00",
        "color5": "#0000ff",
        "bkgdColor": "#ffffff",
        "textColor": "#000000",
        "inpNumber": 5,
        "p.text": " We have been taking into our mouths the bodies of dead birds. We have been taking into our mouths the bodies of dead birds. "
    },
    "river": {
        "segmentSpace": 10,
        "segmentCount": 20,
        "typeHeight": 64,
        "tracking": 30,
        "typeStroke": 1.0,
        "speed": 0.1,
        "depth": 74,
        "middleStretch": 0,
        "count": 7,
        "zSpace": 1.11,
        "xSpace": 0.63,
        "scaler": 1.32,
        "rotX": -1.82,
        "rotY": 0.22,
        "rotZ": -0.43,
        "inp0check": true,
        "gradientCheck": false,
        "bSideCheck": false,
        "altCheck": false,
        "bkgdColor": "#0000ff",
        "textColor": "#ffffff",
        "inpNumber": 0,
        "p.text": " Somewhere something incredible is waiting to be known. Somewhere something incredible is waiting to be known. Somewhere something incredible is waiting to be known. "
    },
    "streamer": {
        "segmentSpace": 23,
        "segmentCount": 22,
        "typeHeight": 25,
        "tracking": 40,
        "typeStroke": 2.0,
        "speed": 0.4,
        "depth": 56,
        "middleStretch": 0,
        "count": 4,
        "zSpace": 1.62,
        "xSpace": 1.3,
        "scaler": 1.04,
        "rotX": -1.91,
        "rotY": 0.56,
        "rotZ": -0.53,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": false,
        "color1": "#FFFC79",
        "color2": "#FF2F92",
        "color3": "#011993",
        "color4": "#0096FF",
        "color5": "#ffffff",
        "bkgdColor": "#212121",
        "textColor": "#ffffff",
        "inpNumber": 4,
        "p.text": " THE SEA IS A DESERT OF WAVES, A WILDERNESS OF WATER. THE SEA IS A DESERT OF WAVES, A WILDERNESS OF WATER. THE SEA IS A DESERT OF WAVES, A WILDERNESS OF WATER. "
    },
    "terrace": {
        "segmentSpace": 14,
        "segmentCount": 17,
        "typeHeight": 30,
        "tracking": 30,
        "typeStroke": 1.0,
        "speed": 0.3,
        "depth": 40,
        "middleStretch": 0.7,
        "count": 8,
        "zSpace": 1.40,
        "xSpace": 0.23,
        "scaler": 2.0,
        "rotX": -1.2,
        "rotY": 0.14,
        "rotZ": -0.95,
        "inp0check": false,
        "gradientCheck": false,
        "bSideCheck": true,
        "altCheck": false,
        "color1": "#ffffff",
        "bkgdColor": "#000000",
        "textColor": "#000000",
        "inpNumber": 1,
        "p.text": " and sailed back over a year and in and out of weeks and through a day and sailed back over a year "
    },
    "link": {
        "segmentSpace": 17,
        "segmentCount": 12,
        "typeHeight": 55,
        "tracking": 30,
        "typeStroke": 1.5,
        "speed": 0.2,
        "depth": 45,
        "middleStretch": 0,
        "count": 8,
        "zSpace": 2.10,
        "xSpace": 0,
        "scaler": 0.96,
        "rotX": -2.18,
        "rotY": -0.09,
        "rotZ": -1.13,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": true,
        "color1": "#0096FF",
        "color2": "#FF0000",
        "color3": "#FFFF00",
        "color4": "#000000",
        "color5": "#ffffff",
        "bkgdColor": "#ffffff",
        "textColor": "#000000",
        "inpNumber": 3,
        "p.text": "       WHICH CAME FIRST - THE OBSERVER OR THE PARTICLE?       "
    },
    "sea": {
        "segmentSpace": 11,
        "segmentCount": 20,
        "typeHeight": 80,
        "tracking": 30,
        "typeStroke": 1.5,
        "speed": 0.4,
        "depth": 60,
        "middleStretch": 0,
        "count": 9,
        "zSpace": 1.95,
        "xSpace": 0,
        "scaler": 1.0,
        "rotX": -1.25,
        "rotY": -0.44,
        "rotZ": -0.58,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": true,
        "color1": "#FFD479",
        "color2": "#73FDFF",
        "color3": "#0096FF",
        "color4": "#FF8AD8",
        "color5": "#ff0000",
        "bkgdColor": "#000000",
        "textColor": "#005493",
        "inpNumber": 5,
        "p.text": " Somewhere something Somewhere something Somewhere something Somewhere something Somewhere something Somewhere something "
    },
    "web_ribbon": {
        "segmentSpace": 10,
        "segmentCount": 25,
        "typeHeight": 30,
        "tracking": 30,
        "typeStroke": 1.0,
        "speed": 0.4,
        "depth": 101,
        "middleStretch": 0.9,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 1.0,
        "rotX": 2.04,
        "rotY": -2.58,
        "rotZ": 0.11,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": false,
        "altCheck": false,
        "color1": "#0000ff",
        "color2": "#ffff00",
        "color3": "#ff0000",
        "color4": "#000000",
        "color5": "#ffffff",
        "bkgdColor": "#929292",
        "textColor": "#ffffff",
        "inpNumber": 5,
        "p.text": "                                                                                                                                                                                                            "
    },
    "primary": {
        "segmentSpace": 10,
        "segmentCount": 20,
        "typeHeight": 0,
        "tracking": 0,
        "typeStroke": 2.0,
        "speed": 0.2,
        "depth": 111,
        "middleStretch": 1.1,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 1.25,
        "rotX": -0.6,
        "rotY": -0.66,
        "rotZ": 0.94,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": false,
        "altCheck": false,
        "color1": "#ffffff",
        "color2": "#0000ff",
        "color3": "#ff0000",
        "color4": "#ffff00",
        "color5": "#ffffff",
        "bkgdColor": "#ffffff",
        "textColor": "#000000",
        "inpNumber": 5,
        "p.text": "======================================================================================================================================================================================================"
    },
    "snake": {
        "segmentSpace": 6,
        "segmentCount": 33,
        "typeHeight": 0,
        "tracking": 0,
        "typeStroke": 1.0,
        "speed": 0.5,
        "depth": 85,
        "middleStretch": 1,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 1.0,
        "rotX": -0.58,
        "rotY": -0.52,
        "rotZ": 0.03,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": false,
        "color1": "#000000",
        "color2": "#ffffff",
        "bkgdColor": "#000000",
        "textColor": "#000000",
        "inpNumber": 2,
        "p.text": "======================================================================================================================================================================================================"
    },
    "hotcold": {
        "segmentSpace": 7,
        "segmentCount": 25,
        "typeHeight": 0,
        "tracking": 0,
        "typeStroke": 0,
        "speed": 0.2,
        "depth": 80,
        "middleStretch": 1.2,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 1.0,
        "rotX": -1.06,
        "rotY": 0.92,
        "rotZ": -0.42,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": false,
        "altCheck": false,
        "color1": "#000000",
        "color2": "#011993",
        "color3": "#EF577A",
        "bkgdColor": "#000000",
        "textColor": "#000000",
        "inpNumber": 3,
        "p.text": "                                                                                                                                                                "
    },
    "track": {
        "segmentSpace": 9,
        "segmentCount": 19,
        "typeHeight": 0,
        "tracking": 100,
        "typeStroke": 2.0,
        "speed": 0.1,
        "depth": 106,
        "middleStretch": 1.2,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 1.03,
        "rotX": 0.93,
        "rotY": 0.24,
        "rotZ": -2.19,
        "inp0check": false,
        "gradientCheck": true,
        "bSideCheck": true,
        "altCheck": false,
        "color1": "#000000",
        "color2": "#DF2519",
        "color3": "#DCB76E",
        "color4": "#094D83",
        "color5": "#000000",
        "bkgdColor": "#000000",
        "textColor": "#000000",
        "inpNumber": 5,
        "p.text": "///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////"
    },
    "track2": {
        "segmentSpace": 13,
        "segmentCount": 19,
        "typeHeight": 0,
        "tracking": 100,
        "typeStroke": 2.0,
        "speed": 0.1,
        "depth": 168,
        "middleStretch": 1.2,
        "count": 1,
        "zSpace": 1,
        "xSpace": 0,
        "scaler": 2.1,
        "rotX": -2.15,
        "rotY": 0.56,
        "rotZ": -2.19,
        "inp0check": false,
        "gradientCheck": false,
        "bSideCheck": false,
        "altCheck": false,
        "color1": "#000000",
        "bkgdColor": "#FF7E79",
        "textColor": "#ffffff",
        "inpNumber": 1,
        "p.text": "///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////"
    }
};


// --- INLINED DEPENDENCY: ../lib/keyboardEngine_190221c.js ---
function keyboardEngine() {
//  if (letter_select >= inpText.length) {
//      letter_space( strecherX,  strecherY, strecherShear);
//  } else {

     c1 = inpText.charAt(letter_select);            

    if (c1 == 'A' || c1 == 'a') {
      letter_A();
    } else if (c1 == 'B' || c1 == 'b') {
      letter_B();
    } else if (c1 == 'C' || c1 == 'c') {
      letter_C();
    } else if (c1 == 'D' || c1 == 'd') {
      letter_D();
    } else if (c1 == 'E' || c1 == 'e') {
      letter_E();
    } else if (c1 == 'F' || c1 == 'f') {
      letter_F();
    } else if (c1 == 'G' || c1 == 'g') {
      letter_G();
    } else if (c1 == 'H' || c1 == 'h') {
      letter_H();
    } else if (c1 == 'I' || c1 == 'i') {
      letter_I();
    } else if (c1 == 'J' || c1 == 'j') {
      letter_J();
    } else if (c1 == 'K' || c1 == 'k') {
      letter_K();
    } else if (c1 == 'L' || c1 == 'l') {
      letter_L();
    } else if (c1 == 'M' || c1 == 'm') {
      letter_M();
    } else if (c1 == 'N' || c1 == 'n') {
      letter_N();
    } else if (c1 == 'O' || c1 == 'o') {
      letter_O();
    } else if (c1 == 'P' || c1 == 'p') {
      letter_P();
    } else if (c1 == 'Q' || c1 == 'q') {
      letter_Q();
    }  else if (c1 == 'R' || c1 == 'r') {
      letter_R();
    } else if (c1 == 'S' || c1 == 's') {
      letter_S();
    } else if (c1 == 'T' || c1 == 't') {
      letter_T();
    } else if (c1 == 'U' || c1 == 'u') {
      letter_U();
    } else if (c1 == 'V' || c1 == 'v') {
      letter_V();
    } else if (c1 == 'W' || c1 == 'w') {
      letter_W();
    } else if (c1 == 'X' || c1 == 'x') {
      letter_X();
    } else if (c1 == 'Y' || c1 == 'y') {
      letter_Y();
    } else if (c1 == 'Z' || c1 == 'z') {
      letter_Z();
    } else if (c1 == '_') {
      letter_underscore();
    } else if (c1 == '-') {
      letter_dash();
    } else if (c1 == '?') {
      letter_question();
    } else if (c1 == '.') {
      letter_period();
    } else if (c1 == '!') {
      letter_exclaim();
    } else if (c1 == ' ') {
      letter_space( );
    } else if (c1 == ':') {
      letter_colon( );
    } else if (c1 == ';') {
      letter_semicolon();
    } else if (c1 == ',') {
      letter_comma();
    } else if (c1 == '/') {
      letter_slash();
    } else if (c1 == '&') {
      letter_amp();
    } else if (c1 == '1') {
      one();
    } else if (c1 == '2') {
      two();
    } else if (c1 == '3') {
      three();
    } else if (c1 == '4') {
      four();
    } else if (c1 == '5') {
      five();
    } else if (c1 == '6') {
      six();
    } else if (c1 == '7') {
      seven();
    } else if (c1 == '8') {
      eight();
    } else if (c1 == '9') {
      nine();
    } else if (c1 == '0') {
      zero();
    } else if (c1 == '\"') {
      double_quote();
    } else if (c1 == '\'') {
      single_quote();
    } else if (c1 == '#') {
      hash();
    } else if (c1 == '$') {
      cash();
    } else if (c1 == '%') {
      percentage();
    } else if (c1 == '=') {
      equal();
    } else if (c1 == '+') {
      plus();
    } else if (c1 == '*') {
      asterisk();
    } else if (c1 == '@') {
      at();
    } 
//  }
}
/////////////////////////////////////////////////// LETTERS

function letter_A () {
  p.push();
   
  p.beginShape();
		p.vertex(0,typeY);
  	p.vertex(0,typeY-SA);
  
  	p.vertex(typeX/2-typeStroke/4,0);
  	p.vertex(typeX/2+typeStroke/4,0);

    p.vertex(typeX,typeY-SA);
    p.vertex(typeX,typeY);
  p.endShape();

   ang = atan((typeX/2)/(typeY));
   angX = tan(ang)*(typeY/3);

  p.line(angX-SA/2, 21*typeY/28, typeX-angX+SA/2, 21*typeY/28);
  p.pop();
}

function letter_B () {
	p.beginShape();
  	p.vertex(0,0);
  	p.vertex(typeX/2,0);
  	p.bezierVertex(3*typeX/4,0,	26*typeX/28,2*typeY/28,  26*typeX/28,6*typeY/28);
  	p.vertex(26*typeX/28,7*typeY/28);
  	p.bezierVertex(26*typeX/28,11*typeY/28,  22*typeX/28,13*typeY/28,	 typeX/2,13*typeY/28);
    p.vertex(0,13*typeY/28);
  p.endShape();
  p.beginShape();
  	p.vertex(0,13*typeY/28);
    p.vertex(typeX/2,13*typeY/28);
    p.bezierVertex(3*typeX/4,13*typeY/28,  typeX,15*typeY/28,	typeX,20*typeY/28);
  	p.vertex(typeX,3*typeY/4);
  	p.bezierVertex(typeX,7*typeY/8,	5*typeX/6,typeY,  typeX/2, typeY);
    p.vertex(0,typeY);
  	p.vertex(0,0);
  p.endShape();
}

function letter_C () {
  p.beginShape();
    p.vertex(typeX,3*typeY/4);
		p.bezierVertex(typeX,7*typeY/8,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,typeY/3);
  	p.bezierVertex(0,typeY/6,  typeX/6,0,  typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/8,  typeX,typeY/4);
  p.endShape();
}

function letter_D () {
  p.beginShape();
    p.vertex(0,0);
    p.vertex(typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/6,  typeX,typeY/3);
    p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
    p.vertex(0,typeY);
  	p.vertex(0,0);
  p.endShape();
}

function letter_E () {
	p.line(0,0,	typeX,0);
  p.line(0,0,	0,typeY);
  p.line(0,typeY,	typeX,typeY);
  p.line(0,15*typeY/28,	7*typeX/8,15*typeY/28);
}

function letter_F () {
	p.line(0,0,	typeX,0);
  p.line(0,0,	0,typeY);
  p.line(0,15*typeY/28,	7*typeX/8,15*typeY/28);
}

function letter_G () {
  p.beginShape();
    p.vertex(typeX,3*typeY/4);
		p.bezierVertex(typeX,7*typeY/8,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,typeY/3);
  	p.bezierVertex(0,typeY/6,  typeX/6,0,  typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/8,  typeX,typeY/4);
  p.endShape();
  
  p.line(typeX,typeY,  typeX,15*typeY/28);
  p.line(5*typeX/8,15*typeY/28,  typeX,15*typeY/28);
}

function letter_H () {
	p.line(0,0,	0,typeY);
  p.line(typeX,0,  typeX,typeY);
  p.line(0,typeY/2,  typeX,typeY/2);
}

function letter_I () {
	p.line(0,0,	typeX,0);
  p.line(0,typeY,	typeX,typeY);
  p.line(typeX/2,0,	typeX/2,typeY);
}

function letter_J () {
  p.beginShape();
  	p.vertex(typeX/2,0);
  	p.vertex(typeX,0);
    p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
  p.endShape();
}

function letter_K () {  
  p.line(0, 0, 0, typeY);
  p.beginShape();
    p.vertex(0, 2*typeY/3);
    p.vertex(27*typeX/28, SA);
    p.vertex(27*typeX/28, 0);
  p.endShape();
  
   ang = atan((2*typeY/3)/(typeX));
   angX = (13/28*typeY)/tan(ang);

  p.beginShape();
	  p.vertex(typeX-angX, 13/28*typeY);
    p.vertex(typeX, typeY-SA);
    p.vertex(typeX, typeY);
  p.endShape();
}

function letter_L () {
	p.line(0,0,  0,typeY);
  p.line(0,typeY,  typeX,typeY);
}

function letter_M () {
  p.beginShape();
  	p.vertex(0,typeY);
    p.vertex(0,0);
  
  	p.vertex(typeX/2,22*typeY/28-SA);
    
  	p.vertex(typeX,0);
  	p.vertex(typeX,typeY);
  p.endShape();
}

function letter_N () {
  p.beginShape();
  	p.vertex(0,typeY);
		p.vertex(0,0);
  	p.vertex(typeX,typeY);
  	p.vertex(typeX,0);
  p.endShape();
}

function letter_O () {
  p.beginShape();
    p.vertex(typeX, typeY/3);
    p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,typeY/3);
  	p.bezierVertex(0,typeY/6,  typeX/6,0,  typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/6,  typeX,typeY/3);
  p.endShape();
}

function letter_P () {
	p.beginShape();
  	p.vertex(0,typeY);
  	p.vertex(0,0);
    p.vertex(typeX/2,0);
  	p.bezierVertex(5*typeX/6,0,	typeX,typeY/8,	 typeX,typeY/4);
    p.vertex(typeX,8*typeY/28);
    p.bezierVertex(typeX,8*typeY/28 + typeY/8,  5*typeX/6,15*typeY/28,  typeX/2,15*typeY/28);
  	p.vertex(0,15*typeY/28);
  p.endShape();
  
}

function letter_Q () {
  p.beginShape();
    p.vertex(typeX, typeY/3);
    p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,typeY/3);
  	p.bezierVertex(0,typeY/6,  typeX/6,0,  typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/6,  typeX,typeY/3);
  p.endShape();

  p.beginShape();
  	p.vertex(typeX/2,15*typeY/28);
	  p.vertex(typeX,typeY-SA);
  	p.vertex(typeX,typeY);
  p.endShape();
}

function letter_R () {
	p.beginShape();
  	p.vertex(0,typeY);
  	p.vertex(0,0);
    p.vertex(typeX/2,0);
  	p.bezierVertex(5*typeX/6,0,	typeX,typeY/8,	 typeX,typeY/4);
    p.vertex(typeX,8*typeY/28);
    p.bezierVertex(typeX,8*typeY/28 + typeY/8,  5*typeX/6,15*typeY/28,  typeX/2,15*typeY/28);
  	p.vertex(0,15*typeY/28);
  p.endShape();
    
  p.beginShape();
  	p.vertex(typeX/2,15*typeY/28);

	  p.vertex(typeX-SA,typeY-SA);
  	p.vertex(typeX-SA,typeY);
  p.endShape();
}

function letter_S () {
	p.beginShape();
    p.vertex(27*typeX/28,typeY/4);
  	p.vertex(27*typeX/28,13*typeY/56);
  	p.bezierVertex(27*typeX/28,4*typeY/28,  7*typeX/8,0,  typeX/2,0);
    p.bezierVertex(typeX/4,0,  typeX/28,2*typeY/28,  typeX/28,11*typeY/56);
    p.vertex(typeX/28,6*typeY/28);
  	p.bezierVertex(typeX/28,17*typeY/56,  typeX/8,21*typeY/56,  typeX/3,12*typeY/28);
  	p.vertex(20*typeX/28,29*typeY/56);
  	p.bezierVertex(26*typeX/28,16*typeY/28,  typeX,18*typeY/28,	typeX,41*typeY/56);
    p.vertex(typeX,3*typeY/4);
  	p.bezierVertex(typeX,26*typeY/28,  22*typeX/28,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/4,typeY,  0,53*typeY/56,  0,3*typeY/4);
  	p.vertex(0,41*typeY/56);
  p.endShape();
}

function letter_T () {
	p.line(0,0,	typeX,0);
  p.line(typeX/2,0,	typeX/2,typeY);
}

function letter_U () {
  p.beginShape();
		p.vertex(typeX,0);
  	p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,0);
  p.endShape();
}

function letter_V () {
	p.beginShape();
    p.vertex(0,0);
    p.vertex(0,SA);
  
  	p.vertex(typeX/2-SA/2,typeY);
  	p.vertex(typeX/2+SA/2,typeY);
  
  	p.vertex(typeX,SA);
    p.vertex(typeX,0);
  p.endShape();
}

function letter_W () {
	p.beginShape();
    p.vertex(0,0);
    p.vertex(0,SA);

    p.vertex(typeX/4-SA/2,typeY);  
    p.vertex(typeX/4+SA/2,typeY);  
  
  	p.vertex(typeX/2-SA/2,8*typeY/28);
  	p.vertex(typeX/2+SA/2,8*typeY/28);
  
  	p.vertex(3*typeX/4-SA/2,typeY);
  	p.vertex(3*typeX/4+SA/2,typeY);
    
  	p.vertex(typeX,SA);
  	p.vertex(typeX,0);
  p.endShape();
}

function letter_X () {
	p.beginShape();
  	p.vertex(0,0);
    p.vertex(0,SA);
    p.vertex(typeX,typeY-SA);
    p.vertex(typeX,typeY);
  p.endShape();
  p.beginShape();
    p.vertex(typeX,0);
    p.vertex(typeX,SA);
    p.vertex(0,typeY-SA);
    p.vertex(0,typeY);
  p.endShape();
}

function letter_Y () {
	p.beginShape();
  	p.vertex(0,0);
  	p.vertex(0,SA);
    p.vertex(typeX/2,2*typeY/3);
    p.vertex(typeX,SA);
    p.vertex(typeX,0);
  p.endShape();
  
  p.line(typeX/2,2*typeY/3,  typeX/2,typeY);
}

function letter_Z () {
	p.line(0,0,	typeX,0);
  p.line(0,typeY,  typeX,typeY);
  
  p.beginShape();
  	p.vertex(typeX,0);
    p.vertex(typeX,SA);
    p.vertex(0,typeY-SA);
    p.vertex(0,typeY);
  p.endShape();
}

function one () {
	p.beginShape();
  	p.vertex(typeX/8,6/28*typeY);
  	p.vertex(typeX/2,0);
  	p.vertex(typeX/2,typeY);
  p.endShape();
  
  p.line(0,typeY,typeX,typeY);
}

function two () {
  p.beginShape();
    p.vertex(0,typeY/4);
		p.bezierVertex(0,typeY/8,	typeX/6,0,  typeX/2,0);
  	p.bezierVertex(5*typeX/6,SA,  typeX,typeY/8,  typeX,typeY/4);
    p.bezierVertex(typeX,5*typeY/8,  0,2*typeY/3,  0,typeY);
  	p.vertex(typeX,typeY);
  p.endShape();

}

function three () {
  p.beginShape();
  	p.vertex(0,0);
		p.vertex(typeX,0);
    p.vertex(typeX*12/28,typeY*10/28);
    p.vertex(typeX*12/28,typeY*10/28);
    p.bezierVertex(24/28*typeX,typeY*10/28,  typeX,15/28*typeY,  typeX,19/28*typeY);
  	p.vertex(typeX,3/4*typeY);
    p.bezierVertex(typeX,24/28*typeY,  24/28*typeX,typeY,  typeX/2,typeY);
    p.bezierVertex(4/28*typeX,typeY,  0,24/28*typeY,	0,3/4*typeY);
  p.endShape();
}

function four () {
  p.beginShape();
    p.vertex(typeX/3,0);
    p.vertex(typeX/3,SA);
  	p.vertex(0,2*typeY/3);
    p.vertex(typeX,2*typeY/3);
  p.endShape();
    p.line(21/28*typeX,0,  21/28*typeX,typeY);
}

function five () {
	p.beginShape();
  	p.vertex(typeX*7/8,0);
  	p.vertex(typeX*2/28,0);
  	p.vertex(typeX*2/28,11/28*typeY);
    p.vertex(typeX/2,11/28*typeY);
    p.bezierVertex(24/28*typeX,11/28*typeY,  typeX,15/28*typeY,  typeX,19/28*typeY);
  	p.vertex(typeX,3/4*typeY);
    p.bezierVertex(typeX,24/28*typeY,  24/28*typeX,typeY,  typeX/2,typeY);
    p.bezierVertex(4/28*typeX,typeY,  0,24/28*typeY,	0,3/4*typeY);
  p.endShape();
}

function six () {
  p.beginShape();
    p.vertex(1/2*typeX,0);
    quadraticVertex(0,1/4*typeY,  0,3/4*typeY);
  p.endShape();
	p.beginShape();
    p.vertex(typeX/2,12/28*typeY);
    p.bezierVertex(24/28*typeX,12/28*typeY,  typeX,16/28*typeY,  typeX,20/28*typeY);
  	p.vertex(typeX,3/4*typeY);
    p.bezierVertex(typeX,24/28*typeY,  24/28*typeX,typeY,  typeX/2,typeY);
    p.bezierVertex(4/28*typeX,typeY,  0,24/28*typeY,	0,3/4*typeY);
    p.vertex(0,20/28*typeY);
    p.bezierVertex(0,16/28*typeY,  4/28*typeX,12/28*typeY,  typeX/2,12/28*typeY);
  p.endShape();
}

function seven () {
  p.beginShape();
  	p.vertex(0,0);
    p.vertex(typeX,0);
    p.vertex(typeX/2,typeY-SA);
  	p.vertex(typeX/2,typeY);
  p.endShape();
}

function eight () {
  p.beginShape();
    p.vertex(typeX/2,0);
  	p.bezierVertex(23*typeX/28,0,  27*typeX/28,3*typeY/28, 27*typeX/28,6*typeY/28);
  	p.vertex(27*typeX/28,typeY/4);
  	p.bezierVertex(27*typeX/28,10*typeY/28,  23*typeX/28,13*typeY/28,  typeX/2,13*typeY/28);
  	p.bezierVertex(5*typeX/28,13*typeY/28,  typeX/28,10*typeY/28,  typeX/28,typeY/4);
  	p.vertex(typeX/28,6*typeY/28);
  	p.bezierVertex(typeX/28,3*typeY/28,  5*typeX/28,0,  typeX/2,0);
  p.endShape();
	p.beginShape();
    p.vertex(typeX/2,13/28*typeY);
    p.bezierVertex(24/28*typeX,13/28*typeY,  typeX,16/28*typeY,  typeX,20/28*typeY);
  	p.vertex(typeX,3/4*typeY);
    p.bezierVertex(typeX,24/28*typeY,  24/28*typeX,typeY,  typeX/2,typeY);
    p.bezierVertex(4/28*typeX,typeY,  0,24/28*typeY,	0,3/4*typeY);
    p.vertex(0,20/28*typeY);
    p.bezierVertex(0,16/28*typeY,  4/28*typeX,13/28*typeY,  typeX/2,13/28*typeY);
  p.endShape();
    
}

function nine () {
  p.push();
  p.translate(typeX,typeY);
  p.rotate(p.PI);
  
  p.beginShape();
    p.vertex(1/2*typeX,0);
    quadraticVertex(0,1/4*typeY,  0,3/4*typeY);
  p.endShape();
	p.beginShape();
    p.vertex(typeX/2,12/28*typeY);
    p.bezierVertex(24/28*typeX,12/28*typeY,  typeX,16/28*typeY,  typeX,20/28*typeY);
  	p.vertex(typeX,3/4*typeY);
    p.bezierVertex(typeX,24/28*typeY,  24/28*typeX,typeY,  typeX/2,typeY);
    p.bezierVertex(4/28*typeX,typeY,  0,24/28*typeY,	0,3/4*typeY);
    p.vertex(0,20/28*typeY);
    p.bezierVertex(0,16/28*typeY,  4/28*typeX,12/28*typeY,  typeX/2,12/28*typeY);
  p.endShape();
  
  p.pop();
}

function zero () {
  p.beginShape();
    p.vertex(typeX, typeY/3);
    p.vertex(typeX,2*typeY/3);
		p.bezierVertex(typeX,5*typeY/6,  5*typeX/6,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,typeY/3);
  	p.bezierVertex(0,typeY/6,  typeX/6,0,  typeX/2,0);
    p.bezierVertex(5*typeX/6,0,  typeX,typeY/6,  typeX,typeY/3);
  p.endShape();

  p.line(2*typeX/3,typeY/3,typeX/3,2*typeY/3);
}

function letter_underscore () {
  p.line(0, typeY, typeX, typeY);
}

function letter_dash () {
  p.line(0, typeY/2, typeX, typeY/2);
}

function letter_question () {
  p.beginShape();
    p.vertex(0,typeY/4);
		p.bezierVertex(0,typeY/8,	typeX/6,0,  typeX/2,0);
  	p.bezierVertex(5*typeX/6,0,  typeX,typeY/8,  typeX,typeY/4);
		p.bezierVertex(typeX,typeY/2,	typeX/2, 12/28*typeY,	typeX/2,3/4*typeY);
  p.endShape();

  p.line(typeX/2, 7*typeY/8, typeX/2, typeY);
}

function letter_period () {
  p.line(typeX/2, 7*typeY/8, typeX/2, typeY);
}

function letter_colon () {
  p.line(typeX/2, typeY/2-typeY/8, typeX/2, typeY/2);
  p.line(typeX/2, 7*typeY/8, typeX/2, typeY);
}

function letter_semicolon () {
  p.line(typeX/2, typeY/2-typeY/8, typeX/2, typeY/2);
  p.line(typeX/2, 7*typeY/8, typeX/2 - typeX/4, typeY);
}

function letter_comma () {
  p.line(typeX/2, 7*typeY/8, typeX/2 - typeX/4, typeY);
}

function letter_exclaim () {
  p.line(typeX/2, 0, typeX/2, 3*typeY/4);

  p.line(typeX/2, 7*typeY/8, typeX/2, typeY);
}

function letter_slash () {
  p.line(0, typeY, typeX, 0);
}

function double_quote () {
  if(doubleQuoteSwitch == 1){
  	p.beginShape();
      p.vertex(typeX/3-SA/2,typeY/4);
      p.vertex(typeX/3-SA/2,5*typeY/28);
      p.vertex(typeX/3-SA/2,5*typeY/28+SA/2);
      p.vertex(typeX/2-SA/2,SA);
    p.endShape();
    p.beginShape();
      p.vertex(typeX/2+SA/2,typeY/4);
      p.vertex(typeX/2+SA/2,5*typeY/28);
      p.vertex(typeX/2+SA/2,5*typeY/28+SA/2);
      p.vertex(typeX*2/3+SA/2,SA);
    p.endShape();
  } else if(doubleQuoteSwitch == -1){
    p.beginShape();
      p.vertex(typeX/3-SA/2,typeY/4);
  	  p.vertex(typeX/2-SA/2,typeY*2/28-SA/2);
      p.vertex(typeX/2-SA/2,typeY*2/28);
    	p.vertex(typeX/2-SA/2,0);
    p.endShape();
    p.beginShape();
      p.vertex(typeX/2+SA/2,typeY/4);
  	  p.vertex(typeX*2/3+SA/2,typeY*2/28-SA/2);
      p.vertex(typeX*2/3+SA/2,typeY*2/28);
    	p.vertex(typeX*2/3+SA/2,0);
    p.endShape();
  }
  doubleQuoteSwitch *= -1;
}

function single_quote () {
  if(singleQuoteSwitch == 1){
  	p.beginShape();
      p.vertex(typeX*3/8-SA/2,typeY/4);
      p.vertex(typeX*3/8-SA/2,5*typeY/28);
      p.vertex(typeX*3/8-SA/2,5*typeY/28+SA/2);
      p.vertex(typeX*5/8-SA/2,SA);
    p.endShape();
  } else if(singleQuoteSwitch == -1){
    p.beginShape();
      p.vertex(typeX*3/8-SA/2,typeY/4);
  	  p.vertex(typeX*5/8-SA/2,typeY*2/28-SA/2);
      p.vertex(typeX*5/8-SA/2,typeY*2/28);
    	p.vertex(typeX*5/8-SA/2,0);
    p.endShape();
  }
  singleQuoteSwitch *= -1;
}

function hash () {
	p.beginShape();
  	p.vertex(typeX/8,typeY);
  	p.vertex(typeX/8,typeY-SA);
  	p.vertex(typeX/2,SA);
  	p.vertex(typeX/2,0);
  p.endShape();
  p.beginShape();
  	p.vertex(typeX/2,typeY);
  	p.vertex(typeX/2,typeY-SA);
  	p.vertex(typeX*7/8,SA);
  	p.vertex(typeX*7/8,0);
  p.endShape();
  
  p.line(typeX*2/28,typeY/3,	typeX,typeY/3);
  p.line(0,typeY*2/3,	26/28*typeX,typeY*2/3);
}

function cash() {
	p.beginShape();
    p.vertex(27*typeX/28,typeY/4);
  	p.vertex(27*typeX/28,13*typeY/56);
  	p.bezierVertex(27*typeX/28,4*typeY/28,  7*typeX/8,0,  typeX/2,0);
    p.bezierVertex(typeX/4,0,  typeX/28,2*typeY/28,  typeX/28,11*typeY/56);
    p.vertex(typeX/28,6*typeY/28);
  	p.bezierVertex(typeX/28,17*typeY/56,  typeX/8,21*typeY/56,  typeX/3,12*typeY/28);
  	p.vertex(20*typeX/28,29*typeY/56);
  	p.bezierVertex(26*typeX/28,16*typeY/28,  typeX,18*typeY/28,	typeX,41*typeY/56);
    p.vertex(typeX,3*typeY/4);
  	p.bezierVertex(typeX,26*typeY/28,  22*typeX/28,typeY,  typeX/2,typeY);
  	p.bezierVertex(typeX/4,typeY,  0,53*typeY/56,  0,3*typeY/4);
  	p.vertex(0,41*typeY/56);
  p.endShape();
  
  p.line(typeX/2,-typeY/16,typeX/2,typeY*17/16);
}


function letter_amp () {
    p.beginShape();
      p.vertex(typeX,typeY);
  	  p.vertex(typeX,typeY-SA);
      quadraticVertex(typeX/8,typeY*11/28,  typeX/8,3*typeY/8);
      p.bezierVertex(typeX/8,3*typeY/8,  typeX/4,0,  12/28*typeX,0);
      p.bezierVertex(5*typeX/8,0,  typeX*2/3,typeY/8,  typeX*2/3,typeY*4/28);
      p.bezierVertex(typeX*2/3,typeY*11/28,	 0,typeY/2,		0,3*typeY/4);
      p.bezierVertex(0,typeY,	typeX/4,typeY,  typeX*3/8,typeY);
      p.bezierVertex(typeX*5/8,typeY,  typeX,typeY,	typeX,typeY/2);
  		p.vertex(typeX,typeY/2);
  		p.vertex(typeX*3/4,typeY/2);
    p.endShape();
}


function percentage() {
  p.beginShape();
  	p.vertex(0,typeY);
  	p.vertex(0,typeY-SA);
  	p.vertex(typeX,SA);
  	p.vertex(typeX,0);
  p.endShape();
  
  p.beginShape();
		p.vertex(typeX/4,0);
  	p.bezierVertex(typeX*3/8,0,	typeX/2,typeY/12, 	typeX/2,typeY/6);
  	p.bezierVertex(typeX/2,3/12*typeY,	typeX*3/8,typeY/3,  typeX/4,typeY/3);
  	p.bezierVertex(typeX/8,typeY/3,  0,3/12*typeY,	0,typeY/6);
  	p.bezierVertex(0,typeY/12,  typeX/8,0,	typeX/4,0);
  p.endShape();
  
  p.push();
	p.translate(typeX,typeY);
	p.rotate(p.PI);
    p.beginShape();
      p.vertex(typeX/4,0);
      p.bezierVertex(typeX*3/8,0,	typeX/2,typeY/12, 	typeX/2,typeY/6);
      p.bezierVertex(typeX/2,3/12*typeY,	typeX*3/8,typeY/3,  typeX/4,typeY/3);
      p.bezierVertex(typeX/8,typeY/3,  0,3/12*typeY,	0,typeY/6);
      p.bezierVertex(0,typeY/12,  typeX/8,0,	typeX/4,0);
    p.endShape();
	p.pop();
}

function equal() {
	p.line(0,typeY*3/8,	typeX,typeY*3/8);
  p.line(0,typeY*5/8,	typeX,typeY*5/8);
}

function plus() {
	p.line(0,typeY/2,	typeX,typeY/2);
  p.line(typeX/2,typeY/4,	typeX/2,typeY*3/4);
}

function asterisk() {
	p.push();
  p.translate(typeX/2,typeY/2);
  p.rotate(float(p.frameCount)*0.05);
  for(var i=0; i<5; i++){
  	p.rotate(2*p.PI/5);
    p.line(0,0,0,typeY/6);
  }
  p.pop();
}

function at() {
  p.beginShape();
		p.vertex(17/28*typeX,typeY);
  	p.vertex(typeX/2,typeY);
  	p.bezierVertex(typeX/6,typeY,  0,5*typeY/6,  0,2*typeY/3);
    p.vertex(0,12/28*typeY);
  	p.bezierVertex(0,typeY/4,  typeX/6,2/28*typeY,  typeX/2,2/28*typeY);
    p.bezierVertex(5*typeX/6,2/28*typeY,  typeX,typeY/4,  typeX,12/28*typeY);
    p.vertex(typeX,23/28*typeY);
  p.endShape();
  p.beginShape();
		p.vertex(typeX,17/28*typeY);
  	p.bezierVertex(typeX,21/28*typeY,  3/4*typeX,24/28*typeY,	16/28*typeX,24/28*typeY);
  	p.bezierVertex(11/28*typeX,24/28*typeY,  8/28*typeX,3/4*typeY,  8/28*typeX,17/28*typeY);
  	p.bezierVertex(8/28*typeX,13/28*typeY,  11/28*typeX,10/28*typeY,  16/28*typeX,10/28*typeY);
  	p.bezierVertex(3/4*typeX,10/28*typeY,  typeX,13/28*typeY,  typeX,17/28*typeY);
  p.endShape();
}
/*
function at() {
  p.beginShape();
		p.vertex(typeX/2,typeY-SA);
  	p.bezierVertex(typeX/6,typeY-SA,  SA,5*typeY/6,  SA,2*typeY/3);
    p.vertex(SA,typeY/3);
  	p.bezierVertex(SA,typeY/6,  typeX/6,SA,  typeX/2,SA);
    p.bezierVertex(5*typeX/6,SA,  typeX-SA,typeY/6,  typeX-SA,typeY/3);
 	  p.vertex(typeX-SA, typeY/3);
    p.vertex(typeX-SA,3/4*typeY);
  	p.bezierVertex(typeX-SA,24/28*typeY,	3/4*typeX, 24/28*typeY,  3/4*typeX,3/4*typeY);
    p.vertex(3/4*typeX,11/28*typeY);
  	p.bezierVertex(3/4*typeX,8/28*typeY,	20/28*typeX,6/28*typeY,  typeX/2,6/28*typeY);
  	p.bezierVertex(12/28*typeX,6/28*typeY,  11/28*typeX,6/28*typeY,  1/3*typeX,1/4*typeY);
  p.endShape();
  p.beginShape();
	  p.vertex(typeX/2,11/28*typeY);
    p.bezierVertex(18/28*typeX, 11/28*typeY,  3/4*typeX,13/28*typeY,  3/4*typeX,16/28*typeY);
    p.bezierVertex(3/4*typeX,19/28*typeY,  18/28*typeX,21/28*typeY,  typeX/2,21/28*typeY);
    p.bezierVertex(10/28*typeX,21/28*typeY,  typeX/4,19/28*typeY,  typeX/4,16/28*typeY);
  	p.bezierVertex(typeX/4,13/28*typeY,  10/28*typeX,11/28*typeY,  typeX/2,11/28*typeY);
  p.endShape();
}
*/
function letter_space () {
}




    // --- ORIGINAL SKETCH.JS CODE ---
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
  font = p.loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h, p.WEBGL);
  p.textFont(font);
  p.frameRate(30);

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
    
    bkgdColor = p.color(255);
    textColor = p.color(0);
    textColorAdjust = p.lerpColor(bkgdColor, textColor, 0.01);
    
    inpText = " Somewhere something incredible is waiting to be known. Somewhere something incredible is waiting to be known. ";

    clearTextDelay = 0;
    clearMethod = "all at once";
    seqInterval = 100;
    hideNoText = false;
    lastTextTime = p.millis();
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
    
    if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
    if (settings.textColor !== undefined) textColor = p.color(settings.textColor);
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
        lastTextTime = p.millis();
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
    
    if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);
    if (data.textColor !== undefined) textColor = p.color(data.textColor);

    // Handle p.save request
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
    if (p.millis() - lastTextTime >= clearTextDelay) {
      isClearing = true;
      lastRemoveTime = p.millis();
    }
  }

  if (isClearing && inpText !== "") {
    if (clearMethod === "all at once") {
      inpText = "";
      isClearing = false;
    } else if (clearMethod === "sequential") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(1);
        lastRemoveTime = p.millis();
        if (inpText === "") {
          isClearing = false;
        }
      }
    } else if (clearMethod === "reverseSeq") {
      if (p.millis() - lastRemoveTime >= seqInterval) {
        inpText = inpText.substring(0, inpText.length - 1);
        lastRemoveTime = p.millis();
        if (inpText === "") {
          isClearing = false;
        }
      }
    }
  }

  // --- CANVASES HIDING / EMPTY LOGIC ---
  if ((hideNoText && (!inpText || inpText.trim() === "")) || !inpText || inpText === "") {
    p.clear();
    if (typeof captureFrame === 'function') captureFrame();
    return;
  }

  p.background(bkgdColor);
  runLength = inpText.length;
  sinStep = p.PI / segmentCount;  
  
  segmentLength = segmentCount * segmentSpace;
  radius = (segmentLength) / p.PI;
  
  textColorAdjust = p.lerpColor(bkgdColor, textColor, 0.01);

  p.push();  
  p.scale(scaler);
  p.rotateX(rotX);
  p.rotateY(rotY);
  p.rotateZ(rotZ + p.PI);

  let yCrawl = (runLength + p.frameCount * speed) / (segmentCount + segmentCount * middleStretch) * radius * 2;
  let ribbonHeight = runLength / (segmentCount + segmentCount * middleStretch) * radius * 2.25;
  let ribbonHeight2 = (count - 1) * xSpace * radius * 2;

  let ribbonWidth = segmentLength * middleStretch;
  
  if (altCheckVal === true) {
    p.translate(-ribbonWidth / 2, -yCrawl + ribbonHeight / 2 - radius, -depth * (count - 1) / 2 - (count - 1) * (zSpace - 1) * depth / 2);
  } else {
    p.translate(-ribbonWidth / 2, -yCrawl + ribbonHeight / 2 - (ribbonHeight2) / 2, -depth * (count - 1) / 2 - (count - 1) * (zSpace - 1) * depth / 2);
  }
  
  rectMode(p.CENTER);
  
  for (var j = 0; j < count; j++) {
    for (var i = p.frameCount * speed; i < runLength + p.frameCount * speed; i++) {
      step = i % (2 * segmentCount + 2 * segmentCount * middleStretch);
      
      if (gradientCheckVal === true) {
        setGradient(i - p.frameCount * speed);
      } else {
        ribbonColor = p.color(inp1Val);
      }
      
      letter_select = runLength - p.round(i + 1 - p.frameCount * speed);
      jumper = p.floor(i / (segmentCount * 2 + 2 * segmentCount * middleStretch));
    
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
        rot = -step * sinStep + p.PI * middleStretch;
        side = -1; textDirect = 1;
      }
    
      typeX = (segmentSpace - (tracking / 100) * segmentSpace) * textDirect;
      typeY = depth - (typeHeight / 100) * depth;
    
      let trackingAdjust = (tracking / 100) * segmentSpace * -textDirect;
      let typeHeightAdjust = (typeHeight / 100) * depth;
      
      p.push();
        if (altCheckVal === true) {
          p.translate(xCenter, yCenter + (j % 2) * radius * 2, j * depth * zSpace);
        } else {
          p.translate(xCenter, yCenter + j * xSpace * radius * 2, j * depth * zSpace);
        }
  
      p.rotateZ(rot);
        p.translate(0, -radius);
        p.rotateX(p.PI / 2);
      
        if (inp0checkVal === false) {
          p.stroke(ribbonColor); p.fill(ribbonColor);
          p.strokeWeight(2);
          p.rect(0, 0, segmentSpace, depth);
          if (bSideCheckVal === true) {
            p.translate(0, 0, side);
            p.fill(textColor); p.stroke(textColor);
            p.rect(0, 0, segmentSpace, depth);
          }
        }
        if (bSideCheckVal === true) {
          p.translate(-typeX / 2, -depth / 2 + typeHeightAdjust / 2, -3 * side / 2);
        } else {
          p.translate(-typeX / 2, -depth / 2 + typeHeightAdjust / 2, 0);        
        }
        p.noFill(); p.stroke(textColor); p.strokeWeight(typeStroke);
        keyboardEngine();
      
        if (inp0checkVal === true) {
          p.translate(0, 0, side / 2);
          p.noFill(); p.stroke(textColorAdjust); p.strokeWeight(typeStroke);
          keyboardEngine();
        }
      p.pop();
    }
  }
  p.pop();


  
  if (typeof captureFrame === 'function') captureFrame();
}

function setGradient(switcher) {
  if (inpNumber == 5 || inpNumber == 6) {
    let from = p.color(inp1Val);
    let mid = p.color(inp2Val);
    let mid2 = p.color(inp3Val);
    let mid3 = p.color(inp4Val);
    let to = p.color(inp5Val);    
    if (switcher <= (runLength / 4)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (runLength / 4));
      strkColor = from;
    } else if (switcher > (runLength / 4) && switcher <= (runLength / 2)) {
      ribbonColor = p.lerpColor(mid, mid2, (switcher - runLength / 4) / (runLength / 4));
      strkColor = mid;
    } else if (switcher > (runLength / 2) && switcher <= (3 * runLength / 4)) {
      ribbonColor = p.lerpColor(mid2, mid3, (switcher - runLength / 2) / (runLength / 4));
      strkColor = mid2;
    } else {
      ribbonColor = p.lerpColor(mid3, to, (switcher - 3 * runLength / 4) / (runLength / 4));
      strkColor = mid3;
    }
  } else if (inpNumber == 4) {
    let from = p.color(inp1Val);
    let mid = p.color(inp2Val);
    let mid2 = p.color(inp3Val);
    let to = p.color(inp4Val);
    if (switcher <= (runLength / 3)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (runLength / 3));
      strkColor = from;
    } else if (switcher > (runLength / 3) && switcher <= (2 * runLength / 3)) {
      ribbonColor = p.lerpColor(mid, mid2, (switcher - runLength / 3) / (runLength / 3));
      strkColor = mid;
    } else {
      ribbonColor = p.lerpColor(mid2, to, (switcher - 2 * runLength / 3) / (runLength / 3));
      strkColor = mid2;
    }
  } else if (inpNumber == 3) {
    let from = p.color(inp1Val);
    let mid = p.color(inp2Val);
    let to = p.color(inp3Val);
    if (switcher <= (runLength / 2)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (runLength / 2));
      strkColor = from;
    } else {
      ribbonColor = p.lerpColor(mid, to, (switcher - runLength / 2) / (runLength / 2));
      strkColor = mid;
    }
  } else if (inpNumber == 2) {
    let from = p.color(inp1Val);
    let to = p.color(inp2Val);
    ribbonColor = p.lerpColor(from, to, switcher / runLength);
    strkColor = from;
  } else if (inpNumber == 1) {
    let from = p.color(inp1Val);
    let to = bkgdColor;
    ribbonColor = p.lerpColor(from, to, switcher / runLength);
    strkColor = to;
  }
}

function windowResized() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
}


    // --- BIND LIFECYCLE HOOKS TO INSTANCE ---
    if (typeof preload === 'function') p.preload = preload;
    if (typeof setup === 'function') p.setup = setup;
    if (typeof draw === 'function') p.draw = draw;
    if (typeof windowResized === 'function') p.windowResized = windowResized;
    if (typeof keyPressed === 'function') p.keyPressed = keyPressed;
    if (typeof keyReleased === 'function') p.keyReleased = keyReleased;
    if (typeof keyTyped === 'function') p.keyTyped = keyTyped;
    if (typeof mousePressed === 'function') p.mousePressed = mousePressed;
    if (typeof mouseReleased === 'function') p.mouseReleased = mouseReleased;
    if (typeof mouseDragged === 'function') p.mouseDragged = mouseDragged;

    // --- CABLES GL DATA BRIDGE ---
    p.onDataChange = (data) => {
        if (data && typeof updateSettings === 'function') {
            updateSettings(data);
        }
    };
    
    // Fallback resize hook
    p.onResize = (w, h) => {
        if (p.resizeCanvas) p.resizeCanvas(w, h);
    };
}
