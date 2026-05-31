function drawText(p){   // straight text
  var w = width;
  var h = height;
  pg[p] = createGraphics(w, h);
  pg[p].background(0);
  pg[p].noStroke();
  pg[p].fill(255);
  pg[p].textFont(tFont[selFont]);
  pg[p].textSize(pgTextSize);
  pg[p].textAlign(CENTER);
  pg[p].push();
    pg[p].translate(w/2, h/2);
    pg[p].translate(0, -(inputText.length - 1) * pgTextSize * tFontFactor[selFont]/2);
    for(var m = 0; m < inputText.length; m++){
      pg[p].push();
        pg[p].translate(0, m * pgTextSize * tFontFactor[selFont]);
        pg[p].text(inputText[m], 0, pgTextSize * tFontFactor[selFont]/2);
      pg[p].pop();
    }
  pg[p].pop();
}
