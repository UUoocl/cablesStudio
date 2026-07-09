// Ops.Team.CablesStudio.Teleprompter.js

// Define inputs
const inChannelName = op.inString("Broadcast Channel Name", "teleprompter-sync");
const inText = op.inString("Text", "");
const inPlay = op.inBool("Play", false);
const inAutoplay = op.inBool("Autoplay", false);

const inOpen = op.inTriggerButton("Open Child Window");
const inClose = op.inTriggerButton("Close Child Window");
const inReset = op.inTriggerButton("Reset");

const inSpeed = op.inFloat("Speed", 20);
const inSpeedUp = op.inTriggerButton("Speed Up");
const inSpeedDown = op.inTriggerButton("Speed Down");

const inFontSize = op.inInt("Font Size", 60);
const inFontBigger = op.inTriggerButton("Font Bigger");
const inFontSmaller = op.inTriggerButton("Font Smaller");

const inFlipX = op.inBool("Flip X", false);
const inFlipY = op.inBool("Flip Y", false);
const inFocusView = op.inBool("Focus View", false);

const inTextColor = op.inString("Foreground Color", "#ffffff");
const inBkgdColor = op.inString("Background Color", "#141414");

const inWinName = op.inString("Window Name", "Teleprompter");
const inWinWidth = op.inInt("Window Width", 1024);
const inWinHeight = op.inInt("Window Height", 768);
const inWinX = op.inInt("Window X", 100);
const inWinY = op.inInt("Window Y", 100);

// Define outputs
const outOnOpen = op.outTrigger("On Open");
const outWindowStatus = op.outString("Window Status", "closed");
const outOnPlay = op.outTrigger("On Play");
const outOnPause = op.outTrigger("On Pause");
const outOnNext = op.outTrigger("On Next");
const outOnPrev = op.outTrigger("On Previous");
const outOnReset = op.outTrigger("On Reset");
const outPlay = op.outBool("Play Out", false);
const outAutoplay = op.outBool("Autoplay Out", false);
const outSpeed = op.outNumber("Speed Out", 20);
const outFontSize = op.outNumber("Font Size Out", 60);
const outFlipX = op.outBool("Flip X Out", false);
const outFlipY = op.outBool("Flip Y Out", false);
const outTextColor = op.outString("Foreground Color Out", "#ffffff");
const outBkgdColor = op.outString("Background Color Out", "#141414");
const outFocusView = op.outBool("Focus View Out", false);
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Settings", [inChannelName, inTextColor, inBkgdColor, inWinName, inWinWidth, inWinHeight, inWinX, inWinY]);
op.setPortGroup("Controls", [inOpen, inClose, inReset, inText, inPlay, inAutoplay, inSpeed, inSpeedUp, inSpeedDown, inFontSize, inFontBigger, inFontSmaller, inFlipX, inFlipY, inFocusView]);

let bc = null;
let childWindow = null;
let lastSentText = null;

// Embedded HTML template
const templateHtml = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Teleprompter</title>
    <style>
        html {
            height: 100%;
        }
        * {
            padding: 0;
            margin: 0;
            box-sizing: border-box;
        }
        #tp-gui {
            background-color: #141414;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #fff;
            -webkit-font-smoothing: antialiased;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
        .tp-header {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 64px !important;
            background-color: #141414 !important;
            border-bottom: 2px solid #333 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0 20px !important;
            z-index: 10 !important;
            user-select: none !important;
            overflow: hidden !important;
        }
        .tp-header h1 {
            font-weight: normal;
            font-size: 20px;
            color: #4297d7;
            white-space: nowrap;
        }
        .tp-header h1 span.tp-clock {
            color: #fff;
            margin-left: 10px;
            font-family: monospace;
        }
        .tp-nav {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .tp-colors {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }
        .tp-color-input {
            appearance: none;
            -webkit-appearance: none;
            width: 32px;
            height: 32px;
            border: 2px solid #fff;
            border-radius: 50%;
            cursor: pointer;
            background: none;
            padding: 0;
        }
        .tp-color-input::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        .tp-color-input::-webkit-color-swatch {
            border: none;
            border-radius: 50%;
        }
        .tp-display-metrics {
            display: flex !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            flex-direction: column;
            gap: 4px;
            font-size: 11px !important;
            line-height: 14px !important;
            color: #ccc;
            flex-shrink: 0;
            height: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
        }
        .tp-metric-row {
            display: flex !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            align-items: center;
            justify-content: flex-start !important;
            gap: 6px;
            flex-shrink: 0 !important;
            font-size: 11px !important;
            line-height: 14px !important;
            height: 16px !important;
            min-height: 16px !important;
            max-height: 16px !important;
        }
        .tp-metric-label {
            width: 70px !important;
            text-align: left !important;
            display: inline-block !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            font-size: 11px !important;
            line-height: 14px !important;
            height: 14px !important;
        }
        .tp-font-display-val,
        .tp-speed-display-val {
            color: #4297d7 !important;
            font-weight: bold !important;
            display: inline-block !important;
            font-size: 11px !important;
            line-height: 14px !important;
            height: 14px !important;
        }
        .tp-range-input {
            display: inline-block !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100px !important;
            cursor: pointer;
            accent-color: #4297d7;
            background: #333;
            border-radius: 5px;
            height: 6px;
            outline: none;
        }
        .tp-auto-scroll {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #888;
            flex-shrink: 0;
        }
        .tp-auto-scroll input {
            cursor: pointer;
        }
        .tp-buttons {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .tp-btn {
            background: transparent;
            border: none;
            color: #fff;
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        .tp-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }
        .tp-btn.small svg {
            width: 16px;
            height: 16px;
        }
        .tp-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .tp-btn.active {
            color: #4297d7;
        }
        .tp-article {
            position: relative;
            height: 100%;
            background-color: #141414;
            overflow-y: scroll;
            scrollbar-width: none;
        }
        .tp-article::-webkit-scrollbar {
            display: none;
        }
        .tp-teleprompter {
            padding: 300px 50px 1000px 100px;
            font-size: 60px;
            line-height: 1.4;
            background-color: #141414;
            outline: none;
            opacity: 0;
            transition: opacity 0.25s;
            word-wrap: break-word;
        }
        .tp-teleprompter.ready {
            opacity: 1;
        }
        .tp-teleprompter p {
            padding-bottom: 15px;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
        }
        .tp-teleprompter p:last-child {
            border-bottom: 4px solid #4297d7;
        }
        .tp-teleprompter.flip-x {
            transform: rotateY(180deg);
            pointer-events: none;
            padding: 300px 100px 1000px 50px !important;
        }
        .tp-teleprompter.flip-y {
            transform: rotateX(180deg);
            pointer-events: none;
            padding: 1000px 50px 300px 100px !important;
        }
        .tp-teleprompter.flip-xy {
            transform: rotateX(180deg) rotateY(180deg);
            pointer-events: none;
            padding: 1000px 100px 300px 50px !important;
        }
        .tp-marker {
            position: fixed;
            left: 0;
            top: 213px;
            color: #4297d7;
            width: 32px;
            height: 32px;
            display: none;
            z-index: 100;
            pointer-events: none;
        }
        .tp-marker svg {
            width: 100%;
            height: 100%;
            fill: currentColor;
        }
        .tp-overlay {
            display: none;
            width: 100%;
            height: 100%;
            position: fixed;
            top: 64px;
            left: 0;
            z-index: 5;
            pointer-events: none;
        }
        .tp-overlay .top {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0));
        }
        .tp-overlay .bottom {
            position: fixed;
            top: 300px;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0));
        }
        .tp-teleprompter pre,
        .tp-teleprompter code {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
            font-family: monospace !important;
        }
    </style>
</head>
<body id="tp-gui">
    <header class="tp-header">
        <h1>Teleprompter</h1>
        <nav class="tp-nav">
            <div class="tp-colors">
                <input type="color" id="text-color" class="tp-color-input" value="#ffffff" title="Text Color">
                <input type="color" id="background-color" class="tp-color-input" value="#141414" title="Background Color">
            </div>
            <div class="tp-display-metrics">
                <div class="tp-metric-row">
                    <span class="tp-metric-label">Font (<span class="tp-font-display-val">60</span>):</span>
                    <input type="range" class="tp-font-slider tp-range-input" min="12" max="200" value="60">
                </div>
                <div class="tp-metric-row">
                    <span class="tp-metric-label">Speed (<span class="tp-speed-display-val">20</span>):</span>
                    <input type="range" class="tp-speed-slider tp-range-input" min="-50" max="50" value="20">
                </div>
            </div>
            <div class="tp-auto-scroll">
                <label>Auto Scroll: <input type="checkbox" id="auto-scroll"></label>
            </div>
            <div class="tp-buttons">
                <!-- Prev Button -->
                <button class="tp-btn small prev" title="Previous Slide">
                    <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </button>
                <!-- Next Button -->
                <button class="tp-btn small next" title="Next Slide">
                    <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </button>
                <!-- Dim Button -->
                <button class="tp-btn small dim-controls" title="Dim Controls">
                    <svg class="eye-open" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                </button>
                <!-- Reset Button -->
                <button class="tp-btn small reset" title="Reset Teleprompter">
                    <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                </button>
                <!-- Flip X Button -->
                <button class="tp-btn small flip-x" title="Flip Horizontally">
                    <svg viewBox="0 0 24 24"><path d="M19 8H5v2h14V8zm0 6H5v2h14v-2zM9 18v-4H7v4h2zm8 0v-4h-2v4h2z"/></svg>
                </button>
                <!-- Flip Y Button -->
                <button class="tp-btn small flip-y" title="Flip Vertically">
                    <svg viewBox="0 0 24 24"><path d="M8 19V5h2v14H8zm6 0V5h2v14h-2zM18 9h-4V7h4v2zm0 8h-4v-2h4v2z"/></svg>
                </button>
                <!-- Play/Pause Button -->
                <button class="tp-btn play" title="Play / Pause">
                    <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg class="pause-icon" style="display:none" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
            </div>
        </nav>
    </header>
    <article class="tp-article">
        <div class="tp-overlay">
            <div class="top"></div>
            <div class="bottom"></div>
        </div>
        <div class="tp-teleprompter" id="teleprompter">
            Loading notes...
        </div>
        <div class="tp-marker">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
    </article>

    <script>
        var bc = null;
        var channelName = null;
        var bcName = 'teleprompter-sync';
        var opId = 'teleprompter-op-id';
        var currentRawText = '';
        
        var TelePrompter = (function() {
            var elm = {};
            var initialized = false;
            var isPlaying = false;
            var scrollDelay = null;
            var lastFrameTime = 0;
            var scrollAccumulator = 0;
            
            var config = {
                backgroundColor: '#141414',
                dimControls: false,
                flipX: false,
                flipY: false,
                fontSize: 60,
                pageSpeed: 20,
                textColor: '#ffffff',
                autoScroll: false
            };

            function init() {
                if (initialized) return;
                cacheElements();
                bindEvents();
                initUI();
                initialized = true;
            }

            function cacheElements() {
                console.log("[Teleprompter] Starting cacheElements...");
                try {
                    elm.article = document.querySelector('.tp-article');
                    elm.backgroundColor = document.getElementById('background-color');
                    elm.body = document.getElementById('tp-gui');
                    elm.buttonDimControls = document.querySelector('.tp-btn.dim-controls');
                    elm.buttonFlipX = document.querySelector('.tp-btn.flip-x');
                    elm.buttonFlipY = document.querySelector('.tp-btn.flip-y');
                    elm.buttonPlay = document.querySelector('.tp-btn.play');
                    elm.buttonReset = document.querySelector('.tp-btn.reset');
                    elm.buttonPrev = document.querySelector('.tp-btn.prev');
                    elm.buttonNext = document.querySelector('.tp-btn.next');
                    elm.fontSizeValue = document.querySelector('.tp-font-display-val');
                    elm.fontSlider = document.querySelector('.tp-font-slider');
                    elm.header = document.querySelector('.tp-header');
                    elm.headerContent = document.querySelectorAll('.tp-header h1, .tp-header .tp-nav');
                    elm.marker = document.querySelector('.tp-marker');
                    elm.overlay = document.querySelector('.tp-overlay');
                    elm.speedValue = document.querySelector('.tp-speed-display-val');
                    elm.speedSlider = document.querySelector('.tp-speed-slider');
                    elm.teleprompter = document.querySelector('.tp-teleprompter');
                    elm.textColor = document.getElementById('text-color');
                    elm.autoScroll = document.getElementById('auto-scroll');
                    
                    console.log("[Teleprompter] cacheElements result:", {
                        article: !!elm.article,
                        backgroundColor: !!elm.backgroundColor,
                        body: !!elm.body,
                        buttonDimControls: !!elm.buttonDimControls,
                        buttonFlipX: !!elm.buttonFlipX,
                        buttonFlipY: !!elm.buttonFlipY,
                        buttonPlay: !!elm.buttonPlay,
                        fontSizeValue: !!elm.fontSizeValue,
                        fontSlider: !!elm.fontSlider,
                        header: !!elm.header,
                        speedValue: !!elm.speedValue,
                        speedSlider: !!elm.speedSlider,
                        teleprompter: !!elm.teleprompter,
                        textColor: !!elm.textColor,
                        autoScroll: !!elm.autoScroll
                    });
                } catch (e) {
                    console.error("[Teleprompter] Error caching elements:", e);
                }
            }

            function bindEvents() {
                elm.backgroundColor.addEventListener('input', handleBackgroundColor);
                elm.textColor.addEventListener('input', handleTextColor);
                elm.buttonDimControls.addEventListener('click', handleDim);
                elm.buttonFlipX.addEventListener('click', handleFlipX);
                elm.buttonFlipY.addEventListener('click', handleFlipY);
                elm.buttonPlay.addEventListener('click', handlePlay);
                elm.buttonReset.addEventListener('click', function() { handleReset(false); });
                
                elm.buttonPrev.addEventListener('click', function() { sendEvent('prev'); });
                elm.buttonNext.addEventListener('click', function() { sendEvent('next'); });

                elm.autoScroll.addEventListener('change', handleAutoScroll);
                elm.fontSlider.addEventListener('input', handleFontSliderInput);
                elm.speedSlider.addEventListener('input', handleSpeedSliderInput);

                window.addEventListener('keydown', navigate);
                window.addEventListener('resize', handleResize);
            }

            function handleFontSliderInput() {
                config.fontSize = parseInt(elm.fontSlider.value, 10) || 60;
                updateFontSize(true);
            }

            function handleSpeedSliderInput() {
                config.pageSpeed = parseInt(elm.speedSlider.value, 10) || 0;
                updateSpeed(true);
            }

            function initUI() {
                elm.article.scrollTop = 0;
                elm.teleprompter.style.paddingBottom = Math.ceil(window.innerHeight - elm.header.offsetHeight) + 'px';
                elm.teleprompter.classList.add('ready');
                applyConfig();
            }

            function handleResize() {
                if (elm.teleprompter && elm.header) {
                    elm.teleprompter.style.paddingBottom = Math.ceil(window.innerHeight - elm.header.offsetHeight) + 'px';
                }
            }

            function handleBackgroundColor() {
                config.backgroundColor = elm.backgroundColor.value;
                applyColorStyles();
                sendState('backgroundColor', config.backgroundColor);
            }

            function handleTextColor() {
                config.textColor = elm.textColor.value;
                applyColorStyles();
                sendState('textColor', config.textColor);
            }

            function hexToRgb(hex) {
                var shorthandRegex = /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i;
                hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                    return r + r + g + g + b + b;
                });
                var result = /^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            }

            function applyColorStyles() {
                elm.article.style.backgroundColor = config.backgroundColor;
                elm.body.style.backgroundColor = config.backgroundColor;
                elm.teleprompter.style.backgroundColor = config.backgroundColor;
                elm.teleprompter.style.color = config.textColor;

                var rgb = hexToRgb(config.backgroundColor) || { r: 20, g: 20, b: 20 };
                var topOverlay = elm.overlay ? elm.overlay.querySelector('.top') : null;
                var bottomOverlay = elm.overlay ? elm.overlay.querySelector('.bottom') : null;
                if (topOverlay) {
                    topOverlay.style.background = 'linear-gradient(to bottom, rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.85), rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0))';
                }
                if (bottomOverlay) {
                    bottomOverlay.style.background = 'linear-gradient(to top, rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.85), rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0))';
                }
            }

            function handleAutoScroll() {
                config.autoScroll = elm.autoScroll.checked;
                sendState('autoScroll', config.autoScroll);
                if (config.autoScroll && !isPlaying) {
                    start();
                } else if (!config.autoScroll && isPlaying) {
                    stop();
                }
            }

            function handleDim() {
                config.dimControls = !config.dimControls;
                updateDimUI();
                sendState('focusView', config.dimControls);
            }

            function updateDimUI() {
                elm.buttonDimControls.classList.toggle('active', config.dimControls);
                if (config.dimControls && isPlaying) {
                    elm.headerContent.forEach(e => e.style.opacity = '0.15');
                    elm.marker.style.display = 'block';
                    elm.overlay.style.display = 'block';
                } else {
                    elm.headerContent.forEach(e => e.style.opacity = '1');
                    elm.marker.style.display = 'none';
                    elm.overlay.style.display = 'none';
                }
            }

            // Remote control interfaces
            function handleFlipX() {
                config.flipX = !config.flipX;
                updateFlipUI();
                sendState('flipX', config.flipX);
            }

            function handleFlipY() {
                config.flipY = !config.flipY;
                updateFlipUI();
                sendState('flipY', config.flipY);
                if (config.flipY) {
                    elm.article.scrollTop = elm.teleprompter.offsetHeight + 100;
                } else {
                    elm.article.scrollTop = 0;
                }
            }

            function updateFlipUI() {
                elm.teleprompter.classList.remove('flip-x', 'flip-y', 'flip-xy');
                elm.buttonFlipX.classList.toggle('active', config.flipX);
                elm.buttonFlipY.classList.toggle('active', config.flipY);

                if (config.flipX && config.flipY) {
                    elm.teleprompter.classList.add('flip-xy');
                } else if (config.flipX) {
                    elm.teleprompter.classList.add('flip-x');
                } else if (config.flipY) {
                    elm.teleprompter.classList.add('flip-y');
                }
            }

            function updateFontSize(send = true) {
                console.log("[Teleprompter] updateFontSize called. fontSize:", config.fontSize, "send:", send);
                if (elm.fontSizeValue) elm.fontSizeValue.textContent = config.fontSize;
                if (elm.fontSlider) elm.fontSlider.value = config.fontSize;
                if (elm.teleprompter) {
                    elm.teleprompter.style.fontSize = config.fontSize + 'px';
                    elm.teleprompter.style.lineHeight = (config.fontSize * 1.4) + 'px';
                }
                if (send) {
                    sendState('fontSize', config.fontSize);
                }
            }

            function updateSpeed(send = true) {
                console.log("[Teleprompter] updateSpeed called. pageSpeed:", config.pageSpeed, "send:", send);
                if (elm.speedValue) elm.speedValue.textContent = config.pageSpeed;
                if (elm.speedSlider) elm.speedSlider.value = config.pageSpeed;
                if (send) {
                    sendState('speed', config.pageSpeed);
                }
            }

            function handlePlay() {
                console.log("[Teleprompter] Play/Pause toggled. Current playing status:", isPlaying);
                if (isPlaying) stop();
                else start();
            }

            function start() {
                console.log("[Teleprompter] Starting scroll...");
                if (isPlaying) return;
                isPlaying = true;
                if (elm.buttonPlay) {
                    var pi = elm.buttonPlay.querySelector('.play-icon');
                    var pa = elm.buttonPlay.querySelector('.pause-icon');
                    if (pi) pi.style.display = 'none';
                    if (pa) pa.style.display = 'block';
                }
                updateDimUI();
                lastFrameTime = 0;
                scrollAccumulator = 0;
                scrollDelay = requestAnimationFrame(pageScroll);
                sendPlayState(true);
            }

            function stop() {
                console.log("[Teleprompter] Stopping scroll...");
                if (!isPlaying) return;
                isPlaying = false;
                if (elm.buttonPlay) {
                    var pi = elm.buttonPlay.querySelector('.play-icon');
                    var pa = elm.buttonPlay.querySelector('.pause-icon');
                    if (pi) pi.style.display = 'block';
                    if (pa) pa.style.display = 'none';
                }
                if (scrollDelay) {
                    cancelAnimationFrame(scrollDelay);
                    scrollDelay = null;
                }
                updateDimUI();
                sendPlayState(false);
            }

            function handleReset(instant) {
                stop();
                var targetTop = config.flipY ? elm.teleprompter.offsetHeight + 100 : 0;
                if (instant) {
                    elm.article.scrollTop = targetTop;
                } else {
                    elm.article.scrollTo({ top: targetTop, behavior: 'smooth' });
                }
                sendEvent('reset');
            }

            function pageScroll(timestamp) {
                if (!isPlaying) return;

                if (config.pageSpeed === 0) {
                    lastFrameTime = 0;
                    scrollDelay = requestAnimationFrame(pageScroll);
                    return;
                }

                if (!lastFrameTime) {
                    console.log("[Teleprompter] Initializing pageScroll frame timer at:", timestamp,
                                "scrollTop:", elm.article ? elm.article.scrollTop : "null",
                                "scrollHeight:", elm.article ? elm.article.scrollHeight : "null",
                                "clientHeight:", elm.article ? elm.article.clientHeight : "null");
                    lastFrameTime = timestamp;
                }
                var elapsed = timestamp - lastFrameTime;
                lastFrameTime = timestamp;

                var offset = 1;
                var speed = Math.max(-50, Math.min(50, config.pageSpeed));
                // Convert speed to pixels per millisecond (speed 50 corresponds to 0.3 pixels per ms)
                var speedPixelsPerMs = (speed / 50) * 0.3;
                var scrollDirection = (speed < 0) ? -1 : 1;
                var flipYDirection = config.flipY ? -1 : 1;
                var directionFactor = scrollDirection * flipYDirection;

                var distance = Math.abs(speedPixelsPerMs) * elapsed * directionFactor;
                scrollAccumulator += distance;

                var step = Math.trunc(scrollAccumulator);
                if (step !== 0) {
                    elm.article.scrollTop += step;
                    scrollAccumulator -= step;
                }

                var maxScroll = elm.article.scrollHeight - elm.article.clientHeight;

                if (directionFactor > 0) {
                    if (maxScroll > 0 && elm.article.scrollTop >= maxScroll - 1) {
                        console.log("[Teleprompter] Reached bottom, stopping. scrollTop:", elm.article.scrollTop, "maxScroll:", maxScroll);
                        stop();
                        return;
                    }
                } else {
                    if (elm.article.scrollTop <= 0 && scrollAccumulator < 0) {
                        console.log("[Teleprompter] Reached top, stopping. scrollTop:", elm.article.scrollTop);
                        stop();
                        return;
                    }
                }

                scrollDelay = requestAnimationFrame(pageScroll);
            }

            function navigate(evt) {
                var keys = {
                    SPACE: 32, ESC: 27, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
                    PAGE_UP: 33, PAGE_DOWN: 34
                };

                if (evt.target.id === 'teleprompter' || evt.target.tagName === 'INPUT') return;

                if (evt.keyCode === keys.ESC) {
                    handleReset(false);
                    evt.preventDefault();
                } else if (evt.keyCode === keys.SPACE) {
                    handlePlay();
                    evt.preventDefault();
                } else if (evt.keyCode === keys.LEFT || evt.keyCode === keys.PAGE_UP) {
                    sendEvent('prev');
                    evt.preventDefault();
                } else if (evt.keyCode === keys.RIGHT || evt.keyCode === keys.PAGE_DOWN) {
                    sendEvent('next');
                    evt.preventDefault();
                } else if (evt.keyCode === keys.UP) {
                    config.fontSize = Math.min(200, config.fontSize + 2);
                    updateFontSize(true);
                    evt.preventDefault();
                } else if (evt.keyCode === keys.DOWN) {
                    config.fontSize = Math.max(12, config.fontSize - 2);
                    updateFontSize(true);
                    evt.preventDefault();
                }
            }

            function applyConfig() {
                if (elm.backgroundColor) elm.backgroundColor.value = config.backgroundColor;
                if (elm.textColor) elm.textColor.value = config.textColor;
                if (elm.autoScroll) elm.autoScroll.checked = config.autoScroll;
                if (elm.fontSlider) elm.fontSlider.value = config.fontSize;
                if (elm.speedSlider) elm.speedSlider.value = config.pageSpeed;

                applyColorStyles();
                updateFontSize(false);
                updateSpeed(false);
                updateDimUI();
                updateFlipUI();
            }

            function sendPlayState(playing) {
                var payload = { type: 'playState', value: playing };
                if (bc) {
                    try { bc.postMessage(payload); } catch(e) {}
                }
                if (window.onTeleprompterMessage) {
                    try { window.onTeleprompterMessage(payload); return; } catch(e) {}
                }
                if (window.opener) {
                    try { window.opener.postMessage({ type: 'teleprompterSync', opId: opId, payload: payload }, '*'); } catch(e) {}
                }
            }

            function sendEvent(name) {
                var payload = { type: 'event', eventName: name };
                if (bc) {
                    try { bc.postMessage(payload); } catch(e) {}
                }
                if (window.onTeleprompterMessage) {
                    try { window.onTeleprompterMessage(payload); return; } catch(e) {}
                }
                if (window.opener) {
                    try { window.opener.postMessage({ type: 'teleprompterSync', opId: opId, payload: payload }, '*'); } catch(e) {}
                }
            }

            function sendState(type, value) {
                var payload = { type: type, value: value };
                if (bc) {
                    try { bc.postMessage(payload); } catch(e) {}
                }
                if (window.onTeleprompterMessage) {
                    try { window.onTeleprompterMessage(payload); return; } catch(e) {}
                }
                if (window.opener) {
                    try { window.opener.postMessage({ type: 'teleprompterSync', opId: opId, payload: payload }, '*'); } catch(e) {}
                }
            }

            function cleanTeleprompter() {
                var text = elm.teleprompter.innerHTML || '';
                if (!text.includes('<p>') && !text.includes('<div>') && !text.includes('<br>')) {
                    var paragraphs = text.split('\\n').filter(p => p.trim() !== '');
                    text = paragraphs.map(p => '<p>' + p + '</p>').join('');
                }
                elm.teleprompter.innerHTML = text;
            }

            return {
                init: init,
                start: start,
                stop: stop,
                reset: handleReset,
                setSpeed: function(val) { config.pageSpeed = val; updateSpeed(false); },
                setFontSize: function(val) { config.fontSize = val; updateFontSize(false); },
                setFlipX: function(val) { config.flipX = val; updateFlipUI(); },
                setFlipY: function(val) { config.flipY = val; updateFlipUI(); },
                setTextColor: function(val) { config.textColor = val; applyColorStyles(); elm.textColor.value = val; },
                setBackgroundColor: function(val) { config.backgroundColor = val; applyColorStyles(); elm.backgroundColor.value = val; },
                setAutoScroll: function(val) { config.autoScroll = val; if (elm.autoScroll) elm.autoScroll.checked = val; },
                setFocusView: function(val) { config.dimControls = val; updateDimUI(); },
                cleanTeleprompter: cleanTeleprompter,
                resetPageScroll: function(instant) { handleReset(instant); }
            };
        })();

        function sanitizeInput(html) {
            html = String(html || '');
            if (!html) return '';
            try {
                var div = document.createElement('div');
                div.innerHTML = html;
                
                var dangerousTags = ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'link', 'meta'];
                for (var i = 0; i < dangerousTags.length; i++) {
                    var elements = div.getElementsByTagName(dangerousTags[i]);
                    while (elements.length > 0) {
                        var el = elements[0];
                        if (el && el.parentNode) {
                            el.parentNode.removeChild(el);
                        } else {
                            break;
                        }
                    }
                }
                
                var allElements = div.getElementsByTagName('*');
                for (var i = 0; i < allElements.length; i++) {
                    var el = allElements[i];
                    var attrs = el.attributes;
                    if (attrs) {
                        var attrNames = [];
                        for (var j = 0; j < attrs.length; j++) {
                            if (attrs[j]) attrNames.push(attrs[j].name);
                        }
                        for (var j = 0; j < attrNames.length; j++) {
                            var attrName = attrNames[j];
                            if (attrName.toLowerCase().indexOf('on') === 0) {
                                el.removeAttribute(attrName);
                            } else if (attrName.toLowerCase() === 'href' || attrName.toLowerCase() === 'src') {
                                var rawVal = el.getAttribute(attrName);
                                if (rawVal) {
                                    var attrVal = String(rawVal).trim();
                                    if (attrVal.toLowerCase().indexOf('javascript:') === 0) {
                                        el.removeAttribute(attrName);
                                    }
                                }
                            }
                        }
                    }
                }
                return div.innerHTML;
            } catch (e) {
                console.error("[Teleprompter] Sanitization failed, falling back to regex:", e);
                try {
                    var scriptRegex = new RegExp('<script[^>]*>[^]*?</' + 'script>', 'gi');
                    return html.replace(scriptRegex, '');
                } catch(err) {
                    return html;
                }
            }
        }

        function handleIncomingMessage(data) {
            if (!data) return;
            if (data.type === 'text') {
                if (currentRawText !== data.text) {
                    currentRawText = data.text;
                    var tEl = document.getElementById('teleprompter');
                    if (tEl) tEl.innerHTML = sanitizeInput(data.text || '');
                    TelePrompter.cleanTeleprompter();
                    TelePrompter.resetPageScroll(true);
                }
            } else if (data.type === 'speed') {
                TelePrompter.setSpeed(data.value);
            } else if (data.type === 'fontSize') {
                TelePrompter.setFontSize(data.value);
            } else if (data.type === 'flipX') {
                TelePrompter.setFlipX(data.value);
            } else if (data.type === 'flipY') {
                TelePrompter.setFlipY(data.value);
            } else if (data.type === 'textColor') {
                TelePrompter.setTextColor(data.value);
            } else if (data.type === 'backgroundColor') {
                TelePrompter.setBackgroundColor(data.value);
            } else if (data.type === 'play') {
                if (data.value) {
                    TelePrompter.start();
                } else {
                    TelePrompter.stop();
                }
            } else if (data.type === 'autoplay') {
                TelePrompter.setAutoScroll(data.value);
            } else if (data.type === 'focusView') {
                TelePrompter.setFocusView(data.value);
            } else if (data.type === 'reset') {
                TelePrompter.reset(data.instant ?? false);
            }
        }

        function setupBroadcastChannel(name) {
            console.log("[Teleprompter] setting up BroadcastChannel:", name);
            if (bc) {
                try { bc.close(); } catch(e) {}
            }
            channelName = name;
            try {
                bc = new BroadcastChannel(channelName);
                bc.onmessage = function(event) {
                    var data = event.data;
                    console.log("[Teleprompter] Child received BC message:", data);
                    handleIncomingMessage(data);
                };
                console.log("[Teleprompter] Sending ready command to parent via BC...");
                bc.postMessage({ type: 'ready' });
            } catch (e) {
                console.warn("[Teleprompter] BroadcastChannel initialization failed. Falling back to postMessage.", e);
            }

            // Try direct message callback first
            if (window.onTeleprompterMessage) {
                try {
                    window.onTeleprompterMessage({ type: 'ready' });
                } catch(e) {}
            }
            // Always send ready via postMessage to cover fallback scenarios
            if (window.opener) {
                try {
                    window.opener.postMessage({ type: 'teleprompterSync', opId: opId, payload: { type: 'ready' } }, '*');
                } catch(e) {}
            }
        }

        // PostMessage fallback listener
        window.addEventListener('message', function(event) {
            var data = event.data;
            if (data && data.type === 'teleprompterSync') {
                console.log("[Teleprompter] Child received postMessage fallback:", data.payload);
                handleIncomingMessage(data.payload);
            }
        });

        window.handleIncomingMessage = handleIncomingMessage;
        window.sanitizeInput = sanitizeInput;

        TelePrompter.init();
        setupBroadcastChannel(bcName);
    </script>
</body>
</html>`;

function sendCmd(payload) {
    if (bc) {
        try {
            bc.postMessage(payload);
        } catch (e) {
            // Ignore BC send errors if not initialized/supported
        }
    }
    if (childWindow && !childWindow.closed) {
        try {
            if (typeof childWindow.handleIncomingMessage === 'function') {
                childWindow.handleIncomingMessage(payload);
                return;
            }
        } catch (e) {
            // Direct call failed or blocked, fall back to postMessage
        }
        try {
            childWindow.postMessage({ type: 'teleprompterSync', payload: payload }, '*');
        } catch (e) {
            op.logWarn("[Teleprompter] Failed to send postMessage to child window:", e);
        }
    }
}

function resizeWindow() {
    if (childWindow && !childWindow.closed) {
        try {
            childWindow.resizeTo(inWinWidth.get() || 1024, inWinHeight.get() || 768);
        } catch (e) {}
    }
}

function moveWindow() {
    if (childWindow && !childWindow.closed) {
        try {
            childWindow.moveTo(inWinX.get() ?? 100, inWinY.get ?? 100);
        } catch (e) {}
    }
}

inWinWidth.onChange = resizeWindow;
inWinHeight.onChange = resizeWindow;
inWinX.onChange = moveWindow;
inWinY.onChange = moveWindow;

inWinName.onChange = () => {
    if (childWindow && !childWindow.closed) {
        try {
            childWindow.document.title = inWinName.get() || "Teleprompter";
        } catch (e) {}
    }
};

function handleParentIncomingMessage(data) {
    if (!data) return;

    if (data.type === 'ready') {
        op.log("[Teleprompter] Parent sending initial state to child window...");
        sendCmd({ type: 'text', text: inText.get() || "" });
        let speed = inSpeed.get() ?? 20;
        speed = Math.max(-50, Math.min(50, speed));
        sendCmd({ type: 'speed', value: speed });
        sendCmd({ type: 'fontSize', value: inFontSize.get() ?? 60 });
        sendCmd({ type: 'flipX', value: inFlipX.get() ?? false });
        sendCmd({ type: 'flipY', value: inFlipY.get() ?? false });
        sendCmd({ type: 'textColor', value: inTextColor.get() || "#ffffff" });
        sendCmd({ type: 'backgroundColor', value: inBkgdColor.get() || "#141414" });
        sendCmd({ type: 'autoplay', value: inAutoplay.get() ?? false });
        sendCmd({ type: 'play', value: inPlay.get() ?? false });
        sendCmd({ type: 'focusView', value: inFocusView.get() ?? false });

        // Initialize output ports
        outSpeed.set(speed);
        outFontSize.set(inFontSize.get() ?? 60);
        outPlay.set(inPlay.get() ?? false);
        outAutoplay.set(inAutoplay.get() ?? false);
        outFlipX.set(inFlipX.get() ?? false);
        outFlipY.set(inFlipY.get() ?? false);
        outTextColor.set(inTextColor.get() || "#ffffff");
        outBkgdColor.set(inBkgdColor.get() || "#141414");
        outFocusView.set(inFocusView.get() ?? false);
    } else if (data.type === 'playState') {
        const val = !!data.value;
        if (!!inPlay.get() !== val) {
            inPlay.set(val);
        }
        outPlay.set(val);
        if (val) {
            outOnPlay.trigger();
        } else {
            outOnPause.trigger();
        }
    } else if (data.type === 'autoScroll') {
        const val = !!data.value;
        if (!!inAutoplay.get() !== val) {
            inAutoplay.set(val);
        }
        outAutoplay.set(val);
    } else if (data.type === 'event') {
        if (data.eventName === 'next') {
            outOnNext.trigger();
        } else if (data.eventName === 'prev') {
            outOnPrev.trigger();
        } else if (data.eventName === 'reset') {
            outOnReset.trigger();
        }
    } else if (data.type === 'speed') {
        const val = Number(data.value) || 0;
        if (Number(inSpeed.get()) !== val) {
            inSpeed.set(val);
        }
        outSpeed.set(val);
    } else if (data.type === 'fontSize') {
        const val = Number(data.value) || 60;
        if (Number(inFontSize.get()) !== val) {
            inFontSize.set(val);
        }
        outFontSize.set(val);
    } else if (data.type === 'flipX') {
        const val = !!data.value;
        if (!!inFlipX.get() !== val) {
            inFlipX.set(val);
        }
        outFlipX.set(val);
    } else if (data.type === 'flipY') {
        const val = !!data.value;
        if (!!inFlipY.get() !== val) {
            inFlipY.set(val);
        }
        outFlipY.set(val);
    } else if (data.type === 'textColor') {
        if (inTextColor.get() !== data.value) {
            inTextColor.set(data.value);
        }
        outTextColor.set(data.value);
    } else if (data.type === 'backgroundColor') {
        if (inBkgdColor.get() !== data.value) {
            inBkgdColor.set(data.value);
        }
        outBkgdColor.set(data.value);
    } else if (data.type === 'focusView') {
        const val = !!data.value;
        if (!!inFocusView.get() !== val) {
            inFocusView.set(val);
        }
        outFocusView.set(val);
    }
}

function initBroadcastChannel() {
    if (bc) {
        try { bc.close(); } catch(e) {}
        bc = null;
    }

    const cName = inChannelName.get();
    if (!cName) return;

    try {
        bc = new BroadcastChannel(cName);
        bc.onmessage = (event) => {
            const data = event.data;
            op.log("[Teleprompter] Parent received BC message:", data);
            handleParentIncomingMessage(data);
        };
    } catch (e) {
        op.logWarn("[Teleprompter] BroadcastChannel initialization failed. Falling back to postMessage.", e);
    }
}

const onParentWindowMessage = (event) => {
    const data = event.data;
    if (data && data.type === 'teleprompterSync' && data.opId === op.id) {
        op.log("[Teleprompter] Parent received postMessage fallback:", data.payload);
        handleParentIncomingMessage(data.payload);
    }
};

window.addEventListener('message', onParentWindowMessage);

inChannelName.onChange = initBroadcastChannel;

inText.onChange = () => {
    const txt = inText.get() || "";
    if (txt !== lastSentText) {
        lastSentText = txt;
        sendCmd({ type: 'text', text: txt });
    }
};

inPlay.onChange = () => {
    sendCmd({ type: 'play', value: inPlay.get() ?? false });
    outPlay.set(inPlay.get() ?? false);
};

inAutoplay.onChange = () => {
    sendCmd({ type: 'autoplay', value: inAutoplay.get() ?? false });
    outAutoplay.set(inAutoplay.get() ?? false);
};

inSpeed.onChange = () => {
    let speed = inSpeed.get() ?? 20;
    speed = Math.max(-50, Math.min(50, speed));
    sendCmd({ type: 'speed', value: speed });
    outSpeed.set(speed);
};

inSpeedUp.onTriggered = () => {
    const currentSpeed = inSpeed.get() ?? 20;
    inSpeed.set(Math.min(50, currentSpeed + 1));
};

inSpeedDown.onTriggered = () => {
    const currentSpeed = inSpeed.get() ?? 20;
    inSpeed.set(Math.max(-50, currentSpeed - 1));
};

inFontSize.onChange = () => {
    sendCmd({ type: 'fontSize', value: inFontSize.get() ?? 60 });
    outFontSize.set(inFontSize.get() ?? 60);
};

inFontBigger.onTriggered = () => {
    const currentFontSize = inFontSize.get() ?? 60;
    inFontSize.set(Math.min(200, currentFontSize + 2));
};

inFontSmaller.onTriggered = () => {
    const currentFontSize = inFontSize.get() ?? 60;
    inFontSize.set(Math.max(12, currentFontSize - 2));
};

inFlipX.onChange = () => {
    sendCmd({ type: 'flipX', value: inFlipX.get() ?? false });
    outFlipX.set(inFlipX.get() ?? false);
};

inFlipY.onChange = () => {
    sendCmd({ type: 'flipY', value: inFlipY.get() ?? false });
    outFlipY.set(inFlipY.get() ?? false);
};

inTextColor.onChange = () => {
    sendCmd({ type: 'textColor', value: inTextColor.get() || "#ffffff" });
    outTextColor.set(inTextColor.get() || "#ffffff");
};

inBkgdColor.onChange = () => {
    sendCmd({ type: 'backgroundColor', value: inBkgdColor.get() || "#141414" });
    outBkgdColor.set(inBkgdColor.get() || "#141414");
};

inFocusView.onChange = () => {
    sendCmd({ type: 'focusView', value: inFocusView.get() ?? false });
    outFocusView.set(inFocusView.get() ?? false);
};

inReset.onTriggered = () => {
    sendCmd({ type: 'reset', value: true });
};

inOpen.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const cName = inChannelName.get() || "teleprompter-sync";
    const winName = inWinName.get() || "Teleprompter";
    const w = inWinWidth.get() || 1024;
    const h = inWinHeight.get() || 768;
    const x = inWinX.get() ?? 100;
    const y = inWinY.get() ?? 100;

    const features = `width=${w},height=${h},left=${x},top=${y},location=no,toolbar=no,menubar=no,status=no,popup=yes,scrollbars=no,resizable=yes`;

    childWindow = window.open("", `teleprompter_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup blocked! Allow popups to open the teleprompter window.");
        outWindowStatus.set("closed");
        return;
    }

    try {
        childWindow.onTeleprompterMessage = (payload) => {
            op.log("[Teleprompter] Parent received direct message from child:", payload);
            handleParentIncomingMessage(payload);
        };
    } catch (e) {
        op.logWarn("[Teleprompter] Failed to bind direct message callback to child window:", e);
    }

    outError.set("");
    outWindowStatus.set("open");
    outOnOpen.trigger();

    // Write template code with channel name substituted
    const doc = childWindow.document;
    doc.open();

    const customizedTemplate = templateHtml
        .replace("<title>Teleprompter</title>", `<title>${winName}</title>`)
        .replace("var bcName = 'teleprompter-sync';", `var bcName = '${cName}';`)
        .replace("var opId = 'teleprompter-op-id';", `var opId = '${op.id}';`);

    doc.write(customizedTemplate);
    doc.close();

    const pollTimer = setInterval(() => {
        if (!childWindow || childWindow.closed) {
            clearInterval(pollTimer);
            outWindowStatus.set("closed");
            childWindow = null;
        }
    }, 500);
};

inClose.onTriggered = () => {
    if (childWindow) {
        childWindow.close();
        childWindow = null;
        outWindowStatus.set("closed");
    }
};

// Initialize Broadcast Channel
initBroadcastChannel();

op.onDelete = () => {
    if (bc) {
        try { bc.close(); } catch(e) {}
    }
    if (childWindow) {
        childWindow.close();
    }
    window.removeEventListener('message', onParentWindowMessage);
};
