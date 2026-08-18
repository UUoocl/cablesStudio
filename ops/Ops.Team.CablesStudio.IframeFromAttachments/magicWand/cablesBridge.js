window.virtualMouseX = 0;
window.virtualMouseY = 0;
window.virtualButton = 0;
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

function handlePosition(posX, posY) {
    if (posX === undefined || posY === undefined || isNaN(Number(posX)) || isNaN(Number(posY))) {
        return;
    }

    window.virtualMouseX = Number(posX);
    window.virtualMouseY = Number(posY);

    if (typeof window.onPositionUpdate === "function") {
        window.onPositionUpdate(window.virtualMouseX, window.virtualMouseY);
    }
}

function handleButton(buttonState) {
    if (buttonState === undefined || buttonState === null) return;
    const btnNum = Number(buttonState);
    if (!isNaN(btnNum)) {
        window.virtualButton = btnNum;
    } else {
        window.virtualButton = buttonState;
    }

    // Trigger burst when button is pressed (> 0 or truthy)
    if (btnNum > 0 || (isNaN(btnNum) && Boolean(buttonState))) {
        if (typeof window.triggerBurst === "function") {
            window.triggerBurst(window.virtualMouseX, window.virtualMouseY, buttonState);
        }
    }
}

function handleDimension(width, height) {
    if (width !== undefined) window.SCENE_WIDTH = Number(width);
    if (height !== undefined) window.SCENE_HEIGHT = Number(height);
    if (typeof window.resizeCanvas === "function" && window.SCENE_WIDTH && window.SCENE_HEIGHT) {
        window.resizeCanvas(window.SCENE_WIDTH, window.SCENE_HEIGHT);
    }
}

// 2. Process incoming messages
channel.onmessage = (e) => {
    let data = e.data;
    if (!data) return;

    // Parse stringified JSON if message arrived as a JSON string
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (err) {
            return;
        }
    }

    // A. Direct JSON: mousePosition { "posX": 3307, "posY": 1882 } or { "x": ..., "y": ... }
    if (data.posX !== undefined && data.posY !== undefined) {
        handlePosition(data.posX, data.posY);
    } else if (data.x !== undefined && data.y !== undefined) {
        handlePosition(data.x, data.y);
    }

    // B. Direct JSON: mouseButton { "button": 1 }
    if (data.button !== undefined) {
        handleButton(data.button);
    }

    // C. Wrapped object properties: { "mousePosition": { "posX": ..., "posY": ... } }
    if (data.mousePosition && typeof data.mousePosition === "object") {
        const p = data.mousePosition;
        handlePosition(p.posX !== undefined ? p.posX : p.x, p.posY !== undefined ? p.posY : p.y);
    }

    // D. Wrapped object properties: { "mouseButton": { "button": ... } } or { "mouseButton": 1 }
    if (data.mouseButton !== undefined) {
        if (typeof data.mouseButton === "object" && data.mouseButton !== null) {
            handleButton(data.mouseButton.button);
        } else {
            handleButton(data.mouseButton);
        }
    }

    // E. Cables SET_VAR format
    if (data.type === "SET_VAR") {
        if (data.key === "mousePosition" && typeof data.value === "object" && data.value !== null) {
            handlePosition(data.value.posX !== undefined ? data.value.posX : data.value.x, data.value.posY !== undefined ? data.value.posY : data.value.y);
        } else if (data.key === "posX") {
            handlePosition(data.value, window.virtualMouseY);
        } else if (data.key === "posY") {
            handlePosition(window.virtualMouseX, data.value);
        } else if (data.key === "button" || data.key === "mouseButton") {
            handleButton(typeof data.value === "object" && data.value !== null ? data.value.button : data.value);
        } else if (data.key === "buttonColors" && Array.isArray(data.value)) {
            window.buttonColors = data.value;
        } else if (data.key === "width") {
            handleDimension(data.value, window.SCENE_HEIGHT);
        } else if (data.key === "height") {
            handleDimension(window.SCENE_WIDTH, data.value);
        }
    }

    // F. Cables SET_VARS batch format
    if (data.type === "SET_VARS" && data.vars) {
        const vars = data.vars;
        if (vars.mousePosition && typeof vars.mousePosition === "object") {
            handlePosition(vars.mousePosition.posX !== undefined ? vars.mousePosition.posX : vars.mousePosition.x, vars.mousePosition.posY !== undefined ? vars.mousePosition.posY : vars.mousePosition.y);
        }
        if (vars.posX !== undefined || vars.posY !== undefined) {
            handlePosition(vars.posX !== undefined ? vars.posX : window.virtualMouseX, vars.posY !== undefined ? vars.posY : window.virtualMouseY);
        }
        if (vars.button !== undefined) {
            handleButton(vars.button);
        } else if (vars.mouseButton !== undefined) {
            handleButton(typeof vars.mouseButton === "object" && vars.mouseButton !== null ? vars.mouseButton.button : vars.mouseButton);
        }
        if (vars.buttonColors !== undefined && Array.isArray(vars.buttonColors)) {
            window.buttonColors = vars.buttonColors;
        }
        if (vars.width !== undefined || vars.height !== undefined) {
            handleDimension(vars.width, vars.height);
        }
    }
};
