const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const https = require('https');

// IMPORT COMMANDS REGISTRY
const COMMANDS = require('./commands');

const CONFIG = {
    PREFIX: '.',
    BOT_NAME: 'LANEZ OS Pro',
    OWNER_NUMBER: '233597789459',
    RENDER_URL: 'https://your-app-name.onrender.com', // Replace with your exact Render URL
    AUTO_STATUS_SEEN: true,
    REJECT_CALLS: true,
    REJECT_MSG: '*📞 Calls are prohibited on LANEZ Bot.*'
};

// PREVENT RENDER FROM SLEEPING (KEEP-ALIVE)
function startKeepAlive() {
    setInterval(() => {
        if (CONFIG.RENDER_URL && CONFIG.RENDER_URL.startsWith('http')) {
            https.get(CONFIG.RENDER_URL, (res) => {
                console.log(`[KEEP-ALIVE] Ping status: ${res.statusCode}`);
            }).on('error', (err) => {
                console.error('[KEEP-ALIVE] Ping failed:', err.message);
            });
        }
    }, 10 * 60 * 1000); // Pings every 10 minutes
}

// DYNAMIC MENU BUILDER
function generateMenu() {
    let menu = `⚡ *${CONFIG.BOT_NAME}* ⚡\n`;
    menu += `👑 *Owner:* +${CONFIG.OWNER_NUMBER}\n`;
    menu += `📌 *Prefix:* [ ${CONFIG.PREFIX} ]\n`;
    menu += `📊 *Commands Loaded:* ${COMMANDS.length}\n\n`;

    const categories = [...new Set(COMMANDS.map(c => c.cat || 'GENERAL'))];

    categories.forEach(cat => {
        menu += `┌─── 🚀 *${cat}*\n`;
        const categoryCmds = COMMANDS.filter(c => (c.cat || 'GENERAL') === cat);
        categoryCmds.forEach(cmd => {
            menu += `│ ➣ ${CONFIG.PREFIX}${cmd.name} ${cmd.ownerOnly ? '👑' : ''}- ${cmd.desc || ''}\n`;
        });
        menu += `└───\n\n`;
    });

    return menu;
}

// MAIN BOT ENGINE
async function startBot(phone, io, socket) {
    const authFolder = 'auth_info_lanez';
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000
    });

    sock.ev.on('creds.update', saveCreds);
    startKeepAlive();

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    let codeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && socket) socket.emit('qr', qr);

        if (!sock.authState.creds.registered && cleanPhone && !codeRequested && (qr || connection === 'connecting')) {
            codeRequested = true;
            if (socket) socket.emit('status', 'Generating Pairing Code...');

            try {
                await new Promise(res => setTimeout(res, 3000));
                const code = await sock.requestPairingCode(cleanPhone);

                if (socket) {
                    socket.emit('pairing_code', code);
                    socket.emit('status', 'Pairing Code Active!');
                }
            } catch (err) {
                console.error('Pairing Error:', err);
                codeRequested = false;
                if (socket) socket.emit('status', 'Failed to generate pairing code.');
            }
        }

        if (connection === 'open') {
            console.log('✅ LANEZ BOT ONLINE');
            if (socket) {
                socket.emit('connected');
                socket.emit('status', 'LANEZ OS Pro Online');
            }
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (socket) socket.emit('status', 'Disconnected');

            if (statusCode === DisconnectReason.loggedOut) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
            }
            if (statusCode !== DisconnectReason.loggedOut) startBot(phone, io, socket);
        }
    });

    // AUTO REJECT CALLS
    sock.ev.on('call', async (calls) => {
        if (!CONFIG.REJECT_CALLS) return;
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: CONFIG.REJECT_MSG });
            }
        }
    });

    // MESSAGE ROUTER & EXECUTOR
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = msg.key.participant || msg.key.remoteJid;

            // Auto Status View
            if (from === 'status@broadcast' && CONFIG.AUTO_STATUS_SEEN) {
                await sock.readMessages([msg.key]);
                return;
            }

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            if (!text.startsWith(CONFIG.PREFIX)) return;

            const args = text.slice(CONFIG.PREFIX.length).split(/ +/);
            const cmdName = args.shift().toLowerCase();

            // Menu Display
            if (cmdName === 'menu' || cmdName === 'help') {
                return await sock.sendMessage(from, { text: generateMenu() });
            }

            // Find matching command from commands.js
            const cmd = COMMANDS.find(c => c.name === cmdName);
            if (!cmd) return;

            // Owner Only Verification
            if (cmd.ownerOnly && !sender.includes(CONFIG.OWNER_NUMBER)) {
                return await sock.sendMessage(from, { text: '❌ This command is restricted to the Bot Owner.' });
            }

            // Group Enforcement
            if (cmd.group && !isGroup) {
                return await sock.sendMessage(from, { text: '⚠️ This command can only be used in group chats.' });
            }

            let participants = [];
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(from);
                participants = groupMetadata.participants;
            }

            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // Run execution logic
            await cmd.exec({ sock, from, msg, args, isGroup, sender, participants, mentioned });

        } catch (err) {
            console.error('Execution Error:', err);
        }
    });

    return sock;
}

module.exports = { startBot };
