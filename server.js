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
    console.log('⚡ Web Client Connected:', socket.id);

    socket.on('start_bot', async (data) => {
        const phone = data?.phone || '';
        try {
            await startBot(phone, io, socket);
        } catch (err) {
            console.error('Error starting bot:', err);
            socket.emit('status', 'Failed to start bot instance.');
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Web Client Disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
              
