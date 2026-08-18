/**
 * Trassel Generative Brush Art
 * Adapted for Cables.gl IframeFromAttachments (BroadcastChannel Mode)
 */

(function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const body = document.body;

    const modes = [
        { id: 'brush', t: 0 },
        { id: 'line', t: 0 },
        { id: 'dash', t: 4 },
        { id: 'worm', t: 4 }
    ];

    let width = window.innerWidth || 1280;
    let height = window.innerHeight || 720;
    let canvasWidth = width * dpr;
    let canvasHeight = height * dpr;

    const brushDefaults = { x: 0.5, tx: 0.5, ttx: 0.5, y: 0, ty: 0.9, w: 1, tw: 1 };

    // Primary viewport display canvas
    const mainCanvas = document.createElement('canvas');
    mainCanvas.id = 'trasselCanvas';
    mainCanvas.className = 'trassel-main';
    const mainContext = mainCanvas.getContext('2d');
    body.appendChild(mainCanvas);

    // Persistent offscreen canvas for accumulating line trails
    const trailsCanvas = document.createElement('canvas');
    const trailsContext = trailsCanvas.getContext('2d');

    let brushes = [];
    let virtualScrollTop = 0;
    let currentTop = 0;
    let lastTop = -1;
    let currentMode = modes[0];
    let scrollMultiplier = 3.0;

    function initCanvases() {
        width = window.SCENE_WIDTH || window.innerWidth || 1280;
        height = window.SCENE_HEIGHT || window.innerHeight || 720;
        canvasWidth = width * dpr;
        canvasHeight = height * dpr;

        mainCanvas.width = canvasWidth;
        mainCanvas.height = canvasHeight;
        mainCanvas.style.width = width + 'px';
        mainCanvas.style.height = height + 'px';

        trailsCanvas.width = canvasWidth;
        trailsCanvas.height = canvasHeight;

        mainContext.scale(dpr, dpr);
        trailsContext.scale(dpr, dpr);
        trailsContext.globalCompositeOperation = 'multiply';
    }

    function reset() {
        initCanvases();

        currentTop = 0;
        lastTop = -1;
        virtualScrollTop = 0;

        // Clear trails
        trailsContext.save();
        trailsContext.setTransform(1, 0, 0, 1, 0, 0);
        trailsContext.clearRect(0, 0, trailsCanvas.width, trailsCanvas.height);
        trailsContext.restore();

        brushes = [
            { ...brushDefaults, color: 'coral' },
            { ...brushDefaults, color: 'indigo' },
            { ...brushDefaults, color: 'deepskyblue' },
            { ...brushDefaults, color: 'antiquewhite' },
            { ...brushDefaults, color: '#222222' }
        ];

        brushes.forEach(brush => {
            brush.points = [];
        });
    }

    function step() {
        lastTop = currentTop;
        currentTop = Math.round(currentTop + (virtualScrollTop - currentTop) * 0.2);

        const dy = currentTop - lastTop;
        if (dy !== 0 && lastTop !== -1) {
            // Scroll existing trails on the offscreen canvas
            trailsContext.save();
            trailsContext.setTransform(1, 0, 0, 1, 0, 0);
            trailsContext.globalCompositeOperation = 'copy';
            trailsContext.drawImage(trailsCanvas, 0, -dy * dpr);
            trailsContext.restore();
        }

        const span = width * 0.9;
        const left = width / 2 - span / 2;
        const velocity = Math.min(Math.abs(currentTop - lastTop) / 200, 0.1);

        brushes.forEach((brush, i) => {
            brush.tx += (brush.ttx - brush.tx) * velocity * 1.2;
            brush.x += (brush.tx - brush.x) * velocity;
            brush.y += (brush.ty - brush.y) * velocity * (brush.w * 0.25);
            brush.w += (brush.tw - brush.w) * velocity * 0.6;

            brush.points.push({
                x: left + (brush.x * span),
                y: Math.round(currentTop + brush.y * height),
                w: 2 + brush.w * Math.min(width * 0.1, 100)
            });

            let [p1, p2, p3] = brush.points;

            if (p2 && p3 && Math.abs(p2.y - p3.y) < currentMode.t) {
                brush.points.pop();
            }

            if (brush.points.length === 3) {
                // Map coordinates relative to viewport
                const y1 = p1.y - currentTop;
                const y2 = p2.y - currentTop;
                const y3 = p3.y - currentTop;

                trailsContext.beginPath();

                if (currentMode.id === 'brush') {
                    trailsContext.moveTo(p1.x - p1.w / 2, y1);
                    trailsContext.quadraticCurveTo(
                        p2.x - p2.w / 2, y2,
                        p3.x - p3.w / 2, y3
                    );
                    trailsContext.lineTo(p3.x + p3.w / 2, y3);
                    trailsContext.quadraticCurveTo(
                        p2.x + p2.w / 2, y2,
                        p1.x + p1.w / 2, y1
                    );
                    trailsContext.fillStyle = brush.color;
                    trailsContext.fill();
                } else if (currentMode.id === 'line') {
                    trailsContext.moveTo(p1.x, y1);
                    trailsContext.quadraticCurveTo(p2.x, y2, p3.x, y3);
                    trailsContext.strokeStyle = brush.color;
                    trailsContext.lineWidth = 4;
                    trailsContext.stroke();
                } else if (currentMode.id === 'dash') {
                    if (p1.x < p3.x) {
                        trailsContext.moveTo(p3.x - p3.w / 2, y3);
                        trailsContext.lineTo(p1.x + p1.w / 2, y1);
                    } else {
                        trailsContext.moveTo(p3.x + p3.w / 2, y3);
                        trailsContext.lineTo(p1.x - p1.w / 2, y1);
                    }
                    trailsContext.strokeStyle = brush.color;
                    trailsContext.lineWidth = 2;
                    trailsContext.stroke();
                } else if (currentMode.id === 'worm') {
                    trailsContext.moveTo(p1.x - p1.w / 2, y1);
                    trailsContext.quadraticCurveTo(
                        p2.x - p2.w / 2, y2,
                        p3.x - p3.w / 2, y3
                    );
                    trailsContext.lineTo(p3.x + p3.w / 2, y3);
                    trailsContext.quadraticCurveTo(
                        p2.x + p2.w / 2, y2,
                        p1.x + p1.w / 2, y1
                    );
                    trailsContext.fillStyle = brush.color;
                    trailsContext.fill();
                }

                brush.points = [p3];
            }

            if (Math.abs(brush.ttx - brush.tx) < 0.05) {
                brush.ttx = Math.random();
            }

            if (Math.abs(brush.tw - brush.w) < 0.1) {
                brush.tw = Math.random();
            }

            let oy = 0.2 * i / brushes.length;
            brush.ty = currentTop < lastTop ? 0.1 + oy : 0.8 + oy;
        });
    }

    function render() {
        if (Math.abs(virtualScrollTop - currentTop) >= 1 || lastTop === -1) {
            step();
            step();
        }

        // Composite onto main canvas
        mainContext.clearRect(0, 0, width, height);

        // 1. Draw persistent trails
        mainContext.drawImage(trailsCanvas, 0, 0, width, height);

        // 2. Draw brush heads
        brushes.forEach(brush => {
            if (!brush.points || brush.points.length === 0) return;
            let p = brush.points[0];
            let py = p.y - currentTop;
            mainContext.beginPath();
            mainContext.fillStyle = brush.color;
            mainContext.arc(p.x, py, p.w * 0.5, 0, 2 * Math.PI);
            mainContext.fill();
        });

        requestAnimationFrame(render);
    }

    // Public API hooks for cablesBridge
    window.onScrollUpdate = function (scrollY) {
        if (typeof scrollY === 'number' && !isNaN(scrollY)) {
            virtualScrollTop += scrollY * scrollMultiplier;
        }
    };

    window.cycleMode = function () {
        currentMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
    };

    window.setMode = function (modeId) {
        const found = modes.find(m => m.id === String(modeId).toLowerCase());
        if (found) currentMode = found;
    };

    window.resetSketch = function () {
        reset();
    };

    window.resizeTrassel = function (w, h) {
        window.SCENE_WIDTH = w;
        window.SCENE_HEIGHT = h;
        initCanvases();
    };

    window.onresize = () => {
        if (window.innerWidth !== width || window.innerHeight !== height) {
            reset();
        }
    };

    document.body.onclick = () => {
        window.cycleMode();
    };

    reset();
    render();
})();
