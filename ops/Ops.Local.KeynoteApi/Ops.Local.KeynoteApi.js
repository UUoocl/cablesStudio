/**
 * Ops.Local.KeynoteApi
 * An operator that controls Keynote using JavaScript for Automation (JXA).
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

    op.log("[KeynoteApi] Processing API Request URL:", reqUrl);

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

    let jxaCode = "";

    switch (command) {
        case "start":
            jxaCode = `
                (function() {
                    try {
                        var keynote = Application('Keynote');
                        keynote.activate();
                        return JSON.stringify({ status: "success", message: "Keynote started" });
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
                        var keynote = Application('Keynote');
                        if (keynote.running()) {
                            keynote.quit();
                            return JSON.stringify({ status: "success", message: "Keynote stopped" });
                        }
                        return JSON.stringify({ status: "error", message: "Keynote was not running" });
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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No presentation open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        doc.start();

                        // Get adjusted active index for non-skipped slides
                        var currentSlide = doc.currentSlide();
                        var currentNum = currentSlide.slideNumber();
                        var adjustedActiveIndex = 0;
                        for (var i = 0; i < currentNum; i++) {
                            if (!doc.slides[i].skipped()) {
                                adjustedActiveIndex++;
                            }
                        }
                        return JSON.stringify({ status: "success", message: "Started presentation slideshow", activeIndex: adjustedActiveIndex });
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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No document is open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        if (keynote.playing()) {
                            doc.showNext();
                            // Get adjusted active index for non-skipped slides
                            var currentSlide = doc.currentSlide();
                            var currentNum = currentSlide.slideNumber();
                            var adjustedActiveIndex = 0;
                            for (var i = 0; i < currentNum; i++) {
                                if (!doc.slides[i].skipped()) {
                                    adjustedActiveIndex++;
                                }
                            }
                            return JSON.stringify({ status: "success", mode: "playing", message: "Advanced slides via showNext()", activeIndex: adjustedActiveIndex });
                        } else {
                            var currentIndex = doc.currentSlide().slideNumber(); // 1-indexed
                            var nextSlide = null;
                            for (var i = currentIndex; i < doc.slides.length; i++) {
                                if (!doc.slides[i].skipped()) {
                                    nextSlide = doc.slides[i];
                                    break;
                                }
                            }
                            if (nextSlide) {
                                doc.currentSlide = nextSlide;
                                // Get adjusted active index
                                var currentNum = nextSlide.slideNumber();
                                var adjustedActiveIndex = 0;
                                for (var i = 0; i < currentNum; i++) {
                                    if (!doc.slides[i].skipped()) {
                                        adjustedActiveIndex++;
                                    }
                                }
                                return JSON.stringify({ status: "success", mode: "editing", message: "Moved to slide " + adjustedActiveIndex, activeIndex: adjustedActiveIndex });
                            } else {
                                // Get adjusted active index for current slide
                                var currentSlide = doc.currentSlide();
                                var currentNum = currentSlide.slideNumber();
                                var adjustedActiveIndex = 0;
                                for (var i = 0; i < currentNum; i++) {
                                    if (!doc.slides[i].skipped()) {
                                        adjustedActiveIndex++;
                                    }
                                }
                                return JSON.stringify({ error: "Already on the last non-skipped slide", activeIndex: adjustedActiveIndex });
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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No document is open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        if (keynote.playing()) {
                            doc.showPrevious();
                            // Get adjusted active index for non-skipped slides
                            var currentSlide = doc.currentSlide();
                            var currentNum = currentSlide.slideNumber();
                            var adjustedActiveIndex = 0;
                            for (var i = 0; i < currentNum; i++) {
                                if (!doc.slides[i].skipped()) {
                                    adjustedActiveIndex++;
                                }
                            }
                            return JSON.stringify({ status: "success", mode: "playing", message: "Went back slides via showPrevious()", activeIndex: adjustedActiveIndex });
                        } else {
                            var currentIndex = doc.currentSlide().slideNumber(); // 1-indexed
                            var prevSlide = null;
                            for (var i = currentIndex - 2; i >= 0; i--) {
                                if (!doc.slides[i].skipped()) {
                                    prevSlide = doc.slides[i];
                                    break;
                                }
                            }
                            if (prevSlide) {
                                doc.currentSlide = prevSlide;
                                // Get adjusted active index
                                var currentNum = prevSlide.slideNumber();
                                var adjustedActiveIndex = 0;
                                for (var i = 0; i < currentNum; i++) {
                                    if (!doc.slides[i].skipped()) {
                                        adjustedActiveIndex++;
                                    }
                                }
                                return JSON.stringify({ status: "success", mode: "editing", message: "Moved to slide " + adjustedActiveIndex, activeIndex: adjustedActiveIndex });
                            } else {
                                // Get adjusted active index for current slide
                                var currentSlide = doc.currentSlide();
                                var currentNum = currentSlide.slideNumber();
                                var adjustedActiveIndex = 0;
                                for (var i = 0; i < currentNum; i++) {
                                    if (!doc.slides[i].skipped()) {
                                        adjustedActiveIndex++;
                                    }
                                }
                                return JSON.stringify({ error: "Already on the first non-skipped slide", activeIndex: adjustedActiveIndex });
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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No document is open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        var slideNum = ${slideNum};

                        // Helper to find slide by sequential non-skipped index
                        var targetSlide = null;
                        var count = 0;
                        for (var i = 0; i < doc.slides.length; i++) {
                            if (!doc.slides[i].skipped()) {
                                count++;
                                if (count === slideNum) {
                                    targetSlide = doc.slides[i];
                                    break;
                                }
                            }
                        }
                        if (!targetSlide) {
                            return JSON.stringify({ error: "Non-skipped slide number " + slideNum + " not found." });
                        }
                        doc.currentSlide = targetSlide;
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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No document is open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        var slideNumber = ${setSlideNum};
                        var sceneName = ${JSON.stringify(sceneName)};
                        var uuid = ${JSON.stringify(uuid)};

                        // Helper to find slide by sequential non-skipped index
                        var targetSlide = null;
                        var count = 0;
                        for (var i = 0; i < doc.slides.length; i++) {
                            if (!doc.slides[i].skipped()) {
                                count++;
                                if (count === slideNumber) {
                                    targetSlide = doc.slides[i];
                                    break;
                                }
                            }
                        }
                        if (!targetSlide) {
                            return JSON.stringify({ error: "Non-skipped slide number " + slideNumber + " not found." });
                        }

                        // Stop slideshow to release lock before updating presenter notes
                        try {
                            doc.stop();
                        } catch (e) {}
                        try {
                            keynote.stop(doc);
                        } catch (e) {}

                        var slide = targetSlide;
                        var notes = slide.presenterNotes() || "";
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

                        slide.presenterNotes = updatedNotes;
                        doc.currentSlide = slide;

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
                        var keynote = Application('Keynote');
                        if (!keynote.running()) {
                            return JSON.stringify({ error: "Keynote is not running" });
                        }
                        if (keynote.documents.length === 0) {
                            return JSON.stringify({ error: "No presentation open in Keynote" });
                        }
                        var doc = keynote.documents[0];
                        var slidesData = [];
                        var nonSkippedCount = 0;

                        for (var i = 0; i < doc.slides.length; i++) {
                            var slide = doc.slides[i];
                            if (slide.skipped()) {
                                continue;
                            }

                            nonSkippedCount++;
                            var notes = slide.presenterNotes() || "";
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

                        // Get adjusted active index for non-skipped slides
                        var currentSlide = doc.currentSlide();
                        var currentNum = currentSlide.slideNumber();
                        var adjustedActiveIndex = 0;
                        for (var i = 0; i < currentNum; i++) {
                            if (!doc.slides[i].skipped()) {
                                adjustedActiveIndex++;
                            }
                        }

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

    // Execute the self-contained JXA code
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
    op.logError("[KeynoteApi] Error:", msg);
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
        op.log("[KeynoteApi] Sent successful HTTP Response.");
    }
}

function sendErrorResponse(res, errorMsg) {
    if (res && typeof res.end === "function" && !res.headersSent) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: errorMsg }));
        op.log("[KeynoteApi] Sent error HTTP Response.");
    }
}
