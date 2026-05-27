/* 
 * KEYNOTE STUDIO: Next Slide (Skip Skipped Slides)
 * --------------------------------------------------
 * Purpose: Navigates Keynote forward to the next slide, automatically
 *          skipping over slides that are hidden/skipped.
 * 
 * Apple Shortcuts Input Usage:
 * - This script does NOT require any input parameters.
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
    try {
        doc.showNext();
        return "Success: Advanced slides via showNext()";
    } catch (e) {
        return "Error calling showNext(): " + e.message;
    }
}
