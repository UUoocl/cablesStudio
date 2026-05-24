/**
 * Ops.Local.ShortcutsRequest
 * A set-and-forget operator that triggers a macOS Shortcut using the shortcuts:// URI protocol via a hidden iframe.
 */

const
    inShortcutUrl = op.inString("Shortcut URL", ""),
    inCallbackUrl = op.inString("Callback URL", ""),
    inInput = op.inObject("Input"),
    inTrigger = op.inTrigger("Trigger Request");

inTrigger.onTriggered = () => {
    let url = inShortcutUrl.get();
    if (!url) {
        op.logWarn("[ShortcutsRequest] Shortcut URL is empty.");
        return;
    }

    const callbackUrl = inCallbackUrl.get();

    // Check if the Shortcut URL already has an input parameter and if it is a valid object (case-insensitive)
    const inputMatch = url.match(/[\?&]input=([^&]*)/i);
    let existingObj = null;

    if (inputMatch) {
        let existingInput = "";
        try {
            existingInput = decodeURIComponent(inputMatch[1]);
        } catch (e) {
            existingInput = inputMatch[1];
        }

        try {
            const parsed = JSON.parse(existingInput);
            if (parsed && typeof parsed === 'object' && parsed !== null) {
                existingObj = parsed;
            }
        } catch (e) {
            // Not a valid JSON object, keep existingObj as null
        }
    }

    let finalObj = {};
    if (existingObj) {
        // If it is a valid object, deep clone it and add the callback URL property
        try {
            finalObj = JSON.parse(JSON.stringify(existingObj));
        } catch (e) {
            finalObj = Object.assign({}, existingObj);
        }
        
        // Also merge any fields from the inInput object port if provided
        const portInput = inInput.get();
        if (portInput && typeof portInput === 'object' && portInput !== null) {
            finalObj = Object.assign(finalObj, portInput);
        }

        if (callbackUrl) {
            finalObj.callback = callbackUrl;
        }
    } else {
        // If it doesn't have a valid object, replace the input with the callback object
        let portInput = inInput.get() || {};
        if (typeof portInput !== 'object' || portInput === null) {
            portInput = {};
        } else {
            try {
                portInput = JSON.parse(JSON.stringify(portInput));
            } catch (e) {
                portInput = Object.assign({}, portInput);
            }
        }
        
        finalObj = portInput;
        if (callbackUrl) {
            finalObj.callback = callbackUrl;
        }
    }

    // Clean up any existing case-insensitive input parameters in base URL to avoid duplicates
    url = url.replace(/([\?&])input=[^&]*/gi, '$1');
    url = url.replace(/[?&]$/, '');

    // Serialize and URL encode the JSON payload
    const jsonStr = JSON.stringify(finalObj);
    const encodedInput = encodeURIComponent(jsonStr);

    const separator = url.includes('?') ? '&' : '?';
    url += separator + "input=" + encodedInput;

    op.log("[ShortcutsRequest] json input:", jsonStr);
    op.log("[ShortcutsRequest] Opening URI request via hidden iframe:", url);

    try {
        let iframe = document.getElementById("shortcuts-trigger-iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "shortcuts-trigger-iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }
        iframe.src = url;
    } catch (error) {
        op.logError("[ShortcutsRequest] Iframe trigger failed: " + error.message);
    }
};
