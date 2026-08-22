const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('LANEZ OS Engine Active.');
});

io.on('connection', (socket) => {
    socket.on('get_pairing_code', async (phone) => {
        console.log(`📱 Pairing code requested for: ${phone}`);

        // Automatically delete old session folder to force a new pairing code
        const sessionPath = path.join(__dirname, 'auth_info_lanez');
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('🧹 Automatically cleared old session folder.');
            } catch (err) {
                console.error('Failed to clear old session:', err.message);
            }
        }

        startBot(io, phone);
    });
});

startBot(io);

// Keep-Alive Ping
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    setInterval(async () => {
        try {
            await axios.get(RENDER_URL);
        } catch (e) {}
    }, 4 * 60 * 1000);
}

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
