const express = require('express');
const cors = require('cors');
const sheetRoutes = require('./routes/sheet.js');
const WebSocketService  = require('./services/websocketService');

const app = express();
const wsService = new WebSocketService();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sheets', sheetRoutes);

// Start servers
const PORT = 3001;
const WS_PORT = 8080;

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

wsService.start(Number(WS_PORT));