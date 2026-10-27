require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const sheetRoutes = require('./routes/sheet.js');
const WebSocketService  = require('./services/websocketService');
const { readList } = require('./utils/config.js');

if (!process.env.NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET non défini : impossible de vérifier les sessions, arrêt du serveur');
  process.exit(1);
}

const allowedOrigins = readList('CORS_ORIGIN');
if (!allowedOrigins.length) {
  console.warn('CORS_ORIGIN non défini : toutes les origines sont autorisées');
}

const app = express();
const wsService = new WebSocketService({ allowedOrigins });

// Middleware
// credentials: true pour que le navigateur envoie le cookie de session NextAuth
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/sheets', sheetRoutes);

// Start servers
const PORT = Number(process.env.PORT) || 3001;
const WS_PORT = Number(process.env.WS_PORT) || 8080;

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

wsService.start(WS_PORT);
