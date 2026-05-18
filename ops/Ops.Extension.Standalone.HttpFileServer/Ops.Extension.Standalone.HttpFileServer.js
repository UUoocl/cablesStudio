const http = op.require("http");
const fs = op.require("fs");
const path = op.require("path");
const url = op.require("url");

const
    inHost = op.inString("Hostname", "127.0.0.1"),
    inPort = op.inInt("Port", 8080),
    inRootDir = op.inString("Root Directory", ""),
    inAutoStart = op.inBool("Auto Start", true),
    inStart = op.inTriggerButton("Start Server"),
    inStop = op.inTriggerButton("Stop Server"),

    inSseRoute = op.inString("SSE Route", "/sse"),
    inSseEvent = op.inString("SSE Event Name", "message"),
    inSseData = op.inObject("SSE Data"),
    inSseBroadcast = op.inTrigger("Broadcast SSE"),

    inHttpResponseCode = op.inInt("HTTP Response Code", 200),
    inHttpResponseData = op.inObject("HTTP Response Data Input"),
    inHttpResponseTrigger = op.inTriggerButton("Send HTTP Response"),

    outStarted = op.outTrigger("Server Started"),
    outStopped = op.outTrigger("Server Stopped"),
    outIsReady = op.outTrigger("Server Ready"),

    outHttpRequest = op.outTrigger("On HTTP Request"),
    outHttpUrl = op.outString("HTTP URL"),
    outHttpReqData = op.outObject("HTTP Request Data"),
    outHttpResData = op.outObject("HTTP Response Data"),

    outError = op.outString("Error"),
    outRunning = op.outBoolNum("Running", false),
    outServerInstance = op.outObject("Server Instance"),
    outActiveClients = op.outNumber("Active Clients", 0);

let server = null;
const sseClientsByRoute = new Map();
let lastApiRes = null;

inHttpResponseTrigger.onTriggered = () => {
    if (lastApiRes && !lastApiRes.headersSent) {
        lastApiRes.statusCode = inHttpResponseCode.get();
        lastApiRes.setHeader("Content-Type", "application/json");
        let data = inHttpResponseData.get();
        if (typeof data !== "string") {
            try { data = JSON.stringify(data); } catch(e) { data = "{}"; }
        }
        lastApiRes.end(data);
    }
};

const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".wasm": "application/wasm",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg"
};

// Set default root directory to patch directory if available
const paths = op.patch.config.paths || {};
if (paths.patchPath && !inRootDir.get()) inRootDir.set(paths.patchPath);

op.onDelete = stop;
inHost.onChange = restart;
inPort.onChange = restart;
inRootDir.onChange = restart;

function start()
{
    if (server) return;
    if (!http) return;

    server = http.createServer({ "noDelay": true, "keepAlive": true }, (req, res) =>
    {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;

        // op.log("HttpFileServer Received Request:", req.method, req.url);

        outHttpUrl.set(req.url);

        const isApi = pathname === "/api" || pathname.startsWith("/api/");
        const isSse = pathname === "/sse" || pathname.startsWith("/sse/");

        if (res.headersSent) return;

        // Health check route
        if (pathname === "/health")
        {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ "status": "ok" }));
            return;
        }

        // SSE route
        if (pathname === "/sse" || pathname.startsWith("/sse/"))
        {
            setupSse(req, res, pathname);
            return;
        }

        // Generic API route
        if (pathname === "/api" || pathname.startsWith("/api/"))
        {
            handleApiRequest(req, res, pathname);
            return;
        }

        let rootDir = inRootDir.get();
        if (!rootDir && paths.patchPath) rootDir = paths.patchPath;

        let filePath = path.join(rootDir, pathname);

        fs.stat(filePath, (err, stats) =>
        {
            if (res.headersSent) return;

            if (err)
            {
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
                return;
            }

            if (stats.isDirectory())
            {
                filePath = path.join(filePath, "index.html");
            }

            fs.readFile(filePath, (err, data) =>
            {
                if (res.headersSent) return;

                if (err)
                {
                    res.statusCode = 500;
                    res.end(`Error getting the file: ${err}.`);
                }
                else
                {
                    const ext = path.parse(filePath).ext;
                    res.setHeader("Content-type", mimeTypes[ext] || "text/plain");
                    res.end(data);
                }
            });
        });
    });

    try
    {
        server.listen(inPort.get(), inHost.get(), (e) =>
        {
            if (e)
            {
                outRunning.set(false);
                outError.set(e.message || String(e));
                op.logWarn(e);
            }
            else
            {
                outRunning.set(true);
                outServerInstance.set(server);
                outError.set("");
                outStarted.trigger();

                // Verify server is ready to serve files
                const checkUrl = `http://${inHost.get()}:${inPort.get()}/health`;
                http.get(checkUrl, (resCheck) =>
                {
                    if (resCheck.statusCode === 200)
                    {
                        outIsReady.trigger();
                    }
                }).on("error", (err) =>
                {
                    op.logWarn("Ready check failed:", err);
                });
            }
        });

        server.on("error", (e) =>
        {
            outRunning.set(false);
            outError.set(e.message || String(e));
            op.logWarn(e);
        });
    }
    catch (e)
    {
        outRunning.set(false);
        outError.set(e.message || String(e));
        op.logWarn(e);
    }
}
function handleApiRequest(req, res, pathname)
{
    outHttpUrl.set(req.url);
    outHttpResData.set(res);
    lastApiRes = res;

    if (req.method === "POST")
    {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () =>
        {
            let data = body;
            try
            {
                data = JSON.parse(body);
            }
            catch (e) {}

            op.log("[HttpFileServer] POST body payload:", JSON.stringify(data));

            const reqInfo = Object.assign({
                "method": req.method,
                "url": req.url,
                "pathname": pathname,
                "headers": req.headers,
                "body": data
            }, (data && typeof data === "object") ? data : {});

            outHttpReqData.set(reqInfo);
            outHttpRequest.trigger();

            // Default response if not handled
            setTimeout(() =>
            {
                if (!res.headersSent)
                {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ "status": "received", "path": pathname, "note": "handled by timeout" }));
                }
            }, 50); // Small timeout to quickly resolve the HTTP POST and avoid connection blocking
        });
    }
    else
    {
        let queryParams = {};
        try
        {
            const parsedUrl = url.parse(req.url, true);
            queryParams = parsedUrl.query || {};
        }
        catch (e) {}

        const reqInfo = Object.assign({
            "method": req.method,
            "url": req.url,
            "pathname": pathname,
            "headers": req.headers,
            "query": queryParams
        }, queryParams);

        outHttpReqData.set(reqInfo);
        outHttpRequest.trigger();

        setTimeout(() =>
        {
            if (!res.headersSent)
            {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ "status": "ok", "path": pathname, "note": "handled by timeout" }));
            }
        }, 50); // Small timeout to quickly resolve the HTTP POST and avoid connection blocking
    }
}

function setupSse(req, res, route)
{
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (res.flushHeaders) res.flushHeaders();

    if (!sseClientsByRoute.has(route)) sseClientsByRoute.set(route, new Set());
    const clients = sseClientsByRoute.get(route);
    
    const client = { "res": res };
    clients.add(client);
    outActiveClients.set(getTotalClients());

    op.log(`[SSE] Client connected to route: ${route}`);

    const heartbeat = setInterval(() =>
    {
        try
        {
            if (!res.writableEnded)
            {
                res.write(": heartbeat\n\n");
            }
            else
            {
                clearInterval(heartbeat);
            }
        }
        catch (e)
        {
            clearInterval(heartbeat);
        }
    }, 15000);

    req.on("close", () =>
    {
        clearInterval(heartbeat);
        clients.delete(client);
        if (clients.size === 0) sseClientsByRoute.delete(route);
        outActiveClients.set(getTotalClients());
        op.log(`[SSE] Client disconnected from route: ${route}`);
    });
}

function getTotalClients()
{
    let count = 0;
    sseClientsByRoute.forEach((clients) => { count += clients.size; });
    return count;
}

inSseBroadcast.onTriggered = () =>
{
    const route = inSseRoute.get();
    const clients = sseClientsByRoute.get(route);
    if (!clients || clients.size === 0) return;

    const eventName = inSseEvent.get();
    const data = inSseData.get();

    const payload = {
        "route": route,
        "eventName": eventName,
        "data": data
    };

    const message = `data: ${JSON.stringify(payload)}\n\n`;

    clients.forEach((client) =>
    {
        try
        {
            if (!client.res.writableEnded)
            {
                client.res.write(message);
            }
            else
            {
                clients.delete(client);
                outActiveClients.set(getTotalClients());
            }
        }
        catch (e)
        {
            op.logWarn("[SSE] Broadcast failed for a client", e);
            clients.delete(client);
            outActiveClients.set(getTotalClients());
        }
    });
};

function stop()
{
    if (server)
    {
        server.close();
        server = null;
        outServerInstance.set(null);
        outStopped.trigger();
    }

    sseClientsByRoute.forEach((clients) =>
    {
        clients.forEach((client) =>
        {
            try { client.res.end(); } catch (e) {}
        });
    });
    sseClientsByRoute.clear();
    outActiveClients.set(0);

    outRunning.set(false);
}

inStart.onTriggered = start;
inStop.onTriggered = stop;

function restart()
{
    if (outRunning.get())
    {
        stop();
        start();
    }
}

setTimeout(() =>
{
    if (inAutoStart.get()) start();
}, 0);
