const http = op.require("http");
const fs = op.require("fs");
const path = op.require("path");
const process = op.require("process");
const url = op.require("url");
const socketClusterServer = op.require("socketcluster-server");

const inActive = op.inBool("Active", true);
const inHost = op.inString("Hostname", "127.0.0.1");
const inPort = op.inInt("Port", 8000);
const inPath = op.inString("Path", "/socketcluster/");
const inRootDir = op.inString("Root Directory", "");

const outListening = op.outBoolNum("Listening", false);
const outClients = op.outNumber("Clients", 0);
const outError = op.outString("Error");

let agServer = null;
let httpServer = null;
let cachedRoot = null;
let lastRootDirInput = null;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function resolveRootDir(p) {
    if (p === lastRootDirInput && cachedRoot) return cachedRoot;

    let target = p || ".";
    if (target === "/" || target === "\\") target = ".";
    
    if (path.isAbsolute(target) && target !== "." && target !== "..") {
        cachedRoot = target;
        lastRootDirInput = p;
        return target;
    }
    
    let base = "";
    if (op.patch && op.patch.config && op.patch.config.prefixAssetPath) {
        base = op.patch.config.prefixAssetPath;
    } else if (op.patch && typeof op.patch.getProjectUrl === 'function') {
        const projectUrl = op.patch.getProjectUrl();
        if (projectUrl && projectUrl.startsWith("file://")) {
            try { base = path.dirname(url.fileURLToPath(projectUrl)); } catch(e) {}
        }
    }

    if (!base && typeof __dirname !== 'undefined' && !__dirname.includes('app.asar')) {
        let current = __dirname;
        while (current && current !== path.dirname(current)) {
            if (fs.existsSync(path.join(current, 'ops'))) { base = current; break; }
            current = path.dirname(current);
        }
    }
    if (!base) base = process.cwd();
    
    const resolved = path.resolve(base, target);
    cachedRoot = resolved;
    lastRootDirInput = p;
    return resolved;
}

function handleHttpRequest(req, res) {
    // If headers already sent (by SocketCluster or previous listener), do nothing
    if (res.headersSent || res.writableEnded) return;

    const scPath = inPath.get() || "/socketcluster/";
    const urlStr = req.url.split('?')[0];

    // 1. Explicitly serve socketcluster.js if requested anywhere or redirected
    if (urlStr === '/socketcluster.js' || urlStr === (scPath + 'socketcluster.js')) {
        // Try to find it in the project (Examples or locally)
        let libPath = "";
        
        // Strategy A: Known path in this specific repo
        const projectRoot = resolveRootDir(".");
        const candidate = path.join(projectRoot, "apps/socketcluster_test/lib/socketcluster.js");
        if (fs.existsSync(candidate)) libPath = candidate;
        
        if (libPath) {
            fs.readFile(libPath, (err, content) => {
                if (err) {
                    res.writeHead(500);
                    res.end("Error reading SC Client Lib");
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Content-Length': content.length });
                    res.end(content);
                }
            });
            return;
        }
    }

    // 2. Convenience Redirect
    if (urlStr === '/socketcluster.js' && scPath !== '/') {
        let loc = scPath;
        if (!loc.endsWith('/')) loc += '/';
        loc += 'socketcluster.js';
        res.writeHead(302, { 'Location': loc });
        res.end();
        return;
    }

    // 3. Skip internal SC paths (let them hang or 404 if SC didn't catch them, but we'll 404 at the end)
    if (urlStr.startsWith(scPath)) {
        // If we are here, SC didn't handle it yet. We wait a bit or just 404 if it's NOT a handshake
        if (!req.url.includes('EIO=')) {
            res.writeHead(404);
            res.end("SocketCluster endpoint not handled: " + urlStr);
        }
        return; 
    }

    // 4. Static File Serving
    const root = resolveRootDir(inRootDir.get());
    const relativePath = (urlStr === '/' || urlStr === "") ? 'index.html' : urlStr.substring(1);
    let filePath = path.join(root, relativePath);
    
    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch(e) {}

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(error.code === 'ENOENT' ? 404 : 500);
            res.end(`Error: ${error.code}\nPath: ${filePath}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': content.length });
            res.end(content);
        }
    });
}

function startServer() {
    if (!http) return;
    stopServer();
    
    cachedRoot = null;
    httpServer = http.createServer();
    
    httpServer.on("error", (e) => {
        op.logError("HTTP Server Error:", e.message);
        outError.set(e.message);
        outListening.set(false);
    });

    // 1. Attach SC FIRST
    try {
        agServer = socketClusterServer.attach(httpServer, { "path": inPath.get() });
        
        (async () => {
            for await (const {socket} of agServer.listener("connection")) {
                updateStatus();
            }
        })();

        (async () => { for await (const action of agServer.listener("closure")) updateStatus(); })();
        (async () => {
            for await (const action of agServer.listener("ready")) {
                outListening.set(true);
                updateStatus();
            }
        })();

        // Global Middleware: allow all actions and relay publishes/transmits
        agServer.setMiddleware(agServer.MIDDLEWARE_INBOUND, async (middlewareStream) => {
            for await (const action of middlewareStream) {
                if (action.type === action.PUBLISH_IN) {
                    agServer.exchange.transmitPublish(action.channel, action.data);
                } else if (action.type === action.TRANSMIT) {
                    agServer.exchange.transmitPublish(action.event, action.data);
                    if (action.event === '#publish' && action.data && action.data.channel) {
                        agServer.exchange.transmitPublish(action.data.channel, action.data.data);
                    }
                }
                action.allow();
            }
        });
    } catch (e) {
        op.logError("SC Attach Error:", e.message);
    }

    // 2. Add our request listener AFTER SC
    httpServer.on("request", handleHttpRequest);

    try {
        httpServer.listen(inPort.get(), inHost.get(), () => {
            op.log("Server listening on http://" + inHost.get() + ":" + inPort.get());
        });
    } catch (e) {
        outError.set(e.message);
    }
}

function updateStatus() {
    if (agServer) {
        outClients.set(agServer.clientsCount);
        op.setUiAttrib({ "extendTitle": "clients: " + agServer.clientsCount });
    }
}

function stopServer() {
    if (agServer) agServer.close();
    if (httpServer) httpServer.close();
    agServer = null;
    httpServer = null;
    outListening.set(false);
    outClients.set(0);
}

inActive.onChange = () => {
    if (inActive.get()) startServer();
    else stopServer();
};

op.onDelete = stopServer;

if (inActive.get()) setTimeout(startServer, 500);
