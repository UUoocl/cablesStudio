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
const activeSockets = new Map();

inStart.onTriggered = startServer;
inStop.onTriggered = stopServer;

op.onDelete = stopServer;

// Helper to generate unique socket IDs
function generateId() { return Math.random().toString(36).substring(2, 15); }

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
        app.activeSockets = activeSockets; // Expose for proxy ops

        if (fastifyCors) {
            await app.register(fastifyCors, {
                origin: "*",
            });
        }

        await app.register(fastifyWebsocket);

        // Add a hook to log ALL requests for debugging
        app.addHook('onRequest', (request, reply, done) => {
            op.log(`[Fastify] ${request.method} ${request.url} [Conn: ${request.socket.remoteAddress}]`);
            // Only forward requests starting with /callback/
            if (request.url.startsWith('/callback/')) {
                outHttpUrl.set(request.url);
                outHttpReqData.set(request);
                outHttpResData.set(reply);
                outHttpRequest.trigger();
            }
            done();
        });

        // Add API route for slide commands
        app.post('/api/slides/command', async (request, reply) => {
            const body = request.body || {};
            op.log(`[Fastify] API Command Received: ${JSON.stringify(body)}`);
            
            outHttpUrl.set('/api/slides/command');
            outHttpReqData.set(body);
            outHttpRequest.trigger();
            
            return { status: "ok", received: body };
        });

        // Add health check route
        app.get('/health', async (request, reply) => {
            return { status: "ok" };
        });

        let rootDir = inRootDir.get();
        if (rootDir && fastifyStatic) {
            if (path) rootDir = path.resolve(rootDir);
            
            await app.register(fastifyStatic, {
                root: rootDir,
                prefix: "/",
            });
        }

        await app.listen({ port: inPort.get(), host: "127.0.0.1" });
        op.log(`[Fastify] Server listening on 127.0.0.1:${inPort.get()}`);
        
        outServerInstance.set(app);
        outIsRunning.set(true);
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
