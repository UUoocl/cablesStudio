let slideState = '';

// Subscribe to remote changes via WebSocket
(async () => {
    while (!window.ssSocket) {
        await new Promise(r => setTimeout(r, 100));
    }

    // Subscribe specifically for general setup commands (URL, etc.)
    const cmdChannel = window.ssSocket.subscribe('custom_slidesCommands');
    (async () => {
        for await (let data of cmdChannel) {
            const { eventName, msgParam } = data;
            if (eventName === 'set-slides-studio-url') {
                const url = msgParam.url;
                if (url) updateIframeUrl(url);
            }
        }
    })();

    // Subscribe to the broadcast navigation channel for RAW navigation only
    const navChannel = window.ssSocket.subscribe('slides_navigation');
    (async () => {
        for await (let data of navChannel) {
            const { eventName, msgParam } = data;
            
            // Only handle navigation
            if (eventName === 'slide-changed' || eventName === 'reveal-event') {
                const revealState = msgParam.state || msgParam.slideState || msgParam;
                
                let slidesState;
                if (msgParam.slideState && typeof msgParam.slideState === 'string') {
                    slidesState = msgParam.slideState.split(",").map(v => Number(v));
                } else if (revealState && typeof revealState.indexh !== 'undefined') {
                    slidesState = [revealState.indexh, revealState.indexv, revealState.indexf || 0];
                }

                if (slidesState) {
                    const iframe = document.getElementById("revealIframe");
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(JSON.stringify({ method: 'slide', args: slidesState }), '*');
                    }
                }
            }
        }
    })();

    // NEW: Subscribe to studio_to_currentSlide for indexing and direct navigation
    const studioChannel = window.ssSocket.subscribe('studio_to_currentSlide');
    (async () => {
        for await (let data of studioChannel) {
            const { eventName, msgParam } = data;
            if (eventName === 'navigate') {
                console.log("[SlideSync_OBS] Received navigation command:", msgParam.method, msgParam.args);
                const iframe = document.getElementById("revealIframe");
                if (iframe && iframe.contentWindow) {
                    // Forward { method, args } directly to iframe
                    iframe.contentWindow.postMessage(JSON.stringify(msgParam), '*');
                }
            }
        }
    })();
})();

function updateIframeUrl(url) {
    const oldIframe = document.getElementById("revealIframe");
    if (oldIframe) {
        const parent = oldIframe.parentNode;
        const newIframe = document.createElement("iframe");
        newIframe.id = "revealIframe";
        let currentClass = "full-screen";
        if (oldIframe.className.includes("side-by-side")) currentClass = "side-by-side";
        else if (oldIframe.className.includes("over-the-shoulder")) currentClass = "over-the-shoulder";
        
        newIframe.className = "slide-position " + currentClass;
        newIframe.setAttribute("allow", "autoplay; fullscreen");
        newIframe.style.width = "100%";
        newIframe.style.height = "100%";
        newIframe.onload = () => {
            if (window.onIframeLoad) window.onIframeLoad();
        };
        newIframe.src = url;
        parent.replaceChild(newIframe, oldIframe);
    }
}

// Message from Reveal Slides iFrame API
window.addEventListener('message', async (event) => {
    try {
        let data = JSON.parse(event.data);
        
        if (data.namespace === 'reveal') {
            console.log("[SlideSync_OBS] Message from Reveal iframe:", data.eventName || data.method);
            const newState = data.state ? JSON.stringify(data.state) : null;
            if (!newState || newState !== slideState) {
                if (newState) slideState = newState;
                
                // Report all reveal events (ready, slidechanged, callback, etc.) back to Studio
                if (window.ssSocket && window.ssSocket.state === 'open') {
                    window.ssSocket.publish('currentSlide_to_studio', { eventName: 'reveal-event', msgParam: data });
                }
            }
        }
    } catch (e) { }
});
