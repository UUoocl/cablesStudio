// Ops.Team.CablesStudio.RevealSlides.js

// Define inputs
const inUrl = op.inString("URL", "");
const inChannelName = op.inString("Broadcast Channel Name", "reveal-sync");
const inCss = op.inString("IFrame CSS", "width: 100%; height: 100%; border: none;");
const inWinName = op.inString("Window Name", "Reveal Presentation");
const inWinWidth = op.inInt("Window Width", 1024);
const inWinHeight = op.inInt("Window Height", 768);
const inWinX = op.inInt("Window X", 100);
const inWinY = op.inInt("Window Y", 100);

const inOpen = op.inTriggerButton("Open Child Window");
const inClose = op.inTriggerButton("Close Child Window");
const inNextSlide = op.inTriggerButton("Next Slide");
const inPrevSlide = op.inTriggerButton("Prev Slide");
const inSlideIndex = op.inInt("Slide Index", 0);

// Define outputs
const outOnOpen = op.outTrigger("On Open");
const outIndexH = op.outNumber("Index H", 0);
const outIndexV = op.outNumber("Index V", 0);
const outIndexF = op.outNumber("Index F", 0);
const outIndices = op.outObject("Indices", null);
const outAttributes = op.outObject("Attributes", null);
const outNotes = op.outString("Notes", "");
const outWindowStatus = op.outString("Window Status", "closed");
const outError = op.outString("Error", "");

// Port groupings
op.setPortGroup("Settings", [inUrl, inChannelName, inCss, inWinName, inWinWidth, inWinHeight, inWinX, inWinY]);
op.setPortGroup("Controls", [inOpen, inClose, inNextSlide, inPrevSlide, inSlideIndex]);

let bc = null;
let childWindow = null;

// Embedded template.html runner source code
const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RevealSlides Runner Window</title>
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #000;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <iframe id="reveal-iframe" src="about:blank"></iframe>

    <script>
        // Use var for top-level variables to allow safe redeclaration on popup reuse
        var bc = null;
        var channelName = null;

        // Config placeholders - will be replaced dynamically by the parent window upon open
        var bcName = 'reveal-sync';
        var slideUrl = '';
        var initialCss = 'width: 100%; height: 100%; border: none;';

        function setupBroadcastChannel(name) {
            if (bc) {
                bc.close();
            }
            channelName = name;
            bc = new BroadcastChannel(channelName);

            bc.onmessage = (event) => {
                const data = event.data;
                if (!data) return;

                if (data.type === 'next') {
                    sendToIframe({ method: 'next' });
                } else if (data.type === 'prev') {
                    sendToIframe({ method: 'prev' });
                } else if (data.type === 'slide') {
                    sendToIframe({
                        method: 'slide',
                        args: [data.indexh ?? 0, data.indexv ?? 0, data.indexf ?? 0]
                    });
                } else if (data.type === 'css') {
                    applyCss(data.css);
                }
            };

            // Notify parent window that the runner is ready
            bc.postMessage({ type: 'ready' });
        }

        function sendToIframe(msg) {
            const iframeEl = document.getElementById('reveal-iframe');
            if (iframeEl && iframeEl.contentWindow) {
                iframeEl.contentWindow.postMessage(JSON.stringify(msg), '*');
            }
        }

        function applyCss(cssString) {
            const iframeEl = document.getElementById('reveal-iframe');
            if (iframeEl && cssString) {
                iframeEl.style.cssText = cssString;
            }
        }

        function init() {
            // Apply initial CSS
            applyCss(initialCss);

            // Ensure URL contains postMessageEvents=true
            var url = slideUrl || '';
            if (url) {
                try {
                    const parsedUrl = new URL(url, window.location.href);
                    if (parsedUrl.searchParams.get("postMessageEvents") !== "true") {
                        parsedUrl.searchParams.set("postMessageEvents", "true");
                    }
                    url = parsedUrl.href;
                } catch(e) {
                    if (!url.includes("postMessageEvents=true")) {
                        url += (url.includes("?") ? "&" : "?") + "postMessageEvents=true";
                    }
                }
            }

            const iframeEl = document.getElementById('reveal-iframe');
            if (iframeEl) {
                iframeEl.src = url;
            }

            // Setup Broadcast Channel
            setupBroadcastChannel(bcName);
        }

        // Listen for postMessage events from the embedded reveal iframe
        window.addEventListener('message', (event) => {
            const iframeEl = document.getElementById('reveal-iframe');
            if (!iframeEl || event.source !== iframeEl.contentWindow) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data || data.namespace !== 'reveal') return;

                // Handle slide changed and fragment events
                if (data.eventName === 'slidechanged' || data.eventName === 'ready' || data.eventName === 'fragmentshown' || data.eventName === 'fragmenthidden') {
                    const state = data.state || {};
                    let attrs = {};
                    let notes = "";

                    // If same-origin, we can extract attributes and notes directly
                    try {
                        if (iframeEl.contentWindow.Reveal) {
                            const currentSlide = iframeEl.contentWindow.Reveal.getCurrentSlide();
                            if (currentSlide) {
                                for (let i = 0; i < currentSlide.attributes.length; i++) {
                                    const attr = currentSlide.attributes[i];
                                    attrs[attr.name] = attr.value;
                                }
                            }
                            notes = iframeEl.contentWindow.Reveal.getSlideNotes() || "";
                        }
                    } catch (e) {
                        // Cross-origin: Request them via postMessage callbacks
                        sendToIframe({ method: 'getCurrentSlide' });
                        sendToIframe({ method: 'getSlideNotes' });
                    }

                    if (bc) {
                        bc.postMessage({
                            type: 'slidechanged',
                            indexh: state.indexh ?? 0,
                            indexv: state.indexv ?? 0,
                            indexf: state.indexf ?? 0,
                            attributes: attrs,
                            notes: notes
                        });
                    }
                } else if (data.eventName === 'callback') {
                    // Forward cross-origin callback data back to Cables
                    if (bc) {
                        if (data.method === 'getCurrentSlide' || data.method === 'Reveal.getCurrentSlide();') {
                            bc.postMessage({
                                type: 'attributes',
                                attributes: data.result
                            });
                        } else if (data.method === 'getSlideNotes' || data.method === 'Reveal.getSlideNotes();') {
                            bc.postMessage({
                                type: 'notes',
                                notes: data.result
                            });
                        }
                    }
                }
            } catch (e) {
                // Not JSON or other error
            }
        });

        // Initialize on load
        window.addEventListener('load', init);
    </script>
</body>
</html>`;

function sendCmd(payload) {
    if (bc) {
        try {
            bc.postMessage(payload);
        } catch (e) {
            op.logWarn("[RevealSlides] Failed to send broadcast command:", e);
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
            childWindow.moveTo(inWinX.get() ?? 100, inWinY.get() ?? 100);
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
            childWindow.document.title = inWinName.get() || "Reveal Presentation";
        } catch (e) {}
    }
};

function initBroadcastChannel() {
    if (bc) {
        bc.close();
        bc = null;
    }

    const cName = inChannelName.get();
    if (!cName) return;

    bc = new BroadcastChannel(cName);
    bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'ready') {
            // Send initial setup values to runner
            sendCmd({ type: 'css', css: inCss.get() });
            sendCmd({ type: 'slide', indexh: inSlideIndex.get() });
        } else if (data.type === 'slidechanged') {
            outIndexH.set(data.indexh ?? 0);
            outIndexV.set(data.indexv ?? 0);
            outIndexF.set(data.indexf ?? 0);
            outIndices.set({
                indexh: data.indexh ?? 0,
                indexv: data.indexv ?? 0,
                indexf: data.indexf ?? 0
            });
            if (data.attributes) {
                outAttributes.set(data.attributes);
            }
            if (data.notes) {
                outNotes.set(data.notes);
            }
        } else if (data.type === 'attributes') {
            outAttributes.set(data.attributes);
        } else if (data.type === 'notes') {
            outNotes.set(data.notes);
        }
    };
}

inChannelName.onChange = initBroadcastChannel;

inCss.onChange = () => {
    sendCmd({ type: 'css', css: inCss.get() });
};

inNextSlide.onTriggered = () => {
    sendCmd({ type: 'next' });
};

inPrevSlide.onTriggered = () => {
    sendCmd({ type: 'prev' });
};

inSlideIndex.onChange = () => {
    sendCmd({
        type: 'slide',
        indexh: inSlideIndex.get()
    });
};

inOpen.onTriggered = () => {
    if (childWindow && !childWindow.closed) {
        childWindow.focus();
        return;
    }

    const cName = inChannelName.get() || "reveal-sync";
    const url = inUrl.get() || "";
    const css = inCss.get() || "";
    const winName = inWinName.get() || "Reveal Presentation";
    const w = inWinWidth.get() || 1024;
    const h = inWinHeight.get() || 768;
    const x = inWinX.get() ?? 100;
    const y = inWinY.get() ?? 100;

    const features = `width=${w},height=${h},left=${x},top=${y},location=no,toolbar=no,menubar=no,status=no,popup=yes,scrollbars=no,resizable=yes`;

    childWindow = window.open("", `reveal_slides_${op.id}`, features);
    if (!childWindow) {
        outError.set("Popup blocked! Allow popups to open the slide window.");
        outWindowStatus.set("closed");
        return;
    }

    outError.set("");
    outWindowStatus.set("open");
    outOnOpen.trigger();

    // Write template code with channel name and URL substituted
    const doc = childWindow.document;
    doc.open();

    const customizedTemplate = templateHtml
        .replace("<title>RevealSlides Runner Window</title>", `<title>${winName}</title>`)
        .replace("var bcName = 'reveal-sync';", `var bcName = '${cName}';`)
        .replace("var slideUrl = '';", `var slideUrl = '${url}';`)
        .replace("var initialCss = 'width: 100%; height: 100%; border: none;';", `var initialCss = '${css.replace(/'/g, "\\'")}';`);

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
        bc.close();
    }
    if (childWindow) {
        childWindow.close();
    }
};
