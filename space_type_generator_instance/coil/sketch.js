// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "wide": {
        "typeX": 18,
        "typeY": 10,
        "typeStroke": 2,
        "ribbonCount": 100,
        "ribbonSize": 15,
        "radius": 15,
        "tracker": 2,
        "spiralStart": 40,
        "spin": 1,
        "waveSize": 0,
        "waveCount": 2,
        "waveSpeed": 1,
        "slope": 1,
        "radioEnd": 2,
        "inp0check": false,
        "color1": "#ffffff",
        "color2": "#0000ff",
        "color3": "#ff0000",
        "color4": "#000000",
        "bkgdColor": "#ffffff",
        "inpNumber": 4,
        "p.text": "THIS & THEN"
    },
    "tall": {
        "typeX": 11,
        "typeY": 68,
        "typeStroke": 1.5,
        "ribbonCount": 40,
        "ribbonSize": 25,
        "radius": 1,
        "tracker": 4,
        "spiralStart": 6,
        "spin": 1,
        "waveSize": 0,
        "waveCount": 2,
        "waveSpeed": 1,
        "slope": 1,
        "radioEnd": 2,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#ffff00",
        "color3": "#0000ff",
        "color4": "#ffffff",
        "color5": "#000000",
        "bkgdColor": "#0000ff",
        "inpNumber": 4,
        "p.text": "*SUPER*"
    },
    "amoeba": {
        "typeX": 9,
        "typeY": 14,
        "typeStroke": 1.5,
        "ribbonCount": 25,
        "ribbonSize": 22,
        "radius": 6,
        "tracker": 10,
        "spiralStart": 32,
        "spin": 1,
        "waveSize": 100,
        "waveCount": 2,
        "waveSpeed": 1,
        "slope": 1,
        "radioEnd": 2,
        "inp0check": false,
        "color1": "#ffff00",
        "color2": "#ff0000",
        "color3": "#011993",
        "bkgdColor": "#ffffff",
        "inpNumber": 3,
        "p.text": "in the micro, the macro"
    },
    "star": {
        "typeX": 7,
        "typeY": 20,
        "typeStroke": 2,
        "ribbonCount": 230,
        "ribbonSize": 0,
        "radius": 4.5,
        "tracker": 0,
        "spiralStart": 122,
        "spin": 2,
        "waveSize": 25,
        "waveCount": 5,
        "waveSpeed": 0,
        "slope": 1,
        "radioEnd": 1,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#ffff00",
        "color3": "#0000ff",
        "color4": "#ffffff",
        "bkgdColor": "#ffff00",
        "inpNumber": 4,
        "p.text": "------------"
    },
    "spacer": {
        "typeX": 5,
        "typeY": 50,
        "typeStroke": 2.5,
        "ribbonCount": 110,
        "ribbonSize": -10,
        "radius": 3.5,
        "tracker": 1,
        "spiralStart": 22,
        "spin": 1,
        "waveSize": 0,
        "waveCount": 0,
        "waveSpeed": 0,
        "slope": 0,
        "radioEnd": 1,
        "inp0check": true,
        "color1": "#ff0000",
        "color2": "#ffffff",
        "bkgdColor": "#000000",
        "inpNumber": 2,
        "p.text": "SPACE *"
    },
    "kitty": {
        "typeX": 6,
        "typeY": 23,
        "typeStroke": 1.5,
        "ribbonCount": 217,
        "ribbonSize": 9,
        "radius": 1.5,
        "tracker": 5,
        "spiralStart": 5,
        "spin": 0,
        "waveSize": 0,
        "waveCount": 0,
        "waveSpeed": 0,
        "slope": 0,
        "radioEnd": 1,
        "inp0check": false,
        "color1": "#0433FF",
        "color2": "#FFFB00",
        "color3": "#FF2F92",
        "color4": "#ffffff",
        "bkgdColor": "#FF7E79",
        "inpNumber": 4,
        "p.text": "Hello?"
    },
    "hourglass": {
        "typeX": 2,
        "typeY": 36,
        "typeStroke": 2,
        "ribbonCount": 337,
        "ribbonSize": 30,
        "radius": 3,
        "tracker": 3,
        "spiralStart": 96,
        "spin": 1,
        "waveSize": 83,
        "waveCount": 2,
        "waveSpeed": 4,
        "slope": 3.14,
        "radioEnd": 1,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#ffff00",
        "color3": "#0000ff",
        "color4": "#ffffff",
        "bkgdColor": "#D9D9D9",
        "inpNumber": 4,
        "p.text": " "
    },
    "star2": {
        "typeX": 5,
        "typeY": 12,
        "typeStroke": 2,
        "ribbonCount": 400,
        "ribbonSize": 43,
        "radius": 12.5,
        "tracker": 0,
        "spiralStart": 30,
        "spin": 1,
        "waveSize": 31,
        "waveCount": 6,
        "waveSpeed": 7,
        "slope": 1,
        "radioEnd": 1,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#FF9300",
        "color3": "#ffff00",
        "color4": "#00ff00",
        "color5": "#0000ff",
        "bkgdColor": "#ff0000",
        "inpNumber": 5,
        "p.text": " "
    },
    "pretzel": {
        "typeX": 4,
        "typeY": 20,
        "typeStroke": 2,
        "ribbonCount": 400,
        "ribbonSize": 31,
        "radius": 3,
        "tracker": 1,
        "spiralStart": 0,
        "spin": 1,
        "waveSize": 200,
        "waveCount": 1,
        "waveSpeed": 3,
        "slope": 1,
        "radioEnd": 1,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#ffff00",
        "color3": "#0000ff",
        "color4": "#ffffff",
        "bkgdColor": "#0000ff",
        "inpNumber": 4,
        "p.text": " "
    },
    "lemniscate": {
        "typeX": 4,
        "typeY": 9,
        "typeStroke": 2,
        "ribbonCount": 400,
        "ribbonSize": 50,
        "radius": 0,
        "tracker": 21,
        "spiralStart": 84,
        "spin": 1,
        "waveSize": 200,
        "waveCount": 2,
        "waveSpeed": 3,
        "slope": 1,
        "radioEnd": 2,
        "inp0check": false,
        "color1": "#ff0000",
        "color2": "#ffff00",
        "color3": "#0000ff",
        "color4": "#ffffff",
        "bkgdColor": "#000000",
        "inpNumber": 4,
        "p.text": " "
    }
};


// --- INLINED DEPENDENCY: ../lib/keyboardEngine_190221.js ---
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
      quadraticVertex(typeX/8,typeY*11/28,  typeX/8,typeY*6/28);
      p.bezierVertex(typeX/8,typeY/8,  typeX/4,0,  12/28*typeX,0);
      p.bezierVertex(5*typeX/8,0,  typeX*2/3,typeY/8,  typeX*2/3,typeY*5/28);
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

function letter_space () {
}




    // --- ORIGINAL SKETCH.JS CODE ---
    // LETTER
var typeX = 7;
var typeY = 20;
var typeStroke = 2;

// FIELD
var SA;

// RIBBONS
var ribbonCount = 40;
var ribbonSize = 10;
var ribbonColor;

// SPIRAL
var radius = 3, radiusAdjusted;
var tracker = 10, tracking;
var spiralStart = 50;
var spin = 1;

// WAVE
var waveSize = 0, waveCount = 2;
var waveSpeed = 1;
var slope = 1;

// STRING
var letter_select, inpText = "THIS & THEN ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 4;

// TOGGLES
var inp0check = false;
var radioEnd = 1; // 1 = p.round, 2 = flat

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;

var font;

function preload() {
  font = p.loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h);
  p.smooth();
  p.textFont(font);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  typeX = 7;
  typeY = 20;
  typeStroke = 2;
  ribbonCount = 40;
  ribbonSize = 10;
  radius = 3;
  tracker = 10;
  spiralStart = 50;
  spin = 1;
  waveSize = 0;
  waveCount = 2;
  waveSpeed = 1;
  slope = 1;
  radioEnd = 1;
  inp0check = false;

  inp1 = p.color('#ff0000');
  inp2 = p.color('#ffff00');
  inp3 = p.color('#0000ff');
  inp4 = p.color('#ffffff');
  inp5 = p.color('#000000');
  inp6 = p.color('#760089');
  bkgdColor = p.color('#000000');

  inpNumber = 4;
  inpText = "THIS & THEN ";

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

  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.ribbonCount !== undefined) ribbonCount = settings.ribbonCount;
  if (settings.ribbonSize !== undefined) ribbonSize = settings.ribbonSize;
  if (settings.radius !== undefined) radius = settings.radius;
  if (settings.tracker !== undefined) tracker = settings.tracker;
  if (settings.spiralStart !== undefined) spiralStart = settings.spiralStart;
  if (settings.spin !== undefined) spin = settings.spin;
  if (settings.waveSize !== undefined) waveSize = settings.waveSize;
  if (settings.waveCount !== undefined) waveCount = settings.waveCount;
  if (settings.waveSpeed !== undefined) waveSpeed = settings.waveSpeed;
  if (settings.slope !== undefined) slope = settings.slope;
  if (settings.radioEnd !== undefined) radioEnd = settings.radioEnd;
  if (settings.inp0check !== undefined) inp0check = settings.inp0check;

  if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
  if (settings.color1 !== undefined) { inp1 = p.color(settings.color1); }
  if (settings.color2 !== undefined) { inp2 = p.color(settings.color2); }
  if (settings.color3 !== undefined) { inp3 = p.color(settings.color3); }
  if (settings.color4 !== undefined) { inp4 = p.color(settings.color4); }
  if (settings.color5 !== undefined) { inp5 = p.color(settings.color5); }
  if (settings.color6 !== undefined) { inp6 = p.color(settings.color6); }
  if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
  if (settings.text !== undefined) inpText = String(settings.text);
}

function updateSettings(data) {
  if (!data) return;

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
    if (!loaded && p === 'pride') {
      pride();
    }
  }

  if (data.text !== undefined || data.string !== undefined) {
    inpText = data.text !== undefined ? String(data.text) : String(data.string);
    // Ensure trailing space is maintained if necessary
    if (!inpText.endsWith(" ")) {
      inpText += " ";
    }
    lastTextTime = p.millis();
    isClearing = false;
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.ribbonCount !== undefined) ribbonCount = Number(data.ribbonCount);
  if (data.ribbonSize !== undefined) ribbonSize = Number(data.ribbonSize);
  if (data.radius !== undefined) radius = Number(data.radius);
  if (data.tracker !== undefined) tracker = Number(data.tracker);
  if (data.spiralStart !== undefined) spiralStart = Number(data.spiralStart);
  if (data.spin !== undefined) spin = Number(data.spin);
  if (data.waveSize !== undefined) waveSize = Number(data.waveSize);
  if (data.waveCount !== undefined) waveCount = Number(data.waveCount);
  if (data.waveSpeed !== undefined) waveSpeed = Number(data.waveSpeed);
  if (data.slope !== undefined) slope = Number(data.slope);
  if (data.radioEnd !== undefined) radioEnd = Number(data.radioEnd);
  if (data.inp0check !== undefined) inp0check = Boolean(data.inp0check) || data.inp0check === 'true';

  if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);
  if (data.color1 !== undefined) { inp1 = p.color(data.color1); }
  if (data.color2 !== undefined) { inp2 = p.color(data.color2); }
  if (data.color3 !== undefined) { inp3 = p.color(data.color3); }
  if (data.color4 !== undefined) { inp4 = p.color(data.color4); }
  if (data.color5 !== undefined) { inp5 = p.color(data.color5); }
  if (data.color6 !== undefined) { inp6 = p.color(data.color6); }
  if (data.inpNumber !== undefined) inpNumber = Number(data.inpNumber);

  if (data.action === "savePreset") {
    const payload = {
      type: "savePreset",
      iframeSrc: window.location.href,
      name: data.name || "custom_preset",
      settings: {
        typeX: typeX,
        typeY: typeY,
        typeStroke: typeStroke,
        ribbonCount: ribbonCount,
        ribbonSize: ribbonSize,
        radius: radius,
        tracker: tracker,
        spiralStart: spiralStart,
        spin: spin,
        waveSize: waveSize,
        waveCount: waveCount,
        waveSpeed: waveSpeed,
        slope: slope,
        radioEnd: radioEnd,
        inp0check: inp0check,
        inpNumber: inpNumber,
        bkgdColor: bkgdColor.toString(),
        color1: inp1.toString(),
        color2: inp2 ? inp2.toString() : undefined,
        color3: inp3 ? inp3.toString() : undefined,
        color4: inp4 ? inp4.toString() : undefined,
        color5: inp5 ? inp5.toString() : undefined,
        color6: inp6 ? inp6.toString() : undefined,
        text: inpText
      }
    };
    if (typeof pubChannel !== 'undefined') {
      pubChannel.postMessage(payload);
    }
  }
}

function pride() {
  inpNumber = 6;
  inp1 = p.color('#e70000');
  inp2 = p.color('#ff8c00');
  inp3 = p.color('#ffef00');
  inp4 = p.color('#00811f');
  inp5 = p.color('#0044ff');
  inp6 = p.color('#760089');
  bkgdColor = p.color('#ffffff');
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
  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  p.noFill();

  p.push();
  p.translate(p.width / 2, p.height / 2);
  p.rotate(p.frameCount * -(spin / 200));

  radiusAdjusted = p.map(radius, 0, 50, typeY / 6, typeY * 2);
  tracking = p.map(tracker, 0, 50, typeX * 3 / 14, typeX * 4);

  for (var k = 0; k < ribbonCount; k++) {
    // ribbon
    if (inp0check === false) {
      setRibbonColor(k);
      p.stroke(ribbonColor);
      if (radioEnd === 1) {
        p.strokeCap(p.ROUND);
      } else {
        p.strokeCap(p.SQUARE);
      }
      p.strokeJoin(p.ROUND);
      p.strokeWeight(typeY + ribbonSize);
      p.beginShape();
      for (var i = spiralStart + inpText.length * k - 1; i <= spiralStart + inpText.length + inpText.length * k; i++) {
        var polarX = -(radiusAdjusted) * sqrt(tracking * i) * p.cos(sqrt(tracking * i));
        var polarY = -(radiusAdjusted) * sqrt(tracking * i) * p.sin(sqrt(tracking * i));

        var echo = p.atan2(polarY, polarX);
        var theWave = sinEngine(echo, waveCount, waveSpeed / 100, slope) * waveSize;
        var waveX = (theWave) * p.cos(echo);
        var waveY = (theWave) * p.sin(echo);

        p.vertex(polarX + waveX, polarY + waveY);
      }
      p.endShape();
    }

    // letter
    setTextColor(k);
    p.strokeWeight(typeStroke);
    p.stroke(strkColor);
    p.strokeCap(p.PROJECT); p.strokeJoin(p.ROUND);
    for (var i = spiralStart + inpText.length * k; i < spiralStart + inpText.length + inpText.length * k; i++) {
      letter_select = (i - spiralStart) % inpText.length;
      var polarX = -(radiusAdjusted) * sqrt(tracking * i) * p.cos(sqrt(tracking * i));
      var polarY = -(radiusAdjusted) * sqrt(tracking * i) * p.sin(sqrt(tracking * i));

      var preX = -(radiusAdjusted) * sqrt(tracking * (i - 1)) * p.cos(sqrt(tracking * (i - 1)));
      var preY = -(radiusAdjusted) * sqrt(tracking * (i - 1)) * p.sin(sqrt(tracking * (i - 1)));
      var postX = -(radiusAdjusted) * sqrt(tracking * (i + 1)) * p.cos(sqrt(tracking * (i + 1)));
      var postY = -(radiusAdjusted) * sqrt(tracking * (i + 1)) * p.sin(sqrt(tracking * (i + 1)));

      var echo = p.atan2(polarY, polarX);
      var theWave = sinEngine(echo, waveCount, waveSpeed / 100, slope) * waveSize;
      var waveX = (theWave) * p.cos(echo);
      var waveY = (theWave) * p.sin(echo);

      var preEcho = p.atan2(preY, preX);
      var preWave = sinEngine(preEcho, waveCount, waveSpeed / 100, slope) * waveSize;
      var preWaveX = (preWave) * p.cos(preEcho);
      var preWaveY = (preWave) * p.sin(preEcho);

      var postEcho = p.atan2(postY, postX);
      var postWave = sinEngine(postEcho, waveCount, waveSpeed / 100, slope) * waveSize;
      var postWaveX = (postWave) * p.cos(postEcho);
      var postWaveY = (postWave) * p.sin(postEcho);

      var delta = p.atan2((postY + postWaveY) - (preY + preWaveY), (postX + postWaveX) - (preX + preWaveX));

      p.push();
      p.translate(polarX + waveX, polarY + waveY);
      p.rotate(delta);
      p.translate(-typeX / 2, -typeY / 2);
      keyboardEngine();
      p.pop();
    }
  }

  p.pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(xCount, xLength, Speed, slopeN) {
  var sinus = p.sin((p.frameCount * Speed + xCount * xLength));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - p.pow(1 - p.abs(sinus), slopeN));
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

function setTextOnlyColor(switcher) {
  if (inpNumber == 6) {
    if (switcher % 6 == 0) { strkColor = inp1; }
    if (switcher % 6 == 1) { strkColor = inp2; }
    if (switcher % 6 == 2) { strkColor = inp3; }
    if (switcher % 6 == 3) { strkColor = inp4; }
    if (switcher % 6 == 4) { strkColor = inp5; }
    if (switcher % 6 == 5) { strkColor = inp6; }
  } else if (inpNumber == 5) {
    if (switcher % 5 == 0) { strkColor = inp1; }
    if (switcher % 5 == 1) { strkColor = inp2; }
    if (switcher % 5 == 2) { strkColor = inp3; }
    if (switcher % 5 == 3) { strkColor = inp4; }
    if (switcher % 5 == 4) { strkColor = inp5; }
  } else if (inpNumber == 4) {
    if (switcher % 4 == 0) { strkColor = inp1; }
    if (switcher % 4 == 1) { strkColor = inp2; }
    if (switcher % 4 == 2) { strkColor = inp3; }
    if (switcher % 4 == 3) { strkColor = inp4; }
  } else if (inpNumber == 3) {
    if (switcher % 3 == 0) { strkColor = inp1; }
    if (switcher % 3 == 1) { strkColor = inp2; }
    if (switcher % 3 == 2) { strkColor = inp3; }
  } else if (inpNumber == 2) {
    if (switcher % 2 == 0) { strkColor = inp1; }
    if (switcher % 2 == 1) { strkColor = inp2; }
  } else if (inpNumber == 1) {
    strkColor = inp1;
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
