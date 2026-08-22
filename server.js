const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const axios = require('axios');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// Basic route to pass Render health checks
app.get('/', (req, res) => {
    res.send('LANEZ OS WhatsApp Engine is Active.');
});

// Socket.io event handling for pairing code web panel
io.on('connection', (socket) => {
    socket.on('get_pairing_code', (phone) => {
        console.log(`📱 Pairing code requested for: ${phone}`);
        startBot(io, phone);
    });
});

// Initialize WhatsApp connection automatically on launch
startBot(io);

// Keep-Alive Self Ping (Prevents Render Free Tier Idle Sleep)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    setInterval(async () => {
        try {
            await axios.get(RENDER_URL);
            console.log('⏰ Keep-alive ping sent to host.');
        } catch (e) {
            console.error('Ping failed:', e.message);
        }
    }, 4 * 60 * 1000); // Triggers every 4 minutes
}

// Global Process Error Catchers (Prevents process termination on minor crashes)
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 LANEZ OS Server online on port ${PORT}`);
});
        
