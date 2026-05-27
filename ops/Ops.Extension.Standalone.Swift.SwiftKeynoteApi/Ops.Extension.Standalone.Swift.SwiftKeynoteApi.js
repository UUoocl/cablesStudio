/**
 * Ops.Extension.Standalone.Swift.SwiftKeynoteApi
 * Controls Apple Keynote presentation slideshows and notes natively using a high-speed Swift sidecar.
 */
const WebSocket = op.require("ws");
const { spawn } = op.require("child_process");
const fs = op.require("fs");

const
    inTrigger = op.inTrigger("Trigger"),
    inRequest = op.inString("Request", ""),
    inResponse = op.inObject("Response"),

    outNext = op.outTrigger("Next"),
    outResult = op.outObject("Result"),
    outErrorTrigger = op.outTrigger("Error Trigger"),
    outErrorMsg = op.outString("Error Message"),
    outSseEventName = op.outString("SSE Event Name");

let wss = null;
let cp = null;
let currentWs = null;
let availableDevices = [];

const pendingRequests = new Map();
let txCounter = 0;

function killProcess() {
    if (cp) {
        op.log("[SwiftKeynoteApi] Terminating native Swift Keynote controller daemon...");
        try {
            cp.kill();
        } catch (e) {}
        cp = null;
    }
}

function stopServerAndProcess() {
    killProcess();
    currentWs = null;
    if (wss) {
        op.log("[SwiftKeynoteApi] Closing private WebSocket Server...");
        try {
            wss.close();
        } catch (e) {}
        wss = null;
    }
}

function startServerAndProcess() {
    stopServerAndProcess();

    try {
        wss = new WebSocket.Server({ port: 0, host: "127.0.0.1" });
        
        wss.on("listening", () => {
            const port = wss.address().port;
            op.log("[SwiftKeynoteApi] Private WebSocket Server listening on port " + port);
            launchProcess(port);
        });

        wss.on("connection", (ws) => {
            op.log("[SwiftKeynoteApi] Swift sidecar connected!");
            currentWs = ws;

            ws.on("message", (message, isBinary) => {
                const str = isBinary ? message.toString() : message;
                handleSidecarMessage(str);
            });

            ws.on("close", () => {
                op.log("[SwiftKeynoteApi] Swift sidecar disconnected.");
                if (currentWs === ws) currentWs = null;
                // Reject all pending HTTP requests if sidecar dies unexpectedly
                for (const [txId, req] of pendingRequests.entries()) {
                    sendErrorResponse(req.res, "Swift sidecar disconnected before command could complete.");
                    pendingRequests.delete(txId);
                }
            });

            ws.on("error", (err) => {
                op.logError("[SwiftKeynoteApi] Sidecar connection error: " + err.message);
            });
        });

    } catch (e) {
        op.logError("[SwiftKeynoteApi] Failed to start private server: " + String(e));
    }
}

function launchProcess(port) {
    let binaryPath = `${op.patch.config.prefixAssetPath}ops/Ops.Extension.Standalone.Swift.SwiftKeynoteApi/swift_bin/SwiftKeynoteApi`;
    
    if (op.patch && typeof op.patch.filePath === "function") {
        binaryPath = op.patch.filePath(binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        op.logError("[SwiftKeynoteApi] Swift binary not found at: " + binaryPath);
        return;
    }

    try {
        fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
        op.logWarn("[SwiftKeynoteApi] Warning setting execute permissions: " + String(e));
    }

    const args = [
        "--host", "127.0.0.1",
        "--port", String(port)
    ];

    op.log("[SwiftKeynoteApi] Spawning native sidecar process: " + binaryPath + " " + args.join(" "));

    try {
        cp = spawn(binaryPath, args, {
            detached: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        cp.stdout.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.log("[SwiftKeynoteApi Sidecar] " + str);
        });

        cp.stderr.on("data", (data) => {
            const str = data.toString().trim();
            if (str) op.logWarn("[SwiftKeynoteApi Warning] " + str);
        });

        cp.on("error", (err) => {
            op.logError("[SwiftKeynoteApi] Process error: " + err.message);
            stopServerAndProcess();
        });

        cp.on("exit", (code, signal) => {
            op.log("[SwiftKeynoteApi] Process exited with code " + code + ", signal " + signal);
            cp = null;
        });

    } catch (e) {
        op.logError("[SwiftKeynoteApi] Failed to spawn: " + String(e));
        stopServerAndProcess();
    }
}

inTrigger.onTriggered = () => {
    const reqUrl = inRequest.get();
    const res = inResponse.get();

    if (!reqUrl) {
        setError("No active Request URL found on input port.", res);
        return;
    }

    op.log("[SwiftKeynoteApi] Processing API Request URL:", reqUrl);

    // Parse query parameters
    let query = {};
    try {
        const parsedUrl = new URL(reqUrl, "http://localhost");
        query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch (e) {
        const queryString = reqUrl.includes('?') ? reqUrl.split('?')[1] : reqUrl;
        if (queryString) {
            const pairs = queryString.split('&');
            for (const pair of pairs) {
                const [key, value] = pair.split('=');
                if (key) {
                    query[decodeURIComponent(key)] = decodeURIComponent(value || "");
                }
            }
        }
    }

    const command = String(query.request || query.command || "").toLowerCase();
    if (!command) {
        sendErrorResponse(res, "Missing 'request' or 'command' query parameter.");
        return;
    }

    if (!currentWs) {
        setError("Swift Keynote sidecar is not running or connected.", res);
        return;
    }

    // Register pending request with a transaction ID to handle concurrency cleanly
    const txId = ++txCounter;
    pendingRequests.set(txId, { res, command });

    const payload = {
        type: "command",
        command: command,
        txId: txId,
        params: query
    };

    try {
        currentWs.send(JSON.stringify(payload));
    } catch (e) {
        pendingRequests.delete(txId);
        setError("Failed to transmit command to sidecar: " + e.message, res);
    }
};

function handleSidecarMessage(str) {
    try {
        const msg = JSON.parse(str);
        if (msg.type !== "response") return;

        const txId = msg.txId;
        const req = pendingRequests.get(txId);
        if (!req) return; // Unrecognized/orphan transaction

        pendingRequests.delete(txId);

        if (msg.status === "error") {
            setError(msg.error, req.res);
        } else {
            const resultData = msg.data || {};
            outSseEventName.set(req.command + "response");
            outResult.set(resultData);
            sendSuccessResponse(req.res, resultData);
            outNext.trigger();
        }
    } catch (e) {
        op.logWarn("[SwiftKeynoteApi] Error parsing sidecar message: " + String(e));
    }
}

function setError(msg, res) {
    op.logError("[SwiftKeynoteApi] Error:", msg);
    outErrorMsg.set(msg);
    outErrorTrigger.trigger();
    if (res) {
        sendErrorResponse(res, msg);
    }
}

function sendSuccessResponse(res, data) {
    if (res && typeof res.end === "function" && !res.headersSent) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
        op.log("[SwiftKeynoteApi] Sent successful HTTP Response.");
    }
}

function sendErrorResponse(res, errorMsg) {
    if (res && typeof res.end === "function" && !res.headersSent) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: errorMsg }));
        op.log("[SwiftKeynoteApi] Sent error HTTP Response.");
    }
}

op.onDelete = () => {
    stopServerAndProcess();
};

// Autostart server
setTimeout(() => {
    startServerAndProcess();
}, 500);
