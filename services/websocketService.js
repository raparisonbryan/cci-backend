const { WebSocket, WebSocketServer } = require('ws');
const { Server } = require('http');

const MAX_PAYLOAD = 64 * 1024;
const HEARTBEAT_INTERVAL = 30000;

class WebSocketService {
    constructor() {
        this.server = new Server();
        this.wss = new WebSocketServer({ server: this.server, maxPayload: MAX_PAYLOAD });
        this.setupWebSocket();
        this.setupHeartbeat();
    }

    setupHeartbeat() {
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, HEARTBEAT_INTERVAL);

        this.wss.on('close', () => clearInterval(interval));
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            ws.isAlive = true;

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

            ws.on('message', (message) => {
                this.broadcastMessage(ws, message);
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }

    broadcastMessage(sender, message) {
        this.wss.clients.forEach((client) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    }

    start(port = 8080) {
        this.server.listen(port, () => {
            console.log(`WebSocket server running on port ${port}`);
        });
    }
}

module.exports = WebSocketService;