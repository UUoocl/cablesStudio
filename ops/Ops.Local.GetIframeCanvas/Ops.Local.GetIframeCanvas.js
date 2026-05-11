const
    inEle = op.inObject("Iframe Element"),
    inSelector = op.inString("Selector", "canvas"),
    inRefresh = op.inTriggerButton("Refresh"),
    outCanvas = op.outObject("Canvas Element");


let timeout = null;

function update()
{
    const iframe = inEle.get();
    if (!iframe)
    {
        outCanvas.set(null);
        return;
    }

    if (!iframe.contentDocument)
    {
        console.warn("GetIframeCanvas: No contentDocument found. This might be a cross-origin issue or the iframe is not yet loaded.");
        outCanvas.set(null);
        return;
    }

    try
    {
        const canvas = iframe.contentDocument.querySelector(inSelector.get());
        if (canvas)
        {
            console.log("GetIframeCanvas: Canvas found!", canvas);
            outCanvas.set(canvas);
            if (timeout) clearTimeout(timeout);
            timeout = null;
        }
        else
        {
            console.log("GetIframeCanvas: Canvas NOT found, polling...");
            // If not found, try again in a bit
            if (!timeout)
            {
                timeout = setTimeout(update, 250);
            }
        }
    }
    catch (e)
    {
        console.error("GetIframeCanvas: Error accessing iframe content:", e);
        outCanvas.set(null);
    }
}


inEle.onChange = () =>
{
    const iframe = inEle.get();
    if (iframe)
    {
        iframe.removeEventListener("load", update);
        iframe.addEventListener("load", update);
        update();
    }
    else
    {
        outCanvas.set(null);
    }
};

inSelector.onChange = update;
inRefresh.onTriggered = update;


// Initial setup
update();

op.onDelete = () => {

    if (timeout) clearTimeout(timeout);
};