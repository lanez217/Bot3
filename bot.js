const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const yts = require('yt-search');
const fs = require('fs');

const CONFIG = {
    PREFIX: '.',
    BOT_NAME: 'Runner SLENZ',
    OWNER_NUMBER: '233xxxxxxxx',
    AUTO_STATUS_SEEN: true,
    AUTO_REACT: false,
    REJECT_CALLS: true,
    REJECT_MSG: '*📞 Calls are not allowed on this bot number.*'
};

// ==========================================
// 1. COMMAND REGISTRY (STRUCTURED DESIGN)
// ==========================================
const COMMANDS = [
    // GENERAL / INFO
    {
        name: 'ping',
        category: '📌 GENERAL',
        desc: 'Check bot latency',
        groupOnly: false,
        exec: async ({ sock, from }) => {
            await sock.sendMessage(from, { text: '🏓 Pong! Bot is active.' });
        }
    },
    {
        name: 'runtime',
        category: '📌 GENERAL',
        desc: 'Check server uptime',
        groupOnly: false,
        exec: async ({ sock, from }) => {
            const uptime = Math.floor(process.uptime());
            await sock.sendMessage(from, { text: `⏱️ Active Uptime: ${uptime} seconds` });
        }
    },
    {
        name: 'owner',
        category: '📌 GENERAL',
        desc: 'Get owner contact info',
        groupOnly: false,
        exec: async ({ sock, from }) => {
            await sock.sendMessage(from, { text: `👑 Owner Contact: ${CONFIG.OWNER_NUMBER}` });
        }
    },

    // MEDIA & TOOLS
    {
        name: 'play',
        category: '🎵 MEDIA & TOOLS',
        desc: 'Search YouTube for audio/video info',
        groupOnly: false,
        exec: async ({ sock, from, args }) => {
            const query = args.join(' ');
            if (!query) return await sock.sendMessage(from, { text: '⚠️ Please provide a search term.' });
            const r = await yts(query);
            const video = r.videos[0];
            if (!video) return await sock.sendMessage(from, { text: '❌ No results found.' });
            
            const caption = `🎵 *${video.title}*\n⏱️ Duration: ${video.timestamp}\n🔗 Link: ${video.url}`;
            await sock.sendMessage(from, { image: { url: video.thumbnail }, caption });
        }
    },
    {
        name: 'vv',
        category: '🎵 MEDIA & TOOLS',
        desc: 'Unlock View-Once images/videos',
        groupOnly: false,
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
            if (!viewOnce) return await sock.sendMessage(from, { text: '⚠️ Reply to a View-Once message.' });

            const type = Object.keys(viewOnce)[0];
            const stream = await downloadContentFromMessage(viewOnce[type], type.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (type === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption: '🔓 View Once Unlocked' });
            if (type === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption: '🔓 View Once Unlocked' });
        }
    },

    // GROUP ADMIN
    {
        name: 'kick',
        category: '👑 GROUP ADMIN',
        desc: 'Remove user from group',
        groupOnly: true,
        exec: async ({ sock, from, mentioned }) => {
            if (!mentioned[0]) return await sock.sendMessage(from, { text: '⚠️ Mention a user to kick.' });
            await sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove');
            await sock.sendMessage(from, { text: '✅ Member removed successfully.' });
        }
    },
    {
        name: 'promote',
        category: '👑 GROUP ADMIN',
        desc: 'Promote user to admin',
        groupOnly: true,
        exec: async ({ sock, from, mentioned }) => {
            if (!mentioned[0]) return await sock.sendMessage(from, { text: '⚠️ Mention a user to promote.' });
            await sock.groupParticipantsUpdate(from, [mentioned[0]], 'promote');
            await sock.sendMessage(from, { text: '✅ Member promoted to admin.' });
        }
    },
    {
        name: 'demote',
        category: '👑 GROUP ADMIN',
        desc: 'Demote admin to member',
        groupOnly: true,
        exec: async ({ sock, from, mentioned }) => {
            if (!mentioned[0]) return await sock.sendMessage(from, { text: '⚠️ Mention an admin to demote.' });
            await sock.groupParticipantsUpdate(from, [mentioned[0]], 'demote');
            await sock.sendMessage(from, { text: '✅ Admin demoted.' });
        }
    },
    {
        name: 'hidetag',
        category: '👑 GROUP ADMIN',
        desc: 'Tag all group participants',
        groupOnly: true,
        exec: async ({ sock, from, args, participants }) => {
            const tagText = args.join(' ') || 'Attention everyone!';
            const jids = participants.map(p => p.id);
            await sock.sendMessage(from, { text: tagText, mentions: jids });
        }
    },
    {
        name: 'link',
        category: '👑 GROUP ADMIN',
        desc: 'Get group invite link',
        groupOnly: true,
        exec: async ({ sock, from }) => {
            const code = await sock.groupInviteCode(from);
            await sock.sendMessage(from, { text: `🔗 Group Link: https://chat.whatsapp.com/${code}` });
        }
    },

    // FUN & GAMES
    {
        name: 'joke',
        category: '🎮 FUN & GAMES',
        desc: 'Get a random joke',
        groupOnly: false,
        exec: async ({ sock, from }) => {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "What do you call a fake noodle? An impasta!",
                "Why did the computer go to the doctor? Because it had a virus!"
            ];
            const random = jokes[Math.floor(Math.random() * jokes.length)];
            await sock.sendMessage(from, { text: `😂 ${random}` });
        }
    },
    {
        name: 'roll',
        category: '🎮 FUN & GAMES',
        desc: 'Roll a 6-sided dice',
        groupOnly: false,
        exec: async ({ sock, from }) => {
            const roll = Math.floor(Math.random() * 6) + 1;
            await sock.sendMessage(from, { text: `🎲 You rolled a ${roll}!` });
        }
    }
];

// ==========================================
// 2. DYNAMIC MENU GENERATOR
// ==========================================
function buildMenu() {
    let menuText = `⚡ *${CONFIG.BOT_NAME} DASHBOARD* ⚡\n`;
    menuText += `Prefix: [ ${CONFIG.PREFIX} ]\n\n`;

    const categories = [...new Set(COMMANDS.map(c => c.category))];

    categories.forEach(cat => {
        menuText += `┌─── ${cat}\n`;
        const catCmds = COMMANDS.filter(c => c.category === cat);
        catCmds.forEach(cmd => {
            menuText += `│ ➣ ${CONFIG.PREFIX}${cmd.name} - ${cmd.desc}\n`;
        });
        menuText += `└───\n\n`;
    });

    menuText += `_Type ${CONFIG.PREFIX}<command> to run._`;
    return menuText;
}

// ==========================================
// 3. MAIN BOT ENGINE
// ==========================================
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

    // Connection Manager
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

    // Auto Call Rejection
    sock.ev.on('call', async (calls) => {
        if (!CONFIG.REJECT_CALLS) return;
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: CONFIG.REJECT_MSG });
            }
        }
    });

    // Message Router & Executor
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');

            // Auto Status Read
            if (from === 'status@broadcast' && CONFIG.AUTO_STATUS_SEEN) {
                await sock.readMessages([msg.key]);
                return;
            }

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            if (!text.startsWith(CONFIG.PREFIX)) return;

            const args = text.slice(CONFIG.PREFIX.length).split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Handle Menu Request
            if (commandName === 'menu' || commandName === 'help') {
                return await sock.sendMessage(from, { text: buildMenu() });
            }

            // Find Command in Registry
            const targetCmd = COMMANDS.find(c => c.name === commandName);
            if (!targetCmd) return;

            // Group Enforcement Check
            if (targetCmd.groupOnly && !isGroup) {
                return await sock.sendMessage(from, { text: '⚠️ This command can only be used in group chats.' });
            }

            // Gather Context Variables
            let participants = [];
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(from);
                participants = groupMetadata.participants;
            }

            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // Execute Registered Command Logic
            await targetCmd.exec({ sock, from, msg, args, isGroup, participants, mentioned });

        } catch (err) {
            console.error('Command Execution Error:', err);
        }
    });

    return sock;
}

module.exports = { startBot };
                                                             
