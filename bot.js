const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const yts = require('yt-search');
const fs = require('fs');

const CONFIG = {
    PREFIX: '.',
    BOT_NAME: 'LANEZ - Runner SLENZ',
    OWNER_NUMBER: '233xxxxxxxx',
    AUTO_STATUS_SEEN: true,
    AUTO_REACT: false,
    REJECT_CALLS: true,
    REJECT_MSG: '*📞 Calls are prohibited on LANEZ Bot.*'
};

// MULTI-CATEGORY COMMAND REGISTRY
const COMMANDS = [
    // --- 1. SYSTEM & INFORMATION ---
    { name: 'ping', cat: 'SYSTEM', desc: 'Latency test', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🏓 LANEZ OS: Active & Operational' }) },
    { name: 'sysinfo', cat: 'SYSTEM', desc: 'System stats', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🖥️ Platform: Node.js\n📦 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB` }) },
    { name: 'owner', cat: 'SYSTEM', desc: 'Owner contact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `👑 Lanez Owner: ${CONFIG.OWNER_NUMBER}` }) },

    // --- 2. MEDIA & TOOLS ---
    { name: 'play', cat: 'MEDIA', desc: 'Search music', exec: async ({ sock, from, args }) => {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(from, { text: '⚠️ Provide a song name.' });
        const r = await yts(query);
        const v = r.videos[0];
        if (!v) return sock.sendMessage(from, { text: '❌ Media not found.' });
        sock.sendMessage(from, { image: { url: v.thumbnail }, caption: `🎵 *${v.title}*\n⏱️ ${v.timestamp}\n🔗 ${v.url}` });
    }},
    { name: 'vv', cat: 'MEDIA', desc: 'Unlock View Once', exec: async ({ sock, from, msg }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
        if (!viewOnce) return sock.sendMessage(from, { text: '⚠️ Reply to View Once media.' });
        const type = Object.keys(viewOnce)[0];
        const stream = await downloadContentFromMessage(viewOnce[type], type.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        sock.sendMessage(from, { [type === 'imageMessage' ? 'image' : 'video']: buffer, caption: '🔓 LANEZ View-Once Unlocked' });
    }},

    // --- 3. GROUP ADMINISTRATION ---
    { name: 'kick', cat: 'GROUP', group: true, exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention a user.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove');
        sock.sendMessage(from, { text: '✅ Member removed.' });
    }},
    { name: 'promote', cat: 'GROUP', group: true, exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention a user.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'promote');
        sock.sendMessage(from, { text: '✅ User promoted to admin.' });
    }},
    { name: 'demote', cat: 'GROUP', group: true, exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention an admin.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'demote');
        sock.sendMessage(from, { text: '✅ Admin demoted.' });
    }},
    { name: 'hidetag', cat: 'GROUP', group: true, exec: async ({ sock, from, args, participants }) => {
        sock.sendMessage(from, { text: args.join(' ') || 'Attention!', mentions: participants.map(p => p.id) });
    }},
    { name: 'link', cat: 'GROUP', group: true, exec: async ({ sock, from }) => {
        const code = await sock.groupInviteCode(from);
        sock.sendMessage(from, { text: `🔗 Group Link: https://chat.whatsapp.com/${code}` });
    }},

    // --- 4. FUN & ENTERTAINMENT ---
    { name: 'joke', cat: 'FUN', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '😂 Why do programmers prefer dark mode? Because light attracts bugs!' }) },
    { name: 'roll', cat: 'FUN', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🎲 Rolled: ${Math.floor(Math.random() * 6) + 1}` }) },
    { name: 'fact', cat: 'FUN', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '💡 Fact: Honey never spoils. 3,000-year-old honey found in Egyptian tombs is still edible.' }) }
];

// DYNAMIC MENU BUILDER
function generateMenu() {
    let menu = `⚡ *${CONFIG.BOT_NAME}* ⚡\nTotal Cmds: ${COMMANDS.length}+\n\n`;
    const cats = [...new Set(COMMANDS.map(c => c.cat))];
    cats.forEach(c => {
        menu += `┌─── 📌 *${c}*\n`;
        COMMANDS.filter(cmd => cmd.cat === c).forEach(cmd => {
            menu += `│ ➣ ${CONFIG.PREFIX}${cmd.name} - ${cmd.desc}\n`;
        });
        menu += `└───\n\n`;
    });
    return menu;
}

// MAIN BOT ENGINE
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
            if (socket) socket.emit('status', 'Generating Pairing Code...');
            try {
                await new Promise(res => setTimeout(res, 3000));
                const code = await sock.requestPairingCode(cleanPhone);
                if (socket) {
                    socket.emit('pairing_code', code);
                    socket.emit('status', 'Pairing Code Active!');
                }
            } catch (err) {
                codeRequested = false;
                if (socket) socket.emit('status', 'Code Request Failed.');
            }
        }

        if (connection === 'open') {
            if (socket) socket.emit('status', 'Online & Active');
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut && fs.existsSync(authFolder)) {
                fs.rmSync(authFolder, { recursive: true, force: true });
            }
            if (statusCode !== DisconnectReason.loggedOut) startBot(phone, io, socket);
        }
    });

    sock.ev.on('call', async (calls) => {
        if (!CONFIG.REJECT_CALLS) return;
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: CONFIG.REJECT_MSG });
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;
            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');

            if (from === 'status@broadcast' && CONFIG.AUTO_STATUS_SEEN) {
                await sock.readMessages([msg.key]);
                return;
            }

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            if (!text.startsWith(CONFIG.PREFIX)) return;

            const args = text.slice(CONFIG.PREFIX.length).split(/ +/);
            const cmdName = args.shift().toLowerCase();

            if (cmdName === 'menu' || cmdName === 'help') {
                return await sock.sendMessage(from, { text: generateMenu() });
            }

            const cmd = COMMANDS.find(c => c.name === cmdName);
            if (!cmd) return;

            if (cmd.group && !isGroup) {
                return await sock.sendMessage(from, { text: '⚠️ This command is restricted to Group chats.' });
            }

            let participants = [];
            if (isGroup) {
                const meta = await sock.groupMetadata(from);
                participants = meta.participants;
            }

            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await cmd.exec({ sock, from, msg, args, isGroup, participants, mentioned });

        } catch (err) {
            console.error('Command Error:', err);
        }
    });

    return sock;
}

module.exports = { startBot };
                                        
