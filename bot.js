const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const COMMANDS = require('./commands');

const startTime = Date.now();

async function startBot(io, phoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
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
                if (io) io.emit('pairing_error', 'Failed to generate code. Try again.');
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp Bot Connected Successfully!');
            if (io) io.emit('status', 'Connected');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
            if (io) io.emit('status', 'Disconnected');
            if (shouldReconnect) startBot(io, null);
        }
    });

    // Enhanced Message & Command Handler
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;

        // Extract body text across different message types (normal, extended, caption)
        const body = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            ''
        ).trim();

        const prefix = '.';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        // Match command by name OR alias
        const command = COMMANDS.find(c => c.name === cmdName || (c.aliases && c.aliases.includes(cmdName)));

        if (!command) return;

        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        let participants = [];
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                participants = groupMetadata.participants;
            } catch (e) {}
        }

        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

        try {
            await command.exec({ sock, from, args, msg, sender, isGroup, participants, mentioned, startTime });
        } catch (err) {
            console.error(`Error executing command .${cmdName}:`, err);
            await sock.sendMessage(from, { text: `❌ Error executing command: ${err.message}` });
        }
    });
}

module.exports = { startBot };
               
