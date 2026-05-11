/**
 * TelePrompter Vanilla JS Version
 * Refactored from v1.2.2 - Peter Schmalfeldt
 */
const TelePrompter = (function() {
    /* DOM Elements */
    let elm = {};

    /* App Settings */
    let debug = false;
    let initialized = false;
    let isPlaying = false;
    let scrollDelay = null;
    let modalOpen = false;
    let timerInterval = null;
    let timerURLTimeout = null;
    const timerExp = 10;
    const version = 'v1.2.2-vanilla';

    /* Default Settings */
    const defaultConfig = {
        backgroundColor: '#141414',
        dimControls: true,
        flipX: false,
        flipY: false,
        fontSize: 60,
        pageSpeed: 35,
        pageScrollPercent: 0,
        textColor: '#ffffff',
        autoScroll: false
    };

    let config = { ...defaultConfig };

    /**
     * Initialization
     */
    function init() {
        if (initialized) return;

        cacheElements();
        bindEvents();
        initSettings();
        initUI();

        initialized = true;
        if (debug) console.debug('[TP]', 'TelePrompter Initialized');
    }

    function cacheElements() {
        elm.article = document.querySelector('article');
        elm.backgroundColor = document.getElementById('background-color');
        elm.body = document.body;
        elm.buttonDimControls = document.querySelector('.button.dim-controls');
        elm.buttonFlipX = document.querySelector('.button.flip-x');
        elm.buttonFlipY = document.querySelector('.button.flip-y');
        elm.buttonPlay = document.querySelector('.button.play');
        elm.buttonReset = document.querySelector('.button.reset');
        elm.fontSize = document.querySelector('.font_size');
        elm.fontSizeValue = document.querySelector('.font_size_label span');
        elm.header = document.querySelector('header');
        elm.headerContent = document.querySelectorAll('header h1, header nav');
        elm.marker = document.querySelector('.marker');
        elm.overlay = document.querySelector('.overlay');
        elm.speed = document.querySelector('.speed');
        elm.speedValue = document.querySelector('.speed_label span');
        elm.teleprompter = document.getElementById('teleprompter');
        elm.textColor = document.getElementById('text-color');
        elm.clock = document.querySelector('.clock');
        elm.autoScroll = document.getElementById('auto-scroll');
    }

    function bindEvents() {
        elm.backgroundColor.addEventListener('change', handleBackgroundColor);
        elm.buttonDimControls.addEventListener('click', handleDim);
        elm.buttonFlipX.addEventListener('click', handleFlipX);
        elm.buttonFlipY.addEventListener('click', handleFlipY);
        elm.buttonPlay.addEventListener('click', handlePlay);
        elm.buttonReset.addEventListener('click', handleReset);
        elm.textColor.addEventListener('change', handleTextColor);

        elm.fontSize.addEventListener('input', () => updateFontSize(true));
        elm.speed.addEventListener('input', () => updateSpeed(true));
        elm.autoScroll.addEventListener('change', handleAutoScroll);

        elm.teleprompter.addEventListener('keyup', updateTeleprompterText);
        window.addEventListener('keydown', navigate);
    }

    /**
     * Settings Logic
     */
    function initSettings() {
        const urlParams = getUrlVars();
        
        if (urlParams) {
            if (urlParams.backgroundColor) config.backgroundColor = decodeURIComponent(urlParams.backgroundColor);
            if (urlParams.dimControls) config.dimControls = (urlParams.dimControls === 'true');
            if (urlParams.flipX) config.flipX = (urlParams.flipX === 'true');
            if (urlParams.flipY) config.flipY = (urlParams.flipY === 'true');
            if (urlParams.fontSize) config.fontSize = parseInt(urlParams.fontSize);
            if (urlParams.pageSpeed) config.pageSpeed = parseInt(urlParams.pageSpeed);
            if (urlParams.textColor) config.textColor = decodeURIComponent(urlParams.textColor);
        }

        // Load from Local Storage if not overridden by URL
        const storageMap = {
            'teleprompter_background_color': 'backgroundColor',
            'teleprompter_dim_controls': 'dimControls',
            'teleprompter_flip_x': 'flipX',
            'teleprompter_flip_y': 'flipY',
            'teleprompter_font_size': 'fontSize',
            'teleprompter_speed': 'pageSpeed',
            'teleprompter_text_color': 'textColor',
            'teleprompter_auto_scroll': 'autoScroll'
        };

        for (let key in storageMap) {
            const val = localStorage.getItem(key);
            if (val !== null) {
                if (typeof config[storageMap[key]] === 'boolean') {
                    config[storageMap[key]] = (val === 'true');
                } else if (typeof config[storageMap[key]] === 'number') {
                    config[storageMap[key]] = parseInt(val);
                } else {
                    config[storageMap[key]] = val;
                }
            }
        }

        // Apply Text if saved
        const savedText = localStorage.getItem('teleprompter_text');
        if (savedText) {
            elm.teleprompter.innerHTML = savedText;
            cleanTeleprompter();
        }

        // Initial UI Sync
        applyConfig();
    }

    function cleanTeleprompter() {
        let text = elm.teleprompter.innerHTML;
        text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
        text = text.replace(/@@/g, '<br>');
        text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
        text = text.replace(/<p><\/p>/g, '');

        if (text && !text.startsWith('<p>')) {
            text = '<p>' + text + '</p>';
        }

        elm.teleprompter.innerHTML = text;
        
        // Remove empty paragraphs
        elm.teleprompter.querySelectorAll('p').forEach(p => {
            if (p.innerHTML.trim() === '') p.remove();
        });
    }

    function applyConfig() {
        elm.backgroundColor.value = config.backgroundColor;
        elm.textColor.value = config.textColor;
        elm.fontSize.value = config.fontSize;
        elm.speed.value = config.pageSpeed;
        elm.autoScroll.checked = config.autoScroll;

        elm.article.style.backgroundColor = config.backgroundColor;
        elm.body.style.backgroundColor = config.backgroundColor;
        elm.teleprompter.style.backgroundColor = config.backgroundColor;
        elm.teleprompter.style.color = config.textColor;

        updateFontSize(false);
        updateSpeed(false);
        updateDimUI();
        updateFlipUI();
    }

    /**
     * UI Helpers
     */
    function initUI() {
        startClock();
        
        // Initial scroll position
        elm.article.scrollTop = 0;

        // Set Bottom Padding to ensure last slide can be centered
        elm.teleprompter.style.paddingBottom = Math.ceil(window.innerHeight - elm.header.offsetHeight) + 'px';

        // Ready state
        elm.teleprompter.classList.add('ready');
    }

    function startClock() {
        if (timerInterval) clearInterval(timerInterval);
        const startTime = Date.now();
        
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            elm.clock.textContent = 
                String(hours).padStart(2, '0') + ':' + 
                String(minutes).padStart(2, '0') + ':' + 
                String(seconds).padStart(2, '0');
        }, 1000);
    }

    function resetClock() {
        startClock();
    }

    /**
     * Event Handlers
     */
    function handleBackgroundColor() {
        config.backgroundColor = elm.backgroundColor.value;
        elm.article.style.backgroundColor = config.backgroundColor;
        elm.body.style.backgroundColor = config.backgroundColor;
        elm.teleprompter.style.backgroundColor = config.backgroundColor;
        localStorage.setItem('teleprompter_background_color', config.backgroundColor);
        delayedUpdateURL();
    }

    function handleTextColor() {
        config.textColor = elm.textColor.value;
        elm.teleprompter.style.color = config.textColor;
        localStorage.setItem('teleprompter_text_color', config.textColor);
        delayedUpdateURL();
    }

    function handleAutoScroll() {
        config.autoScroll = elm.autoScroll.checked;
        localStorage.setItem('teleprompter_auto_scroll', config.autoScroll);
        delayedUpdateURL();
    }

    function handleDim() {
        config.dimControls = !config.dimControls;
        localStorage.setItem('teleprompter_dim_controls', config.dimControls);
        updateDimUI();
        delayedUpdateURL();
    }

    function updateDimUI() {
        if (config.dimControls) {
            elm.buttonDimControls.classList.remove('icon-eye-open');
            elm.buttonDimControls.classList.add('icon-eye-close');
            if (isPlaying) {
                elm.headerContent.forEach(e => e.style.opacity = '0.15');
                elm.marker.style.display = 'block';
                elm.overlay.style.display = 'block';
            }
        } else {
            elm.buttonDimControls.classList.remove('icon-eye-close');
            elm.buttonDimControls.classList.add('icon-eye-open');
            elm.headerContent.forEach(e => e.style.opacity = '1');
            elm.marker.style.display = 'none';
            elm.overlay.style.display = 'none';
        }
    }

    function handleFlipX() {
        config.flipX = !config.flipX;
        localStorage.setItem('teleprompter_flip_x', config.flipX);
        updateFlipUI();
        delayedUpdateURL();
    }

    function handleFlipY() {
        config.flipY = !config.flipY;
        localStorage.setItem('teleprompter_flip_y', config.flipY);
        updateFlipUI();
        delayedUpdateURL();
        
        // Smooth scroll to position if flipping
        if (config.flipY) {
            elm.article.scrollTo({ top: elm.teleprompter.offsetHeight + 100, behavior: 'smooth' });
        } else {
            elm.article.scrollTo({ top: 0, behavior: 'smooth' });
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

    function updateFontSize(save = true) {
        config.fontSize = parseInt(elm.fontSize.value);
        elm.fontSizeValue.textContent = `(${config.fontSize})`;
        elm.teleprompter.style.fontSize = config.fontSize + 'px';
        elm.teleprompter.style.lineHeight = (config.fontSize * 1.4) + 'px';
        
        if (save) {
            localStorage.setItem('teleprompter_font_size', config.fontSize);
            delayedUpdateURL();
        }
    }

    function updateSpeed(save = true) {
        config.pageSpeed = parseInt(elm.speed.value);
        elm.speedValue.textContent = `(${config.pageSpeed})`;
        
        if (save) {
            localStorage.setItem('teleprompter_speed', config.pageSpeed);
            delayedUpdateURL();
        }
    }

    function handlePlay() {
        if (isPlaying) stop();
        else start();
    }

    function start() {
        isPlaying = true;
        elm.buttonPlay.classList.remove('icon-play');
        elm.buttonPlay.classList.add('icon-pause');
        updateDimUI();
        pageScroll();
    }

    function stop() {
        isPlaying = false;
        elm.buttonPlay.classList.remove('icon-pause');
        elm.buttonPlay.classList.add('icon-play');
        clearTimeout(scrollDelay);
        updateDimUI();
    }

    function handleReset() {
        stop();
        resetClock();
        elm.article.scrollTo({ top: config.flipY ? elm.teleprompter.offsetHeight + 100 : 0, behavior: 'smooth' });
    }

    function pageScroll() {
        if (!isPlaying) return;

        if (config.pageSpeed === 0) {
            scrollDelay = setTimeout(pageScroll, 100);
            return;
        }

        const offset = 1;
        const delay = Math.floor(50 - config.pageSpeed);

        if (config.flipY) {
            elm.article.scrollTop -= offset;
            if (elm.article.scrollTop <= 0) {
                stop();
            }
        } else {
            elm.article.scrollTop += offset;
            const maxScroll = elm.article.scrollHeight - elm.article.clientHeight;
            if (elm.article.scrollTop >= maxScroll - 1) {
                stop();
            }
        }

        scrollDelay = setTimeout(pageScroll, delay);
    }

    /**
     * Keyboard Navigation
     */
    function navigate(evt) {
        const keys = {
            SPACE: 32, ESC: 27, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
            PAGE_UP: 33, PAGE_DOWN: 34, B: 66, F5: 116, PERIOD: 190
        };

        if (evt.target.id === 'teleprompter' || evt.target.tagName === 'INPUT') return;

        if (evt.keyCode === keys.ESC) {
            handleReset();
            evt.preventDefault();
        } else if (evt.keyCode === keys.SPACE || [keys.B, keys.F5, keys.PERIOD].includes(evt.keyCode)) {
            handlePlay();
            evt.preventDefault();
        } else if (evt.keyCode === keys.LEFT || evt.keyCode === keys.PAGE_UP) {
            elm.speed.value = parseInt(elm.speed.value) - 1;
            updateSpeed(true);
            evt.preventDefault();
        } else if (evt.keyCode === keys.RIGHT || evt.keyCode === keys.PAGE_DOWN) {
            elm.speed.value = parseInt(elm.speed.value) + 1;
            updateSpeed(true);
            evt.preventDefault();
        } else if (evt.keyCode === keys.UP) {
            elm.fontSize.value = parseInt(elm.fontSize.value) + 1;
            updateFontSize(true);
            evt.preventDefault();
        } else if (evt.keyCode === keys.DOWN) {
            elm.fontSize.value = parseInt(elm.fontSize.value) - 1;
            updateFontSize(true);
            evt.preventDefault();
        }
    }

    function updateTeleprompterText() {
        localStorage.setItem('teleprompter_text', elm.teleprompter.innerHTML);
    }

    /**
     * URL Utilities
     */
    function getUrlVars() {
        const vars = {};
        const parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
            vars[key] = value;
        });
        return Object.keys(vars).length > 0 ? vars : null;
    }

    function delayedUpdateURL() {
        clearTimeout(timerURLTimeout);
        timerURLTimeout = setTimeout(updateURL, timerExp);
    }

    function updateURL() {
        const params = new URLSearchParams();
        params.set('backgroundColor', encodeURIComponent(config.backgroundColor));
        params.set('textColor', encodeURIComponent(config.textColor));
        params.set('fontSize', config.fontSize);
        params.set('pageSpeed', config.pageSpeed);
        params.set('flipX', config.flipX);
        params.set('flipY', config.flipY);
        params.set('dimControls', config.dimControls);
        
        window.history.replaceState(null, null, '?' + params.toString());
    }

    /* Public API */
    return {
        version,
        init,
        start,
        stop,
        reset: handleReset,
        setDebug: (bool) => { debug = !!bool; },
        setSpeed: (val) => { elm.speed.value = val; updateSpeed(true); },
        setFontSize: (val) => { elm.fontSize.value = val; updateFontSize(true); },
        setDim: (bool) => { config.dimControls = !bool; handleDim(); },
        setFlipX: (bool) => { config.flipX = !bool; handleFlipX(); },
        setFlipY: (bool) => { config.flipY = !bool; handleFlipY(); },
        setAutoScroll: (bool) => { elm.autoScroll.checked = bool; handleAutoScroll(); },
        isAutoScroll: () => config.autoScroll,
        increaseSpeed: (amount = 1) => { elm.speed.value = parseInt(elm.speed.value) + amount; updateSpeed(true); },
        decreaseSpeed: (amount = 1) => { elm.speed.value = parseInt(elm.speed.value) - amount; updateSpeed(true); },
        increaseFont: (amount = 1) => { elm.fontSize.value = parseInt(elm.fontSize.value) + amount; updateFontSize(true); },
        decreaseFont: (amount = 1) => { elm.fontSize.value = parseInt(elm.fontSize.value) - amount; updateFontSize(true); },
        playPause: handlePlay,
        resetPageScroll: handleReset
    };
})();

// Export for usage
window.TelePrompter = TelePrompter;
