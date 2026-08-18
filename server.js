require('dotenv').config?.();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('User opened Runner SLENZ Panel');

    socket.on('connect_bot', async ({ phone }) => {
        socket.emit('status', 'Initializing Runner SLENZ engine...');
        try {
            await startBot(phone, io, socket);
        } catch (err) {
            console.error('Server error:', err);
            socket.emit('status', 'Connection failed. Please retry.');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`⚡ Runner SLENZ Panel running on port ${PORT}`));
