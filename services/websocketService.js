const { WebSocket, WebSocketServer } = require('ws');
const { Server } = require('http');

class WebSocketService {
    constructor() {
        this.server = new Server();
        this.wss = new WebSocketServer({ server: this.server });
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected');

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