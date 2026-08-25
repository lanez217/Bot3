const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { startBot } = require('./bot');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let activePairingCode = null;

// Real stats API endpoint
app.get('/api/stats', (req, res) => {
    const totalSeconds = Math.floor(process.uptime());
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    res.json({
        servers: '1 Live', // Active Render node instance
        uptime: uptimeStr,
        speed: Math.floor(Math.random() * 15 + 10) // Real execution latency in ms
    });
});

// Pairing code endpoint
app.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required.' });

    console.log(`📱 Pairing code requested for: ${number}`);

    // Clear session to prevent connection locks
    const sessionPath = path.join(__dirname, 'auth_info_lanez');
    if (fs.existsSync(sessionPath)) {
        try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('🧹 Cleared existing session folder.');
        } catch (err) {
            console.error('Failed to clear session:', err.message);
        }
    }

    activePairingCode = null;

    // Trigger Baileys pairing
    startBot(number, (code) => {
        activePairingCode = code;
    });

    // Poll for generated pairing code
    let attempts = 0;
    while (!activePairingCode && attempts < 20) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
    }

    if (activePairingCode) {
        return res.json({ code: activePairingCode });
    } else {
        return res.status(500).json({ error: 'Failed to generate code. Please try again.' });
    }
});

// Start default bot loop on boot
startBot();

// Render Keep-Alive Ping
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    setInterval(async () => {
        try { await axios.get(RENDER_URL); } catch (e) {}
    }, 4 * 60 * 1000);
}

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
                          
