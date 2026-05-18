// This script runs in index.html (the viewer host)
// It handles synchronization of the local viewer iframes (current, upcoming, teleprompter)
// based on messages from the Studio "brain" forwarded via parent window.

window.addEventListener('message', (event) => {
    try {
        const msg = JSON.parse(event.data);
        if (msg.namespace === 'speakerview-sync' && msg.channel === 'studio_to_currentSlide') {
            const data = msg.data;
            console.log("[SpeakerViewSync] Received event:", data.eventName, data.msgParam);

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

                if (slidesState) {
                    // 1. Sync current slide
                    if (window.currentSlide && window.currentSlide.contentWindow) {
                        window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'slide', args: slidesState }), "*");
                        window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'getSlideNotes' }), "*");
                    }

                    // 2. Sync upcoming slide (usually just current + 1 on indexh)
                    if (window.upcomingSlide && window.upcomingSlide.contentWindow) {
                        const upcomingState = [...slidesState];
                        upcomingState[0]++; // Increment horizontal index for "next" slide
                        window.upcomingSlide.contentWindow.postMessage(JSON.stringify({ method: 'slide', args: upcomingState }), "*");
                    }
                }
            } else if (data.eventName === "overview-toggled") {
                const msgParam = data.msgParam;
                if (window.currentSlide && window.currentSlide.contentWindow) {
                    window.currentSlide.contentWindow.postMessage(JSON.stringify({ method: 'toggleOverview', args: [msgParam.overview] }), "*");
                }
            }
        }
    } catch (err) {
        console.error("[SpeakerViewSync] Error processing message:", err);
    }
});
