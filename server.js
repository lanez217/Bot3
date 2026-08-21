const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket connection for dashboard controls
io.on('connection', (socket) => {
    console.log(`⚡ Dashboard Connected: ${socket.id}`);

    socket.on('start_bot', async () => {
        try {
            console.log('🚀 Invoking startBot() via Socket request...');
            await startBot(io);
        } catch (err) {
            console.error('Bot Startup Error:', err);
            socket.emit('bot_error', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Dashboard Disconnected: ${socket.id}`);
    });
});

// Start Express server and initialize WhatsApp connection
server.listen(PORT, async () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    try {
        await startBot(io);
    } catch (err) {
        console.error('Bot Startup Error:', err);
    }
});
