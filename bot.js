const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const COMMANDS = require('./commands');

const startTime = Date.now();

async function startBot(io = null, phoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        keepAliveIntervalMs: 30000, // Fixes 1-minute timeout/silent drop
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    if (phoneNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(cleanNum);
                console.log(`🔑 Pairing Code generated: ${code}`);
                if (io) io.emit('pairing_code', code);
            } catch (err) {
                console.error('Error generating pairing code:', err);
                if (io) io.emit('pairing_error', 'Failed to generate code.');
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp Bot Connected & Listening!');
            if (io) io.emit('status', 'Connected');
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);
            if (io) io.emit('status', 'Disconnected');
            if (shouldReconnect) startBot(io, null);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;

            // Extract body text across all message types
            const body = (
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                ''
            ).trim();

            // Antilink logic enforcement for group chats
            if (from.endsWith('@g.us') && body.includes('chat.whatsapp.com')) {
                const config = require('./commands').config;
                if (config.antilink[from]) {
                    const sender = msg.key.participant;
                    console.log(`🛡️ Antilink triggered for ${sender}`);
                    await sock.sendMessage(from, { delete: msg.key });
                    await sock.groupParticipantsUpdate(from, [sender], 'remove');
                    return;
                }
            }

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();

            const command = COMMANDS.commands.find(c => c.name === cmdName || (c.aliases && c.aliases.includes(cmdName)));
            if (!command) return;

            console.log(`🚀 Executing command: .${cmdName}`);

            const sender = msg.key.participant || msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');

            await command.exec({ 
                sock, 
                from, 
                args, 
                msg, 
                sender, 
                isGroup, 
                startTime, 
                downloadMediaMessage 
            });

        } catch (err) {
            console.error('❌ Error handling message:', err);
        }
    });
}

module.exports = { startBot };
