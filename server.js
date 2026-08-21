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

io.on('connection', (socket) => {
    console.log(`⚡ Dashboard Connected: ${socket.id}`);

    // Receive pairing request from web dashboard
    socket.on('get_pairing_code', async (phoneNumber) => {
        try {
            console.log(`📲 Requesting pairing code for: ${phoneNumber}`);
            await startBot(io, phoneNumber);
        } catch (err) {
            console.error('Pairing Code Startup Error:', err);
            socket.emit('pairing_error', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Dashboard Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, async () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    try {
        await startBot(io);
    } catch (err) {
        console.error('Bot Startup Error:', err);
    }
});
        
