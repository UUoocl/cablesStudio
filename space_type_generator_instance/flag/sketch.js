// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "one_banner": {
        "typeX": 20,
        "typeY": 40,
        "typeStroke": 1.0,
        "rows": 1,
        "padding": 0.2,
        "typePush": 0,
        "zWave": 70,
        "xWave": 0,
        "yWave": 0,
        "offset": 0.3,
        "speed": 0.02,
        "rowOffset": 0,
        "xRotCamera": 25,
        "yRotCamera": 75,
        "zRotCamera": -10,
        "zoomCamera": -150,
        "color1": "#FFFFFF",
        "color2": "#ff0000",
        "bkgdColor": "#00FDFF",
        "inpNumber": 2,
        "p.text": " -ALL THIS AND MORE // ALL THIS AND MORE- "
    },
    "folds": {
        "typeX": 45,
        "typeY": 70,
        "typeStroke": 3.0,
        "rows": 8,
        "padding": 0.2,
        "typePush": 8.5,
        "zWave": 90,
        "xWave": 0,
        "yWave": 0,
        "offset": 0.21,
        "speed": 0.02,
        "rowOffset": 2.55,
        "xRotCamera": 51,
        "yRotCamera": 37,
        "zRotCamera": -28,
        "zoomCamera": -300,
        "color1": "#FFFFFF",
        "color2": "#0000ff",
        "color3": "#ff0000",
        "color4": "#ffff00",
        "color5": "#000000",
        "bkgdColor": "#ffff00",
        "inpNumber": 5,
        "p.text": " I AM OUTSIDE TIME "
    },
    "twist": {
        "typeX": 30,
        "typeY": 50,
        "typeStroke": 2.0,
        "rows": 1,
        "padding": 0.7,
        "typePush": 4,
        "zWave": 30,
        "xWave": 0,
        "yWave": 0,
        "offset": 0.3,
        "speed": 0.02,
        "rowOffset": 3.14,
        "xRotCamera": -45,
        "yRotCamera": 37,
        "zRotCamera": -15,
        "zoomCamera": -120,
        "color1": "#FFFFFF",
        "color2": "#000000",
        "bkgdColor": "#0000FF",
        "inpNumber": 2,
        "p.text": " THERE ARE NO ENDINGS "
    },
    "flat_sea": {
        "typeX": 25,
        "typeY": 45,
        "typeStroke": 2.0,
        "rows": 12,
        "padding": 0.4,
        "typePush": 4,
        "zWave": 75,
        "xWave": 0,
        "yWave": 200,
        "offset": 0.11,
        "speed": 0.08,
        "rowOffset": 1.96,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "zoomCamera": -500,
        "color1": "#FFFFFF",
        "color2": "#FF0000",
        "color3": "#0000FF",
        "color4": "#ffff00",
        "color5": "#000000",
        "bkgdColor": "#000000",
        "inpNumber": 5,
        "p.text": " rolled by like scrolls of silver "
    },
    "barber": {
        "typeX": 20,
        "typeY": 40,
        "typeStroke": 1.5,
        "rows": 15,
        "padding": 0.2,
        "typePush": 2,
        "zWave": 0,
        "xWave": 0,
        "yWave": 30,
        "offset": 0.3,
        "speed": 0.07,
        "rowOffset": 2.13,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": -30,
        "zoomCamera": -150,
        "color1": "#FFFFFF",
        "color2": "#0000ff",
        "color3": "#ff0000",
        "color4": "#000000",
        "bkgdColor": "#D6D6D6",
        "inpNumber": 4,
        "p.text": " DOUBLE-STRIPES BREAK! "
    },
    "cola_wave": {
        "typeX": 35,
        "typeY": 100,
        "typeStroke": 3.0,
        "rows": 4,
        "padding": 0.43,
        "typePush": 0,
        "zWave": 0,
        "xWave": 0,
        "yWave": 150,
        "offset": 0.19,
        "speed": 0.02,
        "rowOffset": 0.28,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "zoomCamera": -500,
        "color1": "#FFFFFF",
        "color2": "#ff0000",
        "color3": "#D6D6D6",
        "color4": "#0000ff",
        "bkgdColor": "#FF0000",
        "inpNumber": 4,
        "p.text": " ------ENTIRE FUTURES ARE BORN------ "
    },
    "origami": {
        "typeX": 87,
        "typeY": 83,
        "typeStroke": 3.0,
        "rows": 18,
        "padding": 0.43,
        "typePush": 10,
        "zWave": 75,
        "xWave": 0,
        "yWave": 0,
        "offset": 0.21,
        "speed": 0.12,
        "rowOffset": 3.14,
        "xRotCamera": 42,
        "yRotCamera": 20,
        "zRotCamera": -23,
        "zoomCamera": -500,
        "color1": "#FFFFFF",
        "color2": "#ff0000",
        "color3": "#ffff00",
        "color4": "#0000ff",
        "bkgdColor": "#011993",
        "inpNumber": 4,
        "p.text": " Forever Future Landscapes "
    },
    "blackwhite": {
        "typeX": 17,
        "typeY": 43,
        "typeStroke": 2.0,
        "rows": 10,
        "padding": 0.28,
        "typePush": 2,
        "zWave": 0,
        "xWave": 200,
        "yWave": 55,
        "offset": 0.3,
        "speed": 0.06,
        "rowOffset": 0.3,
        "xRotCamera": 30,
        "yRotCamera": 30,
        "zRotCamera": 0,
        "zoomCamera": -250,
        "color1": "#FFFFFF",
        "color2": "#000000",
        "bkgdColor": "#000000",
        "inpNumber": 2,
        "p.text": " This and then that "
    },
    "newsprint": {
        "typeX": 42,
        "typeY": 48,
        "typeStroke": 2.0,
        "rows": 16,
        "padding": 0.48,
        "typePush": 4,
        "zWave": 83,
        "xWave": 200,
        "yWave": 200,
        "offset": 0.11,
        "speed": 0.08,
        "rowOffset": 1.96,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "zoomCamera": -500,
        "color1": "#FFFFFF",
        "color2": "#000000",
        "bkgdColor": "#5e5e5e",
        "inpNumber": 2,
        "p.text": " Rolled by like scrolls over silver "
    },
    "silos": {
        "typeX": 15,
        "typeY": 43,
        "typeStroke": 1.5,
        "rows": 7,
        "padding": 0.2,
        "typePush": 8,
        "zWave": 200,
        "xWave": 0,
        "yWave": 0,
        "offset": 0.37,
        "speed": 0.1,
        "rowOffset": 0,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "zoomCamera": -90,
        "color1": "#FFFF00",
        "color2": "#0000FF",
        "color3": "#ff0000",
        "bkgdColor": "#FFFFFF",
        "inpNumber": 3,
        "p.text": " BEFORE AND DURING AND AFTER "
    },
    "crane": {
        "typeX": 12,
        "typeY": 40,
        "typeStroke": 1.75,
        "rows": 10,
        "padding": 0.4,
        "typePush": 3,
        "zWave": 32,
        "xWave": 115,
        "yWave": 0,
        "offset": 0.2,
        "speed": 0.03,
        "rowOffset": 2.47,
        "xRotCamera": 40,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "color1": "#FFFFFF",
        "color2": "#0000FF",
        "color3": "#ff0000",
        "bkgdColor": "#0000ff",
        "inpNumber": 3,
        "p.text": " square possibilities "
    },
    "edge": {
        "typeX": 40,
        "typeY": 70,
        "typeStroke": 2.0,
        "rows": 5,
        "padding": 0.2,
        "typePush": 0,
        "xWave": 200,
        "yWave": 0,
        "zWave": 0,
        "offset": 0.42,
        "speed": 0.02,
        "rowOffset": 0.46,
        "xRotCamera": 0,
        "yRotCamera": 11,
        "zRotCamera": 30,
        "zoomCamera": -500,
        "inp0check": true,
        "color1": "#FFFFFF",
        "bkgdColor": "#000000",
        "inpNumber": 1,
        "p.text": "harsh yet p.smooth angles"
    },
    "mystery": {
        "typeX": 25,
        "typeY": 45,
        "typeStroke": 2.0,
        "rows": 15,
        "padding": 0.27,
        "typePush": 0,
        "xWave": 0,
        "yWave": 71,
        "zWave": 73,
        "offset": 0.22,
        "speed": 0.08,
        "rowOffset": 1.96,
        "xRotCamera": 0,
        "yRotCamera": 0,
        "zRotCamera": 0,
        "zoomCamera": -500,
        "inp0check": true,
        "color1": "#000000",
        "bkgdColor": "#ffffff",
        "inpNumber": 1,
        "p.text": "A gentle flowing space"
    }
};


// --- INLINED DEPENDENCY: ../lib/keyboardEngine_190402_corners.js ---
function keyboardEngine_corners() {
//  if (letter_select >= inpText.length) {
//      letter_space( strecherX,  strecherY, strecherShear);
//  } else {

  c1 = inpText.charAt(letter_select);  
  
  setUpVectors();
  
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
    }  else if (c1 == '0') {
      zero();
    } else if (c1 == '#') {
      hash();
    } else if (c1 == '$') {
      cash();
    }  else if (c1 == '=') {
      equal();
    } else if (c1 == '+') {
      plus();
    } else if (c1 == '*') {
      asterisk();
    }
/*
    else if (c1 == '\"') {
      double_quote();
    } else if (c1 == '\'') {
      single_quote();
    } else if (c1 == '%') {
      percentage();
    } else if (c1 == '8') {
      eight();
    } else if (c1 == '9') {
      nine();
    }else if (c1 == '@') {
      at();
    }
*/
}

/////////////////////////////////////////////////// LETTERS


function setUpVectors(){
  Lhalf = p5.Vector.lerp(TL,BL,0.5);
  Rhalf = p5.Vector.lerp(TR,BR,0.5);
  Thalf = p5.Vector.lerp(TL,TR,0.5);  
  Bhalf = p5.Vector.lerp(BL,BR,0.5); 
  Lthird = p5.Vector.lerp(TL,BL,1/3);
  Rthird = p5.Vector.lerp(TR,BR,1/3); 
  Tthird = p5.Vector.lerp(TL,TR,1/3);  
  Bthird = p5.Vector.lerp(BL,BR,1/3);  
  L2third = p5.Vector.lerp(TL,BL,2/3);
  R2third = p5.Vector.lerp(TR,BR,2/3); 
  T2third = p5.Vector.lerp(TL,TR,2/3);  
  B2third = p5.Vector.lerp(BL,BR,2/3);
  Lquad = p5.Vector.lerp(TL,BL,1/4);
  Rquad = p5.Vector.lerp(TR,BR,1/4); 
  Tquad = p5.Vector.lerp(TL,TR,1/4);  
  Bquad = p5.Vector.lerp(BL,BR,1/4);
  L3quad = p5.Vector.lerp(TL,BL,3/4);
  R3quad = p5.Vector.lerp(TR,BR,3/4); 
  T3quad = p5.Vector.lerp(TL,TR,3/4);  
  B3quad = p5.Vector.lerp(BL,BR,3/4);
  L0506 = p5.Vector.lerp(TL,BL,5/6);
  R0506 = p5.Vector.lerp(TR,BR,5/6);
  T0506 = p5.Vector.lerp(TL,TR,5/6);
  B0506 = p5.Vector.lerp(BL,BR,5/6);
  L0106 = p5.Vector.lerp(TL,BL,1/6);
  R0106 = p5.Vector.lerp(TR,BR,1/6);
  T0106 = p5.Vector.lerp(TL,TR,1/6);
  B0106 = p5.Vector.lerp(BL,BR,1/6);

  L0108 = p5.Vector.lerp(TL,BL,1/8);
  R0108 = p5.Vector.lerp(TR,BR,1/8);
  T0108 = p5.Vector.lerp(TL,TR,1/8);
  B0108 = p5.Vector.lerp(BL,BR,1/8);
  L0708 = p5.Vector.lerp(TL,BL,7/8);
  R0708 = p5.Vector.lerp(TR,BR,7/8);
  T0708 = p5.Vector.lerp(TL,TR,7/8);
  B0708 = p5.Vector.lerp(BL,BR,7/8);

  L1528 = p5.Vector.lerp(TL,BL,15/28);

  
}

function letter_A () {
  p.beginShape();
	p.vertex(BL.x,BL.y,BL.z);
  	p.vertex(BL.x,BL.y-SA,BL.z);
  
  	p.vertex(Thalf.x-SA/2,Thalf.y,Thalf.z);
  	p.vertex(Thalf.x+SA/2,Thalf.y,Thalf.z);

  	p.vertex(BR.x,BR.y-SA,BR.z);
  	p.vertex(BR.x,BR.y-SA,BR.z);
  p.endShape();

  Rleg = p5.Vector.lerp(Thalf,BL,2/3);
  Lleg = p5.Vector.lerp(Thalf,BR,2/3);
  
  p.line(Rleg.x,Rleg.y,Rleg.z,  Lleg.x,Lleg.y,Lleg.z);
  
}

function letter_B () {
  var T2628 = p5.Vector.lerp(TL,TR,26/28);
  var B2628 = p5.Vector.lerp(BL,BR,26/28);
  var x2628y0228 = p5.Vector.lerp(T2628,B2628,2/28);  
  var x2628y0628 = p5.Vector.lerp(T2628,B2628,6/28);  
  var x2628y0728 = p5.Vector.lerp(T2628,B2628,7/28);  
  var x2628y1128 = p5.Vector.lerp(T2628,B2628,11/28);
  var T2228 = p5.Vector.lerp(TL,TR,22/28);
  var B2228 = p5.Vector.lerp(BL,BR,22/28);
  var x2228y1328 = p5.Vector.lerp(T2228,B2228,13/28);
  var x0102y1328 = p5.Vector.lerp(Thalf,Bhalf,13/28);
  var L1328 = p5.Vector.lerp(TL,BL,13/28);
  var x0304y1328 = p5.Vector.lerp(T3quad,B3quad,13/28);
  var R1528 = p5.Vector.lerp(TR,BR,15/28);
  var R2028 = p5.Vector.lerp(TR,BR,20/28);
  
	p.beginShape();
  	p.vertex(TL.x,TL.y,TL.z);
  	p.vertex(Thalf.x,Thalf.y,Thalf.z);
  	p.bezierVertex(T3quad.x,T3quad.y,T3quad.z,  x2628y0228.x,x2628y0228.y,x2628y0228.z,  x2628y0628.x,x2628y0628.y,x2628y0628.z);
  	p.vertex(x2628y0728.x,x2628y0728.y,x2628y0728.z);
  	p.bezierVertex(x2628y1128.x,x2628y1128.y,x2628y1128.z,  x2228y1328.x,x2228y1328.y,x2228y1328.z,   x0102y1328.x,x0102y1328.y,x0102y1328.z);
    p.vertex(L1328.x,L1328.y,L1328.z);
  p.endShape();
  p.beginShape();
    p.vertex(L1328.x,L1328.y,L1328.z);
    p.vertex(x0102y1328.x,x0102y1328.y,x0102y1328.z);
    p.bezierVertex(x0304y1328.x,x0304y1328.y,x0304y1328.z,  R1528.x,R1528.y,R1528.z,	R2028.x,R2028.y,R2028.z);
  	p.vertex(R3quad.x,R3quad.y,R3quad.z);
  	p.bezierVertex(R0708.x,R0708.y,R0708.z,	B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.vertex(BL.x,BL.y,BL.z);
  	p.vertex(TL.x,TL.y,TL.z);
  p.endShape();
}

function letter_C () { 
  p.beginShape();
    p.vertex(R3quad.x,R3quad.y,R3quad.z);
	p.bezierVertex(R0708.x,R0708.y,R0708.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(Lthird.x,Lthird.y,Lthird.z);
  	p.bezierVertex(L0106.x,L0106.y,L0106.z,  T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
  p.endShape();
}

function letter_D () {
  p.beginShape();
    p.vertex(TL.x,TL.y,TL.z);
    p.vertex(Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0106.x,R0106.y,R0106.z,  Rthird.x,Rthird.y,Rthird.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
    p.vertex(BL.x,BL.y,BL.z);
    p.vertex(TL.x,TL.y,TL.z);
  p.endShape();
}

function letter_E () {
  var x0708y1528 = p5.Vector.lerp(T0708,B0708,15/28);
  
  p.line(TR.x,TR.y,TR.z,	TL.x,TL.y,TL.z);
  p.line(TL.x,TL.y,TL.z,	BL.x,BL.y,BL.z);
  p.line(BL.x,BL.y,BL.z,  BR.x,BR.y,BR.z);
  p.line(L1528.x,L1528.y,L1528.z,	x0708y1528.x,x0708y1528.y,x0708y1528.z);
}

function letter_F () {
  var x0708y1528 = p5.Vector.lerp(T0708,B0708,15/28);
  
  p.line(TR.x,TR.y,TR.z,	TL.x,TL.y,TL.z);
  p.line(TL.x,TL.y,TL.z,	BL.x,BL.y,BL.z);
  p.line(L1528.x,L1528.y,L1528.z,	x0708y1528.x,x0708y1528.y,x0708y1528.z);
}

function letter_G () {
  var R1528 = p5.Vector.lerp(TR,BR,15/28);
  var T0508 = p5.Vector.lerp(TL,TR,5/8);
  var B0508 = p5.Vector.lerp(BL,BR,5/8);
  var x0508y1528 = p5.Vector.lerp(T0508,B0508,15/28);
  
  p.beginShape();
    p.vertex(R3quad.x,R3quad.y,R3quad.z);
	p.bezierVertex(R0708.x,R0708.y,R0708.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(Lthird.x,Lthird.y,Lthird.z);
  	p.bezierVertex(L0106.x,L0106.y,L0106.z,  T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
  p.endShape();
  
  p.line(BR.x,BR.y,BR.z,  R1528.x,R1528.y,R1528.z);
  p.line(x0508y1528.x,x0508y1528.y,x0508y1528.z,  R1528.x,R1528.y,R1528.z);
}

function letter_H () {
  p.line(TL.x,TL.y,TL.z,	BL.x,BL.y,BL.z);
  p.line(TR.x,TR.y,TR.z,  BR.x,BR.y,BR.z);
  p.line(Lhalf.x,Lhalf.y,Lhalf.z,  Rhalf.x,Rhalf.y,Rhalf.z);
}

function letter_I () {
  p.line(TL.x,TL.y,TL.z,	TR.x,TR.y,TR.z);
  p.line(BR.x,BR.y,BR.z,  BL.x,BL.y,BL.z);
  p.line(Thalf.x,Thalf.y,Thalf.z,  Bhalf.x,Bhalf.y,Bhalf.z); 
}

function letter_J () {
  p.beginShape();
  	p.vertex(Thalf.x,Thalf.y,Thalf.z);
  	p.vertex(TR.x,TR.y,TR.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
  p.endShape();
}

function letter_K () {  
  var T2728 = p5.Vector.lerp(TL,TR,27/28);
  
  p.line(TL.x,TL.y,TL.z, BL.x,BL.y,BL.z);
  p.beginShape();
    p.vertex(L2third.x,L2third.y,L2third.z);
    p.vertex(T2728.x,T2728.y-SA,T2728.z);
    p.vertex(T2728.x,T2728.y,T2728.z);
  p.endShape();
  
  var kIntersect = p5.Vector.lerp(L2third,T2728,13/28);

  p.beginShape();
	p.vertex(kIntersect.x,kIntersect.y,kIntersect.z);
    p.vertex(BR.x,BR.y-SA,BR.z);
    p.vertex(BR.x,BR.y,BR.z);
  p.endShape();
}

function letter_L () {
  p.line(TL.x,TL.y,TL.z,  BL.x,BL.y,BL.z);
  p.line(BL.x,BL.y,BL.z,  BR.x,BR.y,BR.z);
}

function letter_M () {
  var xHalfy2228 = p5.Vector.lerp(Thalf,Bhalf,22/28);
  
  p.beginShape();
  	p.vertex(BL.x,BL.y,BL.z);
    p.vertex(TL.x,TL.y,TL.z);
  
  	p.vertex(xHalfy2228.x,xHalfy2228.y,xHalfy2228.z);
    
  	p.vertex(TR.x,TR.y,TR.z);
  	p.vertex(BR.x,BR.y,BR.z);
  p.endShape();
}

function letter_N () {
  p.beginShape();
  	p.vertex(BL.x,BL.y,BL.z);
	p.vertex(TL.x,TL.y,TL.z);
  	p.vertex(BR.x,BR.y,BR.z);
  	p.vertex(TR.x,TR.y,TR.z);
  p.endShape();
}

function letter_O () {
  p.beginShape();
    p.vertex(Rthird.x,Rthird.y,Rthird.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(Lthird.x,Lthird.y,Lthird.z);
  	p.bezierVertex(L0106.x,L0106.y,L0106.z,  T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0106.x,R0106.y,R0106.z,  Rthird.x,Rthird.y,Rthird.z);
  p.endShape();
}

function letter_P () {
  var R0828 = p5.Vector.lerp(TR,BR,8/28);
  var R0928 = p5.Vector.lerp(TR,BR,9/28);
  var x0506y1528 = p5.Vector.lerp(T0506,B0506,15/28);
  var xHalfy1528 = p5.Vector.lerp(Thalf,Bhalf,15/28);
  
  p.beginShape();
  	p.vertex(BL.x,BL.y,BL.z);
  	p.vertex(TL.x,TL.y,TL.z);
    p.vertex(Thalf.x,Thalf.y,Thalf.z);
  	p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
    p.vertex(R0828.x,R0828.y,R0828.z);
    p.bezierVertex(R0928.x,R0928.y,R0928.z,  x0506y1528.x,x0506y1528.y,x0506y1528.z,  xHalfy1528.x,xHalfy1528.y,xHalfy1528.z);
  	p.vertex(L1528.x,L1528.y,L1528.z);
  p.endShape();
}

function letter_Q () {
  var xHalfy1528 = p5.Vector.lerp(Thalf,Bhalf,15/28);
  
  p.beginShape();
    p.vertex(Rthird.x,Rthird.y,Rthird.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(Lthird.x,Lthird.y,Lthird.z);
  	p.bezierVertex(L0106.x,L0106.y,L0106.z,  T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0106.x,R0106.y,R0106.z,  Rthird.x,Rthird.y,Rthird.z);
  p.endShape();

  p.beginShape();
  	p.vertex(xHalfy1528.x,xHalfy1528.y,xHalfy1528.z);
//	p.vertex(typeX,typeY-SA);
  	p.vertex(BR.x,BR.y,BR.z);
  p.endShape();
}

function letter_R () {
  var R0828 = p5.Vector.lerp(TR,BR,8/28);
  var R0928 = p5.Vector.lerp(TR,BR,9/28);
  var x0506y1528 = p5.Vector.lerp(T0506,B0506,15/28);
  var xHalfy1528 = p5.Vector.lerp(Thalf,Bhalf,15/28);
  
  p.beginShape();
  	p.vertex(BL.x,BL.y,BL.z);
  	p.vertex(TL.x,TL.y,TL.z);
    p.vertex(Thalf.x,Thalf.y,Thalf.z);
  	p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
    p.vertex(R0828.x,R0828.y,R0828.z);
    p.bezierVertex(R0928.x,R0928.y,R0928.z,  x0506y1528.x,x0506y1528.y,x0506y1528.z,  xHalfy1528.x,xHalfy1528.y,xHalfy1528.z);
  	p.vertex(L1528.x,L1528.y,L1528.z);
  p.endShape();
    
  p.beginShape();
  	p.vertex(xHalfy1528.x,xHalfy1528.y,xHalfy1528.z);
  	p.vertex(BR.x,BR.y,BR.z);
  p.endShape();
}

function letter_S () {
  var T2728 = p5.Vector.lerp(TL,TR,27/28);
  var B2728 = p5.Vector.lerp(BL,BR,27/28);
  var x2728yQuad = p5.Vector.lerp(T2728,B2728,1/4);
  var x2728y1356 = p5.Vector.lerp(T2728,B2728,13/56);
  var x2728y0428 = p5.Vector.lerp(T2728,B2728,4/28);
  var T0128 = p5.Vector.lerp(TL,TR,1/28);
  var B0128 = p5.Vector.lerp(BL,BR,1/28);
  var x0128y0228 = p5.Vector.lerp(T0128,B0128,2/28);
  var x0128y1156 = p5.Vector.lerp(T0128,B0128,11/56);
  var x0128y0628 = p5.Vector.lerp(T0128,B0128,6/28);
  var x0128y1756 = p5.Vector.lerp(T0128,B0128,17/56);
  var x0108y2156 = p5.Vector.lerp(T0108,B0108,21/56);
  var xThirdy1228 = p5.Vector.lerp(Tthird,Bthird,12/28);
  var T2028 = p5.Vector.lerp(TL,TR,20/28);
  var B2028 = p5.Vector.lerp(BL,BR,20/28);
  var x2028y2956 = p5.Vector.lerp(T2028,B2028,29/56);
  var T2628 = p5.Vector.lerp(TL,TR,26/28);
  var B2628 = p5.Vector.lerp(BL,BR,26/28);
  var x2628y1628 = p5.Vector.lerp(T2628,B2628,16/28);
  var R1828 = p5.Vector.lerp(TR,BR,18/28);
  var R4156 = p5.Vector.lerp(TR,BR,41/56);
  var R2628 = p5.Vector.lerp(TR,BR,26/28);
  var B2228 = p5.Vector.lerp(BL,BR,22/28);
  var L5356 = p5.Vector.lerp(TL,BL,53/56);
  var L4156 = p5.Vector.lerp(TL,BL,41/56);
  
  p.beginShape();
    p.vertex(x2728yQuad.x,x2728yQuad.y,x2728yQuad.z);
  	p.vertex(x2728y1356.x,x2728y1356.y,x2728y1356.z);
  	p.bezierVertex(x2728y0428.x,x2728y0428.y,x2728y0428.z,  T0708.x,T0708.y,T0708.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(Tquad.x,Tquad.y,Tquad.z,  x0128y0228.x,x0128y0228.y,x0128y0228.z,  x0128y1156.x,x0128y1156.y,x0128y1156.z);
    p.vertex(x0128y0628.x,x0128y0628.y,x0128y0628.z);
  	p.bezierVertex(x0128y1756.x,x0128y1756.y,x0128y1756.z,  x0108y2156.x,x0108y2156.y,x0108y2156.z,  xThirdy1228.x,xThirdy1228.y,xThirdy1228.z);
  	p.vertex(x2028y2956.x,x2028y2956.y,x2028y2956.z);
  	p.bezierVertex(x2628y1628.x,x2628y1628.y,x2628y1628.z,  R1828.x,R1828.y,R1828.z,	R4156.x,R4156.y,R4156.z);
    p.vertex(R3quad.x,R3quad.y,R3quad.z);
  	p.bezierVertex(R2628.x,R2628.y,R2628.z,  B2228.x,B2228.y,B2228.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(Bquad.x,Bquad.y,Bquad.z,  L5356.x,L5356.y,L5356.z,  L3quad.x,L3quad.y,L3quad.z);
  	p.vertex(L4156.x,L4156.y,L4156.z);
  p.endShape();
}

function letter_T () {
  p.line(TL.x,TL.y,TL.z,	TR.x,TR.y,TR.z);
  p.line(Thalf.x,Thalf.y,Thalf.z,	Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_U () {
  p.beginShape();
	p.vertex(TR.x,TR.y,TR.z);
  	p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(TL.x,TL.y,TL.z);
  p.endShape();
}

function letter_V () {
	p.beginShape();
    p.vertex(TL.x,TL.y,TL.z);
//    p.vertex(0,SA);
  
//  	p.vertex(typeX/2-SA/2,typeY);
//  	p.vertex(typeX/2+SA/2,typeY);
    p.vertex(Bhalf.x,Bhalf.y,Bhalf.z);
  
//  	p.vertex(typeX,SA);
    p.vertex(TR.x,TR.y,TR.z);
  p.endShape();
}

function letter_W () {
  var x0102y0828 = p5.Vector.lerp(Thalf,Bhalf,8/28);
  
	p.beginShape();
      p.vertex(TL.x,TL.y,TL.z);
//    p.vertex(0,SA);

//    p.vertex(typeX/4-SA/2,typeY);  
//    p.vertex(typeX/4+SA/2,typeY);
      p.vertex(Bquad.x,Bquad.y,Bquad.z);
  
//    p.vertex(typeX/2-SA/2,8*typeY/28);
//    p.vertex(typeX/2+SA/2,8*typeY/28);
      p.vertex(x0102y0828.x,x0102y0828.y,x0102y0828.z);
  
//    p.vertex(3*typeX/4-SA/2,typeY);
//    p.vertex(3*typeX/4+SA/2,typeY);
      p.vertex(B3quad.x,B3quad.y,B3quad.z);
    
//  	p.vertex(typeX,SA);
  	p.vertex(TR.x,TR.y,TR.z);
  p.endShape();
}

function letter_X () {
  var xCenter = p5.Vector.lerp(Thalf,Bhalf,1/2);
  
  p.beginShape();
  	p.vertex(TL.x,TL.y,TL.z);
    p.vertex(xCenter.x,xCenter.y,xCenter.z);
//    p.vertex(0,SA);
//    p.vertex(typeX,typeY-SA);
    p.vertex(BR.x,BR.y,BR.z);
  p.endShape();
  p.beginShape();
    p.vertex(TR.x,TR.y,TR.z);
    p.vertex(xCenter.x,xCenter.y,xCenter.z);
//    p.vertex(typeX,SA);
//    p.vertex(0,typeY-SA);
    p.vertex(BL.x,BL.y,BL.z);
  p.endShape();
}

function letter_Y () {
  var x0102y2third = p5.Vector.lerp(Thalf,Bhalf,2/3);
  
  p.beginShape();
  	p.vertex(TL.x,TL.y,TL.z);
//  	p.vertex(0,SA);
    p.vertex(x0102y2third.x,x0102y2third.y,x0102y2third.z);
//    p.vertex(typeX,SA);
    p.vertex(TR.x,TR.y,TR.z);
  p.endShape();
  
  p.line(x0102y2third.x,x0102y2third.y,x0102y2third.z,  Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_Z () {
  p.line(TL.x,TL.y,TL.z,  TR.x,TR.y,TR.z);
  p.line(BL.x,BL.y,BL.z,  BR.x,BR.y,BR.z);
  
  p.beginShape();
  	p.vertex(TR.x,TR.y,TR.z);
//    p.vertex(typeX,SA);
//    p.vertex(0,typeY-SA);
    p.vertex(BL.x,BL.y,BL.z);
  p.endShape();
}

function one () {
  var x0108y0628 = p5.Vector.lerp(T0108,B0108,6/28);
  
  p.beginShape();
  	p.vertex(x0108y0628.x,x0108y0628.y,x0108y0628.z);
  	p.vertex(Thalf.x,Thalf.y,Thalf.z);
  	p.vertex(Bhalf.x,Bhalf.y,Bhalf.z);
  p.endShape();
  
  p.line(BL.x,BL.y,BL.z, BR.x,BR.y,BR.z);
}

function two () {
  var R0508 = p5.Vector.lerp(TR,BR,5/8)
  
  p.beginShape();
    p.vertex(Lquad.x,Lquad.y,Lquad.z);
	p.bezierVertex(L0108.x,L0108.y,L0108.z,	T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
  	p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
    p.bezierVertex(R0508.x,R0508.y,R0508.z,  L2third.x,L2third.y,L2third.z,  BL.x,BL.y,BL.z);
  	p.vertex(BR.x,BR.y,BR.z);
  p.endShape();

}

function three () {
  var R1028 = p5.Vector.lerp(TR,BR,10/28);
  var L1028 = p5.Vector.lerp(TL,BL,10/28);
  var x1228y1028 = p5.Vector.lerp(L1028,R1028,12/28);
  var x2428y1028 = p5.Vector.lerp(L1028,R1028,24/28);
  var R1528 = p5.Vector.lerp(TR,BR,15/28);
  var R1928 = p5.Vector.lerp(TR,BR,19/28);
  var R2428 = p5.Vector.lerp(TR,BR,24/28);
  var B2428 = p5.Vector.lerp(BL,BR,24/28);
  var B0428 = p5.Vector.lerp(BL,BR,4/28); 
  var L2428 = p5.Vector.lerp(TL,BL,24/28); 
  
  p.beginShape();
  	p.vertex(TL.x,TL.y,TL.z);
	p.vertex(TR.x,TR.y,TR.z);
    p.vertex(x1228y1028.x,x1228y1028.y,x1228y1028.z);
    p.bezierVertex(x2428y1028.x,x2428y1028.y,x2428y1028.z,  R1528.x,R1528.y,R1528.z,  R1928.x,R1928.y,R1928.z);
  	p.vertex(R3quad.x,R3quad.y,R3quad.z);
    p.bezierVertex(R2428.x,R2428.y,R2428.z,  B2428.x,B2428.y,B2428.z,  Bhalf.x,Bhalf.y,Bhalf.z);
    p.bezierVertex(B0428.x,B0428.y,B0428.z,  L2428.x,L2428.y,L2428.z,	L3quad.x,L3quad.y,L3quad.z);
  p.endShape();
}

function four () {
  var T2128 = p5.Vector.lerp(TL,TR,21/28);
  var B2128 = p5.Vector.lerp(BL,BR,21/28);
  
  p.beginShape();
    p.vertex(Tthird.x,Tthird.y,Tthird.z);
  	p.vertex(L2third.x,L2third.y,L2third.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
  p.endShape();
    p.line(T2128.x,T2128.y,T2128.z,  B2128.x,B2128.y,B2128.z);
}

function five () {
  var T0228 = p5.Vector.lerp(TL,TR,2/28);
  var B0228 = p5.Vector.lerp(BL,BR,2/28);
  var x0228y1128 = p5.Vector.lerp(T0228,B0228,11/28);
  var xhalfy1128 = p5.Vector.lerp(Thalf,Bhalf,11/28);
  var T2428 = p5.Vector.lerp(TL,TR,24/28);
  var B2428 = p5.Vector.lerp(BL,BR,24/28);
  var x2428y1128 = p5.Vector.lerp(T2428,B2428,11/28);
  var R1528 = p5.Vector.lerp(TR,BR,15/28);
  var R1928 = p5.Vector.lerp(TR,BR,19/28);
  var R2428 = p5.Vector.lerp(TR,BR,24/28);
  var B0428 = p5.Vector.lerp(BL,BR,4/28);  
  var L2428 = p5.Vector.lerp(TL,BL,24/28);
  
  p.beginShape();
  	p.vertex(T0708.x,T0708.y,T0708.z);
  	p.vertex(T0228.x,T0228.y,T0228.z);
  	p.vertex(x0228y1128.x,x0228y1128.y,x0228y1128.z);
    p.vertex(xhalfy1128.x,xhalfy1128.y,xhalfy1128.z);
    p.bezierVertex(x2428y1128.x,x2428y1128.y,x2428y1128.z,  R1528.x,R1528.y,R1528.z,  R1928.x,R1928.y,R1928.z);
  	p.vertex(R3quad.x,R3quad.y,R3quad.z);
    p.bezierVertex(R2428.x,R2428.y,R2428.z,  B2428.x,B2428.y,B2428.z,  Bhalf.x,Bhalf.y,Bhalf.z);
    p.bezierVertex(B0428.x,B0428.y,B0428.z,  L2428.x,L2428.y,L2428.z,	L3quad.x,L3quad.y,L3quad.z);
  p.endShape();
}

function six () {
  var xhalfy1228 = p5.Vector.lerp(Thalf,Bhalf,12/28);
  var T2428 = p5.Vector.lerp(TL,TR,24/28);
  var B2428 = p5.Vector.lerp(BL,BR,24/28);
  var x2428y1228 = p5.Vector.lerp(T2428,B2428,12/28);
  var R1628 = p5.Vector.lerp(TR,BR,16/28);
  var R2028 = p5.Vector.lerp(TR,BR,20/28);
  var R2428 = p5.Vector.lerp(TR,BR,24/28);
  var B0428 = p5.Vector.lerp(BL,BR,4/28);
  var L2428 = p5.Vector.lerp(TL,BL,24/28);
  var T2028 = p5.Vector.lerp(TL,TR,20/28);
  var L1628 = p5.Vector.lerp(TL,BL,16/28);
  var L1228 = p5.Vector.lerp(TL,BL,12/28);
  var L2028 = p5.Vector.lerp(TL,BL,20/28);
  var R1228 = p5.Vector.lerp(TR,BR,12/28);
  var x0428y1228 = p5.Vector.lerp(L1228,R1228,4/28);
  
  p.beginShape();
    p.vertex(Thalf.x,Thalf.y,Thalf.z);
    quadraticVertex(Lquad.x,Lquad.y,Lquad.z,  L3quad.x,L3quad.y,L3quad.z);
  p.endShape();
	p.beginShape();
    p.vertex(xhalfy1228.x,xhalfy1228.y,xhalfy1228.z);
    p.bezierVertex(x2428y1228.x,x2428y1228.y,x2428y1228.z,  R1628.x,R1628.y,R1628.z,  R2028.x,R2028.y,R2028.z);
  	p.vertex(R3quad.x,R3quad.y,R3quad.z);
    p.bezierVertex(R2428.x,R2428.y,R2428.z,  B2428.x,B2428.y,B2428.z,  Bhalf.x,Bhalf.y,Bhalf.z);
    p.bezierVertex(B0428.x,B0428.y,B0428.z,  L2428.x,L2428.y,L2428.z,	L3quad.x,L3quad.y,L3quad.z);
    p.vertex(L2028.x,L2028.y,L2028.z);
    p.bezierVertex(L1628.x,L1628.y,L1628.z,  x0428y1228.x,x0428y1228.y,x0428y1228.z,  xhalfy1228.x,xhalfy1228.y,xhalfy1228.z);
  p.endShape();
}

function seven () {
  p.beginShape();
  	p.vertex(TL.x,TL.y,TL.z);
    p.vertex(TR.x,TR.y,TR.z);
  	p.vertex(Bhalf.x,Bhalf.y,Bhalf.z);
  p.endShape();
}

function zero () {
  p.beginShape();
    p.vertex(Rthird.x,Rthird.y,Rthird.z);
    p.vertex(R2third.x,R2third.y,R2third.z);
	p.bezierVertex(R0506.x,R0506.y,R0506.z,  B0506.x,B0506.y,B0506.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(B0106.x,B0106.y,B0106.z,  L0506.x,L0506.y,L0506.z,  L2third.x,L2third.y,L2third.z);
    p.vertex(Lthird.x,Lthird.y,Lthird.z);
  	p.bezierVertex(L0106.x,L0106.y,L0106.z,  T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0106.x,R0106.y,R0106.z,  Rthird.x,Rthird.y,Rthird.z);
  p.endShape();

  p.line(TR.x,TR.y,TR.z,  BL.x,BL.y,BL.z);
}

function letter_underscore () {
  p.line(BR.x,BR.y,BR.z, BL.x,BL.y,BL.z);
}

function letter_dash () {
  p.line(Lhalf.x,Lhalf.y,Lhalf.z, Rhalf.x,Rhalf.y,Rhalf.z);
}

function letter_question () {
  var xhalfy1228 = p5.Vector.lerp(Thalf,Bhalf,12/28);
  var xhalfy3quad = p5.Vector.lerp(Thalf,Bhalf,3/4);
  var xhalfy0708 = p5.Vector.lerp(Thalf,Bhalf,7/8);
  
  p.beginShape();
    p.vertex(Lquad.x,Lquad.y,Lquad.z);
	p.bezierVertex(L0108.x,L0108.y,L0108.z,	T0106.x,T0106.y,T0106.z,  Thalf.x,Thalf.y,Thalf.z);
  	p.bezierVertex(T0506.x,T0506.y,T0506.z,  R0108.x,R0108.y,R0108.z,  Rquad.x,Rquad.y,Rquad.z);
	p.bezierVertex(Rhalf.x,Rhalf.y,Rhalf.z,	xhalfy1228.x,xhalfy1228.y,xhalfy1228.z,  xhalfy3quad.x,xhalfy3quad.y,xhalfy3quad.z);
  p.endShape();

  p.line(xhalfy0708.x,xhalfy0708.y,xhalfy0708.z, Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_period () {
  var xHalfy0708 = p5.Vector.lerp(Thalf,Bhalf,7/8);
  
  p.line(xHalfy0708.x,xHalfy0708.y,xHalfy0708.z, Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_colon () {
  var xhalfy0308 = p5.Vector.lerp(Thalf,Bhalf,3/8);
  var xhalfy0708 = p5.Vector.lerp(Thalf,Bhalf,7/8);
  
  p.line(xhalfy0308.x,xhalfy0308.y,xhalfy0308.z, center.x,center.y,center.z);
  p.line(xhalfy0708.x,xhalfy0708.y,xhalfy0708.z,  Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_semicolon () {
  var xhalfy0308 = p5.Vector.lerp(Thalf,Bhalf,3/8);
  var xhalfy0708 = p5.Vector.lerp(Thalf,Bhalf,7/8);
  
  p.line(xhalfy0308.x,xhalfy0308.y,xhalfy0308.z, center.x,center.y,center.z);
  p.line(xhalfy0708.x,xhalfy0708.y,xhalfy0708.z, Bquad.x,Bquad.y,Bquad.z);
}

function letter_comma () {
  p.line(typeX/2, 7*typeY/8, typeX/2 - typeX/4, typeY);
}

function letter_exclaim () {
  var xHalfy0304 = p5.Vector.lerp(Thalf,Bhalf, 3/4);
  var xHalfy0708 = p5.Vector.lerp(Thalf,Bhalf, 7/8);
  
  p.line(Thalf.x,Thalf.y,Thalf.z, xHalfy0304.x,xHalfy0304.y,xHalfy0304.z);

  p.line(xHalfy0708.x,xHalfy0708.y,xHalfy0708.z,  Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_slash () {
  p.line(BL.x,BL.y,BL.z, TR.x,TR.y,TR.z);
}

function hash () {
  var x0228ythird = p5.Vector.lerp(Lthird,Rthird,2/28);
  
  p.beginShape();
  	p.vertex(B0108.x,B0108.y,B0108.z);
  	p.vertex(Thalf.x,Thalf.y,Thalf.z);
  p.endShape();
  p.beginShape();
  	p.vertex(Bhalf.x,Bhalf.y,Bhalf.z);
  	p.vertex(T0708.x,T0708.y,T0708.z);
  p.endShape();
  
  p.line(x0228ythird.x,x0228ythird.y,x0228ythird.z,	Rthird.x,Rthird.y,Rthird.z);
  p.line(L2third.x,L2third.y,L2third.z,	x2628y2third.x,x2628y2third.y,x2628y2third.z);
}

function cash() {
  var T2728 = p5.Vector.lerp(TL,TR,27/28);
  var B2728 = p5.Vector.lerp(BL,BR,27/28);
  var x2728yQuad = p5.Vector.lerp(T2728,B2728,1/4);
  var x2728y1356 = p5.Vector.lerp(T2728,B2728,13/56);
  var x2728y0428 = p5.Vector.lerp(T2728,B2728,4/28);
  var T0128 = p5.Vector.lerp(TL,TR,1/28);
  var B0128 = p5.Vector.lerp(BL,BR,1/28);
  var x0128y0228 = p5.Vector.lerp(T0128,B0128,2/28);
  var x0128y1156 = p5.Vector.lerp(T0128,B0128,11/56);
  var x0128y0628 = p5.Vector.lerp(T0128,B0128,6/28);
  var x0128y1756 = p5.Vector.lerp(T0128,B0128,17/56);
  var x0108y2156 = p5.Vector.lerp(T0108,B0108,21/56);
  var xThirdy1228 = p5.Vector.lerp(Tthird,Bthird,12/28);
  var T2028 = p5.Vector.lerp(TL,TR,20/28);
  var B2028 = p5.Vector.lerp(BL,BR,20/28);
  var x2028y2956 = p5.Vector.lerp(T2028,B2028,29/56);
  var T2628 = p5.Vector.lerp(TL,TR,26/28);
  var B2628 = p5.Vector.lerp(BL,BR,26/28);
  var x2628y1628 = p5.Vector.lerp(T2628,B2628,16/28);
  var R1828 = p5.Vector.lerp(TR,BR,18/28);
  var R4156 = p5.Vector.lerp(TR,BR,41/56);
  var R2628 = p5.Vector.lerp(TR,BR,26/28);
  var B2228 = p5.Vector.lerp(BL,BR,22/28);
  var L5356 = p5.Vector.lerp(TL,BL,53/56);
  var L4156 = p5.Vector.lerp(TL,BL,41/56);
  
  p.beginShape();
    p.vertex(x2728yQuad.x,x2728yQuad.y,x2728yQuad.z);
  	p.vertex(x2728y1356.x,x2728y1356.y,x2728y1356.z);
  	p.bezierVertex(x2728y0428.x,x2728y0428.y,x2728y0428.z,  T0708.x,T0708.y,T0708.z,  Thalf.x,Thalf.y,Thalf.z);
    p.bezierVertex(Tquad.x,Tquad.y,Tquad.z,  x0128y0228.x,x0128y0228.y,x0128y0228.z,  x0128y1156.x,x0128y1156.y,x0128y1156.z);
    p.vertex(x0128y0628.x,x0128y0628.y,x0128y0628.z);
  	p.bezierVertex(x0128y1756.x,x0128y1756.y,x0128y1756.z,  x0108y2156.x,x0108y2156.y,x0108y2156.z,  xThirdy1228.x,xThirdy1228.y,xThirdy1228.z);
  	p.vertex(x2028y2956.x,x2028y2956.y,x2028y2956.z);
  	p.bezierVertex(x2628y1628.x,x2628y1628.y,x2628y1628.z,  R1828.x,R1828.y,R1828.z,	R4156.x,R4156.y,R4156.z);
    p.vertex(R3quad.x,R3quad.y,R3quad.z);
  	p.bezierVertex(R2628.x,R2628.y,R2628.z,  B2228.x,B2228.y,B2228.z,  Bhalf.x,Bhalf.y,Bhalf.z);
  	p.bezierVertex(Bquad.x,Bquad.y,Bquad.z,  L5356.x,L5356.y,L5356.z,  L3quad.x,L3quad.y,L3quad.z);
  	p.vertex(L4156.x,L4156.y,L4156.z);
  p.endShape();
  
  p.line(Thalf.x,Thalf.y,Thalf.z,  Bhalf.x,Bhalf.y,Bhalf.z);
}

function letter_amp () {
  var x0108y1128 = p5.Vector.lerp(T0108,B0108,11/28);
  var x0108y0628 = p5.Vector.lerp(T0108,B0108,6/28);
  var x0108y0108 = p5.Vector.lerp(L0108,R0108,1/8);
  var T1228 = p5.Vector.lerp(TL,TR,12/28);
  var T0508 = p5.Vector.lerp(TL,TR,5/8);
  var x2thirdy0108 = p5.Vector.lerp(T2third,B2third,1/8);
  var x2thirdy0528 = p5.Vector.lerp(T2third,B2third,5/28);
  var x2thirdy1128 = p5.Vector.lerp(T2third,B2third,11/28);
  var B0308 = p5.Vector.lerp(BL,BR,3/8);
  var B0508 = p5.Vector.lerp(BL,BR,5/8);
  var x3quadyhalf = p5.Vector.lerp(T3quad,B3quad,1/2);
  
    p.beginShape();
      p.vertex(BR.x,BR.y,BR.z);
      quadraticVertex(x0108y1128.x,x0108y1128.y,x0108y1128.z,  x0108y0628.x,x0108y0628.y,x0108y0628.z);
      p.bezierVertex(x0108y0108.x,x0108y0108.y,x0108y0108.z,  Tquad.x,Tquad.y,Tquad.z,  T1228.x,T1228.y,T1228.z);
      p.bezierVertex(T0508.x,T0508.y,T0508.z,  x2thirdy0108.x,x2thirdy0108.y,x2thirdy0108.z,  x2thirdy0528.x,x2thirdy0528.y,x2thirdy0528.z);
      p.bezierVertex(x2thirdy1128.x,x2thirdy1128.y,x2thirdy1128.z,	 Lhalf.x,Lhalf.y,Lhalf.z,		L3quad.x,L3quad.y,L3quad.z);
      p.bezierVertex(BL.x,BL.y,BL.z,  Bquad.x,Bquad.y,Bquad.z,  B0308.x,B0308.y,B0308.z);
      p.bezierVertex(B0508.x,B0508.y,B0508.z,  BR.x,BR.y,BR.z,	Rhalf.x,Rhalf.y,Rhalf.z);
//  	  p.vertex(typeX,typeY/2);
  	  p.vertex(x3quadyhalf.x,x3quadyhalf.y,x3quadyhalf.z);
    p.endShape();
}

function equal() {
  p.line(Lthird.x,Lthird.y,Lthird.z,	Rthird.x,Rthird.y,Rthird.z);
  p.line(L2third.x,L2third.y,L2third.z,	R2third.x,R2third.y,R2third.z);
}

function plus() {
  var xhalfyquad = p5.Vector.lerp(Thalf,Bhalf,1/4);
  var xhalfy3quad = p5.Vector.lerp(Thalf,Bhalf,3/4);
  
  p.line(Lhalf.x,Lhalf.y,Lhalf.z,	Rhalf.x,Rhalf.y,Rhalf.z);
  p.line(xhalfyquad.x,xhalfyquad.y,xhalfyquad.z,	xhalfy3quad.x,xhalfy3quad.y,xhalfy3quad.z);
}

function asterisk() {
  var prong1 = p5.Vector.lerp(center, Thalf, 1/2);
  var prong2 = p5.Vector.lerp(center, Lthird, 1/2);  
  var prong3 = p5.Vector.lerp(center, Rthird, 1/2);
  var prong4 = p5.Vector.lerp(center, BL,1/2);
  var prong5 = p5.Vector.lerp(center, BR,1/2);
  
  p.line(center.x,center.y,center.z,  prong1.x,prong1.y,prong1.z);
  p.line(center.x,center.y,center.z,  prong2.x,prong2.y,prong2.z);
  p.line(center.x,center.y,center.z,  prong3.x,prong3.y,prong3.z);
  p.line(center.x,center.y,center.z,  prong4.x,prong4.y,prong4.z);
  p.line(center.x,center.y,center.z,  prong5.x,prong5.y,prong5.z);
}

function letter_space () {
}

/*
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

V.2 (grit)
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

v.1 (orig)
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

*/




    // --- ORIGINAL SKETCH.JS CODE ---
    // TYPE
var typeX = 20;
var typeY = 50;
var typeStroke = 1.5;
var typePush = 2;
var padding = 0.3;
var TR, TL, BR, BL;
var Rhalf, Lhalf, Thalf, Bhalf, Lthird, Rthird, Tthird, Bthird, L2third, R2third, T2third, B2third;
var Lquad, Rquad, Tquad, Bquad, L3quad, R3quad, T3quad, B3quad;
var L0506,R0506,T0506,B0506,L0106,R0106,T0106,B0106;
var L0108,R0108,T0108,B0108,L0708,R0708,T0708,B0708;
var L1528;

// GRID
var rows = 6;
var xSpace, ySpace;

// WAVE
var zWave = 50;
var yWave = 20;
var xWave = 95;
var offset = 0.3;
var speed = -0.03;
var rowOffset = 0.37;
var slope = 1;

// CAMERA
var xRotCamera = -50, yRotCamera = 65, zRotCamera = 11;
var zoomCamera = -40;

// STRING
var letter_select, inpText = " THIS & THEN ";
var runLength;
var doubleQuoteSwitch = 1;
var singleQuoteSwitch = 1;

// COLOR
var bkgdColor;
var strkColor, ribbonColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 2;
var backSide = true;

// TOGGLES
var inp0check = false;

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
  p.createCanvas(w, h, p.WEBGL);
  p.smooth();
  p.textFont(font);

  reSetting();

  if (typeof signalReady === 'function') signalReady();
}

function reSetting() {
  typeX = 20;
  typeY = 50;
  typeStroke = 1.5;
  rows = 6;
  padding = 0.3;
  typePush = 2;
  zWave = 50;
  xWave = 95;
  yWave = 20;
  offset = 0.3;
  speed = -0.03;
  rowOffset = 0.37;
  slope = 1;

  xRotCamera = -50;
  yRotCamera = 65;
  zRotCamera = 11;
  zoomCamera = -40;

  inp0check = false;
  backSide = true;

  inp1 = p.color('#f5f5f5');
  inp2 = p.color('#000000');
  inp3 = p.color('#ff0000');
  inp4 = p.color('#ffff00');
  inp5 = p.color('#000000');
  inp6 = p.color('#760089');
  bkgdColor = p.color('#ffffff');

  inpNumber = 2;
  inpText = " THIS & THEN ";

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
  if (settings.rows !== undefined) rows = settings.rows;
  if (settings.padding !== undefined) padding = settings.padding;
  if (settings.typePush !== undefined) typePush = settings.typePush;
  if (settings.zWave !== undefined) zWave = settings.zWave;
  if (settings.xWave !== undefined) xWave = settings.xWave;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.offset !== undefined) offset = settings.offset;
  if (settings.speed !== undefined) speed = -settings.speed;
  if (settings.rowOffset !== undefined) rowOffset = settings.rowOffset;
  if (settings.slope !== undefined) slope = settings.slope;

  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;

  if (settings.inp0check !== undefined) inp0check = settings.inp0check;
  if (settings.backSide !== undefined) backSide = settings.backSide;

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
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.rows !== undefined) rows = Number(data.rows);
  if (data.padding !== undefined) padding = Number(data.padding);
  if (data.typePush !== undefined) typePush = Number(data.typePush);
  if (data.zWave !== undefined) zWave = Number(data.zWave);
  if (data.xWave !== undefined) xWave = Number(data.xWave);
  if (data.yWave !== undefined) yWave = Number(data.yWave);
  if (data.offset !== undefined) offset = Number(data.offset);
  if (data.speed !== undefined) speed = -Number(data.speed);
  if (data.rowOffset !== undefined) rowOffset = Number(data.rowOffset);
  if (data.slope !== undefined) slope = Number(data.slope);

  if (data.xRotCamera !== undefined) xRotCamera = Number(data.xRotCamera);
  if (data.yRotCamera !== undefined) yRotCamera = Number(data.yRotCamera);
  if (data.zRotCamera !== undefined) zRotCamera = Number(data.zRotCamera);
  if (data.zoomCamera !== undefined) zoomCamera = Number(data.zoomCamera);

  if (data.inp0check !== undefined) inp0check = Boolean(data.inp0check) || data.inp0check === 'true';
  if (data.backSide !== undefined) backSide = Boolean(data.backSide) || data.backSide === 'true';

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
        rows: rows,
        padding: padding,
        typePush: typePush,
        zWave: zWave,
        xWave: xWave,
        yWave: yWave,
        offset: offset,
        speed: -speed,
        rowOffset: rowOffset,
        slope: slope,
        xRotCamera: xRotCamera,
        yRotCamera: yRotCamera,
        zRotCamera: zRotCamera,
        zoomCamera: zoomCamera,
        inp0check: inp0check,
        backSide: backSide,
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

  SA = typeStroke / 2;
  doubleQuoteSwitch = 1;
  singleQuoteSwitch = 1;

  var mappedXWave = p.map(xWave, 0, 200, 0, 2.5 * typeX);
  var mappedYWave = p.map(yWave, 0, 100, 0, 2 * typeY);

  p.push();
  // p.camera
  p.translate(0, 0, zoomCamera);
  p.rotateX(p.radians(xRotCamera));
  p.rotateY(p.radians(yRotCamera));
  p.rotateZ(p.radians(zRotCamera));

  xSpace = typeX;
  ySpace = typeY;

  p.translate(-typeX * inpText.length / 2, -typeY * rows / 2);

  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < inpText.length; i++) {
      letter_select = i;
      setRibbonColor(j);

      if (inp0check === false) {
        setTextColor(j);
      } else {
        setTextOnlyColor(j);
      }

      var yWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * mappedYWave;
      var yWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * mappedYWave;
      var yWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * mappedYWave;
      var yWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * mappedYWave;

      var xWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * mappedXWave;
      var xWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * mappedXWave;
      var xWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * mappedXWave;
      var xWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * mappedXWave;

      var zWaverTL = sinEngine(i, offset, j, rowOffset, speed, slope) * zWave;
      var zWaverTR = sinEngine((i + 1), offset, j, rowOffset, speed, slope) * zWave;
      var zWaverBR = sinEngine((i + 1), offset, (j + 1), rowOffset, speed, slope) * zWave;
      var zWaverBL = sinEngine(i, offset, (j + 1), rowOffset, speed, slope) * zWave;

      TLbox = createVector(xWaverTL, yWaverTL, zWaverTL);
      TRbox = createVector(typeX + xWaverTR, yWaverTR, zWaverTR);
      BRbox = createVector(typeX + xWaverBR, typeY + yWaverBR, zWaverBR);
      BLbox = createVector(xWaverBL, typeY + yWaverBL, zWaverBL);

      Thalf = p5.Vector.lerp(TLbox, TRbox, 0.5);
      Bhalf = p5.Vector.lerp(BLbox, BRbox, 0.5);
      center = p5.Vector.lerp(Thalf, Bhalf, 0.5);

      TL = p5.Vector.lerp(TLbox, center, padding);
      TR = p5.Vector.lerp(TRbox, center, padding);
      BR = p5.Vector.lerp(BRbox, center, padding);
      BL = p5.Vector.lerp(BLbox, center, padding);

      p.push();
      p.translate(xSpace * i, ySpace * j);
      p.translate(-typeX / 2, -typeY / 2);
      p.noFill(); p.stroke(strkColor); p.strokeWeight(typeStroke);
      keyboardEngine_corners();
      if (inp0check === false) {
        p.translate(0, 0, -typePush);
        p.fill(ribbonColor); p.noStroke();
        p.beginShape();
        p.vertex(TLbox.x, TLbox.y, TLbox.z);
        p.vertex(TRbox.x, TRbox.y, TRbox.z);
        p.vertex(BRbox.x, BRbox.y, BRbox.z);
        p.vertex(BLbox.x, BLbox.y, BLbox.z);
        p.vertex(TLbox.x, TLbox.y, TLbox.z);
        p.endShape();
        if (backSide === true) {
          p.translate(0, 0, -1);
          p.fill(strkColor);
          p.beginShape();
          p.vertex(TLbox.x, TLbox.y, TLbox.z);
          p.vertex(TRbox.x, TRbox.y, TRbox.z);
          p.vertex(BRbox.x, BRbox.y, BRbox.z);
          p.vertex(BLbox.x, BLbox.y, BLbox.z);
          p.vertex(TLbox.x, TLbox.y, TLbox.z);
          p.endShape();
        }
      }
      p.pop();
    }
  }
  p.pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(aCount, aLength, bCount, bLength, speed, slope) {
  var sinus = p.sin((p.frameCount * speed + aCount * aLength + bCount * bLength));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - p.pow(1 - p.abs(sinus), slope));
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
