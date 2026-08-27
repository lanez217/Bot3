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

// Persistent Visitor Count System
const VISITORS_FILE = path.join(__dirname, 'visitors.json');

function getVisitorCount() {
    try {
        if (fs.existsSync(VISITORS_FILE)) {
            const data = fs.readFileSync(VISITORS_FILE, 'utf8');
            return JSON.parse(data).count || 0;
        }
    } catch (e) {
        console.error('Error reading visitor file:', e.message);
    }
    return 0;
}

function saveVisitorCount(count) {
    try {
        fs.writeFileSync(VISITORS_FILE, JSON.stringify({ count }), 'utf8');
    } catch (e) {
        console.error('Error saving visitor file:', e.message);
    }
}

let totalVisitors = getVisitorCount();

// Triggers ONLY ONCE per real page load/refresh
app.get('/api/visit', (req, res) => {
    totalVisitors++;
    saveVisitorCount(totalVisitors);
    res.json({ visitors: totalVisitors });
});

// Handles stats polling (node state, uptime, ping) without inflating views
app.get('/api/stats', (req, res) => {
    const totalSeconds = Math.floor(process.uptime());
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    res.json({
        servers: '1 Live',
        uptime: uptimeStr,
        speed: Math.floor(Math.random() * 15 + 10),
        visitors: totalVisitors
    });
});

// WhatsApp Bot Pairing Endpoint
app.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required.' });

    console.log(`📱 Pairing code requested for: ${number}`);

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

    startBot(number, (code) => {
        activePairingCode = code;
    });

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

startBot();

// Keep-Alive Ping for Render Hosting
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    setInterval(async () => {
        try { await axios.get(RENDER_URL); } catch (e) {}
    }, 4 * 60 * 1000);
}

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
