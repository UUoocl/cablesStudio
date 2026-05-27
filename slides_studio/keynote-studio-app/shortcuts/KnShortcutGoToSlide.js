/* 
 * KEYNOTE STUDIO: Go To Slide
 * --------------------------------------------------
 * Purpose: Navigates Keynote to a specific slide number.
 * 
 * Apple Shortcuts Input Usage:
 * - `input` expects the target slide number as a number (e.g. 5).
 * - In Apple Shortcuts, pass the incoming Shortcut Input or variable 
 *   directly as the input to this "Run JavaScript for Automation" action.
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
    
    var slideNum = JSON.parse(input[0][0]);
	
	console.log(`slideNum ${slideNum}`)
    
    if (typeof slideNum !== "number" || isNaN(slideNum) || slideNum < 1 || slideNum > doc.slides.length) {
        return "Error: Invalid slide number: " + input;
    }
    
    // Set current slide (works in both edit and presentation/slideshow modes)
    doc.currentSlide = doc.slides[slideNum - 1];
    
    return "Success: Moved to slide " + slideNum;
	
}
