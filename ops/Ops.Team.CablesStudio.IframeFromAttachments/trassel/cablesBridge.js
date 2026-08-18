window.virtualScrollY = 0;
window.SCENE_WIDTH = window.innerWidth || 1280;
window.SCENE_HEIGHT = window.innerHeight || 720;

// 1. Establish BroadcastChannel connection immediately
const channel = new BroadcastChannel("cables_iframe_channel");

function notifyLoaded() {
    channel.postMessage({ type: "SKETCH_LOADED" });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    notifyLoaded();
} else {
    window.addEventListener("DOMContentLoaded", notifyLoaded);
    window.addEventListener("load", notifyLoaded);
}

function handleScroll(scrollY) {
    if (scrollY === undefined || isNaN(Number(scrollY))) return;
    const delta = Number(scrollY);
    window.virtualScrollY = delta;

    if (typeof window.onScrollUpdate === "function") {
        window.onScrollUpdate(delta);
    }
}

function handleMode(mode) {
    if (mode === undefined) return;
    if (typeof window.setMode === "function") {
        window.setMode(mode);
    } else if (typeof window.cycleMode === "function") {
        window.cycleMode();
    }
}

function handleButton(btn) {
    if (btn === undefined || btn === null) return;
    if (typeof window.handleButtonInput === "function") {
        window.handleButtonInput(btn);
    } else if (typeof window.cycleMode === "function") {
        window.cycleMode();
    }
}

function handleReset() {
    if (typeof window.resetSketch === "function") {
        window.resetSketch();
    }
}

function handleDimension(width, height) {
    if (width !== undefined) window.SCENE_WIDTH = Number(width);
    if (height !== undefined) window.SCENE_HEIGHT = Number(height);
    if (typeof window.resizeTrassel === "function" && window.SCENE_WIDTH && window.SCENE_HEIGHT) {
        window.resizeTrassel(window.SCENE_WIDTH, window.SCENE_HEIGHT);
    }
}

// 2. Process incoming messages
channel.onmessage = (e) => {
    let data = e.data;
    if (!data) return;

    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (err) {
            return;
        }
    }

    // A. Direct JSON: mouseScrollY { "scrollY": 8.788436889648438 } or { "dy": ... } or { "deltaY": ... }
    if (data.scrollY !== undefined) {
        handleScroll(data.scrollY);
    } else if (data.dy !== undefined) {
        handleScroll(data.dy);
    } else if (data.deltaY !== undefined) {
        handleScroll(data.deltaY);
    }

    // B. Nested mouseScrollY: { "mouseScrollY": { "scrollY": ... } } or { "mouseScroll": { "dy": ... } }
    if (data.mouseScrollY && typeof data.mouseScrollY === "object") {
        const s = data.mouseScrollY;
        handleScroll(s.scrollY !== undefined ? s.scrollY : s.dy);
    } else if (data.mouseScroll && typeof data.mouseScroll === "object") {
        const s = data.mouseScroll;
        handleScroll(s.scrollY !== undefined ? s.scrollY : s.dy);
    }

    // C. Mode switch
    if (data.mode !== undefined) {
        handleMode(data.mode);
    }

    // D. Button triggers
    if (data.button !== undefined) {
        handleButton(data.button);
    } else if (data.mouseButton !== undefined) {
        const btn = typeof data.mouseButton === "object" && data.mouseButton !== null ? data.mouseButton.button : data.mouseButton;
        handleButton(btn);
    }

    // E. Reset
    if (data.reset || data.type === "RESET") {
        handleReset();
    }

    // F. Cables SET_VAR format
    if (data.type === "SET_VAR") {
        if (data.key === "mouseScrollY" || data.key === "scrollY") {
            const val = typeof data.value === "object" && data.value !== null ? (data.value.scrollY || data.value.dy) : data.value;
            handleScroll(val);
        } else if (data.key === "mode") {
            handleMode(data.value);
        } else if (data.key === "button" || data.key === "mouseButton") {
            const btn = typeof data.value === "object" && data.value !== null ? data.value.button : data.value;
            handleButton(btn);
        } else if (data.key === "width") {
            handleDimension(data.value, window.SCENE_HEIGHT);
        } else if (data.key === "height") {
            handleDimension(window.SCENE_WIDTH, data.value);
        }
    }

    // G. Cables SET_VARS batch format
    if (data.type === "SET_VARS" && data.vars) {
        const vars = data.vars;
        if (vars.scrollY !== undefined) {
            handleScroll(vars.scrollY);
        } else if (vars.dy !== undefined) {
            handleScroll(vars.dy);
        } else if (vars.mouseScrollY !== undefined) {
            const val = typeof vars.mouseScrollY === "object" && vars.mouseScrollY !== null ? (vars.mouseScrollY.scrollY || vars.mouseScrollY.dy) : vars.mouseScrollY;
            handleScroll(val);
        }
        if (vars.mode !== undefined) {
            handleMode(vars.mode);
        }
        if (vars.button !== undefined) {
            handleButton(vars.button);
        } else if (vars.mouseButton !== undefined) {
            const btn = typeof vars.mouseButton === "object" && vars.mouseButton !== null ? vars.mouseButton.button : vars.mouseButton;
            handleButton(btn);
        }
        if (vars.width !== undefined || vars.height !== undefined) {
            handleDimension(vars.width, vars.height);
        }
    }
};
