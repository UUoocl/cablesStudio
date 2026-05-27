/**
 * Ops.Local.PowerPointApi
 * An operator that controls Microsoft PowerPoint using JavaScript for Automation (JXA).
 */

const
    inTrigger = op.inTrigger("Trigger"),
    inRequest = op.inString("Request", ""),
    inResponse = op.inObject("Response"),

    outNext = op.outTrigger("Next"),
    outResult = op.outObject("Result"),
    outErrorTrigger = op.outTrigger("Error Trigger"),
    outErrorMsg = op.outString("Error Message"),
    outSseEventName = op.outString("SSE Event Name");

inTrigger.onTriggered = () => {
    const reqUrl = inRequest.get();
    const res = inResponse.get();

    if (!reqUrl) {
        setError("No active Request URL found on input port.");
        return;
    }

    op.log("[PowerPointApi] Processing API Request URL:", reqUrl);

    // Retrieve query parameters from the input request URL string
    let query = {};
    try {
        const parsedUrl = new URL(reqUrl, "http://localhost");
        query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch (e) {
        // Fallback manual query parsing if URL is not a standard full URL
        const queryString = reqUrl.includes('?') ? reqUrl.split('?')[1] : reqUrl;
        if (queryString) {
            const pairs = queryString.split('&');
            for (const pair of pairs) {
                const [key, value] = pair.split('=');
                if (key) {
                    query[decodeURIComponent(key)] = decodeURIComponent(value || "");
                }
            }
        }
    }

    const command = String(query.request || query.command || "").toLowerCase();
    if (!command) {
        sendErrorResponse(res, "Missing 'request' or 'command' query parameter.");
        return;
    }

    // Embed robust PowerPoint JXA helpers to inline inside JXA IIFE execution
    const helpersStr = `
        function isSlideSkipped(slide) {
            try {
                var hiddenVal = slide.slideShowTransition.hidden;
                if (typeof hiddenVal === 'function') {
                    return hiddenVal();
                }
                return !!hiddenVal;
            } catch(e) {
                return false;
            }
        }

        function getAdjustedActiveIndex(ppt, activePres) {
            try {
                var activeSlideIndex = 1;
                if (ppt.slideShowWindows.length > 0) {
                    activeSlideIndex = ppt.slideShowWindows[0].view.slide.slideIndex();
                } else {
                    activeSlideIndex = ppt.activeWindow.selection.slideRange.slideIndex();
                }
                
                var adjustedIndex = 0;
                for (var i = 0; i < activeSlideIndex; i++) {
                    if (!isSlideSkipped(activePres.slides[i])) {
                        adjustedIndex++;
                    }
                }
                return adjustedIndex;
            } catch(e) {
                return 1;
            }
        }

        function getSlideBySequentialIndex(activePres, seqIndex) {
            var count = 0;
            for (var i = 0; i < activePres.slides.length; i++) {
                var slide = activePres.slides[i];
                if (!isSlideSkipped(slide)) {
                    count++;
                    if (count === seqIndex) {
                        return slide;
                    }
                }
            }
            return null;
        }

        function getSlideNotes(slide) {
            try {
                var notesPage = slide.notesPage;
                for (var i = 0; i < notesPage.shapes.length; i++) {
                    var shape = notesPage.shapes[i];
                    var hasTf = shape.hasTextFrame;
                    if (typeof hasTf === 'function') hasTf = hasTf();
                    if (hasTf) {
                        var tf = shape.textFrame;
                        var hasTxt = tf.hasText;
                        if (typeof hasTxt === 'function') hasTxt = hasTxt();
                        if (hasTxt) {
                            var textRange = tf.textRange;
                            var content = textRange.content;
                            if (typeof content === 'function') {
                                return content();
                            }
                            return content || "";
                        }
                    }
                }
            } catch(e) {
                return "";
            }
            return "";
        }

        function setSlideNotes(slide, text) {
            try {
                var notesPage = slide.notesPage;
                var tf = null;
                for (var i = 0; i < notesPage.shapes.length; i++) {
                    var shape = notesPage.shapes[i];
                    var hasTf = shape.hasTextFrame;
                    if (typeof hasTf === 'function') hasTf = hasTf();
                    if (hasTf) {
                        tf = shape.textFrame;
                        break;
                    }
                }
                if (tf) {
                    var textRange = tf.textRange;
                    textRange.content = text;
                    return true;
                }
            } catch(e) {}
            return false;
        }
    `;

    let jxaCode = "";

    switch (command) {
        case "start":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        ppt.activate();
                        return JSON.stringify({ status: "success", message: "PowerPoint started" });
                    } catch (err) {
                        return JSON.stringify({ error: err.message });
                    }
                })()
            `;
            break;

        case "stop":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (ppt.running()) {
                            ppt.quit();
                            return JSON.stringify({ status: "success", message: "PowerPoint stopped" });
                        }
                        return JSON.stringify({ status: "error", message: "PowerPoint was not running" });
                    } catch (err) {
                        return JSON.stringify({ error: err.message });
                    }
                })()
            `;
            break;

        case "play":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;
                        ppt.runSlideShow(activePres.slideShowSettings);

                        ${helpersStr}

                        return JSON.stringify({ status: "success", message: "Started presentation slideshow", activeIndex: getAdjustedActiveIndex(ppt, activePres) });
                    } catch (err) {
                        return JSON.stringify({ error: "Failed to play presentation: " + err.message });
                    }
                })()
            `;
            break;

        case "next":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;

                        ${helpersStr}

                        if (ppt.slideShowWindows.length > 0) {
                            ppt.slideShowWindows[0].view.next();
                            return JSON.stringify({ status: "success", mode: "playing", message: "Advanced slides", activeIndex: getAdjustedActiveIndex(ppt, activePres) });
                        } else {
                            var currentSlideIndex = ppt.activeWindow.selection.slideRange.slideIndex(); // 1-indexed
                            var nextSlide = null;
                            for (var i = currentSlideIndex; i < activePres.slides.length; i++) {
                                var slide = activePres.slides[i];
                                if (!isSlideSkipped(slide)) {
                                    nextSlide = slide;
                                    break;
                                }
                            }
                            if (nextSlide) {
                                nextSlide.select();
                                var adjusted = getAdjustedActiveIndex(ppt, activePres);
                                return JSON.stringify({ status: "success", mode: "editing", message: "Moved to slide " + adjusted, activeIndex: adjusted });
                            } else {
                                return JSON.stringify({ error: "Already on the last non-skipped slide", activeIndex: getAdjustedActiveIndex(ppt, activePres) });
                            }
                        }
                    } catch (err) {
                        return JSON.stringify({ error: "Error handling next: " + err.message });
                    }
                })()
            `;
            break;

        case "prev":
        case "previous":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;

                        ${helpersStr}

                        if (ppt.slideShowWindows.length > 0) {
                            ppt.slideShowWindows[0].view.previous();
                            return JSON.stringify({ status: "success", mode: "playing", message: "Went back slides", activeIndex: getAdjustedActiveIndex(ppt, activePres) });
                        } else {
                            var currentSlideIndex = ppt.activeWindow.selection.slideRange.slideIndex(); // 1-indexed
                            var prevSlide = null;
                            for (var i = currentSlideIndex - 2; i >= 0; i--) {
                                var slide = activePres.slides[i];
                                if (!isSlideSkipped(slide)) {
                                    prevSlide = slide;
                                    break;
                                }
                            }
                            if (prevSlide) {
                                prevSlide.select();
                                var adjusted = getAdjustedActiveIndex(ppt, activePres);
                                return JSON.stringify({ status: "success", mode: "editing", message: "Moved to slide " + adjusted, activeIndex: adjusted });
                            } else {
                                return JSON.stringify({ error: "Already on the first non-skipped slide", activeIndex: getAdjustedActiveIndex(ppt, activePres) });
                            }
                        }
                    } catch (err) {
                        return JSON.stringify({ error: "Error handling previous: " + err.message });
                    }
                })()
            `;
            break;

        case "goto":
            const slideNum = parseInt(query.slide);
            if (isNaN(slideNum) || slideNum < 1) {
                sendErrorResponse(res, "Missing or invalid 'slide' parameter for goto command.");
                return;
            }
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;
                        var slideNum = ${slideNum};

                        ${helpersStr}

                        var targetSlide = getSlideBySequentialIndex(activePres, slideNum);
                        if (!targetSlide) {
                            return JSON.stringify({ error: "Non-skipped slide number " + slideNum + " not found." });
                        }

                        if (ppt.slideShowWindows.length > 0) {
                            ppt.slideShowWindows[0].view.goToSlide(targetSlide.slideIndex());
                        } else {
                            targetSlide.select();
                        }

                        return JSON.stringify({ status: "success", message: "Moved to slide " + slideNum, activeIndex: slideNum });
                    } catch (err) {
                        return JSON.stringify({ error: "Error in goto: " + err.message });
                    }
                })()
            `;
            break;

        case "setscene":
            const setSlideNum = parseInt(query.slide);
            const sceneName = query.scene || "";
            const uuid = query.uuid || "";
            if (isNaN(setSlideNum) || setSlideNum < 1) {
                sendErrorResponse(res, "Missing or invalid 'slide' parameter for setscene command.");
                return;
            }
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;
                        var slideNumber = ${setSlideNum};
                        var sceneName = ${JSON.stringify(sceneName)};
                        var uuid = ${JSON.stringify(uuid)};

                        ${helpersStr}

                        var targetSlide = getSlideBySequentialIndex(activePres, slideNumber);
                        if (!targetSlide) {
                            return JSON.stringify({ error: "Non-skipped slide number " + slideNumber + " not found." });
                        }

                        // Stop slideshow to release lock before updating presenter notes
                        try {
                            if (ppt.slideShowWindows.length > 0) {
                                ppt.slideShowWindows[0].close();
                            }
                        } catch (e) {}

                        var notes = getSlideNotes(targetSlide) || "";
                        var metadata = {};
                        var cleanNotes = notes;

                        var delimiterIndex = notes.indexOf("|||");
                        if (delimiterIndex !== -1) {
                            var metaString = notes.substring(0, delimiterIndex).trim();
                            cleanNotes = notes.substring(delimiterIndex + 3).trim();
                            try {
                                metadata = JSON.parse(metaString);
                            } catch (e) {
                                metadata = {};
                                cleanNotes = notes;
                            }
                        }

                        metadata.Scene = sceneName;
                        if (!metadata.Id && uuid) {
                            metadata.Id = uuid;
                        }
                        if (!metadata.Name) {
                            metadata.Name = "Slide " + slideNumber;
                        }
                        if (!metadata.Section) {
                            metadata.Section = "";
                        }

                        var updatedMetaString = JSON.stringify(metadata);
                        var updatedNotes = updatedMetaString + "\\n|||\\n" + cleanNotes;

                        setSlideNotes(targetSlide, updatedNotes);
                        
                        if (ppt.slideShowWindows.length > 0) {
                            // nothing in play mode
                        } else {
                            targetSlide.select();
                        }

                        return JSON.stringify({ status: "success", message: "Updated slide " + slideNumber + " with scene " + sceneName, activeIndex: slideNumber });
                    } catch (err) {
                        return JSON.stringify({ error: "Error updating slide scene: " + err.message });
                    }
                })()
            `;
            break;

        case "getslides":
            jxaCode = `
                (function() {
                    try {
                        var ppt = Application('Microsoft PowerPoint');
                        if (!ppt.running()) {
                            return JSON.stringify({ error: "PowerPoint is not running" });
                        }
                        if (ppt.presentations.length === 0) {
                            return JSON.stringify({ error: "No presentation open in PowerPoint" });
                        }
                        var activePres = ppt.activePresentation;
                        var slidesData = [];
                        var nonSkippedCount = 0;

                        ${helpersStr}

                        for (var i = 0; i < activePres.slides.length; i++) {
                            var slide = activePres.slides[i];
                            if (isSlideSkipped(slide)) {
                                continue;
                            }

                            nonSkippedCount++;
                            var notes = getSlideNotes(slide) || "";
                            var metadata = {};
                            var cleanNotes = notes;

                            var delimiterIndex = notes.indexOf("|||");
                            if (delimiterIndex !== -1) {
                                var metaString = notes.substring(0, delimiterIndex).trim();
                                cleanNotes = notes.substring(delimiterIndex + 3).trim();
                                try {
                                    metadata = JSON.parse(metaString);
                                } catch (e) {
                                    metadata = {};
                                    cleanNotes = notes;
                                }
                            }

                            var slideInfo = {
                                Index: nonSkippedCount,
                                Name: metadata.Name || ("Slide " + nonSkippedCount),
                                Scene: metadata.Scene || "",
                                Section: metadata.Section || "",
                                Id: metadata.Id || null,
                                Notes: cleanNotes
                            };
                            slidesData.push(slideInfo);
                        }

                        var adjustedActiveIndex = getAdjustedActiveIndex(ppt, activePres);

                        var result = {
                            ActiveIndex: adjustedActiveIndex,
                            activeIndex: adjustedActiveIndex,
                            Slides: slidesData
                        };
                        return JSON.stringify(result);
                    } catch (err) {
                        return JSON.stringify({ error: "Failed getting slides: " + err.message });
                    }
                })()
            `;
            break;

        default:
            sendErrorResponse(res, "Unsupported command request: " + command);
            return;
    }

    // Execute the self-contained PowerPoint JXA code
    runJxa(jxaCode, (err, stdout) => {
        if (err) {
            setError("JXA Script Execution Error: " + err.message, res);
            return;
        }

        let parsedResult = null;
        try {
            parsedResult = JSON.parse(stdout);
        } catch (e) {
            parsedResult = { raw: stdout };
        }

        if (parsedResult && parsedResult.error) {
            setError(parsedResult.error, res);
        } else {
            outSseEventName.set(command + "response");
            outResult.set(parsedResult);
            sendSuccessResponse(res, parsedResult);
            outNext.trigger();
        }
    });
};

function runJxa(jxaCode, callback) {
    let cp;
    try {
        if (typeof op.require === "function") {
            cp = op.require("child_process");
        } else {
            cp = require("child_process");
        }
    } catch (e) {
        callback(new Error("Could not load child_process module. Are you in Electron/Node?"));
        return;
    }

    const process = cp.spawn("osascript", ["-l", "JavaScript"]);
    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
        stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
        stderr += data.toString();
    });

    process.on("close", (code) => {
        if (code !== 0) {
            callback(new Error(stderr || `osascript exited with code ${code}`));
        } else {
            callback(null, stdout.trim());
        }
    });

    process.on("error", (err) => {
        callback(err);
    });

    process.stdin.write(jxaCode);
    process.stdin.end();
}

function setError(msg, res) {
    op.logError("[PowerPointApi] Error:", msg);
    outErrorMsg.set(msg);
    outErrorTrigger.trigger();
    if (res) {
        sendErrorResponse(res, msg);
    }
}

function sendSuccessResponse(res, data) {
    if (res && typeof res.end === "function" && !res.headersSent) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
        op.log("[PowerPointApi] Sent successful HTTP Response.");
    }
}

function sendErrorResponse(res, errorMsg) {
    if (res && typeof res.end === "function" && !res.headersSent) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: errorMsg }));
        op.log("[PowerPointApi] Sent error HTTP Response.");
    }
}
