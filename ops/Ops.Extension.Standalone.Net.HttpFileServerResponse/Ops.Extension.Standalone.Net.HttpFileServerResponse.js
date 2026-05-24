op.log("[HttpFileServerResponse] Script loaded and initialized!");

const
    exec = op.inTrigger("Trigger"),
    inResponse = op.inObject("Response"),
    inBody = op.inString("Body", ""),
    inBodyObj = op.inObject("Body Object");

inResponse.onChange = () =>
{
    op.log("[HttpFileServerResponse] Port 'Response' changed. Has value:", !!inResponse.get());
};

inBody.onChange = () =>
{
    op.log("[HttpFileServerResponse] Port 'Body' changed. Value:", inBody.get());
};

inBodyObj.onChange = () =>
{
    op.log("[HttpFileServerResponse] Port 'Body Object' changed. Value:", JSON.stringify(inBodyObj.get()));
};

exec.onTriggered = () =>
{
    const res = inResponse.get();
    const bodyStr = inBody.get();
    const bodyObj = inBodyObj.get();

    op.log("[HttpFileServerResponse] Trigger fired!");
    op.log("[HttpFileServerResponse] - Input 'Response' exists:", !!res);
    op.log("[HttpFileServerResponse] - Input 'Body' value:", bodyStr);
    op.log("[HttpFileServerResponse] - Input 'Body Object' value:", JSON.stringify(bodyObj));

    if (!res) {
        op.logWarn("[HttpFileServerResponse] No active Response object found on input port. Cannot send HTTP response!");
        return;
    }

    res.statusCode = 200;
    
    // If an object is supplied to the "Body Object" input, serialize it as JSON
    if (bodyObj !== null && bodyObj !== undefined)
    {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(bodyObj));
        op.log("[HttpFileServerResponse] Successfully wrote JSON response:", JSON.stringify(bodyObj));
    }
    else
    {
        res.setHeader("Content-Type", "text/html");
        res.end(String(bodyStr || ""));
        op.log("[HttpFileServerResponse] Successfully wrote fallback string response of length:", String(bodyStr || "").length);
    }
};
