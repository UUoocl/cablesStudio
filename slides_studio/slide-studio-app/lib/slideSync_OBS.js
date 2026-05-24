let slideState = '';

// Subscribe to remote changes via native OBS browser events
window.addEventListener('slidesCommand', (event) => {
    try {
        const { channel, eventName, msgParam } = event.detail;
        console.log(`[SlideSync_OBS] Received OBS browser event on channel: ${channel}, event: ${eventName}`, msgParam);

        if (channel === 'custom_slidesCommands') {
            if (eventName === 'set-slides-studio-url') {
                const url = msgParam.url;
                if (url) updateIframeUrl(url);
            } else if (eventName === 'CHOREOGRAPHY_UPDATE') {
                const config = msgParam.config || {};
                console.log("[SlideSync_OBS] Choreography Update:", config);
                
                if (typeof window.applySlideComponentConfig === 'function') {
                    window.applySlideComponentConfig(config.slideComponent || null, config.moveTransition || null);
                }
                
                if (config.cameraComponent) {
                    const cameraBc = new BroadcastChannel("cameraShapes_channel");
                    cameraBc.postMessage(config.cameraComponent);
                    cameraBc.close();
                }
            }
        } else if (channel === 'slides_navigation') {
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
        } else if (channel === 'studio_to_currentSlide') {
            if (eventName === 'navigate') {
                console.log("[SlideSync_OBS] Received navigation command:", msgParam.method, msgParam.args);
                const iframe = document.getElementById("revealIframe");
                if (iframe && iframe.contentWindow) {
                    // Forward { method, args } directly to iframe
                    iframe.contentWindow.postMessage(JSON.stringify(msgParam), '*');
                }
            }
        }
    } catch (err) {
        console.error("[SlideSync_OBS] Error processing slidesCommand event:", err);
    }
});

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

        // Maintain and append settings parameters from window.location.search
        try {
            const parentParams = new URLSearchParams(window.location.search);
            const deckUrlObj = new URL(url.startsWith('http') ? url : `${window.location.origin}/${url}`);
            deckUrlObj.searchParams.set('postMessageEvents', 'true');
            deckUrlObj.searchParams.set('postMessage', 'true');
            if (parentParams.has('controls')) {
                deckUrlObj.searchParams.set('controls', parentParams.get('controls'));
            }
            if (parentParams.has('progress')) {
                deckUrlObj.searchParams.set('progress', parentParams.get('progress'));
            }
            newIframe.src = deckUrlObj.toString();
        } catch (err) {
            console.error("[SlideSync_OBS] Failed to parse URL for preservation:", url, err);
            newIframe.src = url;
        }

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
            }
        }
    } catch (e) { }
});
