/*
----- Coding Tutorial by Patt Vira ----- 
Name: Sparkly Magic Wand
Video Tutorial: https://youtu.be/NW6fw_8s_0Y

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
Adapted for Cables.gl IframeFromAttachments (High-Performance BroadcastChannel Mode)
*/

let stars = [];
let lastPosX = null;
let lastPosY = null;
const MAX_STARS = 300;

// Palette of colors for button bursts (Button 1 -> Index 0, Button 2 -> Index 1, etc.)
let buttonColors = [
    [255, 0, 255],     // Button 1 (index 0) - Magenta
    [129, 210, 235],   // Button 2 (index 1) - Sky Blue
    [255, 215, 0],     // Button 3 (index 2) - Gold
    [0, 255, 128],     // Button 4 (index 3) - Spring Green
    [255, 102, 0],     // Button 5 (index 4) - Orange
    [180, 100, 255],   // Button 6 (index 5) - Violet
    [255, 50, 50],     // Button 7 (index 6) - Red
    [0, 200, 255]      // Button 8 (index 7) - Deep Cyan
];

function setup() {
    const w = window.SCENE_WIDTH || windowWidth;
    const h = window.SCENE_HEIGHT || windowHeight;
    createCanvas(w, h);
    pixelDensity(1);
    console.log(`%c[magicWand:sketch] setup() initialized. Canvas size: ${width}x${height}`, "color: #00ff00; font-weight: bold;");
}

function windowResized() {
    const w = window.SCENE_WIDTH || windowWidth;
    const h = window.SCENE_HEIGHT || windowHeight;
    resizeCanvas(w, h);
    console.log(`%c[magicWand:sketch] windowResized() -> Canvas resized to: ${width}x${height}`, "color: #00ff00;");
}

// Handler called by cablesBridge.js when mousePosition is received
window.onPositionUpdate = function (posX, posY) {
    if (posX !== lastPosX || posY !== lastPosY) {
        let moveColor = window.trailColor || [255, 255, 0];
        stars.push(new Star(posX, posY, 0, 0, moveColor));
        lastPosX = posX;
        lastPosY = posY;

        if (stars.length > MAX_STARS) {
            stars.splice(0, stars.length - MAX_STARS);
        }
    }
};

// Handler called by cablesBridge.js when mouseButton is received
window.triggerBurst = function (posX, posY, button) {
    let x = (posX !== undefined) ? posX : (window.virtualMouseX || width / 2);
    let y = (posY !== undefined) ? posY : (window.virtualMouseY || height / 2);

    let colors = (Array.isArray(window.buttonColors) && window.buttonColors.length > 0) ? window.buttonColors : buttonColors;

    let btnNum = 1;
    if (typeof button === "number") {
        btnNum = button;
    } else if (typeof button === "string") {
        let match = button.match(/\d+/);
        if (match) btnNum = parseInt(match[0], 10);
    }

    // Button 1 -> array item 0, Button 2 -> array item 1, etc.
    let colorIdx = Math.max(0, btnNum - 1) % colors.length;
    let burstColor = colors[colorIdx] || [255, 0, 255];

    let num = Math.floor(Math.random() * 30 + 20);
    for (let i = 0; i < num; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 3 + 2;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        stars.push(new Star(x, y, vx, vy, burstColor));
    }

    if (stars.length > MAX_STARS) {
        stars.splice(0, stars.length - MAX_STARS);
    }
};

function draw() {
    clear();
    background(0, 0, 0, 0);

    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update();
        stars[i].display();

        if (stars[i].done) {
            stars.splice(i, 1);
        }
    }
}
