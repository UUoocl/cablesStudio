/* 
 * KEYNOTE STUDIO: Get Slides Metadata
 * --------------------------------------------------
 * Purpose: Loops through the active Keynote presentation, extracts presenter notes,
 *          parses metadata, and returns a JSON array of slide details.
 * 
 * Apple Shortcuts Input Usage:
 * - `input` receives the dynamic callback URL passed from the Cables `ShortcutsRequest` operator's "Callback URL" input.
 * - In Apple Shortcuts, you can use the native "Shortcut Input" variable as the dynamic target URL in the subsequent "Get Contents of URL" action.
 */
function run(input, parameters) {
    var keynote = Application('Keynote');
    if (!keynote.running()) {
        return JSON.stringify({ error: "Keynote is not running" });
    }

    if (keynote.documents.length === 0) {
        return JSON.stringify({ error: "No presentation open in Keynote" });
    }

    var doc = keynote.documents[0];
    var slidesData = [];

    for (var i = 0; i < doc.slides.length; i++) {
        var slide = doc.slides[i];
        if (slide.skipped()) {
            continue;
        }

        var slideIndex = i + 1;
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
            Index: slideIndex,
            Name: metadata.Name || ("Slide " + slideIndex),
            Scene: metadata.Scene || "",
            Section: metadata.Section || "",
            Id: metadata.Id || null,
            Notes: cleanNotes
        };
        slidesData.push(slideInfo);
    }

    var result = {
        ActiveIndex: doc.currentSlide().slideNumber(),
        Slides: slidesData
    };
    var jsonPayload = JSON.stringify(result);
    return jsonPayload;
}
/*
 * NOTE FOR APPLE SHORTCUTS INTEGRATION:
 * In Apple Shortcuts, JXA shell scripting (like curl via doShellScript) is restricted/disabled.
 * To send this payload back to your Cables Standalone HTTP Server dynamically:
 * 
 * 1. Simply return the `jsonPayload` from this JXA script (done below).
 * 2. In Apple Shortcuts, configure your Shortcut to accept input when run:
 *    - The incoming "Shortcut Input" is the dynamic callback URL sent by the Cables patch (e.g. http://localhost:57000/callback/slides-data).
 * 3. Add a "Get Contents of URL" action directly after this "Run JavaScript for Automation" action:
 *    - URL: Set this dynamically using the "Shortcut Input" variable (right-click the URL field -> Insert Variable -> Shortcut Input).
 *    - Method: POST
 *    - Headers:
 *        * Content-Type: application/json
 *    - Request Body: Text or File
 *    - Set the Request Body value to the output (Result) of this Run JavaScript for Automation action.
 */