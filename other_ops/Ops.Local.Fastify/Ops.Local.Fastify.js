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

const inWsChannel = op.inString("WS Channel", "");
const inWsData = op.inObject("WS Data");
const inWsTrigger = op.inTriggerButton("Send WS Message");

// Set default root directory to patch directory if available
const paths = op.patch.config.paths || {};
if (paths.patchPath && !inRootDir.get()) inRootDir.set(paths.patchPath);

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

inWsTrigger.onTriggered = () => {
    if (!app) return;
    
    const channel = inWsChannel.get();
    const data = inWsData.get();
    
    if (!channel) {
        op.logWarn("No WS Channel specified");
        return;
    }
    
    const payload = JSON.stringify({ channel, data });
    
    for (const [id, socket] of activeSockets.entries()) {
        try {
            socket.send(payload);
        } catch (e) {
            op.logWarn("[Fastify WS] Error sending to socket " + id + ":", e);
        }
    }
};

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

        // Add WebSocket route
        app.register(async function (fastify) {
            fastify.get('/ws', { websocket: true }, (connection, req) => {
                const id = generateId();
                const isV8 = !connection.socket;
                const socket = connection.socket || connection; // Support both @fastify/websocket v7 and v8+
                
                activeSockets.set(id, socket);
                
                socket.send(JSON.stringify({ 
                    type: "system", 
                    message: "Connected to Fastify",
                    apiVersion: isV8 ? "v8+" : "v7"
                }));
                
                socket.on('message', message => {
                    let msgStr = message.toString();
                    let parsed = { data: msgStr };
                    try { parsed = JSON.parse(msgStr); } catch(e) {}
                    
                    if (parsed && parsed.type === "call" && parsed.method === "setInfo") {
                        socket.send(JSON.stringify({
                            type: "response",
                            id: parsed.id,
                            data: { status: "authenticated" }
                        }));
                    }
                    
                    outWsMessageData.set({ id, ...parsed });
                    outWsMessage.trigger();
                });
                
                socket.on('close', () => {
                    activeSockets.delete(id);
                });

                socket.on('error', (err) => {
                    op.logWarn("[Fastify WS] Socket Error:", err);
                    activeSockets.delete(id);
                });
            });
        });

        // Add a hook to log ALL requests for debugging
        app.addHook('onRequest', (request, reply, done) => {
            op.log(`[Fastify] ${request.method} ${request.url} [Conn: ${request.socket.remoteAddress}]`);
            // Only forward requests starting with /callback/
            if (request.url.startsWith('/callback/')) {
                outHttpUrl.set(request.url);
                if (request && !request.toJSON) {
                    request.toJSON = () => ({
                        "__type": "FastifyRequest",
                        "method": request.method,
                        "url": request.url,
                        "headers": request.headers
                    });
                }
                if (reply && !reply.toJSON) {
                    reply.toJSON = () => ({
                        "__type": "FastifyReply",
                        "statusCode": reply.statusCode
                    });
                }
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
        if (app && !app.toJSON) {
            app.toJSON = () => ({
                "__type": "FastifyInstance",
                "listening": true
            });
        }
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
