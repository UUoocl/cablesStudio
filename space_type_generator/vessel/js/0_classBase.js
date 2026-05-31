class Base {
  constructor(){
    this.lines = [];

    for(var m = 0; m < inputText.length; m++){
      this.lines[m] = new Line(m);
    }
  }

  run(){
    for(var m = 0; m < inputText.length; m++){
      this.lines[m].run();
    }
  }

  resetMain(){
    for(var m = 0; m < inputText.length; m++){
      this.lines[m].resetMain();
    }
  }
}
