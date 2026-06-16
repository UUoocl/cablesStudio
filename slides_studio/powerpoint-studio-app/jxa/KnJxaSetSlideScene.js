/* 
 * KEYNOTE STUDIO: Set Slide Scene Metadata
 * --------------------------------------------------
 * Purpose: Saves slide scene mapping and UUID to a Keynote slide's presenter notes
 *          using the "|||" delimiter.
 * 
 * Apple Shortcuts Input Usage:
 * - `input` expects a JSON string containing the slide properties:
 *   e.g. {"slideNumber": 2, "sceneName": "Over The Shoulder", "uuid": "abc-123-uuid"}
 * - In Apple Shortcuts, pass the incoming JSON payload string directly 
 *   as the input to this "Run JavaScript for Automation" action.
 */
function run(input, parameters) {
    var keynote = Application('Keynote');
    if (!keynote.running()) {
        return "Keynote is not running";
    }
    if (keynote.documents.length === 0) {
        return "No document is open in Keynote";
    }

    var doc = keynote.documents[0];

    var data = {};
    try {
        data = JSON.parse(input[0][0]);
    } catch (e) {
        return "Error parsing input JSON: " + e.toString();
    }

    var slideNumber = parseInt(data.slideNumber);
    var sceneName = data.sceneName || "";
    var uuid = data.uuid || null;

    if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > doc.slides.length) {
        return "Error: Invalid slide number: " + data.slideNumber;
    }

    // Stop slideshow to release lock on iWork document before updating notes
    try {
        keynote.stop(doc);
    } catch (e) { }

    var slide = doc.slides[slideNumber - 1];
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

    // Update scene mapping
    metadata.Scene = sceneName;

    // Preserve existing Id or assign the UI-generated uuid
    if (!metadata.Id) {
        metadata.Id = uuid;
    }

    // Retain or set standard properties
    if (!metadata.Name) {
        metadata.Name = "Slide " + slideNumber;
    }
    if (!metadata.Section) {
        metadata.Section = "";
    }

    var updatedMetaString = JSON.stringify(metadata);
    var updatedNotes = updatedMetaString + "\n|||\n" + cleanNotes;

    // Write back to slide presenter notes
    slide.presenterNotes = updatedNotes;

    // Move editor focus to this slide
    doc.currentSlide = slide;

    return "Success: Updated slide " + slideNumber + " with scene " + sceneName + " and ID " + metadata.Id;
}