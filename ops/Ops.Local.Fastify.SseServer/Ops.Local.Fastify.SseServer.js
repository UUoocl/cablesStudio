const 
    inServer = op.inObject("Server Instance"),
    outConnections = op.outNumber("Active Clients");

let app = null;
const activeClients = new Set();

inServer.onLinkChanged = () => {
    app = inServer.get();
    if (app) setupSseRoute();
};

function setupSseRoute() {
    if (!app) return;

    // Register the SSE endpoint
    app.get('/api/events', (request, reply) => {
        const { raw } = reply;
        
        // SSE Headers
        raw.setHeader('Content-Type', 'text/event-stream');
        raw.setHeader('Cache-Control', 'no-cache');
        raw.setHeader('Connection', 'keep-alive');
        raw.setHeader('Access-Control-Allow-Origin', '*');
        raw.flushHeaders();

        const clientId = Math.random().toString(36).substring(2, 15);
        op.log(`[SSE] Client connected: ${clientId}`);

        // Add to pool
        const client = { id: clientId, reply: raw };
        activeClients.add(client);
        outConnections.set(activeClients.size);

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
            raw.write(': heartbeat\n\n');
        }, 15000);

        // Cleanup on disconnect
        request.raw.on('close', () => {
            op.log(`[SSE] Client disconnected: ${clientId}`);
            clearInterval(heartbeat);
            activeClients.delete(client);
            outConnections.set(activeClients.size);
        });
    });

    // Attach the broadcast method to the app instance for the Broadcast operator to find
    app.broadcastSse = (data) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        activeClients.forEach(client => {
            try {
                client.reply.write(message);
            } catch (e) {
                op.logError("[SSE] Broadcast failed for client " + client.id);
            }
        });
    };
}

op.onDelete = () => {
    activeClients.forEach(c => c.reply.end());
    activeClients.clear();
};
