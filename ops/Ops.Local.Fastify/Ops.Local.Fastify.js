const path = op.require("path");
const fastifyModule = op.require("fastify");
const fastifyStatic = op.require("@fastify/static");
const fastifyWebsocket = op.require("@fastify/websocket");
const fastifyCors = op.require("@fastify/cors");

const inStart = op.inTriggerButton("Start Server");
const inStop = op.inTriggerButton("Stop Server");
const inPort = op.inInt("Port", 8080);
const inRootDir = op.inString("Root Directory", "");
const inAutoStart = op.inBool("Auto Start", false);

const outStarted = op.outTrigger("Server Started");
const outStopped = op.outTrigger("Server Stopped");

const outHttpRequest = op.outTrigger("On HTTP Request");
const outHttpUrl = op.outString("HTTP URL");
const outHttpReqData = op.outObject("HTTP Request Data");
const outHttpResData = op.outObject("HTTP Response Data");

const outWsMessage = op.outTrigger("On WS Message");
const outWsMessageData = op.outObject("WS Message Data");

const outServerInstance = op.outObject("Server Instance");
const outError = op.outString("Error");
const outIsRunning = op.outBoolNum("Is Running");
const outIsReady = op.outTrigger("Server Ready");

let app = null;

inStart.onTriggered = startServer;
inStop.onTriggered = stopServer;

op.onDelete = stopServer;

setTimeout(() => {
    if (inAutoStart.get()) startServer();
}, 500);

async function startServer() {
    if (app) {
        op.logWarn("Server is already running.");
        return;
    }

    if (!fastifyModule || !fastifyWebsocket) {
        outError.set("Required modules (fastify, @fastify/websocket) not found.");
        return;
    }

    try {
        app = fastifyModule({ logger: true });

        if (fastifyCors) {
            await app.register(fastifyCors, {
                origin: "*",
            });
        }

        await app.register(fastifyWebsocket);

        let rootDir = inRootDir.get();
        if (rootDir && fastifyStatic) {
            if (path) rootDir = path.resolve(rootDir);
            
            await app.register(fastifyStatic, {
                root: rootDir,
                prefix: "/",
            });
        }

        app.register(async function (fastify) {
            fastify.get('/ws', { websocket: true }, (connection, req) => {
                connection.socket.on('message', message => {
                    let msgData = message.toString();
                    try {
                        msgData = JSON.parse(msgData);
                    } catch (e) {
                        // Keep as string if it's not JSON
                    }
                    
                    outWsMessageData.set({
                        message: msgData,
                        socket: connection.socket,
                        req: req
                    });
                    outWsMessage.trigger();
                });
            });
        });

        // Add a hook to intercept requests
        app.addHook('onRequest', (request, reply, done) => {
            // Only forward requests starting with /callback/
            if (request.url.startsWith('/callback/')) {
                outHttpUrl.set(request.url);
                outHttpReqData.set(request);
                outHttpResData.set(reply);
                outHttpRequest.trigger();
            }
            done();
        });

        // Add health check route
        app.get('/health', async (request, reply) => {
            return { status: "ok" };
        });

        await app.listen({ port: inPort.get(), host: "127.0.0.1" });
        
        // Health check verification
        const port = inPort.get();
        const healthUrl = `http://127.0.0.1:${port}/health`;
        let ready = false;
        
        for (let i = 0; i < 3; i++) {
            try {
                const resp = await fetch(healthUrl);
                const data = await resp.json();
                if (data.status === "ok") {
                    ready = true;
                    break;
                }
            } catch (e) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        
        outServerInstance.set(app);
        outIsRunning.set(true);
        if (ready) outIsReady.trigger();
        outError.set("");
        outStarted.trigger();

    } catch (err) {
        outError.set(err.message || String(err));
        app = null;
        outIsRunning.set(false);
    }
}

async function stopServer() {
    if (app) {
        try {
            await app.close();
        } catch (err) {
            op.logError("Error closing fastify server:", err);
        }
        app = null;
        outServerInstance.set(null);
        outIsRunning.set(false);
        outStopped.trigger();
    }
}
