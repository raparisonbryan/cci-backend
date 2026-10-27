const { WebSocket, WebSocketServer } = require('ws');
const { Server } = require('http');
const { getUserFromCookies } = require('../utils/session.js');

const MAX_PAYLOAD = 64 * 1024;
const HEARTBEAT_INTERVAL = 30000;
const MESSAGE_TYPES = ['UPDATE_CELL', 'INSERT_ROW', 'DELETE_ROW'];

class WebSocketService {
    constructor({ allowedOrigins = [] } = {}) {
        this.allowedOrigins = allowedOrigins;
        this.server = new Server();
        this.wss = new WebSocketServer({
            server: this.server,
            maxPayload: MAX_PAYLOAD,
            verifyClient: (info, callback) => this.verifyClient(info, callback),
        });
        this.setupWebSocket();
        this.setupHeartbeat();
    }

    /**
     * Accepte la connexion uniquement depuis une origine autorisée et avec une session NextAuth valide
     */
    verifyClient(info, callback) {
        if (this.allowedOrigins.length && !this.allowedOrigins.includes(info.origin)) {
            return callback(false, 403, 'Origine non autorisée');
        }

        getUserFromCookies(info.req.headers.cookie)
            .then((user) => {
                if (!user) {
                    return callback(false, 401, 'Non authentifié');
                }
                info.req.user = user;
                callback(true);
            })
            .catch(() => callback(false, 500));
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
        this.wss.on('connection', (ws, req) => {
            ws.user = req.user;
            console.log(`Client connected: ${ws.user.email}`);
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
        // Les visiteurs sont en lecture seule
        if (sender.user.role === 'visitor') return;

        let update;
        try {
            update = JSON.parse(message.toString());
        } catch {
            return;
        }
        if (!MESSAGE_TYPES.includes(update?.type)) return;

        // L'auteur est celui de la session, pas celui déclaré par le client
        const payload = JSON.stringify({
            ...update,
            user: sender.user.name,
            userEmail: sender.user.email,
            userImage: sender.user.image,
        });

        this.wss.clients.forEach((client) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(payload);
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