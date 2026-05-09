/**
 * P5.js Example Sketch for Cables
 * This sketch demonstrates instance mode, external data input, 
 * and sending data back to Cables.
 */
export default function(p, op, w, h) {
    let canvasW = w || 512;
    let canvasH = h || 512;
    let inputData = { x: 0, y: 0 };
    let textX = 0;

    // Standard P5 setup
    p.setup = () => {
        p.createCanvas(canvasW, canvasH);
        p.textSize(48);
        p.textAlign(p.CENTER, p.CENTER);
        textX = p.width / 2;
    };

    // Standard P5 draw loop
    p.draw = () => {
        // Dark background
        p.background(10, 15, 30);

        // Draw a static rectangle to verify basic rendering
        p.fill(50, 100, 255);
        p.noStroke();
        p.rect(50, 50, 100, 100);

        // Draw scrolling text
        p.fill(0, 255, 200);
        p.text("Hello World", textX, p.height / 2);

        // Update scroll position
        textX += 3;
        if (textX > p.width + 150) {
            textX = -150;
        }

        // Visualize mouse input from Cables
        p.noFill();
        p.stroke(255, 100, 100);
        p.strokeWeight(2);
        p.ellipse(inputData.x * p.width, inputData.y * p.height, 50, 50);

        // Optional: Send some state back to Cables
        if (op.setOutData) {
            op.setOutData({
                "frame": p.frameCount,
                "textX": textX
            });
        }
    };

    p.onDataChange = (data) => {
        if (data && typeof data === 'object') {
            inputData = data;
        }
    };
}
