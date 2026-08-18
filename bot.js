const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const yts = require('yt-search');
const fs = require('fs');

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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && socket) socket.emit('qr', qr);

        if (!sock.authState.creds.registered && cleanPhone && !codeRequested && (qr || connection === 'connecting')) {
            codeRequested = true;
            if (socket) socket.emit('status', 'Requesting Runner SLENZ pairing code...');

            try {
                await new Promise(res => setTimeout(res, 3000));
                const code = await sock.requestPairingCode(cleanPhone);
                
                console.log('\n========================================');
                console.log(`⚡ RUNNER SLENZ PAIRING CODE: ${code}`);
                console.log('========================================\n');

                if (socket) {
                    socket.emit('pairing_code', code);
                    socket.emit('status', 'Pairing Code Generated Successfully!');
                }
            } catch (err) {
                console.error('Pairing Code Error:', err);
                codeRequested = false;
                if (socket) socket.emit('status', 'Failed to generate code. Tap Connect again.');
            }
        }

        if (connection === 'open') {
            console.log('✅ RUNNER SLENZ BOT CONNECTED TO WHATSAPP!');
            if (socket) {
                socket.emit('connected');
                socket.emit('status', 'Runner SLENZ is Online!');
            }
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (socket) socket.emit('disconnected');

            if (statusCode === DisconnectReason.loggedOut) {
                if (fs.existsSync(authFolder)) {
                    fs.rmSync(authFolder, { recursive: true, force: true });
                }
            }

            if (shouldReconnect) {
                startBot(phone, io, socket);
            }
        }
    });

    // --- COMMANDS ---
    const commands = {
        ping: async (s, f) => await s.sendMessage(f, { text: '🏓 *Pong!* Runner SLENZ Bot is running fast.' }),
        status: async (s, f) => await s.sendMessage(f, { text: '🟢 *Runner SLENZ Status:* Active & Online' }),
        uptime: async (s, f) => await s.sendMessage(f, { text: `⏱️ *Uptime:* ${Math.floor(process.uptime())}s` }),
        owner: async (s, f) => await s.sendMessage(f, { text: '👑 *Bot Owner:* Lanez' }),

        vv: async (s, f, msg) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnceMedia = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;

            if (!viewOnceMedia) return await s.sendMessage(f, { text: '⚠️ Reply to a View Once media with `.vv`' });

            const mediaType = Object.keys(viewOnceMedia)[0];
            const stream = await downloadContentFromMessage(viewOnceMedia[mediaType], mediaType.replace('Message', ''));

            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (mediaType === 'imageMessage') {
                await s.sendMessage(f, { image: buffer, caption: '🔓 *View-Once Unlocked by Runner SLENZ*' });
            } else if (mediaType === 'videoMessage') {
                await s.sendMessage(f, { video: buffer, caption: '🔓 *View-Once Unlocked by Runner SLENZ*' });
            }
        },

        play: async (s, f, msg, args) => {
            const query = args.join(' ');
            if (!query) return await s.sendMessage(f, { text: '⚠️ Provide a song name! Example: `.play song name`' });

            await s.sendMessage(f, { text: `🔍 *Runner SLENZ Searching:* "${query}"...` });
            const r = await yts(query);
            const video = r.videos[0];

            if (!video) return await s.sendMessage(f, { text: '❌ No results found.' });
            await s.sendMessage(f, { image: { url: video.thumbnail }, caption: `🎵 *${video.title}*\n⏱️ ${video.timestamp}\n🔗 ${video.url}` });
        }
    };

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();

            if (!text.startsWith('.')) return;

            const args = text.slice(1).split(/ +/);
            const cmd = args.shift().toLowerCase();

            if (cmd === 'menu' || cmd === 'help') {
                const menuText = 
`⚡ *RUNNER SLENZ BOT* ⚡
👑 *Owner:* Lanez

┌─── 🛠️ *COMMANDS*
│ ➣ .ping
│ ➣ .status
│ ➣ .uptime
│ ➣ .owner
│ ➣ .vv (Reply to View Once)
│ ➣ .play <song name>
└───`;
                return await sock.sendMessage(from, { text: menuText });
            }

            if (commands[cmd]) await commands[cmd](sock, from, msg, args);
        } catch (err) {
            console.error('Command Error:', err);
        }
    });

    return sock;
}

module.exports = { startBot };