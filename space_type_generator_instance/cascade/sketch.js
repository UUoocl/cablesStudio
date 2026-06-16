// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "cascade": {
        "typeX": 20,
        "typeStroke": 2,
        "tracking": 3,
        "lineSpace": 22,
        "rows": 80,
        "waveLength": 0.59,
        "waveSpeed": 2,
        "slope": 1.5,
        "mirrorCheck": false,
        "gradientCheck": false,
        "inp0check": true,
        "color1": "#ffffff",
        "bkgdColor": "#0000ff",
        "p.text": "CASCADE",
        "inpNumber": 1
    },
    "checker": {
        "typeX": 17,
        "typeStroke": 2,
        "tracking": 10,
        "lineSpace": 20,
        "rows": 18,
        "waveLength": 0.37,
        "waveSpeed": 2,
        "slope": 3.14,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#ffffff",
        "color2": "#000000",
        "bkgdColor": "#000000",
        "p.text": "SPACE TYPE GENERATOR V.CASCADE",
        "inpNumber": 2
    },
    "mosaic": {
        "typeX": 13,
        "typeStroke": 1.5,
        "tracking": 13,
        "lineSpace": 12,
        "rows": 6,
        "waveLength": 1.5,
        "waveSpeed": 3,
        "slope": 3.14,
        "mirrorCheck": false,
        "gradientCheck": false,
        "inp0check": true,
        "color1": "#ffffff",
        "bkgdColor": "#000000",
        "p.text": "COLLECT THEM ALL",
        "inpNumber": 1
    },
    "running": {
        "typeX": 20,
        "typeStroke": 2,
        "tracking": 10,
        "lineSpace": 10,
        "rows": 15,
        "waveLength": 0,
        "waveSpeed": 5,
        "slope": 3.14,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#000000",
        "bkgdColor": "#ffff00",
        "p.text": "RUNNING UP THAT HILL",
        "inpNumber": 1
    },
    "gradientchecker": {
        "typeX": 20,
        "typeStroke": 2,
        "tracking": 10,
        "lineSpace": 20,
        "rows": 30,
        "waveLength": 1.5,
        "waveSpeed": 4,
        "slope": 3.14,
        "mirrorCheck": false,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#000000",
        "color2": "#4d4d4d",
        "color3": "#808080",
        "color4": "#cccccc",
        "color5": "#ffffff",
        "bkgdColor": "#ffffff",
        "p.text": "HERE TODAY. GONE TOMORROW.",
        "inpNumber": 5
    },
    "salmon": {
        "typeX": 40,
        "typeStroke": 2,
        "tracking": 0,
        "lineSpace": 0,
        "rows": 14,
        "waveLength": 0,
        "waveSpeed": 5,
        "slope": 1,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#FF7E79",
        "bkgdColor": "#ffffff",
        "p.text": "////////////////////",
        "inpNumber": 1
    },
    "classic": {
        "typeX": 24,
        "typeStroke": 4,
        "tracking": 20,
        "lineSpace": 38,
        "rows": 14,
        "waveLength": 0.36,
        "waveSpeed": 1,
        "slope": 2,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#0000ff",
        "color2": "#ffff00",
        "color3": "#ff0000",
        "color4": "#ffffff",
        "color5": "#000000",
        "bkgdColor": "#ffff00",
        "p.text": " I AM ROOTED. BUT I FLOW. ",
        "inpNumber": 4
    },
    "grid": {
        "typeX": 62,
        "typeStroke": 1,
        "tracking": 0,
        "lineSpace": 0,
        "rows": 18,
        "waveLength": 0,
        "waveSpeed": 3,
        "slope": 3.14,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#ffffff",
        "bkgdColor": "#0000ff",
        "p.text": "IIIIIIIIIIIII",
        "inpNumber": 1
    },
    "webart": {
        "typeX": 30,
        "typeStroke": 0,
        "tracking": 0,
        "lineSpace": 0,
        "rows": 50,
        "waveLength": 0.32,
        "waveSpeed": 1,
        "slope": 3.14,
        "mirrorCheck": true,
        "gradientCheck": true,
        "inp0check": false,
        "color1": "#000000",
        "color2": "#ffffff",
        "color3": "#ff0000",
        "color4": "#ffff00",
        "color5": "#0000ff",
        "bkgdColor": "#ffffff",
        "p.text": "                              ",
        "inpNumber": 5
    },
    "sparkle": {
        "typeX": 17,
        "typeStroke": 2.5,
        "tracking": 4,
        "lineSpace": 0,
        "rows": 20,
        "waveLength": 0.25,
        "waveSpeed": 6,
        "slope": 0.5,
        "mirrorCheck": true,
        "gradientCheck": false,
        "inp0check": false,
        "color1": "#ffffff",
        "color2": "#FF85FF",
        "color3": "#00FDFF",
        "color4": "#0433FF",
        "color5": "#0000ff",
        "bkgdColor": "#0096FF",
        "p.text": "***************",
        "inpNumber": 4
    },
    "pixelgradient": {
        "typeX": 30,
        "typeStroke": 0,
        "tracking": 0,
        "lineSpace": 0,
        "rows": 46,
        "waveLength": 0.28,
        "waveSpeed": 2,
        "slope": 0.8,
        "mirrorCheck": false,
        "gradientCheck": true,
        "inp0check": false,
        "color1": "#2CFDFE",
        "color2": "#FD8DD7",
        "color3": "#FC3692",
        "color4": "#103FFB",
        "bkgdColor": "#ffffff",
        "p.text": "                    ",
        "inpNumber": 4
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
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var tracking = 10;
var lineSpace = 20;

var yBlock;
var yField;
var typeYfigure;
var rows = 14;
var SA;

// WAVE
var waveSize, waveLength = 0.13;
var waveSpeed = 0.01;
var slope = 1;

// STRING
var letter_select, inpText = "SPACE TYPE GENERATOR _V.CASCADE";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor;
var ribbonColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 2;

// TOGGLES
var mirrorCheck = false;
var gradientCheck = false;
var inp0check = false;

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
  typeX = 20;
  typeY = 40;
  typeStroke = 2;
  tracking = 10;
  lineSpace = 20;
  rows = 14;
  waveLength = 0.13;
  waveSpeed = 0.01;
  slope = 1;

  mirrorCheck = false;
  gradientCheck = false;
  inp0check = false;

  inp1 = p.color('#000000');
  inp2 = p.color('#ffffff');
  inp3 = p.color('#ff0000');
  inp4 = p.color('#ffff00');
  inp5 = p.color('#0000ff');
  inp6 = p.color('#760089');
  bkgdColor = p.color('#ffffff');

  inpNumber = 2;
  inpText = "SPACE TYPE GENERATOR _V.CASCADE";

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
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.tracking !== undefined) tracking = settings.tracking;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.waveLength !== undefined) waveLength = settings.waveLength;
  if (settings.waveSpeed !== undefined) waveSpeed = settings.waveSpeed / 100;
  if (settings.slope !== undefined) slope = settings.slope;

  if (settings.mirrorCheck !== undefined) mirrorCheck = settings.mirrorCheck;
  if (settings.gradientCheck !== undefined) gradientCheck = settings.gradientCheck;
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
    lastTextTime = p.millis();
    isClearing = false;
  }
  if (data.clearTextDelay !== undefined) clearTextDelay = Number(data.clearTextDelay);
  if (data.clearMethod !== undefined) clearMethod = String(data.clearMethod);
  if (data.seqInterval !== undefined) seqInterval = Number(data.seqInterval);
  if (data.hideNoText !== undefined) hideNoText = Boolean(data.hideNoText) || data.hideNoText === 'true';

  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.tracking !== undefined) tracking = Number(data.tracking);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.waveLength !== undefined) waveLength = Number(data.waveLength);
  if (data.waveSpeed !== undefined) waveSpeed = Number(data.waveSpeed) / 100;
  if (data.slope !== undefined) slope = Number(data.slope);

  if (data.mirrorCheck !== undefined) mirrorCheck = Boolean(data.mirrorCheck) || data.mirrorCheck === 'true';
  if (data.gradientCheck !== undefined) gradientCheck = Boolean(data.gradientCheck) || data.gradientCheck === 'true';
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
        typeStroke: typeStroke,
        tracking: tracking,
        lineSpace: lineSpace,
        rows: rows,
        waveLength: waveLength,
        waveSpeed: waveSpeed * 100,
        slope: slope,
        mirrorCheck: mirrorCheck,
        gradientCheck: gradientCheck,
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
  yField = p.height - 50;

  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  let step = (p.sq(rows) + rows) / 2;

  if (mirrorCheck === true) {
    yBlock = yField / (step * 2);
  } else {
    yBlock = yField / step;
  }

  let waveBlock = 2 * p.PI / rows;

  p.push();
  p.translate(p.width / 2, p.height / 2);
  p.translate(-(runLength * typeX + tracking * (runLength - 1)) / 2, -yField / 2);

  for (var k = 0; k < runLength; k++) {
    p.push();
    for (var i = 0; i < rows; i++) {
      if (gradientCheck === true) {
        setGradient(i);
      } else if (inp0check === false) {
        setTextColor(i);
        setRibbonColor(i);
      } else {
        setTextOnlyColor(i);
      }

      letter_select = k;

      if (waveSpeed > 0) {
        typeYfigure = p.map(sinEngine(i, waveBlock, k, waveLength, waveSpeed, slope), -1, 1, yBlock, rows * yBlock);
      } else {
        typeYfigure = (rows - i) * yBlock;
      }
      typeY = typeYfigure - typeYfigure * (lineSpace / 100);
      var currentLineSpace = typeYfigure * (lineSpace / 100);

      p.push();
      p.translate(typeX * k + tracking * k, 0);
      if (inp0check === false) {
        p.fill(ribbonColor); p.noStroke();
        p.rect(-tracking / 2, 0, typeX + tracking, typeYfigure);
      }
      p.translate(0, currentLineSpace / 2);
      p.stroke(strkColor); p.strokeWeight(typeStroke); p.noFill();
      keyboardEngine();
      p.pop();
      p.translate(0, typeYfigure);
    }
    p.pop();
  }

  if (mirrorCheck === true) {
    p.push();
    p.translate(0, yField / 2);

    for (var m = 0; m < runLength; m++) {
      p.push();
      for (var n = 1; n < rows + 1; n++) {
        if (gradientCheck === true) {
          setGradient(rows - n);
        } else if (inp0check === false) {
          setTextColor(rows - n);
          setRibbonColor(rows - n);
        } else {
          setTextOnlyColor(rows - n);
        }

        letter_select = m;

        if (waveSpeed > 0) {
          typeYfigure = p.map(sinEngine(rows - n, waveBlock, m, waveLength, waveSpeed, slope), -1, 1, yBlock, rows * yBlock);
        } else {
          typeYfigure = n * yBlock;
        }
        typeY = typeYfigure - typeYfigure * (lineSpace / 100);
        var currentLineSpace = typeYfigure * (lineSpace / 100);

        p.push();
        p.translate(typeX * m + tracking * m, 0);
        if (inp0check === false) {
          p.fill(ribbonColor); p.noStroke();
          p.rect(-tracking / 2, 0, typeX + tracking, typeYfigure);
        }
        p.translate(0, currentLineSpace / 2);
        p.stroke(strkColor); p.strokeWeight(typeStroke); p.noFill();
        keyboardEngine();
        p.pop();
        p.translate(0, typeYfigure);
      }
      p.pop();
    }
    p.pop();
  }

  p.pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(aCount, aLength, bCount, bLength, Speed, slopeN) {
  var sinus = p.sin((-p.frameCount * Speed + aCount * aLength + bCount * bLength));
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

function setGradient(switcher) {
  if (inpNumber == 5 || inpNumber == 6) {
    let from = inp1;
    let mid = inp2;
    let mid2 = inp3;
    let mid3 = inp4;
    let to = inp5;
    if (switcher <= (rows / 4)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (rows / 4));
      strkColor = from;
    } else if (switcher > (rows / 4) && switcher <= (rows / 2)) {
      ribbonColor = p.lerpColor(mid, mid2, (switcher - rows / 4) / (rows / 4));
      strkColor = mid;
    } else if (switcher > (rows / 2) && switcher <= (3 * rows / 4)) {
      ribbonColor = p.lerpColor(mid2, mid3, (switcher - rows / 2) / (rows / 4));
      strkColor = mid2;
    } else {
      ribbonColor = p.lerpColor(mid3, to, (switcher - 3 * rows / 4) / (rows / 4));
      strkColor = mid3;
    }
  } else if (inpNumber == 4) {
    let from = inp1;
    let mid = inp2;
    let mid2 = inp3;
    let to = inp4;
    if (switcher <= (rows / 3)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (rows / 3));
      strkColor = from;
    } else if (switcher > (rows / 3) && switcher <= (2 * rows / 3)) {
      ribbonColor = p.lerpColor(mid, mid2, (switcher - rows / 3) / (rows / 3));
      strkColor = mid;
    } else {
      ribbonColor = p.lerpColor(mid2, to, (switcher - 2 * rows / 3) / (rows / 3));
      strkColor = mid2;
    }
  } else if (inpNumber == 3) {
    let from = inp1;
    let mid = inp2;
    let to = inp3;
    if (switcher <= (rows / 2)) {
      ribbonColor = p.lerpColor(from, mid, switcher / (rows / 2));
      strkColor = from;
    } else {
      ribbonColor = p.lerpColor(mid, to, (switcher - rows / 2) / (rows / 2));
      strkColor = mid;
    }
  } else if (inpNumber == 2) {
    let from = inp1;
    let to = inp2;
    ribbonColor = p.lerpColor(from, to, switcher / rows);
    strkColor = from;
  } else if (inpNumber == 1) {
    let from = inp1;
    let to = bkgdColor;
    ribbonColor = p.lerpColor(from, to, switcher / rows);
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
