// Ops.Team.CablesStudio.RevealJs.js

// Define inputs
const inFetchUrl = op.inString("Fetch URL", "");
const inBaseUrl = op.inString("Base URL", "");
const inTheme = op.inValueSelect("Theme", ["black", "white", "league", "beige", "sky", "night", "serif", "simple", "solarized", "blood", "moon"], "black");
const inNextSlide = op.inTriggerButton("Next Slide");
const inPrevSlide = op.inTriggerButton("Prev Slide");
const inSlideIndex = op.inInt("Slide Index", 0);

// Define outputs
const outElement = op.outObject("Element");
const outCurrentSlide = op.outNumber("Current Slide", 0);
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Settings", [inTheme]);
op.setPortGroup("Navigation", [inNextSlide, inPrevSlide, inSlideIndex]);

const CORE_CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css";
const THEME_CSS_BASE_URL = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/theme/";
const REVEAL_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js";

let deck = null;
let isScriptLoaded = false;

// Create parent container element
const container = document.createElement("div");
container.className = "cables-reveal-container";
container.style.width = "100%";
container.style.height = "100%";
container.style.position = "relative";
container.style.overflow = "hidden";

// Set initial output
outElement.set(container);

// Load stylesheets and script
loadStylesheet("reveal-core-css", CORE_CSS_URL);
updateTheme();

loadScript(REVEAL_JS_URL, () => {
    isScriptLoaded = true;
    if (inFetchUrl.get()) {
        fetchSlides();
    }
});

// Event listeners
inTheme.onChange = updateTheme;
inFetchUrl.onChange = fetchSlides;
inBaseUrl.onChange = fetchSlides;

inNextSlide.onTriggered = () => {
    if (deck) deck.next();
};

inPrevSlide.onTriggered = () => {
    if (deck) deck.prev();
};

inSlideIndex.onChange = () => {
    if (deck) {
        const idx = inSlideIndex.get();
        deck.slide(idx);
    }
};

op.onDelete = () => {
    if (deck) {
        try {
            deck.destroy();
        } catch (e) {}
        deck = null;
    }
    container.innerHTML = "";

    // Clean up instance-specific theme stylesheet
    const themeLink = document.getElementById("reveal-theme-css-" + op.id);
    if (themeLink) {
        themeLink.remove();
    }
};

function updateTheme() {
    const themeName = inTheme.get();
    loadStylesheet("reveal-theme-css-" + op.id, `${THEME_CSS_BASE_URL}${themeName}.min.css`);
    if (deck) {
        deck.layout();
    }
}

function loadStylesheet(id, url) {
    let link = document.getElementById(id);
    if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
    } else if (link.href !== url) {
        link.href = url;
    }
}

function loadScript(url, callback) {
    if (window.Reveal) {
        callback();
        return;
    }

    let script = document.querySelector(`script[src="${url}"]`);
    if (script) {
        if (script.dataset.loaded === "true") {
            callback();
        } else {
            script.addEventListener("load", callback);
        }
        return;
    }

    script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.loaded = "false";

    script.onload = () => {
        script.dataset.loaded = "true";
        callback();
    };

    script.onerror = () => {
        op.logError("[RevealJs] Failed to load script:", url);
    };

    document.head.appendChild(script);
}

function fetchSlides() {
    const url = inFetchUrl.get();
    if (!url) {
        container.innerHTML = "";
        outElement.set(null);
        if (deck) {
            try {
                deck.destroy();
            } catch (e) {}
            deck = null;
        }
        return;
    }

    outError.set("");
    op.setUiError("fetch_error", null);

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.text();
        })
        .then(html => {
            if (isScriptLoaded) {
                processHtml(html, url);
            } else {
                const interval = setInterval(() => {
                    if (isScriptLoaded) {
                        clearInterval(interval);
                        processHtml(html, url);
                    }
                }, 100);
            }
        })
        .catch(err => {
            op.logError("[RevealJs] Failed to fetch slides:", err);
            outError.set("Fetch failed: " + err.message);
            op.setUiError("fetch_error", "Fetch failed: " + err.message, 2);
        });
}

function processHtml(htmlText, fetchUrl) {
    if (deck) {
        try {
            deck.destroy();
        } catch (e) {}
        deck = null;
    }
    container.innerHTML = "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Resolve base path for relative URLs
    const userBase = inBaseUrl.get();
    let baseUrl = userBase;
    if (!baseUrl) {
        try {
            const parsed = new URL(fetchUrl, window.location.href);
            const paths = parsed.pathname.split("/");
            paths.pop();
            parsed.pathname = paths.join("/");
            baseUrl = parsed.href;
        } catch (e) {
            baseUrl = fetchUrl;
        }
    }

    function resolvePath(attrValue) {
        if (!attrValue) return attrValue;
        if (attrValue.startsWith("http://") || attrValue.startsWith("https://") || attrValue.startsWith("data:") || attrValue.startsWith("#")) {
            return attrValue;
        }
        try {
            return new URL(attrValue, baseUrl).href;
        } catch (e) {
            return attrValue;
        }
    }

    // Rewrite relative links and source paths
    doc.querySelectorAll("[src]").forEach(el => {
        el.setAttribute("src", resolvePath(el.getAttribute("src")));
    });

    doc.querySelectorAll("[href]").forEach(el => {
        el.setAttribute("href", resolvePath(el.getAttribute("href")));
    });

    doc.querySelectorAll("[style]").forEach(el => {
        let style = el.getAttribute("style");
        if (style.includes("url(")) {
            style = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, path) => {
                return `url('${resolvePath(path)}')`;
            });
            el.setAttribute("style", style);
        }
    });

    // Locate or build reveal.js container structure
    let revealNode = doc.querySelector(".reveal");
    if (!revealNode) {
        const slidesNode = doc.querySelector(".slides");
        if (slidesNode) {
            revealNode = document.createElement("div");
            revealNode.className = "reveal";
            revealNode.appendChild(slidesNode);
        } else {
            const sections = doc.querySelectorAll("section");
            if (sections.length > 0) {
                revealNode = document.createElement("div");
                revealNode.className = "reveal";
                const slidesDiv = document.createElement("div");
                slidesDiv.className = "slides";
                sections.forEach(sec => slidesDiv.appendChild(sec));
                revealNode.appendChild(slidesDiv);
            }
        }
    }

    if (!revealNode) {
        const errMsg = "Failed to parse slides structure: No .reveal, .slides, or <section> elements found.";
        outError.set(errMsg);
        op.setUiError("fetch_error", errMsg, 2);
        return;
    }

    revealNode.style.width = "100%";
    revealNode.style.height = "100%";

    container.appendChild(revealNode);
    outElement.set(container);

    // Instantiate Reveal.js deck after appending to layout
    setTimeout(() => {
        try {
            if (typeof Reveal === "undefined") {
                op.logError("[RevealJs] Reveal library is not loaded.");
                return;
            }

            deck = new Reveal(revealNode, {
                embedded: true,
                keyboard: true,
                respondToHashChanges: false,
                history: false,
                progress: true,
                controls: true
            });

            deck.initialize().then(() => {
                op.log("[RevealJs] Presentation initialized successfully.");
                outCurrentSlide.set(0);

                deck.on("slidechanged", event => {
                    outCurrentSlide.set(event.indexh);
                });

                const startIdx = inSlideIndex.get();
                if (startIdx > 0) {
                    deck.slide(startIdx);
                }
            }).catch(err => {
                op.logError("[RevealJs] Deck initialization failed:", err);
                outError.set("Init failed: " + err.message);
            });
        } catch (e) {
            op.logError("[RevealJs] Init exception:", e);
            outError.set("Init exception: " + e.message);
        }
    }, 100);
}
