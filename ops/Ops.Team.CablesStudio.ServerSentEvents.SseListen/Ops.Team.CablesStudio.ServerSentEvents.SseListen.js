let es = null;

const
    inUrl = op.inString("URL", "http://localhost:8080/sse"),
    inEventName = op.inString("Event Name", "message"),
    inAppendEvent = op.inBool("Append Event to URL", true),
    inActive = op.inBool("Active", true),

    outConnected = op.outBoolNum("Connected", false),
    outReceived = op.outTrigger("Received"),
    outDataStr = op.outString("Data String"),
    outDataObj = op.outObject("Data Object"),
    outError = op.outString("Error");

inUrl.onChange =
    inEventName.onChange =
    inAppendEvent.onChange =
    inActive.onChange = setup;

op.onDelete = closeConnection;

function closeConnection()
{
    if (es)
    {
        try { es.close(); } catch (e) {}
        es = null;
    }
    outConnected.set(false);
}

function setup()
{
    closeConnection();

    if (!inActive.get()) return;

    let urlStr = inUrl.get();
    if (!urlStr)
    {
        outError.set("URL is empty");
        return;
    }

    const eventName = inEventName.get() || "";
    
    if (inAppendEvent.get() && eventName && eventName !== "message")
    {
        if (!urlStr.endsWith("/"))
        {
            urlStr += "/";
        }
        urlStr += eventName;
    }

    try
    {
        const EventSourceClass = window.EventSource || globalThis.EventSource || EventSource;
        if (!EventSourceClass)
        {
            outError.set("EventSource is not supported in this environment");
            return;
        }

        es = new EventSourceClass(urlStr);

        es.onopen = () =>
        {
            outConnected.set(true);
            outError.set("");
        };

        es.onerror = (err) =>
        {
            outConnected.set(false);
            outError.set("Connection error or closed");
        };

        const onMessageReceived = (event) =>
        {
            const rawData = event.data;
            outDataStr.set(rawData);

            let parsed = null;
            try
            {
                parsed = JSON.parse(rawData);
            }
            catch (e) {}
            outDataObj.set(parsed);

            outReceived.trigger();
        };

        // Listen to the specific custom event name if specified and not 'message'
        if (eventName && eventName !== "message")
        {
            es.addEventListener(eventName, onMessageReceived);
        }
        
        // Also always listen to the default message event
        es.addEventListener("message", onMessageReceived);
    }
    catch (e)
    {
        outConnected.set(false);
        outError.set(e.message || String(e));
    }
}

// Initial setup
setup();
