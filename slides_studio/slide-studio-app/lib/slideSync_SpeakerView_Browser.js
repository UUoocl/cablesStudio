// This script runs in index.html (the viewer host)
// It handles synchronization of the local viewer iframes (current, upcoming, teleprompter)
// based on messages from the Studio "brain" and WebSocket events.

(async () => {
    // Wait for ssSocket to be available
    while (!window.ssSocket) {
        await new Promise(r => setTimeout(r, 100));
    }

    // Subscribe to commands specifically for this viewer instance
    const channel = window.ssSocket.subscribe('studio_to_currentSlide');
    
    for await (let data of channel) {
        try {
            if (data.eventName === "slide-changed" || data.eventName === "navigate") {
                const msgParam = data.msgParam;
                let slidesState;
                
                if (msgParam.slideState) {
                    slidesState = msgParam.slideState.split(",").map(value => Number(value));
                } else if (msgParam.args) {
                    slidesState = msgParam.args;
                } else if (typeof msgParam.indexh !== 'undefined') {
                    slidesState = [msgParam.indexh, msgParam.indexv, msgParam.indexf || 0];
                }

                if (slidesState && window.currentSlide && window.currentSlide.contentWindow) {
                    window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'slide', args: slidesState }), "*");
                    window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'getSlideNotes' }), "*");
                }
            } else if (data.eventName === "overview-toggled") {
                const msgParam = data.msgParam;
                if (window.currentSlide && window.currentSlide.contentWindow) {
                    window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'toggleOverview', args: [msgParam.overview] }), "*");
                }
            }
        } catch (err) {
            console.error("[SpeakerViewerSync] Error processing WS message:", err);
        }
    }
})();
