const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('💻 Web Client Connected');

    socket.on('get_pairing_code', (phone) => {
        console.log(`📲 Requesting pairing code for: ${phone}`);
        startBot(io, phone);
    });
});

// Start bot engine on server boot
startBot(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 LANEZ OS Server running on port ${PORT}`);
});
