// slides_preload.js - Electron preload script for Google Slides in GoogleSlides op
// Runs inside the Google Slides page context before DOM finishes loading (no CORS barriers).

(function() {
    let targetBgColorToRemove = "#abcdef";

    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScriptURL: string => string,
                createScript: string => string
            });
        } catch (e) {}
    }

    function scrollSim(deltaY) {
        const target = document.querySelector('.punch-viewer-content') ||
                       document.querySelector('.punch-viewer-page-wrapper-container') ||
                       document.querySelector('.punch-viewer-page-wrapper') ||
                       document.body ||
                       document.documentElement;

        const x = Math.floor(window.innerWidth / 2);
        const y = Math.floor(window.innerHeight / 2);

        const ev = new WheelEvent('wheel', {
            deltaX: 0,
            deltaY: deltaY, // Positive = scroll down (next), Negative = scroll up (prev)
            deltaZ: 0,
            deltaMode: 0,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true
        });

        if (target) {
            target.dispatchEvent(ev);
        }
        document.dispatchEvent(ev);
        window.dispatchEvent(ev);

        deleteBG();
    }

    function keySim(k) {
        const keyName = k === 39 ? "ArrowRight" : (k === 37 ? "ArrowLeft" : (k === 83 ? "s" : "Space"));
        const ev = new KeyboardEvent("keydown", {
            keyCode: k,
            which: k,
            key: keyName,
            code: keyName,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(ev);
        if (document.body) document.body.dispatchEvent(ev);
        if (document.activeElement && document.activeElement !== document) {
            document.activeElement.dispatchEvent(ev);
        }
    }

    function setupTransparentStyles() {
        let style = document.getElementById("cables_transparent_bg_style");
        if (!style) {
            style = document.createElement("style");
            style.id = "cables_transparent_bg_style";
            (document.head || document.documentElement || document.body).appendChild(style);
        }

        style.innerHTML = `
            html, body,
            .punch-viewer-content,
            .punch-viewer-container,
            .punch-viewer-page-wrapper-container,
            .punch-viewer-page-wrapper,
            .punch-viewer-svgpage-svgcontainer,
            .punch-viewer-svgpage,
            .punch-full-window-overlay,
            .sketchyViewerContainer,
            .sketchyViewerContent,
            .sketchyViewerBody,
            .appsSketchyViewerSvgPageComponentEl,
            :fullscreen, :fullscreen::backdrop {
                background: transparent !important;
                background-color: transparent !important;
                background-color: rgba(0, 0, 0, 0) !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* Hide bottom control bar so slide fills 100% height */
            .punch-viewer-navbar,
            .punch-viewer-navbar-container,
            .punch-viewer-nav-fade,
            .punch-viewer-nav,
            .punch-viewer-action-bar,
            .punch-viewer-action-bar-container {
                display: none !important;
                height: 0 !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;

        if (document.body) {
            document.body.style.backgroundColor = "transparent";
        }
    }

    function deleteBG(colorHex) {
        const hex = (colorHex || targetBgColorToRemove || "#abcdef").trim().toLowerCase();

        // 1. Remove targeted background color shapes
        if (hex) {
            const cleanHex = hex.startsWith("#") ? hex : "#" + hex;
            const noHashHex = cleanHex.replace("#", "");

            const selectors = [
                `path[fill="${cleanHex}" i]`,
                `rect[fill="${cleanHex}" i]`,
                `path[fill*="${noHashHex}" i]`,
                `rect[fill*="${noHashHex}" i]`
            ].join(",");

            try {
                const elems = document.querySelectorAll(selectors);
                for (let i = 0; i < elems.length; i++) {
                    const el = elems[i];
                    if (el.previousElementSibling && (el.previousElementSibling.tagName === "path" || el.previousElementSibling.tagName === "rect")) {
                        el.previousElementSibling.style.display = "none";
                    }
                    el.style.display = "none";
                    el.setAttribute("fill", "none");
                }
            } catch (e) {}
        }

        // 2. Remove black/dark slide backdrop rects that Google Slides creates behind slides
        try {
            const darkBackdrops = document.querySelectorAll('rect[fill="#000000" i], rect[fill="#000" i], rect[fill="black" i], rect[fill="#111111" i], rect[fill="#222222" i]');
            for (let i = 0; i < darkBackdrops.length; i++) {
                const el = darkBackdrops[i];
                const w = el.getAttribute("width") || "";
                const h = el.getAttribute("height") || "";
                if (w === "100%" || w === "960" || w === "1920" || (parseFloat(w) > 500 && parseFloat(h) > 300)) {
                    el.style.display = "none";
                    el.setAttribute("fill", "none");
                }
            }
        } catch (e) {}
    }

    function fitToWindow() {
        try {
            window.dispatchEvent(new Event("resize"));
        } catch (e) {}
    }

    window.addEventListener("DOMContentLoaded", () => {
        document.title = "Google Slides Texture";
        setupTransparentStyles();
        deleteBG();
        setInterval(() => {
            setupTransparentStyles();
            deleteBG();
        }, 300);

        setTimeout(fitToWindow, 100);
        setTimeout(fitToWindow, 500);
        setTimeout(fitToWindow, 1500);
    });

    window.addEventListener("load", () => {
        setupTransparentStyles();
        deleteBG();
        fitToWindow();
    });

    window.addEventListener("resize", () => {
        fitToWindow();
    });

    // Support Electron ipcRenderer if available
    try {
        const { ipcRenderer } = require("electron");
        if (ipcRenderer) {
            ipcRenderer.on("next-slide", () => {
                scrollSim(120); // Simulate mouse scroll down for incremental in-slide advance
            });

            ipcRenderer.on("previous-slide", () => {
                scrollSim(-120); // Simulate mouse scroll up for incremental in-slide reverse
            });

            ipcRenderer.on("set-remove-color", (_event, color) => {
                targetBgColorToRemove = color || "#abcdef";
                deleteBG(targetBgColorToRemove);
            });

            ipcRenderer.sendToHost("preload-ready");
        }
    } catch (e) {}

    // Expose helper on guest window
    window.__cablesPreload = {
        setupTransparentStyles: setupTransparentStyles,
        deleteBG: deleteBG,
        fitToWindow: fitToWindow,
        scrollSim: scrollSim,
        keySim: keySim,
        setRemoveColor: function(c) {
            targetBgColorToRemove = c || "#abcdef";
            deleteBG(targetBgColorToRemove);
        }
    };
})();
