// P5JS Instance Mode - Self-contained ES module for Cables P5Instance Op
// Generated automatically by refactor_instance.js
var p;

export default function(pInstance, op, initialWidth, initialHeight) {
    p = pInstance;

    // --- INLINED DEPENDENCIES ---
    
// --- INLINED DEPENDENCY: preset.js ---
var customPresets = {
    "stacks": {
        "column": 22,
        "row": 8,
        "tracking": 4,
        "lineSpace": 12,
        "typeX": 20,
        "typeY": 18,
        "speed": -3,
        "xOffset": 5.1,
        "yOffset": 59.1,
        "yWave": 100,
        "yWavezRot": 35,
        "yWavexStr": 7,
        "fullText": true
    },
    "bricks": {
        "column": 20,
        "row": 9,
        "tracking": 17,
        "lineSpace": 7,
        "typeX": 13,
        "typeY": 20,
        "speed": -4,
        "xWave": 86,
        "xStrechWave": 25,
        "xStrechWaveChecked": 1.5708, // p.PI/2
        "fullText": true,
        "color1": "#ffffff",
        "bkgdColor": "#000000",
        "inpNumber": 1
    },
    "simple_z": {
        "column": 28,
        "row": 15,
        "tracking": 5,
        "lineSpace": 5,
        "typeX": 20,
        "typeY": 40,
        "speed": -4,
        "xOffset": 9.1,
        "zWave": 90,
        "xRotCamera": 33,
        "yRotCamera": -27,
        "zRotCamera": 24,
        "fullText": true
    },
    "complex_z": {
        "column": 38,
        "row": 10,
        "tracking": 5,
        "lineSpace": 6,
        "typeX": 8,
        "typeY": 21,
        "typeStroke": 0.9,
        "speed": 2,
        "xOffset": 4.1,
        "yOffset": 3.1,
        "zWave": 41,
        "xWave": 63,
        "yWave": 25,
        "yWavezRot": 22,
        "xRotCamera": 26,
        "yRotCamera": -39,
        "zRotCamera": 15,
        "zoomCamera": 200,
        "yWaveChecked": 3.1416, // p.PI
        "fullText": true,
        "color1": "#ffffff",
        "bkgdColor": "#000000",
        "inpNumber": 1
    },
    "zebra": {
        "column": 50,
        "row": 8,
        "tracking": 7,
        "lineSpace": 18.5,
        "typeX": 6,
        "typeY": 20,
        "typeStroke": 1.0,
        "speed": -4,
        "xOffset": 6.1,
        "yOffset": 5.1,
        "yWave": 33,
        "yWavezRot": 18,
        "yStrechWave": 35,
        "fullText": true
    },
    "harlequin": {
        "column": 40,
        "row": 7,
        "tracking": 5,
        "lineSpace": 11,
        "typeX": 9,
        "typeY": 19,
        "typeStroke": 1.1,
        "speed": 2,
        "xOffset": 2.1,
        "yOffset": 59.1,
        "yStrechWave": 58,
        "fullText": true,
        "color1": "#ffffff",
        "bkgdColor": "#000000",
        "inpNumber": 1
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
var strecherX = 0;
var strecherY = 0;

// FIELD
var column = 21;
var row = 21;
var tracking = 5;
var lineSpace = 5;
var xSpace, ySpace;

// WAVE
var speed = 2;
var xOffset = 3.1416; // p.PI
var yOffset = 3.1416; // p.PI
var zWave = 0;
var zWaver = 0;
var zWaveChecked = 0;
var xWave = 0;
var xWaver = 0;
var xWaveChecked = 0;
var yWave = 0;
var yWaver = 0;
var yWaveChecked = 0;
var yWavezRot = 0;
var yWavezRoter = 0;
var yWavexStr = 0;
var yWavexStrer = 0;
var xStrechWave = 0;
var xStrechWaveChecked = 0;
var yStrechWave = 0;
var yStrechWaveChecked = 0;

// CAMERA
var xRotCamera = 0, yRotCamera = 0, zRotCamera = 0;
var zoomCamera = 0;

// STRING
var letter_select, inpText = "SPACE-TYPE-GENERATOR";
var runLength;
var fullText = false;

// COLOR
var strkColor;
var bkgdColor;
var inp1, inp2, inp3, inp4, inp5, inp6;
var inpNumber = 1;

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
  yWaver = 0;
  column = 33;
  row = 7;
  tracking = 5;
  lineSpace = 5;
  typeX = 20;
  typeY = 40;
  typeStroke = 2;
  speed = -2;
  xOffset = 3.1;
  yOffset = 3.1;
  xWave = 0;
  zWave = 0;
  xStrechWave = 0;
  yStrechWave = 0;
  yWave = 0;
  yWavezRot = 0;
  yWavexStr = 0;
  xRotCamera = 0;
  yRotCamera = 0;
  zRotCamera = 0;
  zoomCamera = 0;

  xStrechWaveChecked = 0;
  yStrechWaveChecked = 0;
  xWaveChecked = 0;
  yWaveChecked = 0;
  zWaveChecked = 0;
  fullText = false;

  inp1 = p.color('#000000');
  inp2 = p.color('#ff0000');
  inp3 = p.color('#0000ff');
  inp4 = p.color('#ffff00');
  inp5 = p.color('#ffffff');
  inp6 = p.color('#760089');
  bkgdColor = p.color('#ffffff');

  inpNumber = 1;
  inpText = "SPACE-TYPE-GENERATOR";

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

  if (settings.column !== undefined) column = settings.column;
  if (settings.row !== undefined) row = settings.row;
  if (settings.tracking !== undefined) tracking = settings.tracking;
  if (settings.lineSpace !== undefined) lineSpace = settings.lineSpace;
  if (settings.typeX !== undefined) typeX = settings.typeX;
  if (settings.typeY !== undefined) typeY = settings.typeY;
  if (settings.typeStroke !== undefined) typeStroke = settings.typeStroke;
  if (settings.speed !== undefined) speed = settings.speed;
  if (settings.xOffset !== undefined) xOffset = settings.xOffset;
  if (settings.yOffset !== undefined) yOffset = settings.yOffset;
  if (settings.xWave !== undefined) xWave = settings.xWave;
  if (settings.zWave !== undefined) zWave = settings.zWave;
  if (settings.xStrechWave !== undefined) xStrechWave = settings.xStrechWave;
  if (settings.yStrechWave !== undefined) yStrechWave = settings.yStrechWave;
  if (settings.yWave !== undefined) yWave = settings.yWave;
  if (settings.yWavezRot !== undefined) yWavezRot = settings.yWavezRot;
  if (settings.yWavexStr !== undefined) yWavexStr = settings.yWavexStr;
  if (settings.xRotCamera !== undefined) xRotCamera = settings.xRotCamera;
  if (settings.yRotCamera !== undefined) yRotCamera = settings.yRotCamera;
  if (settings.zRotCamera !== undefined) zRotCamera = settings.zRotCamera;
  if (settings.zoomCamera !== undefined) zoomCamera = settings.zoomCamera;

  if (settings.xStrechWaveChecked !== undefined) xStrechWaveChecked = settings.xStrechWaveChecked;
  if (settings.yStrechWaveChecked !== undefined) yStrechWaveChecked = settings.yStrechWaveChecked;
  if (settings.xWaveChecked !== undefined) xWaveChecked = settings.xWaveChecked;
  if (settings.yWaveChecked !== undefined) yWaveChecked = settings.yWaveChecked;
  if (settings.zWaveChecked !== undefined) zWaveChecked = settings.zWaveChecked;
  if (settings.fullText !== undefined) fullText = settings.fullText;

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

  if (data.column !== undefined) column = Number(data.column);
  if (data.row !== undefined) row = Number(data.row);
  if (data.tracking !== undefined) tracking = Number(data.tracking);
  if (data.lineSpace !== undefined) lineSpace = Number(data.lineSpace);
  if (data.typeX !== undefined) typeX = Number(data.typeX);
  if (data.typeY !== undefined) typeY = Number(data.typeY);
  if (data.typeStroke !== undefined) typeStroke = Number(data.typeStroke);
  if (data.speed !== undefined) speed = Number(data.speed);
  if (data.xOffset !== undefined) xOffset = Number(data.xOffset);
  if (data.yOffset !== undefined) yOffset = Number(data.yOffset);
  if (data.xWave !== undefined) xWave = Number(data.xWave);
  if (data.zWave !== undefined) zWave = Number(data.zWave);
  if (data.xStrechWave !== undefined) xStrechWave = Number(data.xStrechWave);
  if (data.yStrechWave !== undefined) yStrechWave = Number(data.yStrechWave);
  if (data.yWave !== undefined) yWave = Number(data.yWave);
  if (data.yWavezRot !== undefined) yWavezRot = Number(data.yWavezRot);
  if (data.yWavexStr !== undefined) yWavexStr = Number(data.yWavexStr);
  if (data.xRotCamera !== undefined) xRotCamera = Number(data.xRotCamera);
  if (data.yRotCamera !== undefined) yRotCamera = Number(data.yRotCamera);
  if (data.zRotCamera !== undefined) zRotCamera = Number(data.zRotCamera);
  if (data.zoomCamera !== undefined) zoomCamera = Number(data.zoomCamera);

  if (data.xStrechWaveChecked !== undefined) xStrechWaveChecked = Number(data.xStrechWaveChecked);
  if (data.yStrechWaveChecked !== undefined) yStrechWaveChecked = Number(data.yStrechWaveChecked);
  if (data.xWaveChecked !== undefined) xWaveChecked = Number(data.xWaveChecked);
  if (data.yWaveChecked !== undefined) yWaveChecked = Number(data.yWaveChecked);
  if (data.zWaveChecked !== undefined) zWaveChecked = Number(data.zWaveChecked);
  if (data.fullText !== undefined) fullText = Boolean(data.fullText) || data.fullText === 'true';

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
        column: column,
        row: row,
        tracking: tracking,
        lineSpace: lineSpace,
        typeX: typeX,
        typeY: typeY,
        typeStroke: typeStroke,
        speed: speed,
        xOffset: xOffset,
        yOffset: yOffset,
        xWave: xWave,
        zWave: zWave,
        xStrechWave: xStrechWave,
        yStrechWave: yStrechWave,
        yWave: yWave,
        yWavezRot: yWavezRot,
        yWavexStr: yWavexStr,
        xRotCamera: xRotCamera,
        yRotCamera: yRotCamera,
        zRotCamera: zRotCamera,
        zoomCamera: zoomCamera,
        xStrechWaveChecked: xStrechWaveChecked,
        yStrechWaveChecked: yStrechWaveChecked,
        xWaveChecked: xWaveChecked,
        yWaveChecked: yWaveChecked,
        zWaveChecked: zWaveChecked,
        fullText: fullText,
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

  xSpace = typeX + tracking;
  ySpace = typeY + lineSpace + yStrechWave / 2;

  p.noFill();
  p.strokeWeight(typeStroke);

  p.push();
  // p.camera
  p.translate(0, 0, zoomCamera);
  p.rotateX(p.radians(xRotCamera));
  p.rotateY(p.radians(yRotCamera));
  p.rotateZ(p.radians(zRotCamera));

  if (fullText === true) {
    runLength = row * column;
    p.translate(-column * xSpace / 2, -row * ySpace / 2);
  } else {
    runLength = inpText.length;
    if (inpText.length >= column) {
      p.translate(-column * xSpace / 2, -p.floor(inpText.length / column) * ySpace / 2);
    } else {
      p.translate(-inpText.length * xSpace / 2, -p.floor(inpText.length / column) * ySpace / 2);
    }
  }

  // THE TYPE
  for (var i = 0; i < runLength; i++) {
    if (fullText === true) {
      letter_select = i % inpText.length;
    } else {
      letter_select = i;
    }

    setTextColor(p.floor(i / column));
    p.stroke(strkColor);

    zWaver = sinEngine(zWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1) * zWave;
    xWaver = p.map(sinEngine(xWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1), -1, 1, 0, xWave);
    yWaver = sinEngine(yWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1) * yWave;

    yWavezRoter = cosEngine(yWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1) * yWavezRot;
    yWavexStrer = p.map(cosEngine2(yWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1), -1, 1, 0, yWavexStr);

    strecherX = p.map(sinEngine(xStrechWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1), -1, 1, 0, xStrechWave) + yWavexStrer;

    if (p.floor(i / column) % 2 == 1) {
      strecherY = p.map(sinEngine(yStrechWaveChecked, xOffset, i % column, yOffset, p.floor(i / column), speed, 1), -1, 1, 0, yStrechWave);
    } else {
      strecherY = p.map(sinEngine(yStrechWaveChecked + p.PI, xOffset, i % column, yOffset, p.floor(i / column), speed, 1), -1, 1, 0, yStrechWave);
    }

    p.push();
    p.translate((i % column) * xSpace + xWaver, p.floor(i / column) * ySpace + yWaver, zWaver);
    p.translate(-(typeX + strecherX) / 2, -(typeY + strecherY) / 2);

    // rotation adjustments
    var preZAnchX = sinEngine(zWaveChecked, xOffset, (i % column) - 1, yOffset, p.floor((i) / column), speed, 1) * zWave;
    var postZAnchX = sinEngine(zWaveChecked, xOffset, (i % column) + 1, yOffset, p.floor((i) / column), speed, 1) * zWave;
    var diffZAnchorX = postZAnchX - preZAnchX;
    var newYrot = p.atan2(p.abs(diffZAnchorX), 2 * xSpace);
    if (preZAnchX > postZAnchX) { p.rotateY(newYrot); } else { p.rotateY(-newYrot); }

    var preZAnchY = sinEngine(zWaveChecked, xOffset, i % column, yOffset, p.floor(i / column) - 1, speed, 1) * zWave;
    var postZAnchY = sinEngine(zWaveChecked, xOffset, i % column, yOffset, p.floor(i / column) + 1, speed, 1) * zWave;
    var diffZAnchorY = postZAnchY - preZAnchY;
    var newXrot = p.atan2(p.abs(diffZAnchorY), 2 * ySpace);
    if (preZAnchY > postZAnchY) { p.rotateX(-newXrot); } else { p.rotateX(newXrot); }

    p.rotateZ(p.radians(yWavezRoter));
    keyboardEngine();
    p.pop();
  }

  p.pop();

  if (typeof captureFrame === 'function') captureFrame();
}

function sinEngine(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var sinus = p.sin((p.frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset));
  var sign = (sinus >= 0 ? 1 : -1);
  var sinerSquare = sign * (1 - p.pow(1 - p.abs(sinus), slopeN));
  return sinerSquare;
}

function cosEngine(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var cosus = p.cos((p.frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset));
  var sign = (cosus >= 0 ? 1 : -1);
  var coserSquare = sign * (1 - p.pow(1 - p.abs(cosus), slopeN));
  return coserSquare;
}

function cosEngine2(Offset, xLength, xCounter, yLength, yCounter, Speed, slopeN) {
  var cosus = p.cos((p.frameCount * Speed / 100 + xCounter / xLength + yCounter / yLength + Offset) * 2);
  var sign = (cosus >= 0 ? 1 : -1);
  var coserSquare = sign * (1 - p.pow(1 - p.abs(cosus), slopeN));
  return coserSquare;
}

function setTextColor(switcher) {
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
