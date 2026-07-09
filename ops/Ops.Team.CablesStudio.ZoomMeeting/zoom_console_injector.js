(function() {
    console.log("%c[Zoom Sync Injector] Script loaded. Initializing...", "color: #2D8CFF; font-weight: bold; font-size: 14px;");

    // Parent Operator Configuration
    // The operator ID is injected by the parent when generating the script copy
    var opId = 'ZOOM_OP_ID_PLACEHOLDER';
    var parentOrigin = '*';

    // State Tracking
    var lastState = {
        muted: null,
        videoOff: null,
        activeSpeaker: null,
        participantsCount: null,
        lastChatSender: null,
        lastChatMessage: null
    };

    // Helper to send message to parent window (opener)
    function sendToParent(type, data) {
        if (window.opener) {
            try {
                window.opener.postMessage({
                    type: 'zoomSync',
                    opId: opId,
                    payload: {
                        type: type,
                        data: data
                    }
                }, parentOrigin);
            } catch (e) {
                console.error("[Zoom Sync] Failed to send message to parent:", e);
            }
        } else {
            console.warn("[Zoom Sync] No window.opener found. Parent window might have been closed.");
        }
    }

    // Helper to resolve the correct document (parent page or Zoom web client iframe)
    function getZoomDocument() {
        var iframe = document.getElementById('webclient') || document.querySelector('.pwa-webclient__iframe');
        if (iframe) {
            try {
                return iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                // Cross-origin fallback if browser security blocks it
            }
        }
        return document;
    }

    // Initialize Connection
    sendToParent('connectionStatus', 'connected');

    // Scrape Meeting State
    function checkMeetingState() {
        var doc = getZoomDocument();
        var state = {};

        // 1. Microphone Mute Status
        var micBtn = doc.querySelector('button[aria-label*="microphone"], button[aria-label*="mic"], button[aria-label*="Mute"], button[aria-label*="Unmute"]');
        if (micBtn) {
            var label = micBtn.getAttribute('aria-label') || '';
            state.muted = label.toLowerCase().indexOf('unmute') !== -1;
        } else {
            state.muted = null;
        }

        // 2. Video Camera Status
        var videoBtn = doc.querySelector('button[aria-label*="video"], button[aria-label*="camera"], button[aria-label*="Video"]');
        if (videoBtn) {
            var label = videoBtn.getAttribute('aria-label') || '';
            state.videoOff = label.toLowerCase().indexOf('start') !== -1;
        } else {
            state.videoOff = null;
        }

        // 3. Participants Count
        var partEl = doc.querySelector('#participant > div > button > div > span > span') || 
                     doc.querySelector('#participant > div > button > div > span');
        if (partEl) {
            var num = parseInt(partEl.textContent.trim(), 10);
            if (!isNaN(num)) {
                state.participantsCount = num;
            }
        } else {
            // Fallback to general participants button
            var partBtn = doc.querySelector('button[aria-label*="participants"], button[aria-label*="Participants"]');
            if (partBtn) {
                var label = partBtn.getAttribute('aria-label') || '';
                var countMatch = label.match(/\d+/);
                if (countMatch) {
                    state.participantsCount = parseInt(countMatch[0], 10);
                } else {
                    var badge = partBtn.querySelector('.badge, .number, span');
                    if (badge) {
                        var num = parseInt(badge.textContent.trim(), 10);
                        if (!isNaN(num)) state.participantsCount = num;
                    }
                }
            }
        }

        // 4. Active Speaker
        var activeSpeakerEl = doc.querySelector('.active-speaker, [class*="active-speaker"], [class*="speaker-active"]');
        if (activeSpeakerEl) {
            state.activeSpeaker = activeSpeakerEl.textContent.trim();
        } else {
            // Fallback: search for active thumbnail overlay or green border
            var speakerThumbnail = doc.querySelector('.speaker-highlight, [class*="speaker-highlight"], [style*="border-color: rgb(45, 140, 255)"]');
            if (speakerThumbnail) {
                state.activeSpeaker = speakerThumbnail.textContent.trim();
            }
        }

        // Detect and dispatch changes
        var changes = {};
        var hasChanges = false;

        ['muted', 'videoOff', 'activeSpeaker', 'participantsCount'].forEach(function(key) {
            if (state[key] !== lastState[key] && state[key] !== undefined) {
                lastState[key] = state[key];
                changes[key] = state[key];
                hasChanges = true;
            }
        });

        if (hasChanges) {
            sendToParent('stateUpdate', changes);
        }

        // Keep checking if the chat observer needs setup or cleanup
        checkChatObserver();
    }

    // 5. Chat Messages Observer
    // Dynamically manages the MutationObserver on the chat panel container
    var observedChatContainer = null;
    var chatObserver = null;

    function checkChatObserver() {
        var doc = getZoomDocument();
        var chatContainer = doc.querySelector('.chat-list, [class*="chat-list"], [class*="chat-messages"]');
        
        if (chatContainer && chatContainer !== observedChatContainer) {
            // Clean up previous observer if any
            if (chatObserver) {
                try { chatObserver.disconnect(); } catch(e) {}
            }
            observedChatContainer = chatContainer;
            console.log("[Zoom Sync] Chat container found. Observing chat messages...");
            
            chatObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            var node = mutation.addedNodes[i];
                            if (node.nodeType === 1) { // Element node
                                var senderEl = node.querySelector('.chat-message-item__sender, [class*="sender"], [class*="name"]');
                                var textEl = node.querySelector('.chat-message-item__text, [class*="text"], [class*="message"]');
                                
                                if (textEl) {
                                    var sender = senderEl ? senderEl.textContent.trim() : 'System';
                                    var text = textEl.textContent.trim();
                                    
                                    // Prevent double-triggering of identical messages
                                    if (lastState.lastChatMessage !== text || lastState.lastChatSender !== sender) {
                                        lastState.lastChatMessage = text;
                                        lastState.lastChatSender = sender;
                                        
                                        sendToParent('chatMessage', {
                                            sender: sender,
                                            message: text
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            });
            chatObserver.observe(chatContainer, { childList: true, subtree: true });
        } else if (!chatContainer && observedChatContainer) {
            // Chat container disappeared (chat panel closed)
            observedChatContainer = null;
            if (chatObserver) {
                try { chatObserver.disconnect(); } catch(e) {}
                chatObserver = null;
            }
            console.log("[Zoom Sync] Chat container removed. Stopped observing.");
        }
    }

    // Set up periodic check for state updates (microphone, camera, speaker, participants)
    var stateCheckInterval = setInterval(checkMeetingState, 1000);

    // Initial check
    checkMeetingState();

    // Clean up if re-injected
    if (window.zoomSyncCleanup) {
        try { window.zoomSyncCleanup(); } catch(e) {}
    }
    window.zoomSyncCleanup = function() {
        clearInterval(stateCheckInterval);
        if (chatObserver) chatObserver.disconnect();
        console.log("[Zoom Sync] Cleaned up previous observer instance.");
    };

})();
