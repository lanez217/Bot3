const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, Browsers } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sock = null;

// --- PAIRING WEB PAGE ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WhatsApp Bot Pairing</title>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; padding: 24px; border-radius: 12px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                input { width: 100%; padding: 12px; margin: 12px 0; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 16px; text-align: center; }
                button { width: 100%; padding: 12px; border-radius: 6px; border: none; background: #6366f1; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; }
                #code { margin-top: 15px; font-size: 22px; font-weight: bold; color: #38bdf8; letter-spacing: 2px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>⚡ Connect Bot</h2>
                <p>Enter phone number with country code (e.g., 23359XXXXXXX)</p>
                <form action="/pair" method="POST">
                    <input type="text" name="phone" placeholder="23359XXXXXXX" required />
                    <button type="submit">Get Pairing Code</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- PAIRING CODE ROUTE ---
app.post('/pair', async (req, res) => {
    let phone = req.body.phone.replace(/[^0-9]/g, '');
    if (!phone) return res.send('Invalid phone number.');

    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome')
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode !== DisconnectReason.loggedOut) {
                    initBot();
                }
            }
        });

        // Small delay to ensure socket readiness
        await new Promise(r => setTimeout(r, 3000));
        const code = await sock.requestPairingCode(phone);

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Pairing Code</title>
                <style>
                    body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 24px; border-radius: 12px; text-align: center; }
                    .code { font-size: 32px; font-weight: bold; color: #38bdf8; letter-spacing: 4px; margin: 20px 0; background: #0f172a; padding: 10px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h3>Your WhatsApp Pairing Code:</h3>
                    <div class="code">${code}</div>
                    <p>Enter this code in WhatsApp linked devices notification.</p>
                </div>
            </body>
            </html>
        `);

        setupCommands(sock);

    } catch (err) {
        console.error(err);
        res.send('Error generating code. Please go back and try again.');
    }
});

// --- BOT INITIALIZATION AFTER LOGGED IN ---
async function initBot() {
    if (!fs.existsSync('./auth_info/creds.json')) return;

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ WhatsApp Bot Connected!');
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                initBot();
            }
        }
    });

    setupCommands(sock);
}

// --- COMMANDS ---
function setupCommands(sock) {
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();

            if (!text.startsWith('.')) return;

            const args = text.slice(1).split(/ +/);
            const cmd = args.shift().toLowerCase();

            if (cmd === 'ping') {
                await sock.sendMessage(from, { text: '🏓 *Pong!* Bot is active.' });
            } else if (cmd === 'vv') {
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const viewOnceMedia = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;

                if (!viewOnceMedia) return await sock.sendMessage(from, { text: '⚠️ Reply to a View Once message with `.vv`' });

                const mediaType = Object.keys(viewOnceMedia)[0];
                const stream = await downloadContentFromMessage(viewOnceMedia[mediaType], mediaType.replace('Message', ''));
                
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                if (mediaType === 'imageMessage') {
                    await sock.sendMessage(from, { image: buffer, caption: '🔓 *View-Once Unlocked*' });
                } else if (mediaType === 'videoMessage') {
                    await sock.sendMessage(from, { video: buffer, caption: '🔓 *View-Once Unlocked*' });
                }
            } else if (cmd === 'play') {
                const query = args.join(' ');
                if (!query) return await sock.sendMessage(from, { text: '⚠️ Provide a song name!' });

                const r = await yts(query);
                const video = r.videos[0];

                if (!video) return await sock.sendMessage(from, { text: '❌ No results found.' });
                await sock.sendMessage(from, { image: { url: video.thumbnail }, caption: `🎵 *${video.title}*\n⏱️ ${video.timestamp}\n🔗 ${video.url}` });
            }
        } catch (err) {
            console.error('Command Error:', err);
        }
    });
}

// Start existing session if available
initBot();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
