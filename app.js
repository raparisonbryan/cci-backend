require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const sheetRoutes = require('./routes/sheet.js');
const WebSocketService  = require('./services/websocketService');

const app = express();
const wsService = new WebSocketService();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean);
if (!allowedOrigins?.length) {
  console.warn('CORS_ORIGIN non défini : toutes les origines sont autorisées');
}
app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : undefined));
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
