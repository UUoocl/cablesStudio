class Star {
    constructor(x, y, vx, vy, fillColor) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.fillColor = fillColor || [255, 255, 0];

        this.rot = Math.random() * Math.PI * 2;
        this.size = Math.random() * 9 + 1;

        this.life = 255;
        this.done = false;
        this.rand = Math.random() > 0.5;
    }

    update() {
        this.life -= 5;
        if (this.life <= 0) {
            this.done = true;
            return;
        }

        if (this.rand) {
            const angle = Math.random() * Math.PI * 2;
            this.vx += Math.cos(angle) * 0.05;
            this.vy += Math.sin(angle) * 0.05;
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    display() {
        const ctx = drawingContext;
        const s = this.size;
        const [r, g, b] = this.fillColor;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = `rgba(${r},${g},${b},${this.life / 255})`;

        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}