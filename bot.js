const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const yts = require('yt-search');
const fs = require('fs');

const CONFIG = {
    PREFIX: '.',
    BOT_NAME: 'Runner SLENZ',
    AUTO_STATUS_SEEN: true,
    AUTO_REACT: true,
    REJECT_CALLS: true,
    REJECT_MSG: '*📞 Calls are not allowed on this bot number.*',
    REACT_EMOJIS: ['❤️', '🔥', '👍', '😍', '😂', '💯']
};

async function startBot(phone, io, socket) {
    const authFolder = 'auth_info_runner_slenz';
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    let codeRequested = false;

    // Connection Events
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && socket) socket.emit('qr', qr);

        if (!sock.authState.creds.registered && cleanPhone && !codeRequested && (qr || connection === 'connecting')) {
            codeRequested = true;
            if (socket) socket.emit('status', 'Requesting pairing code...');

            try {
                await new Promise(res => setTimeout(res, 3000));
                const code = await sock.requestPairingCode(cleanPhone);

                if (socket) {
                    socket.emit('pairing_code', code);
                    socket.emit('status', 'Pairing Code Generated!');
                }
            } catch (err) {
                console.error('Pairing Error:', err);
                codeRequested = false;
                if (socket) socket.emit('status', 'Failed to generate code. Retry.');
            }
        }

        if (connection === 'open') {
            console.log('✅ BOT CONNECTED!');
            if (socket) {
                socket.emit('connected');
                socket.emit('status', 'Runner SLENZ is Online!');
            }
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (socket) socket.emit('disconnected');

            if (statusCode === DisconnectReason.loggedOut) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
            }
            if (statusCode !== DisconnectReason.loggedOut) startBot(phone, io, socket);
        }
    });

    // Auto Call Reject
    sock.ev.on('call', async (calls) => {
        if (!CONFIG.REJECT_CALLS) return;
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: CONFIG.REJECT_MSG });
            }
        }
    });

    // Auto Status Seen, Auto React & Commands
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;

            if (from === 'status@broadcast' && CONFIG.AUTO_STATUS_SEEN) {
                await sock.readMessages([msg.key]);
                return;
            }

            if (CONFIG.AUTO_REACT && !msg.key.fromMe && from !== 'status@broadcast') {
                const randomEmoji = CONFIG.REACT_EMOJIS[Math.floor(Math.random() * CONFIG.REACT_EMOJIS.length)];
                await sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } });
            }

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            if (!text.startsWith(CONFIG.PREFIX)) return;

            const args = text.slice(CONFIG.PREFIX.length).split(/ +/);
            const cmd = args.shift().toLowerCase();

            if (cmd === 'menu' || cmd === 'help') {
                const menu = 
`⚡ *${CONFIG.BOT_NAME}* ⚡

┌─── 🛠️ *COMMANDS*
│ ➣ .ping
│ ➣ .vv (Unlock View-Once)
│ ➣ .play <song name>
└───`;
                return await sock.sendMessage(from, { text: menu });
            }

            if (cmd === 'ping') {
                await sock.sendMessage(from, { text: '🏓 Pong!' });
            }

            if (cmd === 'vv') {
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
                if (!viewOnce) return await sock.sendMessage(from, { text: '⚠️ Reply to a View Once media.' });

                const type = Object.keys(viewOnce)[0];
                const stream = await downloadContentFromMessage(viewOnce[type], type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                if (type === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption: '🔓 View Once Unlocked' });
                if (type === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption: '🔓 View Once Unlocked' });
            }

            if (cmd === 'play') {
                const query = args.join(' ');
                if (!query) return await sock.sendMessage(from, { text: '⚠️ Enter a song name.' });
                const r = await yts(query);
                const video = r.videos[0];
                if (!video) return await sock.sendMessage(from, { text: '❌ Not found.' });
                await sock.sendMessage(from, { image: { url: video.thumbnail }, caption: `🎵 *${video.title}*\n⏱️ ${video.timestamp}\n🔗 ${video.url}` });
            }

        } catch (err) {
            console.error('Message Error:', err);
        }
    });

    return sock;
}

module.exports = { startBot };
                                                                                 
