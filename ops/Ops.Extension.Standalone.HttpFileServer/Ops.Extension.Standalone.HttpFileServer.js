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

    inSseEvent = op.inString("SSE Event Name", "message"),
    inSseData = op.inObject("SSE Data"),
    inSseBroadcast = op.inTrigger("Broadcast SSE"),

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
const sseClients = new Set();

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

    server = http.createServer((req, res) =>
    {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;

        outHttpUrl.set(req.url);
        outHttpReqData.set(req);
        outHttpResData.set(res);
        outHttpRequest.trigger();

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
        if (pathname === "/events")
        {
            setupSse(req, res);
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

function setupSse(req, res)
{
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (res.flushHeaders) res.flushHeaders();

    const client = { "res": res };
    sseClients.add(client);
    outActiveClients.set(sseClients.size);

    op.log("[SSE] Client connected");

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
        sseClients.delete(client);
        outActiveClients.set(sseClients.size);
        op.log("[SSE] Client disconnected");
    });
}

inSseBroadcast.onTriggered = () =>
{
    if (sseClients.size === 0) return;

    const eventName = inSseEvent.get();
    const data = inSseData.get();

    let message = "";
    if (eventName) message += `event: ${eventName}\n`;
    message += `data: ${JSON.stringify(data || {})}\n\n`;

    sseClients.forEach((client) =>
    {
        try
        {
            if (!client.res.writableEnded)
            {
                client.res.write(message);
            }
            else
            {
                sseClients.delete(client);
                outActiveClients.set(sseClients.size);
            }
        }
        catch (e)
        {
            op.logWarn("[SSE] Broadcast failed for a client", e);
            sseClients.delete(client);
            outActiveClients.set(sseClients.size);
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

    sseClients.forEach((client) =>
    {
        try { client.res.end(); } catch (e) {}
    });
    sseClients.clear();
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
}, 500);
