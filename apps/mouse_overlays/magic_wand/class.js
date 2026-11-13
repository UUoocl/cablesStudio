/**
 * Represents a single sparkly particle (star) in the magic wand effect.
 */
class Star {
  /**
   * Creates a new Star.
   * @param {number} x - Initial X position.
   * @param {number} y - Initial Y position.
   * @param {number} vx - Initial X velocity.
   * @param {number} vy - Initial Y velocity.
   * @param {number[]|string} fillColor - RGB color array [r, g, b] or hex string.
   */
  constructor(x, y, vx, vy, fillColor) {
    this.position = createVector(x, y);
    this.velocity = createVector(vx, vy);
    this.acceleration = createVector(0, 0);

    if (Array.isArray(fillColor)) {
      this.fillColor = fillColor;
    } else if (typeof fillColor === 'string' && typeof parseColorToRgb === 'function') {
      this.fillColor = parseColorToRgb(fillColor) || [255, 255, 0];
    } else {
      this.fillColor = [255, 255, 0];
    }

    this.rot = random(TWO_PI);
    const maxSize = (window.magicWandConfig && typeof window.magicWandConfig.starSize === 'number')
      ? window.magicWandConfig.starSize
      : 10;
    this.size = random(1, maxSize);

    this.life = 255;
    this.done = false;
    this.rand = random() > 0.5;
  }

  /**
   * Updates the star's position, velocity, and lifespan.
   */
  update() {
    this.finished();
    const decay = (window.magicWandConfig && typeof window.magicWandConfig.starDecay === 'number')
      ? window.magicWandConfig.starDecay
      : 5;
    this.life -= decay;

    if (this.rand) {
      this.acceleration = p5.Vector.random2D().mult(0.05);
    }

    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
  }

  /**
   * Renders the star to the canvas.
   */
  display() {
    fill(this.fillColor[0], this.fillColor[1], this.fillColor[2], this.life);
    push();
    translate(this.position.x, this.position.y);
    rotate(this.rot);

    noStroke();
    beginShape();
    vertex(0, -this.size);
    quadraticVertex(0, 0, this.size, 0);
    quadraticVertex(0, 0, 0, this.size);
    quadraticVertex(0, 0, -this.size, 0);
    quadraticVertex(0, 0, 0, -this.size);
    endShape(CLOSE);
    pop();
  }

  /**
   * Checks if the star's life has ended.
   */
  finished() {
    if (this.life < 0) {
      this.done = true;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Star;
}

