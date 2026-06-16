// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "post_space": {
        "rows": 23,
        "typeStroke": 1,
        "tracking": 200,
        "speed": 0,
        "lineSpace": 5,
        "padding": 20,
        "mirror": false,
        "textColor": "#ffffff",
        "bkgdColor": "#000000",
        "p.text": "POST    *    SPACE"
    },
    "moon": {
        "rows": 20,
        "typeStroke": 1,
        "tracking": 168,
        "speed": 0,
        "lineSpace": 2,
        "padding": 100,
        "mirror": true,
        "textColor": "#D8E9EF",
        "bkgdColor": "#000000",
        "p.text": "MOON"
    },
    "cross": {
        "rows": 22,
        "typeStroke": 1,
        "tracking": 500,
        "speed": 0,
        "lineSpace": 0,
        "padding": 250, // Calculated fallback or constant
        "mirror": true,
        "textColor": "#000000",
        "bkgdColor": "#FFFFFF",
        "p.text": "X"
    },
    "bridge": {
        "rows": 7,
        "typeStroke": 4,
        "tracking": 0,
        "speed": 0.66,
        "lineSpace": 11,
        "padding": 50,
        "mirror": true,
        "mirrorSpeed": true,
        "textColor": "#000000",
        "bkgdColor": "#D6D6D6",
        "p.text": "MMMMM"
    },
    "whitney": {
        "rows": 17,
        "typeStroke": 1.5,
        "tracking": 15,
        "speed": 0.89,
        "lineSpace": 4,
        "padding": 0,
        "mirror": true,
        "textColor": "#000000",
        "bkgdColor": "#FFFFFF",
        "p.text": "W W"
    },
    "beach": {
        "rows": 35,
        "typeStroke": 1,
        "tracking": 208,
        "speed": 0.3,
        "lineSpace": 5,
        "padding": 20,
        "mirror": true,
        "mirrorSpeed": true,
        "textColor": "#000000",
        "bkgdColor": "#FFFFFF",
        "p.text": "////"
    },
    "recede": {
        "rows": 20,
        "typeStroke": 1,
        "tracking": 0,
        "speed": 0,
        "lineSpace": 7,
        "padding": 0,
        "mirror": true,
        "fluxCheck": true,
        "textColor": "#FFFFFF",
        "bkgdColor": "#242424",
        "p.text": "XXX"
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
var typeX, typeY;
var typeStroke = 1;
var tracking = 2.0; // tracking / 100

// FIELD
var xSpace, ySpace;
var yBlock;
var rows = 10;
var speed = 0.3;
var SA;
var padding = 20;
var mirror = true; // mirrorCheck.checked
var mirrorSpeed = false; // mirrorSpeedCheck.checked
var fluxCheck = false; // fluxCheck.checked
var track;
var lineSpace = 5;
var mover = 1;
var rowMax;

// STRING
var letter_select, inpText = "SPACE ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor, textColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;
var strkColor;

// Broadcast settings
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
  rows = 10;
  typeStroke = 1;
  tracking = 2.0; // 200 / 100
  speed = 0.3;
  lineSpace = 5;
  padding = 20;
  mirror = true;
  mirrorSpeed = false;
  fluxCheck = false;
  mover = 1;

  textColor = p.color('#FFFFFF');
  bkgdColor = p.color('#000000');

  inp1 = p.color('#FFFFFF');
  inp2 = p.color('#ff8c00');
  inp3 = p.color('#ffef00');
  inp4 = p.color('#00811f');
  inp5 = p.color('#0044ff');
  inp6 = p.color('#760089');
  inpNumber = 1;

  inpText = "SPACE ";

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

  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.tracking !== undefined) tracking = settings.tracking / 100;
  if (settings.speed !== undefined) speed = settings.speed;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.padding !== undefined) padding = settings.padding;
  if (settings.mirror !== undefined) mirror = settings.mirror;
  if (settings.mirrorSpeed !== undefined) mirrorSpeed = settings.mirrorSpeed;
  if (settings.fluxCheck !== undefined) fluxCheck = settings.fluxCheck;

  if (settings.textColor !== undefined) textColor = p.color(settings.textColor);
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
    const p = data.preset.toLowerCase().replace(" ", "_");
    let loaded = false;
    if (typeof customPresets !== 'undefined') {
      const matchedKey = Object.keys(customPresets).find(k => k.toLowerCase().replace(" ", "_") === p);
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

  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.tracking !== undefined) tracking = Number(data.tracking) / 100;
  if (data.speed !== undefined) speed = Number(data.speed);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.padding !== undefined) padding = Number(data.padding);
  if (data.mirror !== undefined) mirror = Boolean(data.mirror) || data.mirror === 'true';
  if (data.mirrorSpeed !== undefined) mirrorSpeed = Boolean(data.mirrorSpeed) || data.mirrorSpeed === 'true';
  if (data.fluxCheck !== undefined) fluxCheck = Boolean(data.fluxCheck) || data.fluxCheck === 'true';

  if (data.textColor !== undefined) textColor = p.color(data.textColor);
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
        rows: rows,
        typeStroke: typeStroke,
        tracking: tracking * 100,
        speed: speed,
        lineSpace: lineSpace,
        padding: padding,
        mirror: mirror,
        mirrorSpeed: mirrorSpeed,
        fluxCheck: fluxCheck,
        textColor: textColor.toString(),
        bkgdColor: bkgdColor.toString(),
        inpNumber: inpNumber,
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
  textColor = p.color('#ffffff');
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
  p.strokeWeight(typeStroke);
  p.stroke(textColor);
  p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);

  p.push();
  p.translate(padding, 60);

  var displayRows = rows;
  if (fluxCheck === true) {
    rowMax = rows;
    displayRows = p.map(sinEngine(0.05, 2), -1, 1, rowMax, 0.99);
  }

  let xField = p.width - (2 * padding);
  let yField = p.height - 140;

  typeY = yField;
  let step = (p.sq(displayRows) + displayRows) / 2;

  if (mirror === true) {
    yBlock = (yField - (displayRows) * lineSpace * 2) / (step * 2);
  } else {
    yBlock = (yField - (displayRows - 1) * lineSpace) / (step);
  }

  let speedBlock = speed;

  for (var j = 0; j < displayRows; j++) {
    typeX = xField / ((j + 1) * inpText.length + ((j + 1) * inpText.length - 1) * tracking);
    if (typeX <= 0) typeX = 1;
    track = typeX * tracking;
    for (var i = 0; i < j + 1; i++) {
      for (var k = 0; k < inpText.length; k++) {
        letter_select = k;
        typeY = yBlock * (displayRows - j);

        if (inpNumber == 6) {
          setTextColor(j);
          p.stroke(strkColor);
        } else {
          p.stroke(textColor);
        }

        p.push();
        p.translate(k * typeX + k * track, 0);
        p.translate(inpText.length * typeX * i + inpText.length * track * i, 0);
        p.translate(-(mover * speedBlock * (displayRows - j)) % (xField + track), 0);
        keyboardEngine();
        p.pop();

        if (speed > 0) {
          p.push();
          p.translate(k * typeX + k * track, 0);
          p.translate(inpText.length * typeX * i + inpText.length * track * i, 0);
          p.translate(-(mover * speedBlock * (displayRows - j)) % (xField + track) + (xField + track), 0);
          keyboardEngine();
          p.pop();
        }
      }
    }
    p.translate(0, typeY + lineSpace);
  }

  if (mirror === true) {
    p.pop();
    p.push();
    p.translate(padding, 60);
    p.translate(0, yField);

    for (var m = 0; m < displayRows; m++) {
      typeX = xField / ((m + 1) * inpText.length + ((m + 1) * inpText.length - 1) * tracking);
      if (typeX <= 0) typeX = 1;
      track = typeX * tracking;
      typeY = yBlock * (displayRows - m);

      p.translate(0, -typeY - lineSpace);

      for (var n = 0; n < m + 1; n++) {
        for (var p = 0; p < inpText.length; p++) {
          letter_select = p;

          if (inpNumber == 6) {
            setTextColor(m);
            p.stroke(strkColor);
          } else {
            p.stroke(textColor);
          }

          p.push();
          p.translate(p * typeX + p * track, 0);
          p.translate(inpText.length * typeX * n + inpText.length * track * n, 0);

          if (mirrorSpeed === true) {
            p.translate((mover * speedBlock * (displayRows - m)) % (xField + track), 0);
          } else {
            p.translate(-(mover * speedBlock * (displayRows - m)) % (xField + track), 0);
          }
          keyboardEngine();
          p.pop();

          if (speed > 0) {
            p.push();
            p.translate(p * typeX + p * track, 0);
            p.translate(inpText.length * typeX * n + inpText.length * track * n, 0);

            if (mirrorSpeed === true) {
              p.translate((mover * speedBlock * (displayRows - m)) % (xField + track) - (xField + track), 0);
            } else {
              p.translate(-(mover * speedBlock * (displayRows - m)) % (xField + track) + (xField + track), 0);
            }
            keyboardEngine();
            p.pop();
          }
        }
      }
    }
  }

  p.pop();
  p.noStroke(); p.fill(bkgdColor);
  p.rect(-1, -1, padding, p.height - 60);
  p.rect(p.width + 1, -1, -padding, p.height - 60);

  mover++;

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(speed, slope) {
  var sinus = p.cos((mover * speed - p.PI));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - p.pow(1 - p.abs(sinus), slope));
  return sinerSquare;
}

function setTextColor(switcher) {
  if (switcher % 6 == 0) { strkColor = inp1; }
  if (switcher % 6 == 1) { strkColor = inp2; }
  if (switcher % 6 == 2) { strkColor = inp3; }
  if (switcher % 6 == 3) { strkColor = inp4; }
  if (switcher % 6 == 4) { strkColor = inp5; }
  if (switcher % 6 == 5) { strkColor = inp6; }
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
