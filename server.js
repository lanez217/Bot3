const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Store active bot session instances
const activeSessions = new Map();

io.on('connection', (socket) => {
    console.log('⚡ Dashboard Connected:', socket.id);

    // Send current active sessions immediately on connection
    const currentSessions = Array.from(activeSessions.keys()).map(phone => ({ phone }));
    socket.emit('sessions_update', currentSessions);

    socket.on('start_bot', async (data) => {
        const { phone } = data;
        if (!phone) return;

        socket.emit('status', 'Initializing Engine...');

        try {
            const botInstance = await startBot(phone, io, socket);
            activeSessions.set(phone, botInstance);

            // Broadcast updated active session list to dashboard
            const updatedSessions = Array.from(activeSessions.keys()).map(p => ({ phone: p }));
            io.emit('sessions_update', updatedSessions);

        } catch (err) {
            console.error('Bot Startup Error:', err);
            socket.emit('status', 'Error launching bot');
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Dashboard Disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 LANEZ OS Pro Server running on port ${PORT}`);
});
