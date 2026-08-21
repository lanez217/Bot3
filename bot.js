const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const COMMANDS = require('./commands');

async function startBot(io, phoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Cleaned up deprecated warning
    });

    sock.ev.on('creds.update', saveCreds);

    // Request Pairing Code if user provided a phone number and isn't registered yet
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
        }, 3000); // Wait 3 seconds for socket connection to initialize
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && io && !phoneNumber) {
            io.emit('qr', qr);
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp Bot Connected Successfully!');
            if (io) io.emit('status', 'Connected');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
            if (io) io.emit('status', 'Disconnected');
            if (shouldReconnect) startBot(io);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const prefix = '.';

        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = COMMANDS.find(c => c.name === cmdName);

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
            await command.exec({ sock, from, args, msg, sender, isGroup, participants, mentioned });
        } catch (err) {
            console.error(`Error executing command .${cmdName}:`, err);
            sock.sendMessage(from, { text: `❌ Error executing command: ${err.message}` });
        }
    });
}

module.exports = { startBot };
            
