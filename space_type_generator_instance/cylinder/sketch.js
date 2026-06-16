// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
  "simple": {
    "radius": 185,
    "stackNum": 8,
    "rRotate": -10,
    "rOffset": 0.2,
    "rWaveSpeed": 75,
    "rWave": 41,
    "xRotTweak": 24,
    "yRotTweak": 27,
    "xRotCamera": 20
  },
  "jellyfish": {
    "radius": 200,
    "stackNum": 6,
    "rOffset": 0.15,
    "rWaveCount": 3,
    "rWaveSpeed": 100,
    "rWave": 0,
    "rZaxis": 0,
    "rLong": 80,
    "strecherX": 23,
    "typeX": 13,
    "typeY": 64,
    "typeStroke": 0.5,
    "xRotCamera": 25,
    "color1": "#ffffff",
    "bkgdColor": "#000000"
  },
  "crown": {
    "stackNum": 3,
    "rRotate": -5,
    "rWaveCount": 4,
    "rWaveSpeed": 50,
    "rZaxis": 21,
    "strecherY": 76,
    "typeX": 30,
    "typeStroke": 3,
    "strecherX": -25,
    "zoomCamera": -500
  },
  "complex": {
    "radius": 178,
    "stackNum": 11,
    "rRotate": 0,
    "rOffset": 0.16,
    "rWaveCount": 6,
    "rWaveSpeed": 75,
    "rWave": 10,
    "rLong": 31,
    "typeX": 16,
    "typeY": 40,
    "typeStroke": 2,
    "xRotTweak": 15,
    "yRotTweak": 35,
    "zRotTweak": 0,
    "xRotCamera": -34,
    "yRotCamera": 10,
    "zRotCamera": 25,
    "bkgdColor": "#000000"
  },
  "weave": {
    "radius": 110,
    "stackNum": 7,
    "rRotate": 15,
    "rOffset": 0.62,
    "rWaveCount": 5,
    "rWaveSpeed": 30,
    "rZaxis": 15,
    "typeX": 12,
    "typeY": 19,
    "typeStroke": 1,
    "zRotTweak": 33,
    "xRotCamera": 15,
    "yRotCamera": 0,
    "zRotCamera": 0,
    "zoomCamera": 0,
    "stackHeightAdjust": 30
  },
  "zebra": {
    "radius": 110,
    "stackNum": 7,
    "rRotate": 20,
    "rOffset": 0.3,
    "rWaveCount": 2,
    "rWaveSpeed": 30,
    "rWave": 15,
    "rZaxis": 15,
    "strecherY": 33,
    "typeX": 12,
    "typeY": 19,
    "typeStroke": 1,
    "xRotTweak": 9,
    "yRotTweak": 24,
    "zRotTweak": 22,
    "xRotCamera": 15,
    "yRotCamera": 0,
    "zRotCamera": 0,
    "zoomCamera": 0,
    "stackHeightAdjust": 10,
    "bkgdColor": "#000000"
  },
  "hoops": {
    "radius": 110,
    "stackNum": 7,
    "rRotate": 15,
    "rOffset": 0.62,
    "rWaveCount": 1,
    "rWaveSpeed": 100,
    "rZaxis": 58,
    "typeX": 12,
    "typeY": 19,
    "typeStroke": 1.5,
    "zRotTweak": 28,
    "xRotCamera": -10,
    "stackHeightAdjust": 30,
    "bkgdColor": "#000000"
  },
  "pride": {
    "stackNum": 6,
    "inpNumber": 6,
    "color1": "#e70000",
    "color2": "#ff8c00",
    "color3": "#ffef00",
    "color4": "#00811f",
    "color5": "#0044ff",
    "color6": "#760089",
    "bkgdColor": "#ffffff"
  }
};


// --- INLINED DEPENDENCY: ../lib/keyboardEngine_190103.js ---
function keyboardEngine() {
//  if (letter_select >= inpText.length) {
//      letter_space( strecherX,  strecherY, strecherShear);
//  } else {

     c1 = inpText.charAt(letter_select);            

    if (c1 == 'A') {
      letter_A( strecherX,  strecherY);
    } else if (c1 == 'a') {
      letter_a( strecherX,  strecherY);
    } else if (c1 == 'B') {
      letter_B( strecherX,  strecherY);
    } else if (c1 == 'b') {
      letter_b( strecherX,  strecherY);
    } else if (c1 == 'C') {
      letter_C( strecherX,  strecherY);
    } else if (c1 == 'c') {
      letter_c( strecherX,  strecherY);
    } else if (c1 == 'D') {
      letter_D( strecherX,  strecherY);
    } else if (c1 == 'd') {
      letter_d( strecherX,  strecherY);
    } else if (c1 == 'E') {
      letter_E( strecherX,  strecherY);
    } else if (c1 == 'e') {
      letter_e( strecherX,  strecherY);
    } else if (c1 == 'F') {
      letter_F( strecherX,  strecherY);
    } else if (c1 == 'f') {
      letter_f( strecherX,  strecherY);
    } else if (c1 == 'G') {
      letter_G( strecherX,  strecherY);
    } else if (c1 == 'g') {
      letter_g( strecherX,  strecherY);
    } else if (c1 == 'H') {
      letter_H( strecherX,  strecherY);
    } else if (c1 == 'h') {
      letter_h( strecherX,  strecherY);
    } else if (c1 == 'I') {
      letter_I( strecherX,  strecherY);
    } else if (c1 == 'i') {
      letter_i( strecherX,  strecherY);
    } else if (c1 == 'J') {
      letter_J( strecherX,  strecherY);
    } else if (c1 == 'j') {
      letter_j( strecherX,  strecherY);
    } else if (c1 == 'K') {
      letter_K( strecherX,  strecherY);
    } else if (c1 == 'k') {
      letter_k( strecherX,  strecherY);
    } else if (c1 == 'L') {
      letter_L( strecherX,  strecherY);
    } else if (c1 == 'l') {
      letter_l( strecherX,  strecherY);
    } else if (c1 == 'M') {
      letter_M( strecherX,  strecherY);
    } else if (c1 == 'm') {
      letter_m( strecherX,  strecherY);
    } else if (c1 == 'N') {
      letter_N( strecherX,  strecherY);
    } else if (c1 == 'n') {
      letter_n( strecherX,  strecherY);
    } else if (c1 == 'O') {
      letter_O( strecherX,  strecherY);
    } else if (c1 == 'o') {
      letter_o( strecherX,  strecherY);
    } else if (c1 == 'P') {
      letter_P( strecherX,  strecherY);
    } else if (c1 == 'p') {
      letter_p( strecherX,  strecherY);
    } else if (c1 == 'Q') {
      letter_Q( strecherX,  strecherY);
    } else if (c1 == 'q') {
      letter_q( strecherX,  strecherY);
    } else if (c1 == 'R') {
      letter_R( strecherX,  strecherY);
    } else if (c1 == 'r') {
      letter_r( strecherX,  strecherY);
    } else if (c1 == 'S') {
      letter_S( strecherX,  strecherY);
    } else if (c1 == 's') {
      letter_s( strecherX,  strecherY);
    } else if (c1 == 'T') {
      letter_T( strecherX,  strecherY);
    } else if (c1 == 't') {
      letter_t( strecherX,  strecherY);
    } else if (c1 == 'U') {
      letter_U( strecherX,  strecherY);
    } else if (c1 == 'u') {
      letter_u( strecherX,  strecherY);
    } else if (c1 == 'V') {
      letter_V( strecherX,  strecherY);
    } else if (c1 == 'v') {
      letter_v( strecherX,  strecherY);
    } else if (c1 == 'W') {
      letter_W( strecherX,  strecherY);
    } else if (c1 == 'w') {
      letter_w( strecherX,  strecherY);
    } else if (c1 == 'X') {
      letter_X( strecherX,  strecherY);
    } else if (c1 == 'x') {
      letter_x( strecherX,  strecherY);
    } else if (c1 == 'Y') {
      letter_Y( strecherX,  strecherY);
    } else if (c1 == 'y') {
      letter_y( strecherX,  strecherY);
    } else if (c1 == 'Z') {
      letter_Z( strecherX,  strecherY);
    } else if (c1 == 'z') {
      letter_z( strecherX,  strecherY);
    } else if (c1 == '_') {
      letter_underscore( strecherX,  strecherY);
    } else if (c1 == '-') {
      letter_dash( strecherX,  strecherY);
    } else if (c1 == '?') {
      letter_question( strecherX,  strecherY);
    } else if (c1 == '.') {
      letter_period( strecherX,  strecherY);
    } else if (c1 == '!') {
      letter_exclaim( strecherX,  strecherY);
    } else if (c1 == ' ') {
      letter_space( strecherX,  strecherY);
    } else if (c1 == ':') {
      letter_colon( strecherX,  strecherY);
    } else if (c1 == ';') {
      letter_semicolon( strecherX,  strecherY);
    } else if (c1 == ',') {
      letter_comma( strecherX,  strecherY);
    } else if (c1 == '/') {
      letter_slash( strecherX,  strecherY);
    } else if (c1 == '&') {
      letter_amp( strecherX,  strecherY);
    } else if (c1 == '1') {
      one( strecherX,  strecherY);
    } else if (c1 == '2') {
      two( strecherX,  strecherY);
    } else if (c1 == '3') {
      three( strecherX,  strecherY);
    } else if (c1 == '4') {
      four( strecherX,  strecherY);
    } else if (c1 == '5') {
      five( strecherX,  strecherY);
    } else if (c1 == '6') {
      six( strecherX,  strecherY);
    } else if (c1 == '7') {
      seven( strecherX,  strecherY);
    } else if (c1 == '8') {
      eight( strecherX,  strecherY);
    } else if (c1 == '9') {
      nine( strecherX,  strecherY);
    } else if (c1 == '0') {
      zero(strecherX,  strecherY);
    }
//  }
}
/////////////////////////////////////////////////// LETTERS

function letter_A ( strX,  strY) {
  p.push();
   
  p.beginShape();
  p.vertex(0, typeY+strY);
  p.vertex(typeX/2+strX/2, 0);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();

   ang = atan((typeX/2+strX/2)/(typeY+strY));
   angX = tan(ang)*(typeY/3);

  p.line(angX, 2*typeY/3+strY, typeX+strX-angX, 2*typeY/3+strY);
  p.pop();
}

function letter_a ( strX,  strY) {
  p.push();
   
 
  p.beginShape();
  p.vertex(typeX+strX, typeY+strY);
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.endShape();
  
  p.beginShape();
  p.vertex(typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, 3*typeY/4);
  p.bezierVertex(typeX+strX, 3*typeY/4,  typeX+strX, typeY/2,  typeX/2+strX, typeY/2);
  p.vertex(typeX/2, typeY/2);
  p.bezierVertex(0,typeY/2,  0,3*typeY/4,  0,3*typeY/4);
  p.vertex(0,3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.pop();
}

function letter_B ( strX,  strY) {
  p.push();
   
   
  p.beginShape();
  p.vertex(0, typeY+strY);
  p.vertex(0, 0);
  p.vertex(typeX/2+strX, 0);
  p.bezierVertex(typeX/2+strX, 0, typeX+strX, 0, typeX+strX, typeY/4);
  p.vertex(typeX+strX, typeY/4+strY/2);
  p.bezierVertex(typeX+strX, typeY/2+strY/2, typeX/2+strX/2, typeY/2+strY/2, typeX/2+strX/2, typeY/2+strY/2);
  p.vertex(0, typeY/2+strY/2);
  p.endShape();

  //repeat top hump
  p.push();
  p.translate(0, typeY/2+strY/2);
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX/2+strX, 0);
  p.bezierVertex(typeX/2+strX, 0, typeX+strX, 0, typeX+strX, typeY/4);
  p.vertex(typeX+strX, typeY/4+strY/2);
  p.bezierVertex(typeX+strX, typeY/2+strY/2, typeX/2+strX/2, typeY/2+strY/2, typeX/2+strX/2, typeY/2+strY/2);
  p.vertex(0, typeY/2+strY/2);
  p.endShape();
  p.pop();
  p.pop();
}

function letter_b ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.line(0,0,  0,typeY+strY);
  p.pop();
}

function letter_C ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/3);
  p.bezierVertex(typeX+strX, typeY/3, typeX+strX, 0, typeX/2+strX, 0);
  p.vertex(typeX/2, 0);
  p.bezierVertex(0, 0, 0, typeY/3, 0, typeY/3);
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.endShape();
  p.pop();
}

function letter_c ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.endShape();
  
  p.pop();
}

function letter_D ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/3);
  p.bezierVertex(typeX+strX,typeY/3,  typeX+strX,0,  typeX/2+strX,0);
  p.vertex(0, 0);
  p.vertex(0, typeY+strY);
  p.vertex(typeX/2,typeY+strY);
  p.vertex(typeX/2+strX,typeY+strY);
  p.bezierVertex(typeX+strX,typeY+strY,  typeX+strX,2*typeY/3+strY,   typeX+strX,2*typeY/3+strY);
  p.vertex(typeX+strX, typeY/3);
  p.endShape();
  p.pop();
}

function letter_d ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.line(typeX+strX,0,  typeX+strX,typeY+strY);
  p.pop();
}

function letter_E ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, 0);
  p.vertex(0, 0);
  p.vertex(0, typeY+strY);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();

  p.line(0, typeY/2+strY/2, 2*typeX/3+strX, typeY/2+strY/2);
  p.pop();
}

function letter_e ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  
  p.vertex(0,5*typeY/8+strY/2);
  p.vertex(typeX+strX, 5*typeY/8+strY/2);
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.endShape();
  
  p.pop();
}

function letter_F ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, 0);
  p.vertex(0, 0);
  p.vertex(0, typeY+strY);
  p.endShape();

  p.line(0, typeY/2+strY/2, 2*typeX/3+strX, typeY/2+strY/2);
  p.pop();
}

function letter_f ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.vertex(typeX/2+strX/2,typeY/4);
  p.bezierVertex(typeX/2+strX/2,typeY/4,  typeX/2+strX/2,0,  typeX+strX/2,0);
  p.vertex(typeX+strX,0);
  p.endShape();
  
  p.line(0, typeY/2+strY/2, typeX+strX, typeY/2+strY/2);
  p.line(0, typeY+strY, typeX+strX, typeY+strY);
  p.pop();
}

function letter_G ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/3);
  p.bezierVertex(typeX+strX, typeY/3, typeX+strX, 0, typeX/2+strX, 0);
  p.vertex(typeX/2, 0);
  p.bezierVertex(0, 0, 0, typeY/3, 0, typeY/3);
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.endShape();

  p.beginShape();
  p.vertex(typeX/2+strX/2, typeY/2+strY/2);
  p.vertex(typeX+strX, typeY/2+strY/2);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();
  p.pop();
}

function letter_g ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, typeY/2+strY);
  p.bezierVertex(0, typeY/2+strY,  0, 3*typeY/4+strY,  typeX/2, 3*typeY/4+strY);
  p.vertex(typeX/2+strX, 3*typeY/4+strY);
  p.bezierVertex(typeX+strX, 3*typeY/4+strY,  typeX+strX, typeY/2+strY,  typeX+strX, typeY/2+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.beginShape();
  p.vertex(typeX/2+strX/2,3*typeY/4+strY);
  p.vertex(typeX+strX,typeY+strY);
  p.bezierVertex(typeX+strX,typeY+strY,  typeX+strX,5*typeY/4+strY,  typeX/2+strX, 5*typeY/4+strY);
  p.vertex(typeX/2,5*typeY/4+strY);
  p.bezierVertex(0,5*typeY/4+strY,  0,typeY+strY,  0,typeY+strY);
  p.endShape();
  
  p.line(typeX/2+strX/2,typeY/4,  typeX+strX,typeY/4);
  
  p.pop();
}

function letter_H ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, 0, typeY+strY);
  p.line(0, typeY/2+strY/2, typeX+strX, typeY/2+strY/2);
  p.line(typeX+strX, 0, typeX+strX, typeY+strY);
  p.pop();
}

function letter_h ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY+strY);
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0,typeY+strY);
  p.endShape();
  
  p.line(0,0,0,typeY+strY);
  
  p.pop();
}

function letter_I ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, typeX+strX, 0);
  p.line(0, typeY+strY, typeX+strX, typeY+strY);
  p.line(typeX/2+strX/2, 0, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_i ( strX,  strY) {
  p.push();
   
    

  p.beginShape();
  p.vertex(0,typeY/4);
  p.vertex(typeX/2+strX/2,typeY/4);
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.endShape();
  
  p.line(0,typeY+strY, typeX+strX,typeY+strY);
  p.line(typeX/2+strX/2, 0,  typeX/2+strX/2, typeY/8);

  p.pop();
}

function letter_J ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.vertex(typeX+strX, 0);
  p.vertex(typeX/3, 0);
  p.endShape();
  p.pop();
}

function letter_j ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX/4,typeY/4);
  p.vertex(3*typeX/4+strX,typeY/4);
  p.vertex(3*typeX/4+strX,typeY+strY);
  p.bezierVertex(3*typeX/4+strX,typeY+strY,  3*typeX/4+strX,5*typeY/4+strY,  typeX/4+strX,5*typeY/4+strY);
  p.vertex(0,5*typeY/4+strY);
  p.endShape();
  
  p.line(3*typeX/4+strX,0,  3*typeX/4+strX,typeY/8);
  
  p.pop();
}

function letter_K ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, 0, typeY+strY);
  p.line(0, 2*typeY/3+strY, typeX+strX, 0);

   ang = atan((2*typeY/3+strY)/(typeX+strX));
   angX = (typeY/2+strY/2)/tan(ang);

  p.line(typeX+strX-angX, typeY/2+strY/2, typeX+strX, typeY+strY);
  p.pop();
}

function letter_k ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, 0, typeY+strY);
  p.line(typeX+strX,typeY/4,  0,3*typeY/4+strY);
  p.line(typeX+strX,typeY+strY,  typeX/2+strX/2,typeY/2+strY/2);

  p.pop();
}

function letter_L ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(0, typeY+strY);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();
  p.pop();
}

function letter_l ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX/2+strX/2, 0);
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.endShape();

  p.line(0,typeY+strY,  typeX+strX,typeY+strY);
  p.pop();
}

function letter_M ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, typeY+strY);
  p.vertex(0, 0);
  p.vertex(typeX/2+strX/2, 2*typeY/3+strY);
  p.vertex(typeX+strX, 0);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();
  p.pop();
}

function letter_m ( strX,  strY) {
  p.push();
   
    

  p.line(0,typeY/4,0,typeY+strY);

  //left Hump  
  p.beginShape();
  p.vertex(0,3*typeY/8);
  p.bezierVertex(0,3*typeY/8,  0,typeY/4,  typeX/4,typeY/4);
  p.vertex(typeX/4+strX/2,typeY/4);
  p.bezierVertex(typeX/2+strX/2,typeY/4,  typeX/2+strX/2,3*typeY/8,  typeX/2+strX/2,3*typeY/8);
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.endShape();
  
  p.translate(typeX/2+strX/2,0);
  p.beginShape();
  p.vertex(0,3*typeY/8);
  p.bezierVertex(0,3*typeY/8,  0,typeY/4,  typeX/4,typeY/4);
  p.vertex(typeX/4+strX/2,typeY/4);
  p.bezierVertex(typeX/2+strX/2,typeY/4,  typeX/2+strX/2,3*typeY/8,  typeX/2+strX/2,3*typeY/8);
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.endShape();  
  
  p.pop();
}

function letter_N ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, typeY+strY);
  p.vertex(0, 0);
  p.vertex(typeX+strX, typeY+strY);
  p.vertex(typeX+strX, 0);
  p.endShape();
  p.pop();
}

function letter_n ( strX,  strY) {
  p.push();
   
    
  
  p.line(0,typeY/4,0,typeY+strY);
  
  p.beginShape();
  p.vertex(typeX+strX, typeY+strY);
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.endShape();
  
  p.pop();
}

function letter_O ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/3);
  p.bezierVertex(typeX+strX, typeY/3, typeX+strX, 0, typeX/2+strX, 0);
  p.vertex(typeX/2, 0);
  p.bezierVertex(0, 0, 0, typeY/3, 0, typeY/3);
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.vertex(typeX+strX, typeY/3);
  p.endShape();
  p.pop();
}

function letter_o ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.pop();
}

function letter_P ( strX,  strY) {
  p.push();
       
    p.beginShape();
    p.vertex(0, typeY+strY);
    p.vertex(0, 0);
    p.vertex(typeX/2+strX, 0);
    quadraticVertex(typeX+strX,0,  typeX+strX,typeY/4);
    p.vertex(typeX+strX, typeY/4+strY/2);
    quadraticVertex(typeX+strX, typeY/2+strY/2,  typeX/2+strX,typeY/2+strY/2);
    p.vertex(0,typeY/2+strY/2);
    p.endShape();
  p.pop();
}

function letter_p ( strX,  strY) {
  p.push();
   
    
  
  p.line(0,typeY/4,  0,5*typeY/4+strY);
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.pop();
}

function letter_Q ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/3);
  p.bezierVertex(typeX+strX, typeY/3, typeX+strX, 0, typeX/2+strX, 0);
  p.vertex(typeX/2, 0);
  p.bezierVertex(0, 0, 0, typeY/3, 0, typeY/3);
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.vertex(typeX+strX, typeY/3);
  p.endShape();

  p.line(typeX/2+strX/2, typeY/2+strY, typeX+strX, typeY+strY);
  p.pop();
}

function letter_q ( strX,  strY) {
  p.push();
   
    
  
  p.line(typeX+strX,typeY/4,  typeX+strX,5*typeY/4+strY);
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0, typeY/4, 0, typeY/2, 0, typeY/2);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.vertex(typeX+strX, typeY/2);
  p.endShape();
  
  p.pop();
}

function letter_R ( strX,  strY) {
  p.push();
    
    p.beginShape();
    p.vertex(0, typeY+strY);
    p.vertex(0, 0);
    p.vertex(typeX/2+strX, 0);
    quadraticVertex(typeX+strX,0,  typeX+strX,typeY/4);
    p.vertex(typeX+strX, typeY/4+strY/2);
    quadraticVertex(typeX+strX, typeY/2+strY/2,  typeX/2+strX,typeY/2+strY/2);
    p.vertex(0,typeY/2+strY/2);
    p.endShape();

  p.line(typeX/2+strX/2, typeY/2+strY/2, typeX+strX, typeY+strY);
  p.pop();
}

function letter_r ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(typeX+strX, typeY/2);
  p.bezierVertex(typeX+strX, typeY/2,  typeX+strX, typeY/4,  typeX/2+strX, typeY/4);
  p.vertex(typeX/2, typeY/4);
  p.bezierVertex(0,typeY/4,  0,typeY/2,  0,typeY/2);
  p.endShape();
  
  p.line(0,typeY/4, 0,typeY+strY);
  
  p.pop();
}

function letter_S ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(typeX+strX, typeY/4);
  p.bezierVertex(typeX+strX, typeY/4, typeX+strX, 0, typeX/2+strX, 0);
  p.vertex(typeX/2, 0);
  p.bezierVertex(0, 0, 0, typeY/4, 0, typeY/4);
  p.bezierVertex(0, 2*typeY/3+strY, typeX+strX, typeY/3, typeX+strX, 3*typeY/4+strY);
  p.bezierVertex(typeX+strX, 3*typeY/4+strY, typeX+strX, typeY+strY, typeX/2+strX, typeY+strY);
  p.vertex(typeX/2, typeY+strY);
  p.bezierVertex(0, typeY+strY, 0, 2*typeY/3+strY, 0, 2*typeY/3+strY);
  p.endShape();
  p.pop();
}

function letter_s ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(7*typeX/8+strX,3*typeY/8);
  p.bezierVertex(7*typeX/8+strX,3*typeY/8,  7*typeX/8+strX,typeY/4,  typeX/2+strX,typeY/4);
  p.vertex(typeX/2,typeY/4);
  p.bezierVertex(typeX/8,typeY/4,  typeX/8,3*typeY/8, typeX/8,3*typeY/8);
  p.bezierVertex(typeX/8,5*typeY/8+strY,  typeX+strX,3*typeY/8,  typeX+strX,3*typeY/4+strY);
  p.bezierVertex(typeX+strX,3*typeY/4+strY,  typeX+strX,typeY+strY,  typeX/2+strX,typeY+strY);
  p.vertex(typeX/2,typeY+strY);
  p.bezierVertex(0,typeY+strY,  0,3*typeY/4+strY,  0,3*typeY/4+strY);
  p.endShape();
  
  p.pop();
}

function letter_T ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, typeX+strX, 0);
  p.line(typeX/2+strX/2, 0, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_t ( strX,  strY) {
  p.push();
   
    
  
  p.line(0,typeY/4,  typeX+strX,typeY/4);
  
  p.beginShape();
  p.vertex(typeX/2+strX/2,0);
  p.vertex(typeX/2+strX/2,3*typeY/4+strY);
  p.bezierVertex(typeX/2+strX/2,3*typeY/4+strY,  typeX/2+strX/2,typeY+strY,  3*typeX/4+strX/2,typeY+strY);
  p.vertex(typeX+strX,typeY+strY);  
  p.endShape();
  
  p.pop();
}

function letter_U ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(0, 2*typeY/3+strY);
  p.bezierVertex(0, 2*typeY/3+strY, 0, typeY+strY, typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY, typeX+strX, 2*typeY/3+strY, typeX+strX, 2*typeY/3+strY);
  p.vertex(typeX+strX, 0);
  p.endShape();
  p.pop();
}

function letter_u ( strX,  strY) {
  p.push();
   
    
  
  p.line(typeX+strX,typeY/4,  typeX+strX,typeY+strY);
  
  p.beginShape();
  p.vertex(0,typeY/4);
  p.vertex(0, 3*typeY/4+strY);
  p.bezierVertex(0, 3*typeY/4+strY,  0, typeY+strY,  typeX/2, typeY+strY);
  p.vertex(typeX/2+strX, typeY+strY);
  p.bezierVertex(typeX+strX, typeY+strY,  typeX+strX, 3*typeY/4+strY,  typeX+strX, 3*typeY/4+strY);
  p.endShape();
  
  p.pop();
}

function letter_V ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX/2+strX/2, typeY+strY);
  p.vertex(typeX+strX, 0);
  p.endShape();
  p.pop();
}

function letter_v ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(0, typeY/4);
  p.vertex(typeX/2+strX/2, typeY+strY);
  p.vertex(typeX+strX, typeY/4);
  p.endShape();
  
  p.pop();
}

function letter_W ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX/4, typeY+strY);
  p.vertex(typeX/2+strX/2, typeY/3);
  p.vertex(3*typeX/4+strX, typeY+strY);
  p.vertex(typeX+strX, 0);
  p.endShape();
  p.pop();
}

function letter_w ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(0, typeY/4);
  p.vertex(typeX/4+strX/4, typeY+strY);
  p.vertex(typeX/2+strX/2, typeY/2+strY/2);
  p.vertex(3*typeX/4+3*strX/4,  typeY+strY);
  p.vertex(typeX+strX, typeY/4);
  p.endShape();
  
  p.pop();
}

function letter_X ( strX,  strY) {
  p.push();
   
    
  p.line(0, 0, typeX+strX, typeY+strY);
  p.line(0, typeY+strY, typeX+strX, 0);
  p.pop();
}

function letter_x ( strX,  strY) {
  p.push();
   
    
  p.line(0, typeY/4, typeX+strX, typeY+strY);
  p.line(0, typeY+strY, typeX+strX, typeY/4);
  p.pop();
}

function letter_Y ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX/2+strX/2, typeY/2+strY/2);
  p.vertex(typeX+strX, 0);
  p.endShape();

  p.line(typeX/2+strX/2, typeY/2+strY/2, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_y ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(0, typeY/4);
  p.vertex(typeX/2+strX/2, typeY+strY);
  p.vertex(typeX+strX, typeY/4);
  p.endShape();
  
  p.beginShape();
  p.vertex(typeX/2+strX/2,typeY+strY);
  p.bezierVertex(typeX/2+strX/2,typeY+strY,  typeX/2+strX/2,5*typeY/4+strY,  strX/2,5*typeY/4+strY);
  p.vertex(0,5*typeY/4+strY);
  p.endShape();
  
  p.pop();
}


function letter_Z ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, 0);
  p.vertex(typeX+strX, 0);
  p.vertex(0, typeY+strY);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();
  p.pop();
}

function letter_z ( strX,  strY) {
  p.push();
   
    
  
  p.beginShape();
  p.vertex(0, typeY/4);
  p.vertex(typeX+strX, typeY/4);
  p.vertex(0, typeY+strY);
  p.vertex(typeX+strX, typeY+strY);
  p.endShape();
  
  p.pop();
}

function letter_underscore ( strX,  strY) {
  p.push();
   
    
  p.line(0, typeY+strY, typeX+strX, typeY+strY);
  p.pop();
}

function letter_dash ( strX,  strY) {
  p.push();
   
    
  p.line(0, typeY/2+strY/2, typeX+strX, typeY/2+strY/2);
  p.pop();
}

function letter_question ( strX,  strY) {
  p.push();
   
    
  p.beginShape();
  p.vertex(0, typeY/3);
  p.bezierVertex(0, typeY/3, 0, 0, typeX/2, 0);
  p.vertex(typeX/2+strX, 0);
  p.bezierVertex(typeX+strX, 0, typeX+strX, typeY/3, typeX+strX, typeY/3);
  p.vertex(typeX+strX, typeY/3+strY);
  p.bezierVertex(typeX+strX, typeY/3+strY, typeX+strX, typeY/3+typeY/4+strY, typeX/2+strX/2, typeY/3+typeY/4+strY);
  p.vertex(typeX/2+strX/2, 3*typeY/4+strY);
  p.endShape();

  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_period ( strX,  strY) {
  p.push();
   
    
  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_colon ( strX,  strY) {
  p.push();
   
    
  p.line(typeX/2+strX/2, typeY/2+strY/2-typeY/8, typeX/2+strX/2, typeY/2+strY/2);
  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_semicolon ( strX,  strY) {
  p.push();
   
    
  p.line(typeX/2+strX/2, typeY/2+strY/2 - typeY/8, typeX/2+strX/2, typeY/2+strY/2);
  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2 - typeX/4, typeY+strY);
  p.pop();
}

function letter_comma ( strX,  strY) {
  p.push();
   
   
  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2 - typeX/4, typeY+strY);
  p.pop();
}

function letter_exclaim ( strX,  strY) {
  p.push();
   
    
  p.line(typeX/2+strX/2, 0, typeX/2+strX/2, 3*typeY/4+strY);

  p.line(typeX/2+strX/2, 7*typeY/8+strY, typeX/2+strX/2, typeY+strY);
  p.pop();
}

function letter_slash ( strX,  strY) {
  p.push();
   
    
  p.line(0, typeY+strY, typeX+strX, 0);
  p.pop();
}

function letter_amp ( strX,  strY) {
  p.push();
   
    
    p.beginShape();
    p.vertex(typeX+strX,typeY+strY);
    quadraticVertex(typeX/8,typeY/4,  typeX/8,typeY/8);
    quadraticVertex(typeX/8,0,  3*typeX/8,0);
    p.vertex(3*typeX/8+strX,0);
    p.bezierVertex(5*typeX/8+strX,0,  5*typeX/8+strX,typeY/8,  5*typeX/8+strX,typeY/8);
    p.bezierVertex(5*typeX/8+strX,typeY/4,  0,typeY/2+strY,  0,3*typeY/4+strY);
    quadraticVertex(0,typeY+strY,  typeX/2,typeY+strY);
    p.vertex(typeX/2+strX,typeY+strY);
    p.bezierVertex(typeX+strX,typeY+strY,  typeX+strX,typeY/2+strY/2, typeX+strX,typeY/2+strY/2);
    p.vertex(3*typeX/4+strX,typeY/2+strY/2);
    p.endShape();
  p.pop();
}

function letter_space ( strX,  strY) {
  p.push();

  p.pop();
}

function one (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,typeY/4);
    p.vertex(typeX/2+strX/2,0);
    p.vertex(typeX/2+strX/2,typeY+strY);
    p.endShape();
    
    p.line(0,typeY+strY,typeX+strX,typeY+strY);
  p.pop();
}

function two (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,typeY/3);
    quadraticVertex(0,0,typeX/2,0);
    p.vertex(typeX/2+strX,0);
    quadraticVertex(typeX+strX,0,typeX+strX,typeY/3);
    p.vertex(typeX+strX,typeY/3+strY);
    p.bezierVertex(typeX+strX,2*typeY/3+strY,0,2*typeY/3+strY,0,typeY+strY);
    p.vertex(typeX+strX,typeY+strY);
    p.endShape();
  p.pop();
}

function three (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,0);
    p.vertex(typeX+strX,0);
    p.vertex(typeX/2+strX/2,typeY/3);
    quadraticVertex(typeX+strX,typeY/3,typeX+strX,2*typeY/3);
    p.vertex(typeX+strX,2*typeY/3+strY);
    quadraticVertex(typeX+strX,typeY+strY,typeX/2+strX,typeY+strY);
    p.vertex(typeX/2,typeY+strY);
    p.bezierVertex(0,typeY+strY,0,2*typeY/3+strY,0,2*typeY/3+strY);
    p.endShape();
  p.pop();
}

function four (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(typeX/3,0);
    p.vertex(0,2*typeY/3+strY);
    p.vertex(typeX+strX,2*typeY/3+strY);
    p.endShape();
    p.line(2*typeX/3+strX,0,2*typeX/3+strX,typeY+strY);
  p.pop();
}

function five (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(typeX+strX,0);
    p.vertex(0,0);
    p.vertex(0,typeY/3);
    p.vertex(typeX/2+strX,typeY/3);
    quadraticVertex(typeX+strX,typeY/3,typeX+strX,2*typeY/3);
    p.vertex(typeX+strX,2*typeY/3+strY);
    quadraticVertex(typeX+strX,typeY+strY,typeX/2+strX,typeY+strY);
    p.bezierVertex(0,typeY+strY,0,2*typeY/3+strY,0,2*typeY/3+strY);
    p.endShape();
  p.pop();
}

function six (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(typeX+strX,2*typeY/3+strY);
    quadraticVertex(typeX+strX,typeY+strY,typeX/2+strX,typeY+strY);
    p.vertex(typeX/2,typeY+strY);
    p.bezierVertex(0,typeY+strY,0,2*typeY/3+strY,0,2*typeY/3+strY);
    p.vertex(0,2*typeY/3);
    quadraticVertex(0,typeY/3,typeX/2,typeY/3);
    p.vertex(typeX/2+strX,typeY/3);
    p.bezierVertex(typeX+strX,typeY/3,typeX+strX,2*typeY/3,typeX+strX,2*typeY/3);
    p.vertex(typeX+strX,2*typeY/3+strY);
    p.endShape();
    
    p.beginShape();
    p.vertex(0,2*typeY/3);
    quadraticVertex(0,0,2*typeX/3,0);
    p.endShape();
  p.pop();
}

function seven (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,0);
    p.vertex(typeX+strX,0);
    p.vertex(typeX/2+strX/2,typeY+strY);
    p.endShape();
  p.pop();
}

function eight (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,typeY/4);
    quadraticVertex(0,0,typeX/2,0);
    p.vertex(typeX/2+strX,0);
    p.bezierVertex(typeX+strX,0,typeX+strX,typeY/4,typeX+strX,typeY/4);
    p.vertex(typeX+strX,typeY/4+strY/2);
    quadraticVertex(typeX+strX,typeY/2+strY/2,typeX/2+strX,typeY/2+strY/2);
    p.vertex(typeX/2,typeY/2+strY/2);
    p.bezierVertex(0,typeY/2+strY/2,0,typeY/4+strY/2,0,typeY/4+strY/2);
    p.vertex(0,typeY/4);
    p.endShape();
    
    p.translate(0,typeY/2+strY/2);//bottom hump
    p.beginShape();
    p.vertex(0,typeY/4);
    quadraticVertex(0,0,typeX/2,0);
    p.vertex(typeX/2+strX,0);
    p.bezierVertex(typeX+strX,0,typeX+strX,typeY/4,typeX+strX,typeY/4);
    p.vertex(typeX+strX,typeY/4+strY/2);
    quadraticVertex(typeX+strX,typeY/2+strY/2,typeX/2+strX,typeY/2+strY/2);
    p.vertex(typeX/2,typeY/2+strY/2);
    p.bezierVertex(0,typeY/2+strY/2,0,typeY/4+strY/2,0,typeY/4+strY/2);
    p.vertex(0,typeY/4);
    p.endShape();
    
  p.pop();
}

function nine (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(0,typeY/3);
    quadraticVertex(0,0,typeX/2,0);
    p.vertex(typeX/2+strX,0);
    p.bezierVertex(typeX+strX,0,typeX+strX,typeY/3,typeX+strX,typeY/3);
    p.vertex(typeX+strX,typeY/3+strY);
    quadraticVertex(typeX+strX,2*typeY/3+strY,typeX/2+strX,2*typeY/3+strY);
    p.vertex(typeX/2,2*typeY/3+strY);
    p.bezierVertex(0,2*typeY/3+strY,0,typeY/3+strY,0,typeY/3+strY);
    p.vertex(0,typeY/3);
    p.endShape();
    
    p.line(typeX+strX,typeY/3+strY,typeX+strX,typeY+strY);
  p.pop();
}

function zero (strX,  strY) {
  p.push();

    p.beginShape();
    p.vertex(typeX/2+strX,0);
    quadraticVertex(typeX+strX,0,  typeX+strX,typeY/3);
    p.vertex(typeX+strX,2*typeY/3+strY);
    quadraticVertex(typeX+strX,typeY+strY,  typeX/2+strX,typeY+strY);
    p.vertex(typeX/2,typeY+strY);
    quadraticVertex(0,typeY+strY,  0,2*typeY/3+strY);
    p.vertex(0,typeY/3);
    quadraticVertex(0,0,  typeX/2,0);
    p.vertex(typeX/2+strX,0);
    p.endShape();
    
    p.line(2*typeX/3 + strX,typeY/3,typeX/3,2*typeY/3+strY);
  p.pop();
}


    // --- ORIGINAL SKETCH.JS CODE ---
    // LETTER
var typeX = 20;
var typeY = 40;
var typeStroke = 2;
var strecherXsize = 0;
var strecherX = 0;
var strecherYsize = 0;
var strecherY = 0;

// CYLINDER
var pieSlice;
var radius = 250;
var stackNum = 1;
var rRotate = -5;
var rOffset = 0;
var rWaveCount = 2;
var rWaveSpeed = 0;
var rWave = 0;
var rZaxis = 0;
var rLong = 0;
var xRotTweak = 0, yRotTweak = 0, zRotTweak = 0;
var rWaveOffset;
var stackHeight;
var stackHeightAdjust = 0;

// CAMERA
var xRotCamera = 15, yRotCamera = 0, zRotCamera = 0;
var zoomCamera = 0;

// STRING
var letter_select, inpText = "SPACE-TYPE-GENERATOR";
var myText = [];

// COLOR
var strkColor;
var bkgdColor;
var bkgdStrokeColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;

// CLEAR AND HIDE
var clearTextDelay = 0;
var clearMethod = "all at once";
var seqInterval = 100;
var hideNoText = false;
var lastTextTime = 0;
var isClearing = false;
var lastRemoveTime = 0;


function preload() {
  font = p.loadFont('../assets/IBMPlexMono-Regular.otf');
}

function setup() {
  const w = (typeof initialWidth !== 'undefined') ? initialWidth : p.windowWidth;
  const h = (typeof initialHeight !== 'undefined') ? initialHeight : p.windowHeight;
  p.createCanvas(w, h, p.WEBGL);
  p.smooth();



  p.textFont(font);
  p.frameRate(30);

  // Initialize with default preset
  reSetting();

  if (typeof signalReady === 'function') signalReady();
}


// --- PRESET DEFINITIONS ---

function reSetting() {
    stackHeightAdjust = 0;
    radius = 250; stackNum = 1; rRotate = -5; rOffset = 0; 
    rWaveCount = 2; rWaveSpeed = 0; rWave = 0; rLong = 0; 
    rZaxis = 0; strecherXsize = 0; strecherYsize = 0; 
    typeX = 20; typeY = 40; typeStroke = 2;
    xRotTweak = 0; yRotTweak = 0; zRotTweak = 0;
    xRotCamera = 15; yRotCamera = 0; zRotCamera = 0; zoomCamera = 0;
    
    inpNumber = 1;
    inp1 = p.color(0);
    bkgdColor = p.color(255);
    bkgdStrokeColor = p.color(235);
    strkColor = p.color(0);

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
    
    if (settings.radius !== undefined) radius = settings.radius;
    if (settings.stackNum !== undefined) stackNum = settings.stackNum;
    if (settings.rRotate !== undefined) rRotate = settings.rRotate;
    if (settings.rOffset !== undefined) rOffset = settings.rOffset;
    if (settings.rWaveCount !== undefined) rWaveCount = settings.rWaveCount;
    if (settings.rWaveSpeed !== undefined) rWaveSpeed = settings.rWaveSpeed;
    if (settings.rWave !== undefined) rWave = settings.rWave;
    if (settings.rZaxis !== undefined) rZaxis = settings.rZaxis;
    if (settings.rLong !== undefined) rLong = settings.rLong;
    if (settings.strecherX !== undefined) strecherXsize = settings.strecherX;
    if (settings.strecherY !== undefined) strecherYsize = settings.strecherY;
    if (settings.typeX !== undefined) typeX = settings.typeX;
    if (settings.typeY !== undefined) typeY = settings.typeY;
    if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
    if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
    if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
    if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
    if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;
    if (settings.xRotTweak !== undefined) xRotTweak = settings.xRotTweak;
    if (settings.yRotTweak !== undefined) yRotTweak = settings.yRotTweak;
    if (settings.zRotTweak !== undefined) zRotTweak = settings.zRotTweak;
    if (settings.stackHeightAdjust !== undefined) stackHeightAdjust = settings.stackHeightAdjust;
    
    if (settings.bkgdColor !== undefined) bkgdColor = p.color(settings.bkgdColor);
    if (settings.color1 !== undefined) { inp1 = p.color(settings.color1); inpNumber = 1; }
    if (settings.color2 !== undefined) { inp2 = p.color(settings.color2); }
    if (settings.color3 !== undefined) { inp3 = p.color(settings.color3); }
    if (settings.color4 !== undefined) { inp4 = p.color(settings.color4); }
    if (settings.color5 !== undefined) { inp5 = p.color(settings.color5); }
    if (settings.color6 !== undefined) { inp6 = p.color(settings.color6); }
    if (settings.inpNumber !== undefined) inpNumber = settings.inpNumber;
}

// REMOTE CONTROL HANDLER
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

    if (data.radius !== undefined) radius = data.radius;
    if (data.stackNum !== undefined) stackNum = data.stackNum;
    if (data.rRotate !== undefined) rRotate = data.rRotate;
    if (data.rOffset !== undefined) rOffset = data.rOffset;
    if (data.rWaveCount !== undefined) rWaveCount = data.rWaveCount;
    if (data.rWaveSpeed !== undefined) rWaveSpeed = data.rWaveSpeed;
    if (data.rWave !== undefined) rWave = data.rWave;
    if (data.rZaxis !== undefined) rZaxis = data.rZaxis;
    if (data.strecherX !== undefined) strecherXsize = data.strecherX;
    if (data.strecherY !== undefined) strecherYsize = data.strecherY;
    if (data.typeX !== undefined) typeX = data.typeX;
    if (data.typeY !== undefined) typeY = data.typeY;
    if (data.typeStroke !== undefined) typeStroke = data.typeStroke;
    if (data.xRotCamera !== undefined) xRotCamera = data.xRotCamera;
    if (data.yRotCamera !== undefined) yRotCamera = data.yRotCamera;
    if (data.zRotCamera !== undefined) zRotCamera = data.zRotCamera;
    if (data.zoomCamera !== undefined) zoomCamera = data.zoomCamera;
    if (data.xRotTweak !== undefined) xRotTweak = data.xRotTweak;
    if (data.yRotTweak !== undefined) yRotTweak = data.yRotTweak;
    if (data.zRotTweak !== undefined) zRotTweak = data.zRotTweak;
    
    if (data.bkgdColor !== undefined) bkgdColor = p.color(data.bkgdColor);
    if (data.color1 !== undefined) {
        inp1 = p.color(data.color1);
        inpNumber = 1; // Switch back to single p.color mode if color1 is sent
    }

    // Handle p.save request
    if (data.action === "savePreset") {
        const payload = {
            type: "savePreset",
            iframeSrc: window.location.href,
            name: data.name || "custom_preset",
            settings: {
                radius: radius,
                stackNum: stackNum,
                rRotate: rRotate,
                rOffset: rOffset,
                rWaveCount: rWaveCount,
                rWaveSpeed: rWaveSpeed,
                rWave: rWave,
                rZaxis: rZaxis,
                strecherX: strecherXsize,
                strecherY: strecherYsize,
                typeX: typeX,
                typeY: typeY,
                typeStroke: typeStroke,
                xRotCamera: xRotCamera,
                yRotCamera: yRotCamera,
                zRotCamera: zRotCamera,
                zoomCamera: zoomCamera,
                xRotTweak: xRotTweak,
                yRotTweak: yRotTweak,
                zRotTweak: zRotTweak,
                stackHeightAdjust: stackHeightAdjust,
                inpNumber: inpNumber,
                bkgdColor: bkgdColor.toString(),
                color1: inp1.toString(),
                color2: inp2 ? inp2.toString() : undefined,
                color3: inp3 ? inp3.toString() : undefined,
                color4: inp4 ? inp4.toString() : undefined,
                color5: inp5 ? inp5.toString() : undefined,
                color6: inp6 ? inp6.toString() : undefined
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

  stackHeight = (typeY + strecherYsize / 2) + 5 + stackHeightAdjust;
  pieSlice = 2 * p.PI / inpText.length;
  rWaveOffset = 2 * p.PI / inpText.length * rWaveCount;

  p.noFill();
  p.strokeWeight(typeStroke);

  p.push();
  // p.camera
  p.translate(0, 0, zoomCamera);
  p.rotateX(p.radians(xRotCamera));
  p.rotateY(p.radians(yRotCamera));
  p.rotateZ(p.radians(zRotCamera));

  // center stack
  p.translate(0, -(stackNum - 1) * stackHeight / 2);

  // rotation
  p.rotateY(p.frameCount * (rRotate / 1000));

  for (var i = 0; i < inpText.length * stackNum; i++) {
    var ringSpot = i % inpText.length;
    letter_select = ringSpot;

    if (p.floor(i / inpText.length) % 2 === 1) {
      strecherY = p.map(p.sin(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)), -1, 1, 0, strecherYsize);
    } else {
      strecherY = p.map(p.sin(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000) + p.PI), -1, 1, 0, strecherYsize);
    }

    strecherX = p.map(p.sin(p.floor(i / inpText.length) * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)), -1, 1, 0, strecherXsize);

    p.push();
    // stack translates
    p.rotateY(p.floor(i / inpText.length) * rOffset);
    p.translate(0, p.floor(i / inpText.length) * stackHeight);
    // ring translates
    p.rotateY(ringSpot * pieSlice);

    p.translate(0, 0, radius);
    if (rLong != 0) {
      var rLonger = p.sin(p.floor(i / inpText.length) * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * rLong;
      p.translate(0, 0, rLonger);
    }
    if (rZaxis != 0) {
      var rZaxiser = p.sin(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * rZaxis;
      p.translate(0, rZaxiser, 0);
    }
    if (rWave != 0) {
      var rWaver = p.sin(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * rWave;
      p.translate(0, 0, rWaver);
    }
    if (yRotTweak != 0) {
      p.rotateY(p.cos(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * -p.radians(yRotTweak));
    }
    if (xRotTweak != 0) {
      p.rotateX(p.cos(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * -p.radians(xRotTweak));
    }

    if (rLong != 0) {
      // fix rLong y-rotation
      var prerLonger = p.sin(p.floor((i / inpText.length) - 1) * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * rLong;
      var postrLonger = p.sin(p.floor((i / inpText.length) + 1) * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * rLong;
      var rLongAdjust = p.atan2(stackHeight * 2, (prerLonger - postrLonger))
      p.rotateX(rLongAdjust - p.PI / 2);
    }

    if (zRotTweak != 0) {
      p.rotateZ(p.cos(ringSpot * rWaveOffset + p.frameCount * (rWaveSpeed / 1000)) * p.radians(zRotTweak));
    }

    p.translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2, 0);
    // outer surface
    if (inpNumber == 6) {
      setTextColor(p.floor(i / inpText.length));
    } else {
      strkColor = inp1;
      bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
    }
    p.stroke(strkColor);
    keyboardEngine();
    p.translate(0, 0, -1);
    // inner surface
    p.stroke(bkgdStrokeColor);
    keyboardEngine()
    p.pop();
  }
  p.pop();

  
  if (typeof captureFrame === 'function') captureFrame();
}

function setTextColor(switcher) {
  if (switcher % 6 == 0) {
    strkColor = inp1;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 1) {
    strkColor = inp2;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 2) {
    strkColor = inp3;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 3) {
    strkColor = inp4;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 4) {
    strkColor = inp5;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
  }
  if (switcher % 6 == 5) {
    strkColor = inp6;
    bkgdStrokeColor = p.lerpColor(strkColor, bkgdColor, 0.75);
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
