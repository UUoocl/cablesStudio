// Ops.Team.CablesStudio.Fetch.js

const DEFAULT_REVEAL_SCRIPT = `// Reveal.js Support Script for Fetched Slide Decks
// Available context: container (DOM element), fetchUrl, baseUrl, op

const CORE_CSS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css";
const THEME_CSS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/theme/black.min.css";
const REVEAL_JS = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js";

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
    let script = document.querySelector(\`script[src="\${url}"]\`);
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
        op.logError("[Script] Failed to load Reveal library:", url);
    };
    document.head.appendChild(script);
}

// Load core styles
loadStylesheet("reveal-core-css", CORE_CSS);
loadStylesheet("reveal-theme-default", THEME_CSS);

loadScript(REVEAL_JS, () => {
    // Locate reveal container inside fetched markup
    let revealNode = container.querySelector(".reveal");
    if (!revealNode) {
        const slidesNode = container.querySelector(".slides");
        if (slidesNode) {
            revealNode = document.createElement("div");
            revealNode.className = "reveal";
            slidesNode.parentNode.insertBefore(revealNode, slidesNode);
            revealNode.appendChild(slidesNode);
        } else {
            const sections = container.querySelectorAll("section");
            if (sections.length > 0) {
                revealNode = document.createElement("div");
                revealNode.className = "reveal";
                const slidesDiv = document.createElement("div");
                slidesDiv.className = "slides";
                sections.forEach(sec => slidesDiv.appendChild(sec));
                revealNode.appendChild(slidesDiv);
                container.appendChild(revealNode);
            }
        }
    }

    if (!revealNode) {
        op.logWarn("[Script] No .reveal, .slides, or <section> elements found in fetched content.");
        return;
    }

    revealNode.style.width = "100%";
    revealNode.style.height = "100%";

    setTimeout(() => {
        try {
            if (typeof Reveal === "undefined") return;
            const deck = new Reveal(revealNode, {
                embedded: true,
                keyboard: true,
                respondToHashChanges: false,
                history: false,
                progress: true,
                controls: true
            });

            deck.initialize().then(() => {
                op.log("[Script] Reveal presentation initialized successfully.");
            }).catch(err => {
                op.logError("[Script] Deck initialization failed:", err);
            });

            // Store teardown hook on container for cleanup on reload/delete
            container._cleanupScript = () => {
                try { deck.destroy(); } catch (e) {}
            };
        } catch (e) {
            op.logError("[Script] Exception during Reveal init:", e);
        }
    }, 50);
});
`;

// Define inputs
const inFetchUrl = op.inString("URL", "");
const inBaseUrl = op.inString("Base URL", "");
const inScript = op.inStringEditor("Script", DEFAULT_REVEAL_SCRIPT);
const inReload = op.inTriggerButton("Reload");
const inAutoFetch = op.inBool("Auto Fetch", true);
const inWidth = op.inString("Width", "100%");
const inHeight = op.inString("Height", "100%");
const inOverflow = op.inValueSelect("Overflow", ["hidden", "visible", "auto", "scroll"], "hidden");

// Define outputs
const outElement = op.outObject("Element");
const outHtml = op.outString("HTML", "");
const outLoaded = op.outTrigger("Loaded");
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Controls", [inReload, inAutoFetch]);
op.setPortGroup("Scripting", [inScript]);
op.setPortGroup("Container Styling", [inWidth, inHeight, inOverflow]);

// Create container element
const container = document.createElement("div");
container.className = "cables-fetch-container";
container.style.position = "relative";
updateContainerStyles();

// Initial output
outElement.set(container);

// Listeners
inWidth.onChange = updateContainerStyles;
inHeight.onChange = updateContainerStyles;
inOverflow.onChange = updateContainerStyles;

inFetchUrl.onChange = () => {
    if (inAutoFetch.get()) {
        fetchContent();
    }
};

inBaseUrl.onChange = () => {
    if (inAutoFetch.get()) {
        fetchContent();
    }
};

inScript.onChange = () => {
    if (inAutoFetch.get() && container.innerHTML) {
        const rawUrl = inFetchUrl.get();
        const resolvedUrl = resolveAssetUrl(rawUrl);
        const resolvedBase = resolveBaseUrl(resolvedUrl);
        executeUserScript(resolvedUrl, resolvedBase);
    }
};

inReload.onTriggered = () => {
    fetchContent();
};

op.onDelete = () => {
    if (container._cleanupScript) {
        try {
            container._cleanupScript();
        } catch (e) {}
        container._cleanupScript = null;
    }
    container.innerHTML = "";
    outElement.set(null);
    outHtml.set("");
};

function updateContainerStyles() {
    container.style.width = inWidth.get() || "100%";
    container.style.height = inHeight.get() || "100%";
    container.style.overflow = inOverflow.get() || "hidden";
}

function resolveAssetUrl(rawUrl) {
    if (!rawUrl) return "";
    let resolved = rawUrl;
    if (op.patch && typeof op.patch.getFilePath === "function") {
        const p = op.patch.getFilePath(rawUrl);
        if (p) resolved = p;
    } else if (op.patch && typeof op.patch.filePath === "function") {
        const p = op.patch.filePath(rawUrl);
        if (p) resolved = p;
    }
    return resolved;
}

function resolveBaseUrl(resolvedUrl) {
    const userBase = resolveAssetUrl(inBaseUrl.get());
    let baseUrl = userBase;
    if (!baseUrl && resolvedUrl) {
        try {
            const parsed = new URL(resolvedUrl, window.location.href);
            const paths = parsed.pathname.split("/");
            paths.pop();
            parsed.pathname = paths.join("/");
            baseUrl = parsed.href;
        } catch (e) {
            baseUrl = resolvedUrl;
        }
    }
    return baseUrl || resolvedUrl || "";
}

function fetchContent() {
    const rawUrl = inFetchUrl.get();
    if (!rawUrl) {
        if (container._cleanupScript) {
            try { container._cleanupScript(); } catch (e) {}
            container._cleanupScript = null;
        }
        container.innerHTML = "";
        outHtml.set("");
        outError.set("");
        op.setUiError("fetch_error", null);
        return;
    }

    const resolvedUrl = resolveAssetUrl(rawUrl);

    outError.set("");
    op.setUiError("fetch_error", null);

    fetch(resolvedUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP " + response.status + ": " + response.statusText);
            }
            return response.text();
        })
        .then(htmlText => {
            processHtml(htmlText, resolvedUrl);
        })
        .catch(err => {
            let msg = err.message;
            if (msg === "Failed to fetch") {
                msg = `Failed to fetch '${resolvedUrl}'. Possible causes: CORS restriction (remote server missing Access-Control-Allow-Origin), mixed content (HTTP blocked on HTTPS), or invalid URL.`;
            }
            op.logError("[Fetch]", msg);
            outError.set("Fetch failed: " + msg);
            op.setUiError("fetch_error", "Fetch failed: " + msg, 2);
        });
}

function processHtml(htmlText, fetchUrl) {
    if (container._cleanupScript) {
        try { container._cleanupScript(); } catch (e) {}
        container._cleanupScript = null;
    }
    container.innerHTML = "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const baseUrl = resolveBaseUrl(fetchUrl);

    function resolvePath(attrValue) {
        if (!attrValue) return attrValue;
        if (
            attrValue.startsWith("http://") ||
            attrValue.startsWith("https://") ||
            attrValue.startsWith("data:") ||
            attrValue.startsWith("blob:") ||
            attrValue.startsWith("#")
        ) {
            return attrValue;
        }
        try {
            return new URL(attrValue, baseUrl).href;
        } catch (e) {
            return attrValue;
        }
    }

    function resolveSrcset(srcsetValue) {
        if (!srcsetValue) return srcsetValue;
        return srcsetValue
            .split(",")
            .map(part => {
                const trimmed = part.trim();
                const [src, ...descriptors] = trimmed.split(/\s+/);
                return [resolvePath(src), ...descriptors].join(" ");
            })
            .join(", ");
    }

    // 1. Rewrite relative links, stylesheets, and source paths
    doc.querySelectorAll("[src]").forEach(el => {
        el.setAttribute("src", resolvePath(el.getAttribute("src")));
    });

    doc.querySelectorAll("[href]").forEach(el => {
        el.setAttribute("href", resolvePath(el.getAttribute("href")));
    });

    doc.querySelectorAll("[srcset]").forEach(el => {
        el.setAttribute("srcset", resolveSrcset(el.getAttribute("srcset")));
    });

    // 2. Rewrite inline styles with url(...)
    doc.querySelectorAll("[style]").forEach(el => {
        let style = el.getAttribute("style");
        if (style && style.includes("url(")) {
            style = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, path) => {
                return `url('${resolvePath(path)}')`;
            });
            el.setAttribute("style", style);
        }
    });

    // 3. Rewrite <style> tags containing @import or url(...)
    doc.querySelectorAll("style").forEach(styleEl => {
        let css = styleEl.textContent;
        if (css && css.includes("url(")) {
            css = css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, path) => {
                return `url('${resolvePath(path)}')`;
            });
            styleEl.textContent = css;
        }
    });

    // 4. Extract styles/links from <head> and append to container
    const headElements = doc.head ? Array.from(doc.head.children) : [];
    headElements.forEach(child => {
        if (child.tagName === "STYLE" || (child.tagName === "LINK" && child.rel === "stylesheet")) {
            container.appendChild(child.cloneNode(true));
        }
    });

    // 5. Transfer document body elements (or root nodes)
    const bodyElements = doc.body ? Array.from(doc.body.children) : Array.from(doc.documentElement.children);
    if (bodyElements.length > 0) {
        bodyElements.forEach(child => {
            container.appendChild(child);
        });
    } else if (doc.body && doc.body.childNodes.length > 0) {
        Array.from(doc.body.childNodes).forEach(child => {
            container.appendChild(child);
        });
    } else {
        container.innerHTML = htmlText;
    }

    // Update outputs
    outElement.set(container);
    outHtml.set(container.innerHTML);

    // Execute user-provided script
    executeUserScript(fetchUrl, baseUrl);

    outLoaded.trigger();
}

function executeUserScript(fetchUrl, baseUrl) {
    const userScript = inScript.get();
    if (!userScript || !userScript.trim()) return;

    try {
        const scriptFn = new Function("container", "fetchUrl", "baseUrl", "op", userScript);
        scriptFn(container, fetchUrl, baseUrl, op);
    } catch (err) {
        op.logError("[Fetch] Error executing user script:", err);
        outError.set("Script error: " + err.message);
    }
}
